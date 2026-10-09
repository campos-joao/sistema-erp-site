<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Projeto: ERP SaaS multi-tenant

- Idioma de comunicação com o usuário: português (pt-BR). UI também em pt-BR.
- Stack: Next.js 16 (App Router, `src/`), TypeScript, Tailwind v4, Shadcn UI (estilo `radix-nova`), Prisma 7 (`prisma-client` + `@prisma/adapter-pg`), Auth.js v5 (Credentials, sessão JWT), Zod 4, react-hook-form.
- Gerenciador de pacotes: npm. Prisma fixado em 7.10.0 (o `latest` no npm é RC do 8 — não atualizar sem decisão explícita).
- Shadcn: `form` e `toast` foram substituídos por `field` e `sonner` no registry atual.
- Middleware agora é `src/proxy.ts` (Next 16) e precisa de export `default` ou `proxy` estaticamente detectável.

## Multi-tenancy (row-level)

- Toda tabela de negócio tem `tenant_id`. Relações entre entidades do mesmo tenant usam FK composta `(id, tenant_id)`.
- Dados de negócio: SEMPRE via `getTenantDb()` de `src/lib/dal.ts` (client com extensão `forTenant` que injeta `tenantId` em where/create). O `tenantId` vem só da sessão do servidor, nunca do cliente.
- `prisma` cru (`src/lib/db.ts`) só para fluxos sem tenant (login/cadastro). Nested writes não são interceptados pela extensão.
- Decimal do Prisma não é serializável: converter para string antes de enviar a Client Components.

## Comandos

- `npm run typecheck` | `npm run lint` | `npm run build`
- `npm run db:migrate` (dev, requer DATABASE_URL) | `npm run db:deploy` (produção) | `npm run db:studio`
- Migração sem banco: `npx prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script`
- Banco local descartável para testes: `npx prisma dev --name <nome> --detach` (imprime a URL; passe via env `DATABASE_URL`).
