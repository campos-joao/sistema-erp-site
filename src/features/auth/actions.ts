"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { z } from "zod";

import { signIn, signOut } from "@/auth";
import { prisma } from "@/lib/db";
import { type ActionResult } from "@/lib/action-result";
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
  if (!parsed.success) {
    return { ok: false, error: "Dados inválidos", fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  const { companyName, name, email, password } = parsed.data;

  const exists = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (exists) {
    return { ok: false, error: "E-mail já cadastrado", fieldErrors: { email: ["E-mail já cadastrado"] } };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.$transaction(async (tx) => {
    const tenant = await tx.tenant.create({ data: { name: companyName } });
    await tx.user.create({
      data: { tenantId: tenant.id, name, email, passwordHash, role: "ADMIN" },
    });
    await tx.stockLocation.create({
      data: { tenantId: tenant.id, name: "Depósito principal" },
    });
  });

  await signIn("credentials", { email, password, redirectTo: "/dashboard" });
  return { ok: true };
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}
