> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# null

Privy allows apps to easily integrate embedded wallets from other apps. Users can verify ownership of wallet addresses or request signatures and transactions from wallets in other Privy apps.

This reduces friction around having users transact onchain in your app, as users can easily pull in their assets and identity from other apps where they may already have embedded wallets.

Within this setup, your app is known as the **requester** app.

## Quick start: 2 lines of code

For apps already using RainbowKit, adding a global wallet takes just 2 lines:

```tsx  theme={"system"}
import {toPrivyWallet} from '@privy-io/cross-app-connect/rainbow-kit';

const abstractWallet = toPrivyWallet({
  id: 'clq4ktn2s0008pjq97k77ixav',
  name: 'Abstract',
  iconUrl: 'https://app.abs.xyz/icon.png'
});
```

Add `abstractWallet` to the existing RainbowKit `wallets` array and users can connect. See the [RainbowKit integration guide](/wallets/global-wallets/integrate-a-global-wallet/rainbowkit-connector) for complete details.

<CardGroup cols={2}>
  <Card title="RainbowKit connector" icon="wallet" href="/wallets/global-wallets/integrate-a-global-wallet/rainbowkit-connector">
    Using rainbowkit connector
  </Card>

  <Card title="ConnectKit connector" icon="plug" href="/wallets/global-wallets/integrate-a-global-wallet/connectkit-connector">
    Custom connector for ConnectKit apps
  </Card>
</CardGroup>

## Integration approaches

Apps can integrate global wallets in two ways:

1. **Using wallet connectors (recommended)**: Add global wallets to existing RainbowKit or ConnectKit setups without needing the Privy SDK
2. **Using Privy SDK hooks**: Full control over login, linking, and wallet interactions using `useCrossAppAccounts`

Choose wallet connectors for the simplest integration. Choose Privy SDK hooks for custom authentication flows or when the app already uses Privy.

## Finding available providers

To integrate embedded wallets from another app, first visit the [**Privy Dashboard**](https://dashboard.privy.io) and navigate to User management > Global Wallet > [**Integrations**](https://dashboard.privy.io/apps?tab=integrations\&page=ecosystem) tab to see a list of provider app IDs that consent to sharing their wallets with other apps.

For any providers you'd like to integrate, note down the provider's Privy app ID, as you will use this value in the interfaces outlined below.

<Tip>
  Some providers may only consent to sharing their users' wallets in read-only mode, in which case
  your app can verify that the user owns a particular address, but cannot request signatures or
  transactions from it.
</Tip>
\n