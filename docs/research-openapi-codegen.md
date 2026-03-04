# Research: OpenAPI Specification & Client Code Generation for Babylon

## 1. Executive Summary

The Babylon codebase has **324 API route files** serving a Next.js App Router REST API, with **197+ client-side fetch calls** scattered across hooks, stores, and components. Each client-side API wrapper involves ~100-200 lines of boilerplate for loading states, error handling, abort controllers, and type normalization. An OpenAPI-first approach with client code generation (Orval) could replace **~10,700 lines of actively maintained boilerplate** with **~7,500 lines of write-once infrastructure** (response schemas + route registrations) plus zero-maintenance generated code. The primary benefit is not fewer lines — it's type safety end-to-end, consistency, and eliminating ongoing maintenance of data-fetching code.

**Key findings:**
- An OpenAPI spec already exists at `/api/docs` — it's generated from `@openapi` JSDoc tags + a manual fallback spec
- ~200 route files already have `@openapi` JSDoc annotations
- TanStack Query is installed but barely used (1 hook out of 47)
- Zod validation schemas already exist in `@babylon/shared` — these can generate OpenAPI schemas via `zod-to-openapi` or `zod-openapi`
- The `apiFetch` utility exists but is used in only ~15 places; most code uses raw `fetch()`
- Response helpers (`successResponse`, `errorResponse`) provide some standardization but responses aren't typed in the spec

---

## 2. Current Architecture

### 2.1 API Layer (Server)

| Aspect | Current State |
|--------|--------------|
| **Framework** | Next.js 16 App Router (`apps/web/src/app/api/`) |
| **Route count** | 324+ route files |
| **HTTP methods** | GET, POST, PUT, DELETE (no PATCH) |
| **Validation** | Zod schemas (inline + shared from `@babylon/shared`) |
| **Auth** | Privy JWT, SIWE, API keys, cron secrets |
| **Response helpers** | `successResponse<T>()`, `errorResponse()` from `@babylon/api` |
| **Error handling** | `withErrorHandling` wrapper, `ApiError` hierarchy |
| **Database** | Drizzle ORM (`@babylon/db`) with PostgreSQL |
| **OpenAPI** | Hybrid: JSDoc `@openapi` tags + manual spec in `generator.ts` |

**Route file locations (by domain):**

```
apps/web/src/app/api/
├── admin/          (~80 routes) — Admin dashboard endpoints
├── agents/         (~30 routes) — Agent CRUD, chat, team, A2A
├── auth/           (~15 routes) — Privy, SIWE, Twitter, Discord, Farcaster
├── chats/          (~15 routes) — Chat rooms, DMs, messages, reactions
├── cron/           (~20 routes) — Scheduled jobs (game tick, agent tick, etc.)
├── feed/           (~7 routes)  — Hot posts, widgets
├── feedback/       (~8 routes)  — User/agent/game feedback
├── groups/         (~8 routes)  — Group management
├── markets/        (~15 routes) — Predictions, perps, positions, bias
├── moderation/     (~4 routes)  — Reports, blocks, mutes, appeals
├── nft/            (~10 routes) — NFT minting, metadata, holdings
├── notifications/  (~3 routes)  — Notifications, mark-read
├── posts/          (~10 routes) — Posts, likes, replies, comments, shares
├── users/          (~25 routes) — Profiles, balance, follow, social
├── ...             (~75 routes) — Other: trades, stats, SSE, stripe, etc.
```

### 2.2 Client Layer (Frontend)

| Aspect | Current State |
|--------|--------------|
| **HTTP client** | Raw `fetch()` (~185 calls), `apiFetch()` (~15 calls) |
| **State management** | Zustand (10 stores), manual `useState` in hooks |
| **React Query** | Installed (`@tanstack/react-query@^5.90.8`) but only 1 hook uses it |
| **Custom hooks** | 47 hook files, ~21 wrap API calls |
| **Stores with API calls** | 4 stores (`perpMarkets`, `interactions`, `userPositions`, `predictionMarkets`) |
| **Components with direct fetch** | 100+ components call APIs inline |
| **Type sharing** | Partial — some types from `@babylon/shared`, many local duplicates |

### 2.3 Shared Types & Validation

The `@babylon/shared` package contains **13 Zod schema files** with **100+ exported schemas**:

```
packages/shared/src/validation/schemas/
├── agent.ts       — Agent creation, update schemas
├── chat.ts        — ChatMessageCreate, DMCreate, ChatQuery
├── common.ts      — Pagination, Money, Percentage, IdParam, etc.
├── feedback.ts    — FeedbackType
├── game.ts        — GameTick, ImageUpload, Registry, AwardPoints
├── market.ts      — OpenPerpPosition, BuyPredictionShares, etc.
├── moderation.ts  — BlockUser, MuteUser, Reports
├── monitoring.ts  — Monitoring schemas
├── onboarding.ts  — OnboardingProfile
├── post.ts        — Post creation, update schemas
├── trade.ts       — Trade schemas
└── user.ts        — UpdateUser, UserQuery, FollowUser, etc.
```

These Zod schemas are used for **request validation on the server**. They could also serve as the **single source of truth for OpenAPI schema generation**.

### 2.4 Existing OpenAPI Setup

The codebase already has a partial OpenAPI setup:

**Configuration** (`packages/api/src/swagger/config.ts`):
- OpenAPI 3.0.0 spec with title "Babylon API"
- Security schemes: `PrivyAuth` (JWT), `BearerAuth`, `CronSecret`
- Servers: dev (localhost:3000) and production (babylon.market)

**Auto-generator** (`packages/api/src/swagger/auto-generator.ts`):
- Uses `swagger-jsdoc` to scan route files for `@openapi` JSDoc comments
- Merges auto-generated spec with manual spec from `generator.ts`
- Serves combined spec at `GET /api/docs`

**Manual fallback** (`packages/api/src/swagger/generator.ts`):
- 1,110 lines of manually defined OpenAPI paths
- Covers a subset of routes (agents, posts, chats, users, trades, cron)
- Many schema definitions are incomplete (using `type: 'object'` without properties)

**Coverage:**
- ~200 route files have `@openapi` JSDoc annotations
- ~124 route files have NO annotations
- Quality varies — some have full request/response schemas, many have minimal stubs

---

## 3. Problems with the Current Approach

### 3.1 Massive Boilerplate per API Call

Every client-side API wrapper follows this ~150-line pattern:

```typescript
// Typical hook — useWalletBalance.ts (162 lines)
export function useWalletBalance(userId?: string | null, options = {}) {
  const [state, setState] = useState(defaultState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  const refresh = useCallback(async () => {
    if (!userId) { setState(defaultState); return; }
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/users/${userId}/balance`, {
        signal: controller.signal,
      });
      if (controller.signal.aborted) return;
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      if (controller.signal.aborted) return;
      setState({ balance: Number(data.balance), lifetimePnL: Number(data.lifetimePnL) });
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [userId]);

  useEffect(() => { void refresh(); return () => controllerRef.current?.abort(); }, [refresh]);
  useEffect(() => { /* 30s polling interval */ }, []);

  return { balance: state.balance, lifetimePnL: state.lifetimePnL, loading, error, refresh };
}
```

With Orval + TanStack Query, this entire hook becomes **~0 lines of hand-written code**:

```typescript
// Auto-generated by Orval — zero maintenance
import { useGetUserBalance } from './generated/api';

