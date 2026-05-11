> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Unlinking accounts from users

Developers can use Privy to unlink users' linked accounts (such as a wallet or Discord profile) at *any point* in their user journey. This might be useful whenever the user has either created a new external account (such as a new Twitter profile or email address) and want to remove the old linked account from their user.

<View title="React" icon="react">
  The React SDK supports unlinking all supported account types via our modal-guided unlink methods.
  **To prompt a user to unlink an account, use the respective method from the **`usePrivy`** hook:**

  | Method            | Description               |
  | ----------------- | ------------------------- |
  | `unlinkEmail`     | unlinks email address     |
  | `unlinkPhone`     | unlinks phone number      |
  | `unlinkWallet`    | unlinks external wallet   |
  | `unlinkGoogle`    | unlinks Google account    |
  | `unlinkApple`     | unlinks Apple account     |
  | `unlinkTwitter`   | unlinks Twitter account   |
  | `unlinkDiscord`   | unlinks Discord account   |
  | `unlinkGithub`    | unlinks Github account    |
  | `unlinklinkedIn`  | unlinks LinkedIn account  |
  | `unlinkTikTok`    | unlinks TikTok account    |
  | `unlinkSpotify`   | unlinks Spotify account   |
  | `unlinkInstagram` | unlinks Instagram account |
  | `unlinkTelegram`  | unlinks Telegram account  |
  | `unlinkFarcaster` | unlinks Farcaster account |
  | `unlinkPasskey`   | unlinks passkey           |

  <Info>
    Users are only permitted to unlink **an account** so long as they have at least one more linked account.
  </Info>

  Below is an example button for prompting a user to unlink certain linked accounts:

  ```tsx  theme={"system"}
  import {usePrivy} from '@privy-io/react-auth';

  function LinkOptions() {
  const {unlinkEmail, unlinkGoogle, unlinkWallet} = usePrivy();

  return (
  <div className="unlink-options">
  <button onClick={unlinkEmail}>Unlink Email to user</button>
  <button onClick={unlinkGoogle}>Unlink Google account to user</button>
  <button onClick={unlinkWallet}>Unlink Wallet to user</button>
  </div>
  );
  }
  ```
</View>

