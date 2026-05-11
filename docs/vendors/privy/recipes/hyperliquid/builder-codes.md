> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Builder Codes

Learn how to earn fees with builder codes using Privy's wallet infrastructure.

<Note>
  Before continuing with this guide, make sure you have initialized your Hyperliquid client as shown
  in the [Getting Started guide](/recipes/hyperliquid-guide). This guide assumes you have `client`
  and other basic setup completed.
</Note>

## Overview

[Builder codes](https://hyperliquid.gitbook.io/hyperliquid-docs/trading/builder-codes) are an on-chain, per-order attribution mechanism that lets apps and interfaces earn fees on orders they route for users.

Builder codes enable **order-level revenue sharing** - completely independent of which market the order is on:

* Apps earn a small fee on every order fill they route through their interface
* Works on **all markets** across Hyperliquid
* Users must approve a max builder fee for each builder they want to use
* Builder codes can override referral codes on specific orders

## How Builder Codes Work

1. **User Approval**: User approves your builder code and sets a max builder fee they're willing to pay
2. **Order Attribution**: When placing orders through your app, include your builder code in the order
3. **Fee Collection**: You earn a small fee on each filled order
4. **On-Chain Tracking**: Revenue is tracked on-chain and paid out automatically

## Obtaining a Builder Code

To get started with builder codes, you'll need to register as a builder with Hyperliquid. Contact the Hyperliquid team or refer to the [builder codes documentation](https://hyperliquid.gitbook.io/hyperliquid-docs/trading/builder-codes) for registration details.

## Approving Builder Fees

Before users can use your builder code, they must approve your builder address and set a max fee rate (one-time per user per builder):

```javascript  theme={"system"}
import * as hl from '@nktkas/hyperliquid';
import {createViemAccount} from '@privy-io/node/viem';

// Create exchange client with user's wallet
const client = new hl.ExchangeClient({
  transport,
  wallet: userAccount // User's viem account from Privy
});

// User approves your builder and sets max fee
await client.approveBuilderFee({
  builder: '0xBuilderAddress', // Your builder address
  maxFeeRate: '0.05%' // Max fee rate user approves
  // Perps: max 0.10% (10 bps)
  // Spot: max 1.00% (100 bps)
});
```

<Note>
  The `maxFeeRate` is the maximum fee the user is willing to pay. Actual fees charged can be lower,
  but never higher than this approved rate.
</Note>

## Applying Builder Codes to Orders

Once approved, include your builder code when placing orders to earn fees:

```javascript  theme={"system"}
// Place an order with builder code attribution
await client.order({
  orders: [
    {
      a: 0, // BTC index
      b: true, // Buy
      s: '0.001', // Size
      p: '100000', // Price
      r: false, // Not reduce-only
      t: {limit: {tif: 'Gtc'}}
    }
  ],
  builder: {
    b: '0xBuilderAddress', // Your builder address
    f: 50 // Fee in tenths of a bp (50 = 5 bps = 0.05%)
  }
});
```

**Builder fee format:**

* `f` is specified in **tenths of a basis point**
* Example: `f: 50` means 50 tenths of a bp = 5 bps = 0.05%
* Must be ≤ the user's approved `maxFeeRate`

## Checking Builder Fee Approval

Verify a user's builder fee approval before placing orders:

```javascript  theme={"system"}
const infoClient = new hl.InfoClient({transport});

// Check if user has approved your builder
const approval = await infoClient.maxBuilderFee({
  user: userWallet.address as `0x${string}`,
  builder: '0xBuilderAddress'
});

console.log('Max approved fee:', approval.maxBuilderFee);

// If maxBuilderFee is "0" or undefined, user hasn't approved yet
if (!approval.maxBuilderFee || approval.maxBuilderFee === '0') {
  console.log('User needs to approve builder fee first');
}
```

## Best Practices

<AccordionGroup>
  <Accordion title="Monitor builder code performance">
    Track the fee revenue from your builder code to understand user engagement and optimize your
    application.
  </Accordion>

  <Accordion title="Set competitive builder fees">
    Balance between earning revenue and providing value to users. Lower fees may attract more users.
  </Accordion>

  <Accordion title="Test on testnet first">
    Always test your builder code integration on testnet before going live.
  </Accordion>
</AccordionGroup>

## Resources

<Card title="Builder Codes Documentation" icon="arrow-up-right-from-square" href="https://hyperliquid.gitbook.io/hyperliquid-docs/trading/builder-codes" arrow>
  Official guide to order-level revenue sharing
</Card>

## Next Steps

<Card title="Executing trades" icon="chart-line" href="/recipes/hyperliquid/trading-patterns">
  Learn common trading patterns
</Card>
\n