// Used in component:
const { data, isLoading, error, refetch } = useGetUserBalance(userId, {
  query: { refetchInterval: 30000 },
});
```

### 3.2 Inconsistent Error Handling

Error handling varies wildly across the codebase:

- Some hooks check `response.ok`, others use try-catch
- Some extract `error` from JSON, others use generic messages
- Some have retry logic, most don't
- Some use AbortController, some don't
- Toast notifications are added ad-hoc in components

### 3.3 Type Duplication & Drift

Types are defined in multiple places and can drift:

- `@babylon/shared` defines canonical types (`PerpPosition`, `UserPredictionPosition`)
- Hooks define local API payload types (`ApiPerpPositionPayload`, `ApiPredictionPositionPayload`)
- Components often use inline type assertions (`as SomeType`)
- Manual `toNumber()` normalization suggests server/client type mismatches

### 3.4 No Auth Standardization on Client

Authentication is handled differently everywhere:

- Some hooks use `apiFetch()` (auto-injects auth)
- Some manually call `getAccessToken()` and set Authorization headers
- Some use credentials: 'include' for cookies
- Some don't authenticate at all (even when they should)

### 3.5 Agent/LLM Code Proliferation

Without codegen, every time an AI agent needs to add a new API integration, it writes ~150 lines of boilerplate. This means:
- More code for agents to generate = more tokens = higher cost
- More surface area for bugs
- More code to review
- Patterns diverge over time

---

## 4. Proposed Solution: OpenAPI-First with Orval

### 4.1 Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    SOURCE OF TRUTH                       │
│                                                         │
│  Zod Schemas (@babylon/shared)                          │
│       ↓ (zod-openapi / zod-to-openapi)                  │
│  OpenAPI 3.1 Spec (generated at build time)             │
│       ↓ (orval)                                         │
│  Generated Client: API functions + TanStack Query hooks │
│       ↓                                                 │
│  React Components consume generated hooks               │
└─────────────────────────────────────────────────────────┘
```

### 4.2 Tool Selection

| Tool | Purpose | Why |
|------|---------|-----|
| **`zod-openapi`** (samchungy) | Generate OpenAPI 3.1 spec from Zod v4 schemas | Native Zod v4 support; uses `.meta()` API; no monkey-patching |
| **Orval** | Generate TypeScript API client + TanStack Query hooks from OpenAPI spec | Best-in-class for React Query codegen; supports custom fetch instances, MSW mocks |
| **TanStack Query v5** | Server state management | Already installed; provides caching, dedup, retries, refetching, optimistic updates |
| **`orvalFetch`** (new wrapper) | Adapts `apiFetch` to Orval's mutator signature | `apiFetch` returns `Response`; Orval needs `Promise<T>` |

### 4.3 Why Orval (vs Alternatives)

| Feature | Orval | openapi-typescript | openapi-codegen | Hey API |
|---------|-------|-------------------|-----------------|---------|
| TanStack Query hooks | Yes (built-in) | No | Yes | Yes |
| Custom fetch instance | Yes | N/A | Yes | Yes |
| MSW mock generation | Yes | No | No | No |
| Zod validation output | Yes (v3 only — NOT usable with Zod v4) | No | No | Yes |
| Mutator support | Yes | N/A | Limited | Limited |
| Active maintenance | Yes | Yes | Moderate | Yes |
| Next.js App Router | Yes | N/A | Yes | Yes |

Orval is the strongest choice because:
1. Native TanStack Query v5 hook generation
2. Custom `mutator` support — needs an adapter wrapper around `apiFetch` (see Section 11.4)
3. MSW mock generation for testing
4. Mature, well-documented, widely adopted
5. Note: Orval's Zod output mode generates v3 schemas — NOT compatible with this codebase's Zod v4. Use TypeScript types only.

---

## 5. Implementation Plan (SUPERSEDED — see Section 12 for corrected version)

### Phase 1: OpenAPI Spec Quality (Foundation)

**Goal:** Produce a complete, accurate OpenAPI 3.1 spec at build time.

**Tasks:**

1. **Install `@asteasolutions/zod-to-openapi`** — Convert existing Zod schemas to OpenAPI component schemas
2. **Create a spec generation script** (`scripts/generate-openapi.ts`):
   - Import all Zod schemas from `@babylon/shared`
   - Register them as OpenAPI components
   - Scan route files for endpoints and map them to schemas
   - Output `openapi.json` to the repo root (or `packages/api/`)
3. **Audit and complete `@openapi` JSDoc annotations**:
   - The ~124 routes without annotations need them
   - Existing annotations need request body and response schemas validated
   - Add `operationId` to every route (required for Orval to generate named functions)
4. **Standardize response shapes**:
   - Ensure all routes use `successResponse()` and `errorResponse()`
   - Define reusable response schemas in the OpenAPI spec
5. **Add the spec to CI** — Validate spec on every PR with `@redocly/cli` or `spectral`

**Estimated effort:** 3-5 days

**Risks:**
- Some routes have complex response shapes that are hard to describe in OpenAPI
- SSE endpoints (`/api/sse/*`) and streaming responses don't map to standard OpenAPI
- File upload endpoints need `multipart/form-data` schemas
- The A2A and MCP JSON-RPC endpoints use non-REST patterns

### Phase 2: Orval Setup & Initial Generation

**Goal:** Generate a TypeScript API client with TanStack Query hooks.

**Tasks:**

1. **Install Orval**: `bun add -D orval` in root or `apps/web`
2. **Create `orval.config.ts`**:

```typescript
import { defineConfig } from 'orval';

export default defineConfig({
  babylon: {
    input: {
      target: './openapi.json', // or URL: 'http://localhost:3000/api/docs'
    },
    output: {
      mode: 'tags-split', // one file per tag (agents, users, posts, etc.)
      target: 'apps/web/src/api/generated',
      schemas: 'apps/web/src/api/generated/model',
      client: 'react-query',
      override: {
        mutator: {
          path: 'apps/web/src/utils/api-fetch.ts',
          name: 'apiFetch',
        },
        query: {
          useQuery: true,
          useMutation: true,
          useInfinite: true,
          useSuspenseQuery: true,
        },
      },
    },
  },
});
```

3. **Add npm script**: `"generate:api": "orval"` in root `package.json`
4. **Generate initial client** and validate output
5. **Configure the `apiFetch` mutator** — Orval needs a custom instance that wraps `apiFetch` to match its expected signature

**Estimated effort:** 1-2 days

### Phase 3: Incremental Migration

**Goal:** Replace hand-written hooks/stores with generated hooks, domain by domain.

**Migration order (by impact and risk):**

| Priority | Domain | Files to Replace | Complexity |
|----------|--------|-----------------|------------|
| 1 | Markets (perps + predictions) | `perpMarketsStore.ts`, `predictionMarketsStore.ts`, `useUserPositions.ts`, `usePerpHistory.ts`, `usePredictionHistory.ts` | Medium — has polling, normalization |
| 2 | Users & Profiles | `useWalletBalance.ts`, `useProfileForm.ts`, `useSocialVerification.ts`, `useTwitterAuth.ts` | Low |
| 3 | Agents | `useOwnedAgents.ts`, `useAgentActivity.ts`, `useAgent0Reputation.ts` | Low |
| 4 | Social (Posts, Comments) | `interactionStore.ts`, `feedStore.ts` | High — optimistic updates |
| 5 | Chat | `useChatMessages.ts`, `useTeamChat.ts`, `useUnreadMessages.ts` | High — real-time, complex |
| 6 | Admin | 80+ admin routes, mostly in components | Low per route, high volume |
| 7 | Remaining | NFT, notifications, onboarding, moderation, etc. | Low-Medium |

