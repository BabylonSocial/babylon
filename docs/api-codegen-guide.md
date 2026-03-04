# API Code Generation - Developer Guide

## Overview

This project uses **Zod-OpenAPI → Orval** to auto-generate type-safe TanStack React Query hooks for the REST API.

**Pipeline:**
```
Zod schemas (packages/api/src/openapi/)
  → openapi.json (generated spec)
  → @babylon/api-hooks (generated React Query hooks)
```

## Quick Start

### Regenerate all hooks after schema changes

```bash
bun run generate:api
```

This runs:
1. `scripts/generate-openapi.ts` — produces `openapi.json` from Zod schemas
2. Orval — generates TypeScript hooks in `packages/api-hooks/src/generated/`
3. `scripts/generate-api-barrel.ts` — creates barrel exports in `packages/api-hooks/src/index.ts`

### Add a new API endpoint

1. **Define the path in the appropriate domain file** under `packages/api/src/openapi/paths/`:

```typescript
// packages/api/src/openapi/paths/users.ts
'/api/users/{userId}/settings': {
  get: {
    operationId: 'getUserSettings',  // Must be unique, becomes the function name
    tags: ['Users'],
    summary: 'Get user settings',
    security: [{ PrivyAuth: [] }],
    requestParams: {
      path: z.object({ userId: z.string() }),
    },
    responses: {
      '200': {
        description: 'User settings',
        content: {
          'application/json': {
            schema: z.object({
              theme: z.string(),
              notifications: z.boolean(),
            }).meta({ id: 'UserSettingsResponse' }),
          },
        },
      },
    },
  },
},
```

2. **Register the paths file** in `packages/api/src/openapi/paths/index.ts` and `scripts/generate-openapi.ts`

3. **Regenerate:**
```bash
bun run generate:api
```

4. **Use in frontend:**
```typescript
// As a React Query hook (auto-cached, auto-refetched)
import { useGetUserSettings } from '@babylon/api-hooks';
const { data, isLoading } = useGetUserSettings(userId);

// As a raw function (for imperative code)
import { getUserSettings } from '@babylon/api-hooks';
const data = await getUserSettings(userId);
```

### Modify an existing endpoint

1. Find the schema in `packages/api/src/openapi/paths/<domain>.ts`
2. Update the Zod schema
3. Run `bun run generate:api`
4. Fix any TypeScript errors in consumers

## Architecture

### Schema files (`packages/api/src/openapi/paths/`)

| File | Domain |
|------|--------|
| `admin.ts` | Admin dashboard endpoints |
| `agents.ts` | Agent CRUD, chat, goals |
| `feedback.ts` | User & game feedback |
| `markets.ts` | Prediction & perp markets |
| `misc.ts` | Auth, activity, uploads, twitter |
| `moderation.ts` | Reports, blocks, mutes, appeals |
| `posts.ts` | Posts, comments, interactions |
| `social.ts` | Feed, trending, notifications |
| `users.ts` | User profiles, follows, settings |

### Generated hooks (`packages/api-hooks/`)

Each endpoint generates:
- **`useGetX()`** — React Query hook (for GET endpoints)
- **`useGetXSuspense()`** — Suspense-compatible variant
- **`getX()`** — Raw async function (for non-React code)
- **`getGetXQueryKey()`** — Query key factory (for cache invalidation)
- **`getGetXQueryOptions()`** — Full query options (for prefetching)

### Auth handling

The custom `orvalFetch` mutator at `packages/api-hooks/src/orval-fetch.ts` automatically:
- Attaches Privy JWT via `window.__privyGetAccessToken`
- Retries on 401 with a fresh token
- Throws on non-2xx responses

**You never need to pass auth headers manually.**

## Troubleshooting

### "operationId X is duplicated"
Each `operationId` must be globally unique across all path files. Check for duplicates.

### Generated types don't match API response
The schema may be out of sync with the actual route handler. Update the Zod schema to match reality (not the other way around).

### Cache not updating after mutation
Use query key invalidation:
```typescript
import { useQueryClient } from '@tanstack/react-query';
import { getGetUserProfileQueryKey } from '@babylon/api-hooks';

const queryClient = useQueryClient();
queryClient.invalidateQueries({ queryKey: getGetUserProfileQueryKey(userId) });
```

## What NOT to generate

- **SSE/EventSource hooks** — fundamentally different from REST
- **Server actions** — use Next.js server action model
- **Cron/internal endpoints** — no frontend consumer
- **Streaming responses** — not supported by Orval
