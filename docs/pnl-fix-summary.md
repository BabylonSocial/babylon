# PnL Calculation Bug Fix

## Issue Summary

The realized P&L (Profit & Loss) for all NPC agents was **always returning 0**, regardless of whether they had closed positions with actual realized profits or losses. This affected all user-controlled and autonomous agents using the NPC portfolio system.

## Root Cause

In `packages/engine/src/npc/npc-investment-manager.ts`, the `getPortfolioMetrics()` function had a hardcoded value:

```typescript
realizedPnL: 0, // Could track from trade history
```

This was a TODO comment that was never implemented. The function was calculating unrealized PnL correctly from open positions, but ignoring realized PnL from closed positions.

## Impact

- **Portfolio API**: The `/api/npc/[actorId]/portfolio` endpoint returned `realizedPnL: 0` for all agents
- **Agent Performance**: Agents' total P&L was understated by the amount of their realized gains/losses
- **Reporting**: Dashboards, leaderboards, and performance metrics showed incomplete P&L data

## The Fix

### What Changed

The fix updates `getPortfolioMetrics()` to:

1. **Query pool positions** and exclude any perps that already exist in `perpPositions`
2. **Sum up `realizedPnL`** from all closed pool positions
3. **Query perp positions once** and split into open/closed in memory
4. **Use open perps** for unrealized, invested, and position counts
5. **Sum up `realizedPnL`** from all closed perp positions
6. **Return the total** realized PnL (pool + perp) and updated aggregates

### Code Changes

**File**: `packages/engine/src/npc/npc-investment-manager.ts`

```typescript
// Before
const positionResults = await db
  .select()
  .from(poolPositions)
  .where(eq(poolPositions.poolId, poolId));

const openPositions = positionResults.filter((p) => p.closedAt === null);

// After
const positionResults = await db
  .select()
  .from(poolPositions)
  .where(eq(poolPositions.poolId, poolId));

const perpPositionsResult = await db
  .select({
    id: perpPositions.id,
    realizedPnL: perpPositions.realizedPnL,
    closedAt: perpPositions.closedAt,
  })
  .from(perpPositions)
  .where(eq(perpPositions.userId, poolId));

const openPerpPositions = perpPositionsResult.filter(
  (p) => p.closedAt === null
);
const closedPerpPositions = perpPositionsResult.filter(
  (p) => p.closedAt !== null
);

const perpPositionIds = new Set([
  ...openPerpPositions.map((p) => p.id),
  ...closedPerpPositions.map((p) => p.id),
]);

const shouldIncludePoolPosition = (position) =>
  position.marketType !== 'perp' || !perpPositionIds.has(position.id);

const openPositions = positionResults.filter(
  (p) => p.closedAt === null && shouldIncludePoolPosition(p)
);
const closedPositions = positionResults.filter(
  (p) => p.closedAt !== null && shouldIncludePoolPosition(p)
);
```

```typescript
// Before
realizedPnL: 0, // Could track from trade history

// After
// Calculate realized PnL from closed pool positions
const realizedPnLFromPool = closedPositions.reduce((sum, pos) => {
  return sum + Number.parseFloat(pos.realizedPnL?.toString() || '0');
}, 0);

// Calculate realized PnL from closed perp positions
const realizedPnLFromPerp = closedPerpPositions.reduce((sum, pos) => {
  return sum + Number.parseFloat(pos.realizedPnL?.toString() || '0');
}, 0);

// Total realized PnL
const realizedPnL = realizedPnLFromPool + realizedPnLFromPerp;

// ... later in return statement:
realizedPnL, // Now properly calculated
```

## Technical Details

### Database Schema

Both `poolPositions` and `perpPositions` tables have:
- `realizedPnL: doublePrecision` - Set when position is closed
- `closedAt: timestamp` - Set when position is closed

### Position Closing Flow

When a position is closed via `TradeExecutionService.closePoolPosition()`:

```typescript
await tx
  .update(poolPositions)
  .set({
    closedAt: now,
    currentPrice,
    unrealizedPnL: 0,  // Zero out unrealized
    realizedPnL,       // Set realized PnL
    updatedAt: now,
  })
  .where(eq(poolPositions.id, decision.positionId!));
```

This data was being written correctly, just not being read by `getPortfolioMetrics()`.

### NPC vs Regular Users

- **Regular Users**: Use `users.lifetimePnL` field which is accumulated via `WalletService.recordPnL()`
- **NPCs**: Don't have a `lifetimePnL` field in `actorState` table, so we must calculate from closed positions

## Verification

### Testing the Fix

1. **API Test**: Call the portfolio endpoint for an agent with closed positions

   ```bash
   curl 'https://staging.babylon.market/api/npc/[actorId]/portfolio' \
     -H 'Cookie: ...'
   ```

   Expected: `realizedPnL` should show the sum of all closed position P&L, not 0

2. **Database Query**: Check agent's closed positions directly

   ```sql
   SELECT COUNT(*), SUM(realized_pnl) as total_realized
   FROM "PoolPosition"
   WHERE "poolId" = 'AGENT_ID' AND "closedAt" IS NOT NULL;

   SELECT COUNT(*), SUM(realized_pnl) as total_realized
   FROM "PerpPosition"
   WHERE "userId" = 'AGENT_ID' AND "closedAt" IS NOT NULL;
   ```

### Known Agent IDs to Test

- Agent ID from original report: `273508387734421504` (Lumen Oracle)
- Any user-controlled agent that has closed positions

## Future Improvements

1. **Add `lifetimePnL` to `actorState`**: Track accumulated realized PnL like regular users do
2. **Performance optimization**: Cache closed position totals instead of recalculating each time
3. **Historical tracking**: Add realized PnL to `npcTrades` table for historical analysis
4. **Monitoring**: Add alerts when realized/unrealized PnL calculations fail

## Related Files

- `packages/engine/src/npc/npc-investment-manager.ts` - Main fix
- `packages/engine/src/services/trade-execution-service.ts` - Sets `realizedPnL` when closing
- `packages/db/src/schema/pools.ts` - Schema for `poolPositions`
- `packages/db/src/schema/markets.ts` - Schema for `perpPositions`
- `apps/web/src/app/api/npc/[actorId]/portfolio/route.ts` - API that calls fixed function