**Per-domain migration pattern:**

1. Ensure all routes in the domain have complete `@openapi` annotations
2. Regenerate the client (`bun run generate:api`)
3. Replace the hand-written hook/store with the generated hook
4. Update consuming components (usually just import path changes)
5. Delete the old hook/store file
6. Test

**Estimated effort:** 2-4 weeks (can be done incrementally alongside feature work)

### Phase 4: Advanced Patterns

**Goal:** Handle edge cases and optimize.

**Tasks:**

1. **Optimistic updates** — Configure TanStack Query's `onMutate`/`onError`/`onSettled` for the interaction store (likes, follows, etc.)
2. **Polling** — Replace manual `setInterval` with `refetchInterval` in query options
3. **SSE integration** — TanStack Query can't auto-generate SSE hooks; keep manual SSE hooks but use query cache invalidation
4. **Infinite queries** — Use `useInfiniteQuery` for paginated endpoints (posts feed, chat messages)
5. **Request deduplication** — TanStack Query handles this automatically (no more manual `fetchPromise` patterns)
6. **MSW mocks** — Generate MSW handlers for testing
7. **Zod runtime validation** — Optionally generate Zod schemas from OpenAPI for runtime response validation

---

## 6. Impact Analysis

### 6.1 Code Change Estimates (Corrected — see Section 10 Issue 5 for audit)

**Code deleted (maintained code → zero-maintenance generated code):**

| Category | LOC Removed |
|----------|------------|
| Data-fetching hooks (21) | ~3,150 |
| Zustand stores with API calls (4) | ~1,300 |
| Component inline fetches (~100) | ~2,500 |
| Local API type definitions | ~500 |
| Swagger generator.ts + auto-generator.ts | ~1,237 |
| `@openapi` JSDoc comments (~190 files) | ~2,000 |
| **Subtotal deleted** | **~10,687** |

**Code added:**

| Category | LOC Added |
|----------|----------|
| Response Zod schemas (~250 new schemas) | ~2,500-3,750 |
| OpenAPI route registrations (~290 routes × ~15 lines) | ~4,350 |
| `orvalFetch` wrapper | ~30 |
| Orval config + generation script | ~80 |
| Package scaffolds (api-client, api-hooks) | ~50 |
| **Subtotal added (hand-written)** | **~7,010-8,210** |
| Orval generated output (committed, zero-maintenance) | ~5,000-10,000 |

**Net change in maintained code:** -3,500 to -2,500 lines (modest reduction)

**The real value is not fewer lines** — it's that the 7,000-8,000 lines of registry + schemas are write-once infrastructure (stable, rarely changes), while the 10,700 lines they replace were actively maintained, inconsistent, and duplicated across hooks/stores/components. The generated Orval output is zero-maintenance by definition.

### 6.2 Benefits

1. **Type safety end-to-end** — API changes automatically propagate to the client via codegen; TypeScript catches breaking changes at build time
2. **Reduced maintenance** — No more hand-writing fetch wrappers, loading states, error handling, abort controllers
3. **Consistent patterns** — Every API call uses the same auth, error handling, caching, and retry strategy
4. **Agent/LLM efficiency** — Agents only need to write the route + OpenAPI annotation; the client is auto-generated
5. **Built-in caching & dedup** — TanStack Query provides query caching, request deduplication, background refetching, and stale-while-revalidate
6. **Testing** — MSW mocks generated from the spec enable reliable integration testing
7. **API documentation** — The OpenAPI spec doubles as interactive API docs (Swagger UI already set up)

### 6.3 Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Incomplete/inaccurate OpenAPI spec | Generated client has wrong types | CI validation of spec; gradual migration with testing |
| Complex patterns (SSE, optimistic updates) | Can't be fully auto-generated | Keep thin manual wrappers that compose generated hooks |
| Team learning curve (TanStack Query) | Slower initial adoption | It's already installed; patterns are well-documented |
| Build time increase | Slower CI | Orval generation is fast (~2-5s for 300 routes); cache output |
| Breaking change during migration | Regressions | Migrate one domain at a time; keep old hooks until validated |
| `apiFetch` mutator compatibility | Orval may need a specific function signature | Write a thin adapter if needed |

---

## 7. Constraints & Edge Cases

### 7.1 Non-REST Endpoints

These endpoints don't follow standard REST patterns and need special handling:

- **SSE endpoints** (`/api/sse/events`, `/api/sse/stats`) — Not representable in OpenAPI; keep manual EventSource hooks, but use query cache invalidation from SSE events
- **JSON-RPC endpoints** (`/api/a2a`, `/api/mcp`) — Use JSON-RPC 2.0, not REST; exclude from OpenAPI or document as POST with JSON-RPC body schema
- **Streaming responses** (agent chat) — May use ReadableStream; document as standard POST with note about streaming
- **File uploads** (`/api/upload/image`, `/api/upload/banner`) — Use `multipart/form-data`; Orval supports this with proper schema
- **OG image routes** (`/api/og/pnl/[userId]`, `/api/og/referral/[userId]`) — Return images, not JSON; exclude from client generation

### 7.2 Dynamic Route Parameters

Next.js dynamic segments (`[userId]`, `[agentId]`, `[marketId]`) map to OpenAPI path parameters. Orval handles these well, but `operationId` naming needs to be consistent:

```yaml
/api/users/{userId}/balance:
  get:
    operationId: getUserBalance  # Generates: useGetUserBalance()
```

### 7.3 Authentication Variants

The API has 5+ auth patterns. The Orval mutator (`apiFetch`) handles the primary Privy JWT auth. For other patterns:

- **Cron auth** — Server-to-server; no client generation needed
- **API key auth** — Used by external integrations; separate client
- **Optional auth** — Orval can generate hooks that work with or without auth
- **Admin auth** — Same as Privy auth but with role checking server-side

### 7.4 Response Normalization

