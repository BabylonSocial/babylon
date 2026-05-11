> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# null

Privy makes it easy to integrate cross-app wallets from various Privy apps into existing setups with ConnectKit, wagmi and more using the [`@privy-io/cross-app-connect`](https://www.npmjs.com/package/@privy-io/cross-app-connect) SDK.

Integrating apps do not need to use Privy themselves to integrate cross-app wallets; instead, they can create a custom wagmi connector using the SDK to configure with ConnectKit. Simply follow the instructions below to get set up!

<Tip>
  See our
  [`privy-io/cross-app-connect-demo`](https://github.com/privy-io/cross-app-connect-demo/tree/connectkit-demo)
  repo's ConnectKit branch for an example setup.
</Tip>

## 1. Install dependencies

Install the [`@privy-io/cross-app-connect`](https://www.npmjs.com/package/@privy-io/cross-app-connect) SDK and its peer dependencies:

```bash  theme={"system"}
npm i @privy-io/cross-app-connect wagmi connectkit @tanstack/react-query viem
```

## 2. Create the custom connector

Next, you'll create a custom wagmi connector that integrates with Privy's cross-app-connect functionality. This connector will be fully compatible with ConnectKit and handles all the connection logic for you:

```tsx privy-global-connector.ts expandable theme={"system"}
import {createConnector} from 'wagmi';
import {toPrivyWalletProvider} from '@privy-io/cross-app-connect';
import type {EIP1193Provider} from 'viem';

export interface PrivyGlobalWalletOptions {
  appId: string;
  name: string;
  iconUrl?: string;
  smartWalletMode?: boolean;
}

/**
 * Creates a Privy Global Wallet connector for use with wagmi and ConnectKit
 *
 * @param options - Configuration options for the Privy wallet
 * @returns A wagmi connector configured for Privy cross-app wallets
 */
export function privyGlobalWalletConnector(options: PrivyGlobalWalletOptions) {
  return createConnector((config) => ({
    id: options.appId,
    name: options.name,
    icon: options.iconUrl,
    type: 'injected', // Critical: Use 'injected' type for ConnectKit compatibility

    async setup() {
      // Setup is called when the connector is first created
      // No special setup needed for cross-app-connect
    },

    async connect({chainId} = {}) {
      const provider = await this.getProvider();

      // Request accounts - this triggers the Privy popup
      await provider.request({method: 'eth_requestAccounts'});

      // Switch to requested chain if provided
      if (chainId) {
        try {
          await this.switchChain({chainId});
        } catch (error) {
          console.warn('Failed to switch to requested chain:', error);
        }
      }

      const accounts = await this.getAccounts();
      const currentChainId = await this.getChainId();

      return {
        accounts,
        chainId: currentChainId
      };
    },

    async disconnect() {
      const provider = await this.getProvider();
      try {
        await provider.request({
          method: 'wallet_revokePermissions',
          params: [{eth_accounts: {}}]
        });
      } catch (error) {
        console.warn('Failed to revoke permissions:', error);
      }
    },

    async getAccounts() {
      const provider = await this.getProvider();
      const accounts = await (provider as EIP1193Provider).request({
        method: 'eth_accounts'
      });
      return accounts as `0x${string}`[];
    },

    async getChainId() {
      const provider = await this.getProvider();
      const chainId = await (provider as EIP1193Provider).request({
        method: 'eth_chainId'
      });
      return Number(chainId);
    },

    async getProvider(): Promise<EIP1193Provider> {
      return toPrivyWalletProvider({
        providerAppId: options.appId,
        chains: config.chains,
        smartWalletMode: options.smartWalletMode || false
      }) as EIP1193Provider;
    },

    async isAuthorized() {
      try {
        const accounts = await this.getAccounts();
        return accounts.length > 0;
      } catch {
        return false;
      }
    },

    async switchChain({chainId}) {
      const provider = await this.getProvider();
      const chain = config.chains.find((c) => c.id === chainId);

      if (!chain) {
        throw new Error(`Chain ${chainId} not configured`);
      }

      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{chainId: `0x${chainId.toString(16)}`}]
      });

      return chain;
    },

    onAccountsChanged(accounts) {
      if (accounts.length === 0) {
        config.emitter.emit('disconnect');
      } else {
        config.emitter.emit('change', {
          accounts: accounts as `0x${string}`[]
        });
      }
    },

    onChainChanged(chainId) {
      const id = Number(chainId);
      config.emitter.emit('change', {chainId: id});
    },

    onConnect(connectInfo) {
      config.emitter.emit('connect', {
        accounts: [],
        chainId: Number(connectInfo.chainId)
      });
    },

    onDisconnect() {
      config.emitter.emit('disconnect');
    }
  }));
}
```

## 3. Configure wagmi with ConnectKit

Now you'll set up your wagmi configuration using ConnectKit's `getDefaultConfig` and pass in your custom Privy connector. This step brings everything together:

```tsx  theme={"system"}
import {WagmiProvider, createConfig, http} from 'wagmi';
import {mainnet} from 'wagmi/chains';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {ConnectKitProvider, getDefaultConfig} from 'connectkit';
import {privyGlobalWalletConnector} from './privy-global-connector';

const privyWalletConnector = privyGlobalWalletConnector({
  appId: 'privy-wallet-app-id',
  name: 'Privy wallet app name',
  iconUrl: 'https://example.com/image.png'
});

const config = createConfig(
  getDefaultConfig({
    // Your dApp's chains
    chains: [mainnet],
    transports: {
      // RPC URL for each chain
      [mainnet.id]: http()
    },

    // Required API Keys
    walletConnectProjectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,

    // Required App Info
    appName: 'Your App Name',
    connectors: [privyWalletConnector],

    // Optional App Info
    appDescription: 'Your App Description',
    appUrl: 'https://yourapp.com',
    appIcon: 'https://yourapp.com/logo.png'
  })
);

const queryClient = new QueryClient();

export const Providers = ({children}: {children: React.ReactNode}) => {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider>{children}</ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};
```

## 4. Wrap your app with providers

At the highest level of your application, wrap your components with the `Providers` component you just created:

```tsx  theme={"system"}
import {Providers} from './providers';

function MyApp({Component, pageProps}) {
  return (
    <Providers>
      <Component {...pageProps} />
    </Providers>
  );
}

export default MyApp;
```

### Complete example

Here's how all the pieces fit together in your project structure:

<View title="providers.tsx" icon="react">
  ```tsx  theme={"system"}
  import {WagmiProvider, createConfig, http} from 'wagmi';
  import {mainnet} from 'wagmi/chains';
  import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
  import {ConnectKitProvider, getDefaultConfig} from 'connectkit';
  import {privyGlobalWalletConnector} from './privy-global-connector';

  const privyWalletConnector = privyGlobalWalletConnector({
    appId: 'privy-wallet-app-id',
    name: 'Privy wallet app name',
    iconUrl: 'https://example.com/image.png'
  });

  const config = createConfig(
    getDefaultConfig({
      chains: [mainnet],
      transports: {
        [mainnet.id]: http()
      },
      walletConnectProjectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
      appName: 'Your App Name',
      connectors: [privyWalletConnector],
      appDescription: 'Your App Description',
      appUrl: 'https://yourapp.com',
      appIcon: 'https://yourapp.com/logo.png'
    })
  );

  const queryClient = new QueryClient();

  export const Providers = ({children}: {children: React.ReactNode}) => {
    return (
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <ConnectKitProvider>{children}</ConnectKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    );
  };
  ```
</View>

<View title="privy-global-connector.ts" icon="code">
  ```tsx privy-global-connector.ts expandable theme={"system"}
  import {createConnector} from 'wagmi';
  import {toPrivyWalletProvider} from '@privy-io/cross-app-connect';
  import type {EIP1193Provider} from 'viem';

  export interface PrivyGlobalWalletOptions {
    appId: string;
    name: string;
    iconUrl?: string;
    smartWalletMode?: boolean;
  }

  /**
   * Creates a Privy Global Wallet connector for use with wagmi and ConnectKit
   */
  export function privyGlobalWalletConnector(options: PrivyGlobalWalletOptions) {
    return createConnector((config) => ({
      id: options.appId,
      name: options.name,
      icon: options.iconUrl,
      type: 'injected',

      async connect({chainId} = {}) {
        const provider = await this.getProvider();
        await provider.request({method: 'eth_requestAccounts'});

        if (chainId) {
          try {
            await this.switchChain({chainId});
          } catch (error) {
            console.warn('Failed to switch to requested chain:', error);
          }
        }

        const accounts = await this.getAccounts();
        const currentChainId = await this.getChainId();

        return {accounts, chainId: currentChainId};
      },

      async getProvider(): Promise<EIP1193Provider> {
        return toPrivyWalletProvider({
          providerAppId: options.appId,
          chains: config.chains,
          smartWalletMode: options.smartWalletMode || false
        }) as EIP1193Provider;
      }

      // ... other connector methods
    }));
  }
  ```
</View>

## 5. Use the `ConnectKitButton`

Finally, import the `ConnectKitButton` and use it anywhere in your app to let users connect to their Privy global wallets:

```tsx  theme={"system"}
import {ConnectKitButton} from 'connectkit';

function Page() {
  return (
    <div>
      <h1>My app</h1>
      ...
      <ConnectKitButton />
    </div>
  );
}
```

That's it! You're all set up with Privy global wallets and ConnectKit.

You can now use any wagmi hook in your application to interact with the connected wallet. When users connect and transact with their wallet, Privy will open a secure pop-up for users to authorize any actions, ensuring their private keys never leave the original app.

This integration gives your users seamless access to their existing wallets from other Privy-powered apps, reducing onboarding friction and improving the overall user experience.
\n