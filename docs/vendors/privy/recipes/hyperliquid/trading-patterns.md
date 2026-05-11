> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Executing trades

Learn common trading patterns and best practices for placing orders, managing positions, and executing strategies on Hyperliquid with Privy.

<Note>
  Before continuing with this guide, make sure you have initialized your Hyperliquid client as shown
  in the [Getting Started guide](/recipes/hyperliquid-guide). This guide assumes you have `client`
  and other basic setup completed.
</Note>

## Overview

This guide covers essential trading patterns and techniques for building robust trading applications on Hyperliquid using Privy's secure wallet infrastructure.

## Getting Market Data

Before placing trades, you'll need to fetch asset metadata and current market conditions:

```javascript  theme={"system"}
import * as hl from '@nktkas/hyperliquid';

const transport = new hl.HttpTransport({
  isTestnet: true
});

const infoClient = new hl.InfoClient({transport});

// Get all available assets and their current context
const [meta, contexts] = await infoClient.metaAndAssetCtxs();

// Find a specific asset (e.g., BTC)
const btcIndex = meta.universe.findIndex((asset) => asset.name === 'BTC');
const btcMeta = meta.universe[btcIndex];
const btcContext = contexts[btcIndex];

console.log('BTC Mark Price:', btcContext.markPx);
console.log('BTC Funding Rate:', btcContext.funding);
```

## Understanding Tick Size and Lot Size

Before placing orders, it's critical to understand how Hyperliquid formats prices and sizes. Using incorrect precision will cause your orders to be rejected.

**Price Precision (Tick Size):**

Prices can have up to **5 significant figures**, but no more than `MAX_DECIMALS - szDecimals` decimal places:

* **Perpetuals**: `MAX_DECIMALS = 6`
* **Spot**: `MAX_DECIMALS = 8`

Integer prices are always allowed, regardless of significant figures.

**Examples for Perps:**

* ✅ `1234.5` is valid
* ❌ `1234.56` is not valid (too many significant figures)
* ✅ `0.001234` is valid
* ❌ `0.0012345` is not valid (more than 6 decimal places)

**If `szDecimals = 1`:**

* ✅ `0.01234` is valid
* ❌ `0.012345` is not valid (more than `6 - 1 = 5` decimal places)

**Size Precision (Lot Size):**

Sizes are rounded to the `szDecimals` of that asset. For example:

* If `szDecimals = 3`, then `1.001` is valid but `1.0001` is not
* If `szDecimals = 2`, then `10.25` is valid but `10.251` is not

You can find `szDecimals` for each asset in the meta response:

```javascript  theme={"system"}
const [meta, contexts] = await infoClient.metaAndAssetCtxs();
const btcMeta = meta.universe[0]; // Assuming BTC is first

console.log('BTC szDecimals:', btcMeta.szDecimals);
```

<Note>
  **Important**: When implementing signing, trailing zeroes should be removed from prices and sizes.
  See the [Hyperliquid tick and lot size
  documentation](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/tick-and-lot-size)
  for more details.
</Note>

## Order Types

### Market Orders

Hyperliquid doesn't have traditional market orders, but you can achieve market-like execution by placing a limit order with `tif: "Ioc"` (Immediate-Or-Cancel) and a price that guarantees immediate execution:

* **For buys**: Set limit price ≥ current best ask
* **For sells**: Set limit price ≤ current best bid

```javascript  theme={"system"}
// Get current market price
const [meta, contexts] = await infoClient.metaAndAssetCtxs();
const btcContext = contexts[0]; // BTC
const currentPrice = parseFloat(btcContext.markPx);

// Market buy: use a price above current market to ensure execution
await client.order({
  orders: [
    {
      a: 0, // BTC
      b: true, // Buy
      p: String(currentPrice * 1.01), // 1% above mark price
      s: '0.01', // Size
      r: false,
      t: {limit: {tif: 'Ioc'}} // Immediate-or-cancel
    }
  ],
  grouping: 'na'
});

// Market sell: use a price below current market to ensure execution
await client.order({
  orders: [
    {
      a: 0, // BTC
      b: false, // Sell
      p: String(currentPrice * 0.99), // 1% below mark price
      s: '0.01',
      r: false,
      t: {limit: {tif: 'Ioc'}}
    }
  ],
  grouping: 'na'
});
```

<Warning>
  Market orders execute at the best available price, which may differ significantly from the mark
  price in volatile or illiquid markets. Always validate that the execution price is acceptable
  before placing large orders.
</Warning>

### Limit Orders

Place an order at a specific price. Limit orders let you control the exact price at which you're willing to buy or sell.

