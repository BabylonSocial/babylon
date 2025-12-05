# Repository Guidelines (Codex/Claude)

## State (target vs current)
- Target (in-progress): Elysia host in `apps/server`, background workers in `apps/daemon`, dedicated `apps/agents`, domain split into `packages/core/*` with `shared/infra` wiring.
- Current code: Next.js app `apps/web` hosts UI + API routes/SSE/A2A; CLI tooling in `apps/cli`; docs site in `apps/docs`. Domain/engine lives in `packages/engine` and `packages/agents` (+ `a2a`, `mcp`); infra/util in `packages/api`, `packages/shared`, `packages/db`; on-chain in `packages/contracts`; tests in `packages/testing`.
- Migration intent: new work should be portable to the target Elysia/core layout; keep app-layer thin and framework-agnostic where possible.

## Structure & Boundaries
- Apps (current): `apps/web` (Next 16 UI + API routes/SSE/A2A), `apps/cli` (deploy/seed/game/agent ops), `apps/docs` (Nextra docs). Apps should stay wiring-only.
- Apps (target/planned): `apps/server` (Elysia host, thin routes), `apps/daemon` (loops/workers), `apps/agents` (runners/integrations) — keep portability in mind when adding API endpoints.
- Packages (current): `packages/engine` (game/perps generation & loop), `packages/agents` (agent runtime + Agent0/A2A/MCP), `packages/a2a`, `packages/mcp`, `packages/api` (auth/rate-limit/redis/sse/token counting), `packages/shared` (client-safe types/utils/config), `packages/db` (Drizzle schema/client), `packages/contracts`, `packages/testing`, `packages/training`, `packages/examples`.
- Packages (target/planned): `packages/core/*` for domain logic, `packages/shared/infra` for infra wiring; keep new domain code framework-free so it can move there cleanly.
- Docs: `apps/docs` is the docs site; `docs/vendors/*` is generated vendor docs.

## Commands
- Install: `bun install`
- Dev: `bun run dev` (runs local Hardhat, deploys, Turbo dev, cron sim); UI-only variants `bun run dev:web` or `bun run dev:next-only`.
- Build: `bun run build`
- Types: `bun run typecheck`
- Lint/format: `bun run lint` (Turbo) or `bun run check` (Biome write)
- Tests: `bun run test` (unit+integration), `bun run test:e2e`; suite lives under `packages/testing`
- DB (Drizzle via `packages/db`): `bun run db:generate` / `db:migrate` / `db:push` / `db:pull` / `db:studio`
- Docs vendors: `bun run docs:generate` (fills `docs/vendors/*`)
- Runtime is Bun; prefer Bun tooling/commands (and Bun APIs like `Bun.file` when appropriate).

## Style & Conventions
- TypeScript ESM, 2-space indent. PascalCase components; camelCase hooks/vars; kebab-case packages.
- App layers stay thin: validate → call service → map errors. Current handlers are Next.js; write them to be movable to Elysia without Next-specific assumptions.
- Domain logic lives in packages (`engine`/`agents` now; `core-*` later). Avoid putting domain rules in React components or API handlers.
- Keep core/package code free of Next/React/Elysia dependencies so migration is easy.
- Env: single root `.env` (see `.env.example`). `scripts/pre-dev/pre-dev-local.ts` will generate/update `.env` for localnet defaults; `.env.local` can override for Next when needed. Keep `.env.example` accurate (defaults, optional vs required).
- When using a library (Elysia, Drizzle, Bun, Privy, etc.), prefer local docs in `docs/vendors/{vendor}`; if missing, suggest `bun run docs:generate` before guessing APIs.

## Testing
- Tests live under `packages/testing` (unit/integration/e2e); use preload files there. API integration is currently in `apps/web`; keep them portable to Elysia when it lands.
- Use fakes/stubs; keep tests deterministic.

## Commits/PRs
- Commits: concise, imperative, prefixed (`feat: ...`, `fix: ...`, `chore: ...`).
- PRs: motivation + solution; commands run (`bun run check`, tests); screenshots for UI changes.
- Respect boundaries: feature → package service (`engine`/`agents` → `api`/`db`) → consume in `apps/web`. Keep `.env.example` up to date with comments/defaults/optionals.
