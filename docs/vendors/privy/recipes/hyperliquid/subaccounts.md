> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Subaccounts

Learn how to use Hyperliquid subaccounts to isolate balances, positions, and PnL per strategy or user while maintaining consolidated fee tiers. {/* spellchecker:disable-line */}

<Note>
  Before continuing with this guide, make sure you have initialized your Hyperliquid client as shown
  in the [Getting Started guide](/recipes/hyperliquid-guide). This guide assumes you have `client`
  and other basic setup completed.
</Note>

## Overview

[Subaccounts](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint#subaccounts-and-vaults) let you isolate balances, positions, and PnL per strategy or user while still rolling up trading volume to the master account for fee tier benefits. You can create up to 10 subaccounts per master account. {/* spellchecker:disable-line */}

**Key Benefits:**

* **Risk Isolation**: Separate balances and positions for different strategies
* **Consolidated Fees**: All trading volume rolls up to the master account
* **Organization**: Manage multiple strategies or users under one master account
* **Flexibility**: Each subaccount can have its own risk parameters

<Warning>
  Subaccounts are only available for master accounts with at least **\$100,000** in total trading
  volume.
</Warning>

## Creating a Subaccount

```javascript  theme={"system"}
// Create a new subaccount
await masterClient.createSubAccount({
  name: "Strategy Alpha",
});

// List all subaccounts
const subAccounts = await infoClient.subAccounts({
  user: masterWallet.address as `0x${string}`,
});

console.log("Subaccounts:", subAccounts);
```

## Trading with a Subaccount

To execute trades for a specific subaccount, create a client with the `defaultVaultAddress` parameter:

```javascript  theme={"system"}
// Get the first subaccount
const subAccount = subAccounts[0];

// Create a client for the subaccount
const subAccountClient = new hl.ExchangeClient({
  transport,
  wallet: masterAccount, // Use the master account signer
  defaultVaultAddress: subAccount.subAccountUser
});

// Place an order using the subaccount
const subAccountOrder = await subAccountClient.order({
  orders: [
    {
      a: 0, // BTC
      b: true, // Buy
      s: '0.01', // Size
      r: false,
      p: '50000',
      t: {limit: {tif: 'Gtc'}}
    }
  ],
  grouping: 'na'
});
```

## Transferring Funds Between Accounts

Transfer funds between the master account and subaccounts using the `sendAsset` method:

```javascript  theme={"system"}
// Transfer from master to subaccount
await masterClient.sendAsset({
  destination: subAccount.subAccountUser,
  sourceDex: "",
  token: "USDC",
  amount: "1000",
  fromSubAccount: "",        // Empty string = from master account
  destinationDex: ""
});

// Transfer from subaccount back to master
await masterClient.sendAsset({
  destination: masterWallet.address as `0x${string}`,
  sourceDex: "",
  token: "USDC",
  amount: "500",
  fromSubAccount: subAccount.subAccountUser,  // Specify source subaccount
  destinationDex: ""
});
```

<Note>
  The `fromSubAccount` parameter determines the source: an empty string `""` transfers from the
  master account, while specifying a subaccount address transfers from that subaccount.
</Note>

## Combining Agents and Subaccounts

You can use agent wallets to trade on behalf of subaccounts, creating a flexible multi-account trading architecture:

```javascript  theme={"system"}
// Agent wallet can trade for any subaccount of the master
const agentForSubAccountClient = new hl.ExchangeClient({
  transport,
  wallet: agentAccount, // Agent wallet
  defaultVaultAddress: subAccount.subAccountUser // Subaccount
});

// Place order using agent for the subaccount
await agentForSubAccountClient.order({
  orders: [
    {
      a: 0,
      b: true,
      s: '0.01',
      r: false,
      p: '50000',
      t: {limit: {tif: 'Gtc'}}
    }
  ],
  grouping: 'na'
});
```

<Tip>
  This pattern is ideal for managing multiple strategies or user accounts - each subaccount gets
  isolated risk, while a single agent wallet can manage trading operations across all of them.
</Tip>

## Best Practices

<AccordionGroup>
  <Accordion title="Use subaccounts for risk isolation">
    Create separate subaccounts for different risk profiles. For example, maintain one subaccount
    for conservative strategies with tight stop losses, and another for high-risk, high-reward
    strategies.
  </Accordion>

  <Accordion title="Monitor subaccount balances">
    Regularly check subaccount balances and positions to ensure proper risk allocation across your
    strategies.
  </Accordion>

  <Accordion title="Consolidate for fee benefits">
    Remember that all subaccount trading volume rolls up to the master account, so you maintain your
    fee tier benefits across all strategies.
  </Accordion>
</AccordionGroup>

## Next Steps

<CardGroup cols={2}>
  <Card title="Agent wallets" icon="key" href="/recipes/hyperliquid/agents-and-subaccounts">
    Learn about agent wallets for programmatic trading
  </Card>

  <Card title="Executing trades" icon="chart-line" href="/recipes/hyperliquid/trading-patterns">
    Explore common trading patterns and order types
  </Card>
</CardGroup>
\n