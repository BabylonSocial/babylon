# Planning: 700k Concurrent Users

Context: NFT gating will eventually be removed; visitors will login/signup and play directly. This doc outlines how to handle **700k concurrent users** when that happens.

---

## Current Architecture (relevant to load)

- **Web**: Next.js (Vercel). Middleware: CORS, host routing (waitlist vs app), NFT gating, ticker header.
- **API**: Next.js API routes. Redis (ioredis / Upstash) for cache, rate limits, realtime streams. Postgres (Drizzle) for persistence.
- **Realtime**: Redis Streams + SSE. Each client holds a long-lived GET to `/api/sse/events`; server does blocking `XREAD` per connection. Events published via `publishEvent` → streams, consumed by route.
- **Caching**: `getCache` / `setCache` / `getCacheOrFetch` in `@babylon/api`. Feed for-you, narrative, leaderboard, new-markets, widgets/markets, posts, notifications, etc. use Redis. TTLs already tuned for scale (e.g. posts 45s, HTTP SWR).
- **Rate limiting**: Redis-backed sliding window. Public tier: per-IP (e.g. 20/min read, 5/min firehose) and per-user when authenticated (60/min read, 20/min firehose).

---

## Current capacity (as-is estimate)

**Assumption: Vercel Pro.** Rough order of magnitude: **~10k–30k concurrent users** in steady state, with **burst limits** likely to throttle before that during sharp traffic spikes.

| Limiter | Why |
|--------|-----|
| **Vercel Pro** | Pro allows **up to 30,000 concurrent executions** (max). SSE route uses `maxDuration = 300` (5 min), which Pro supports. So in theory most of those 30k could be long-lived SSE connections. **Burst:** 1,000 new executions per 10 seconds per region, then scaling at 500/min—so a sudden spike of >1k new SSE connections in 10s can trigger throttling (503) before the pool scales. Steady growth is fine; flash crowds hit the burst cap first. |
| **SSE** | Each open feed/realtime connection = one concurrent execution. So with Pro, **SSE is not the first cap**; Redis and Postgres are. |
| **Redis connections** | Serverless = one Redis connection per active function instance. At 10k–30k concurrent executions, Redis connection count can reach the same order. Upstash/Redis plan limits (often in the hundreds to low thousands of connections) are likely the **next bottleneck** after Pro’s burst behavior. |
| **Postgres** | With pooling (e.g. Vercel Postgres, Neon), typical pool is 100–200 connections. Cache absorbs most reads; write paths and uncached reads can exhaust the pool under heavy load. |
| **Rate limits** | Anonymous: 20/min read, 5/min firehose. Authenticated: 60/min read, 20/min firehose. They cap requests per user/IP, not “concurrent users.” |

**Takeaway:** With **Vercel Pro**, the hard limit shifts from “SSE concurrency” to **burst behavior** (1k/10s) and **Redis/DB connection limits**. Plan for **~10k–30k concurrent users** in steady state if Redis and Postgres can handle the connection and QPS load; validate Redis connection limits on your current plan first. To reach 700k, the realtime path must still move off serverless (see Plan above).

---

## Bottlenecks at 700k Concurrent

| Area | Risk | Why |
|------|------|-----|
| **SSE connections** | Very high | 700k long-lived connections = 700k server-side connections (or more with reconnects). Each holds a serverless function and does Redis `XREAD` in a loop. Vercel/serverless concurrency and connection limits will be hit first. |
| **Redis** | High | All cache, rate limits, and stream reads/writes go through Redis. Connection count and bandwidth scale with concurrent users and with number of instances. |
| **Postgres** | High | Feed, profile, markets, and write paths hit DB. Cache reduces reads but auth, RLS, and personalized queries still scale with users. |
| **Middleware / NFT access** | Medium | Every non-public request can trigger a server-side `fetch('/api/nft/access')` when gating is on. When gating is removed this goes away; until then it doubles server-side calls for unauthenticated users. |
| **API route cold starts** | Medium | Serverless cold starts add latency; at 700k concurrent, traffic is huge and instance count grows. |
| **Origin/edge** | Medium | Static assets and API routing at edge; 700k users imply large request volume even with caching. |

---

## Plan (high level)

### 1. Realtime (SSE) – biggest structural change

- **Problem**: 700k concurrent SSE connections cannot be served by a single Next.js API layer with one connection per user.
- **Options**:
  - **Dedicated realtime service**: Move SSE to a long-lived service (e.g. Node or Go) behind a load balancer, each instance holding tens of thousands of connections (with tuning). Keep token issuance and channel auth in the main API; SSE service only validates token and reads from Redis Streams.
  - **Managed realtime**: Use a managed service (Ably, Pusher, etc.) or Redis-based offering (Upstash Redis + serverless consumers) that scales connections independently.
  - **Hybrid**: Public firehose (feed, markets, breaking-news) on a CDN or managed push; only private channels (chats, notifications) on a dedicated SSE cluster.