<View title="React Native" icon="react">
  The React Native SDK supports unlinking all supported account types via our modal-guided unlink methods.
  **To unlink an account, use the respective functions and hooks:**

  | Account type | Description               | Hook to invoke       |
  | ------------ | ------------------------- | -------------------- |
  | `Email`      | Unlinks email address     | `useUnlinkEmail`     |
  | `Wallet`     | Unlinks external wallet   | `useUnlinkWallet`    |
  | `Google`     | Unlinks Google account    | `useUnlinkOAuth`     |
  | `Apple`      | Unlinks Apple account     | `useUnlinkOAuth`     |
  | `Twitter`    | Unlinks Twitter account   | `useUnlinkOAuth`     |
  | `Discord`    | Unlinks Discord account   | `useUnlinkOAuth`     |
  | `Github`     | Unlinks Github account    | `useUnlinkOAuth`     |
  | `LinkedIn`   | Unlinks LinkedIn account  | `useUnlinkOAuth`     |
  | `TikTok`     | Unlinks TikTok account    | `useUnlinkOAuth`     |
  | `Spotify`    | Unlinks Spotify account   | `useUnlinkOAuth`     |
  | `Instagram`  | Unlinks Instagram account | `useUnlinkOAuth`     |
  | `Farcaster`  | Unlinks Farcaster account | `useUnlinkFarcaster` |

  <Info>
    Users are only permitted to unlink **an account** so long as they have at least one more linked account.
  </Info>

  <Tabs>
    <Tab title="Email">
      ### Usage

      ```tsx  theme={"system"}
      import {useUnlinkEmail} from '@privy-io/expo';
      const {unlinkEmail} = useUnlinkEmail();
      await unlinkEmail({ email: 'user@example.com' });
      ```

      ### Parameters

      <ParamField path="email" type="string" required>
        The email address to unlink from the current user.
      </ParamField>

      ### Callbacks

      You can optionally register an `onSuccess` or `onError` callback on the `useUnlinkEmail` hook.

      ```tsx  theme={"system"}
      import {useUnlinkEmail} from '@privy-io/expo';
      const {unlinkEmail} = useUnlinkEmail({
        onSuccess: (user) => {
          console.log('Email unlinked', user);
        },
        onError: (err) => console.error(err),
      });
      ```

      <ParamField path="onSuccess" type="(user: User) => void">
        Optional callback to run after a user successfully unlinks an email address.
      </ParamField>

      <ParamField path="onError" type="(err: string) => void">
        Optional callback to run after there is an error during email unlinking.
      </ParamField>
    </Tab>

    <Tab title="Wallet">
      ### Usage

      ```tsx  theme={"system"}
      import {useUnlinkWallet} from '@privy-io/expo';
      const {unlinkWallet} = useUnlinkWallet();
      await unlinkWallet({ address: 'wallet_address' });
      ```

      ### Parameters

      <ParamField path="address" type="string" required>
        The wallet address to unlink from the current user.
      </ParamField>

      ### Callbacks

      You can optionally register an `onSuccess` or `onError` callback on the `useUnlinkWallet` hook.

      ```tsx  theme={"system"}
      import {useUnlinkWallet} from '@privy-io/expo';
      const {unlinkWallet} = useUnlinkWallet({
        onSuccess: (user, isNewUser) => {
          console.log('Wallet unlinked', user, isNewUser);
        },
        onError: (err) => console.error(err),
      });
      ```

      <ParamField path="onSuccess" type="(user: User, isNewUser: boolean) => void">
        Optional callback to run after a user successfully unlinks a wallet.
      </ParamField>

      <ParamField path="onError" type="(err: string) => void">
        Optional callback to run after there is an error during wallet unlinking.
      </ParamField>
    </Tab>

    <Tab title="OAuth">
      ### Usage

      ```tsx  theme={"system"}
      import {useUnlinkOAuth} from '@privy-io/expo';
      const {unlinkOAuth} = useUnlinkOAuth();
      await unlinkOAuth({ provider: 'google', subject: 'subject_identifier' });
      ```

      ### Parameters

      <ParamField path="provider" type="'google' | 'apple' | 'twitter' | 'discord' | 'github' | 'linkedin' | 'tiktok' | 'spotify' | 'instagram'" required>
        The OAuth provider for the account to unlink.
      </ParamField>

      <ParamField path="subject" type="string" required>
        The provider-specific subject ("sub" claim) that uniquely identifies the user for the selected OAuth provider.
      </ParamField>
    </Tab>

    <Tab title="Farcaster">
      ### Usage

      ```tsx  theme={"system"}
      import {useUnlinkFarcaster} from '@privy-io/expo';
      const {unlinkFarcaster} = useUnlinkFarcaster();
      await unlinkFarcaster({ fid: 123 });
      ```

      ### Parameters

      <ParamField path="fid" type="number" required>
        The Farcaster ID to unlink from the current user.
      </ParamField>

      ### Callbacks

      You can optionally register an `onSuccess` or `onError` callback on the `useUnlinkFarcaster` hook.

      ```tsx  theme={"system"}
      import {useUnlinkFarcaster} from '@privy-io/expo';
      const {unlinkFarcaster} = useUnlinkFarcaster({
        onSuccess: (user) => console.log('Farcaster unlinked', user),
        onError: (err) => console.error(err),
      });
      ```

      <ParamField path="onSuccess" type="(user: User) => void">
        Optional callback to run after a user successfully unlinks a Farcaster account.
      </ParamField>

      <ParamField path="onError" type="(err: string) => void">
        Optional callback to run after there is an error during Farcaster unlinking.
      </ParamField>
    </Tab>
  </Tabs>
</View>

