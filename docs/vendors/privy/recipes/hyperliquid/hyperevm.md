> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# HyperEVM

Learn how to build on HyperEVM using Privy's wallet infrastructure.

<Note>
  Before continuing with this guide, make sure you have set up your Privy client as shown in the
  [Getting Started guide](/recipes/hyperliquid-guide).
</Note>

## Overview

[HyperEVM](https://hyperliquid.gitbook.io/hyperliquid-docs/hyperevm) is Hyperliquid's EVM-compatible blockchain that enables:

* Deploying smart contracts with Solidity
* Building DeFi applications
* Creating custom trading logic
* Integrating with existing EVM tooling

## Setting Up HyperEVM

Configure your application to work with HyperEVM:

<CodeGroup>
  ```javascript NodeJS theme={"system"}
  import {PrivyClient} from '@privy-io/node';
  import {hyperevmTestnet} from 'viem/chains';

  const privy = new PrivyClient({
    appId: 'insert-your-app-id',
    appSecret: 'insert-your-app-secret'
  });

  // Send a transaction on HyperEVM testnet
  const {hash, caip2} = await privy
    .wallets()
    .ethereum()
    .sendTransaction('insert-wallet-id', {
      caip2: `eip155:${hyperevmTestnet.id}`,
      params: {
        transaction: {
          to: '0xE3070d3e4309afA3bC9a6b057685743CF42da77C',
          value: '0x2386F26FC10000',
          chain_id: hyperevmTestnet.id
        }
      }
    });
  ```

  ```javascript React theme={"system"}
  import {PrivyProvider} from '@privy-io/react-auth';
  import {hyperliquidEvmTestnet} from 'viem/chains';

  function App() {
    return (
      <PrivyProvider
        appId={'YOUR_PRIVY_APP_ID'}
        config={{
          defaultChain: hyperliquidEvmTestnet,
          supportedChains: [hyperliquidEvmTestnet]
        }}
      >
        {/* Your app components */}
      </PrivyProvider>
    );
  }
  ```
</CodeGroup>

## Gas Sponsorship

### Smart Wallets on HyperEVM

HyperEVM supports [ERC-4337](https://eips.ethereum.org/EIPS/eip-4337) Smart Wallet accounts, allowing you to pay for your users' transaction fees using gas sponsorship.

<Note>
  HyperEVM is compatible with popular smart wallet providers including Alchemy, ZeroDev, and
  Biconomy. You can use Privy's smart wallet infrastructure with any of these providers.
</Note>

### Setting Up a Paymaster and Bundler

Follow these steps to configure gas sponsorship for HyperEVM:

#### 1. Navigate to Smart Wallets Settings

In your [Privy Dashboard](https://dashboard.privy.io), go to **Wallet Infrastructure** → **Smart Wallets**.

#### 2. Choose a Smart Wallet Provider

Select one of the supported providers:

* **ZeroDev**
* **Alchemy**
* **Biconomy**

#### 3. Add HyperEVM as a Custom Chain

Click **Add a new Chain** → **Custom Chain** and configure HyperEVM:

<img src="https://mintcdn.com/privy-c2af3412/p9eun2yyY6PeENXT/images/hyperevm-custom-chain.png?fit=max&auto=format&n=p9eun2yyY6PeENXT&q=85&s=2fcb2aa00949781113aed4418e06f90b" alt="Configure HyperEVM custom chain" data-og-width="512" width="512" data-og-height="787" height="787" data-path="images/hyperevm-custom-chain.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/privy-c2af3412/p9eun2yyY6PeENXT/images/hyperevm-custom-chain.png?w=280&fit=max&auto=format&n=p9eun2yyY6PeENXT&q=85&s=bf93d236072fe7a6832ff8df91f1b62e 280w, https://mintcdn.com/privy-c2af3412/p9eun2yyY6PeENXT/images/hyperevm-custom-chain.png?w=560&fit=max&auto=format&n=p9eun2yyY6PeENXT&q=85&s=53292388b71f2e6cc7cc7603e428dd54 560w, https://mintcdn.com/privy-c2af3412/p9eun2yyY6PeENXT/images/hyperevm-custom-chain.png?w=840&fit=max&auto=format&n=p9eun2yyY6PeENXT&q=85&s=ba310ad06ada8f85cf2479a1ad226778 840w, https://mintcdn.com/privy-c2af3412/p9eun2yyY6PeENXT/images/hyperevm-custom-chain.png?w=1100&fit=max&auto=format&n=p9eun2yyY6PeENXT&q=85&s=3ff27a8aeecb4cd219ef613a1adb926e 1100w, https://mintcdn.com/privy-c2af3412/p9eun2yyY6PeENXT/images/hyperevm-custom-chain.png?w=1650&fit=max&auto=format&n=p9eun2yyY6PeENXT&q=85&s=a2245b68a1a7aeaf12c23661ea0b2c7d 1650w, https://mintcdn.com/privy-c2af3412/p9eun2yyY6PeENXT/images/hyperevm-custom-chain.png?w=2500&fit=max&auto=format&n=p9eun2yyY6PeENXT&q=85&s=2abdc9250d64559aad88de8459b9b5db 2500w" />

* **Name**: HyperEVM Testnet
* **ID number**: 998
* **RPC URL**: Your HyperEVM RPC endpoint
* **Bundler URL**: Your provider's bundler URL (e.g., `https://rpc.zerodev.app/api/v3/ZERO_DEV_API_KEY/chain/998`)
* **Paymaster URL**: Your provider's paymaster URL (e.g., `https://rpc.zerodev.app/api/v3/ZERO_DEV_API_KEY/chain/998`)

<Warning>
  Make sure the smart wallet contract is deployed on HyperEVM for it to save and function correctly.
</Warning>

#### 4. Save and Test

After configuring the chain, click **Save and close**. Your app can now sponsor gas fees for users on HyperEVM using smart wallets.

## Resources

<CardGroup cols={2}>
  <Card title="HyperEVM Documentation" icon="arrow-up-right-from-square" href="https://hyperliquid.gitbook.io/hyperliquid-docs/hyperevm" arrow>
    Official HyperEVM smart contract documentation
  </Card>

  <Card title="Smart Wallets Documentation" icon="wallet" href="https://docs.privy.io/wallets/using-wallets/evm-smart-wallets/overview" arrow>
    Learn more about using smart wallets, including how to send transactions, batch operations, and
    configure advanced features.
  </Card>
</CardGroup>

## Next Steps

<CardGroup cols={2}>
  <Card title="Building on Hyperliquid with Privy" icon="rocket" href="/recipes/hyperliquid-guide">
    Return to the getting started guide
  </Card>

  <Card title="Executing trades" icon="chart-line" href="/recipes/hyperliquid/trading-patterns">
    Learn common trading patterns
  </Card>
</CardGroup>
\n