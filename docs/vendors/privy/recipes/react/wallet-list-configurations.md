> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Wallet List Configuration Recipes

> Common wallet list configurations with examples and screenshots

This guide provides practical examples for configuring your `walletList` to achieve common desired wallet connection setups. Each recipe includes the configuration code and explains when to use it.

<Info>
  The `walletList` controls which wallet options appear in Privy's connection modal and in what
  order. For detailed API reference, see [Configure wallet
  options](/wallets/connectors/setup/configuring-external-connector-wallets).
</Info>

## Quick Decision Guide

**What do you want to show users?**

* **Show ALL WalletConnect wallets (100+)** → Use `wallet_connect`
* **Show a QR code for Ethereum wallets** → Use `wallet_connect_qr`
* **Show a QR code for Solana wallets** → Use `wallet_connect_qr_solana`
* **Show only specific wallets** → List them explicitly (e.g., `['phantom', 'metamask']`)
* **Show all detected browser extensions** → Use `detected_ethereum_wallets` / `detected_solana_wallets`

***

## Recipe 1: Ethereum Wallets with Popular Options

**Use case**: Standard Ethereum app with popular wallet options plus WalletConnect fallback

```tsx  theme={"system"}
<PrivyProvider
  appId="your-app-id"
  config={{
    appearance: {
      walletList: [
        'metamask',
        'coinbase_wallet',
        'rainbow',
        'detected_ethereum_wallets',
        'wallet_connect_qr'
      ],
      walletChainType: 'ethereum-only'
    }
  }}
>
  {children}
</PrivyProvider>
```

**What users see:**

1. MetaMask (if installed, shown first)
2. Coinbase Wallet
3. Rainbow
4. Any other detected Ethereum browser extensions (alphabetically)
5. WalletConnect button (shows QR code when clicked)

**Best for:**

* Ethereum-focused applications
* Desktop users with browser extensions
* Apps that want to support mobile wallets via QR codes

***

## Recipe 2: Solana Wallets Only

**Use case**: Solana-focused application with popular Solana wallets

```tsx  theme={"system"}
import {toSolanaWalletConnectors} from '@privy-io/react-auth/solana';

const solanaConnectors = toSolanaWalletConnectors({
  shouldAutoConnect: true
});

<PrivyProvider
  appId="your-app-id"
  config={{
    appearance: {
      walletList: [
        'phantom',
        'solflare',
        'backpack',
        'detected_solana_wallets',
        'wallet_connect_qr_solana'
      ],
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
</PrivyProvider>;
```

<Warning>
  **Required for Solana**: You must configure `externalWallets.solana.connectors` and set
  `walletChainType` to `'solana-only'` or `'ethereum-and-solana'` for Solana wallets to appear.
</Warning>

**What users see:**

1. Phantom (prioritized first)
2. Solflare
3. Backpack
4. Any other detected Solana browser extensions
5. WalletConnect button for Solana wallets

**Best for:**

* Solana-only applications
* NFT marketplaces on Solana
* Solana DeFi applications

***

## Recipe 3: Multi-Chain (Ethereum + Solana)

**Use case**: Cross-chain application supporting both Ethereum and Solana

```tsx  theme={"system"}
import {toSolanaWalletConnectors} from '@privy-io/react-auth/solana';

const solanaConnectors = toSolanaWalletConnectors({
  shouldAutoConnect: true
});

<PrivyProvider
  appId="your-app-id"
  config={{
    appearance: {
      walletList: [
        'phantom', // Multi-chain (shown with badge)
        'metamask', // Ethereum only
        'solflare', // Solana only (shown with badge)
        'coinbase_wallet', // Ethereum only
        'detected_ethereum_wallets',
        'detected_solana_wallets',
        'wallet_connect_qr', // Ethereum WalletConnect
        'wallet_connect_qr_solana' // Solana WalletConnect
      ],
      walletChainType: 'ethereum-and-solana'
    },
    externalWallets: {
      solana: {
        connectors: solanaConnectors
      }
    }
  }}
>
  {children}
</PrivyProvider>;
```

**What users see:**

* Both Ethereum and Solana wallets in one list
* Solana wallets display with a "Solana" badge
* Two separate WalletConnect options (one for each chain)

**Best for:**

