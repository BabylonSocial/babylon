> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Agent wallets

Learn how to use agent wallets (API wallets) to build secure, scalable trading systems on Hyperliquid with Privy.

<Note>
  Before continuing with this guide, make sure you have initialized your Hyperliquid client as shown
  in the [Getting Started guide](/recipes/hyperliquid-guide). This guide assumes you have `client`
  and other basic setup completed.
</Note>

## Overview

[Agent wallets](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/nonces-and-api-wallets#api-wallets) (also known as **API wallets**) are permissioned signers that do not hold funds but can execute Hyperliquid actions for a master account and its subaccounts. This lets you:

* Keep user keys isolated while trading programmatically
* Give each bot or trading strategy its own nonce space
* Simplify concurrent trading operations
* Easily rotate keys without affecting trading
* Preserve consolidated fee tiers and account-level PnL {/* spellchecker:disable-line */}

## Creating an Agent Wallet

```javascript  theme={"system"}
import { PrivyClient } from '@privy-io/node';
import { createViemAccount } from '@privy-io/node/viem';
import * as hl from '@nktkas/hyperliquid';

// Initialize Privy client
const privy = new PrivyClient({
  appId: 'insert-your-app-id',
  appSecret: 'insert-your-app-secret',
});

// Create your master trading wallet
const masterWallet = await privy.wallets().createWallet({
  chain_type: 'ethereum',
});

const masterAccount = createViemAccount(privy, {
  walletId: masterWallet.id,
  address: masterWallet.address as `0x${string}`,
});

// Initialize Hyperliquid client with master account
const transport = new hl.HttpTransport({
  isTestnet: true,
});

const masterClient = new hl.ExchangeClient({
  transport,
  wallet: masterAccount,
});

// Create a new agent wallet
const agentWallet = await privy.wallets().createWallet({
  chain_type: 'ethereum',
});

// Register the agent wallet with the master account
await masterClient.registerAgent({
  agentAddress: agentWallet.address as `0x${string}`,
  agentName: "Trading Bot 1",
});
```

## Using an Agent Wallet

Once registered, the agent wallet can execute trades on behalf of the master account:

```javascript  theme={"system"}
// Create a viem account for the agent
const agentAccount = createViemAccount(privy, {
  walletId: agentWallet.id,
  address: agentWallet.address as `0x${string}`,
});

// Create an exchange client using the agent wallet
const agentClient = new hl.ExchangeClient({
  transport,
  wallet: agentAccount,
});

// The agent can now trade on behalf of the master account
const orderResponse = await agentClient.order({
  orders: [
    {
      a: 0, // BTC
      b: true, // Buy
      s: "0.01", // Size
      r: false, // Not reduce-only
      p: "50000", // Price
      t: { limit: { tif: "Gtc" } },
    },
  ],
  grouping: "na",
});
```

## Setting Agent Expiration

You can set an expiration timestamp for agent wallets using the agent name:

```javascript  theme={"system"}
// Create an agent that expires in 24 hours
const expirationTimestamp = Date.now() + 24 * 60 * 60 * 1000;

await masterClient.registerAgent({
  agentName: `Trading Bot valid_until ${expirationTimestamp}`,
  agentAddress: agentWallet.address as `0x${string}`,
});
```

## Listing Agent Wallets

Retrieve all registered agents for a master account:

```javascript  theme={"system"}
const infoClient = new hl.InfoClient({ transport });

const agents = await infoClient.extraAgents({
  user: masterWallet.address as `0x${string}`,
});

console.log("Registered agents:", agents);
```

## Best Practices

<AccordionGroup>
  <Accordion title="Organize by strategy">
    Create separate agent wallets for each trading strategy or bot. This isolates nonce management
    and makes it easier to track which system placed which orders.
  </Accordion>

  <Accordion title="Set appropriate expirations">
    For automated trading systems, set reasonable expiration times on agent wallets to limit
    exposure if a key is compromised.
  </Accordion>

  <Accordion title="Monitor agent permissions">
    Regularly audit which agent wallets are registered and revoke access for agents that are no
    longer needed.
  </Accordion>
</AccordionGroup>

## Next Steps

<CardGroup cols={2}>
  <Card title="Subaccounts" icon="folder-tree" href="/recipes/hyperliquid/subaccounts">
    Learn how to use subaccounts for risk isolation
  </Card>

  <Card title="Executing trades" icon="chart-line" href="/recipes/hyperliquid/trading-patterns">
    Learn common trading patterns and order types
  </Card>
</CardGroup>
\n