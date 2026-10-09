import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("Informe um e-mail válido").trim().toLowerCase(),
  password: z.string().min(1, "Informe a senha"),
});

export const signUpSchema = z.object({
  companyName: z.string().trim().min(2, "Informe o nome da empresa").max(120),
  name: z.string().trim().min(2, "Informe seu nome").max(120),
  email: z.email("Informe um e-mail válido").trim().toLowerCase(),
  password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres").max(72),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
