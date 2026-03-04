# OpenAPI Code Generation Migration - Completion Plan

## Branch Goal

Replace hand-written API fetch code with auto-generated type-safe TanStack React Query hooks.

**Pipeline:** Zod schemas -> `openapi.json` -> Orval -> `@babylon/api-hooks` package

---

## Current State

| Metric | Value |
|--------|-------|
| OpenAPI path definitions | 163 / ~324 endpoints (50%) |
| Generated hook modules | 27 domain modules, 749 files |
| Consumer files migrated | 8 hooks/stores |
| Consumer files remaining | ~47 files with raw `fetch()` calls |
| Build status | Clean (0 migration-introduced errors) |
| Lint status | Clean (all 17 workspaces pass) |
| Tests for migrated code | 0 |

---

## Principles

1. **Do not break existing behavior.** Every change must be validated before and after.
2. **Migrate incrementally.** One hook/store at a time, test between each.
3. **Keep what should stay hand-written.** SSE, server actions, and complex orchestration hooks are not candidates.
4. **Generated code is the source of truth.** Local types should re-export from `@babylon/api-hooks`, not duplicate.
5. **The existing `apiFetch` utility and `orvalFetch` use the same auth pattern** (`window.__privyGetAccessToken` + 401 retry). They are functionally equivalent, so migration should be transparent to users.

---

## Phase 0: Validation Baseline (Before Any New Work)

**Goal:** Prove the current branch doesn't break anything by establishing a test baseline.

### 0.1 - Verify the build compiles

```bash
bun run generate:api          # Regenerate spec + hooks
bunx tsc --noEmit              # Type check (expect only pre-existing DOM errors)
bun run lint                   # Biome lint (expect 0 errors)
```

### 0.2 - Run existing test suite

```bash
bun test packages/testing/unit/ --preload ./packages/testing/unit/preload.ts
bun test packages/testing/integration/ --preload ./packages/testing/integration/preload.ts
```

Document any failures. They must be pre-existing, not introduced by this branch.

### 0.3 - Write regression tests for already-migrated hooks

These 8 files were already migrated but have **zero tests**. Before touching anything else, cover them:

| File | Test File | What to Test |
|------|-----------|-------------|
| `hooks/useOwnedAgents.ts` | `hooks/__tests__/useOwnedAgents.test.ts` | Returns agent map from API data; respects `enabled` flag; `updateAgentBalance` patches query cache; `isOwnAgent` lookups |
| `hooks/usePerpTrade.ts` | `hooks/__tests__/usePerpTrade.test.ts` | `openPosition` calls `openPerpPosition` with correct body; `closePosition` calls `closePerpPosition(id, {})` |
| `hooks/useTransferPoints.ts` | `hooks/__tests__/useTransferPoints.test.ts` | Mutation calls transfer endpoint; invalidates balance + profile caches on success |
| `hooks/useUnreadMessages.ts` | `hooks/__tests__/useUnreadMessages.test.ts` | Returns count from API; polls at 30s interval; marks as read |
| `stores/perpMarketsStore.ts` | `stores/__tests__/perpMarketsStore.test.ts` | `usePerpMarkets` returns markets array; `usePerpMarketsRealtime` patches cache on SSE; `invalidatePerpMarketsCache` works via window bridge |
| `stores/predictionMarketsStore.ts` | `stores/__tests__/predictionMarketsStore.test.ts` | Returns prediction markets; polling works; cache invalidation |
| `stores/walletBalanceStore.ts` | `stores/__tests__/walletBalanceStore.test.ts` | Returns balance; polling; backward-compat `useWalletBalance` re-export |
| `hooks/useWalletBalance.ts` | (covered by walletBalanceStore test) | Deprecated re-export works |

**Test pattern:** Use a shared `createTestQueryClient()` helper. Mock `orvalFetch` at the module level. Assert on query keys, enabled states, cache updates, and return shapes. Do NOT test generated code internals -- only test the wrapper behavior.

Create `packages/testing/unit/helpers/query-test-utils.ts`:
- `createTestQueryClient()` - Returns a configured QueryClient for tests
- `mockOrvalFetch()` - Mocks the fetch layer with typed responses
- `flushQueries()` - Waits for pending queries to settle

### 0.4 - Smoke test the `orvalFetch` auth integration

