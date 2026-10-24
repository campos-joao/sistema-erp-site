import { z } from "zod";

import { isValidDocument, normalizeDocument } from "@/lib/document";

export const companySchema = z.object({
  name: z.string().trim().min(2, "Informe o nome da empresa").max(120),
  document: z
    .string()
    .trim()
    .transform(normalizeDocument)
    .refine((value) => value === "" || isValidDocument(value), "CNPJ ou CPF inválido")
    .transform((value) => (value === "" ? null : value)),
});

export type CompanyInput = z.input<typeof companySchema>;
export type CompanyData = z.output<typeof companySchema>;

export const roleSchema = z.enum(["ADMIN", "MEMBER"], "Selecione o perfil");

export const inviteMemberSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome").max(120),
  email: z.email("Informe um e-mail válido").trim().toLowerCase(),
  role: roleSchema,
});

export type InviteMemberInput = z.input<typeof inviteMemberSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Informe a senha atual"),
    newPassword: z.string().min(8, "A senha deve ter pelo menos 8 caracteres").max(72),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "As senhas não conferem",
    path: ["confirmPassword"],
  });

export type ChangePasswordInput = z.input<typeof changePasswordSchema>;
