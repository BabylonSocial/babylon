# CLAUDE.md

Guidance for Claude Code when working in this repo.

## State (target vs current)
- Target (in-progress): Elysia host in `apps/server`, background workers in `apps/daemon`, dedicated `apps/agents`, domain split into `packages/core/*` with `shared/infra` wiring.
- Current code: Next.js app `apps/web` hosts UI + API routes/SSE/A2A; CLI tooling in `apps/cli`; docs site in `apps/docs`. Domain/engine lives in `packages/engine` and `packages/agents` (+ `a2a`, `mcp`); infra/util in `packages/api`, `packages/shared`, `packages/db`; on-chain in `packages/contracts`; tests in `packages/testing`.
- Migration intent: keep new work portable to the target layout; handlers should stay thin and framework-agnostic enough to move to Elysia.

## Core Commands
- Install deps: `bun install`
- Dev: `bun run dev` (starts Hardhat node + deploy + Turbo dev + cron sim); UI-only: `bun run dev:web` or `bun run dev:next-only`
- Build: `bun run build`
- Types: `bun run typecheck`
- Lint/format (Biome): `bun run lint` (Turbo) or `bun run check` (write)
- Tests: `bun run test` (unit+integration), `bun run test:e2e`
- DB (Drizzle/Postgres): `bun run db:generate`, `bun run db:migrate`, `bun run db:push`, `bun run db:pull`, `bun run db:studio`
- Docs vendors: `bun run docs:generate` (pull vendor docs into `docs/vendors/*`)
- Runtime is Bun; prefer Bun tooling/commands (Bun APIs like `Bun.file` when appropriate).

## Architecture (modular monolith)
- Runtime: Bun. Backend: Next.js routes today (moving to Elysia host). Frontend: Next.js 16. DB: Postgres + Drizzle.
- Apps: current `apps/web` (UI + API routes/SSE/A2A), `apps/cli` (ops), `apps/docs` (docs); target to add `apps/server` (Elysia), `apps/daemon`, `apps/agents`.
- Packages: current `engine` (game/perps), `agents` (runtime + Agent0/A2A/MCP), `a2a`, `mcp`, `api` (auth/rate-limit/redis/sse/token counting), `shared` (client-safe types/utils/config), `db` (schema), `contracts`, `testing`, `training`, `examples`; target `core-*` and `shared/infra` for domain/infra splits.
- Dependency flow: apps → packages (`engine`/`agents`/`api`/`db`/`shared`) → contracts. Keep domain code framework-agnostic to move into `core-*` later.

## Structure (current)
```
apps/
  web/      # Next.js UI + API routes/SSE/A2A
  cli/      # Deploy/seed/game/agent ops
  docs/     # Docs site (Nextra)
packages/
  engine/           # Game world/perps/simulation logic
  agents/           # Agent runtime + Agent0/A2A/MCP integrations
  a2a/              # A2A protocol server/client helpers
  mcp/              # MCP tooling
  api/              # Auth/rate-limit/redis/sse utilities (Next today, portable to Elysia)
  shared/           # Client-safe types/utils/config
  db/               # Drizzle schema/client
  contracts/        # Hardhat/Foundry contracts
  testing/          # Shared test harnesses and suites
  training/         # RL/training utilities
  examples/         # Sample agents
docs/vendors/*      # Generated vendor docs (via docs:generate)
```
Target adds `apps/server`, `apps/daemon`, `apps/agents`, and moves domain into `packages/core/*` + infra into `packages/shared/infra`.

## Working rules
- Keep app layers thin: validate → call service → map errors. Current handlers are Next.js; write them so they can move to Elysia without Next-only assumptions.
- Domain logic goes into packages (`engine`/`agents` now; `core-*` later). Avoid domain code in React components or route handlers.
- No Drizzle/Redis/HTTP inside domain modules; use `@babylon/api` for server-only concerns (auth, rate limit, SSE, token counting, storage).
- Tests: unit in `core-*`, integration in `apps/server` for routes, E2E later for critical flows.
- Naming: PascalCase components; camelCase hooks/vars; kebab-case packages; 2-space indent.
- Commits: concise, imperative, prefixed (`feat: ...`, `fix: ...`, `chore: ...`).
- Keep `.env.example` current: add new envs with defaults/comments, mark optional vs required, keep it organized.
- Strive for clean, efficient, DRY code that favors clarity, maintainability, good DX, and performance.
- Env: use a single root `.env` (see `.env.example`); avoid per-app envs unless explicitly needed.
- When calling or designing around external libraries/frameworks (Elysia, Drizzle, Bun, Privy, etc.), prefer reading the local vendor docs in `docs/vendors/{vendor}` first; if absent, propose running `bun run docs:generate` instead of guessing APIs or behavior.

## Env (minimal, adjust per app)
- Root `.env` is canonical; `scripts/pre-dev/pre-dev-local.ts` will create/refresh it for localnet defaults. Use `.env.local` for Next overrides when needed. `.env.example` must list new vars with comments/defaults/optional vs required.
- `DATABASE_URL` (Postgres) and auth/model/storage keys per feature; consult `.env.example`.

## Workflow reminder
1) Design/extend use-case in the right `core-*`.  
2) Wire API in `packages/api` + `apps/server`.  
3) Consume in `apps/web`.  
4) Add tests at the right layer.  
Keep docs/READMEs updated when boundaries change.
