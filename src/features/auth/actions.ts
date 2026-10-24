"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";

import { signIn, signOut } from "@/auth";
import { prisma } from "@/lib/db";
import { fail, invalid, type ActionResult } from "@/lib/action-result";
import { isUniqueViolation } from "@/lib/prisma-errors";
import {
  loginSchema,
  signUpSchema,
  type LoginInput,
  type SignUpInput,
} from "@/features/auth/schemas";

export async function loginAction(input: LoginInput): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Dados inválidos" };

  try {
    await signIn("credentials", { ...parsed.data, redirectTo: "/dashboard" });
    return { ok: true };
  } catch (error) {
    if (error instanceof AuthError) {
      return { ok: false, error: "E-mail ou senha inválidos" };
    }
    throw error;
  }
}

export async function signUpAction(input: SignUpInput): Promise<ActionResult> {
  const parsed = signUpSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  const { companyName, name, email, password } = parsed.data;
  const emailTaken = () => fail("E-mail já cadastrado", { email: ["E-mail já cadastrado"] });

  const exists = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (exists) return emailTaken();

  const passwordHash = await bcrypt.hash(password, 12);

  try {
    await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({ data: { name: companyName } });
      const user = await tx.user.create({ data: { name, email, passwordHash } });
      await tx.membership.create({ data: { tenantId: tenant.id, userId: user.id, role: "ADMIN" } });
      await tx.stockLocation.create({
        data: { tenantId: tenant.id, name: "Depósito principal" },
      });
    });
  } catch (error) {
    // Dois cadastros simultâneos com o mesmo e-mail: a checagem acima passa nos dois,
    // mas o índice único do banco recusa o segundo.
    if (isUniqueViolation(error)) return emailTaken();
    throw error;
  }

  await signIn("credentials", { email, password, redirectTo: "/dashboard" });
  return { ok: true };
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}
