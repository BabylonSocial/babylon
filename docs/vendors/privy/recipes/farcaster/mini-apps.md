> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Building a Farcaster Mini App

[**Farcaster**](https://www.farcaster.xyz/) is a sufficiently decentralized social network whose core social graph is stored on-chain. Users can choose how content they create is stored and it enables unique, composable experiences by enabling users to link their accounts with a wallet of their choosing.

**Privy enables seamless login with your user's Farcaster account within a Mini App.** This means you can easily integrate Privy with Farcaster Mini Apps to compose experiences with a user's existing social graph or network.

Here's how!

<Tip>
  Privy supports [Farcaster auth
  addresses](https://github.com/farcasterxyz/protocol/discussions/225), including authentication
  from The Base App. To authenticate a user, pass a Sign-In With Farcaster (SIWF) message signed by
  an auth address to `loginToMiniApp`.
</Tip>

<CardGroup cols={3}>
  <Card title="Mini Apps starter" icon="github" href="https://github.com/privy-io/examples/tree/main/examples/privy-next-farcaster-mini-app" arrow>
    A starter repository for building a Farcaster Mini App with Privy and the Mini Apps SDK.
  </Card>
</CardGroup>

<Expandable title="How does seamless Farcaster login work in a Mini App?">
  Privy uses a standard called **Sign in with Farcaster** ([FIP-11](https://github.com/farcasterxyz/protocol/discussions/110)) to issue a signature request to a user's Farcaster account via the client the user has.

  The [Mini Apps spec](https://miniapps.farcaster.xyz/docs/specification) introduces a new `sdk.actions.signIn` action. This will produce the same [FIP-11](https://github.com/farcasterxyz/protocol/discussions/110) conformant signature automatically on the Farcaster mobile app.

  The `sdk.actions.signIn` action, in combination with the Privy `useLoginToMiniApp` hook, provides a seamless login experience that automatically and securely authenticates a user on Farcaster.
</Expandable>

### 1. Enable Farcaster login in your dashboard

Go to your app in your [developer dashboard](https://dashboard.privy.io/apps?page=login-methods) and navigate to **User management > Authentication > Socials**. From here, enable **Farcaster** as a social option.

This will enable you to configure Farcaster as a login and account linking option in your app.

### 2. Configure your allowed domains and cookies

<Info>
  When building a Farcaster Mini App, you must include `https://farcaster.xyz` as an allowed domain. Allowed domains is **required** for iframe-in-iframe which Farcaster uses, even for staging environments.
</Info>

Go to the `Domains` tab of your `Configuration > App settings` page in the developer dashboard and [configure allowed domains](/recipes/react/allowed-domains) for your app. This is the URL that your app is deployed to.

To use the embedded wallet, your application must also include `https://farcaster.xyz` as an allowed domain. Including Farcaster as an allowed domain allows the Privy iframe, where the embedded wallet is hosted, to load in the Farcaster browser app.

<Tip>
  Use an [appClient](/basics/get-started/dashboard/app-clients) to override the default cookie
  settings.
</Tip>

Currently Mini Apps do not support httpOnly cookies. If you have httpOnly cookies enabled for your app, it is recommended to set up an appClient to override the default cookie settings. Learn more about appClients [here](/basics/get-started/dashboard/app-clients#cookies).

### 3. Configure your app's Farcaster integration

The following assumes you have set up Privy with your app. If you haven't, start by following the instructions in the [**Privy Quickstart**](/basics/react/quickstart) to get your app set up with Privy.

Be sure to configure `'farcaster'` as an upfront login method in your **`PrivyProvider`**, like so:

```tsx  theme={"system"}
<PrivyProvider
  appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID}
  config={{
    loginMethods: ['farcaster', ...insertTheRestOfYourLoginMethods]
    ...insertTheRestOfYourPrivyProviderConfig
  }}
>
```

### 4. Setup seamless Farcaster login with the Mini Apps SDK

<Info>
  Use `loginToMiniApp` from `useLoginToMiniApp` for proper Farcaster Mini App authentication (not
  Farcaster's quick auth).
</Info>

In your app, install the
[@farcaster/miniapp-sdk](https://www.npmjs.com/package/@farcaster/miniapp-sdk):

```bash  theme={"system"}
npm install @farcaster/miniapp-sdk
```

<Tip>
  Privy now supports authentication with Farcaster auth addresses, including from the new Base app!
</Tip>

To authenticate with an auth address, pass a SIWF message signed by an auth address to `loginToMiniApp` from `useLoginToMiniApp`. This can be done by fetching a signature from an external wallet, the Farcaster Wallet, or in an app with mini app support (such as the Base app) by calling `miniappSdk.actions.signIn`.

<Warning>
  Automatic embedded wallet creation is currently not supported for Farcaster Mini Apps. You have
  two options: use the wallet that clients like the Farcaster app and The Base App automatically
  inject (recommended), or [manually create embedded
  wallets](/wallets/wallets/create/create-a-wallet) at your chosen onboarding point.
</Warning>

```tsx  theme={"system"}
import miniappSdk from '@farcaster/miniapp-sdk';
import {usePrivy} from '@privy-io/react-auth';
import {useLoginToMiniApp} from '@privy-io/react-auth/farcaster';
...

const {ready, authenticated} = usePrivy();
const {initLoginToMiniApp, loginToMiniApp} = useLoginToMiniApp();

// Login to Mini App with Privy automatically
useEffect(() => {
  if (ready && !authenticated) {
    const login = async () => {
      // Initialize a new login attempt to get a nonce for the Farcaster wallet to sign
      const { nonce } = await initLoginToMiniApp();
      // Request a signature from Farcaster
      const result = await miniappSdk.actions.signIn({nonce});
      // Send the received signature from Farcaster to Privy for authentication
      // or pass a SIWF message signed by an auth address
      await loginToMiniApp({
        message: result.message,
        signature: result.signature,
      });
    };
    login();
  }
}, [ready, authenticated]);
```

<Warning>
  **The Base App (TBA) Special Requirement:** If your users are accessing your Mini App through The
  Base App, they must add their The Base App Wallet address as an auth address to their Farcaster
  account for authentication to work properly.
</Warning>

<Tip>
  Always check that `ready` and `authenticated` from the `usePrivy` hook are `true` before taking
  actions!
</Tip>

Once a user has logged in with or linked their Farcaster account, you can find their **`Farcaster`** object, including their `fid`, `username`, `pfp` and more, in the [**`user`**](/user-management/users/the-user-object) object returned by the `usePrivy` hook.

**That's it! You can now use this to power composable experiences in your new Mini App.** When building out your Mini App, be sure to visit [Farcaster's resources page](https://docs.farcaster.xyz/developers/frames/v2/resources) for help with testing and common issues!
\n