Write `packages/testing/unit/orval-fetch.test.ts`:
- Verify it reads `window.__privyGetAccessToken` when available
- Verify it adds `Authorization: Bearer <token>` header
- Verify 401 retry refreshes the token
- Verify non-OK responses throw `Error & { status }` with correct message extraction
- Verify 204/304 returns `{}` not a parse error

### 0.5 - Verify Providers wiring

Confirm `Providers.tsx` correctly exposes `__queryClient` on window for the `invalidate*Cache()` functions used by the stores. This is the bridge between non-React code and TanStack Query.

**Exit criteria for Phase 0:** All existing tests pass. All migrated hooks have test coverage. `orvalFetch` is tested. Build + lint are clean.

---

## Phase 1: Finish Remaining Schema Definitions

**Goal:** Bring OpenAPI coverage from 50% to ~80%, focusing on endpoints that have frontend consumers.

### 1.1 - Add definitions for endpoints used by migration candidates

These endpoints are called by existing hooks/components but lack OpenAPI definitions:

| Endpoint | Used By | Priority |
|----------|---------|----------|
| `POST /api/twitter/disconnect` | `useTwitterAuth.ts` | High |
| `GET /api/users/{userId}/portfolio-breakdown` | Components (portfolio page) | High |
| `POST/DELETE /api/chats/{id}/messages/{messageId}/reactions` | `useToggleReaction.ts` | High |
| `GET /api/nft/eligibility` | `useNftMint.ts` | Low |
| `GET /api/realtime/token` | `useSSE.ts` | Skip (SSE) |

Add these to the appropriate path definition files (`misc.ts`, `users.ts`, `chats.ts`).

### 1.2 - Add definitions for high-traffic component endpoints

These are `fetch()` calls in components that would benefit most from generated hooks:

| Area | Endpoints | Path File |
|------|-----------|-----------|
| Profile | `GET/PUT /api/users/{userId}/profile`, `POST /api/users/{userId}/follow` | `users.ts` |
| Moderation | `POST /api/moderation/reports`, `GET/POST /api/moderation/blocks` | New `moderation.ts` |
| Feedback | `POST /api/feedback/submit`, `POST /api/feedback/game-feedback` | New `feedback.ts` |
| Auth | `GET /api/auth/whoami`, `POST /api/auth/siwe/authenticate` | New `auth.ts` |
| Points | `POST /api/points/purchase/create-payment`, `POST /api/points/purchase/verify-payment` | `misc.ts` or new `points.ts` |

### 1.3 - Skip definitions for server-only / internal endpoints

These do NOT need OpenAPI definitions (no frontend consumer or SSE-only):

- `/api/cron/*` - Server-side scheduled jobs
- `/api/sse/*`, `/api/realtime/*` - EventSource streams (not REST)
- `/api/og/*` - Server-side image generation (tsx routes)
- `/api/embed/*` - Server-side rendered content
- `/api/_training/*` - Internal training pipeline
- `/api/a2a/*` - Agent-to-agent protocol
- `/api/frame/*` - Farcaster frame handlers
- `/api/docs` - Static documentation page

### 1.4 - Regenerate

```bash
bun run generate:api
bunx tsc --noEmit
bun run lint
bun test packages/testing/unit/
```

**Exit criteria for Phase 1:** OpenAPI covers all endpoints used by frontend hooks/components. Generated hooks exist for every consumer-facing endpoint. Build + tests pass.

---

## Phase 2: Migrate Remaining Hooks

**Goal:** Replace hand-written fetch hooks with generated hooks where appropriate.

### 2.1 - Easy wins (simple query/mutation, OpenAPI already defined)

| Hook | Generated Replacement | Migration Notes |
|------|-----------------------|-----------------|
| `useAgent0Reputation.ts` | `useGetAgent(agentId)` | Single GET, already defined |
| `useAgentActivity.ts` | `useGetAgentActivity(agentId)` | Already defined, add SSE overlay if needed |
| `useUserPositions.ts` | `useGetUserPositions(userId)` | Already defined in markets.ts |
| `usePerpHistory.ts` | `useGetPerpHistory(ticker)` | Already defined, preserve seed data fallback |
| `useSessionHeartbeat.ts` | `usePostHeartbeat()` mutation | Fire-and-forget, already defined |
| `useTwitterAuth.ts` | `useGetTwitterAuthStatus()` + `useDisconnectTwitter()` | After 1.1 adds disconnect |
| `useToggleReaction.ts` | `useAddReaction()` + `useRemoveReaction()` | After 1.1 adds reactions |

