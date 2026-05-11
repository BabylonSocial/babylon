> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Configure wallet options

<Tip>
  **Looking for examples?** Check out our [Wallet List Configuration
  Recipes](/recipes/react/wallet-list-configurations) for common configurations with code examples.
</Tip>

To customize the external wallet options for your app, pass in a **`WalletListEntry`** array to the **`config.appearance.walletList`** property. When users login with, connect, or link an external wallet in your app, the possible options (e.g. MetaMask, Rainbow, WalletConnect) will be presented to users in the order you configure them in this array.

```tsx  theme={"system"}
<PrivyProvider
  appId="your-privy-app-id"
  config={{
    appearance: {
      walletList: ['metamask', 'rainbow', 'wallet_connect_qr'],
      ...insertTheRestOfYourAppearanceConfig
    },
    ...insertTheRestOfYourPrivyProviderConfig
  }}
>
  {children}
</PrivyProvider>
```

<Info>
  When your React web app is accessed through the in-app browser of a mobile wallet (e.g., Rainbow,
  Phantom, etc.) and that wallet is selected as a login option, the Privy SDK will automatically
  detect the wallet object and prompt the user to connect in app. However, if your app is accessed
  via a standard browser (e.g., Chrome, Safari, etc.), Privy will default to using WalletConnect for
  mobile wallet connection.
</Info>

You can also configure which wallet options to show at runtime, by passing in `walletList` to the `connectWallet` method:

```tsx  theme={"system"}
import {usePrivy} from '@privy-io/react-auth';

const {connectWallet} = usePrivy();

<button onClick={() => connectWallet({walletList: ['rainbow', 'coinbase_wallet']})}>
  Connect wallet
</button>;
```

***

## Available Wallet List Entries

### Special Entries

| Entry                       | Chain Support | Platform | Description                                                                                      |
| --------------------------- | ------------- | -------- | ------------------------------------------------------------------------------------------------ |
| `detected_ethereum_wallets` | Ethereum      | Desktop  | All detected Ethereum browser extensions not explicitly listed elsewhere                         |
| `detected_solana_wallets`   | Solana        | Desktop  | All detected Solana browser extensions not explicitly listed elsewhere                           |
| `wallet_connect`            | Both\*        | Both     | Shows ALL WalletConnect registry wallets (100+ options) as individual buttons (\*see limitation) |
| `wallet_connect_qr`         | Ethereum      | Desktop  | Shows single "WalletConnect" button with QR code for Ethereum                                    |
| `wallet_connect_qr_solana`  | Solana        | Desktop  | Shows single "WalletConnect" button with QR code for Solana                                      |

<Info>
  **About `detected_*_wallets`**: These entries only include wallets that are **not** explicitly
  listed elsewhere in your `walletList`. For example, if you include both `'metamask'` and
  `'detected_ethereum_wallets'`, MetaMask will appear at the position of `'metamask'`, not under
  `detected_ethereum_wallets`.
</Info>

<Warning>
  **Current Limitation with `wallet_connect` in Multi-Chain Apps**

  If your app supports both Ethereum and Solana (`walletChainType: 'ethereum-and-solana'`), be aware that `wallet_connect` has a session limitation:

  * Once a user connects to an **Ethereum chain** via WalletConnect, they **cannot connect to Solana chains** in the same session

  * Once a user connects to a **Solana chain** via WalletConnect, they **cannot connect to Ethereum chains** in the same session
</Warning>

### Ethereum Wallets

* `metamask` - MetaMask browser extension and mobile wallet
* `coinbase_wallet` - Coinbase Wallet
* `rainbow` - Rainbow wallet
* `zerion` - Zerion wallet
* `safe` - Safe (formerly Gnosis Safe)
* `uniswap` - Uniswap Wallet
* `kraken_wallet` - Kraken Wallet
* `binance` - Binance Wallet
* `okx_wallet` - OKX Wallet
* `bybit_wallet` - Bybit Wallet
* `bitget_wallet` - Bitget Wallet (formerly BitKeep)
* `cryptocom` - Crypto.com DeFi Wallet
* `universal_profile` - Universal Profile
* `ronin_wallet` - Ronin Wallet
* `base_account` - Base Account (formerly Coinbase Smart Wallet)

