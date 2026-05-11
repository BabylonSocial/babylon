> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Login with Farcaster

[**Farcaster**](https://www.farcaster.xyz/) is a sufficiently decentralized social network whose core social graph is stored on-chain. Users can choose how content they create is stored and it enables unique, composable experiences by enabling users to link their accounts with a wallet of their choosing.

**Privy enables your users to easily log in to your app using their Farcaster account.** This means you can easily integrate Privy with Farcaster to compose experiences with a user's existing social graph or network.

Here's how!

<Tip>
  Log in with Farcaster enables log in and read access to a user's Farcaster account but does not
  provide write access to the account today.
</Tip>

<details>
  <summary><b>How does Farcaster login work?</b></summary>

  Farcaster identifies users via a **signer**: this is an EdDSA keypair that is used by the client application to sign content like posts ("casts"), follows, etc on behalf of users.

  These Farcaster signers are managed through various clients such as [Farcaster](https://farcaster.xyz/), [Supercast](https://www.supercast.xyz/) and others.

  Privy uses a standard called **Sign in with Farcaster** ([FIP-11](https://github.com/farcasterxyz/protocol/discussions/110)) to issue a signature request to a user's Farcaster account via the client a user has.

  ***
</details>

### 1. Enable Farcaster login in your dashboard

Go to your app in your [developer dashboard](https://dashboard.privy.io) and navigate to **User management > Authentication > Socials**. From here, enable **Farcaster** as a social option.

This will enable you to configure Farcaster as a login and account linking option in your app.

### 2. Configure your app's Farcaster integration

The following assumes you have set up Privy with your app. If you haven't, start by following the instructions in the [**Privy Quickstart**](/basics/get-started/dashboard/create-new-app) to get your app set up with Privy.

From there, if you'd like users to be able to [**`login`**](/authentication/user-authentication/login-methods/farcaster) to your app with their Farcaster account, you can configure `'farcaster'` as an upfront login method in your **`PrivyProvider`**, like so:

```tsx  theme={"system"}
<PrivyProvider
  appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID}
  config={{
    // This configures email, farcaster and wallet login for your app.
    appearance: {
        loginMethods: ['farcaster', ...insertTheRestOfYourLoginMethods]
    },
    ...insertTheRestOfYourPrivyProviderConfig
  }}
>
```

You can also prompt existing users to link their Farcaster account to their existing account.

```tsx  theme={"system"}
import {usePrivy} from '@privy-io/react-auth';

function Page() {
  const {linkFarcaster} = usePrivy();
  // You may replace this hook with any of the other `link-` hooks to
  // link a different account type.
  return <button onClick={linkFarcaster}>Link your Farcaster</button>;
}
```

### 3. Use your Farcaster link to power custom logic

Once a user has logged in with or linked their Farcaster account, you can find their **`Farcaster`** object, including their `fid`, `username`, `pfp` and more, in the [**`user`**](/user-management/users/the-user-object) object returned by the `usePrivy` hook.

**That's it! Once you've linked a Farcaster account to a user object, you can use this to power composable experiences in your app.** You should also consider using toolkits like [Farcaster's APIs](https://docs.farcaster.xyz/) or [Neynar](https://neynar.com/) to query and interact with protocol data.

### 4. (Optional) Refresh Farcaster info

Sometimes, a user may update their Farcaster profile information (`username`, `pfp`) - while this is publicly available using a public hub endpoint, Privy caches a version whenever the user logs in for convenience. To refresh the Privy cache, you can use our [REST API](/basics/rest-api/setup) (`server-auth` coming soon) and hitting the `/api/v1/users/farcaster/refresh` endpoint.

```tsx  theme={"system"}
const response = await fetch('https://auth.privy.io/api/v1/users/farcaster/refresh', {
  method: 'POST',
  body: JSON.stringify({
    fid: 1
  }),
  headers: {
    Authorization: `Basic ${btoa(`${'your-privy-app-id'}:${'your-privy-app-secret'}`)}`,
    'privy-app-id': 'your-privy-app-id',
    'content-type': 'application/json'
  }
});
```

If you're simply looking for the current Privy user object, we recommend using [`getUserByFarcasterId`](/user-management/users/managing-users/querying-users#by-farcaster-fid).

To be considerate of public hubs, we only allow refreshing of user data once every 24 hours. If you need more frequent than daily freshness, we recommend that you query public hub data using the user's `fid`.
\n