**Migration pattern for each:**
1. Create the new implementation importing from `@babylon/api-hooks`
2. Preserve the exact same public API (same function name, same return shape)
3. Write a test for the new implementation
4. Run `bun test` to verify
5. Update component imports if the module path changed (it shouldn't)

### 2.2 - Medium complexity (multi-endpoint orchestration)

| Hook | Approach |
|------|----------|
| `useTeamTradingSummary.ts` | Compose 3 generated hooks: `useGetUserBalance` + `useGetUserPositions` + `useListAgents`. Keep PnL calculation logic. |

### 2.3 - Keep hand-written (do NOT migrate)

| Hook | Reason |
|------|--------|
| `useSSE.ts` | EventSource stream management, not HTTP |
| `usePerpMarketStream.ts` | SSE subscription, not HTTP |
| `useTeamChat.ts` | Complex chat protocol with SSE + optimistic updates |
| `useNftMint.ts` | Server actions + multi-phase state machine |
| `useChatMessages.ts` | SSE-driven message stream |
| `useMarketPrices.ts` | SSE-only, no REST endpoint |

### 2.4 - Migrate component-level fetch calls

41 component files have inline `fetch()` calls. These should be migrated to use generated hooks:

**High priority (user-facing features):**
- `ProfilePageClient.tsx` - Profile data loading
- `InlineComposer.tsx` - Post creation
- `AgentCreate.tsx` - Agent creation flow (partially done)
- `PositionDetailModal.tsx` - Position data
- `BuyPointsModal.tsx` - Payment flow
- `ShareEarnModal.tsx` - Sharing/referral

**Medium priority (admin/settings):**
- `AdminManagementTab.tsx`, `AgentsTab.tsx`, `UserManagementTab.tsx`, etc. (15+ admin components)
- `PrivacyTab.tsx`, `ApiKeysTab.tsx` (settings)

**Low priority (minor features):**
- `MarketBiasIndicator.tsx`, `TrendingPanel.tsx`, `LatestNewsPanel.tsx` (feed widgets)
- `DailyStreakCard.tsx` (daily login)

**Pattern:** Replace `const res = await fetch('/api/foo'); const data = await res.json()` with `const { data } = useFoo()` from generated hooks. Remove manual auth header handling, error parsing, and loading state management.

**Exit criteria for Phase 2:** All hooks that can be migrated are migrated. Each migration has a test. Components use generated hooks instead of raw fetch. The `apiFetch` utility is only imported by files that genuinely need custom fetch behavior (auth, SSE setup).

---

## Phase 3: Type Consolidation

**Goal:** Eliminate duplicate type definitions. Generated types become the single source of truth.

### 3.1 - Audit local type definitions vs generated types

Check every interface in these files against generated models:
- `apps/web/src/types/markets.ts` - `PerpMarket` already re-exported, do the same for `PredictionMarket` once compatible
- `apps/web/src/types/` (all files) - Any type that has a generated equivalent should re-export

### 3.2 - Update `PredictionMarket` type

The local `PredictionMarket` in `@/types/markets` has different field shapes than the generated one (e.g., `id: number | string` vs `id: string`). Options:
- **Option A:** Update the OpenAPI schema to match the local type (if API actually returns `number | string`)
- **Option B:** Update local type to re-export from generated (if API always returns `string`)
- **Option C:** Keep local type as a frontend-specific alias with explicit casting (current approach)

Investigate the actual API response to decide.

### 3.3 - Remove deprecated backward-compat shims

Once all consumers are migrated:
- Remove `usePerpMarketsStore` deprecated export from `perpMarketsStore.ts`
- Remove `useWalletBalance.ts` deprecated re-export hook (if all consumers use the store directly)
- Remove local type interfaces that are now re-exported from `@babylon/api-hooks`

**Exit criteria for Phase 3:** No duplicate type definitions. Generated types are canonical. No deprecated shims remain.

---

## Phase 4: Infrastructure Cleanup

### 4.1 - Decide on `@babylon/api-client` package

Currently an empty shell. Options:
- **Remove it** if all consumers are React (use `@babylon/api-hooks` only)
- **Configure Orval** to also generate a vanilla fetch client (for server-side usage, scripts, tests)

Recommendation: **Remove for now.** Add later if server-side consumers emerge.

### 4.2 - Add `.gitignore` entries for generated files

```gitignore
# Generated API hooks (regenerate with: bun run generate:api)
packages/api-hooks/src/generated/
packages/api-hooks/dist/
openapi.json
```

Or alternatively, commit `openapi.json` as a checked-in artifact (useful for diffing API changes in PRs) and only ignore the generated TypeScript.

### 4.3 - Add CI pipeline step

In `.github/workflows/ci-tests.yml`, add before the build step:

```yaml
- name: Generate API hooks
  run: bun run generate:api

- name: Verify no spec drift
  run: |
    bun run generate:api
    git diff --exit-code openapi.json || (echo "OpenAPI spec is out of date. Run: bun run generate:api" && exit 1)
```

This prevents merging PRs where someone changed a Zod schema but forgot to regenerate.

### 4.4 - Remove old swagger infrastructure

Once all consumers are migrated and the old swagger system has no references:
- Delete `packages/api/src/swagger/config.ts` (if still exists)
- Remove `packages/api/src/swagger/index.ts` exports
- Remove `swagger-jsdoc` and `swagger-ui-express` dependencies (if any)

### 4.5 - Clean up `docs/research-openapi-codegen.md`

Convert from research notes into a concise developer guide:
- How to add a new API endpoint (write Zod schema -> regenerate -> use hook)
- How to modify an existing endpoint
- How to debug generation issues
- Link to Orval docs

### 4.6 - Remove `zod` dependency from `api-hooks`

The `api-hooks` package lists `zod` as a dependency but no generated file imports it. Remove it from `package.json`.

**Exit criteria for Phase 4:** No dead code. CI validates spec freshness. Developer documentation exists. Clean git history.

---

## Phase 5: Final Validation

### 5.1 - Full test suite

```bash
bun run generate:api
bunx tsc --noEmit
bun run lint
bun test packages/testing/unit/ --preload ./packages/testing/unit/preload.ts
bun test packages/testing/integration/ --preload ./packages/testing/integration/preload.ts
```

### 5.2 - Manual smoke test

Test these user flows in the running app:

| Flow | Components Touched |
|------|--------------------|
| View perp markets list | `perpMarketsStore`, `PerpsTradingTerminal` |
| Open/close a perp position | `usePerpTrade`, `PerpPositionsList`, `PerpTradingModal` |
| View prediction markets | `predictionMarketsStore`, `MarketsTradingTerminal` |
| View owned agents | `useOwnedAgents`, `AgentCreate` |
| Transfer points | `useTransferPoints`, `SendPointsModal` |
| Check wallet balance | `walletBalanceStore`, balance displays |
| Check unread messages | `useUnreadMessages`, notification badge |

### 5.3 - PR review checklist

- [ ] `bun run generate:api` produces identical output (deterministic)
- [ ] No console errors in browser dev tools
- [ ] Network tab shows correct auth headers on API calls
- [ ] 401 retry works (test by expiring a token)
- [ ] SSE real-time updates still work on perp markets page
- [ ] All generated files excluded from lint
- [ ] No `any` types leaked into consumer code
- [ ] Deleted hooks have no remaining importers
- [ ] `apiFetch` import count reduced vs main branch

---

## Work Order Summary

| Phase | Effort | Files Changed | Risk |
|-------|--------|---------------|------|
| **Phase 0: Validation Baseline** | 1-2 days | ~15 new test files | Low |
| **Phase 1: Schema Definitions** | 1-2 days | ~5 path files + regenerate | Low |
| **Phase 2: Hook Migration** | 3-5 days | ~30 hooks/components | Medium |
| **Phase 3: Type Consolidation** | 1 day | ~10 type files | Low |
| **Phase 4: Infrastructure Cleanup** | 1 day | CI, gitignore, docs | Low |
| **Phase 5: Final Validation** | 1 day | 0 (testing only) | Low |

**Total estimate: 8-12 days of focused work.**

---

## What NOT to Do

- Do NOT migrate SSE/EventSource hooks. They are fundamentally different from REST.
- Do NOT migrate server actions (`useNftMint`). They use a different execution model.
- Do NOT write OpenAPI definitions for cron/internal endpoints. They have no frontend consumer.
- Do NOT change API response shapes to match generated types. Fix the schema to match reality.
- Do NOT commit generated TypeScript files. Only commit `openapi.json` (if desired) and the Zod source schemas.
- Do NOT remove `apiFetch` utility entirely. Some files (auth, SSE setup) legitimately need it.
