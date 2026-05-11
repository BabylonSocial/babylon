> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Migrating to 2.0

This guide will help you migrate your Privy React SDK from v1.x.x to v2.0.0.

To install the latest version, install the package from the `latest` tag:

```bash  theme={"system"}
npm i @privy-io/react-auth@latest
```

## New features and improvements 🎉

* Removed ethers v5 dependency, allowing developers to more easily use ethers v6
* Added support for submitting transactions without waiting for confirmation
* Added UIs for Ethereum signTransaction

For the full set of changes check out our [changelog](/changelogs/react-auth).

## Breaking changes

### Authentication

* Guaranteed that `user.wallet` is the first linked wallet on the user object. To maintain state of the latest connected wallet, interact with the wallets array directly.

* Removed the `forkSession` method. This feature was experimental and has been removed.

* Removed the `PrivyProvider`'s deprecated `onSuccess` prop - use the `onSuccess` callback registered via the `useLogin` hook instead.

### Embedded wallets

* Apps using [custom auth providers](/authentication/user-authentication/jwt-based-auth/overview) must now explicitly configure wallet UIs in the dashboard, or use the updated `showWalletUIs` option.

* Removed the `PrivyProvider`'s deprecated `createPrivyWalletOnLogin` prop. Use `config.embeddedWallets.createOnLogin` instead.

```tsx  theme={"system"}
<PrivyProvider
  createPrivyWalletOnLogin={true} // Remove
  config={{
    embeddedWallets: {createOnLogin: 'users-without-wallets'} // Add
  }}
>
  ...
</PrivyProvider>
```

* Removed the deprecated `additionalChains` and `rpcConfig` props from `PrivyProvider` config, please configure these via the `supportedChains`

```tsx  theme={"system"}
<PrivyProvider
  config={{
    additionalChains: [], // Remove
    rpcConfig: {}, // Remove
    supportedChains: [] // Add
  }}
>
  ...
</PrivyProvider>
```

* Removed the deprecated `noPromptOnSignature` configuration option. Configure wallet UIs in the dashboard, or use the updated `showWalletUIs` option.

```tsx  theme={"system"}
<PrivyProvider
  config={{
    embeddedWallets: {
      noPromptOnSignature: true, // Remove
      showWalletUIs: false // Add
    }
  }}
>
  ...
</PrivyProvider>
```

#### EVM

* Removed the deprecated `getEthersProvider` and `getWeb3jsProvider` from the `ConnectedWallet` class. Use `getEthereumProvider` instead.

```ts {skip-check} theme={"system"}
const provider = await wallet.getEthersProvider(); // [!code --]
const privyProvider = await wallet.getEthereumProvider(); // [!code ++]
const provider = new ethers.providers.Web3Provider(privyProvider); // [!code ++]

const provider = await wallet.getWeb3jsProvider(); // [!code --]
const privyProvider = await wallet.getEthereumProvider(); // [!code ++]
const provider = new Web3(privyProvider); // [!code ++]
```

