"use server";

import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";

import { fail, invalid, type ActionResult } from "@/lib/action-result";
import { authorize, requireUser } from "@/lib/dal";
import { prisma } from "@/lib/db";
import { isUniqueViolation } from "@/lib/prisma-errors";
import {
  changePasswordSchema,
  companySchema,
  inviteMemberSchema,
  roleSchema,
  type ChangePasswordInput,
  type CompanyInput,
  type InviteMemberInput,
} from "@/features/settings/schemas";

const BCRYPT_ROUNDS = 12;

/** Senha temporária legível (12 caracteres, base64url). */
const generateTempPassword = () => randomBytes(9).toString("base64url");

const notSelf = (targetId: string, selfId: string) =>
  targetId === selfId ? fail("Você não pode alterar ou remover o seu próprio usuário aqui") : null;

export async function updateCompany(input: CompanyInput): Promise<ActionResult> {
  const auth = await authorize("company:manage");
  if (!auth.ok) return auth;

  const parsed = companySchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  // Tenant não é um model "escopado": o id vem exclusivamente da sessão.
  await prisma.tenant.update({ where: { id: auth.session.tenantId }, data: parsed.data });

  revalidatePath("/", "layout");
  return { ok: true };
}

/**
 * Adiciona um usuário à loja ativa. Se o e-mail ainda não existe, cria o login
 * com senha temporária; se já existe (usuário de outra loja), apenas dá acesso
 * a esta loja e ele continua usando a própria senha (`tempPassword: null`).
 */
export async function inviteMember(
  input: InviteMemberInput,
): Promise<ActionResult<{ tempPassword: string | null }>> {
  const auth = await authorize("users:manage");
  if (!auth.ok) return auth;

  const parsed = inviteMemberSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const { name, email, role } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  const tempPassword = existing ? null : generateTempPassword();

  try {
    await prisma.$transaction(async (tx) => {
      const userId =
        existing?.id ??
        (await tx.user.create({
          data: { name, email, passwordHash: await bcrypt.hash(tempPassword!, BCRYPT_ROUNDS) },
          select: { id: true },
        })).id;
      await tx.membership.create({ data: { tenantId: auth.session.tenantId, userId, role } });
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return fail("Usuário já tem acesso a esta loja", { email: ["Este usuário já faz parte desta loja"] });
    }
    throw error;
  }

  revalidatePath("/configuracoes");
  return { ok: true, data: { tempPassword } };
}

export async function updateMemberRole(userId: string, role: string): Promise<ActionResult> {
  const auth = await authorize("users:manage");
  if (!auth.ok) return auth;

  const parsedRole = roleSchema.safeParse(role);
  if (!parsedRole.success) return fail("Perfil inválido");

  const self = notSelf(userId, auth.session.userId);
  if (self) return self;

  const { count } = await auth.db.membership.updateMany({ where: { userId }, data: { role: parsedRole.data } });
  if (count === 0) return fail("Usuário não encontrado");

  revalidatePath("/configuracoes");
  return { ok: true };
}

/**
 * Gera nova senha para um membro. Como o login é compartilhado entre lojas, só é
 * permitido para usuários que pertencem exclusivamente a esta loja — senão o
 * admin de uma loja poderia assumir a conta de alguém de outra empresa.
 */
export async function resetMemberPassword(userId: string): Promise<ActionResult<{ tempPassword: string }>> {
  const auth = await authorize("users:manage");
  if (!auth.ok) return auth;

  const self = notSelf(userId, auth.session.userId);
  if (self) return self;

  const memberships = await prisma.membership.findMany({ where: { userId }, select: { tenantId: true } });
  if (!memberships.some((m) => m.tenantId === auth.session.tenantId)) return fail("Usuário não encontrado");
  if (memberships.length > 1) {
    return fail("Este usuário também acessa outras lojas. Peça que ele altere a senha em Configurações.");
  }

  const tempPassword = generateTempPassword();
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: await bcrypt.hash(tempPassword, BCRYPT_ROUNDS) },
  });

  return { ok: true, data: { tempPassword } };
}

/** Remove o acesso do usuário a esta loja (o login continua valendo para outras lojas). */
export async function removeMember(userId: string): Promise<ActionResult> {
  const auth = await authorize("users:manage");
  if (!auth.ok) return auth;

  const self = notSelf(userId, auth.session.userId);
  if (self) return self;

  const { count } = await auth.db.membership.deleteMany({ where: { userId } });
  if (count === 0) return fail("Usuário não encontrado");

  revalidatePath("/configuracoes");
  return { ok: true };
}

export async function changeOwnPassword(input: ChangePasswordInput): Promise<ActionResult> {
  const user = await requireUser();

  const parsed = changePasswordSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  const current = await prisma.user.findUnique({ where: { id: user.userId }, select: { passwordHash: true } });
  if (!current || !(await bcrypt.compare(parsed.data.currentPassword, current.passwordHash))) {
    return fail("Senha atual incorreta", { currentPassword: ["Senha atual incorreta"] });
  }

  await prisma.user.update({
    where: { id: user.userId },
    data: { passwordHash: await bcrypt.hash(parsed.data.newPassword, BCRYPT_ROUNDS) },
  });

  return { ok: true };
}

