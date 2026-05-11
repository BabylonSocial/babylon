> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Configure external connector chains

Privy supports connecting wallets on both EVM networks and Solana to your application. To configure your app for the wallet types you need, follow the steps below.

## Configuring EVM/Solana external connectors

<Tabs>
  <Tab title="EVM and Solana">
    <Tip>
      If you are connecting to Solana wallets, you must also initialize Solana connectors using Privy's `toSolanaWalletConnectors` method and pass them to the `config.externalWallets.solana.connectors` field.
    </Tip>

    In your `PrivyProvider`, set the `config.appearance.walletChainType` to `'ethereum-and-solana'`.

    ```tsx  theme={"system"}
    import {PrivyProvider} from '@privy-io/react-auth';
    import {toSolanaWalletConnectors} from "@privy-io/react-auth/solana";

    <PrivyProvider
      config={{
        appearance: {walletChainType: 'ethereum-and-solana'},
        externalWallets: {solana: {connectors: toSolanaWalletConnectors()}}
      }}
    >
      {children}
    </PrivyProvider>
    ```
  </Tab>

  <Tab title="EVM">
    In your `PrivyProvider`, set the `config.appearance.walletChainType` to `'ethereum-only'`.

    ```tsx  theme={"system"}
    import {PrivyProvider} from '@privy-io/react-auth';

    <PrivyProvider
      config={{
        appearance: {walletChainType: 'ethereum-only'}
      }}
    >
      {children}
    </PrivyProvider>
    ```
  </Tab>

  <Tab title="Solana">
    <Tip>
      If you are connecting to Solana wallets, you must also initialize Solana connectors using Privy's `toSolanaWalletConnectors` method and pass them to the `config.externalWallets.solana.connectors` field.
    </Tip>

    In your `PrivyProvider`, set the `config.appearance.walletChainType` to `'solana-only'`.

    ```tsx  theme={"system"}
    import {PrivyProvider} from '@privy-io/react-auth';
    import {toSolanaWalletConnectors} from "@privy-io/react-auth/solana";

    <PrivyProvider
      config={{
        appearance: {walletChainType: 'solana-only'},
        externalWallets: {
          solana: {connectors: toSolanaWalletConnectors()}
        }
      }}
    >
      {children}
    </PrivyProvider>
    ```
  </Tab>
</Tabs>
\n