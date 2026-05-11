> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Quickstart

[Hyperliquid](https://hyperliquid.xyz/) is a high-performance blockchain designed specifically for decentralized derivatives trading. It offers incredibly fast transaction processing, low fees, and a fully onchain open financial system.

This guide demonstrates how to programmatically access Hyperliquid through Privy's SDKs, covering essential operations including agent wallet creation, trade execution, subaccount management, and builder code integration for revenue sharing

## Prerequisites

Before you begin, make sure you have:

* Created a [Privy app](https://dashboard.privy.io) and [enabled gas sponsorship for Abritrum](/wallets/gas-and-asset-management/gas/setup)
* Node.js 16+ installed
* Basic familiarity with TypeScript/JavaScript

## Installation

Install the required dependencies:

```bash  theme={"system"}
npm install @nktkas/hyperliquid @privy-io/node viem
```

## Quickstart

Here's a minimal example to get you started:

```javascript  theme={"system"}
import { PrivyClient } from '@privy-io/node';
import { createViemAccount } from '@privy-io/node/viem';
import * as hl from '@nktkas/hyperliquid';

// Initialize Privy client
const privy = new PrivyClient({
  appId: 'insert-your-app-id',
  appSecret: 'insert-your-app-secret',
});

// Create a wallet
const wallet = await privy.wallets().createWallet({
  chain_type: 'ethereum',
});

// Create a viem account
const account = createViemAccount(privy, {
  walletId: wallet.id,
  address: wallet.address as `0x${string}`,
});

// Initialize Hyperliquid client
const transport = new hl.HttpTransport({
  isTestnet: true,
});

const client = new hl.ExchangeClient({
  transport,
  wallet: account,
});
```

## Placing Your First Order

Once you have your client set up, you can place a limit order:

```javascript  theme={"system"}
// Place a limit buy order for BTC
const order = await client.order({
  orders: [
    {
      a: 0, // Asset index (0 = BTC)
      b: true, // Buy side (true = buy, false = sell)
      p: '95000', // Limit price in USD
      s: '0.001', // Size (0.001 BTC)
      r: false, // Reduce-only (false = can open new position)
      t: {limit: {tif: 'Gtc'}} // Time in force: Good-til-canceled
    }
  ],
  grouping: 'na' // Order grouping (usually "na")
});

console.log('Order placed:', order);
```

<Note>
  This example places a buy order for 0.001 BTC at \$95,000. The order will remain active until it's
  filled or you cancel it. Learn more about different order types and trading patterns in the
  [Trading Patterns guide](/recipes/hyperliquid/trading-patterns).
</Note>

## Funding

### Deposit to HyperCore

To start trading on Hyperliquid, you need to deposit funds to HyperCore. A minimum of **\$5 USDC on Arbitrum** is required to deposit. Funds will be credited to the address that makes the deposit.

```javascript  theme={"system"}
import {encodeFunctionData, parseUnits, erc20Abi} from 'viem';

const HYPERLIQUID_BRIDGE_ADDRESS = '0x2Df1c51E09aECF9cacB7bc98cB1742757f163dF7';
const ARBITRUM_USDC_ADDRESS = '0xaf88d065e77c8cC2239327C5EDb3A432268e5831';

// Deposit USDC from Arbitrum to HyperCore
const transaction = await privy
  .wallets()
  .ethereum()
  .sendTransaction(wallet.id, {
    sponsor: true,
    caip2: 'eip155:42161',
    params: {
      transaction: {
        to: ARBITRUM_USDC_ADDRESS,
        data: encodeFunctionData({
          abi: erc20Abi,
          functionName: 'transfer',
          args: [HYPERLIQUID_BRIDGE_ADDRESS, parseUnits('5', 6)]
        })
      }
    }
  });

console.log(transaction);
```

<Note>
  Learn more about the Hyperliquid bridge in the [official
  documentation](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/bridge2).
</Note>

### Withdraw from HyperCore

To withdraw funds from Hyperliquid back to your wallet, use the `withdraw3` method. Funds will be credited to the `destination` address on Arbitrum as USDC.

```javascript  theme={"system"}
// Withdraw USDC from HyperCore to your wallet
const withdraw = await client.withdraw3({
  destination: wallet.address,
  amount: '5'
});

console.log(withdraw);
```

<Warning>
  Withdrawals are **User Signed Actions** and must be signed by the master wallet. Agent wallets
  cannot initiate withdrawals directly.
</Warning>

### Faucet (Testnet Only)

To use the testnet faucet, your master account must first be activated on mainnet. Send at least **\$5 USDC on Arbitrum** to the bridge address from the master account to activate it.

Once activated, you can claim testnet funds by making an API request:

<CodeGroup>
  ```javascript Fetch theme={"system"}
  const response = await fetch('https://api.hyperliquid-testnet.xyz/info', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      type: 'claimDrip',
      user: wallet.address
    })
  });

  const result = await response.json();
  console.log(result);
  ```

  ```bash Curl theme={"system"}
  curl 'https://api.hyperliquid-testnet.xyz/info' \
    -H 'Content-Type: application/json' \
    --data-raw '{"type":"claimDrip","user":"YOUR_WALLET_ADDRESS"}'
  ```
</CodeGroup>

<Note>
  The faucet provides **\$1000 USDC** for testnet trading. You can only claim from the faucet **once
  per address**.
</Note>

### View Wallet Activity

You can track all deposits, withdrawals, and trading activity by viewing your wallet on the [Hyperliquid explorer](https://app.hyperliquid.xyz/explorer):

<Tip>
  The explorer shows real-time transaction history, trading positions, and account balances for any
  Hyperliquid address.
</Tip>

## Next Steps

Explore these guides to learn more about building with Hyperliquid and Privy:

<CardGroup cols={2}>
  <Card title="Agent wallets" icon="key" href="/recipes/hyperliquid/agents-and-subaccounts">
    Learn how to set up API wallets for secure, programmatic trading operations.
  </Card>

  <Card title="Executing trades" icon="chart-line" href="/recipes/hyperliquid/trading-patterns">
    Discover common trading patterns and best practices for placing orders, managing positions, and
    more.
  </Card>

  <Card title="Client-side SDKs" icon="browser" href="/recipes/hyperliquid/client-side-usage">
    Build React apps with external wallets like MetaMask and agent wallets.
  </Card>

  <Card title="Policies" icon="shield-check" href="/recipes/hyperliquid/policies-and-offline-actions">
    Implement secure trading policies and execute offline actions for advanced risk management.
  </Card>

  <Card title="HyperEVM" icon="code" href="/recipes/hyperliquid/hyperevm">
    Develop smart contracts on Hyperliquid's EVM-compatible blockchain.
  </Card>
</CardGroup>

## Resources

<CardGroup cols={3}>
  <Card title="Hyperliquid Docs" icon="arrow-up-right-from-square" href="https://hyperliquid.gitbook.io/hyperliquid-docs/" arrow>
    Official documentation explaining Hyperliquid's architecture, trading features, and API
    endpoints.
  </Card>

  <Card title="HyperEVM Docs" icon="arrow-up-right-from-square" href="https://hyperliquid.gitbook.io/hyperliquid-docs/hyperevm" arrow>
    Overview of Hyperliquid's EVM chain, including architecture and features.
  </Card>

  <Card title="EVM Transactions with Privy" icon="arrow-up-right-from-square" href="/wallets/using-wallets/ethereum/send-a-transaction" arrow>
    Learn how to send EVM transactions using Privy wallets.
  </Card>
</CardGroup>

## Why Use Privy with Hyperliquid?

* **Security**: Private keys never leave Privy's secure infrastructure
* **Simplicity**: No need to manage key storage or rotation
* **Compatibility**: Full compatibility with Hyperliquid's SDK and API
* **Flexibility**: Easily create and manage multiple wallets for different strategies

<Check>You're ready to start building secure trading applications on Hyperliquid!</Check>
\n