# Developer handoff — DB/runtime import hygiene (`odi-refactor`)

This note is for whoever picks up the **split between `@babylon/db` and `@babylon/db/runtime`**, cleanup of merge-corrupted imports, and related typecheck fallout.

**Scope honesty:** The branch commit is a **structural checkpoint** (schema → `tables/`, runtime entrypoint, mass import rewires). It is **not** a claim that every consumer is fully verified—run `typecheck`, `lint`, and tests before release. **`bun run check` (Biome) was green** at last commit; full Turbo typecheck may still fail in some packages until follow-up fixes land.

**Not in git (keep local if you need them):** `scripts/fix-web-db-runtime-imports.ts`, `scripts/migrate-babylon-db-runtime-imports.ts`, `scripts/repair-babylon-db-imports.ts`, `scripts/vercel-ignore-build-step.sh` — one-off / environment helpers; do not treat them as supported product surface.

## Goal

- **`@babylon/db`**: Drizzle operators (`eq`, `and`, …), re-exported helpers, **types** (`export type`), query modules — **no** live `db` client unless you intentionally need a narrow exception.
- **`@babylon/db/runtime`**: **`db`**, table symbols (`users`, `posts`, …), RLS helpers (`asUser`, `asSystem`, …), `withTransaction`, etc.
- **`bun:test`**: `describe`, `test`/`it`, `expect`, hooks, `setDefaultTimeout` — **never** import Drizzle tables or `db` from here.

Wrong merges often look like: `import { authenticate, db, users, db, successResponse, users } from '@babylon/db/runtime'` — API/test symbols must not live on the runtime barrel.

## Done recently (this line of work)

- **Engine integration tests** (`packages/engine/src/__tests__/integration/`): `bun:test` vs `@babylon/db/runtime` split is correct for tiered-group and agent-group-chat-invite flows.
- **`packages/mcp/src/handlers/tool-handlers.ts`**: Repaired a bad merge — escrow handlers (`handleAppealBanWithEscrow`, etc.) import from **`@babylon/a2a`**; Drizzle tables only from **`@babylon/db/runtime`**. Unused table imports removed; **`packages/mcp` `tsc --noEmit`** passes.
- **Import repair helper (local only):** A `fix-web-db-runtime-imports.ts` script existed during the refactor; it is **not committed**. If you revive it, it must insert new imports **before the first value `import`** (not after line 1 of a multi-line import) and process **every** `from '@babylon/db/runtime'` block in a file.

## Known follow-ups

1. **`apps/web` TypeScript** — `src/lib/wallet/pnlHistory.ts` still fails `tsc` with:
   - `userPnLSnapshots` used as a **value** but apparently imported/exported as **type-only** from `@babylon/db` (or wrong symbol source after schema moves).
   - A few implicit `any` parameters on `row` callbacks.
   - Likely fix: import the **`userPnLSnapshots` table** from **`@babylon/db/runtime`** (or wherever the table lives post-split), and align types.

2. **Repo-wide `typecheck`** — `turbo typecheck --filter=web` still pulls dependents; failures in **`packages/training`** (e.g. missing `@babylon/core/...` path, unused imports) may block the task until those are fixed or scoped differently.

3. **If merge corruption returns in `apps/web`** — Use a **local copy** of `fix-web-db-runtime-imports.ts` (not committed) with the insert-before-first-value-import behavior, or fix imports manually. **Do not** insert new import lines after the first line of a multi-line `import {`.

## Suggested verification (when touching this area)

Per `CLAUDE.md` quality gate (subset as needed):

```bash
bun run check
bun run typecheck
bun run lint
```

Targeted:

```bash
bunx tsc --noEmit -p apps/web
bunx tsc --noEmit -p packages/mcp
```

## Contacts / context

- Branch context: **`odi-refactor`** (see `git status` for full modified-file list — large surface area across `packages/db`, `packages/api`, `packages/testing`, CLI, agents, etc.).
- Single rule source: **`CLAUDE.md`** at repo root.
