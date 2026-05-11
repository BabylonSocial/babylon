> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Worldcoin Mini App SIWE with Privy

Privy offers a seamless integration with Worldcoin Mini Apps. This guide will walk you through integrating Sign-In With Ethereum (SIWE) using Privy in a Worldcoin Mini App. With this setup, you can offer secure wallet authentication for your users—combining the power of World App's native wallet with Privy's flexible authentication and wallet infrastructure.

### Resources

<CardGroup cols={3}>
  <Card title="Worldcoin Mini Apps Docs" icon="arrow-up-right-from-square" href="https://docs.world.org/mini-apps" arrow>
    Official documentation for building Worldcoin Mini Apps.
  </Card>

  <Card title="Worldcoin Developer Portal" icon="arrow-up-right-from-square" href="https://developer.worldcoin.org/" arrow>
    Register your mini app and manage API keys.
  </Card>

  <Card title="Privy React Setup" icon="arrow-up-right-from-square" href="/basics/react/setup" arrow>
    Learn how to set up Privy in your React app.
  </Card>
</CardGroup>

## Configure your Worldcoin developer portal

Create a Worldcoin developer account and mini app, learn more [here](https://docs.world.org/mini-apps/quick-start/installing).

<Expandable title="Create a Worldcoin developer account and mini app">
  <Steps>
    <Step title="Create a Worldcoin developer account and mini app">
      1. Go to the [Worldcoin Developer Portal](https://developer.worldcoin.org/).
      2. Sign in and create a new team if you haven't already.
      3. Create a new mini app for your project.
    </Step>

    <Step title="Get your appId and API key">
      1. In your team dashboard, select your mini app.
      2. Copy your **App ID** (you'll need this for your app config).
      3. Go to the [API Keys page](https://developer.worldcoin.org/teams/\{TEAM_ID}/api-keys) and create a new API key for your app.
      4. Save your API key securely.
    </Step>
  </Steps>
</Expandable>

## Get set up with Privy

<Note>
  If you haven't set up Privy yet, follow our [React quickstart guide](/basics/react/installation)
  to get your app ID and configure your app.
</Note>

Privy's React SDK provides a secure way to authenticate users and manage wallets in your frontend application. Learn more about [getting started with React](/basics/react/installation).

## Set up with Worldcoin Mini App

<Steps>
  <Step title="Create your mini app using the quickstart">
    Scaffold a new Worldcoin Mini App using the official template:

    ```
    npx @worldcoin/create-mini-app@latest my-mini-app
    ```

    Follow the prompts in the README to set up your app. Use the env variables from your Worldcoin developer portal to configure your app.
  </Step>

  <Step title="Explore the starter repo structure">
    Your new app will have a file at `src/components/AuthButton/index.tsx`—this is where you'll add
    Privy SIWE support.
  </Step>
</Steps>

## SIWE into mini app with Privy

Use Privy's `useLoginWithSiwe` hook to authenticate users with their World App wallet. The SIWE flow works as follows:

<Steps>
  <Step title="Get a nonce from Privy">
    Generate a unique nonce using `generateSiweNonce()` to ensure the SIWE message is secure.
  </Step>

  <Step title="Request wallet signature">
    Pass the nonce to World MiniKit's `walletAuth()` command, which prompts the user to sign a SIWE
    message in their World App wallet.
  </Step>

  <Step title="Complete authentication">
    Send the signed message and signature back to Privy using `loginWithSiwe()` to complete the
    authentication flow.
  </Step>
</Steps>

### Implementation

Use Privy's `useLoginWithSiwe` hook to authenticate users via their World wallet:

```tsx  theme={"system"}
import {useLoginWithSiwe} from '@privy-io/react-auth';
import MiniKit from '@worldcoin/minikit-js';

const {generateSiweNonce, loginWithSiwe} = useLoginWithSiwe();

const handleLogin = async () => {
  // Get nonce from Privy
  const privyNonce = await generateSiweNonce();

  // Request signature from World wallet
  const {finalPayload} = await MiniKit.commandsAsync.walletAuth({
    nonce: privyNonce
  });

  // Log in with Privy
  await loginWithSiwe({
    message: finalPayload.message,
    signature: finalPayload.signature
  });
};
```

### Access user data

Once logged in, you can access the user's World information and wallet data:

```typescript {skip-check} theme={"system"}
const userInfo = await MiniKit.getUserByAddress(user.wallet.address);
```

<Check>
  Your Worldcoin Mini App now supports SIWE authentication with Privy and World App! Enjoy seamless,
  secure onboarding for your users 🚀
</Check>
\n