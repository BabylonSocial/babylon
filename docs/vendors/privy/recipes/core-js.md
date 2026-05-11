> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Using the vanilla JavaScript SDK

The `@privy-io/js-sdk-core` library is a vanilla JavaScript library, intended for use in a browser-like environment, it allows you to add secure authentication, non-custodial embedded wallets, and powerful user management into your application.

<Note>
  `@privy-io/js-sdk-core` library is a low-level JavaScript library. Please do not attempt to use
  this library without first reaching out to the Privy team to discuss your project and which Privy
  SDK options may be better suited to it.
</Note>

## Prerequisites

Before you begin, make sure you have [set up your Privy app and obtained your app ID](/basics/get-started/dashboard/create-new-app) from the Privy Dashboard.

## Installation

<CodeGroup>
  ```bash npm theme={"system"}
  npm install @privy-io/js-sdk-core@latest
  ```

  ```bash pnpm theme={"system"}
  pnpm install @privy-io/js-sdk-core@latest
  ```

  ```bash yarn theme={"system"}
  yarn add @privy-io/js-sdk-core@latest
  ```
</CodeGroup>

## Getting a `Privy` instance

Import the **`Privy`** class and create an instance of it, passing the Privy **app ID** and **app client ID** and storage adapter. You may also configure any EVM chains you would like to support.

```tsx  theme={"system"}
import Privy, {LocalStorage} from '@privy-io/js-sdk-core';

new Privy({
  appId,
  clientId,
  supportedChains,
  storage: new LocalStorage()
});
```

<Note>
  You should ensure that there is only ever one instance of the Privy client instantiated for your
  app.
</Note>

## Connecting to the secure context

Configure the Privy SDK with the Privy iframe to be able to provision non-custodial embedded wallets for your users.

First, create and mount an iframe in your app, use the Privy client to get the src URL.

```tsx  theme={"system"}
const iframeUrl = privy.embeddedWallet.getURL();
const iframe = document.createElement('iframe');
iframe.src = iframeUrl;
document.body.appendChild(iframe);
```

Then, pass through a reference to the iframe to the Privy client and attach listeners for message events.

```tsx  theme={"system"}
privy.setMessagePoster(iframe.contentWindow);
const listener = (e) => privy.embeddedWallet.onMessage(e.data);
window.addEventListener('message', listener);
```

If you are using a UI rendering library or framework we recommend rendering the iframe and registering listener using that library instead of using the DOM directly.

## Authentication

The Privy core SDK supports a variety of authentication options including email, SMS, OAuth and JWT-based auth.

<CodeGroup>
  ```tsx Email theme={"system"}
  const emailAddress = 'insert-user-email-address';
  await privy.auth.email.sendCode(emailAddress);
  const emailOTP = 'insert-otp-collected-from-user';
  const session = await privy.auth.email.loginWithCode(emailAddress, emailOTP);
  ```

  ```tsx SMS theme={"system"}
  // Example phone number formatting: '+1 555-555-5555'.
  const phoneNumber = 'insert-user-phone-number';
  await privy.auth.phone.sendCode(phoneNumber);
  const phoneOTP = 'insert-otp-collected-from-user';
  const session = await privy.auth.phone.loginWithCode(phoneAddress, phoneOTP);
  ```

  ```tsx OAuth theme={"system"}
  // Replace this with your desired OAuth provider
  const provider = 'google';
  // Replace this with the URI you'd like to redirect users to after login
  const redirectURI = `${window.location.origin}/login-callback`;
  const oauthURL = await privy.auth.oauth.generateURL(provider, redirectURI);
  // Redirect the user to the OAuth site
  window.location.assign(oauthURL);

  // When the user returns to your app from the OAUth site
  const queryParams = new URLSearchParams(window.location.search);
  const oauthCode = queryParams.get('privy_oauth_code');
  const oauthState = queryParams.get('privy_oauth_state');
  const session = await privy.auth.oauth.loginWithCode(oauthCode, oauthState);
  ```

  ```tsx JWT based auth theme={"system"}
  const authToken = 'insert-access-or-identity-token-for-user';
  const session = await privy.auth.customProvider.syncWithToken(authToken);
  ```
</CodeGroup>

## Creating a an embedded wallet

Your app can [**manually** create wallets](/wallets/wallets/create/create-a-wallet) for users when desired.

<Info>Privy can provision wallets for your users on both **Ethereum** and **Solana**.</Info>

<CodeGroup>
  ```tsx Ethereum theme={"system"}
  import {getUserEmbeddedEthereumWallet, getEntropyDetailsFromUser} from '@privy-io/js-sdk-core';

  const {user} = await privy.embeddedWallet.create({});
  const wallet = getUserEmbeddedEthereumWallet(user);
  const {entropyId, entropyIdVerifier} = getEntropyDetailsFromUser(user);
  const provider = await privy.embeddedWallet.getEthereumProvider({
    wallet,
    entropyId,
    entropyIdVerifier
  });
  ```

  ```tsx Solana theme={"system"}
  import {getUserEmbeddedSolanaWallet, getEntropyDetailsFromUser} from '@privy-io/js-sdk-core';

  const {user} = await privy.embeddedWallet.createSolana();
  const account = getUserEmbeddedSolanaWallet(user);
  const {entropyId, entropyIdVerifier} = getEntropyDetailsFromUser(user);
  const provider = await privy.embeddedWallet.getSolanaProvider(
    account,
    entropyId,
    entropyIdVerifier
  );
  ```
</CodeGroup>

## Using the embedded wallet

<Info>
  In order to send a transaction, your wallet must have some funds to pay for gas. You can use a
  testnet [faucet](https://console.optimism.io/faucet) to test transacting on a testnet (e.g. Base
  Sepolia) or send funds to the wallet on the network of your choice.
</Info>

With the users' embedded wallet, your application can now prompt the user to sign and send transactions.

<CodeGroup>
  ```tsx Ethereum theme={"system"}
  const provider = await privy.embeddedWallet.getEthereumProvider({...args});
  await provider.request({
    method: 'personal_sign',
    params: ['hello', signingAddress]
  });
  ```

  ```tsx Solana theme={"system"}
  const provider = await privy.embeddedWallet.getSolanaProvider(...args);
  await provider.request({
    method: 'signMessage',
    params: {message: 'hello'}
  });
  ```
</CodeGroup>

<Tip>
  [Learn more](/wallets/using-wallets/ethereum/send-a-transaction) about sending transactions with
  the embedded wallet. Privy enables you to take many actions on the embedded wallet, including
  [sign a message](/wallets/using-wallets/ethereum/sign-a-message), [sign typed
  data](/wallets/using-wallets/ethereum/sign-typed-data), and [sign a
  transaction](/wallets/using-wallets/ethereum/sign-a-transaction).
</Tip>
\n