<View title="Swift" icon="swift">
  <Info>
    Users are only permitted to unlink **an account** so long as they have at least one more linked account.
  </Info>

  <Tabs>
    <Tab title="Email">
      Use the following method from the `email` handler to unlink an email address:

      ```swift  theme={"system"}
      func unlink(email: String) async throws -> PrivyUser
      ```

      ### Returns

      <ResponseField name="PrivyUser" type="PrivyUser">
        The updated user object with the email removed.
      </ResponseField>

      ### Usage

      ```swift  theme={"system"}
      do {
          // unlink email address
          let user = try await privy.email.unlink(email: email)

          // successfully unlinked email
      } catch {
          // error unlinking email
      }
      ```
    </Tab>

    <Tab title="Phone">
      Use the following method from the `sms` handler to unlink a phone number:

      ```swift  theme={"system"}
      func unlink(phoneNumber: String) async throws -> PrivyUser
      ```

      ### Returns

      <ResponseField name="PrivyUser" type="PrivyUser">
        The updated user object with the phone number removed.
      </ResponseField>

      ### Usage

      ```swift  theme={"system"}
      do {
          // unlink phone number
          let user = try await privy.sms.unlink(phoneNumber: phoneNumber)

          // successfully unlinked phone number
      } catch {
          // error unlinking phone number
      }
      ```
    </Tab>

    <Tab title="Ethereum Wallet">
      Use the following method from the `siwe` handler to unlink an Ethereum wallet:

      ```swift  theme={"system"}
      func unlink(address: String) async throws -> PrivyUser
      ```

      ### Returns

      <ResponseField name="PrivyUser" type="PrivyUser">
        The updated user object with the wallet removed.
      </ResponseField>

      ### Usage

      ```swift  theme={"system"}
      do {
          // unlink Ethereum wallet with address
          let user = try await privy.siwe.unlink(address: address)

          // successfully unlinked Ethereum wallet
      } catch {
          // error unlinking Ethereum wallet
      }
      ```
    </Tab>

    <Tab title="Solana Wallet">
      Use the following method from the `siws` handler to unlink a Solana wallet:

      ```swift  theme={"system"}
      func unlink(address: String) async throws -> PrivyUser
      ```

      ### Returns

      <ResponseField name="PrivyUser" type="PrivyUser">
        The updated user object with the wallet removed.
      </ResponseField>

      ### Usage

      ```swift  theme={"system"}
      do {
          // unlink Solana wallet with address
          let user = try await privy.siws.unlink(address: address)

          // successfully unlinked Solana wallet
      } catch {
          // error unlinking Solana wallet
      }
      ```
    </Tab>

    <Tab title="Passkey">
      Use the following method from the `passkey` handler to unlink a user's passkey:

      ```swift  theme={"system"}
      func unlink(credentialId: String) async throws -> PrivyUser
      ```

      ### Returns

      <ResponseField name="PrivyUser" type="PrivyUser">
        The updated user object with the passkey removed.
      </ResponseField>

      ### Usage

      ```swift  theme={"system"}
      do {
          // unlink passkey with credential id
          let user = try await privy.passkey.unlink(credentialId: credentialId)

          // successfully unlinked passkey
      } catch {
          // error unlinking passkey
      }
      ```
    </Tab>

    <Tab title="OAuth">
      Use the following method from the `oAuth` handler to unlink an OAuth account:

      ```swift  theme={"system"}
      func unlink(with provider: OAuthProvider, subject: String) async throws -> PrivyUser
      ```

      ### Parameters

      <ParamField path="provider" type="OAuthProvider" required>
        The OAuth provider for the account to unlink (e.g., `.google`, `.discord`, `.twitter`).
      </ParamField>

      <ParamField path="subject" type="String" required>
        The provider-specific subject identifier that uniquely identifies the user for the selected OAuth provider.
      </ParamField>

      ### Returns

      <ResponseField name="PrivyUser" type="PrivyUser">
        The updated user object with the OAuth account removed.
      </ResponseField>

      ### Usage

      ```swift  theme={"system"}
      do {
          // unlink OAuth account
          let user = try await privy.oAuth.unlink(with: provider, subject: subject)

          // successfully unlinked OAuth account
      } catch {
          // error unlinking OAuth account
      }
      ```
    </Tab>
  </Tabs>
