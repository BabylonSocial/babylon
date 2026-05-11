> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Configuring external connectors

Privy supports connecting external wallet on both EVM networks (e.g. MetaMask, Rainbow) and Solana (e.g. Phantom, Solflare) to your application to request signatures and transactions.

## Configuring connectors

<Tabs>
  <Tab title="EVM">
    To connect external wallets on EVM networks, there is **no additional configuration** required for your app. Simply continue with the instructions below to prompt connections to external EVM wallets, like MetaMask or Coinbase Wallet.
  </Tab>

  <Tab title="Solana">
    To connect external wallets on Solana, your application must first explicitly **configure Solana connectors** for Privy. To do so:

    1. Import and configure the `toSolanaWalletConnectors` function from `@privy-io/react-auth/solana`
    2. Enable `'solana-only'` or `'ethereum-and-solana'` as the `config.appearance.walletChainType` prop of your `PrivyProvider`

    <Info>
      You do not need to configure `config.solana.rpcs` for external wallets. RPC clients under
      `solana.rpcs` are only required when using Privy's embedded wallet UIs (UI `signTransaction` and
      `signAndSendTransaction`).
    </Info>

    As an example, you might set up your `PrivyProvider` like so:

    ```tsx  theme={"system"}
    import {toSolanaWalletConnectors} from '@privy-io/react-auth/solana';
    import {createSolanaRpc, createSolanaRpcSubscriptions} from '@solana/kit';

    const solanaConnectors = toSolanaWalletConnectors({
      // By default, shouldAutoConnect is enabled
      shouldAutoConnect: true
    });

    const Provider: React.FC<PropsWithChildren> = ({children}) => {
      return (
        <PrivyProvider
          config={{
            solana: {
              rpcs: {
                // Only needed if you need to use Privy wallets for sending transactions
                'solana:mainnet': {
                  rpc: createSolanaRpc('https://api.mainnet-beta.solana.com'), // or your custom RPC endpoint
                  rpcSubscriptions: createSolanaRpcSubscriptions('wss://api.mainnet-beta.solana.com') // or your custom RPC endpoint
                }
              }
            },
            appearance: {
              // Use 'solana-only' or 'ethereum-and-solana'
              walletChainType: 'solana-only'
            },
            externalWallets: {
              solana: {
                connectors: solanaConnectors
              }
            }
          }}
        >
          {children}
        </PrivyProvider>
      );
    };
    ```

    Note that some Solana wallet connectors do not gracefully support `autoConnect`, which will result in an extension pop-up on page load. If you would like to disable this feature, set it to `false` in the `toSolanaWalletConnectors` function.
  </Tab>
</Tabs>

## Connecting the wallet

To prompt a user to connect an external wallet (on EVM networks or Solana) to your app, use Privy's **`connectWallet`** method:

```tsx  theme={"system"}
import {usePrivy} from '@privy-io/react-auth';

const {connectWallet} = usePrivy();
```

This method will prompt the user to select the wallet they want to connect, and will show users EVM and/or Solana external wallet options based off of the `config.appearance.walletChainType` configured in your app's `PrivyProvider`. You can prompt users to connect as many wallets as you'd like to your app.

For example, you might have a "Connect" button in your app that prompts users to connect their wallet, like so:

```tsx  theme={"system"}
import {usePrivy} from '@privy-io/react-auth';

export default function ConnectWalletButton() {
  const {connectWallet} = usePrivy();
  // Prompt user to connect a wallet with Privy modal
  return <button onClick={connectWallet}>Connect wallet</button>;
}
```

As an optional parameter to `connectWallet`, you may pass an object with the following optional fields:

| Field         | Type                | Description                                                                            |
| ------------- | ------------------- | -------------------------------------------------------------------------------------- |
| `description` | `string`            | A description for the wallet connection prompt, which will be displayed in Privy's UI. |
| `walletList`  | `WalletListEntry[]` | A list of wallet optionsthat you would like Privy to display in the connection prompt. |

<Tabs>
  <Tab title="EVM">
    ```tsx  theme={"system"}
    connectWallet({
      description: 'Connect your wallet to access the app',
      walletList: ['metamask', 'safe']
    });
    ```
  </Tab>

  <Tab title="Solana">
    ```tsx  theme={"system"}
    connectWallet({
      description: 'Connect your wallet to access the app',
      walletList: ['phantom', 'solflare']
    });
    ```
  </Tab>
</Tabs>

Once a user has connected their external wallet to your app, the wallet will appear in either of Privy's **`useWallets`** arrays, which you can then use to request signatures and transactions from the connected wallet.

## Connecting or creating a wallet

You can also use Privy to connect a user's external wallet if they have one, or to create an embedded wallet for them if they do not. To do so, use the **`connectOrCreateWallet`** method of the **`usePrivy`** hook:

