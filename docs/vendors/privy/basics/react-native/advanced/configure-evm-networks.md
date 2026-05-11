> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Configuring EVM networks

Read below to learn how to configure supported EVM networks for the Expo SDK and how to switch the embedded wallet's current network.

## Configuring networks

**Privy embedded wallets can support *any* EVM-compatible chain**. You can configure EVM networks for Privy via the **`supportedChains`** property of the **`PrivyProvider`** component, per the instructions below.

### Configuring `viem`-supported networks

<Tip>
  If your desired EVM network is supported by the popular [**`viem/chains`**](https://viem.sh/docs/chains/introduction#chains) package, continue with the instructions below. A full list of the package's supported networks is available [here](https://github.com/wevm/viem/blob/main/src/chains/index.ts).

  Otherwise, skip to the [**Other Networks**](#other-networks) section.
</Tip>

To configure [**`viem`**](https://viem.sh/docs/chains/introduction#chains)-supported networks for Privy, **first, install the [`viem`](https://viem.sh/docs/installation#installation) package**. This package contains JSON representations of several EVM networks, which will be used to initialize the Privy SDK.

```sh  theme={"system"}
npm i viem
```

Next, **import your required chains from the [`viem/chains`](https://viem.sh/docs/chains/introduction#chains) package**:

```tsx  theme={"system"}
// Replace this with any of the networks listed at https://viem.sh/docs/chains/introduction#chains
import {base, baseGoerli, mainnet, goerli, polygon, polygonMumbai} from 'viem/chains';
```

**Lastly, configure the `supportedChains` prop of your `PrivyProvider` with an array including your required networks.**:

```tsx  theme={"system"}
<PrivyProvider
  appId="your-privy-app-id"
  supportedChains={[base, baseGoerli, mainnet, goerli, polygon, polygonMumbai]}
>
  {/* your app's content */}
</PrivyProvider>
```

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

Then, **pass the returned object (`myCustomChain` in the example above) to the `supportedChains` array of the `PrivyProvider`,** like above.

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
\n