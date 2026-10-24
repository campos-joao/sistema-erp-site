import type { NextAuthConfig } from "next-auth";

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
      if (user) token.id = user.id as string;
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      return session;
    },
  },
} satisfies NextAuthConfig;