</View>

<View title="Android" icon="android">
  <Info>
    Users are only permitted to unlink **an account** so long as they have at least one more linked account.
  </Info>

  <Tabs>
    <Tab title="Email">
      Use the following method from the `email` handler to unlink an email address:

      ```kotlin  theme={"system"}
      public suspend fun unlink(email: String): Result<PrivyUser>
      ```

      ### Returns

      <ResponseField name="Result<PrivyUser>" type="Result<PrivyUser>">
        A result type encapsulating the PrivyUser on success.
      </ResponseField>

      ### Usage

      ```kotlin  theme={"system"}
      val unlinkResult: Result<PrivyUser> = privy.email.unlink(email = "user@example.com")

      unlinkResult.fold(
          onSuccess = { updatedUser ->
              // Email successfully unlinked
              // updatedUser contains the updated user object with the email removed
          },
          onFailure = {
              println("Error unlinking email: ${it.message}")
          }
      )
      ```
    </Tab>

    <Tab title="Phone">
      Use the following method from the `sms` handler to unlink a phone number:

      ```kotlin  theme={"system"}
      public suspend fun unlink(phoneNumber: String): Result<PrivyUser>
      ```

      ### Returns

      <ResponseField name="Result<PrivyUser>" type="Result<PrivyUser>">
        A result type encapsulating the PrivyUser on success.
      </ResponseField>

      ### Usage

      ```kotlin  theme={"system"}
      val unlinkResult: Result<PrivyUser> = privy.sms.unlink(phoneNumber = "+1234567890")

      unlinkResult.fold(
          onSuccess = { updatedUser ->
              // Phone number successfully unlinked
              // updatedUser contains the updated user object with the phone number removed
          },
          onFailure = {
              println("Error unlinking SMS: ${it.message}")
          }
      )
      ```
    </Tab>

    <Tab title="Ethereum Wallet">
      Use the following method from the `siwe` handler to unlink an Ethereum wallet:

      ```kotlin  theme={"system"}
      public suspend fun unlink(address: String): Result<PrivyUser>
      ```

      ### Returns

      <ResponseField name="Result<PrivyUser>" type="Result<PrivyUser>">
        A result type encapsulating the PrivyUser on success.
      </ResponseField>

      ### Usage

      ```kotlin  theme={"system"}
      val unlinkResult: Result<PrivyUser> = privy.siwe.unlink(address = "wallet_address")

      unlinkResult.fold(
          onSuccess = { updatedUser ->
              // Wallet successfully unlinked
              // updatedUser contains the updated user object with the wallet removed
          },
          onFailure = {
              println("Error unlinking wallet: ${it.message}")
          }
      )
      ```
    </Tab>

    <Tab title="Solana Wallet">
      Use the following method from the `siws` handler to unlink a Solana wallet:

      ```kotlin  theme={"system"}
      public suspend fun unlink(address: String): Result<PrivyUser>
      ```

      ### Returns

      <ResponseField name="Result<PrivyUser>" type="Result<PrivyUser>">
        A result type encapsulating the PrivyUser on success.
      </ResponseField>

      ### Usage

      ```kotlin  theme={"system"}
      val unlinkResult: Result<PrivyUser> = privy.siws.unlink(address = "wallet_address")

      unlinkResult.fold(
          onSuccess = { updatedUser ->
              // Wallet successfully unlinked
              // updatedUser contains the updated user object with the wallet removed
          },
          onFailure = {
              println("Error unlinking wallet: ${it.message}")
          }
      )
      ```
    </Tab>

    <Tab title="Passkey">
      Use the following method from the `passkey` handler to unlink a passkey:

      ```kotlin  theme={"system"}
      public suspend fun unlink(credentialId: String): Result<PrivyUser>
      ```

      ### Returns

      <ResponseField name="Result<PrivyUser>" type="Result<PrivyUser>">
        A result type encapsulating the PrivyUser on success.
      </ResponseField>

      ### Usage

      ```kotlin  theme={"system"}
      val unlinkResult: Result<PrivyUser> = privy.passkey.unlink(credentialId = "credential_id")

      unlinkResult.fold(
          onSuccess = { updatedUser ->
              // Passkey successfully unlinked
              // updatedUser contains the updated user object with the passkey removed
          },
          onFailure = {
              println("Error unlinking passkey: ${it.message}")
          }
      )
      ```
    </Tab>
  </Tabs>