### Solana Wallets

<Warning>
  **Solana wallets require additional configuration**. You must: 1. Set `walletChainType` to
  `'solana-only'` or `'ethereum-and-solana'` 2. Configure `externalWallets.solana.connectors` with
  `toSolanaWalletConnectors()` See [Configuring external
  connectors](/recipes/react/configuring-external-connectors) for setup instructions.
</Warning>

* `phantom` - Phantom wallet (supports both Ethereum and Solana)
* `solflare` - Solflare wallet
* `backpack` - Backpack wallet
* `jupiter` - Jupiter wallet
* `haha_wallet` - Haha wallet

### Deprecated Entries

<Note>
  * `detected_wallets` - **Deprecated**. Use `detected_ethereum_wallets` or `detected_solana_wallets` instead

  * `rabby_wallet` - **Deprecated**. Rabby Wallet is no longer supported
</Note>

***

## Understanding WalletConnect Options

### `wallet_connect` vs `wallet_connect_qr` vs `wallet_connect_qr_solana`

<Tabs>
  <Tab title="wallet_connect">
    **Shows**: A searchable list of 100+ individual WalletConnect-supported wallets, each with its
    own connection button.

    **Best for:**

    * Desktop users who want to browse available wallets
    * Supporting the long-tail of wallets not explicitly in your list
    * When you want users to see all WalletConnect options

    ```tsx  theme={"system"}
    walletList: ['metamask', 'rainbow', 'wallet_connect']
    ```
  </Tab>

  <Tab title="wallet_connect_qr">
    **Shows**: A single "WalletConnect" button that displays a universal QR code for Ethereum wallets
    when clicked. **Platform**: Desktop only (does not work on mobile browsers) **Best for:** -
    Desktop users connecting their mobile wallets via QR code scan `tsx walletList: ['metamask',
      'rainbow', 'wallet_connect_qr'] `
  </Tab>

  <Tab title="wallet_connect_qr_solana">
    **Shows**: A single "WalletConnect" button that displays a universal QR code for Solana wallets when clicked.

    **Platform**: Desktop only (does not work on mobile browsers)

    ```tsx  theme={"system"}
    walletList: ['phantom', 'solflare', 'wallet_connect_qr_solana']
    ```
  </Tab>
</Tabs>

***

## WalletConnect Configuration FAQ

### Why do I see wallets I didn't configure?

If you include `wallet_connect` in your `walletList`, Privy will show **ALL wallets** from the WalletConnect registry that support your configured chains. To show only specific wallets, remove `wallet_connect` and list individual wallets explicitly.

```tsx  theme={"system"}
// ❌ Shows 100+ wallets from registry
walletList: ['wallet_connect'];

// ✅ Shows only the wallets you specify
walletList: ['metamask', 'rainbow', 'coinbase_wallet', 'wallet_connect_qr'];
```

### Why isn't my wallet showing up?

**Common causes and solutions:**

1. **Chain mismatch** - Solana wallets require `walletChainType: 'solana-only'` or `'ethereum-and-solana'`

```tsx  theme={"system"}
// ❌ WRONG - Solflare won't show (missing Solana configuration)
config: {
  appearance: {
    walletList: ['solflare']
  }
}

// ✅ CORRECT
config: {
  appearance: {
    walletList: ['solflare'],
    walletChainType: 'solana-only'
  },
  externalWallets: {
    solana: {
      // if not specified, solana wallets will show but connector won't work and defaults to opening the wallet installation page
      connectors: toSolanaWalletConnectors()
    }
  }
}
```

2. **Not in walletList** - The wallet must be explicitly included or covered by `detected_*_wallets`

3. **Mobile browser limitations** - Wallets aren't injected in mobile web browser environments, with the exception of the in-app browser for a few wallets (see [In-App Browsers](#in-app-browsers)). Thus, `detected_*_wallets` will show empty in mobile environments