* Cross-chain applications
* Portfolio tracking apps
* Multi-chain DeFi platforms

<Info>
  When `walletChainType` is set to `'ethereum-and-solana'`, Privy automatically adds badges to
  Solana wallets to help users distinguish between chain types.
</Info>

***

## Recipe 4: Minimal Setup - Just Phantom and WalletConnect

**Use case**: Solana app that primarily uses Phantom with WalletConnect fallback

```tsx  theme={"system"}
import {toSolanaWalletConnectors} from '@privy-io/react-auth/solana';

const solanaConnectors = toSolanaWalletConnectors({
  shouldAutoConnect: true
});

<PrivyProvider
  appId="your-app-id"
  config={{
    appearance: {
      walletList: ['phantom', 'wallet_connect_qr_solana'],
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
</PrivyProvider>;
```

**What users see:**

* Only Phantom and WalletConnect options
* Clean, minimal UI
* No other wallet options displayed

**Best for:**

* Apps with strong Phantom user base
* Simplified onboarding flows
* Mobile-first Solana applications

**Warning**: Users with other wallets (like Solflare or Backpack) won't see connection options unless they use WalletConnect.

***

## Recipe 5: Show All WalletConnect Registry Wallets

**Use case**: Maximum wallet compatibility - show every WalletConnect-supported wallet

```tsx  theme={"system"}
<PrivyProvider
  appId="your-app-id"
  config={{
    appearance: {
      walletList: [
        'metamask',
        'coinbase_wallet',
        'rainbow',
        'wallet_connect' // Shows 100+ wallets from registry
      ],
      walletChainType: 'ethereum-only'
    }
  }}
>
  {children}
</PrivyProvider>
```

<Warning>
  **`wallet_connect` shows 100+ wallets!** This entry displays ALL wallets from the WalletConnect
  registry as individual, searchable options. If you want a simple QR code instead, use
  `wallet_connect_qr`.
</Warning>

**What users see:**

* MetaMask, Coinbase Wallet, and Rainbow at the top
* Followed by a long, searchable list of 100+ WalletConnect-supported wallets
* Each wallet has its own connection button

**Best for:**

* Apps needing maximum wallet compatibility
* Desktop applications where users browse wallet options
* Supporting niche or regional wallets

**Not recommended for:**

* Mobile-first applications (UI becomes cluttered)
* Simple onboarding flows
* Apps with specific wallet preferences

***

## Recipe 6: Desktop-Optimized with Auto-Detection

**Use case**: Desktop app that auto-detects all installed browser extensions

```tsx  theme={"system"}
<PrivyProvider
  appId="your-app-id"
  config={{
    appearance: {
      walletList: ['detected_ethereum_wallets', 'detected_solana_wallets', 'wallet_connect'],
      walletChainType: 'ethereum-and-solana'
    },
    externalWallets: {
      solana: {
        connectors: toSolanaWalletConnectors()
      }
    }
  }}
>
  {children}
</PrivyProvider>
```

**What users see:**

1. All detected browser extensions (both Ethereum and Solana)
2. Full WalletConnect registry for any wallet not installed
3. Completely dynamic wallet list based on what's installed

**Best for:**

* Desktop-focused applications
* Power users with multiple wallets installed
* Maximum flexibility without manual configuration

**Note**: Wallets aren't injected in mobile web browser environments, with the exception of the in-app browser for a few wallets (see [In-App Browsers](#in-app-browsers) section). Thus, `detected_*_wallets` will show empty in mobile environments. Consider adding specific wallet names (like `'metamask'`, `'phantom'`) for mobile support.

***

## Recipe 7: Prioritize Specific Wallet + Show Others

**Use case**: Promote a specific wallet but still support others

```tsx  theme={"system"}
import {toSolanaWalletConnectors} from '@privy-io/react-auth/solana';

const solanaConnectors = toSolanaWalletConnectors({
  shouldAutoConnect: true
});

<PrivyProvider
  appId="your-app-id"
  config={{
    appearance: {
      walletList: [
        'phantom', // Always shown first (even if detected)
        'backpack', // Shown second (even if detected)
        'detected_ethereum_wallets',
        'detected_solana_wallets'
      ],
      walletChainType: 'ethereum-and-solana'
    },
    externalWallets: {
      solana: {
        connectors: solanaConnectors
      }
    }
  }}
>
  {children}
</PrivyProvider>;
```