</View>

<View title="Flutter" icon="flutter">
  <Info>
    Users are only permitted to unlink **an account** so long as they have at least one more linked account.
  </Info>

  <Tabs>
    <Tab title="Email">
      Use the following method from the `email` handler to unlink an email address:

      ```dart  theme={"system"}
      Future<Result<PrivyUser>> unlink(String email)
      ```

      ### Parameters

      <ParamField path="email" type="String" required>
        The email address to unlink from the user.
      </ParamField>

      ### Returns

      <ResponseField name="Result<PrivyUser>" type="Result<PrivyUser>">
        A Result object encapsulating the updated PrivyUser on success, providing immediate access to the user object with the email removed.
      </ResponseField>

      ### Usage

      ```dart  theme={"system"}
      final unlinkResult = await privy.email.unlink("user@example.com");

      unlinkResult.fold(
        onSuccess: (updatedUser) {
          // Email successfully unlinked
          // updatedUser contains the updated user object with the email removed
        },
        onFailure: (error) {
          print("Error unlinking email: ${error.message}");
        },
      );
      ```
    </Tab>

    <Tab title="Phone">
      Use the following method from the `sms` handler to unlink a phone number:

      ```dart  theme={"system"}
      Future<Result<PrivyUser>> unlink(String phoneNumber)
      ```

      ### Parameters

      <ParamField path="phoneNumber" type="String" required>
        The phone number to unlink from the user.
      </ParamField>

      ### Returns

      <ResponseField name="Result<PrivyUser>" type="Result<PrivyUser>">
        A Result object encapsulating the updated PrivyUser on success, providing immediate access to the user object with the phone number removed.
      </ResponseField>

      ### Usage

      ```dart  theme={"system"}
      final unlinkResult = await privy.sms.unlink("+1234567890");

      unlinkResult.fold(
        onSuccess: (updatedUser) {
          // Phone number successfully unlinked
          // updatedUser contains the updated user object with the phone number removed
        },
        onFailure: (error) {
          print("Error unlinking phone: ${error.message}");
        },
      );
      ```
    </Tab>

    <Tab title="Ethereum Wallet">
      Use the following method from the `siwe` handler to unlink an Ethereum wallet:

      ```dart  theme={"system"}
      Future<Result<PrivyUser>> unlink(String address)
      ```

      ### Parameters

      <ParamField path="address" type="String" required>
        The Ethereum wallet address to unlink from the user.
      </ParamField>

      ### Returns

      <ResponseField name="Result<PrivyUser>" type="Result<PrivyUser>">
        A Result object encapsulating the updated PrivyUser on success, providing immediate access to the user object with the wallet removed.
      </ResponseField>

      ### Usage

      ```dart  theme={"system"}
      final unlinkResult = await privy.siwe.unlink("0x1234...5678");

      unlinkResult.fold(
        onSuccess: (updatedUser) {
          // Wallet successfully unlinked
          // updatedUser contains the updated user object with the wallet removed
        },
        onFailure: (error) {
          print("Error unlinking wallet: ${error.message}");
        },
      );
      ```
    </Tab>

    <Tab title="Solana Wallet">
      Use the following method from the `siws` handler to unlink a Solana wallet:

      ```dart  theme={"system"}
      Future<Result<PrivyUser>> unlink(String address)
      ```

      ### Parameters

      <ParamField path="address" type="String" required>
        The Solana wallet address to unlink from the user.
      </ParamField>

      ### Returns

      <ResponseField name="Result<PrivyUser>" type="Result<PrivyUser>">
        A Result object encapsulating the updated PrivyUser on success, providing immediate access to the user object with the wallet removed.
      </ResponseField>

      ### Usage

      ```dart  theme={"system"}
      final unlinkResult = await privy.siws.unlink("wallet_address");

      unlinkResult.fold(
        onSuccess: (updatedUser) {
          // Wallet successfully unlinked
          // updatedUser contains the updated user object with the wallet removed
        },
        onFailure: (error) {
          print("Error unlinking wallet: ${error.message}");
        },
      );
      ```
    </Tab>

    <Tab title="Passkey">
      Use the following method from the `passkey` handler to unlink a passkey:

      ```dart  theme={"system"}
      Future<Result<PrivyUser>> unlink(String credentialId)
      ```

      ### Parameters

      <ParamField path="credentialId" type="String" required>
        The credential ID of the passkey to unlink.
      </ParamField>

      ### Returns

      <ResponseField name="Result<PrivyUser>" type="Result<PrivyUser>">
        A Result object encapsulating the updated PrivyUser on success, providing immediate access to the user object with the passkey removed.
      </ResponseField>

      ### Usage

      ```dart  theme={"system"}
      final unlinkResult = await privy.passkey.unlink("credential_id");

      unlinkResult.fold(
        onSuccess: (updatedUser) {
          // Passkey successfully unlinked
          // updatedUser contains the updated user object with the passkey removed
        },
        onFailure: (error) {
          print("Error unlinking passkey: ${error.message}");
        },
      );
      ```
    </Tab>
  </Tabs>
