> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Migrating to 3.0

This guide will help you migrate your Privy React SDK from v2.x.x to v3.0.0.

To install the latest version:

```bash  theme={"system"}
npm i @privy-io/react-auth@3
```

## New features and improvements 🎉

* Simplified Solana integration with one wallet per account and direct method access
* Streamlined peer dependencies required for Solana
* Removal of deprecated fields and methods

For the full set of changes check out our [changelog](/changelogs/react-auth).

## Solana Updates

### Update Peer Dependencies

If your app uses Privy's Solana wallets, the required peer dependencies have changed in v3.0:

**Remove these peer dependencies:**

* `@solana/web3.js`
* `@solana/spl-token`

**Install these new peer dependencies:**

* `@solana/kit`
* `@solana-program/memo`
* `@solana-program/system`
* `@solana-program/token`

<Accordion title="Webpack configurations">
  Additionally, if you are using webpack, include the following configurations to add them to webpack's `externals` config. Note that these configurations are not needed if you are using Turbopack:

  ```js  theme={"system"}
  // webpack.config.js
  module.exports = {
    //...
    externals: {
      ['@solana/kit']: 'commonjs @solana/kit',
      ['@solana-program/memo']: 'commonjs @solana-program/memo',
      ['@solana-program/system']: 'commonjs @solana-program/system',
      ['@solana-program/token']: 'commonjs @solana-program/token'
    }
  };

  // next.config.js
  module.exports = {
    webpack: (config) => {
      // ...
      config.externals['@solana/kit'] = 'commonjs @solana/kit';
      config.externals['@solana-program/memo'] = 'commonjs @solana-program/memo';
      config.externals['@solana-program/system'] = 'commonjs @solana-program/system';
      config.externals['@solana-program/token'] = 'commonjs @solana-program/token';
      return config;
    }
  };
  ```
</Accordion>

### Solana RPC configuration

* For Privy embedded wallet flows only (UI `signTransaction` and `signAndSendTransaction`), set RPCs in `config.solana.rpcs`. This replaces `solanaClusters`.

```tsx  theme={"system"}
import {createSolanaRpc, createSolanaRpcSubscriptions} from '@solana/kit'; // [!code ++]

<PrivyProvider
  appId="your-privy-app-id"
  config={{
    ...theRestOfYourConfig,
    solanaClusters: [{name: 'mainnet-beta', rpcUrl: 'https://api.mainnet-beta.solana.com'}] // [!code --]
    solana: {  // [!code ++]
      rpcs: { // [!code ++]
        'solana:mainnet': { // [!code ++]
          rpc: createSolanaRpc('https://api.mainnet-beta.solana.com'), // [!code ++]
          rpcSubscriptions: createSolanaRpcSubscriptions('wss://api.mainnet-beta.solana.com') // [!code ++]
        }, // [!code ++]
      }
    }
  }}
>
  {/* your app's content */}
</PrivyProvider>;
```

### Replace `useSolanaWallets`

* Replace `useSolanaWallets` with `useWallets`, `useCreateWallet`, and `useExportWallet` from the Solana entrypoint. The new `useWallets` hook returns `ConnectedStandardSolanaWallet[]`.

```tsx  theme={"system"}
import {useSolanaWallets} from '@privy-io/react-auth/solana'; // [!code --]
import {useWallets, useCreateWallet, useExportWallet} from '@privy-io/react-auth/solana'; // [!code ++]

const {ready, wallets, createWallet, exportWallet} = useSolanaWallets(); // [!code --]
const {ready, wallets} = useWallets(); // [!code ++]
const {createWallet} = useCreateWallet(); // [!code ++]
const {exportWallet} = useExportWallet(); // [!code ++]
```

Key differences between `ConnectedSolanaWallet` and `ConnectedStandardSolanaWallet`:

* Each `wallet` represents a single connected account
* Methods are available directly on the wallet instance:
  * `wallet.signMessage({message})`
  * `wallet.signTransaction({transaction, chain})`
  * `wallet.signAndSendTransaction({transaction, chain})`
  * `wallet.signAndSendAllTransaction({transaction, chain}[])`
  * `wallet.disconnect()`