- **Actions**: Decide “realtime on dedicated service vs managed”; document token contract so a separate service can validate; run load tests with 10k → 100k → 700k simulated SSE connections to validate Redis and connection limits.

### 2. Redis

- **Connection pooling / proxy**: Use a Redis proxy (e.g. Twemproxy, or managed proxy) or connection pool so many app instances don’t create 700k+ Redis connections.
- **Cluster/sharding**: If a single Redis instance is insufficient, plan for cluster or sharded cache (e.g. by key prefix or user id). Rate limits and streams need a clear sharding strategy (e.g. streams by channel).
- **Upstash**: If on Upstash, confirm limits (connections, commands, data) and multi-region behavior at 700k-user scale; plan scaling or migration path.
- **Actions**: Measure current Redis connection count and commands/sec at target load; add metrics; define max connections and a scaling plan.

### 3. Postgres

- **Read replicas**: Route read-heavy endpoints (feed, leaderboard, markets, profile reads) to replicas; keep writes and RLS-sensitive paths on primary.
- **Connection pooling**: PgBouncer or similar so serverless workers don’t exhaust DB connections (700k concurrent → many workers).
- **Query and index review**: Ensure hot paths (feed, for-you, narrative, leaderboard) are indexed and avoid N+1; use existing Redis cache aggressively.
- **Actions**: Identify read vs write routes; introduce replica routing and connection pool; load test DB at 700k-user equivalent QPS.

### 4. API and cache

- **Keep and extend Redis cache**: Already used for for-you, narrative, leaderboard, new-markets, etc. Add caching for any new hot paths; review TTLs (already tuned for 400k+ in comments) for 700k.
- **Public vs authenticated**: When gating is removed, anonymous traffic will grow. Ensure public endpoints (feed, markets, ticker, leaderboard) are heavily cached and rate-limited per IP; avoid per-user DB work for anonymous users.
- **HTTP caching**: Keep and enforce `Cache-Control` and `stale-while-revalidate` on public GETs so CDN and browsers absorb repeat requests.
- **Actions**: Audit all public GETs for cache + CDN headers; ensure rate limits and cache keys don’t assume “logged-in only.”

### 5. Rate limiting

- **Redis-backed limits**: Already in place; at 700k users ensure Redis used for limits can handle the key volume and command rate (sliding window per user/IP).
- **Tiers**: Consider stricter anonymous limits and higher authenticated limits so that after gating removal, anonymous traffic doesn’t overwhelm; adjust firehose limits if SSE moves to a dedicated service (fewer token/connection requests to main API).
- **Actions**: No code change required short-term; document limits and run load tests to confirm Redis and 429 behavior under load.

### 6. Middleware and NFT gating (until removal)

- **Current cost**: Each non-public, non-allowlisted request triggers an internal `fetch('/api/nft/access')` when gating is on. That doubles server-side calls for unauthenticated users.
- **When gating is removed**: This cost disappears; middleware becomes simpler (no access check, no `ba_access` cookie). Until then, consider caching NFT access result at edge or in middleware if possible (without weakening security).
- **Actions**: No change required for “planning 700k”; removal of gating is a separate task that will reduce load.

### 7. Observability and limits

- **Metrics**: Latency (p50/p95/p99), error rate, and throughput per route; Redis connections and commands/sec; Postgres connections and slow queries; SSE connection count and reconnects.
- **Limits**: Document and alert on: max SSE connections per node/service, Redis connection cap, DB connection pool size, and rate-limit rejections (429).
- **Load testing**: Simulate 700k concurrent users (or a proportional slice) for SSE, feed, markets, and auth flows; validate Redis, Postgres, and realtime path.
- **Actions**: Add or align dashboards and alerts; run staged load tests and document results.

---

## Summary

- **Realtime (SSE)** is the main architectural bottleneck: plan for a dedicated realtime layer or managed service, not 700k connections on Next.js API routes.
- **Redis** needs connection management and possibly clustering/sharding; measure and plan before hitting provider limits.
- **Postgres** needs read replicas and connection pooling; keep hot paths cached and indexed.
- **API and cache** are in good shape; extend caching and CDN usage for public traffic once gating is removed.
- **Rate limiting** is already Redis-backed and tiered; validate at target load.
- **Gating removal** will reduce middleware and `/api/nft/access` load when it happens; planning for 700k should assume that removal is done and focus on SSE, Redis, DB, and public GET scaling.