</View>

<View title="REST API" icon="terminal">
  Make a `POST` request to:

  ```bash  theme={"system"}
  https://auth.privy.io/api/v1/apps/<privy-app-id>/users/unlink
  ```

  Replace `<privy-app-id>` with your Privy app ID and pass in the following parameters:

  | Parameter  | Type     | Description                                                                                 |
  | ---------- | -------- | ------------------------------------------------------------------------------------------- |
  | `user_id`  | `string` | Privy DID of the user                                                                       |
  | `type`     | `string` | Linked account type (see supported types below)                                             |
  | `handle`   | `string` | The identifier for the account (e.g., email address, wallet address)                        |
  | `provider` | `string` | (Only required for cross app unlinking) The cross app provider id, prefixed with `'privy:'` |

  ### Supported Account Types

  The following account types can be unlinked via the API:

  * `email` - Email accounts
  * `phone` - Phone number accounts
  * `wallet` - Externally connected wallets (Ethereum or Solana)
  * `smart_wallet` - Smart contract wallets
  * `farcaster` - Farcaster accounts
  * `telegram` - Telegram accounts
  * `cross_app` - Cross app accounts
  * OAuth providers:
    * `google_oauth`
    * `discord_oauth`
    * `twitter_oauth`
    * `github_oauth`
    * `linkedin_oauth`
    * `apple_oauth`
    * `spotify_oauth`
    * `instagram_oauth`
    * `tiktok_oauth`

  <Note>The API does not support unlinking `passkey`, `custom_auth`, or `guest` account types.</Note>

  ### Example Requests

  <CodeGroup>
    ```bash Email account theme={"system"}
    curl --request POST "https://auth.privy.io/api/v1/apps/<privy-app-id>/users/unlink" \
    -u "<your-privy-app-id>:<your-privy-app-secret>" \
    -H "privy-app-id: <your-privy-app-id>" \
    -H 'Content-Type: application/json' \
    -d '{
      "user_id": "<user-did>",
      "type": "email",
      "handle": "test@privy.io"
    }'
    ```

    ```bash Wallet account theme={"system"}
    curl --request POST "https://auth.privy.io/api/v1/apps/<privy-app-id>/users/unlink" \
    -u "<your-privy-app-id>:<your-privy-app-secret>" \
    -H "privy-app-id: <your-privy-app-id>" \
    -H 'Content-Type: application/json' \
    -d '{
      "user_id": "<user-did>",
      "type": "wallet",
      "handle": "0x1234...5678"
    }'
    ```

    ```bash OAuth account theme={"system"}
    curl --request POST "https://auth.privy.io/api/v1/apps/<privy-app-id>/users/unlink" \
    -u "<your-privy-app-id>:<your-privy-app-secret>" \
    -H "privy-app-id: <your-privy-app-id>" \
    -H 'Content-Type: application/json' \
    -d '{
      "user_id": "<user-did>",
      "type": "google_oauth",
      "handle": "<subject-identifier>"
    }'
    ```

    ```bash Cross app account theme={"system"}
    curl --request POST "https://auth.privy.io/api/v1/apps/<privy-app-id>/users/unlink" \
    -u "<your-privy-app-id>:<your-privy-app-secret>" \
    -H "privy-app-id: <your-privy-app-id>" \
    -H 'Content-Type: application/json' \
    -d '{
      "user_id": "<user-did>",
      "type": "cross_app",
      "handle": "<subject-identifier>",
      "provider": "privy:<cross-app-provider-id>"
    }'
    ```
  </CodeGroup>

  ### Response

  If the unlinking is successful, the API will return a 200 status code.

  If there's no account associated with the Privy DID that matches the type and handle, the API will return a 400 status code.
