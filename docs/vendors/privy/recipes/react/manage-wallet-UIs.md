> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Configuring wallet confirmation modals

Privy allows you to customize showing wallet confirmation modals globally for your application in the Privy Dashboard or in your `PrivyProvider` configuration.

<Note>This is a guide for configuring wallet confirmation modals for the `react-auth` SDK.</Note>

## Dashboard configuration

To toggle displaying wallet confirmation modals navigate to the [Configuration > Authentication > Advanced](https://dashboard.privy.io/apps?logins=advanced\&page=login-methods) tab for your app.

Here you can toggle the `Disable confirmation modals` option across the entire application.

## `PrivyProvider` configuration

<Tip>The `showWalletUIs` option will override the dashboard configuration if one is set.</Tip>

In your `PrivyProvider` configuration, you can toggle the `showWalletUIs` option to enable or disable wallet confirmation modals across the entire application.

```tsx  theme={"system"}
<PrivyProvider
  config={{
    embeddedWallets: {
      showWalletUIs: false
    }
    /** ... */
  }}
>
  <App />
</PrivyProvider>
```

## Customizing wallet confirmation modals for individual function calls

<Tip>
  The `uiOptions.showWalletUIs` option will override the `PrivyProvider` configuration if one is
  set.
</Tip>

Privy allows you to further customize showing wallet confirmation modals for individual function calls by passing the `uiOptions.showWalletUIs` option to the respective function. Learn more in the following sections:

* Ethereum
  * [`signMessage`](/wallets/using-wallets/ethereum/sign-a-message#param-ui-options)
  * [`signTransaction`](/wallets/using-wallets/ethereum/sign-a-transaction#param-options-ui-options)
  * [`signTypedData`](/wallets/using-wallets/ethereum/sign-typed-data#param-ui-options)
  * [`sendTransaction`](/wallets/using-wallets/ethereum/send-a-transaction#param-options-ui-options)
* Solana
  * [`signAndSendTransaction`](/wallets/using-wallets/solana/send-a-transaction#param-ui-options)
  * [`signTransaction`](/wallets/using-wallets/solana/sign-a-transaction#param-ui-options)
  * [`signMessage`](/wallets/using-wallets/solana/sign-a-message#param-ui-options)
\n