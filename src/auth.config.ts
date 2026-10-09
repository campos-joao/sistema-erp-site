import type { NextAuthConfig } from "next-auth";

import type { Role } from "@/generated/prisma/enums";

const PUBLIC_ROUTES = ["/login", "/cadastro"];

/**
 * Configuração sem dependências de banco, usada também pelo `proxy.ts`.
 * Os providers que acessam o banco ficam em `auth.ts`.
 */
export const authConfig = {
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isPublic = PUBLIC_ROUTES.some((route) => nextUrl.pathname.startsWith(route));

      if (isPublic) {
        return isLoggedIn ? Response.redirect(new URL("/dashboard", nextUrl)) : true;
      }
      return isLoggedIn;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.tenantId = user.tenantId;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      session.user.tenantId = token.tenantId as string;
      session.user.role = token.role as Role;
      return session;
    },
  },
} satisfies NextAuthConfig;
