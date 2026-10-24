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
- Saldos de estoque têm índices únicos parciais (preview `partialIndexes`). `prisma migrate dev` não funciona com `prisma dev` (PGlite não tem shadow DB): gere migrações com `npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script` contra um banco com as migrações aplicadas.
- Movimentar estoque só via `applyStockMovement` (`src/features/stock/service.ts`): atualiza saldo com controle otimista e grava o histórico.

## Organização e permissões

- Cada módulo em `src/features/<módulo>/`: `schemas.ts` (Zod, seguro para client), `queries.ts` (leituras, `server-only`), `actions.ts` (Server Actions), `components/`.
- Client Components não podem importar valores de `@/generated/prisma/client` (só `import type`), senão o Prisma vai para o bundle do browser.
- Toda Server Action de escrita começa com `authorize("<permissão>")` de `src/lib/dal.ts`. Permissões por perfil em `src/lib/permissions.ts`.
- Multi-loja: `User` é login global (sem `tenantId`/`role`); acesso e perfil por loja em `Membership` (model escopado por tenant). O JWT guarda só `id`.
- `requireUser()` = usuário + lojas dele (sem exigir loja). `requireSession()` = loja ativa (cookie `erp_tenant` validado contra os memberships; fallback para a primeira; sem lojas → `/lojas/nova`). Usuário removido → `/sair`.
- Trocar/criar loja: `src/features/tenants/actions.ts` (`setActiveTenant` grava o cookie). `/lojas/nova` fica no grupo `(onboarding)` porque não exige loja ativa.
- Senha é global: só redefinir senha de membros que pertencem exclusivamente à loja atual.
- Formulários cujo schema transforma valores (vazio → `null`) usam `useForm<Input, unknown, Output>` e enviam `form.getValues()` à action, que revalida.
- Após criar rotas novas, rode `npx next typegen` para os tipos `PageProps<"/rota">`.

## Comandos

- `npm run typecheck` | `npm run lint` | `npm run build` | `npm test` (Vitest)
- Testes de integração: `TEST_DATABASE_URL=<url> npm test` (pulados sem a variável). Seed: `npm run db:seed` (admin de testes admin@admin.com / admin123; também admin@demo.com e membro@demo.com / demo1234).
- `npm run db:migrate` (dev, requer DATABASE_URL) | `npm run db:deploy` (produção) | `npm run db:studio`
- Migração sem banco: `npx prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script`
- Banco local descartável para testes: `npx prisma dev --name <nome> --detach` (imprime a URL; passe via env `DATABASE_URL`). Use também `DATABASE_POOL_MAX=5`: o PGlite derruba conexões com ~10 consultas simultâneas (o Dashboard faz ~12). Para `next start` local, defina `AUTH_TRUST_HOST=true`.
