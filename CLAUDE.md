@AGENTS.md

# CLAUDE.md

Guidance for Claude Code in this repository. Project docs and commits are in Turkish.

## Project

Two-person portfolio + blog: a **single Next.js 16 App Router app** (no separate API). Two authors
manage their own profile, projects and posts from a panel; visitors read without accounts.

Status: **Stage 1 (foundation) only.** There are no public pages, no working login, no panel yet.
`app/(auth)`, `app/(dashboard)`, `app/api`, `features/` are placeholders. Check before assuming
something exists.

Stack (pinned in `package.json`): Next.js 16.4, React 19.3, TypeScript 5.9 strict, Prisma 7.10 with
`@prisma/adapter-pg`, PostgreSQL 16, Better Auth 1.7 (chosen, not wired yet), shadcn **base-nova**
on `@base-ui/react`, Tailwind 4, Zod 3, Vitest 5.

Next.js 16 differs from older versions (async request APIs, `error.tsx` gets `retry`, Turbopack
default, ESLint CLI instead of `next lint`). Read `node_modules/next/dist/docs/` before writing
Next.js code.

## Commands

```bash
npm run dev | build | start
npm run lint                 # ESLint (flat config from eslint-config-next 16)
npm run format:check         # Prettier
npm run typecheck            # next typegen && tsc --noEmit
npm test                     # Vitest unit tests (no DB)
npm run test:integration     # needs TEST_DATABASE_URL; DB name must end with _test (tables are wiped)
npm run prisma:migrate       # create migration (dev DB only)
npm run prisma:deploy        # apply committed migrations
```

`npm install` runs `prisma generate` (postinstall). The generated client lives in
`prisma/generated/` (gitignored) and is imported as `@/prisma/generated/client`.

## Decisions to respect

- **Auth:** Better Auth + GitHub OAuth, exactly two allowlisted authors keyed by immutable GitHub
  user id, DB sessions, no open sign-up, no passwords. See `docs/adr/0001-auth-better-auth.md`.
- **Ownership:** author/owner ids come from the server session, never from client input. Every
  Server Action checks auth itself; authorization lives in services/queries, not in UI.
- **Deletes:** users are deactivated (`User.active = false`), never deleted with content.
  Content → user relations are `onDelete: Restrict`; only `Session`/`Account` cascade.
- **Public visibility:** a post is public only if `status = PUBLISHED` and `publishedAt <= now()`.
  Every public channel (list, detail, sitemap, RSS) uses the same filter.
- **URLs:** Turkish (`/kisiler/[slug]`, `/projeler`, `/blog`, `/iletisim`, `/giris`, `/panel`).
- **No** comments, likes, visitor accounts, Redis, queues or microservices in v1.

## Code layout

```
app/            routing + composition only; no business logic, no Prisma
features/<x>/   components, actions ("use server", thin), services, repositories (only Prisma access), schemas, types
shared/         components / hooks / utils used by 2+ features
components/ui/  shadcn base-nova output — never hand-edit, excluded from Prettier
config/         site.ts, public-env.ts (NEXT_PUBLIC_* only)
lib/            prisma.ts + env.ts (both `server-only`), env.schema.ts (pure, tested), utils.ts (cn)
tests/integration/  real-Postgres tests
```

- Env: server values only via `@/lib/env`; client-visible values only via `@/config/public-env`.
  Add new variables to `lib/env.schema.ts` with tests. Never put secrets behind `NEXT_PUBLIC_`.
- TypeScript: strict + `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes`. Unused
  vars/params are enforced by ESLint (not tsc, because Next's generated `.next/dev/types` would fail).
  No `any`, no `!` non-null assertions, readonly props.
- Prisma: `select` only needed fields; `$transaction` for multi-writes; no `$queryRawUnsafe` /
  `$executeRawUnsafe`. Never edit an applied migration; data-changing migrations are created with
  `--create-only`, reviewed and adjusted to preserve data. Never `migrate reset` / `db push` a DB
  with data. Migrations are LF-only (`.gitattributes`) because Prisma checksums them.
- Files: kebab-case (`project-card.tsx`, `create-project.action.ts`).

Full rules: `docs/project-rules.md`.

## Git

`develop` is the integration branch: branch from it (`feat/…`, `fix/…`, `chore/…`, `docs/…`,
`test/…`) and open PRs back into it. `main` is release-only. Conventional Commits. CI
(`.github/workflows/ci.yml`) must pass. No force pushes.