</View>

<View title="Dashboard" icon="terminal">
  To unlink via the dashboard:

  1. Navigate to the [Users page](https://dashboard.privy.io/?page=users\&tab=all-users)
  2. Select the user
  3. Click the button beside the account you want to unlink
  4. Click `Unlink account`

  <Note>
    The unlink option won't appear if unlinking is not available for the account.
  </Note>

    <img src="https://mintcdn.com/privy-c2af3412/Ih_Fo3QYM486gzWq/images/users-unlink.png?fit=max&auto=format&n=Ih_Fo3QYM486gzWq&q=85&s=3504f9666c84c559bb47b134172aa8d3" alt="Unlinking an account in the Privy Dashboard" data-og-width="1280" width="1280" data-og-height="894" height="894" data-path="images/users-unlink.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/privy-c2af3412/Ih_Fo3QYM486gzWq/images/users-unlink.png?w=280&fit=max&auto=format&n=Ih_Fo3QYM486gzWq&q=85&s=ff626060473ffbca8dc280c4b35cec41 280w, https://mintcdn.com/privy-c2af3412/Ih_Fo3QYM486gzWq/images/users-unlink.png?w=560&fit=max&auto=format&n=Ih_Fo3QYM486gzWq&q=85&s=00ceedf421684973daafe8ca0c1ef51c 560w, https://mintcdn.com/privy-c2af3412/Ih_Fo3QYM486gzWq/images/users-unlink.png?w=840&fit=max&auto=format&n=Ih_Fo3QYM486gzWq&q=85&s=5ee11e8ad54d838107a227b22175d197 840w, https://mintcdn.com/privy-c2af3412/Ih_Fo3QYM486gzWq/images/users-unlink.png?w=1100&fit=max&auto=format&n=Ih_Fo3QYM486gzWq&q=85&s=76b234eaf96052773e244519d380d3a3 1100w, https://mintcdn.com/privy-c2af3412/Ih_Fo3QYM486gzWq/images/users-unlink.png?w=1650&fit=max&auto=format&n=Ih_Fo3QYM486gzWq&q=85&s=488e942fa3f994820e6cedce3ea5ce8d 1650w, https://mintcdn.com/privy-c2af3412/Ih_Fo3QYM486gzWq/images/users-unlink.png?w=2500&fit=max&auto=format&n=Ih_Fo3QYM486gzWq&q=85&s=9d248dfc2b1a1d6b43fd39b0986490d3 2500w" />
</View>
\n