```javascript  theme={"system"}
// Place a limit buy order for BTC at $95,000
await client.order({
  orders: [
    {
      a: 0, // Asset index (0 = BTC from meta.universe)
      b: true, // Buy side (true = buy, false = sell)
      p: '95000', // Limit price in USD
      s: '0.01', // Size (0.01 BTC)
      r: false, // Reduce-only (false = can open new position)
      t: {limit: {tif: 'Gtc'}} // Time in force
    }
  ],
  grouping: 'na'
});
```

**Order Parameters:**

* **`a` (asset)**: The asset index from `meta.universe`. For example, `0` is typically BTC.
* **`b` (buy/sell)**: `true` for buy orders, `false` for sell orders.
* **`p` (price)**: Limit price as a string. Must follow tick size rules (see above).
* **`s` (size)**: Order size as a string. Must follow lot size rules based on `szDecimals`.
* **`r` (reduce-only)**: If `true`, order can only reduce existing position, not open new positions.
* **`t` (order type)**: Object specifying order type and parameters.
* **`grouping`**: Order grouping strategy, typically `"na"` for standard orders.

**Time In Force (TIF) Options:**

The `tif` parameter in limit orders controls how long the order remains active:

<AccordionGroup>
  <Accordion title="Gtc (Good-'Til-Canceled)" icon="infinity">
    Fills what it can immediately; any remainder stays on the order book until filled or manually canceled. This is the most common option for limit orders.

    ```javascript  theme={"system"}
    t: { limit: { tif: "Gtc" } }
    ```
  </Accordion>

  <Accordion title="Ioc (Immediate-Or-Cancel)" icon="clock">
    Fills immediately up to your limit price; any unfilled remainder is automatically canceled. The order never rests on the book. Useful for ensuring immediate execution without leaving open orders.

    ```javascript  theme={"system"}
    t: { limit: { tif: "Ioc" } }
    ```
  </Accordion>

  <Accordion title="Alo (Add-Liquidity-Only / Post-Only)" icon="layer-plus">
    Must add liquidity to the order book. If the order would cross the spread and immediately match (take liquidity), it's rejected/canceled instead. This guarantees you receive maker fees rather than paying taker fees.

    ```javascript  theme={"system"}
    t: { limit: { tif: "Alo" } }
    ```
  </Accordion>
</AccordionGroup>

### Stop Loss and Take Profit Orders

You can create linked TP/SL (Take Profit/Stop Loss) orders that trigger when price reaches specific levels. Use `grouping: "normalTpsl"` to link the entry order with its stop-loss and take-profit exit orders.

```javascript  theme={"system"}
// Create an entry order with linked TP/SL
const tpsl = await client.order({
  grouping: 'normalTpsl', // Links the three orders as a TP/SL set
  orders: [
    // (A) Entry order - limit GTC at $100,000
    {
      a: 0, // Asset index (BTC)
      b: true, // Buy
      s: '0.0036', // Size (respect szDecimals for BTC)
      p: '100000', // Limit price
      r: false, // Not reduce-only
      t: {limit: {tif: 'Gtc'}}
    },
    // (B) Stop-loss - triggers at $95,000, executes as limit at $94,000
    {
      a: 0,
      b: false, // Sell to close
      s: '0.0036', // Must match entry size
      p: '94000', // Limit price once triggered (allows slippage)
      r: true, // Reduce-only
      t: {
        trigger: {
          isMarket: true,
          tpsl: 'sl', // Stop-loss type
          triggerPx: '95000' // Trigger price (when order activates)
        }
      }
    },
    // (C) Take-profit - triggers at $105,000, executes as limit at $101,200
    {
      a: 0,
      b: false, // Sell to close
      s: '0.0036', // Must match entry size
      p: '101200', // Limit price once triggered
      r: true, // Reduce-only
      t: {
        trigger: {
          isMarket: true,
          tpsl: 'tp', // Take-profit type
          triggerPx: '105000' // Trigger price (when order activates)
        }
      }
    }
  ]
});
```

**Understanding Trigger vs Limit Prices:**

The `triggerPx` and `p` (limit price) serve different purposes in TP/SL orders:

* **`triggerPx`**: The price level that activates the order
* **`p` (limit price)**: The worst price you're willing to accept once triggered

For stop-loss orders, set the limit price (`p`) **below** the trigger to allow for slippage during fast price movements. In the example above, the stop-loss triggers at \$95,000 but will execute at \$94,000 or better.

For take-profit orders, you can set a more conservative limit price to ensure execution. The take-profit triggers at \$105,000 but will accept \$101,200 or better.

This approach ensures your orders execute even in volatile conditions while still providing some price protection.

