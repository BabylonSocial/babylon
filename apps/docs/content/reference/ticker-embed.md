# Ticker Embed and API

The ticker provides a Polymarket-style scrolling strip of **news**, **prediction markets**, and **perps** for embedding on livestreams or third-party sites. It is backed by a single data API and an iframe-friendly embed page.

## Overview

- **Data API:** `GET /api/ticker` returns normalized JSON for one or more streams (news, predictions, perps).
- **Embed page:** `/ticker` renders a minimal, full-width scrolling ticker with no app chrome (no sidebar or nav). It reads query parameters for theme, speed, and height and fetches from the ticker API.

Both the API and the embed page are public; no authentication is required.

---

## Ticker Data API

**Endpoint:** `GET /api/ticker`

### Query parameters

| Parameter | Type   | Default              | Description |
| --------- |--------|----------------------|-------------|
| `streams` | string | `news,predictions,perps` | Comma-separated list of streams to include. Valid values: `news`, `predictions`, `perps`. Only requested streams appear in the response. |
| `limit`   | number | `20`                 | Maximum number of items per stream (cap: 100). |

### Response

JSON object with optional keys; only requested streams are present.

- **`news`** (optional): `TickerNewsItem[]`
- **`predictions`** (optional): `TickerPredictionItem[]`
- **`perps`** (optional): `TickerPerpItem[]`

### Normalized item shapes

**News** (`TickerNewsItem`):

```ts
{
  id: string;
  title: string;
  summary: string;
  url?: string;
  timestamp: string;  // ISO 8601
  type: "news";
}
```

**Predictions** (`TickerPredictionItem`):

```ts
{
  id: string;
  question: string;
  yesPercent: number;  // 0–100
  status: string;      // e.g. "active", "resolved"
  type: "prediction";
}
```

**Perps** (`TickerPerpItem`):

```ts
{
  ticker: string;
  price: number;
  changePercent24h: number;
  type: "perp";
}
```

### Caching

- Response is public and cacheable: `Cache-Control: public, s-maxage=30, stale-while-revalidate=60`.
- Route uses Next.js `revalidate = 60`.

### Examples

All streams, default limit:

```http
GET /api/ticker
```

News and perps only, 10 items per stream:

```http
GET /api/ticker?streams=news,perps&limit=10
```

Example response:

```json
{
  "news": [
    {
      "id": "evt-1",
      "title": "Company X announces new product",
      "summary": "2h ago • Trending",
      "timestamp": "2025-02-16T12:00:00.000Z",
      "type": "news"
    }
  ],
  "predictions": [
    {
      "id": "mkt-1",
      "question": "Will X happen by Friday?",
      "yesPercent": 72,
      "status": "active",
      "type": "prediction"
    }
  ],
  "perps": [
    {
      "ticker": "BTCAI",
      "price": 50100.5,
      "changePercent24h": 2.3,
      "type": "perp"
    }
  ]
}
```

---

## Ticker Embed Page

**URL:** `/ticker` (and `/ticker/` with query params)

The page is minimal: no main app header, sidebar, or bottom nav. It is intended for iframe embedding (e.g. livestream overlays or third-party sites).

### Query parameters

| Parameter | Type   | Default | Description |
| --------- |--------|--------|-------------|
| `streams` | string | `news,predictions,perps` | Same as API: comma-separated `news`, `predictions`, `perps`. |
| `theme`  | string | `dark` | `light` or `dark`. |
| `speed`  | number | `0.7`  | Scroll speed: 0.1 = slowest, 1 = medium, 3 = fastest. Valid range 0.1–3. |
| `height` | number | `48`   | Bar height in pixels; valid range 32–120. |

### Behavior

- On load, the page fetches `GET /api/ticker?streams=<streams>&limit=30`.
- Data is refreshed every 60 seconds.
- Items are rendered in a single horizontal scrolling strip with small labels (News / Prediction / Perp). Duplicated content and CSS animation produce a continuous marquee; animation duration is derived from `speed`.

### Embedding

Use an iframe and pass query params as needed:

```html
<iframe
  src="https://babylon.market/ticker?theme=light&speed=1&height=48"
  width="100%"
  height="48"
  frameborder="0"
  title="Babylon Ticker"
></iframe>
```

Only news and perps:

```html
<iframe
  src="https://babylon.market/ticker?streams=news,perps&theme=dark&height=56&speed=1.2"
  width="100%"
  height="56"
  frameborder="0"
  title="Babylon Ticker"
></iframe>
```

Replace `https://babylon.market` with your deployment origin (e.g. `https://staging.babylon.market` or `http://localhost:3000` in development).

For more placement examples (website, OBS, Notion, custom UI), see the **Ticker usage guide** in the repo: `docs/ticker-usage-guide.md`.

### Public access

- `/ticker` and `/ticker/*` are on the app’s public path allowlist (no NFT gating or login required).
- The page is intended for embedding; `robots` metadata is set to `noindex, nofollow`.

---

## Implementation notes

- **API:** Implemented in `apps/web/src/app/api/ticker/route.ts`. News is sourced from the breaking-news widget (internal fetch); predictions and perps use existing services (`PredictionMarketService`, `PerpMarketService`).
- **Types:** Normalized ticker types live in `apps/web/src/types/ticker.ts` and are used by both the API and the embed client.
- **Embed layout:** Middleware sets `x-minimal-layout: 1` for `/ticker` and `/ticker/*`; the root layout renders only `children` when this header is present, so the ticker page has no app chrome.
- **Animation:** The scrolling strip uses `@keyframes ticker-scroll` in `apps/web/src/app/globals.css` (translateX 0 → -50% with duplicated content).

---

## Related

- [Markets Architecture](./markets-architecture.md) – Prediction markets, perps, and pools.
- Breaking news widget: `GET /api/feed/widgets/breaking-news`.
- Prediction markets: `GET /api/markets/predictions`.
- Perps: `GET /api/markets/perps`.
