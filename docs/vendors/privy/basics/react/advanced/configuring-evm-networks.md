> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Configuring EVM networks

**Privy is compatible with any EVM-compatible chain, and makes it easy to configure networks for your users' wallets.**

You can seamlessly use Privy with Ethereum Mainnet, Base, Polygon, Arbitrum, Monad, Berachain, MegaETH, Mantle, Story, and any chain that supports EVM RPC requests.

Check out a [high-level overview](/basics/react/advanced/configuring-evm-networks#overview) of network configuration with Privy, or jump directly into [concrete instructions](/basics/react/advanced/configuring-evm-networks#configuration)!

<Tip>
  Privy is also compatible with app-specific chains, such as those deployed via a RaaS provider. See
  more [here](/basics/react/advanced/configuring-evm-networks#other-networks).
</Tip>

## Overview

Privy exposes two parameters to configure networks: a single [**default chain**](/basics/react/advanced/configuring-evm-networks#default-chain) and a list of [**supported chains**](/basics/react/advanced/configuring-evm-networks#supported-chains).

If you choose not to use these parameters in your app, you can instead use Privy's [default configuration and supported chains](/basics/react/advanced/configuring-evm-networks#default-configuration).

### Default Chain

The **default chain** should be the primary network that wallets should use in your app.

For **embedded wallets**, when a user logs in or creates a wallet in your app, Privy will initialize the embedded wallet's network to the default chain. Thereafter, the embedded wallet will by default use the **default chain**, unless you manually switch the wallet's network to another [**supported chain**](/basics/react/advanced/configuring-evm-networks#supported-chains).

For **external wallets**, when a user connects their wallet to your app, Privy will prompt the user to switch their network to the default chain, as long as the wallet supports the network. If the user declines to switch their network to the **default chain**, they will still be permitted to connect their wallet.

<Info>
  Not all wallets support all EVM networks. Please note that the following wallets may reject
  connection requests if you specify one of their unsupported networks as a `defaultChain`: -
  **Rainbow Wallet**'s [mobile app](https://rainbow.me/download) does not support testnets, and will
  reject connections if you specify a testnet as a `defaultChain`. - **Trust Wallet**'s
  [SWIFT](https://trustwallet.com/blog/introducing-trust-wallet-swift) (in beta) only supports BNB
  Smart Chain, Polygon, Avalanche C-Chain, Arbitrum, OP Mainnet, Base, and OpBNB. If you specify a
  `defaultChain` that is not one of these networks, the wallet will reject the connection request.
</Info>

### Supported Chains

The **supported chains** list should be a list of networks that wallets are *permitted* to use in your app. This is intended as a guardrail against accidentally taking actions on the wrong network.

For **embedded wallets**, attempting to send a transaction on or switch the wallet to a network *not* in the list of **supported chains** will throw an error.

For **external wallets**, attempting to programmatically switch the wallet to a network *not* in the list of **supported chains** will throw an error.

If a list of **supported chains** is set but no [**default chain**](/basics/react/advanced/configuring-evm-networks#default-chain) is set:

* Embedded wallets will be connected to the first entry of the **supported chains** list by default.
* External wallets will **not** be prompted to a particular default chain when connecting or logging in; they will be permitted to login on whatever chain they are on. If you'd like to prompt users to switch to a particular network, you should explicitly set a **default chain**.

<Info>
  For external wallets (e.g. MetaMask), users may switch their wallet's network *manually*,
  independent of both Privy and your application. There is no way to prevent this behavior; Privy
  will **not** throw an error, and you can only re-prompt the user to switch to a different network.
</Info>

## Configuration

**Privy embedded wallets can support *any* EVM-compatible chain**.

### `viem`-Supported Networks

<Tip>
  If your desired EVM network is supported by the
  [**`viem/chains`**](https://viem.sh/docs/chains/introduction#chains) package, continue with the
  instructions below. The package's supported networks are listed
  [here](https://github.com/wevm/viem/blob/main/src/chains/index.ts). Otherwise, skip to the
  [**Other Networks**](/basics/react/advanced/configuring-evm-networks#other-networks) section.
</Tip>

To configure [**`viem`**](https://viem.sh/docs/chains/introduction#chains)-supported networks for Privy, **first, install the [`viem`](https://viem.sh/docs/installation#installation) package**. This package contains JSON representations of several EVM networks, which will be used to initialize the Privy SDK.

```sh  theme={"system"}
npm i viem
```

Next, **import your default chain and/or supported chains from the [`viem/chains`](https://viem.sh/docs/chains/introduction#chains) package**:

```tsx  theme={"system"}
// Replace this with any of the networks listed at https://github.com/wevm/viem/blob/main/src/chains/index.ts
import {base, berachain, polygon, arbitrum, story, mantle} from 'viem/chains';
```

**Lastly, configure your `PrivyProvider` with these additional network(s).** In particular, the **`config`** property of the **`PrivyProvider`** contains the optional parameters:

* **`defaultChain`** field, where you should pass a *single* chain object for your desired default chain
* **`supportedChains`** field, where you should pass a *list* of chain objects for your desired supported chains

```tsx {6,8} theme={"system"}
<PrivyProvider
    appId='your-privy-app-id'
    config={{
        ...theRestOfYourConfig,
        // Replace this with your desired default chain
        defaultChain: base
        // Replace this with a list of your desired supported chains
        supportedChains: [base, berachain, polygon, arbitrum, story, mantle]
    }}
>
    {/* your app's content */}
</PrivyProvider>
```

The **`PrivyProvider`** will throw an error if:

* an empty array (`[]`) is passed into **`supportedChains`**
* a chain is passed into **`defaultChain`** that is *not* also included in **`supportedChains`** array

**That's it! You've successfully configured networks for external and embedded wallets in your app.** 🎉

### Other Networks

<Tip>
  If your desired EVM network is **not** supported by
  [**`viem/chains`**](https://viem.sh/docs/chains/introduction#chains), you can still use Privy with
  it per the steps below!
</Tip>

First, **import `viem` and use the package's [`defineChain`](https://viem.sh/docs/chains/introduction#custom-chains) method to build a JSON representation of your desired network.**

```tsx  theme={"system"}
import {defineChain} from 'viem';

export const myCustomChain = defineChain({
  id: 123456789, // Replace this with your chain's ID
  name: 'My Custom Chain',
  network: 'my-custom-chain',
  nativeCurrency: {
    decimals: 18, // Replace this with the number of decimals for your chain's native token
    name: 'My Native Currency Name',
    symbol: 'My Native Currency Symbol'
  },
  rpcUrls: {
    default: {
      http: ['https://my-custom-chain-https-rpc'],
      webSocket: ['wss://my-custom-chain-websocket-rpc']
    }
  },
  blockExplorers: {
    default: {name: 'Explorer', url: 'my-custom-chain-block-explorer'}
  }
});
```

At minimum, you must provide the network's name and chain ID, native currency, RPC URLs, and a blockexplorer URL.

Then, **pass the returned object (`myCustomChain` in the example above) to the `defaultChain` and `supportedChains` properties of the `PrivyProvider`.**

## Overriding a chain's RPC provider

**By default, transactions from the embedded wallet will be sent using Privy's default RPC providers.** Please note that Privy's default providers are subject to rate limits; these limits are sufficiently generous for developing your integration and moderate amounts of app usage.

**As your app's usage scales, we recommend that you setup your own RPC providers** (with [Alchemy](https://www.alchemy.com/), [QuickNode](https://www.quicknode.com/), [Blast](https://blastapi.io/), etc.) and configure Privy to use these providers per the instructions below. Setting up your own providers gives you maximum control over RPC throughput and rate limits, and offers you much more visibility into RPC analytics and common errors.

To configure Privy to use a custom RPC provider, first, **import the chain you want to override, and import the helper function `addRpcUrlOverrideToChain` from `@privy-io/chains` to override the RPC provider**

```ts  theme={"system"}
import {mainnet} from 'viem/chains';

import {addRpcUrlOverrideToChain} from '@privy-io/chains';

const mainnetOverride = addRpcUrlOverrideToChain(mainnet, 'INSERT_CUSTOM_RPC_URL');
```

Now, you can **add the chain returned by `addRpcUrlOverrideToChain` (e.g. `mainnetOverride`) to the `supportedChains` config option** like before.

## Default Configuration

If neither **`defaultChain`** nor **`supportedChains`** is explicitly set for your app, Privy will automatically default to the following list of EVM-compatible networks:

<Tip>
  **Want to use a chain not listed below?** Configure Privy with any EVM-compatible chain, like
  Berachain, Monad, or Story per the guidance
  [here](/basics/react/advanced/configuring-evm-networks#configuration).
</Tip>

<Expandable title="default networks">
  | Network           | [Chain ID](https://chainlist.org/) | Supported? | Privy RPC |
  | ----------------- | ---------------------------------- | ---------- | --------- |
  | Arbitrum          | 42161                              | ✅          | ✅         |
  | Arbitrum Sepolia  | 421614                             | ✅          | ✅         |
  | Avalanche C-Chain | 43114                              | ✅          |           |
  | Avalanche Fuji    | 43113                              | ✅          |           |
  | Base              | 8453                               | ✅          | ✅         |
  | Base Sepolia      | 84532                              | ✅          | ✅         |
  | Berachain Artio   | 80085                              | ✅          |           |
  | Celo              | 42220                              | ✅          |           |
  | Celo Alfajores    | 44787                              | ✅          |           |
  | Ethereum          | 1                                  | ✅          | ✅         |
  | Ethereum Sepolia  | 11155111                           | ✅          | ✅         |
  | Holesky           | 17000                              | ✅          |           |
  | Holesky Redstone  | 17001                              | ✅          |           |
  | Holesky Garnet    | 17069                              | ✅          |           |
  | Lukso             | 42                                 | ✅          |           |
  | Linea             | 59144                              | ✅          |           |
  | Linea Testnet     | 59140                              | ✅          |           |
  | Optimism          | 10                                 | ✅          | ✅         |
  | Optimism Sepolia  | 11155420                           | ✅          | ✅         |
  | Polygon           | 137                                | ✅          | ✅         |
  | Polygon Amoy      | 80002                              | ✅          | ✅         |
  | Redstone          | 690                                | ✅          |           |
  | Zora              | 7777777                            | ✅          |           |
  | Zora Sepolia      | 999999999                          | ✅          |           |
</Expandable>

* External wallets will **not** be prompted to switch networks when connecting to your app.
* Embedded wallets will initialize on **Ethereum mainnet** or the network used in the user's previous session on that device.

For both external and embedded wallets, you can switch a wallet to any of the following networks that are available from Privy out-of-the-box. As a reminder, **you can always [configure Privy with additional EVM networks](/basics/react/advanced/configuring-evm-networks#configuration).**

<Info>
  Security best practices [suggest maintaining a strict Content Security
  Policy](/security/implementation-guide/content-security-policy). In order to help with this, some
  chains are served by Privy out-of-the-box at `*.rpc.privy.systems`. For all other chains, Privy
  will pull from the Viem default RPC URL in its respective [chain
  definition](https://github.com/wevm/viem/tree/main/src/chains/definitions) if no override is
  specified.
</Info>
\n