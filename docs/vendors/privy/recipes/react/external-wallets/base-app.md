> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Integrating the Base App

The **Base App** is an ERC-4337-compatible smart wallet by Coinbase that users can connect to your application. The Base App supports a variety of extended capabilities, like [spend permissions](https://docs.base.org/base-account/improve-ux/spend-permissions), [gas sponsorship](https://docs.base.org/base-account/improve-ux/sponsor-gas/paymasters), [sub accounts](https://docs.base.org/base-account/improve-ux/sub-accounts) and more.

Learn how to integrate the Base App with Privy in the guide below.

### 1. Set up your React app

First, follow the [React Quickstart](/basics/react/quickstart) to get your app instrumented with Privy's basic functionality. Make sure you have updated your `@privy-io/react-auth` SDK to the latest version.

Next, configure your React app to show the Base Account as one of the external wallet options that users can use to connect to your application.

To do so, pass `'base_account'` to the [`config.appearance.walletList`](/wallets/connectors/setup/configuring-external-connector-wallets) array.

```tsx highlight={5} theme={"system"}
<PrivyProvider
    appId='insert-app-id',
    config={{
        appearance: {
            walletList: ['base_account', ...insertOtherWalletListEntries],
            ...insertRestOfAppearanceConfig
        },
        ...insertRestOfPrivyProviderConfig
    }}
>
    {children}
</PrivyProvider>
```

### 2. Access the Base Account SDK

Next, in your React app, access the instance of the [Base Account SDK](https://github.com/base/account-sdk) using Privy's `useBaseAccountSdk` hook.

```tsx  theme={"system"}
import {useBaseAccountSdk} from '@privy-io/react-auth';
...
const {baseAccountSdk} = useBaseAccountSdk();
```

This SDK instance is your app's entrypoint to the features of the Base Account.

### 3. Use Base Account methods

Finally, use methods on the Base Account SDK such as `getProvider`, `pay`, `subaccount` methods, and more to leverage the capabilities of the Base App in your app.
\n