```tsx  theme={"system"}
// ❌ WRONG - Nothing shows on mobile Safari/Chrome
walletList: ['detected_ethereum_wallets'];

// ✅ CORRECT - Works on mobile
walletList: [
  'detected_ethereum_wallets', // Works on desktop
  'metamask' // Works on both
];
```

4. **Extension not installed** - Browser extension wallets only appear if installed (unless using `wallet_connect`)

### What does `detected_ethereum_wallets` / `detected_solana_wallets` do?

These entries show ALL wallets that Privy detects (via EIP-6963, window\.ethereum, or mobile in-app browsers) that **aren't explicitly listed elsewhere** in your `walletList`.

**Important ordering rule:**

<Warning>
  If you have both a specific wallet name (e.g., `'metamask'`) and `'detected_ethereum_wallets'` in
  your list, the wallet will appear at the position of the specific name, NOT at the position of
  `detected_ethereum_wallets`.
</Warning>

```tsx  theme={"system"}
// ❌ POTENTIAL ISSUE - Detected wallets show first
walletList: ['detected_solana_wallets', 'phantom'];
// Result: If Phantom is detected, it appears below detected_solana_wallets
// This can cause confusing duplicate-looking entries

// ✅ CORRECT - Named wallets first, then detected ones
walletList: ['phantom', 'solflare', 'detected_solana_wallets'];
// Result: Phantom and Solflare always show first, then any other detected wallets
```

### Why am I seeing "No wallets found" on mobile?

This typically happens when you only have `detected_*_wallets` or `wallet_connect_qr` entries in your walletList on mobile browsers where they aren't supported.

**Fix:**

```tsx  theme={"system"}
// ❌ WRONG - Nothing shows on mobile browsers
walletList: ['detected_ethereum_wallets', 'wallet_connect_qr'];

// ✅ CORRECT - Add mobile-friendly options
walletList: [
  'detected_ethereum_wallets',
  'metamask', // Shows "Open in MetaMask" option on mobile
  'phantom',
  'rainbow'
];
```

### Can I use WalletConnect's modal directly?

No. Privy handles wallet connections through its own UI for a consistent experience. Attempting to use WalletConnect's modal directly will result in an error:

```
"WalletConnect modal not available - Privy handles wallet connections through its own UI"
```

Instead, use `wallet_connect`, `wallet_connect_qr`, or `wallet_connect_qr_solana` in your `walletList`.

### How does wallet ordering work?

Wallets appear in the **exact order** you specify in `walletList`. Wallets matching `detected_*_wallets` entries appear at that position in the list, sorted alphabetically within their group.

```tsx  theme={"system"}
walletList: [
  'metamask', // Position 1 (if detected, appears here)
  'rainbow', // Position 2
  'detected_ethereum_wallets', // Position 3+ (other detected wallets, alphabetically)
  'wallet_connect_qr' // Last position
];
```

### How do I support a wallet that's not in the detected list?

1. **If the wallet supports WalletConnect**: Add `wallet_connect` to your `walletList` as a fallback
2. **If it's a popular wallet**: Check if it has a dedicated entry in the list above
3. **If it's a new/niche wallet**: Use `wallet_connect` to provide access through the WalletConnect registry

***

## Platform Considerations

### Mobile Browser Limitations

Wallets aren't injected in mobile web browser environments, with the exception of the in-app browser for a few wallets (see [In-App Browsers](#in-app-browsers) section below). Thus, adding `detected_ethereum_wallets` or `detected_solana_wallets` will show empty in mobile environments.

On mobile:

* ✅ **Works**: Specific wallet names (like `'metamask'`, `'phantom'`), `wallet_connect` (full registry)
* ❌ **Doesn't work**: `wallet_connect_qr`, `wallet_connect_qr_solana`, `detected_ethereum_wallets`, `detected_solana_wallets`

**Recommended mobile configuration:**

