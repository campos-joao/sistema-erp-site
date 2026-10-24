import type { DefaultSession } from "next-auth";

// O JWT guarda apenas a identidade do usuário. Loja ativa e perfil são
// resolvidos no servidor a cada requisição (ver `src/lib/dal.ts`).
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
  }
}
