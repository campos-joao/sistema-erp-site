# ERP SaaS multi-tenant

ERP web para pequenas empresas: catálogo de produtos com variações, controle de estoque por depósito e gestão de usuários. Cada empresa (tenant) enxerga apenas os próprios dados.

## Funcionalidades

- **Conta e acesso**: cadastro da empresa com usuário administrador, login, logout e troca de senha.
- **Várias lojas por login**: no menu lateral, clique em "ERP" para ver suas lojas, trocar de loja ou criar uma nova (`/lojas/nova`). Cada loja é uma empresa separada (produtos, estoque, usuários e CNPJ próprios) e o perfil (administrador/membro) é definido por loja.
- **Produtos**: cadastro, edição e exclusão; preço, custo e código de barras; busca por nome/SKU/código de barras, filtros (com/sem variações, com/sem saldo) e paginação.
- **Variações**: cor e/ou tamanho, com SKU, preço e custo próprios (opcionais; herdam do produto).
- **Estoque**: saldos por depósito, entradas, saídas e ajustes de inventário, com histórico imutável (quem, quando, saldo após). Saídas não deixam o saldo negativo, mesmo com operações simultâneas.
- **Depósitos**: criar, renomear e excluir (só sem saldo e mantendo pelo menos um).
- **Dashboard**: produtos, unidades e valor do estoque a custo, movimentações dos últimos 30 dias, últimas movimentações e produtos sem saldo.
- **Configurações**: dados da empresa (CNPJ/CPF validados, incluindo CNPJ alfanumérico) e usuários (adicionar com senha temporária, trocar perfil, redefinir senha, remover).

### Perfis

| Ação | Administrador | Membro |
| --- | :-: | :-: |
| Ver tudo, cadastrar/editar produtos e variações | ✓ | ✓ |
| Movimentar estoque | ✓ | ✓ |
| Excluir produtos e variações | ✓ | |
| Gerenciar depósitos, empresa e usuários | ✓ | |

As permissões ficam em `src/lib/permissions.ts` e são verificadas no servidor em toda Server Action (`authorize()` em `src/lib/dal.ts`). O perfil é lido do banco a cada requisição, então mudanças valem na hora.

## Stack

Next.js 16 (App Router), TypeScript, Tailwind v4, Shadcn UI, Prisma 7 + PostgreSQL, Auth.js v5 (Credentials/JWT), Zod 4, react-hook-form, Vitest.

## Como rodar

Pré-requisitos: Node.js 20+ e um PostgreSQL (Neon, Supabase, Railway ou local).

```bash
npm install
cp .env.example .env      # preencha DATABASE_URL e AUTH_SECRET (npx auth secret)
npm run db:migrate        # aplica as migrações
npm run db:seed           # opcional: dados de exemplo
npm run dev
```

Acesse http://localhost:3000. Com o seed:

| Usuário | Senha | Perfil |
| --- | --- | --- |
| `admin@admin.com` | `admin123` | Administrador de testes (acesso total) em "Loja Demo" e "Outlet Demo" |
| `admin@demo.com` | `demo1234` | Administrador |
| `membro@demo.com` | `demo1234` | Membro |

Os demais pertencem só à "Loja Demo". Rodar o seed de novo não duplica dados e sempre restaura o perfil ADMIN e a senha do `admin@admin.com`. **Não rode o seed em produção.**

Sem PostgreSQL instalado, dá para usar um banco local descartável:

```bash
npx prisma dev --name erp --detach   # imprime a URL postgres://...
```

## Scripts

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` / `npm start` | Build e servidor de produção |
| `npm run typecheck` / `npm run lint` | Verificações estáticas |
| `npm test` | Testes (unitários; integração se `TEST_DATABASE_URL` estiver definido) |
| `npm run db:migrate` | Cria/aplica migrações (desenvolvimento) |
| `npm run db:deploy` | Aplica migrações (produção) |
| `npm run db:seed` | Dados de exemplo |
| `npm run db:studio` | Prisma Studio |

### Testes de integração

Rodam contra um PostgreSQL real com as migrações aplicadas e cobrem isolamento entre tenants, restrições do banco e concorrência no estoque. Os dados criados são removidos ao final.

```bash
TEST_DATABASE_URL="postgres://..." npm test
```

## Arquitetura

```
src/
  app/                 rotas (App Router): (auth) login/cadastro, (dashboard) páginas internas
  features/<módulo>/   schemas (Zod), queries (leitura, server-only), actions (Server Actions), components
  components/          layout, listas (busca/filtro/paginação) e Shadcn UI
  lib/                 dal (sessão/tenant/permissões), tenant-db, formatação, validações
prisma/                schema, migrações e seed
tests/                 testes de integração
```

### Multi-tenancy (row-level)

- Toda tabela de negócio tem `tenant_id`, e relações entre entidades usam FK composta `(id, tenant_id)`: o banco impede que um registro aponte para dados de outra empresa.
- Usuários são um login global; o acesso a cada loja e o perfil ficam em `memberships`. A loja ativa fica no cookie `erp_tenant`, mas o servidor só a aceita se o usuário for membro dela (senão usa a primeira loja dele).
- O acesso a dados de negócio passa por `getTenantDb()`, um Prisma Client que injeta o `tenantId` da loja ativa em todas as consultas. O `tenantId` nunca vem do cliente sem validação.
- Saldos (`stock_items`) têm índices únicos parciais: um saldo por produto sem variação e um por variação, em cada depósito.