<Note>
  When one of the TP/SL orders executes (either stop-loss or take-profit), the other is
  automatically canceled. The `r: true` (reduce-only) flag ensures these orders can only close
  positions, not open new ones.
</Note>

### TWAP Orders

TWAP (Time-Weighted Average Price) orders split large orders into smaller chunks executed over time to minimize market impact and reduce slippage.

```javascript  theme={"system"}
// Execute a TWAP buy order over 30 minutes
const twap = await client.twapOrder({
  twap: {
    a: 3, // Asset index
    b: true, // Buy side (true = buy, false = sell)
    s: '0.01252', // Total size to execute (respects szDecimals)
    r: false, // Reduce-only
    m: 30, // Duration in minutes
    t: false // Randomize timing between chunks (false = evenly spaced)
  }
});
```

**TWAP Parameters:**

* **`a` (asset)**: The asset index from `meta.universe`
* **`b` (buy/sell)**: `true` for buy orders, `false` for sell orders
* **`s` (size)**: Total size to execute across all chunks
* **`r` (reduce-only)**: If `true`, order can only reduce existing positions
* **`m` (minutes)**: Duration over which to execute the order (e.g., 30 = 30 minutes)
* **`t` (randomize)**: If `true`, randomizes timing between chunks to make execution less predictable; if `false`, chunks are evenly spaced

<Note>
  TWAP orders are ideal for executing large orders without significantly moving the market. The
  order is automatically split into smaller chunks and executed at regular (or randomized) intervals
  over the specified duration.
</Note>

## Risk Management

Hyperliquid supports two margin modes: **cross margin** and **isolated margin**.

* **Cross Margin**: Uses your total perps balance as collateral across all positions. If one position loses money, other positions can help cover the loss.
* **Isolated Margin**: Margin is isolated to each individual position. If a position is liquidated, it won't affect your other positions.

```javascript  theme={"system"}
// Update leverage for an asset
const updateLeverage = await client.updateLeverage({
  asset: 0,           // Asset index (BTC)
  isCross: true,      // true = cross margin, false = isolated margin
  leverage: 12        // Leverage multiplier (e.g., 12x)
});

console.log("Leverage updated:", updateLeverage);

// Check active asset data to verify leverage settings
const assetData = await infoClient.activeAssetData({
  user: wallet.address as `0x${string}`,
  coin: "BTC",      // Asset name (e.g., "BTC", "ETH", "SOL")
});

console.log("Current leverage:", assetData.leverage);
console.log("Margin mode:", assetData.marginMode);
```

<Warning>
  Higher leverage amplifies both gains and losses. Always understand your liquidation price before
  increasing leverage. Cross margin provides more flexibility but risks your entire account balance.
</Warning>

## Monitoring and Analytics

Get comprehensive information about your account balance, open positions, and risk metrics:

```javascript  theme={"system"}
const transport = new hl.HttpTransport();
const infoClient = new hl.InfoClient({ transport });

// Get user clearinghouse state (positions, balance, margin)
const clearinghouseState = await infoClient.clearinghouseState({
  user: wallet.address as `0x${string}`,
});

console.log("Account balance:", clearinghouseState.marginSummary.accountValue);
console.log("Total position value:", clearinghouseState.marginSummary.totalNtlPos);
console.log("Unrealized PnL:", clearinghouseState.marginSummary.totalRawUsd);
console.log("Open positions:", clearinghouseState.assetPositions);
```

**Checking Open Orders:**

View all your active orders across all assets:

```javascript  theme={"system"}
// Get all open orders for the user
const openOrders = await infoClient.openOrders({
  user: wallet.address as `0x${string}`,
});

console.log("Open orders:", openOrders);
```

## Best Practices

<AccordionGroup>
  <Accordion title="Always validate prices">
    Before placing orders, verify that prices are within expected ranges to avoid fat-finger errors.
  </Accordion>

  <Accordion title="Use reduce-only orders for exits">
    When closing positions, use reduce-only orders to prevent accidentally opening new positions.
  </Accordion>

  <Accordion title="Monitor funding rates">
    Keep track of funding rates, especially for large positions, as they can significantly impact
    profitability.
  </Accordion>

  <Accordion title="Implement circuit breakers">
    Add safeguards to stop trading if certain thresholds are hit (e.g., max daily loss, max position
    size).
  </Accordion>
</AccordionGroup>

## Next Steps

<CardGroup cols={2}>
  <Card title="Agent wallets" icon="key" href="/recipes/hyperliquid/agents-and-subaccounts">
    Learn about agent wallets for programmatic trading
  </Card>

  <Card title="Policies" icon="shield-check" href="/recipes/hyperliquid/policies-and-offline-actions">
    Implement advanced security policies
  </Card>
</CardGroup>
\n