> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Build World Mini Apps with Privy

World Mini Apps are native-like applications that run inside World App, giving you access to millions of verified human users.

With the new **World Chat** (powered by XMTP), your mini apps can integrate with messaging—opening directly in conversations, accessing group context, and sharing content back to chat.

This guide shows how to integrate Privy with World Mini Apps for authentication and wallet management. If you're building mini apps across multiple platforms, Privy's account linking enables users to access your app on World, Farcaster, and Base App with the same account and embedded wallet.

<CardGroup cols={3}>
  <Card title="World Mini Apps Docs" icon="arrow-up-right-from-square" href="https://docs.world.org/mini-apps" arrow>
    Official documentation for building World Mini Apps.
  </Card>

  <Card title="World Developer Portal" icon="arrow-up-right-from-square" href="https://developer.worldcoin.org/" arrow>
    Register your mini app and manage API keys.
  </Card>

  <Card title="XMTP Documentation" icon="arrow-up-right-from-square" href="https://docs.xmtp.org/" arrow>
    Learn about XMTP, the protocol powering World Chat.
  </Card>
</CardGroup>

<Tip>
  **Building for multiple platforms?** If you're building on World, Farcaster, and Base App, Privy's
  account linking lets users connect their accounts across platforms and access the same embedded
  wallet everywhere.
</Tip>

## Setup

First, configure a World developer account, scaffold a mini app project, and integrate Privy.

<Steps>
  <Step title="Configure your World developer account">
    Create a World developer account and mini app at the [World Developer Portal](https://developer.worldcoin.org/).

    Get your App ID and API key for your mini app.
  </Step>

  <Step title="Create your World Mini App">
    Scaffold a new World Mini App using the official template:

    ```bash  theme={"system"}
    npx @worldcoin/create-mini-app@latest my-mini-app
    ```

    Follow the prompts to configure your app with your World App ID and API key.
  </Step>

  <Step title="Set up Privy">
    If you haven't set up Privy yet, follow our [React quickstart guide](/basics/react/installation).
  </Step>
</Steps>

## Authenticate users with World wallet

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

## Link accounts (optional)

If you're building mini apps for other platforms like Farcaster and Base App, account linking helps users access the same embedded wallet from any platform. Users can link their login methods and maintain access to their embedded wallet and data across all platforms.

<AccordionGroup>
  <Accordion title="Link World wallet to existing accounts">
    If a user already has a Privy account (from Farcaster, email, etc.) and wants to access it from your World mini app, they can link their World wallet:

    ```tsx  theme={"system"}
    import {useLinkWithSiwe} from '@privy-io/react-auth';
    import MiniKit from '@worldcoin/minikit-js';

    const {generateSiweNonce, linkWithSiwe} = useLinkWithSiwe();

    const handleLinkWorldWallet = async () => {
      // Get nonce from Privy
      const privyNonce = await generateSiweNonce();

      // Request signature from World wallet
      const {finalPayload} = await MiniKit.commandsAsync.walletAuth({
        nonce: privyNonce,
      });

      // Link wallet
      await linkWithSiwe({
        message: finalPayload.message,
        signature: finalPayload.signature,
      });
    };
    ```
  </Accordion>

  <Accordion title="Link other accounts">
    Users can link additional login methods to their account:

    ```tsx  theme={"system"}
    import {useLinkAccount} from '@privy-io/react-auth';

    const {linkFarcaster, linkEmail, linkGoogle} = useLinkAccount();

    // Link additional login methods
    linkFarcaster();
    linkEmail();
    linkGoogle();
    ```
  </Accordion>
</AccordionGroup>

## World Chat features

The new **World Chat** (powered by XMTP) adds messaging capabilities to mini apps.

You can detect when your mini app is opened from a chat and share content back to conversations. The World MiniKit SDK provides features like:

* `sdk.location` - Detect where your app was opened (chat, home, app store, etc.)
* `sdk.context.getGroupMembers` - Get group member info when opened from chat
* `sdk.commands.chat` - Share content back to chat with link previews

**Example:** Detect chat context and share results:

```tsx  theme={"system"}
import MiniKit from '@worldcoin/minikit-js';

// Check where app was opened
if (MiniKit.location === 'chat') {
  const members = await MiniKit.context.getGroupMembers();
  console.log(`Opened in chat with ${members.length} members`);
}

// Share to chat
await MiniKit.commands.chat({
  message: 'Check out my score!',
  to: ['username1'] // Optional
});
```

<Tip>
  For full World Chat SDK docs, see [World's documentation](https://docs.world.org/mini-apps). The
  SDK is currently in preview.
</Tip>

## Example use cases

With World Chat's social features, you can build:

* **Group betting** - See members' bets, share results to chat
* **Collaborative tools** - Shared lists, planning, games with group context
* **Commerce** - Split bills, group purchases in chat
* **Gaming** - Multiplayer games that share achievements to chat
\n