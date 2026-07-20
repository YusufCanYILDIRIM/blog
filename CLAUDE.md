# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Modern Blog Platform — a **monolithic Next.js 15 App Router** application (Turkish-language project docs/commits). It was previously planned as a decoupled Next.js + Express.js setup; as of Sprint 2.1 it was collapsed into a single Next.js app using Server Components + Server Actions instead of a separate API layer. The project is currently at the "foundation/skeleton" stage (Sprint 2.1): folder structure, tooling, and Prisma datasource are in place, but **no database models, features, or auth are implemented yet** — most subdirectories contain only a `README.md` documenting their intended purpose.

Architecture: `Browser → Next.js 15 (Server Components / Server Actions / Route Handlers) → Prisma ORM → PostgreSQL`.

## Commands

```bash
npm run dev              # Start dev server (localhost:3000)
npm run build            # Production build
npm run start            # Run production build
npm run lint             # ESLint
npm run lint:fix         # ESLint with auto-fix
npm run format           # Prettier write
npm run format:check     # Prettier check
npm run typecheck        # tsc --noEmit
npm run prisma:generate  # Regenerate Prisma Client after schema.prisma changes
npm run prisma:migrate   # Create + apply a dev migration (prisma migrate dev)
npm run prisma:studio    # Open Prisma Studio
```

No test runner is configured yet (see roadmap below).

### Local environment setup

- Requires Node.js 22+ and Docker (for PostgreSQL + Redis).
- `docker compose up -d` starts `blog_postgres` (5432) and `blog_redis` (6379) per `docker-compose.yml`.
- Copy `.env.example` to `.env` — **Prisma CLI only auto-loads `.env`, not `.env.local`**; if both exist keep them in sync, or CLI commands like `prisma db pull`/`migrate` will fail with "Environment variable not found: DATABASE_URL" even though Next.js dev picks up `.env.local` fine.
- `lib/env.ts` validates env vars with Zod at startup (`DATABASE_URL`, `NEXT_PUBLIC_APP_URL` currently); add new required vars there as integrations are wired up.

## Architecture

The binding, exhaustive standard for this codebase is **`docs/project-rules.md`** — read it before non-trivial work. It is organized into ZORUNLU (mandatory), ÖNERİLEN (recommended), and YASAK (forbidden) rules. Below is the subset most load-bearing for day-to-day changes; don't duplicate lookups into `docs/project-rules.md` for anything not summarized here.

### Folder structure (feature-based + layered hybrid)

```
app/            Next.js App Router — ONLY routing/layout/page composition, no business logic, no direct Prisma calls
features/       Business modules — the heart of the app; each feature is self-contained (see below)
shared/         Feature-agnostic, reusable components/hooks/utils — nothing feature-specific
components/ui/  shadcn/ui CLI output — never hand-edit
lib/            Infra singletons: prisma.ts (PrismaClient singleton), env.ts (Zod-validated env), utils.ts (cn helper)
providers/      React context provider composition (theme, etc.)
types/          Project-wide shared types (not feature-specific)
config/         Static/env-based app config (site metadata)
constants/      Immutable constants (route paths, etc.)
hooks/          Framework-agnostic generic hooks
utils/          Zero-dependency generic pure functions
prisma/         schema.prisma, migrations/, seed.ts
docker/         Postgres/Redis local dev config
```

Each feature module (`features/{name}/`) has this internal shape:

```
components/   Feature-specific UI (not reused elsewhere)
actions/      "use server" Server Actions — thin entry points only
services/     Pure business logic / use cases — no framework imports (Next.js/React)
repositories/ The single place Prisma access is encapsulated for this feature
schemas/      Zod schemas specific to this feature
hooks/        Client hooks specific to this feature
types/        Types specific to this feature
```

**Rule:** one feature module never imports directly from another feature's `components/`, `services/`, or `repositories/`. Shared needs move to `shared/`. Test: "does only one feature use this, or two+?" — if unsure, it stays feature-local (no speculative promotion to `shared/`).

