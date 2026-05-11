> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Fetch deposits and withdrawals via webhook

**Privy emits webhooks whenever a wallet sends or receives a registered asset.** This helps your application stay in sync with the assets in your wallets, and easily track deposits and withdrawals.

To set up deposit and/or withdrawal webhooks, follow the guide below.

<Info>
  Webhooks can be tested at no cost in development environments. To enable webhooks in production,
  upgrade to the Enterprise plan in the Privy Dashboard.
</Info>

<Tip>
  Deposit webhooks are available for select chains on Tier 3 and Tier 2. To see which exact chains
  are supported, go to the [Dashboard Webhooks page.](https://dashboard.privy.io/apps?page=webhooks)
</Tip>

## Setup a webhooks URL

Go through our [webhooks setup guide](/api-reference/webhooks/overview#registering-an-endpoint)
first, and make sure you enable the
['wallet.funds\_deposited'](/api-reference/webhooks/wallet/funds_deposited) and/or
['wallet.funds\_withdrawn'](/api-reference/webhooks/wallet/funds_withdrawn) events.
You can next configure which assets Privy should emit these events for.

Privy will emit a signed webhook to this URL whenever your wallets
sends/receives a transaction for a registered asset, and will retry delivery if
the endpoint does not successfully respond to the original webhook.
Go through the [webhooks reference](/api-reference/webhooks/overview#webhook-delivery)
for details on how delivery, idempotency, and retries work.

## Configure assets to track

Once you've enabled the `'wallet.funds_deposited'` and/or `'wallet.funds_withdrawn'` events, you can then configure which assets you'd like to track via the Privy Dashboard.

Privy supports webhooks for **native tokens** (e.g. ETH, SOL) on EVM and Solana, **ERC20 tokens** on EVM, and **SPL tokens** on Solana.

#### Native tokens

To configure webhooks for native token transactions, simply select the **Native token** asset type and provide the CAIP-2 chain ID for the network on which to track the native token.

#### ERC20 tokens

To configure webhooks for ERC20 token transfers, simply select the **ERC20 token** asset type and provide:

* the contract address for the ERC20 token
* the CAIP-2 chain ID for the network on which to track the ERC20 token

#### SPL tokens

To configure webhooks for SPL token transfers, simply select the **SPL token** asset type and provide:

* the mint address for the SPL token
* the CAIP-2 chain ID for the network on which to track the SPL token

## Events reference

<CardGroup>
  <Card title="Funds deposited" icon="money-from-bracket" href="/api-reference/webhooks/wallet/funds_deposited">
    Fired when funds are deposited into a wallet.
  </Card>

  <Card title="Funds withdrawn" icon="money-bill-transfer" href="/api-reference/webhooks/wallet/funds_withdrawn">
    Fired when funds are withdrawn from a wallet.
  </Card>
</CardGroup>
\n