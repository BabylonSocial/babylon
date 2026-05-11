> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Integrating with wagmi

[Wagmi](https://wagmi.sh/) is a set of React hooks for interfacing with Ethereum wallets, allowing you read wallet state, request signatures or transactions, and take read and write actions on the blockchain.

**Privy is fully compatible with [wagmi](https://wagmi.sh/), and you can use [wagmi](https://wagmi.sh/)'s React hooks to interface with external and embedded wallets from Privy.** Just follow the steps below!

## Integration steps

This guide assumes you have already integrated Privy into your app. If not, please begin with the Privy [Quickstart](/basics/react/quickstart).

### 1. Install dependencies

Install the latest versions of [**`wagmi`**](https://www.npmjs.com/package/wagmi), [**`@tanstack/react-query`**](https://www.npmjs.com/package/@tanstack/react-query), [**`@privy-io/react-auth`**](https://www.npmjs.com/package/@privy-io/react-auth), and [**`@privy-io/wagmi`**](https://www.npmjs.com/package/@privy-io/wagmi):

```sh  theme={"system"}
npm i wagmi @privy-io/react-auth @privy-io/wagmi @tanstack/react-query
```

### 2. Setup TanStack Query

To start, set up your app with the [TanStack Query's React Provider](https://tanstack.com/query/v5/docs/framework/react/overview). Wagmi uses TanStack Query under the hood to power its data fetching and caching of wallet and blockchain data.

To set up your app with TanStack Query, in the component where you render your **`PrivyProvider`**, import the [**`QueryClient`**](https://tanstack.com/query/v4/docs/reference/QueryClient) class and the [**`QueryClientProvider`**](https://tanstack.com/query/latest/docs/framework/react/reference/QueryClientProvider) component from [**`@tanstack/react-query`**](https://www.npmjs.com/package/@tanstack/react-query):

```tsx  theme={"system"}
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
```

Next, create a new instance of the [**`QueryClient`**](https://tanstack.com/query/v4/docs/reference/QueryClient):

```tsx  theme={"system"}
const queryClient = new QueryClient();
```

Then, like the **`PrivyProvider`**, wrap your app's components with the [**`QueryClientProvider`**](https://tanstack.com/query/latest/docs/framework/react/reference/QueryClientProvider). This must be rendered *inside* the **`PrivyProvider`** component.

```tsx providers.tsx theme={"system"}
<PrivyProvider appId="your-privy-app-id" config={insertYourPrivyConfig}>
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
</PrivyProvider>
```

For the [**`client`**](https://tanstack.com/query/latest/docs/framework/react/reference/QueryClientProvider) property of the [**`QueryClientProvider`**](https://tanstack.com/query/latest/docs/framework/react/reference/QueryClientProvider), pass the [**`queryClient`**](https://tanstack.com/query/v4/docs/reference/QueryClient) instance you created.

### 3. Setup wagmi

Next, setup wagmi. This involves creating your wagmi **`config`** and wrapping your app with the **`WagmiProvider`**.

<Warning>
  While completing the wagmi setup, make sure to import `createConfig` and `WagmiProvider` from
  `@privy-io/wagmi`. Do not import these from `wagmi` directly.
</Warning>

#### Build your wagmi config

To build your [**`wagmi`**](https://wagmi.sh) config, import the `createConfig` method from [**`@privy-io/wagmi`**](https://www.npmjs.com/package/@privy-io/wagmi):

```tsx wagmiConfig.ts theme={"system"}
import {createConfig} from '@privy-io/wagmi';
```

This is a drop-in replacement for [wagmi's native **`createConfig`**](https://wagmi.sh/react/getting-started#create-config), but ensures that the appropriate configuration options are set for the Privy integration. Specifically, it allows Privy to drive wagmi's connectors state, enabling the two libraries to stay in sync.

Next, import your app's required chains from [**`viem/chains`**](https://viem.sh/docs/chains/introduction.html) and the [**`http`**](https://wagmi.sh/core/api/transports/http#http) transport from [**`wagmi`**](https://www.npmjs.com/package/wagmi). Your app's required chains should match whatever you configure as [**`supportedChains`**](/basics/react/advanced/configuring-evm-networks#supported-chains) for Privy.

```tsx  theme={"system"}
import {mainnet, sepolia} from 'viem/chains';
import {http} from 'wagmi';

// Replace this with your app's required chains
```

Lastly, call `createConfig` with your imported chains and the [**`http`**](https://wagmi.sh/core/api/transports/http#http) transport like so:

```tsx wagmiConfig.ts theme={"system"}
// Make sure to import `createConfig` from `@privy-io/wagmi`, not `wagmi`
import {createConfig} from '@privy-io/wagmi';
...
export const config = createConfig({
  chains: [mainnet, sepolia], // Pass your required chains as an array
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    // For each of your required chains, add an entry to `transports` with
    // a key of the chain's `id` and a value of `http()`
  },
});
```

#### Wrap your app with the `WagmiProvider`

Once you've built your wagmi `config`, in the same component where you render your **`PrivyProvider`**, import the `WagmiProvider` component from [**`@privy-io/wagmi`**](https://www.npmjs.com/package/@privy-io/wagmi).

```tsx  theme={"system"}
import {WagmiProvider} from '@privy-io/wagmi';
```

This is a drop-in replacement for [wagmi's native **`WagmiProvider`**](https://wagmi.sh/react/api/WagmiProvider#wagmiprovider), but ensures the necessary configuration properties for Privy are set. Specifically, it ensures that the [**`reconnectOnMount`**](https://wagmi.sh/react/api/WagmiProvider#reconnectonmount) prop is set to false, which is required for handling the embedded wallet. Wallets will still be automatically reconnected on mount.

Then, like the **`PrivyProvider`**, wrap your app's components with the `WagmiProvider`. This must be rendered *inside* both the **`PrivyProvider`** and [**`QueryClientProvider`**](https://tanstack.com/query/latest/docs/framework/react/reference/QueryClientProvider) components.

```tsx providers.tsx theme={"system"}
import {PrivyProvider} from '@privy-io/react-auth';
// Make sure to import `WagmiProvider` from `@privy-io/wagmi`, not `wagmi`
import {WagmiProvider} from '@privy-io/wagmi';
import {QueryClientProvider} from '@tanstack/react-query';
...
<PrivyProvider appId='insert-your-privy-app-id' config={insertYourPrivyConfig}>
  <QueryClientProvider client={queryClient}>
    <WagmiProvider config={config}>
      {children}
    </WagmiProvider>
  </QueryClientProvider>
</PrivyProvider>
```

For the `config` property of the `WagmiProvider`, pass the `config` you created earlier.

#### Complete example

Altogether, this should look like:

<View title="providers.tsx" icon="react">
  ```tsx  theme={"system"}
  import {QueryClient, QueryClientProvider} from '@tanstack/react-query';

  import {PrivyProvider} from '@privy-io/react-auth';
  // Make sure to import these from `@privy-io/wagmi`, not `wagmi`
  import {WagmiProvider, createConfig} from '@privy-io/wagmi';

  import {privyConfig} from './privyConfig';
  import {wagmiConfig} from './wagmiConfig';

  const queryClient = new QueryClient();

  export default function Providers({children}: {children: React.ReactNode}) {
    return (
      <PrivyProvider appId="insert-your-privy-app-id" config={privyConfig}>
        <QueryClientProvider client={queryClient}>
          <WagmiProvider config={wagmiConfig}>{children}</WagmiProvider>
        </QueryClientProvider>
      </PrivyProvider>
    );
  }
  ```
</View>

<View title="wagmiConfig.ts" icon="code">
  ```tsx  theme={"system"}
  import {mainnet, sepolia} from 'viem/chains';
  import {http} from 'wagmi';

  import {createConfig} from '@privy-io/wagmi';

  // Replace these with your app's chains

  export const config = createConfig({
    chains: [mainnet, sepolia],
    transports: {
      [mainnet.id]: http(),
      [sepolia.id]: http()
    }
  });
  ```
</View>

<View title="privyConfig.ts" icon="code">
  ```tsx  theme={"system"}
  import type {PrivyClientConfig} from '@privy-io/react-auth';

  // Replace this with your Privy config
  export const privyConfig: PrivyClientConfig = {
    embeddedWallets: {
      createOnLogin: 'users-without-wallets',
      requireUserPasswordOnCreate: true,
      showWalletUIs: true
    },
    loginMethods: ['wallet', 'email', 'sms'],
    appearance: {
      showWalletLoginFirst: true
    }
  };
  ```
</View>

**That's it! You've successfully integrated Privy alongside [`wagmi`](https://wagmi.sh) in your app! 🎉**

### 4. Use `wagmi` throughout your app

Once you've completed the setup above, you can use [**`wagmi`**](https://wagmi.sh)'s React hooks throughout your app to interface with wallets and take read and write actions on the blockchain.

#### Using `wagmi` hooks

To use [**`wagmi`**](https://wagmi.sh) hooks, like [**`useAccount`**](https://wagmi.sh/react/api/hooks/useAccount#useaccount), in your components, import the hook directly from [**`wagmi`**](https://wagmi.sh) and call it as usual:

```tsx  theme={"system"}
import {useAccount} from 'wagmi';

export default const WalletAddress = () => {
  const {address} = useAccount();
  return <p>Wallet address: {address}</p>;
}
```

<Info>
  Injected wallets, like the MetaMask browser extension, cannot be programmatically disconnected from your site; they can only be manually disconnected. In kind, Privy does not currently support programmatically disconnecting a wallet via wagmi's [`useDisconnect`](https://wagmi.sh/react/api/hooks/useDisconnect) hook. This hook "shims" a disconnection, which can create discrepancies between what wallets are connected to an app vs. wagmi.

  Instead of disconnecting a given wallet, you can always prompt a user to connect a different wallet via the [`connectWallet`](/wallets/connectors/usage/connecting-external-wallets) method.
</Info>

#### When to use Privy vs. `wagmi`

Both Privy's out-of-the-box interfaces and wagmi's React hooks enable you to interface with wallets and to request signatures and transactions.

If your app integrates Privy alongside wagmi, you should:

* use Privy to connect external wallets and create embedded wallets
* use [**`wagmi`**](https://wagmi.sh) to take read or write actions from a connected wallet

#### Updating the active wallet

With Privy, users may have multiple wallets connected to your app, but [**`wagmi`**](https://wagmi.sh)'s React hooks return information for only *one* connected wallet at a time. This is referred to as the **active wallet**.

To update [**`wagmi`**](https://wagmi.sh) to return information for a *different* connected wallet, first import the **`useWallets`** hook from [**`@privy-io/react-auth`**](https://www.npmjs.com/package/@privy-io/react-auth) and the `useSetActiveWallet` hook from [**`@privy-io/wagmi`**](https://www.npmjs.com/package/@privy-io/wagmi):

```tsx  theme={"system"}
import {useWallets} from '@privy-io/react-auth';
import {useSetActiveWallet} from '@privy-io/wagmi';
```

Then, find your desired active wallet from the **`wallets`** array returned by **`useWallets`**

```tsx  theme={"system"}
const {wallets} = useWallets();
// Replace this logic to find your desired wallet
const newActiveWallet = wallets.find((wallet) => wallet.address === 'insert-your-desired-address');
```

Lastly, pass your desired active wallet to the `setActiveWallet` method returned by the `useSetActiveWallet` hook:

```tsx  theme={"system"}
await setActiveWallet(newActiveWallet);
```

## Demo app

Check out our [wagmi demo app](https://wagmi-app.vercel.app) to see the hooks listed above in action.

Feel free to take a look at the [app's source code](https://github.com/privy-io/examples/tree/main/examples/privy-next-wagmi) to see an end-to-end implementation of Privy with wagmi.
\n