`app/api/` is **only** for external integrations (webhooks, 3rd-party OAuth callbacks, Auth.js's own route handler). All internal CRUD/mutations go through Server Actions, not route handlers.

### Layering (Clean Architecture, outer depends on inner)

```
Presentation (UI, Route Handlers)
   → Application (Services / Use Cases)
   → Domain (Entities, Business Rules)
   ← Infrastructure (Prisma, Auth.js, external APIs) depends on Domain, not vice versa
```

Business rules never live in a component or a route handler — they live in a testable service. Server Actions stay thin: auth check → Zod validate → call service → `revalidatePath`/`revalidateTag`. Every Server Action does its **own** auth/authorization check (never assume an upstream layer already did it).

### Next.js conventions

- **Server Components by default.** `"use client"` only for real needs: state/lifecycle hooks, browser APIs, event handlers, or client-only 3rd-party libs — and pushed to the smallest leaf component, never a whole `page.tsx`.
- Internal mutations = **Server Actions**, not `/api` routes.
- Next.js 15's `fetch` is not cached by default — cache strategy (`revalidate`, `no-store`, `tags`) must be explicit. Dedup repeated Prisma reads within a request via React's `cache()`.
- Every `page.tsx` defines `generateMetadata`/static metadata — no hardcoded `<title>`/`<meta>`.
- Dynamic segments use descriptive names (`[projectId]`), never generic `[id]`.

### TypeScript

`tsconfig.json` runs strict + `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`, `noUnusedLocals/Parameters`. Consequences to respect when writing code:
- `any` is banned (ESLint `error`, see `eslint.config.mjs`) — use `unknown` + Zod narrowing for untyped external data.
- No non-null assertion (`!`) or `as any`/double-assertion (ESLint enforces `no-non-null-assertion`).
- `interface` for object shapes/props/entities; `type` for unions/intersections/mapped/function-signature compositions. Prefer string-literal unions over `enum`.
- Derive types with `Pick`/`Omit`/`Partial` from a single source interface rather than hand-duplicating shapes.
- All prop interfaces are `readonly`.

### Prisma

- `schema.prisma` currently defines only the `postgresql` datasource + client generator — **no models yet** (`prisma/README.md` explains this is deliberate; models arrive in a later sprint). Don't assume any model exists — grep `schema.prisma` before referencing one.
- When adding models: PascalCase singular model name, `@@map` to snake_case plural table name, explicit `onDelete` on every relation, standard audit fields (`createdAt`, `updatedAt`, soft-delete via `deletedAt`), indexes on frequently filtered/joined columns.
- Migrations are generated via `prisma migrate dev` and never hand-edited; production applies via `prisma migrate deploy`, never `prisma db push`.
- Never call `prisma.*` directly from a component or route handler — always through a feature's `repositories/` layer.
- Always `select` only needed fields, especially to avoid leaking sensitive columns; use `$transaction` for multi-write atomicity; `$queryRawUnsafe` is forbidden, only parametrized `$queryRaw`.

### Validation

One Zod schema per data shape, imported by both the client (`react-hook-form` + `zodResolver`) and the server (Server Action `safeParse`) — never duplicated. Backend always re-validates; frontend validation is UX-only, never trusted as the security boundary. Feature-specific schemas live in `features/{x}/schemas/`; cross-feature ones in `shared/`.

### Security

- Auth.js v5 is the planned auth solution (`next-auth@5.0.0-beta.31` already a dependency) — not yet configured (`lib/auth.ts` doesn't exist yet).
- Authorization checks live in the service layer, never only in the UI (hiding a button is UX, not a security boundary).
- Never expose secrets via `NEXT_PUBLIC_` prefix; all env vars are Zod-validated in `lib/env.ts`.
- Sanitize (e.g. DOMPurify) anything passed to `dangerouslySetInnerHTML`.

### Style/lint

- Prettier + `prettier-plugin-tailwindcss` (`.prettierrc.json`), ESLint flat config extending `next/core-web-vitals`/`next/typescript` with extra strict rules (see `eslint.config.mjs`).
- shadcn/ui config: `components.json` — style "new-york", base color "neutral", aliases `@/components`, `@/lib/utils`, `@/components/ui`, `@/hooks`, `@/lib`. Don't hand-edit generated `components/ui/*`.
- Path alias: `@/*` → repo root (`tsconfig.json`).

### Naming quick reference

kebab-case for filenames (`project-card.tsx`, `use-project-filters.ts`, `project.schema.ts`, `create-project.action.ts`); PascalCase for components/interfaces/types; camelCase functions (verb-first) and boolean vars (`is/has/should/can` prefix); `UPPER_SNAKE_CASE` for true constants. Full table in `docs/project-rules.md` §3.

### Git / commits

Conventional Commits (`feat`, `fix`, `refactor`, `perf`, `test`, `docs`, `chore`, `style`), scoped like `feat(projects): ...`. Trunk-based flow off `main`; branches named `feature/...`, `fix/...`, `chore/...`, `refactor/...`.

## Current state / roadmap

Per `README.md`: project scaffolding is done; database modeling (Post/User/Comment/Category/Tag), Auth.js integration, blog CRUD, rich text editor, image upload, nested comments, likes/notifications, categories/search, admin panel, test coverage, and CI/CD are all **not yet implemented**. `app/(auth)/`, `app/(dashboard)/`, `app/api/`, `features/` are placeholder directories (each has a README explaining intended future contents) — don't assume functionality exists there without checking. `backend/` and `frontend/` are empty leftover directories from the pre-Sprint-2.1 decoupled architecture that is no longer used.