* The [Solana standard wallet](https://docs.phantom.com/developer-powertools/wallet-standard) is available at `wallet.standardWallet` (for icon/name/etc.)
* **Removed `wallet.loginOrLink()` method** - Use `useLoginWithSiws` and `useLinkWithSiws` instead:

```tsx  theme={"system"}
import {useLoginWithSiws, useLinkWithSiws} from '@privy-io/react-auth'; // [!code ++]

const {generateSiwsMessage, loginWithSiws} = useLoginWithSiws(); // [!code ++]
const {generateSiwsMessage, linkWithSiws} = useLinkWithSiws(); // [!code ++]

// Login flow
await wallets[0].loginOrLink(); // [!code --]
const message = await generateSiwsMessage({address: wallets[0].address}); // [!code ++]
const encodedMessage = new TextEncoder().encode(message); // [!code ++]
const results = await wallets[0].signMessage({message: encodedMessage}); // [!code ++]
await loginWithSiws({message: encodedMessage, signature: results.signature}); // [!code ++]

// Link flow (similar pattern with linkWithSiws)
const results = await wallets[0].signMessage({message: encodedMessage}); // [!code ++]
await linkWithSiws({message: encodedMessage, signature: results.signature}); // [!code ++]
```

### Rename `useSendTransaction`

* Update `useSendTransaction` from `@privy-io/react-auth/solana` to `useSignAndSendTransaction` from `@privy-io/react-auth/solana`

```tsx  theme={"system"}
import {useSendTransaction} from '@privy-io/react-auth/solana'; // [!code --]
import {useSignAndSendTransaction} from '@privy-io/react-auth/solana'; // [!code ++]

...

const {sendTransaction} = useSendTransaction(); // [!code --]
const {signAndSendTransaction} = useSignAndSendTransaction(); // [!code ++]
```

### Usage Examples

* All Solana RPCs now expect buffer inputs.

#### New solana wallet usage

```tsx  theme={"system"}
import {useWallets, type ConnectedStandardSolanaWallet} from '@privy-io/react-auth/solana';
import {TextEncoder} from '@solana/kit';

export function SolanaWallets() {
  const {ready, wallets} = useWallets();
  if (!ready) return <p>Loading...</p>;

  return (
    <div>
      {wallets.map((wallet: ConnectedStandardSolanaWallet) => (
        <div key={wallet.address}>
          <img src={wallet.standardWallet.icon} width={16} height={16} />
          <span>{wallet.standardWallet.name}</span>
          <code>{wallet.address}</code>
          <button
            onClick={async () => {
              const message = new TextEncoder().encode('Hello, world!');
              const {signature} = await wallet.signMessage({message});
              console.log('signature', signature);
            }}
          >
            Sign message
          </button>
        </div>
      ))}
    </div>
  );
}
```

#### Sign and send via hooks (with optional UI configuration)

```tsx  theme={"system"}
import {
  useWallets,
  useSignMessage,
  useSignTransaction,
  useSignAndSendTransaction
} from '@privy-io/react-auth/solana';

export function Actions() {
  const {wallets} = useWallets();
  const {signMessage} = useSignMessage();
  const {signTransaction} = useSignTransaction();
  const {signAndSendTransaction} = useSignAndSendTransaction();

  const wallet = wallets[0];
  if (!wallet) return null;

  return (
    <div>
      <button
        onClick={async () => {
          const message = new TextEncoder().encode('Hello from Privy');
          const {signature} = await signMessage({
            wallet,
            message,
            options: {uiOptions: {showWalletUIs: true}}
          });
          console.log(signature);
        }}
      >
        Sign message (hook)
      </button>

      <button
        onClick={async () => {
          // Create an encoded transaction using @solana/kit or @web3.js
          const transaction = tx; // type Uint8Array
          const {signedTransaction} = await signTransaction({
            wallet,
            transaction,
            chain: 'solana:devnet'
          });
          console.log(signedTransaction);
        }}
      >
        Sign transaction (hook)
      </button>

      <button
        onClick={async () => {
          // Create an encoded transaction using @solana/kit or @web3.js
          const transaction = tx; // type Uint8Array
          const {signature} = await signAndSendTransaction({
            wallet,
            transaction,
            chain: 'solana:devnet'
          });
          console.log(signature);
        }}
      >
        Sign & send (hook)
      </button>
    </div>
  );
}
```

## Other interface changes

### Funding

* **Updated `fundWallet` interface**

```tsx  theme={"system"}
import {useFundWallet: useFundSolanaWallet} from '@privy-io/react-auth/solana';
import {useFundWallet: useFundEthereumWallet} from '@privy-io/react-auth';

...

const {fundWallet} = useFundSolanaWallet();
await fundWallet('<solana address>', {amount: '1', asset: 'native-currency', chain: 'solana:devnet'}); // [!code --]
await fundWallet({ // [!code ++]
  address: '<solana address>', // [!code ++]
  options: {amount: '1', asset: 'SOL', chain: 'solana:devnet'} // [!code ++]
}); // [!code ++]

const {fundWallet} = useFundEthereumWallet();
await fundWallet('<ethereum address>', {amount: '1000', asset: 'native-currency', chain: {id: 1}}); // [!code --]
await fundWallet({ // [!code ++]
  address: '<ethereum address>', // [!code ++]
  options: {amount: '1000', asset: 'native-currency', chain: {id: 1}} // [!code ++]
}); // [!code ++]

```

## Removed/Deprecated Items

* **Removed `suggestedAddress` from `connectWallet` and `linkWallet`**

```tsx  theme={"system"}
connectWallet({suggestedAddress: '0x123...'}); // [!code --]
connectWallet({description: `Connect the wallet with address ${address}`}); // [!code ++]
```

* **Removed `detected_wallets` from wallet lists/configuration**

```tsx  theme={"system"}
<PrivyProvider
  config={{
    appearance: {
      walletList: [
        'detected_wallets', // [!code --]
        'detected_ethereum_wallets', // [!code ++]
        'detected_solana_wallets', // [!code ++]
        'metamask'
        // ...
      ]
    }
    // ...
  }}
>
  {/* your app's content */}
</PrivyProvider>
```

* **Removed deprecated Moonpay config and types, add config to `PrivyProviderConfig` instead**

```tsx  theme={"system"}
fundEvmWallet(address, {
  config: {
    // [!code --]
    currencyCode: 'ETH_ETHEREUM', // [!code --]
    quoteCurrencyAmount: 0.01 // [!code --]
    // [!code --]
  }, // [!code --]
  provider: 'moonpay' // [!code --]
});

<PrivyProvider
  config={{
    fundingMethodConfig: {moonpay: {useSandbox: true}} // [!code ++]
    // ...
  }}
>
  ...
</PrivyProvider>;

fundEvmWallet(address, {
  chain: mainnet, // [!code ++]
  amount: '0.01', // [!code ++]
  defaultFundingMethod: 'card' // [!code ++]
});
```

* **Removed deprecated `requireUserPasswordOnCreate` and related embedded wallet config fields**
* \*\*Removed `embeddedWallets` level `createOnLogin` field. Use `embeddedWallets.etherum.createOnLogin` or `embeddedWallets.solana.createOnLogin` instead. \*\*

```tsx  theme={"system"}
<PrivyProvider
  config={{
    embeddedWallets: {
      requireUserPasswordOnCreate: true, // [!code --]
      createOnLogin: 'all-users', // [!code --]
      ethereum: {createOnLogin: 'all-users'} // [!code ++]
      // ...
    }
    // ...
  }}
>
  {/* your app's content */}
</PrivyProvider>
```

* **Removed `useLoginToFrame` and replaced with `useLoginToMiniApp`**

```tsx  theme={"system"}
export {useLoginToFrame} from '@privy-io/react-auth'; // [!code --]
export {useLoginToMiniApp} from '@privy-io/react-auth'; // [!code ++]
```

* **Removed `useSignAuthorization()` - Use `useSign7702Authorization()` instead**

```tsx  theme={"system"}
import {useSignAuthorization} from '@privy-io/react-auth'; // [!code --]
import {useSign7702Authorization} from '@privy-io/react-auth'; // [!code ++]

const {signAuthorization} = useSignAuthorization(); // [!code --]
const {sign7702Authorization} = useSign7702Authorization(); // [!code ++]
```

* **Removed `useSetWalletPassword()` - Use `useSetWalletRecovery` instead**

```tsx  theme={"system"}
import {useSetWalletPassword} from '@privy-io/react-auth'; // [!code --]
import {useSetWalletRecovery} from '@privy-io/react-auth'; // [!code ++]

const {setWalletPassword} = useSetWalletPassword(); // [!code --]
const {setWalletRecovery} = useSetWalletRecovery(); // [!code ++]
```

### Updated Types

* **Removed `verifiedAt` from `LinkMetadata` and all linked accounts. Use `firstVerifiedAt` and `latestVerifiedAt` instead of the deprecated `verifiedAt`.**

```tsx  theme={"system"}
const verifiedDate = user.wallet.verifiedAt; // [!code --]
const verifiedDate = user.wallet.firstVerifiedA; // [!code ++]
```
\n