> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Whitelabel

Privy enables complete control over user management flows, so you can match every user action to your app's brand and experience. Build your own UI for linking and unlinking accounts, managing user profiles, and more, while Privy handles the backend logic securely.

<View title="React" icon="react">
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
</View>

<View title="React Native" icon="react">
  Privy's React Native SDK is whitelabel by default allowing your app to build your own user
  management UI and flows using the SDK's functions. Get started with linking a social account
  [here](/user-management/users/linking-accounts#react-native).
</View>

<View title="Android" icon="android">
  Privy's Android SDK is whitelabel by default, enabling apps to implement custom user management
  UI and flows using the SDK's functions. Get started with linking a social account
  [here](/user-management/users/linking-accounts#android).
</View>

<View title="Swift" icon="swift">
  Privy's Swift SDK is whitelabel by default, enabling apps to implement custom user management UI
  and flows using the SDK's functions. Get started with linking a social account
  [here](/user-management/users/linking-accounts#swift).
</View>
\n