Some hooks normalize API responses (e.g., `toNumber()` in `useUserPositions.ts`). This suggests the API returns strings for numeric fields (likely from Drizzle's `numeric`/`decimal` column types). Options:

1. Fix the API to return proper numbers (preferred)
2. Use Orval's response transformer to normalize
3. Use Zod schemas with `.transform()` in the generated output

---

## 8. Dependency Summary

### New Dependencies

| Package | Purpose | Install Location | Dev? | Zod v4 Status |
|---------|---------|-----------------|------|--------------|
| `zod-openapi` (samchungy) | Zod → OpenAPI spec generation | `packages/api` | No | **Native v4 support (v5.4.6)** |
| `orval` | OpenAPI → TypeScript client + TanStack Query hooks | Root | Yes | N/A (doesn't use Zod) |
| `@redocly/cli` | OpenAPI spec linting/validation in CI | Root | Yes | N/A |

### NOT Using (Zod v4 incompatible)

| Package | Why Not |
|---------|---------|
| `@asteasolutions/zod-to-openapi` | Relies on `.openapi()` monkey-patch; broken with Zod v4 import; open issues #340, #324 |
| `drizzle-zod` | Peer dep requires `zod@^3.25.1`; install fails with Zod v4 without `--force`; type compat issues |
| Orval Zod output (`client: 'zod'`) | Generates Zod v3 schemas; open issue #2042 for v4 support |

### Already Installed (Leverage)

| Package | Version | Role in New System |
|---------|---------|-------------------|
| `@tanstack/react-query` | ^5.90.8 | Core — generated hooks use this |
| `zod` | **4.3.6** | Core — single source of truth for schemas; uses `.meta()` API |
| `drizzle-orm` | ^0.44.7 | DB layer |
| `swagger-ui-react` | ^5.30.2 | Keep for runtime API docs |

### Can Be Removed After Migration

| Package | Reason |
|---------|--------|
| `swagger-jsdoc` | Replaced by `zod-openapi` `createDocument()` |

---

## 9. Decisions (Resolved)

### 9.1 Code-First (Confirmed)

**Decision:** Code-first. The OpenAPI spec is generated from code, never hand-written.

**Rationale:** Same philosophy as Rust's `utoipa` — schemas live in code, the spec is a build artifact. Existing `@openapi` JSDoc comments should be removed in favor of a fully programmatic approach driven by Zod schemas.

### 9.2 TypeScript utoipa Equivalents — Tool Comparison

The utoipa model (annotate your types/handlers, generate spec automatically) has several TypeScript analogues. Here's how they compare for this codebase:

| Library | Approach | Next.js App Router | Zod-Native | Maturity | Best For |
|---------|----------|-------------------|------------|----------|----------|
| **`@asteasolutions/zod-to-openapi`** | Registry pattern — register schemas + paths programmatically, generate spec | Manual wiring needed | Yes | 1.6M weekly downloads, v8.4 | Full control; works with any framework |
| **`zod-openapi`** (samchungy) | Uses Zod v4 native `.meta()`; `createDocument()` API | Manual wiring needed | **Yes — native v4 support** | 604 GitHub stars, zero deps | **Recommended for Zod v4 projects** |
| **`next-openapi-gen`** | Scans Next.js route files, reads Zod/TS/Drizzle-Zod schemas, auto-generates spec | Built for it | Yes + Drizzle-Zod | 7.1K weekly downloads, v0.10 | Next.js-specific, lowest friction |
| **`@anatine/zod-openapi`** | `extendApi()` wrapper for Zod schemas | No special support | Yes | Moderate | Schema conversion only |

**Recommendation: `zod-openapi` (samchungy)** — The only viable option for Zod v4:

1. **Native Zod v4 support** — uses `.meta()` API, no monkey-patching. Version 5.4.6 specifically fixed Zod 4.3+ compatibility
2. **`createDocument()` API** — pass in your paths with Zod schemas, get back a complete OpenAPI 3.1 spec. No separate registry needed
3. **Schemas with `.meta({ id: 'Name' })` auto-register as `components/schemas`** — similar to utoipa's `#[derive(ToSchema)]`
4. **Zero dependencies**, actively maintained

**NOT recommended: `@asteasolutions/zod-to-openapi`** — Despite higher adoption (1.6M downloads), it has broken Zod v4 compatibility. The `extendZodWithOpenApi()` monkey-patch doesn't work with Zod v4's import, and `.openapi()` doesn't exist on Zod v4 schemas. Users in issue #340 were directed to switch to `zod-openapi`.

**NOT recommended: `next-openapi-gen`** — Auto-scans route files, but less control and younger project. Not verified against Zod v4.

### 9.3 Monorepo Placement (Confirmed)

**Decision:** Separate packages.

```
packages/
├── api-client/     # Generated TypeScript API client functions (framework-agnostic)
│   ├── src/
│   │   └── generated/    # Orval output: API functions + types
│   └── package.json      # @babylon/api-client
├── api-hooks/      # Generated TanStack Query hooks (React-specific)
│   ├── src/
│   │   └── generated/    # Orval output: useQuery/useMutation hooks
│   └── package.json      # @babylon/api-hooks
```

This lets `apps/web` use `@babylon/api-hooks` and `apps/cli` (or future apps) use `@babylon/api-client` directly.

### 9.4 Git Tracking (Confirmed)

**Decision:** Committed to git. Generation runs in CI/dev as part of the build workflow.

- `turbo.json` gets a `generate:api` task that runs before `build`
- Dev workflow: `bun run generate:api` runs on file changes or manually
- CI validates that committed generated files match fresh generation (no drift)

### 9.5 Existing JSDoc Comments (Confirmed)

**Decision:** Remove all `@openapi` JSDoc comments from route files. The OpenAPI spec will be generated entirely from the Zod schema registry — no inline annotations needed.

The existing `packages/api/src/swagger/generator.ts` (1,110 lines of manual spec) and `auto-generator.ts` (JSDoc scanner) can be replaced by a single generation script.

### 9.6 Drizzle Numeric Types (Researched)

**Finding:** The codebase has a split numeric type situation:

| Column Type | Drizzle Function | TypeScript Type | Runtime Value | Count |
|-------------|-----------------|-----------------|---------------|-------|
| `decimal` | `decimal('col', { precision: 18, scale: 2 })` | `string` | `string` | ~40 columns |
| `doublePrecision` | `doublePrecision('col')` | `number` | `number` | ~80 columns |

**`decimal` columns** (typed as `string`) are used for:
- Financial values: `virtualBalance`, `totalDeposited`, `totalWithdrawn`, `lifetimePnL`
- Transaction amounts: `amount`, `balanceBefore`, `balanceAfter`, `feeAmount`
- Market shares: `yesShares`, `noShares`, `liquidity`, `shares`
- Defaults are strings: `.default('1000')`, `.default('0')`

**`doublePrecision` columns** (typed as `number`) are used for:
- Scores: `qualityScore`, `trustScore`, `reputationScore`
- Prices: `currentPrice`, `entryPrice`, `markPrice`
- Percentages: `winRate`, `changePercent`, `unrealizedPnLPercent`
- Defaults are numbers: `.default(0.05)`, `.default(1.0)`

**The problem:** API routes manually convert `decimal` strings to numbers with inconsistent patterns:
- `Number(dbUser.virtualBalance ?? 0)` — most common
- `Number.parseFloat(pos.size!.toString())` — redundant toString
- Direct `Number()` casts scattered across routes

**`drizzle-orm/zod` does NOT exist in v0.44.7.** The `drizzle-orm` package (443 exports) has no `./zod` subpath. The separate `drizzle-zod` package must be installed instead.

**Option A: `drizzle-zod` — NOT VIABLE**
- `drizzle-zod@0.8.2` has peer dep `zod@^3.25.1` — conflicts with installed `zod@4.3.6`
- Installation requires `--force` and has known TypeScript type compatibility issues under Zod v4
- Even if it worked, generates schemas matching raw DB shape, not API response shape

**Option B: Write API response schemas manually (recommended — only viable path with Zod v4)**
- Define Zod schemas that match the actual API response shapes
- More work upfront but more accurate — DB schemas often don't match API responses
- Only ~5 response schemas exist today; ~250+ need to be written
- Use the actual route handler code as reference for what each route returns

```typescript
// Manual response schema — matches what the route actually returns
const GetUserBalanceResponseSchema = z.object({
  balance: z.number(),
  lifetimePnL: z.number(),
}).meta({ id: 'GetUserBalanceResponse' });

// NOT this — DB shape ≠ API response shape
// const UserSelectSchema = createSelectSchema(users);
```

**For decimal handling:** Standardize conversion in the API routes themselves (convert `decimal` strings to numbers before returning), then document as `z.number()` in the response schema. Don't use `z.transform()` for OpenAPI schemas — Zod v4 changed transform behavior and it makes schemas one-directional. Instead, use `.meta({ override: { type: 'number' } })` for explicit type overrides when needed.

---

## 10. LARP Assessment Round 1 — Issues Found & Corrected

This section documents problems found during the first critical validation of the plan.
See also: **Section 10B** for Round 2 findings (Zod v4 impact).

### CRITICAL Issue 1: `drizzle-orm/zod` Does Not Exist

**Claim (Section 9.6):** "Drizzle v0.44.7 (installed) has built-in Zod support via `drizzle-orm/zod`"

**Reality:** `drizzle-orm@0.44.7` does NOT export a `./zod` subpath. Running `import { createSelectSchema } from 'drizzle-orm/zod'` fails with: `Package subpath './zod' is not defined by "exports"`. The package.json has 443 exports — none contain "zod". The built-in Zod support was announced for future versions but does not exist in v0.44.7.

**Impact:** The entire "Drizzle → Zod → OpenAPI" pipeline described in the original plan does not work out of the box. The `createSelectSchema(users)` code example in Section 9.6 was fictional at this version.

**Fix applied (Section 9.6):** Write response schemas manually. `drizzle-zod` is not viable either — it has a `zod@^3.25.1` peer dep that conflicts with the installed `zod@4.3.6` (see Round 2 Issue 11).

### CRITICAL Issue 2: `apiFetch` Signature is Incompatible with Orval's Mutator

**Claim (Sections 4.2, original 10.4):** "Can plug in the existing `apiFetch` utility" as Orval's mutator

**Reality:** The signatures are fundamentally different:

```typescript
// Current apiFetch — returns raw Response
async function apiFetch(input: RequestInfo, init?: ApiFetchOptions): Promise<Response>

// Orval expects — returns parsed JSON as generic T
async function customFetch<T>(url: string, options: RequestInit): Promise<T>
```

Orval's mutator must: (1) accept `(url: string, options: RequestInit)`, (2) return `Promise<T>` (parsed JSON, not raw `Response`), (3) throw on non-OK responses so React Query can catch errors.

**Impact:** Cannot point Orval at `apiFetch` and have it work. A new adapter function is required.

**Fix applied (Section 11.4):** Added `orvalFetch` wrapper that uses `apiFetch` internally but conforms to Orval's expected signature.

### MAJOR Issue 3: Response Shapes Are Not Standardized

**Claim (Section 2.1):** "Response helpers (`successResponse<T>()`, `errorResponse()`) provide some standardization"

**Reality:** `successResponse<T>(data)` calls `NextResponse.json(data)` — it passes `data` through directly without wrapping. There is NO uniform envelope. Across 324 routes:

- ~188 files use `successResponse()` — passes data through as-is, no wrapper
- ~140+ files use `NextResponse.json()` directly — also no wrapper
- Many files use BOTH in different handlers
- Response shapes are entirely ad-hoc per route: `{ user, authenticated }`, `{ agents: [...] }`, `{ success: true, stats: {...} }`, `{ balance, lifetimePnL }`

**Impact:** Every single route needs its response schema defined individually. There is no generic `{ data: T }` wrapper schema to reuse. The Phase 3 effort estimate in the original plan did not account for this.

### MAJOR Issue 4: Zod Schemas Are Mostly Request-Only

**Claim (Section 2.3):** "100+ exported schemas... could serve as the single source of truth for OpenAPI schema generation"

**Reality:** The 100+ schemas are almost entirely for **request validation**. Only **6 response schemas** exist:
- `UserResponseSchema`, `UserListResponseSchema`
- `SuccessResponseSchema` (generic `{ success: boolean }`)
- `ErrorResponseSchema`
- `TradeExecutionResponseSchema`, `PositionResponseSchema`

**~290 routes need new response Zod schemas written from scratch.** This is the single largest hidden effort — easily 2-4 weeks of work not originally accounted for.

**Fix applied:** Phase 2 in the revised implementation plan (Section 12) now explicitly accounts for writing ~250 response schemas at ~2,500-3,750 lines.

### MAJOR Issue 5: Code Reduction Math Was Misleading

**Original claim (Section 6.1):** "~7,450 lines reduced"

**Reality:** The registry pattern requires ~15-25 lines per route registration (290 routes = ~4,350 lines). Plus ~250 new response schemas (~2,500-3,750 lines). Total new code: ~7,000-8,000 lines. This is close to the ~10,700 lines being deleted.

**Fix applied (Section 6.1):** Reframed as honest accounting. Net maintained code reduction is ~3,200 lines. The real benefit is not fewer lines — it's that the new code is write-once infrastructure while the old code required ongoing maintenance.

### MODERATE Issue 6: `z.transform()` Has OpenAPI Limitations

**Claim (Section 9.6):** "Use `.transform(Number)` for decimal-to-number conversion"

**Reality:** `@asteasolutions/zod-to-openapi` handles transforms correctly in Zod v3, but Zod v4 breaks this behavior. Additionally, transforms make schemas one-directional.

**Fix applied (Section 9.6):** Recommend `.meta({ override: { type: 'number' } })` metadata override (Zod v4 / `zod-openapi` syntax) or fixing the API to return numbers directly, rather than relying on transform inference.

### MODERATE Issue 7: 11 Routes Return Non-JSON

**Verified:** 11 route files return non-JSON responses (redirects, images, SSE streams, ReadableStream). These must be excluded from OpenAPI client generation.

### MINOR Issue 8: Route Count Verified

Route count of 324 is exactly confirmed. `@openapi` annotation count of ~190 files is approximately correct.

---

## 10B. LARP Assessment Round 2 — Zod v4 Impact

The codebase runs **Zod v4.3.6** (not v3). This was not caught in Round 1 and invalidates the primary tool recommendation.

### CRITICAL Issue 9: `@asteasolutions/zod-to-openapi` Has Broken Zod v4 Compatibility

**Claim (Section 9.2):** "Recommendation: `@asteasolutions/zod-to-openapi` — It's the most utoipa-like"

**Reality verified:**

1. Zod v4 does NOT have `.openapi()` on schemas — confirmed by running `typeof z.object({}).openapi === 'undefined'`
2. Zod v4 uses `.meta()` natively for metadata — confirmed by running `typeof z.object({}).meta === 'function'`
3. `@asteasolutions/zod-to-openapi` relies on `extendZodWithOpenApi()` to monkey-patch `.openapi()` onto Zod schemas. This has a [known open issue (#340)](https://github.com/asteasolutions/zod-to-openapi/issues/340) with Zod v4 — users in the issue were told to switch to `zod-openapi` instead.
4. The library's `v8.4.1` added some Zod v4 fixes but the `.meta()` vs `.openapi()` API gap remains unresolved. The `.meta()` support request (issue #324) is still open.

**Impact:** Every code example in the plan that uses `.openapi('SchemaName')` or `registry.registerPath()` (the `@asteasolutions/zod-to-openapi` API) is invalid for this codebase.

**Fix:** Switch recommendation to **`zod-openapi` (by samchungy)** which:
- Natively supports Zod v4 (v5.4.6 specifically fixed Zod 4.3+ issues)
- Uses `.meta()` instead of `.openapi()` — matches Zod v4's native API
- Has `createDocument()` instead of `OpenAPIRegistry` + `OpenApiGeneratorV31`
- Has `registerPath()` helper for defining routes
- No monkey-patching required — just `import 'zod-openapi/extend'` for type support
- Actively maintained with quick Zod v4 compatibility fixes

### CRITICAL Issue 10: All Code Examples Use Wrong API

Every code example in Sections 9.2, 11.2, 11.3 uses the `@asteasolutions/zod-to-openapi` API:

```typescript
// WRONG — @asteasolutions API (not Zod v4 compatible)
import { OpenAPIRegistry, OpenApiGeneratorV31 } from '@asteasolutions/zod-to-openapi';
const registry = new OpenAPIRegistry();
registry.registerPath({ ... });
z.object({ ... }).openapi('SchemaName');
```

Must be replaced with:

```typescript
// CORRECT — zod-openapi API (Zod v4 native)
import { createDocument } from 'zod-openapi';
import 'zod-openapi/extend';

z.object({ ... }).meta({ id: 'SchemaName', description: '...' });

const doc = createDocument({
  openapi: '3.1.0',
  info: { title: 'Babylon API', version: '1.0.0' },
  paths: {
    '/api/users/{userId}/balance': {
      get: {
        requestParams: { path: z.object({ userId: z.string() }) },
        responses: {
          '200': {
            description: 'User balance',
            content: {
              'application/json': {
                schema: z.object({
                  balance: z.number(),
                  lifetimePnL: z.number(),
                }),
              },
            },
          },
        },
      },
    },
  },
});
```

### MAJOR Issue 11: `drizzle-zod` Has Zod v4 Peer Dependency Conflict

**Claim (Section 9.6):** "Install the separate `drizzle-zod` package"

**Reality:** `drizzle-zod@0.8.2` lists `zod@^3.25.1` as a peer dependency. Installing it with `zod@4.3.6` will fail with `ERESOLVE` errors unless `--force` is used. Additionally, users report TypeScript type compatibility issues when extending schemas created by `createSelectSchema` under Zod v4.

**Impact:** `drizzle-zod` is not a reliable option for generating base schemas. The recommendation to use it as a "starting point" is risky.

**Fix:** Remove `drizzle-zod` from the dependency list. Write response schemas manually — this was already the recommended path, and the Zod v4 incompatibility makes it the only reliable path.

### MAJOR Issue 12: Orval's Zod Output May Not Generate v4-Compatible Schemas

**Claim (Section 4.3):** "Orval... Zod validation output: Yes"

**Reality:** Orval's Zod schema generation targets Zod v3 API. There's an [open issue (#2042)](https://github.com/orval-labs/orval/issues/2042) tracking Zod v4 support. Users have also reported [issue #2249](https://github.com/orval-labs/orval/issues/2249) where Orval generates incomplete Zod schemas with Zod v4 string formats.

**Impact:** If you want Orval to generate Zod runtime validation schemas alongside the React Query hooks, those schemas may use v3 API and fail at runtime with Zod v4. However, this is an **optional** Orval feature — the core use case (generating TypeScript types + React Query hooks with a custom fetch client) does NOT require Zod output.

**Fix:** Don't use Orval's Zod output mode. Use Orval for TypeScript types + React Query hooks only (which are Zod-independent). Runtime validation stays with the hand-written Zod schemas already in `@babylon/shared`.

### MODERATE Issue 13: Plan Still References Section Numbers That Shifted

The plan has cross-references like "Section 9.6", "Section 11.4" but the LARP assessment insertions shifted section numbers. This makes the document harder to follow.

**Fix:** Applied below — all cross-references updated.

### Summary: Corrected Tool Stack

| Role | Original Plan | Corrected |
|------|--------------|-----------|
| Zod → OpenAPI schemas | `@asteasolutions/zod-to-openapi` | **`zod-openapi` (samchungy v5.4.6+)** |
| Schema metadata API | `.openapi('Name')` | **`.meta({ id: 'Name' })`** |
| Spec generation API | `OpenAPIRegistry` + `OpenApiGeneratorV31` | **`createDocument()`** |
| Drizzle → Zod base schemas | `drizzle-zod` | **Manual authoring** (drizzle-zod has Zod v4 peer dep conflict) |
| Orval Zod runtime validation | `client: 'zod'` | **Don't use** (Zod v4 incompatible) |
| Orval React Query hooks | `client: 'react-query'` | **Same** (works, Zod-independent) |
| Orval TypeScript types | Auto-generated | **Same** (works) |

---

## 11. Revised Architecture (Post-Round 2)

### 11.1 Schema Flow

```
Zod v4 Schemas — TWO categories:
    │
    ├── REQUEST schemas (packages/shared — ~100 existing)
    │   Used in API routes for request validation (already done)
    │   Use .meta({ id: 'Name' }) for OpenAPI component registration
    │
    ├── RESPONSE schemas (packages/shared — ~5 existing, ~250 needed)
    │   Defines what each route actually returns
    │   Must be authored manually (DB shape ≠ API response shape)
    │
    ├── Both passed to createDocument() from zod-openapi
    │   Schemas with .meta({ id: 'X' }) auto-register as components
    │
    ▼
OpenAPI 3.1 Spec (openapi.json — build artifact, committed)
    │
    ├── Orval generates (TypeScript types + React Query hooks ONLY,
    │   NOT Zod schemas — Orval's Zod output is v3-only):
    │   ├── packages/api-client/  — typed fetch functions
    │   └── packages/api-hooks/   — TanStack Query hooks
    │
    ├── Swagger UI / Scalar (runtime docs)
    │
    ▼
React Components consume @babylon/api-hooks
    via orvalFetch wrapper (adapts apiFetch to Orval's expected signature)
```

### 11.2 Route Definition Pattern

Instead of JSDoc comments, routes are defined as typed objects using `zod-openapi`'s `createDocument` API. Each domain gets a file that exports its paths:

```typescript
// packages/api/src/openapi/paths/users.ts

import { z } from 'zod';
import 'zod-openapi/extend';
import type { ZodOpenApiPathsObject } from 'zod-openapi';

const GetUserBalanceResponse = z.object({
  balance: z.number(),
  lifetimePnL: z.number(),
}).meta({ id: 'GetUserBalanceResponse' });

export const userPaths: ZodOpenApiPathsObject = {
  '/api/users/{userId}/balance': {
    get: {
      operationId: 'getUserBalance',
      tags: ['Users'],
      security: [{ PrivyAuth: [] }],
      requestParams: {
        path: z.object({ userId: z.string() }),
      },
      responses: {
        '200': {
          description: 'User balance',
          content: {
            'application/json': { schema: GetUserBalanceResponse },
          },
        },
        '401': { description: 'Unauthorized' },
        '404': { description: 'User not found' },
      },
    },
  },
};
```

### 11.3 Generation Script

```typescript
// scripts/generate-openapi.ts

import { createDocument } from 'zod-openapi';
import 'zod-openapi/extend';

// Import path definitions from each domain
import { userPaths } from '../packages/api/src/openapi/paths/users';
import { agentPaths } from '../packages/api/src/openapi/paths/agents';
import { marketPaths } from '../packages/api/src/openapi/paths/markets';
import { postPaths } from '../packages/api/src/openapi/paths/posts';
// ... other domains

const spec = createDocument({
  openapi: '3.1.0',
  info: {
    title: 'Babylon API',
    version: '1.0.0',
    description: 'API documentation for Babylon',
  },
  servers: [
    { url: 'http://localhost:3000', description: 'Development' },
    { url: 'https://babylon.market', description: 'Production' },
  ],
  components: {
    securitySchemes: {
      PrivyAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Privy authentication token',
      },
    },
  },
  paths: {
    ...userPaths,
    ...agentPaths,
    ...marketPaths,
    ...postPaths,
    // ... other domains
  },
});

Bun.write('openapi.json', JSON.stringify(spec, null, 2));
console.log('Generated openapi.json');
```

Note: `createDocument` automatically collects all schemas with `.meta({ id: '...' })` and places them in `components/schemas`. No manual registry needed.

### 11.4 Orval-Compatible Fetch Wrapper

The existing `apiFetch` returns `Promise<Response>`. Orval expects `Promise<T>` (parsed JSON). A wrapper is required:

```typescript
// packages/api-hooks/src/orval-fetch.ts
import { apiFetch } from '../../utils/api-fetch';

export const orvalFetch = async <T>(url: string, options: RequestInit): Promise<T> => {
  const response = await apiFetch(url, options);

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const message = body?.error?.message || body?.message || `Request failed: ${response.status}`;
    throw new Error(message);
  }

  const contentType = response.headers.get('content-type');
  if (contentType?.includes('application/json')) {
    return response.json() as Promise<T>;
  }
  return response.text() as unknown as Promise<T>;
};
```

### 11.5 Orval Configuration

```typescript
// orval.config.ts

import { defineConfig } from 'orval';

export default defineConfig({
  'babylon-client': {
    input: { target: './openapi.json' },
    output: {
      mode: 'tags-split',
      target: 'packages/api-client/src/generated',
      schemas: 'packages/api-client/src/generated/model',
      client: 'fetch',
      httpClient: 'fetch',
    },
  },
  'babylon-hooks': {
    input: { target: './openapi.json' },
    output: {
      mode: 'tags-split',
      target: 'packages/api-hooks/src/generated',
      schemas: 'packages/api-hooks/src/generated/model',
      client: 'react-query',
      httpClient: 'fetch',
      override: {
        mutator: {
          path: './packages/api-hooks/src/orval-fetch.ts',
          name: 'orvalFetch',
        },
        query: {
          useQuery: true,
          useMutation: true,
          useInfinite: true,
          useSuspenseQuery: true,
        },
      },
    },
  },
});
```

---

## 12. Revised Implementation Plan (Post-LARP)

### Phase 1: Foundation + Proof of Concept (3-5 days)

**Goal:** End-to-end proof that the pipeline works, with 5 real routes.

1. Install dependencies:
   - `zod-openapi` (samchungy, v5.4.6+) in `packages/api`
   - `orval` in root (dev dep)
2. Add `import 'zod-openapi/extend'` to enable `.meta()` type support across the codebase
3. Create `packages/api-client/` and `packages/api-hooks/` package scaffolds
4. **Write the `orvalFetch` wrapper** (see Section 11.4) — this is the glue between `apiFetch` and Orval
5. **Write 5 response Zod schemas manually** for: `GET /api/health`, `GET /api/users/{userId}/balance`, `GET /api/agents`, `GET /api/stats`, `GET /api/posts`
6. Define those 5 routes as path objects with request + response schemas (see Section 11.2 pattern)
7. Create `scripts/generate-openapi.ts` using `createDocument()` from `zod-openapi` and generate `openapi.json`
8. Run Orval to generate client + hooks
9. **Replace `useWalletBalance` hook** with the generated hook in one component
10. Verify the full pipeline works end-to-end: schema → spec → codegen → hook → component → working UI

**Success criteria:** The generated `useGetUserBalance` hook fetches data, handles errors, and displays correctly in the app with zero hand-written fetch code.

**Known risk:** The `orvalFetch` wrapper signature may need iteration to match Orval's exact expectations. Budget time for debugging.

### Phase 2: Scale Route Registration + Response Schemas (2-4 weeks)

**Goal:** Register all client-consumed routes with accurate response schemas.

**Honest assessment:** This is the largest phase because ~300 response Zod schemas need to be written. Not all 324 routes need client codegen — exclude:
- ~20 cron routes (server-to-server only)
- ~11 non-JSON routes (redirects, images, SSE, streaming)
- Routes only used by external integrations

Estimated routes needing registration: **~290 routes**
Estimated response schemas to write: **~250** (some routes share response shapes)

**Approach:** Migrate domain by domain. For each domain:
1. Read the actual route handlers to understand response shapes
2. Write response Zod schemas that match the real data
3. Define routes as path objects with request + response schemas
4. Regenerate spec and client
5. Verify generated types match what the route actually returns

**Domain order (by value — routes that have existing client-side consumers first):**

| Priority | Domain | Routes | New Response Schemas | Effort |
|----------|--------|--------|---------------------|--------|
| 1 | Markets | ~15 | ~10 | 2-3 days |
| 2 | Users & Profiles | ~25 | ~15 | 2-3 days |
| 3 | Agents | ~30 | ~20 | 2-3 days |
| 4 | Posts & Comments | ~15 | ~8 | 1-2 days |
| 5 | Chats | ~15 | ~10 | 1-2 days |
| 6 | Feed, Notifications, Groups | ~20 | ~12 | 1-2 days |
| 7 | Auth, Moderation, NFT | ~25 | ~15 | 2-3 days |
| 8 | Admin | ~80 | ~50 | 3-5 days |
| 9 | Remaining (feedback, onboarding, etc.) | ~65 | ~40 | 2-3 days |

**Total: ~16-26 working days** — can be parallelized or done incrementally.

### Phase 3: Client Migration (2-3 weeks, incremental)

**Goal:** Replace hand-written hooks/stores with generated hooks, domain by domain.

**Per-domain migration:**
1. Ensure routes for that domain are registered (Phase 2)
2. Regenerate client (`bun run generate:api`)
3. Replace the hand-written hook/store with the generated hook
4. Update consuming components (import path changes + adjust for TanStack Query API)
5. Handle domain-specific patterns:
   - **Polling:** Replace `setInterval` with `refetchInterval` option
   - **Optimistic updates:** Add `onMutate`/`onError`/`onSettled` to mutation options
   - **Normalization:** Remove `toNumber()` if API is fixed; or add Orval response transformer
6. Delete the old hook/store file
7. Test

**Migration complexity by hook:**

| Hook/Store | Replacement Difficulty | Notes |
|-----------|----------------------|-------|
| `useWalletBalance` | Easy | Simple GET + polling |
| `useOwnedAgents` | Easy | Simple GET with auth |
| `useUserPositions` | Medium | Response normalization (toNumber) |
| `usePerpHistory`, `usePredictionHistory` | Easy | Simple GETs |
| `useAgentActivity`, `useAgent0Reputation` | Easy | Simple GETs |
| `useProfileForm` | Medium | POST mutation |
| `useTransferPoints` | Easy | Already uses React Query |
| `perpMarketsStore` | Medium | Has polling + dedup (TanStack Query handles both) |
| `predictionMarketsStore` | Medium | Same as perpMarkets |
| `interactionStore` | Hard | Optimistic updates for likes/follows/shares |
| `useTeamChat` | Hard | 1,469 lines, multiple endpoints, real-time, optimistic updates |
| `feedStore` | Medium | Optimistic updates for new posts |

### Phase 4: Cleanup & Hardening (1 week)

1. Remove all `@openapi` JSDoc comments from route files
2. Delete `packages/api/src/swagger/generator.ts` and `auto-generator.ts`
3. Remove `swagger-jsdoc` dependency
4. Set up CI validation (regenerate and diff — fail if generated files are stale)
5. Add `@redocly/cli` for spec linting
6. Update Swagger UI to serve the new `openapi.json`
7. Document the "add a new route" workflow for the team
 
---

## Appendix A: Example Hook Before/After

### Before (useWalletBalance.ts — 162 lines)

```typescript
'use client';
import type { UserBalanceDataAPI } from '@babylon/shared';
import { useCallback, useEffect, useRef, useState } from 'react';

interface WalletBalanceState { balance: number; lifetimePnL: number; }
interface UseWalletBalanceOptions { enabled?: boolean; }

const defaultState: WalletBalanceState = { balance: 0, lifetimePnL: 0 };

export function useWalletBalance(userId?: string | null, options: UseWalletBalanceOptions = {}) {
  const { enabled = true } = options;
  const [state, setState] = useState<WalletBalanceState>(defaultState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  const refresh = useCallback(async () => {
    if (!userId || !enabled) { setState(defaultState); setLoading(false); setError(null); return; }
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setLoading(true); setError(null);

    let response: Response;
    try {
      response = await fetch(`/api/users/${encodeURIComponent(userId)}/balance`, { signal: controller.signal });
    } catch (fetchError) {
      if (controller.signal.aborted) return;
      setLoading(false);
      setError(fetchError instanceof Error ? fetchError : new Error('Failed to fetch wallet balance'));
      return;
    }
    if (controller.signal.aborted) return;
    if (!response.ok) { setLoading(false); setError(new Error('Failed to fetch wallet balance')); return; }

    let data: unknown;
    try { data = await response.json(); } catch { setLoading(false); setError(new Error('Failed to parse')); return; }
    if (controller.signal.aborted) return;

    const record = data as UserBalanceDataAPI;
    setState({ balance: Number(record.balance) || 0, lifetimePnL: Number(record.lifetimePnL) || 0 });
    setLoading(false);
  }, [userId, enabled]);

  useEffect(() => {
    if (enabled && userId) { void refresh(); } else { setState(defaultState); setLoading(false); setError(null); }
    return () => { controllerRef.current?.abort(); };
  }, [refresh, userId, enabled]);

  useEffect(() => {
    if (!enabled || !userId) return;
    const interval = setInterval(() => { void refresh(); }, 30000);
    return () => clearInterval(interval);
  }, [enabled, userId, refresh]);

  return { balance: state.balance, lifetimePnL: state.lifetimePnL, loading, error, refresh };
}
```

### After (0 lines hand-written, ~5 lines in component)

```typescript
// Auto-generated by Orval — packages/api-hooks/src/generated/users.ts
// No hand-written code needed

// In your component:
import { useGetUserBalance } from '@babylon/api-hooks';

function WalletDisplay({ userId }: { userId: string }) {
  const { data, isLoading, error, refetch } = useGetUserBalance(userId, {
    query: {
      enabled: !!userId,
      refetchInterval: 30_000,
    },
  });

  if (isLoading) return <div>Loading balance...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <p>Balance: ${data?.balance?.toFixed(2)}</p>
      <p>Lifetime PnL: ${data?.lifetimePnL?.toFixed(2)}</p>
    </div>
  );
}
```

---

## Appendix B: Existing Zod Schema Coverage

The following Zod schema files in `@babylon/shared` can be directly converted to OpenAPI component schemas:

| File | Schemas | Used In |
|------|---------|---------|
| `common.ts` | `PaginationSchema`, `MoneySchema`, `IdParamSchema`, `SuccessResponseSchema`, `ErrorResponseSchema`, `LeaderboardQuerySchema`, 20+ more | Everywhere |
| `user.ts` | `UpdateUserSchema`, `UserQuerySchema`, `FollowUserSchema`, `UserResponseSchema`, `UserListResponseSchema`, 15+ more | User routes |
| `market.ts` | `OpenPerpPositionSchema`, `BuyPredictionSharesSchema`, `UserPositionsQuerySchema`, `MarketIdParamSchema`, 7+ more | Market routes |
| `chat.ts` | `ChatMessageCreateSchema`, `DMChatCreateSchema`, `ChatQuerySchema`, `ChatSchema`, 8+ more | Chat routes |
| `post.ts` | Post creation/update schemas | Post routes |
| `agent.ts` | Agent CRUD schemas | Agent routes |
| `moderation.ts` | `BlockUserSchema`, `MuteUserSchema`, `GetReportsSchema`, 7+ more | Moderation routes |
| `game.ts` | `RegistryQuerySchema`, `AwardPointsSchema`, `LinkSocialAccountSchema`, 12+ more | Game/user routes |
| `feedback.ts` | `FeedbackTypeSchema` | Feedback routes |
| `trade.ts` | Trade schemas | Trade routes |
| `onboarding.ts` | `OnboardingProfileSchema` | Onboarding routes |

---

## Appendix C: Files That Would Be Deleted Post-Migration

### Hooks (can be fully replaced):
- `apps/web/src/hooks/useUserPositions.ts` (273 lines)
- `apps/web/src/hooks/useWalletBalance.ts` (162 lines)
- `apps/web/src/hooks/useOwnedAgents.ts` (174 lines)
- `apps/web/src/hooks/usePerpHistory.ts`
- `apps/web/src/hooks/usePredictionHistory.ts`
- `apps/web/src/hooks/useAgentActivity.ts`
- `apps/web/src/hooks/useAgent0Reputation.ts`
- `apps/web/src/hooks/useTwitterAuth.ts`
- `apps/web/src/hooks/useSocialVerification.ts`
- `apps/web/src/hooks/useProfileForm.ts`
- `apps/web/src/hooks/useUnreadMessages.ts`
- `apps/web/src/hooks/useTransferPoints.ts`
- `apps/web/src/hooks/useNftMint.ts` (mutations)
- `apps/web/src/hooks/useWaitlistData.ts`
- `apps/web/src/hooks/useToggleReaction.ts`

### Stores (can be simplified or replaced):
- `apps/web/src/stores/perpMarketsStore.ts` (327 lines)
- `apps/web/src/stores/predictionMarketsStore.ts`
- `apps/web/src/stores/userPositionsStore.ts`
- `apps/web/src/stores/walletBalanceStore.ts`

### Swagger/OpenAPI infrastructure (replaced by registry + Orval):
- `packages/api/src/swagger/generator.ts` (1,110 lines)
- `packages/api/src/swagger/auto-generator.ts` (127 lines)
- All `@openapi` JSDoc comments across ~190 route files (~2,000 lines of comments)

**Total deletable maintained code: ~10,700 lines**
**Total new infrastructure code: ~7,500 lines** (response schemas + route registrations)
**Net maintained code reduction: ~3,200 lines**
**Generated code added (Orval output, zero-maintenance): ~5,000-10,000 lines**