```tsx  theme={"system"}
const {connectOrCreateWallet} = usePrivy();
```

This method will prompt the user to connect an external wallet, or log in with email, SMS, or socials, depending on your configured `loginMethods`, to create an embedded wallet.

<Info>
  Privy's `connectOrCreate` interface currently only supports external and embedded wallets on EVM
  networks.
</Info>

For example, you might have a "Connect" button in your app that prompts users to connect their wallet, like so:

```tsx  theme={"system"}
import {usePrivy} from '@privy-io/react-auth';

export default function ConnectWalletButton() {
  const {connectOrCreateWallet} = usePrivy();
  // Prompt user to connect a wallet with Privy modal
  return <button onClick={connectOrCreateWallet}>Connect wallet</button>;
}
```

<Tip>
  This method functions exactly the same as Privy's `login` method, except when users connect their
  external wallet, they will not automatically be prompted to authenticate that wallet by signing a
  message
</Tip>

## Authenticating a connected wallet

Once a user has connected their wallet to your app, and the wallet is available in either of the **`useWallets`** arrays, you can also prompt them to **login** with that wallet or **link** that wallet to their existing account, instead of prompting the entire **`login`** or **`linkWallet`** flow.

To do so, find the **`ConnectedWallet`** or **`ConnectedStandardSolanaWallet`** object from Privy, and call the object's **`loginOrLink`** method for EVM wallets and use the **`useLoginWithSiws`** or **`useLinkWithSiws`** hooks for the Solana wallets:

<Tabs>
  <Tab title="EVM">
    ```tsx  theme={"system"}
    import {useWallets} from '@privy-io/react-auth';

    const {wallets} = useWallets();

    wallets[0].loginOrLink();
    ```
  </Tab>

  <Tab title="Solana">
    ```tsx  theme={"system"}
    import {useWallets} from '@privy-io/react-auth/solana';

    const {wallets} = useWallets();
    const {generateSiwsMessage, loginWithSiws} = useLoginWithSiws();

    const message = await generateSiwsMessage({address: wallets[0].address});
    const encodedMessage = new TextEncoder().encode(message);
    const results = await wallets[0].signMessage({message: encodedMessage});
    const signatureBase64 = Buffer.from(results.signature).toString('base64');
    await loginWithSiws({message, signature: signatureBase64});
    ```
  </Tab>
</Tabs>

When called, **`loginOrLink`** will directly request a [SIWE](https://docs.login.xyz/general-information/siwe-overview/eip-4361) signature from the user's connected wallet to authenticate the wallet.

If the user was not **`authenticated`** when the method was called, the user will become **`authenticated`** after signing the message.

If the user was already **`authenticated`** when the method was called, the user will remain **`authenticated`** after signing the message, and the connected wallet will become one of the user's **`linkedAccounts`** in their **`user`** object.

You might use the methods above to "split up" the connect and sign steps of external wallet login, like so:

<Tabs>
  <Tab title="EVM">
    ```tsx  theme={"system"}
    import {useConnectWallet, useWallets} from '@privy-io/react-auth';

    export default function WalletButton() {
      const {connectWallet} = useConnectWallet();
      const {wallets} = useWallets();

      // Prompt user to connect a wallet with Privy modal
      return (
        <>
          {/* Button to connect wallet */}
          <button onClick={connectWallet}>Connect wallet</button>
          {/* Button to login with or link the most recently connected wallet */}
          <button
            disabled={!wallets[0]}
            onClick={() => {
              wallets[0].loginOrLink();
            }}
          >
            Login with wallet
          </button>
        </>
      );
    }
    ```
  </Tab>

  <Tab title="Solana">
    ```tsx  theme={"system"}
    import {useConnectWallet, useLoginWithSiws} from '@privy-io/react-auth';
    import {useWallets} from '@privy-io/react-auth/solana';

    export default function WalletButton() {
      const {connectWallet} = useConnectWallet();
      const {wallets} = useWallets();
      const {generateSiwsMessage, loginWithSiws} = useLoginWithSiws()

      // Prompt user to connect a wallet with Privy modal
      return (
        {/* Button to connect wallet */}
        <button onClick={connectWallet}>
          Connect wallet
        </button>
        {/* Button to login with or link the most recently connected wallet */}
        <button
          disabled={!wallets[0]}
          onClick={async () => {
            const message = await generateSiwsMessage({address: wallets[0].address})
            const encodedMessage = new TextEncoder().encode(message)
            const results = await wallets[0].signMessage({message: encodedMessage})
            const signatureBase64 = Buffer.from(results.signature).toString('base64');
            await loginWithSiws({message, signature: signatureBase64})
          }}
        >
          Login with wallet
        </button>
      );
    }
    ```
  </Tab>
</Tabs>
\n