* Ethereum `sendTransaction` method now returns a `Promise<{hash: string}>` instead of a `Promise<TransactionReceipt>`. To get the full details of the submitted transaction, use a library like [viem](https://viem.sh/docs/actions/public/getTransactionReceipt).

```tsx  theme={"system"}
const receipt = await sendTransaction({...}); // [!code --]
const {hash} = await sendTransaction({...}); // [!code ++]
const receipt = await publicClient.waitForTransactionReceipt({hash}); // [!code ++]
```

* Removed the experimental `waitForTransactionConfirmation` config option as it is the default behavior.

```tsx  theme={"system"}
<PrivyProvider
  config={{
    embeddedWallets: {
      waitForTransactionConfirmation: false // [!code --]
    }
  }}
>
  ...
</PrivyProvider>
```

* Updated `signMessage`, `signTypedData`, `sendTransaction`, and `signTransaction` methods:

<Tabs>
  <Tab title="signMessage">
    ```tsx  theme={"system"}
    const {signMessage} = usePrivy();
    // `uiOptions` and `address` are optional
    const signature = await signMessage(message, uiOptions, address); // [!code --]
    // the first argument should be formatted `{message: string}`
    const {signature} = await signMessage({message}, {uiOptions, address}); // [!code ++]
    ```
  </Tab>

  <Tab title="signTypedData">
    ```tsx  theme={"system"}
    const {signTypedData} = usePrivy();
    // `uiOptions` and `address` are optional
    const signature = await signTypedData(typedData, uiOptions, address); // [!code --]
    const {signature} = await signTypedData(typedData, {uiOptions, address}); // [!code ++]
    ```
  </Tab>

  <Tab title="sendTransaction">
    ```tsx  theme={"system"}
    const {sendTransaction} = usePrivy();
    // `uiOptions`, `fundWalletConfig`, and `address` are optional
    const receipt = await sendTransaction(transaction, uiOptions, fundWalletConfig, address); // [!code --]
    const {hash} = await sendTransaction(transaction, {uiOptions, fundWalletConfig, address}); // [!code ++]
    ```
  </Tab>

  <Tab title="signTransaction">
    ```tsx  theme={"system"}
    const {signTransaction} = usePrivy();
    // `uiOptions`, and `address` are optional
    const signature = await signTransaction(transaction, uiOptions, fundWalletConfig, address); // [!code --]
    const {signature} = await signTransaction(transaction, {uiOptions, address}); // [!code ++]
    ```
  </Tab>
</Tabs>

#### Smart Wallets

* Updated `signMessage`, `signTypedData`, and `sendTransaction` methods of the smart wallet client:

<Tabs>
  <Tab title="signMessage">
    ```tsx  theme={"system"}
    import {useSmartWallets} from '@privy-io/react-auth/smart-wallets';

    const {client} = useSmartWallets();
    // `uiOptions` and `address` are optional
    const signature = await client.signMessage({message}, uiOptions, address); // [!code --]
    const signature = await client.signMessage({message}, {uiOptions, address}); // [!code ++]
    ```
  </Tab>

  <Tab title="signTypedData">
    ```tsx  theme={"system"}
    import {useSmartWallets} from '@privy-io/react-auth/smart-wallets';

    const {client} = useSmartWallets();
    // `uiOptions` and `address` are optional
    const signature = await client.signTypedData(typedData, uiOptions, address); // [!code --]
    const signature = await client.signTypedData(typedData, {uiOptions, address}); // [!code ++]
    ```
  </Tab>

  <Tab title="sendTransaction">
    ```tsx  theme={"system"}
    import {useSmartWallets} from '@privy-io/react-auth/smart-wallets';

    const {client} = useSmartWallets();
    // `uiOptions`, `fundWalletConfig`, and `address` are optional
    const hash = await client.sendTransaction(transaction, uiOptions, fundWalletConfig, address); // [!code --]
    const hash = await client.sendTransaction(transaction, {uiOptions, fundWalletConfig, address}); // [!code ++]
    ```
  </Tab>
</Tabs>

#### Solana

* Migrated `useSendSolanaTransaction` from `@privy-io/react-auth` to `useSendTransaction` from `@privy-io/react-auth/solana` (Solana-specific export path)

```tsx  theme={"system"}
import {useSendSolanaTransaction} from '@privy-io/react-auth'; // [!code --]
import {useSendTransaction} from '@privy-io/react-auth/solana'; // [!code ++]

...

const {sendSolanaTransaction} = useSendSolanaTransaction(); // [!code --]
const {sendTransaction} = useSendTransaction(); // [!code ++]
```

* Removed `sendSolanaTransaction` from `usePrivy` in favor of exporting `sendTransaction` from `useSendTransaction` from `@privy-io/react-auth/solana`

```tsx  theme={"system"}
import {usePrivy} from '@privy-io/react-auth'; // [!code --]
import {useSendTransaction} from '@privy-io/react-auth/solana'; // [!code ++]

...

const {sendSolanaTransaction} = usePrivy(); // [!code --]
const {sendTransaction} = useSendTransaction(); // [!code ++]
```

* Removed `delegateWalletAction` from `useSolanaWallets`. Use `delegateWallet` from `useDelegatedActions` instead.

```tsx  theme={"system"}
import {useSolanaWallets} from '@privy-io/react-auth/solana'; // [!code --]
import {useDelegatedActions} from '@privy-io/react-auth'; // [!code ++]

...

const {delegateWalletAction} = useSolanaWallets(); // [!code --]
delegateWalletAction(); // [!code --]

const {delegateWallet} = useDelegatedActions(); // [!code ++]
await delegateWallet({  // [!code ++]
  address: '<wallet to delegate>', // [!code ++]
  chainType: 'solana', // [!code ++]
}); // [!code ++]
```

* Removed rpcUrl from `fundWallet` from `useSolanaWallets`. Set rpcUrl in `config.solanaClusters` prop of the `PrivyProvider` instead

```tsx  theme={"system"}
import {useSolanaWallets} from '@privy-io/react-auth/solana';

const {fundWallet} = useSolanaWallets();
fundWallet({
  address: '<wallet to fund>',
  cluster: {name: 'mainnet-beta', rpcUrl: 'https://api.mainnet-beta.solana.com'}, // [!code --]
  cluster: {name: 'mainnet-beta'} // [!code ++]
});

<PrivyProvider
  appId="your-privy-app-id"
  config={{
    ...theRestOfYourConfig,
    // Replace this with your required clusters and custom RPC URLs
    solanaClusters: [{name: 'mainnet-beta', rpcUrl: 'https://api.mainnet-beta.solana.com'}] // [!code ++]
  }}
>
  {/* your app's content */}
</PrivyProvider>;
```

### Connectors

* Removed the `setActiveWallet` method - use the `wallets` array directly to interact with wallets.

### Callbacks

* Updated all non-error [callbacks](/authentication/user-authentication/login-methods/email) to use named arguments instead of positional arguments.

```tsx  theme={"system"}
const {login} = useLogin({
  onComplete: (user, isNewUser, wasAlreadyAuthenticated, loginMethod, linkedAccount) => { // [!code --]
  onComplete: ({user, isNewUser, wasAlreadyAuthenticated, loginMethod, linkedAccount}) => { // [!code ++]

    console.log(user, isNewUser, wasAlreadyAuthenticated, loginMethod, linkedAccount);
    // Any logic you'd like to execute if the user is/becomes authenticated while this
    // component is mounted
  },
  ...
  onError: (error) => { // onError will continue to stay as a singular error argument
    console.log(error)
  }})

...
 const {reauthorize} = useOAuthTokens({
  onOAuthTokenGrant: (tokens: OAuthTokens, {user}: {user: User}) => {  // [!code --]
  onOAuthTokenGrant: ({tokens, user}) => {  // [!code ++]
    const oAuthToken = tokens.accessToken

  ...
  }})
```
\n