**How ordering works:**

* Phantom **always** appears first
* Backpack **always** appears second
* Other detected wallets appear after, alphabetically
* If Phantom is detected, it appears at position 1 (not duplicated in detected list)

**Best for:**

* Apps with wallet partnerships
* Promoting recommended wallets
* Maintaining flexibility while guiding users

***

## Recipe 8: WalletConnect Fallback for Unlisted Wallets

**Use case**: Support specific wallets but provide fallback for others

```tsx  theme={"system"}
<PrivyProvider
  appId="your-app-id"
  config={{
    appearance: {
      walletList: [
        'metamask',
        'rainbow',
        'coinbase_wallet',
        'wallet_connect' // Fallback for any other wallet
      ],
      walletChainType: 'ethereum-only'
    }
  }}
>
  {children}
</PrivyProvider>
```

**What users see:**

1. MetaMask, Rainbow, and Coinbase Wallet prominently displayed
2. WalletConnect option showing 100+ additional wallets
3. Support for niche wallets not in the detected list

**Best for:**

* Supporting wallets not yet in WalletConnect's detection system
* International users with regional wallets
* Providing comprehensive coverage without cluttering the main list

<Tip>
  This approach gives you the best of both worlds: prominent display of preferred wallets plus
  comprehensive fallback support through WalletConnect.
</Tip>

***

## Platform Considerations

### Mobile Browser Limitations

Wallets aren't injected in mobile web browser environments, with the exception of the in-app browser for a few wallets (see [In-App Browsers](#in-app-browsers) section below). Thus, adding `detected_ethereum_wallets` or `detected_solana_wallets` will show empty in mobile environments.

On mobile:

* ✅ **Works**: Specific wallet names (like `'metamask'`, `'phantom'`), `wallet_connect` (shows full registry)
* ❌ **Doesn't work**: `wallet_connect_qr`, `wallet_connect_qr_solana`, `detected_ethereum_wallets`, `detected_solana_wallets`

**Recommended mobile configuration:**

```tsx  theme={"system"}
walletList: [
  'metamask', // Shows "Open in MetaMask" button
  'phantom',
  'rainbow'
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

* The wallet is **automatically detected and prioritized**
* No additional configuration needed
* Appears first regardless of `walletList` order

### Runtime Configuration

You can dynamically change the wallet list based on platform:

```tsx  theme={"system"}
const {connectWallet} = usePrivy();
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

const openWalletModal = () => {
  connectWallet({
    walletList: isMobile
      ? ['metamask', 'phantom', 'rainbow', 'coinbase_wallet'] // Specific wallets for mobile
      : ['metamask', 'rainbow', 'coinbase_wallet', 'detected_ethereum_wallets', 'wallet_connect_qr'] // QR code for desktop
  });
};
```

***

## Common Patterns Summary

| Pattern                   | Configuration                                           | Use Case                        |
| ------------------------- | ------------------------------------------------------- | ------------------------------- |
| **Simple Ethereum**       | `['metamask', 'coinbase_wallet', 'wallet_connect_qr']`  | Standard Ethereum app (desktop) |
| **Simple Solana**         | `['phantom', 'solflare', 'wallet_connect_qr_solana']`   | Standard Solana app (desktop)   |
| **Maximum Compatibility** | `['detected_ethereum_wallets', 'wallet_connect']`       | Support all wallets             |
| **Mobile-First**          | `['metamask', 'phantom', 'rainbow', 'coinbase_wallet']` | Mobile-optimized                |
| **Minimal**               | `['phantom', 'metamask']`                               | Specific wallets only           |
| **Multi-Chain**           | Both Ethereum and Solana entries + both chain types     | Cross-chain apps                |

***

## Need More Help?

* **Can't find your wallet?** See [Troubleshooting wallet visibility](/wallets/connectors/setup/configuring-external-connector-wallets#why-isnt-my-wallet-showing-up)
* **WalletConnect confusion?** See [WalletConnect FAQ](/wallets/connectors/setup/configuring-external-connector-wallets#walletconnect-configuration-faq)
* **Custom configurations?** See [Configure wallet options](/wallets/connectors/setup/configuring-external-connector-wallets)
\n