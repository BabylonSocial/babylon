> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Writing to Farcaster

[**Farcaster**](https://www.farcaster.xyz/) is a sufficiently decentralized social network whose core social graph is stored on-chain. Users can choose how content they create is stored and it enables unique, composable experiences by enabling users to link their accounts with a wallet of their choosing.

## Getting started

**Privy enables your users to easily log in to and write with their Farcaster account.** This means you can easily integrate Privy with Farcaster to compose experiences with a user's existing social graph or network. Generating a signer to power this is sponsored by the Privy team and is free to you and your users.

You can see a demo here: [https://farcaster-demo.vercel.app](https://farcaster-demo.vercel.app).
The example repo is at [https://github.com/privy-io/examples/tree/main/examples/privy-next-farcaster](https://github.com/privy-io/examples/tree/main/examples/privy-next-farcaster).

Here's how to get started!

### 0. Install the latest version of @privy-io/react-auth

In order to use embedded signers, we recommend you install the latest version of our SDK, as the interfaces have changed.

### 1. Login with Farcaster

The following assumes you have set up Privy with your app. If you haven't, start by following the instructions in the [**Privy Quickstart**](/basics/react/quickstart) to get your app set up with Privy.

You must also enable Farcaster as a sign-in method for your app from the dashboard. Please see the [**Farcaster Integration**](/authentication/user-authentication/login-methods/farcaster) recipe to get set up.

### 2. Create an embedded Farcaster signer

<Warning>
  This guide requires your Privy app to be configured with **on-device wallet mode**. Embedded
  Farcaster signers are not compatible with TEE mode.
</Warning>

The first step to write to Farcaster is to create an embedded signer.

<details>
  <summary><b>What is an embedded Farcaster signer?</b></summary>

  Farcaster data is shared across a network of servers called "hubs". Hubs are responsible for verifying and sharing messages on the protocol. In order to submit messages, you need to create a Farcaster signer.

  This is an Ed25519 key-pair that is authorized to sign messages on your user's behalf. Privy generates a new non-custodial signer for your user.

  A user can authorize their embedded Farcaster signer to post on their behalf via Farcaster's signer connect flow. This allows your app to post messages with your user's Farcaster account!

  ***
</details>

In order to do so, a user must go through an authorization flow, which grants their new Farcaster signer permission to submit casts on their behalf. Use the `useFarcasterSigner()` hook to request a new signer from a user's existing Farcaster account.

```tsx  theme={"system"}
import { useFarcasterSigner, usePrivy } from @privy-io/react-auth;

const { user } = usePrivy();
const { requestFarcasterSignerFromWarpcast } = useFarcasterSigner();

const farcasterAccount = user.linkedAccounts.find((account) => account.type === 'farcaster');

<button
  onClick={() => requestFarcasterSignerFromWarpcast()}
  // Prevent requesting a Farcaster signer if a user has not already linked a Farcaster account
  // or if they have already requested a signer
  disabled={!farcasterAccount || farcasterAccount.signerPublicKey}
>
  Authorize my Farcaster signer from Farcaster
</button>
```

<Tip>
  You can see if your user already has an embedded Farcaster signer authorized by checking if
  `user.linkedAccounts.find((account) => account.type === 'farcaster').signerPublicKey` is defined!
</Tip>

### 3. Create an external signer

In order to interface with Farcaster libraries, we need to build a simple signer object. This can easily be constructed using the Privy Farcaster signer interfaces.

This step requires that you install [@standard-crypto/farcaster-js](https://www.npmjs.com/package/@standard-crypto/farcaster-js).

```
npm install @farcaster/frame-sdk
```

First, define an ExternalEd25519Signer:

```tsx  theme={"system"}
import {ExternalEd25519Signer} from '@standard-crypto/farcaster-js';

const {getFarcasterSignerPublicKey, signFarcasterMessage} = useFarcasterSigner();

const privySigner = new ExternalEd25519Signer(signFarcasterMessage, getFarcasterSignerPublicKey);
```

### 4. Build the hub client

Now that we have a signer object built, we can build our [@standard-crypto/farcaster-js](https://www.npmjs.com/package/@standard-crypto/farcaster-js) client for interacting with Farcaster!

```tsx  theme={"system"}
import {HubRestAPIClient} from '@standard-crypto/farcaster-js';

const client = new HubRestAPIClient({
  hubUrl: 'https://hub.farcaster.standardcrypto.vc:2281'
});
```

### 5. Submit a cast

Now that you have a client initialized, you can now begin submitting messages to the protocol!

Luckily, farcaster-js makes submitting a cast as easy as:

```tsx  theme={"system"}
const submitCastResponse = await client.submitCast(
  {text: 'Hello world!'},
  user.farcaster.fid,
  privySigner
);
```

### 6. Interact with other Farcasters!

Alright, your user has created a new cast, but how do they interact with other people?

First off, we need our user to follow people to display casts on their feed! Let's go ahead and follow Vitalik.

```tsx  theme={"system"}
// Vitalik's Farcaster ID (FID) is 5650
const followUserResponse = await client.followUser(5650, user.farcaster.fid, privySigner);
```

Next, let's like and recast some of his casts.

```tsx  theme={"system"}
// Liking one of Vitalik's recent casts
// https://farcaster.xyz/vitalik.eth/0x3e9b3734
const submitLikeResponse = await client.submitReaction(
  {
    type: 'like',
    target: {
      fid: 5650,
      hash: '0x3e9b3734a29ad341f1c73912c42343a21d5df75a'
    }
  },
  user.farcaster.fid,
  privySigner
);

// Recasting another one of Vitalik's recent casts
// https://farcaster.xyz/vitalik.eth/0x6be44f32
const submitRecastResponse = await client.submitReaction(
  {
    type: 'recast',
    target: {
      fid: 5650,
      hash: '0x6be44f32011a59e239d5a00bb6302c3105ad3214'
    }
  },
  user.farcaster.fid,
  privySigner
);
```

Awesome! We've already submitted, liked, and recasted a cast + followed a user.

Now, your user wants to shake up their feed, so they are going to unfollow Vitalik.

```tsx  theme={"system"}
const unfollowUserResponse = await client.unfollowUser(5650, user.farcaster.fid, privySigner);
```

That's it!

Your user has now logged in with Farcaster, authorized a new non-custodial signer, and started writing to the protocol. Wowow!

## Caveats

Some Privy features cannot be used alongside Farcaster embedded signers.

1. A user must always have an embedded wallet to use Farcaster embedded signers. Before calling `requestFarcasterSignerFromWarpcast` be sure to either [manually or automatically](/wallets/wallets/create/create-a-wallet) create an embedded wallet.
2. **MFA** cannot be enabled when using Farcaster embedded signers.
3. **Passwords** on embedded wallets cannot be added when using Farcaster embedded signers.

## Resources

If you're new to Farcaster, here are some great places to get started:

* [https://docs.farcaster.xyz/](https://docs.farcaster.xyz/)
* [https://www.thehubble.xyz/](https://www.thehubble.xyz/)

Interacting with the Farcaster protocol requires reading existing data. The Farcaster team has a set of open source libraries for reading from hubs directly: [https://github.com/farcasterxyz](https://github.com/farcasterxyz).

Alternatively, you can use data APIs built for Farcaster developers that drastically improve developer and user UX using [Neynar](https://neynar.com/).

## FAQ

<br />

**Q**: *Will my users have to pay Warps?*

**A**: We are sponsoring all signers created so that your users will not have to spend any Warps!

**Q**: *How do I revoke my embedded Farcaster signer?*

**A**: If your account was created on Farcaster, you can go to Settings -> Advanced -> Manage connected apps. Then, delete the key you wish to revoke. Note that this will **delete all messages** posted by that signer. Revoking a signer without Farcaster is a somewhat involved process. Using your custody address (wallet from Farcaster), you can call `remove(mySignerPublicKey)` on the [Farcaster Key Registry](https://optimistic.etherscan.io/address/0x00000000fc1237824fb747abde0ff18990e59b7e) contract to permanently deauthorize an embedded Farcaster signer. [Here is an example](https://optimistic.etherscan.io/tx/0x49f4de7596eced1ac34abd2e78329ba8ff02569156cf4f5919250cca0144e783).

<br />

**Q**: *I really like/dislike 'X'. How do I tell someone?*

**A**: We would love ANY feedback on your experience so far! Please reach out to us on [Farcaster](https://farcaster.xyz/privy) or [Slack](https://privy.io/slack).
\n