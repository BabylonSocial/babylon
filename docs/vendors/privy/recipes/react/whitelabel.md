> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Whitelabel

The Privy React SDK provides complete control over all interfaces for authentication, embedded wallets, and user management. You can customize the user experience to match your brand while maintaining the security and reliability of Privy's infrastructure.

<Tip>
  The fastest way to get started with whitelabeling is to fork our [whitelabel starter repository](https://github.com/privy-io/examples/tree/main/privy-react-whitelabel-starter). This template provides a fully customizable foundation that you can build upon.
</Tip>

## What you can customize

<CardGroup cols={2}>
  <Card title="Authentication flows" icon="user-check" href="/recipes/react/whitelabel#authentication" horizontal>
    Whitelabel login and MFA with your own UI and branding.
  </Card>

  <Card title="Embedded wallets" icon="wallet" href="/recipes/react/whitelabel#wallets" horizontal>
    Create seamless wallet interactions with your own UI components and styling.
  </Card>

  <Card title="User management" icon="users" href="/recipes/react/whitelabel#user-management" horizontal>
    Manage user profiles and connect social accounts your way.
  </Card>
</CardGroup>

## Whitelabeling your app

Privy allows developers to choose when to take advantage of Privy's UI and when to customize the experience with their own UI. This guide walks through how to whitelabel your app.

### Authentication

All of Privy's authentication flows can be whitelabeled, from email and SMS passwordless flows to social logins and passkeys.

<Accordion title="Email" defaultOpen>
  To whitelabel Privy's passwordless email flow, use the `useLoginWithEmail` hook. Then, call `sendCode` and `loginWithCode` with the desired email address.

  ```tsx  theme={"system"}
  import {useLoginWithEmail} from '@privy-io/react-auth';
  ```

  ```tsx  theme={"system"}
  const {sendCode, loginWithCode} = useLoginWithEmail();
  sendCode({email: 'test@test.com'});
  loginWithCode({code: '123456'});
  ```

  Learn more about [email authentication and tracking login flow state](/authentication/user-authentication/login-methods/email).
</Accordion>

<Accordion title="SMS">
  To whitelabel the passwordless SMS flow, use the `useLoginWithSms` hook. Then, call `sendCode` and `loginWithCode` with the desired phone number.

  ```tsx  theme={"system"}
  import {useLoginWithSms} from '@privy-io/react-auth';
  ```

  ```tsx  theme={"system"}
  const {sendCode, loginWithCode} = useLoginWithSms();
  sendCode({phoneNumber: '+1234567890'});
  loginWithCode({code: '123456'});
  ```

  Learn more about [SMS authentication and tracking login flow state](/authentication/user-authentication/login-methods/sms).
</Accordion>

<Accordion title="Social logins">
  To whitelabel social login, use the `useLoginWithOAuth` hook and call `initOAuth` with your desired social login provider.

  ```tsx  theme={"system"}
  import {useLoginWithOAuth} from '@privy-io/react-auth';
  ```

  ```tsx  theme={"system"}
  const {initOAuth} = useLoginWithOAuth();
  initOAuth({provider: 'google'});
  ```

  Learn more about [social logins and tracking login flow state](/authentication/user-authentication/login-methods/oauth).
</Accordion>

<Accordion title="Passkeys">
  To whitelabel passkeys, use the `useLoginWithPasskey` hook and call `loginWithPasskey`.

  ```tsx  theme={"system"}
  import {useLoginWithPasskey} from '@privy-io/react-auth';
  ```

  ```tsx  theme={"system"}
  const {loginWithPasskey} = useLoginWithPasskey();
  loginWithPasskey();
  ```

  To sign up with a passkey:

  ```tsx  theme={"system"}
  import {useSignupWithPasskey} from '@privy-io/react-auth';
  ```

  ```tsx  theme={"system"}
  const {signupWithPasskey} = useSignupWithPasskey();
  signupWithPasskey();
  ```

  To link a passkey to an existing user:

  ```tsx  theme={"system"}
  import {useLinkWithPasskey} from '@privy-io/react-auth';
  ```

  ```tsx  theme={"system"}
  const {linkWithPasskey} = useLinkWithPasskey();
  linkWithPasskey();
  ```

  Learn more about [passkeys and tracking login flow state](/authentication/user-authentication/login-methods/passkey).
</Accordion>

<Accordion title="Telegram">
  To whitelabel the Telegram login flow, it's as simple as using the `useLoginWithTelegram` hook and calling `login`.

  ```tsx  theme={"system"}
  import {useLoginWithTelegram} from '@privy-io/react-auth';
  ```

  ```tsx  theme={"system"}
  const {login, state} = useLoginWithTelegram();
  login();
  ```

  Learn more about [Telegram authentication and tracking login flow state](/authentication/user-authentication/login-methods/telegram).
</Accordion>

<Accordion title="MFA">
  To whitelabel MFA with SMS, TOTP, or passkeys, follow the [custom UI guide](/authentication/user-authentication/mfa/custom-ui).
</Accordion>

### Wallets

Privy enables developers to whitelabel embedded wallet functionality. You can abstract away wallet UIs entirely or selectively use Privy's default UI for specific flows.

To whitelabel embedded wallets, you can configure this globally across your app in the `PrivyProvider` config, or selectively for specific flows at runtime.

<Accordion title="Provider config (globally)">
  In your `PrivyProvider` config you can control the default wallet UI for all flows in your app.

  ```tsx {5} theme={"system"}
  <PrivyProvider
    appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || ''}
    config={{
      embeddedWallets: {
        showWalletUIs: false,
        priceDisplay: {primary: 'native-token', secondary: null}
      }
    }}
  >
    <YourApp />
  </PrivyProvider>
  ```

  For more granular control, you can also control wallet UIs for specific flows in the sections below.
</Accordion>

<Accordion title="Create a wallet" defaultOpen>
  Privy supports whitelabeling wallet creation for Ethereum, Solana, and other chains.

  <Tabs>
    <Tab title="Ethereum">
      ```tsx  theme={"system"}
      import {useCreateWallet} from '@privy-io/react-auth';
      ```

      ```tsx  theme={"system"}
      const {createWallet} = useCreateWallet();
      createWallet();
      ```
    </Tab>

    <Tab title="Solana">
      ```tsx  theme={"system"}
      import {useWallets} from '@privy-io/react-auth/solana';
      ```

      ```tsx  theme={"system"}
      const {createWallet} = useWallets();
      createWallet();
      ```
    </Tab>

    <Tab title="Other chains">
      ```tsx  theme={"system"}
      import {useCreateWallet} from '@privy-io/react-auth/extended-chains';
      ```

      ```tsx  theme={"system"}
      const {createWallet} = useCreateWallet();
      const {user, wallet} = await createWallet({chainType: 'cosmos'}); // or 'stellar', 'sui', etc.
      ```
    </Tab>
  </Tabs>
</Accordion>

<Accordion title="Signing a message">
  To whitelabel Privy's message signing functionality, use the `useSignMessage` hook and call `signMessage` with your desired message.

  <Tabs>
    <Tab title="Ethereum">
      ```tsx  theme={"system"}
      import {useSignMessage} from '@privy-io/react-auth';
      ```

      ```tsx  theme={"system"}
      const {signMessage} = useSignMessage();
      const signature = await signMessage(
        {message: 'Hello, world!'},
        {uiOptions: {showWalletUIs: false}}
      );
      ```
    </Tab>

    <Tab title="Solana">
      ```tsx  theme={"system"}
      import {useSignMessage} from '@privy-io/react-auth/solana';
      ```

      ```tsx  theme={"system"}
      const {signMessage} = useSignMessage();
      signMessage({
        message: 'messageinUint8Array',
        options: {uiOptions: {showWalletUIs: false}}
      });
      ```
    </Tab>

    <Tab title="Other chains">
      ```tsx  theme={"system"}
      import {useSignRawHash} from '@privy-io/react-auth/extended-chains';
      ```

      ```tsx  theme={"system"}
      const {signature} = await signRawHash({
        address: 'insert-wallet-address',
        chainType: 'cosmos', // or 'stellar', 'sui', etc.
        hash: '0x1acab030f479bda7829de07e9db4138cec5d38574df17d65af1617b7268541c0'
      });
      ```
    </Tab>
  </Tabs>
</Accordion>

<Accordion title="Sending a transaction">
  To whitelabel Privy's transaction sending functionality, use the `useSendTransaction` hook and call `sendTransaction` with your desired transaction.

  <Tabs>
    <Tab title="Ethereum">
      ```tsx  theme={"system"}
      import {useSendTransaction} from '@privy-io/react-auth';
      ```

      ```tsx  theme={"system"}
      const {sendTransaction} = useSendTransaction();
      sendTransaction(
        {
          to: '0xE3070d3e4309afA3bC9a6b057685743CF42da77C',
          value: 100000
        },
        {
          uiOptions: {showWalletUIs: false}
        }
      );
      ```
    </Tab>

    <Tab title="Solana">
      ```tsx  theme={"system"}
      import {useSendTransaction} from '@privy-io/react-auth/solana';
      ```

      ```tsx  theme={"system"}
      const {sendTransaction} = useSendTransaction();
      sendTransaction({
        transaction: 'insert-solana-transaction',
        uiOptions: {showWalletUIs: false}
      });
      ```
    </Tab>
  </Tabs>
</Accordion>

### User management

Privy supports whitelabeling user management for linking and unlinking accounts.

<Accordion title="Linking a social account">
  To whitelabel linking social accounts, use the `useLinkAccount` hook and call `link<Provider>`.

  ```tsx  theme={"system"}
  import {useLinkAccount} from '@privy-io/react-auth';
  ```

  ```tsx  theme={"system"}
  const {linkGoogle, linkTwitter} = useLinkAccount();
  linkGoogle();
  linkTwitter();
  ```
</Accordion>

<Accordion title="Linking a wallet">
  To whitelabel linking wallets, use the `useLinkWithSiwe` hook for Ethereum wallets or `useLinkWithSiws` hook for Solana wallets. These hooks allow you to generate messages, request signatures, and link wallets without using Privy's modal UI.

  <Tabs>
    <Tab title="Ethereum (SIWE)">
      To link an Ethereum wallet to a user via [SIWE](https://eips.ethereum.org/EIPS/eip-4361), use the React SDK's `useLinkWithSiwe` hook.

      ### Generate SIWE message

      ```tsx  theme={"system"}
      generateSiweMessage({ address: string, chainId: string }) => Promise<string>
      ```

      <Expandable title="Parameters">
        <ParamField path="address" type="string" required>
          EIP-55 checksum-encoded wallet address performing the signing.
        </ParamField>

        <ParamField path="chainId" type="string" required>
          The chain ID to which the session is bound, in [CAIP-2 format](https://github.com/ChainAgnostic/CAIPs/blob/main/CAIPs/caip-2.md), e.g. `'eip155:1'`.
        </ParamField>
      </Expandable>

      ### Sign the SIWE message

      Request an EIP-191 `personal_sign` signature for the `message` returned by `generateSiweMessage` from the wallet.

      ```tsx  theme={"system"}
      import {useWallets} from '@privy-io/react-auth';

      const {wallets} = useWallets();
      const signature = await wallets[0].sign(message);
      ```

      Alternatively, you can request a signature from any external wallet or smart account:

      ```tsx  theme={"system"}
      const signature = await wallet.signMessage({message});
      ```

      ### Link with SIWE

      ```tsx  theme={"system"}
      linkWithSiwe({
        signature: string,
        message: string,
        chainId: string,
        walletClientType?: string,
        connectorType?: string
      }) => Promise<void>
      ```

      <Expandable title="Parameters">
        <ParamField path="signature" type="string" required>
          The EIP-191 signature corresponding to the message.
        </ParamField>

        <ParamField path="message" type="string" required>
          The EIP-4361 message returned by `generateSiweMessage`.
        </ParamField>

        <ParamField path="chainId" type="string" required>
          The same [CAIP-2 formatted](https://github.com/ChainAgnostic/CAIPs/blob/main/CAIPs/caip-2.md)
          chain ID you passed to `generateSiweMessage`, e.g. `'eip155:1'`.
        </ParamField>

        <ParamField path="walletClientType" type="string">
          Optional. The wallet client of the external wallet (e.g., `'metamask'`, `'coinbase_wallet'`).
          Defaults to `null` if not specified.
        </ParamField>

        <ParamField path="connectorType" type="string">
          Optional. The method used to connect the wallet to the application (e.g., `'injected'`, `'wallet_connect_v2'`). Defaults to `null` if not specified.
        </ParamField>
      </Expandable>

      ### Usage

      ```tsx  theme={"system"}
      import {useLinkWithSiwe, useWallets} from '@privy-io/react-auth';

      export function LinkWalletButton() {
        const {generateSiweMessage, linkWithSiwe} = useLinkWithSiwe();
        const {wallets} = useWallets();

        const handleLink = async () => {
          if (!wallets?.length) return;
          const activeWallet = wallets[0];

          const message = await generateSiweMessage({
            address: activeWallet.address,
            chainId: 'eip155:1'
          });

          const signature = await activeWallet.sign(message);
          await linkWithSiwe({
            message,
            chainId: 'eip155:1',
            signature
          });
        };

        return <button onClick={handleLink}>Link wallet</button>;
      }
      ```

      ### Callbacks

      You can optionally pass callbacks into `useLinkWithSiwe`:

      ```tsx  theme={"system"}
      const {generateSiweMessage, linkWithSiwe} = useLinkWithSiwe({
        onSuccess: ({user, linkMethod, linkedAccount}) => {
          console.log('Wallet linked successfully', linkedAccount);
        },
        onError: (error) => {
          console.error('Failed to link wallet', error);
        }
      });
      ```
    </Tab>

    <Tab title="Solana (SIWS)">
      To link a Solana wallet to a user via [SIWS](https://github.com/phantom/sign-in-with-solana), use the React SDK's `useLinkWithSiws` hook.

      ### Generate SIWS message

      ```tsx  theme={"system"}
      generateSiwsMessage({ address: string }) => Promise<string>
      ```

      <Expandable title="Parameters">
        <ParamField path="address" type="string" required>
          The Solana wallet address performing the signing.
        </ParamField>
      </Expandable>

      ### Sign the SIWS message

      Request a signature for the `message` returned by `generateSiwsMessage` from the Solana wallet. The message needs to be encoded as Uint8Array for signing.

      ```tsx  theme={"system"}
      import {useWallets} from '@privy-io/react-auth/solana';

      const {wallets} = useWallets();
      const encodedMessage = new TextEncoder().encode(message);
      const results = await wallets[0].signMessage({message: encodedMessage});
      ```

      ### Link with SIWS

      ```tsx  theme={"system"}
      linkWithSiws({
        message: string,
        signature: string,
        walletClientType?: string,
        connectorType?: string
      }) => Promise<{ user: User; linkedAccount: LinkedAccountWithMetadata | null }>
      ```

      <Expandable title="Parameters">
        <ParamField path="message" type="string" required>
          The SIWS message returned from `generateSiwsMessage`.
        </ParamField>

        <ParamField path="signature" type="string" required>
          The signature corresponding to the message. Convert the signature bytes from the wallet's
          `signMessage` method to a base64-encoded string using
          `Buffer.from(results.signature).toString('base64')`.
        </ParamField>

        <ParamField path="walletClientType" type="string">
          Optional. A string indicating the wallet client you'd like to associate with the wallet. Defaults
          to `'privy'`.
        </ParamField>

        <ParamField path="connectorType" type="string">
          Optional. A string indicating the connector type you'd like to associate with the wallet. Defaults to `'privy'`.
        </ParamField>
      </Expandable>

      ### Usage

      ```tsx  theme={"system"}
      import {useLinkWithSiws} from '@privy-io/react-auth';
      import {useWallets} from '@privy-io/react-auth/solana';

      export function LinkSolanaWalletButton() {
        const {generateSiwsMessage, linkWithSiws} = useLinkWithSiws();
        const {wallets} = useWallets();

        const handleLink = async () => {
          if (!wallets?.length) return;
          const activeWallet = wallets[0];

          const message = await generateSiwsMessage({
            address: activeWallet.address
          });

          const encodedMessage = new TextEncoder().encode(message);
          const results = await activeWallet.signMessage({message: encodedMessage});

          // Convert signature bytes to string (base64)
          const signatureBase64 = Buffer.from(results.signature).toString('base64');

          await linkWithSiws({
            message,
            signature: signatureBase64
          });
        };

        return <button onClick={handleLink}>Link Solana wallet</button>;
      }
      ```

      ### Callbacks

      You can optionally pass callbacks into `useLinkWithSiws`:

      ```tsx  theme={"system"}
      const {generateSiwsMessage, linkWithSiws} = useLinkWithSiws({
        onSuccess: ({user, linkMethod, linkedAccount}) => {
          console.log('Solana wallet linked successfully', linkedAccount);
        },
        onError: (error) => {
          console.error('Failed to link Solana wallet', error);
        }
      });
      ```
    </Tab>
  </Tabs>
</Accordion>

<Accordion title="Updating an email">
  To whitelabel updating a user's email address, use the `useUpdateEmail` hook:

  ```tsx  theme={"system"}
  import {useUpdateEmail} from '@privy-io/react-auth';

  const {state, sendCode, verifyCode} = useUpdateEmail();
  ```

  ### Send an OTP

  First, use the `sendCode` method to send an OTP verification code to the user's new email address:

  ```tsx  theme={"system"}
  sendCode: ({newEmailAddress: string}) => Promise<void>;
  ```

  <Expandable title="Parameters">
    <ParamField path="newEmailAddress" type="string" required>
      The new email address to send the verification code to.
    </ParamField>
  </Expandable>

  This sends a one-time passcode to the new email address, which the user must enter to verify and confirm the update.

  ### Verify the OTP

  Prompt the user for the OTP they received and verify it using the `verifyCode` method:

  ```tsx  theme={"system"}
  verifyCode: ({code: string}) => Promise<{user: User} | undefined>;
  ```

  <Expandable title="Parameters">
    <ParamField path="code" type="string" required>
      The one-time code received on the new email address.
    </ParamField>
  </Expandable>

  <Expandable title="Returns">
    <ResponseField name="user" type="User">
      The updated user object if the update was successful.
    </ResponseField>
  </Expandable>

  ### State

  The `state` property provides the current state of the OTP flow:

  | Status                  | Description                                   |
  | ----------------------- | --------------------------------------------- |
  | `'initial'`             | The flow has not started                      |
  | `'sending-code'`        | The code is being sent                        |
  | `'awaiting-code-input'` | Waiting for the user to enter the code        |
  | `'submitting-code'`     | The code is being verified                    |
  | `'done'`                | The email was updated successfully            |
  | `'error'`               | An error occurred (includes an `error` field) |

  ### Usage

  ```tsx  theme={"system"}
  import {useState} from 'react';
  import {useUpdateEmail} from '@privy-io/react-auth';

  function UpdateEmailForm() {
    const {state, sendCode, verifyCode} = useUpdateEmail();
    const [newEmailAddress, setNewEmailAddress] = useState('');
    const [code, setCode] = useState('');

    if (state.status === 'initial' || state.status === 'sending-code') {
      return (
        <div>
          <input
            type="email"
            value={newEmailAddress}
            onChange={(e) => setNewEmailAddress(e.target.value)}
            placeholder="New email address"
          />
          <button
            onClick={() => sendCode({newEmailAddress})}
            disabled={state.status === 'sending-code'}
          >
            Send code
          </button>
        </div>
      );
    }

    return (
      <div>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Enter verification code"
        />
        <button onClick={() => verifyCode({code})} disabled={state.status === 'submitting-code'}>
          Verify
        </button>
      </div>
    );
  }
  ```

  ### Callbacks

  You can optionally pass callbacks into `useUpdateEmail`:

  ```tsx  theme={"system"}
  const {state, sendCode, verifyCode} = useUpdateEmail({
    onSuccess: ({user, updateMethod, updatedAccount}) => {
      console.log('Email updated successfully', user);
    },
    onError: (error, details) => {
      console.error('Failed to update email', error, details);
    }
  });
  ```

  <Expandable title="Callback parameters">
    <ParamField path="onSuccess" type="({user: User, updateMethod: string, updatedAccount: LinkedAccountType}) => void">
      Optional callback that executes after a successful email update. Receives the updated user object, the update method (`'email'`), and the updated account.
    </ParamField>

    <ParamField path="onError" type="(error: PrivyErrorCode, details: {linkMethod: string}) => void">
      Optional callback that executes if there is an error during the email update flow.
    </ParamField>
  </Expandable>
</Accordion>

<Accordion title="Unlinking an account">
  To whitelabel unlinking an account, use the `usePrivy` hook and call `unlink<Provider>`.

  ```tsx  theme={"system"}
  import {usePrivy} from '@privy-io/react-auth';
  ```

  ```tsx  theme={"system"}
  const {unlinkEmail, unlinkGoogle, unlinkWallet} = usePrivy();
  unlinkEmail();
  unlinkGoogle();
  unlinkWallet();
  ```
</Accordion>

## Resources

<CardGroup cols={3}>
  <Card title="Whitelabel starter" icon="github" href="https://github.com/privy-io/examples/tree/main/privy-react-whitelabel-starter" arrow>
    Fork our starter repository to begin building your custom Privy integration.
  </Card>

  <Card title="Whitelabel demo" icon="arrow-up-right-from-square" href="https://whitelabel.privy.io" arrow>
    See a live demo of a whitelabeled app.
  </Card>
</CardGroup>
\n