```tsx  theme={"system"}
walletList: [
  'metamask', // Shows "Open in MetaMask" button
  'phantom',
  'rainbow',
  'coinbase_wallet'
];
```

### In-App Browsers

On mobile, some wallets will connect via the in-app browser of that wallet's mobile app. These wallets include:

* **Phantom** (Ethereum and Solana)
* **Backpack** (Ethereum and Solana)
* **OKX Wallet** (Ethereum and Solana)
* **Solflare** (Solana only)
* **Jupiter Wallet** (Solana only)

When users access your app through one of these wallet's built-in browsers:

* The wallet is automatically detected
* No additional configuration needed
* The detected wallet is prioritized regardless of `walletList` order

### Desktop Optimization

For desktop-focused apps, emphasize detected wallets and browser extensions:

```tsx  theme={"system"}
walletList: [
  'metamask',
  'rainbow',
  'coinbase_wallet',
  'detected_ethereum_wallets', // Shows all installed browser extensions
  'wallet_connect' // Fallback for wallets not installed
];
```

### Dynamic Platform Configuration

You can show different wallets based on the user's platform:

```tsx  theme={"system"}
const {connectWallet} = usePrivy();
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

const openWalletModal = () => {
  connectWallet({
    walletList: isMobile
      ? ['metamask', 'phantom', 'rainbow', 'coinbase_wallet']
      : ['metamask', 'rainbow', 'wallet_connect_qr', 'detected_ethereum_wallets']
  });
};
```

***

## Quick Reference

<Accordion title="Wallet List Entry Cheat Sheet">
  | Entry                       | Shows                                  | Platform                                                    | Chain Support                   |
  | --------------------------- | -------------------------------------- | ----------------------------------------------------------- | ------------------------------- |
  | `detected_ethereum_wallets` | All detected EVM browser extensions    | Desktop (browser extensions), Mobile (in-app browsers only) | Ethereum                        |
  | `detected_solana_wallets`   | All detected Solana browser extensions | Desktop (browser extensions), Mobile (in-app browsers only) | Solana                          |
  | `wallet_connect`            | List of 100+ WalletConnect wallets     | Desktop, Mobile                                             | Both                            |
  | `wallet_connect_qr`         | Universal QR code button               | Desktop only                                                | Ethereum                        |
  | `wallet_connect_qr_solana`  | Universal QR code button               | Desktop only                                                | Solana                          |
  | `metamask`                  | MetaMask option                        | Desktop (extension), Mobile (deep link/in-app)              | Ethereum                        |
  | `phantom`                   | Phantom option                         | Desktop (extension), Mobile (deep link/in-app)              | Solana (+ Ethereum with config) |
  | `coinbase_wallet`           | Coinbase Wallet option                 | Desktop, Mobile                                             | Ethereum                        |
  | `rainbow`                   | Rainbow option                         | Desktop, Mobile                                             | Ethereum                        |

  **Note**: `wallet_connect_qr` and `wallet_connect_qr_solana` are desktop-only features and will not display on mobile browsers.

  **Solana wallets require**: `externalWallets.solana.connectors` configuration and appropriate `walletChainType` setting.
</Accordion>

***

<Accordion title="Using the Base Account (formerly Coinbase Smart Wallet)">
  Coinbase Smart Wallet is now [Base Account](https://www.base.org/build/base-account). If you support Coinbase Smart Wallet, you should add the `base_account` option to your walletList while keeping `coinbase_wallet` if you'd like to maintain support for existing Coinbase Smart Wallet users.

  For more details, see the [Base Account migration guide](https://docs.base.org/base-account/guides/migration-guide).
</Accordion>

***

## Related Resources

* [Wallet List Configuration Recipes](/recipes/react/wallet-list-configurations) - Practical examples for common use cases
* [Configuring External Connectors](/recipes/react/configuring-external-connectors) - Setting up Solana and EVM connectors
* [Connecting External Wallets](/wallets/connectors/usage/connecting-external-wallets) - Using the `connectWallet` method
\n