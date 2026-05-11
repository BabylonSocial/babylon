> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Using Base Sub Accounts

[Base Sub Accounts](https://docs.base.org/base-account/improve-ux/sub-accounts) are a feature of the [Base Account](https://docs.base.org/base-account/overview/what-is-base-account) (formerly known as Coinbase Smart Wallet) that allow you to streamline the user experience of using a Base Account in your app.

Follow the guide below to learn how to use Base Sub Accounts with Privy.

## Overview

By default, when a user uses their Base Account within their app, the user must authorize every signature and transaction via a passkey prompt. This may be interruptive for your app's user experience, particularly for use cases that require a high-volume of signatures or transactions, such as gaming.

[Sub Accounts](https://docs.base.org/base-account/improve-ux/sub-accounts) enable you to create an Ethereum account derived from the parent Base Account that is *specific to your app*, with its own address, signing capabilities, and transaction history. This Sub Account is owned by another wallet, such as an embedded wallet or a local account, and can be configured to *not* require an explicit (passkey) confirmation from the user on every signature and transaction.

Sub accounts can even transact with the balance of the parent account using Spend Permissions, allowing users to spend this balance without explicit passkey prompts.

## Usage

To set up Sub Accounts in your app that can be controlled by an embedded wallet, follow the guide below.

### 1. Set up your React app

First, follow the [React Quickstart](/basics/react/quickstart) to get your app instrumented with Privy's basic functionality. Make sure you have updated your `@privy-io/react-auth` SDK to the latest version.

Next, configure your React app to:

* Show the Base Account as one of the external wallet options that users can use to connect to your application. To do so, pass `'base_account'` to the [`config.appearance.walletList`](/wallets/connectors/setup/configuring-external-connector-wallets) array.
* Create embedded wallets automatically on login by setting [`config.embedded.ethereum.createOnLogin`](/basics/react/advanced/automatic-wallet-creation) to `'all-users'`.

```tsx  theme={"system"}
<PrivyProvider
    appId='insert-app-id',
    config={{
        appearance: {
            walletList: ['base_account', ...insertOtherWalletListEntries],
            ...insertRestOfAppearanceConfig
        },
        embedded: {
            ethereum: {
                createOnLogin: 'all-users'
            }
        },
        ...insertRestOfPrivyProviderConfig
    }}
>
    {children}
</PrivyProvider>
```

This will ensure that when users connect or login to your application, they have the option to use their Base Account.

### 2. Create or get a Sub Account

Next, after the user logs in, create a new Sub Account or get the existing Sub Account for the user that is tied to your app's domain.

To start, get the connected wallet instances for your user's embedded wallet and Base App by searching for the entries with `walletClientType: 'privy'` and `walletClientType: 'base_account'` respectively in your [`useWallets`](/wallets/wallets/get-a-wallet/get-connected-wallet#ethereum) array:

```tsx  theme={"system"}
import {useWallets} from '@privy-io/react-auth';

const {wallets} = useWallets();
const embeddedWallet = wallets.find((wallet) => wallet.walletClientType === 'privy');
const baseAccount = wallets.find((wallet) => wallet.walletClientType === 'base_account');
// `embeddedWallet` and `baseAccount` must be defined for users to use Sub Accounts
```

Next, switch the network of the Base Account to Base or Base Sepolia, and get the wallet's EIP-1193 provider:

```tsx  theme={"system"}
// Switching to Base Sepolia
await baseAccount.switchChain(84532);
const provider = await baseAccount.getEthereumProvider();
```

Lastly, check if the user has an existing Sub Account using the [`wallet_getSubAccounts`](https://docs.base.org/base-account/improve-ux/sub-accounts#get-existing-sub-account) RPC method. If the user does not have an existing Sub Account, create a new one for them using the [`wallet_addSubAccount`](https://docs.base.org/base-account/improve-ux/sub-accounts#create-a-new-sub-account) RPC:

```tsx  theme={"system"}
// Get existing Sub Account if it exists
const {
  subAccounts: [existingSubAccount]
} = await provider.request({
  method: 'wallet_getSubAccounts',
  params: [
    {
      account: baseAccount.address as `0x${string}`, // The address of your user's Base Account
      domain: window.location.origin // The domain of your app
    }
  ]
});

// Use the existing Sub Account if it exists, otherwise create a new sub account
const subaccount = existingSubAccount
  ? existingSubAccount
  : await provider.request({
      method: 'wallet_addSubAccount',
      params: [
        {
          version: '1',
          account: {
            type: 'create',
            keys: [
              {
                type: 'address',
                publicKey: embeddedWallet.address as Hex // Pass your user's embedded wallet address
              }
            ]
          }
        }
      ]
    });
```

### 3. Configure the SDK to use the embedded wallet for Sub Account operations

Next, configure the Base Account SDK to use the embedded wallet to control Sub Account operations. This allows the embedded wallet to sign messages and transactions on behalf of the Sub Account, avoiding the need for a separate passkey prompt.

Use the `useBaseAccountSdk` hook from Privy's React SDK to access the instance of the Base Account SDK directly, and use the SDK's `subAccount.setToOwnerAccount` method to configure the embedded wallet to sign on behalf of the Sub Account's operations.

As a parameter to this method, pass a function that returns a `Promise` for a viem [`LocalAccount`](https://viem.sh/docs/accounts/local.html) representing the user's embedded wallet. You can use Privy's `toViemAccount` utility method to do so.

```tsx  theme={"system"}
import {useBaseAccountSdk, toViemAccount} from '@privy-io/react-auth';

...

const {baseAccountSdk} = useBaseAccountSdk();
const toOwnerAccount = async () => {
    const account = await toViemAccount({wallet: embeddedWallet});
    return {account};
}
baseAccountSdk.subAccount.setToOwnerAccount(toOwnerAccount);
```

<Expandable title="the code for steps 3 & 4 together to create or get a Sub Account.">
  The code below showcases how to create or get an existing Sub Account for your user, and set the embedded wallet as the Sub Account's owner.

  ```tsx  theme={"system"}
  import {useWallets, useBaseAccountSdk, toViemAccount} from '@privy-io/react-auth';

  // In your React component
  const {wallets} = useWallets();
  const {baseAccountSdk} = useBaseAccountSdk();
  const embeddedWallet = wallets.find((wallet) => wallet.walletClientType === 'privy');
  const baseAccount = wallets.find((wallet) => wallet.walletClientType === 'base_account');

  // Call this function when needed, e.g. in a button's `onClick` handler
  const createOrGetSubAccount = async () => {
    if (!embeddedWallet) throw new Error('User does not have an embedded wallet');
    if (!baseAccount) throw new Error('User has not connected a Base Account');
    if (!baseAccountSdk) throw new Error('Base Account SDK not initialized');

    await baseAccount.switchChain(84532); // Use 8453 for Base Mainnet
    const provider = await baseAccount.getEthereumProvider();

    // Get existing Sub Account
    const {
      subAccounts: [existingSubAccount]
    } = await provider.request({
      method: 'wallet_getSubAccounts',
      params: [
        {
          account: baseAccount.address as `0x${string}`, // The address of your user's Base Account
          domain: window.location.origin // The domain of your app
        }
      ]
    });

    // Create new Sub Account if one does not exist
    const subaccount = existingSubAccount
      ? existingSubAccount
      : await provider.request({
          method: 'wallet_addSubAccount',
          params: [
            {
              version: '1',
              account: {
                type: 'create',
                keys: [
                  {
                    type: 'address',
                    publicKey: embeddedWallet.address as Hex // Pass your user's embedded wallet address
                  }
                ]
              }
            }
          ]
        });

    // Configure privy embedded wallets to power Sub Account operations
    const toOwnerAccount = async () => {
      const account = await toViemAccount({wallet: embeddedWallet});
      return {account};
    };
    baseAccountSdk.subAccount.setToOwnerAccount(toOwnerAccount);
  };
  ```
</Expandable>

### 4. Sign messages and send transactions with the Sub Account

Lastly, you can sign and send transactions with the Sub Account using the Base Account's EIP1193 provider. To ensure that signatures and transactions come from the Sub Account, for each of the following RPCs:

* `personal_sign`: pass the Sub Account's address, not the parent Base Account's address, as the second parameter.
* `eth_signTypedData_v4`: pass the Sub Account's address, not the parent Base Account's address, as the first parameter.
* `eth_sendTransaction`: set `from` in the transaction object to the Sub Account's address, not the parent Base Account's address.

When these methods are invoked, the embedded wallet will sign on behalf of the Sub Account, avoiding the need for an explicit passkey prompt from the user.

<Tabs>
  <Tab title="Sign a message">
    ```tsx  theme={"system"}
    import {toHex} from 'viem';

    const message = 'Hello world';
    const signature = await baseProvider.request({
        method: 'personal_sign',
        params: [toHex(message), subaccount.address] // Pass the Sub Account, not parent Base Account address
    });
    ```
  </Tab>

  <Tab title="Send a transaction">
    ```tsx  theme={"system"}
    import {parseEther} from 'viem';

    const txHash = await baseProvider.request({
        method: 'eth_sendTransaction',
        params: [{
            from: subaccount.address, // Use Sub Account address as sender
            to: 'insert-recipient-address',
            value: parseEther('0.01').toString(),
            data: '0x'
        }]
    });
    ```
  </Tab>

  <Tab title="Send a batch of transactions">
    ```tsx  theme={"system"}
    import {parseEther} from 'viem';

    const userOpHash = await baseProvider.request({
        method: 'wallet_sendCalls',
        params: [{
            from: subaccount.address, // Use Sub Account address
            calls: [{
                to: 'insert-recipient-address',
                value: parseEther('0.01').toString(),
                data: '0x'
            }]
        }]
    });
    ```
  </Tab>
</Tabs>

<Tip>
  You can combine Sub Accounts with [Spend
  Permissions](https://docs.base.org/base-account/improve-ux/spend-permissions) to allow the Sub
  Account to spend from the balance of the parent Base Account in `eth_sendTransaction` requests.
</Tip>
\n