> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# null

Privy makes it easy to integrate cross-app wallets from various Privy apps into existing setups with RainbowKit, ConnectKit, wagmi and more using the [`@privy-io/cross-app-connect`](https://www.npmjs.com/package/@privy-io/cross-app-connect) SDK.

Integrating apps do not need to use Privy themselves to integrate cross-app wallets; instead, they can import a Privy cross-app connector directly from the SDK to configure with their wallet connector library. Simply follow the instructions below to get set up!

<img src="https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/connect-only.png?fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=e31dcae6b8dab81bcf6abb9f8e2f0789" alt="The Rainbowkit connector" data-og-width="1483" width="1483" data-og-height="1131" height="1131" data-path="images/connect-only.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/connect-only.png?w=280&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=0510a3ec225ed593499aed568576f954 280w, https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/connect-only.png?w=560&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=63104192f358ade00c97ed87e35dfc80 560w, https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/connect-only.png?w=840&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=ba15e6921b6cfcd4b57685c397ec1e9d 840w, https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/connect-only.png?w=1100&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=37f5e3e23287f168a091d027dd62da20 1100w, https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/connect-only.png?w=1650&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=5a2bd23d3c6937566ceb1e189e14e9c9 1650w, https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/connect-only.png?w=2500&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=6460269a8e3a01e04fa986b78fe14be7 2500w" />

***

## Complete integration guide

The sections below show the full integration steps. If the app already has RainbowKit configured, skip to [step 2](#2-add-the-global-wallet-connector). Otherwise, follow all steps to set up RainbowKit from scratch.

<Tip>
  See our
  [`privy-io/cross-app-connect-demo`](https://github.com/privy-io/examples/tree/main/examples/privy-next-cross-app-connect)
  repo for an example set up.
</Tip>

<Accordion title="Don't have RainbowKit yet? Start here" defaultOpen={false}>
  If the app doesn't use RainbowKit yet, follow steps 1-4 below to set up both RainbowKit and the global wallet connector together.

  If the app already has RainbowKit, skip to [step 2](#2-add-the-global-wallet-connector) to just add the global wallet.
</Accordion>

## 1. Install dependencies

Install the [`@privy-io/cross-app-connect`](https://www.npmjs.com/package/@privy-io/cross-app-connect) SDK and its peer dependencies:

```bash  theme={"system"}
npm i @privy-io/cross-app-connect wagmi @rainbow-me/rainbowkit @tanstack/react-query
```

## 2. Create the global wallet connector

Import the `toPrivyWallet` connector function from `@privy-io/cross-app-connect/rainbow-kit`:

```tsx  theme={"system"}
import {toPrivyWallet} from '@privy-io/cross-app-connect/rainbow-kit';
```

Use the `toPrivyWallet` method to create a wallet connector. The function takes `id`, `name`, and `iconUrl` (described below) and returns a connector that RainbowKit will use to connect to the provider wallet.

### Parameters

<ParamField path="id" type="string" required>
  Privy app ID for the provider application.
</ParamField>

<ParamField path="name" type="string" required>
  The name of the Privy provider application.
</ParamField>

<ParamField path="iconUrl" type="string">
  The URL for the icon that will appear in the modal.
</ParamField>

Call this method within RainbowKit's `connectorsForWallets` function like so:

```tsx  theme={"system"}
import {connectorsForWallets} from '@rainbow-me/rainbowkit';

import {toPrivyWallet} from '@privy-io/cross-app-connect/rainbow-kit';

const connectors = connectorsForWallets(
  [
    {
      groupName: 'Recommended',
      wallets: [
        toPrivyWallet({
          id: 'privy-wallet-app-id',
          name: 'Privy wallet app name',
          iconUrl: 'https://example.com/image.png'
        })
      ]
    }
  ],
  {
    appName: 'Privy',
    projectId: 'Demo'
  }
);
```

Then, pass this array of connectors to your wagmi configuration.

```tsx  theme={"system"}
import {createConfig, http} from 'wagmi';
import {mainnet} from 'wagmi/chains';

export const config = createConfig({
  chains: [mainnet],
  transports: {
    [mainnet.id]: http()
  },
  connectors,
  ssr: true
});
```

This `config` will be passed to the `WagmiProvider` in the next step.

## 3. Wrap app with providers

At the highest level of your applications, wrap the component with the `wagmi`, `QueryClient`, and `RainbowKit` providers. Pass the configuration you created in step 2 to the `wagmi` provider.

```tsx  theme={"system"}
import {RainbowKitProvider} from '@rainbow-me/rainbowkit';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import type {AppProps} from 'next/app';
import {WagmiProvider} from 'wagmi';

import {config} from '../wagmi';

const client = new QueryClient();

function MyApp({Component, pageProps}: AppProps) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={client}>
        <RainbowKitProvider>
          <Component {...pageProps} />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default MyApp;
```

### Complete example

All together, this should look like:

<View title="config.ts" icon="code">
  ```tsx  theme={"system"}
  import {connectorsForWallets} from '@rainbow-me/rainbowkit';
  import {createConfig, http} from 'wagmi';
  import {mainnet} from 'wagmi/chains';

  import {toPrivyWallet} from '@privy-io/cross-app-connect/rainbow-kit';

  const connectors = connectorsForWallets(
    [
      {
        groupName: 'Recommended',
        wallets: [
          toPrivyWallet({
            id: 'privy-wallet-app-id',
            name: 'Privy wallet app name',
            iconUrl: 'https://example.com/image.png'
          })
        ]
      }
    ],
    {
      appName: 'Privy',
      projectId: 'Demo'
    }
  );

  export const config = createConfig({
    chains: [mainnet],
    transports: {
      [mainnet.id]: http()
    },
    connectors,
    ssr: true
  });
  ```
</View>

<View title="providers.tsx" icon="react">
  ```tsx  theme={"system"}
  import {RainbowKitProvider} from '@rainbow-me/rainbowkit';
  import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
  import type {AppProps} from 'next/app';
  import {WagmiProvider} from 'wagmi';

  import {config} from '../wagmi';

  const client = new QueryClient();

  function MyApp({Component, pageProps}: AppProps) {
    return (
      <WagmiProvider config={config}>
        <QueryClientProvider client={client}>
          <RainbowKitProvider>
            <Component {...pageProps} />
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    );
  }
  ```
</View>

## 4. Use the `ConnectButton`

Import the `ConnectButton` and use to prompt users to connect to their provider Privy wallet.

```tsx  theme={"system"}
import {ConnectButton} from '@rainbow-me/rainbowkit';

function Page() {
  return (
    <div>
      <h1> My app </h1>
      ...
      <ConnectButton />
    </div>
  );
}
```

Thats it! You can now use any wagmi hook in your application to interact with the connected wallet. When users connect and transact with their wallet, Privy will open a pop-up for users to authorize any actions.
\n