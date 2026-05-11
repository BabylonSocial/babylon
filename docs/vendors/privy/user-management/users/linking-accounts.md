> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Linking accounts to users

Developers can use Privy to prompt users to link additional accounts (such as a wallet or Discord profile) at *any point* in their user journey, not just during login.

This is key to Privy's **progressive onboarding**: improving conversion and UX by requiring users to complete onboarding steps (e.g. connecting an account) only when necessary.

<View title="React" icon="react">
  The React SDK supports linking all supported account types via our modal-guided link methods.
  **To prompt a user to link an account, use the respective method from the **`useLinkAccount`** hook:**

  | Method          | Description             | User Experience  |
  | --------------- | ----------------------- | ---------------- |
  | `linkEmail`     | Links email address     | Opens modal      |
  | `linkPhone`     | Links phone number      | Opens modal      |
  | `linkWallet`    | Links external wallet   | Opens modal      |
  | `linkGoogle`    | Links Google account    | Direct redirect  |
  | `linkApple`     | Links Apple account     | Direct redirect  |
  | `linkTwitter`   | Links Twitter account   | Direct redirect  |
  | `linkDiscord`   | Links Discord account   | Direct redirect  |
  | `linkGithub`    | Links Github account    | Direct redirect  |
  | `linkLinkedIn`  | Links LinkedIn account  | Direct redirect  |
  | `linkTikTok`    | Links TikTok account    | Direct redirect  |
  | `linkSpotify`   | Links Spotify account   | Direct redirect  |
  | `linkInstagram` | Links Instagram account | Direct redirect  |
  | `linkTelegram`  | Links Telegram account  | Direct redirect  |
  | `linkFarcaster` | Links Farcaster account | Displays QR code |
  | `linkPasskey`   | Links passkey           | Opens modal      |

  <Info>
    Users are only permitted to link **a single account** for a given account type, except for wallets and passkeys. Concretely, a user may link at most one email address, but can link as many wallets and passkeys as they'd like.
  </Info>

    <img src="https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/link-email.png?fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=7faa4c7332a637d835b9c04d48f92030" alt="Sample prompt to link a user's email after they have logged in" data-og-width="447" width="447" data-og-height="446" height="446" data-path="images/link-email.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/link-email.png?w=280&fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=eaf9ecd4b6284741e0212279d2c52717 280w, https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/link-email.png?w=560&fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=30a3a1d152a247673e5c50eb2c1d46cb 560w, https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/link-email.png?w=840&fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=b041ba683c853ab47f47de7ff8f4933a 840w, https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/link-email.png?w=1100&fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=a1f091071e19ebc5c81214a2e1b751bb 1100w, https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/link-email.png?w=1650&fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=8df8eef7bf75d549500c376161869fb0 1650w, https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/link-email.png?w=2500&fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=25b40342ae1b369a14b82e683f6c4c45 2500w" />

  Below is an example button for prompting a user to link an email to their account:

  ```tsx  theme={"system"}
  import {useLinkAccount} from '@privy-io/react-auth';

  function LinkOptions() {
      const {linkEmail, linkGoogle, linkWallet} = useLinkAccount();

      return (
          <div className="link-options">
              <button onClick={linkEmail}>Link Email to user</button>
              <button onClick={linkGoogle}>Link Google account to user</button>
              <button onClick={linkWallet}>Link Wallet to user</button>
          </div>
      );
  }
  ```

  ### Callbacks

  You can optionally register an `onSuccess` or `onError` callback on the `useLinkAccount` hook.

  ```tsx  theme={"system"}
  const {linkGoogle} = useLinkAccount({
      onSuccess: ({user, linkMethod, linkedAccount}) => {
          console.log('Linked account to user ', linkedAccount);
      },
      onError: (error) => {
          console.error('Failed to link account with error ', error)
      }
  })
  ```

  <ParamField path="onSuccess" type="({user: User, linkMethod: string, linkedAccount: linkedAccount}) => void">
    Optional callback to run after a user successfully links an account.
  </ParamField>

  <ParamField path="onError" type="(error: string) => void">
    Optional callback to run after there is an error during account linkage.
  </ParamField>

  <Info>
    **Looking for whitelabel `link` methods?** Our [`useLoginWith<AccountType>`](/authentication/user-authentication/login-methods/email) hooks allow will link an account to a user, provided that the user is already logged in whenever the authentication flow is completed. For headless wallet linking with `useLinkWithSiwe` or `useLinkWithSiws`, see the [whitelabel user management documentation](/user-management/users/whitelabel#react).
  </Info>
</View>

<View title="React Native" icon="react">
  **To prompt a user to link an account, use the respective hooks:**

  | Account type | Description             | Hook to invoke                                 |
  | ------------ | ----------------------- | ---------------------------------------------- |
  | `Email`      | Links email address     | `useLinkEmail`                                 |
  | `Phone`      | Links phone number      | `useLinkSms`                                   |
  | `Wallet`     | Links external wallet   | `useLinkWithSiwe`, `useLinkWithSiws`           |
  | `Google`     | Links Google account    | `useLinkWithOAuth`                             |
  | `Apple`      | Links Apple account     | `useLinkWithOAuth`                             |
  | `Twitter`    | Links Twitter account   | `useLinkWithOAuth`                             |
  | `Discord`    | Links Discord account   | `useLinkWithOAuth`                             |
  | `Github`     | Links Github account    | `useLinkWithOAuth`                             |
  | `LinkedIn`   | Links LinkedIn account  | `useLinkWithOAuth`                             |
  | `TikTok`     | Links TikTok account    | `useLinkWithOAuth`                             |
  | `Spotify`    | Links Spotify account   | `useLinkWithOAuth`                             |
  | `Instagram`  | Links Instagram account | `useLinkWithOAuth`                             |
  | `Farcaster`  | Links Farcaster account | `useLinkWithFarcaster`                         |
  | `Passkey`    | Links passkey           | `useLinkPasskey` from `@privy-io/expo/passkey` |

  The steps to implementing the link flows are analogous to the [login hooks `useLoginWith<AccountType`](/authentication/user-authentication/login-methods/email).

  <Info>
    Users are only permitted to link **a single account** for a given account type, except for wallets and passkeys. Concretely, a user may link at most one email address, but can link as many wallets and passkeys as they'd like.
  </Info>
</View>

<View title="Android" icon="android">
  <Tabs>
    <Tab title="Email/Phone">
      The steps to implementing the `linkWithCode` flow are analogous to the [`loginWithCode` flow](/authentication/user-authentication/login-methods/email). The same thing applies for the `PhoneAccount` type, using `privy.sms.linkWithCode` similar to how [`privy.sms.loginWithCode`](/authentication/user-authentication/login-methods/sms) works.

      First, prompt the user for their email address and use the Privy client's `privy.email.sendCode` method to send them a one-time passcode:

      ```kotlin  theme={"system"}
      sendCode(email: String): Result<Unit>
      ```

      ### Link With Code

      Then, prompt the user for the code they received and use the `linkWithCode` method:

      ```kotlin  theme={"system"}
      linkWithCode(code: String, email: String? = null): Result<PrivyUser>
      ```

      <ParamField path="code" type="String" required={true}>
        The one-time passcode sent to the user's email address.
      </ParamField>

      <ParamField path="email" type="String" required={false}>
        (Optional)  The user's email address. Though this parameter is optional, it is highly recommended that you pass the user's email address explicitly. If email is omitted, the email from `sendCode` will be used.
      </ParamField>

      ### Returns

      <ResponseField name="Result<PrivyUser>" type="Result<PrivyUser>">
        A result type encapsulating the PrivyUser on success.
      </ResponseField>

      ## Usage

      ```kotlin  theme={"system"}
      // Send code to user's email
      val sendResult: Result<Unit> = privy.email.sendCode(email = "user@test.com")

      sendResult.fold(
          onSuccess = {
              // OTP was successfully sent, now prompt user for code
          },
          onFailure = {
              println("Error sending OTP: ${it.message}")
          }
      )

      // Link the email using the code
      val linkResult: Result<PrivyUser> = privy.email.linkWithCode(code = "123456", email = "user@test.com")

      linkResult.fold(
          onSuccess = { updatedUser ->
              println("Email successfully linked!")
              // updatedUser contains the updated user object with the email added
          },
          onFailure = {
              println("Error linking email: ${it.message}")
          }
      )
      ```
    </Tab>

    <Tab title="External Wallets">
      The steps to implementing the `link` flow are analogous to the [login flow's](/authentication/user-authentication/login-methods/wallet#android) of both Sign in with Ethereum (SIWE) and Sign in with Solana (SIWS).

      <Tabs>
        <Tab title="Ethereum Wallet">
          To link an Ethereum wallet, use the Privy client's `siwe` handler.

          ## Generate SIWE message

          ```kotlin  theme={"system"}
          public suspend fun generateMessage(params: SiweMessageParams): Result<String>
          ```

          ### Parameters

          <ParamField path="params" type="SiweMessageParams">
            Set of parameters required to generate the message.

            <Expandable defaultOpen="true">
              <ParamField path="appDomain" type="String" required>
                Your app's domain. e.g. "my-domain.com"
              </ParamField>

              <ParamField path="appUri" type="String" required>
                Your app's URI. e.g. "[https://my-domain.com](https://my-domain.com)"
              </ParamField>

              <ParamField path="chainId" type="String" required>
                EVM Chain ID, e.g. "1" for Ethereum Mainnet
              </ParamField>

              <ParamField path="walletAddress" type="String" required>
                The user's [ERC-55](https://eips.ethereum.org/EIPS/eip-55) compliant wallet address.
              </ParamField>
            </Expandable>
          </ParamField>

          ### Returns

          <ResponseField name="String" type="Result<String>">
            A result type encapsulating the SIWE message that can be signed by the wallet on success.
          </ResponseField>

          ### Usage

          ```kotlin  theme={"system"}
          val params = SiweMessageParams(
              appDomain = domain,
              appUri = uri,
              chainId = chainId,
              walletAddress = walletAddress
          )

          privy.siwe.generateSiweMessage(params = params).fold(
              onSuccess = { message ->
                  // request an EIP-191 `personal_sign` signature on the message
              },
              onFailure = { e ->
                  // An error can be thrown if the network call to generate the message fails,
                  // or if invalid metadata was passed in.
              }
          )
          ```

          ## Sign the SIWE message

          Using the message returned by `generateMessage`, request an EIP-191 `personal_sign` signature from the user's connected wallet. You should do this using the library your app uses to connect to external wallets (e.g. the MetaMask SDK or WalletConnect). Once the user successfully signs the message, pass the signature into the `link` function.

          ## Link with SIWE

          ```kotlin  theme={"system"}
          public suspend fun link(
              message: String,
              signature: String,
              params: SiweMessageParams,
              metadata: WalletLoginMetadata?,
          ): Result<PrivyUser>
          ```

          ### Parameters

          <ParamField path="message" type="String" required>
            The message returned from "generateMessage".
          </ParamField>

          <ParamField path="signature" type="String" required>
            The signature of the SIWE message, signed by the user's wallet.
          </ParamField>

          <ParamField path="params" type="SiweMessageParams" required>
            The same SiweMessageParams passed into "generateMessage".
          </ParamField>

          <ParamField path="metadata" type="WalletLoginMetadata">
            (Optional) you can pass additional metadata that will be stored with the linked wallet.

            <Expandable defaultOpen="true">
              <ParamField path="walletClientType" type="WalletClientType">
                An enum specifying the type of wallet used to link. e.g. WalletClientType.Metamask
              </ParamField>

              <ParamField path="connectorType" type="String">
                A string identifying how wallet was connected. e.g. "wallet\_connect"
              </ParamField>
            </Expandable>
          </ParamField>

          ### Returns

          <ResponseField name="Result<PrivyUser>" type="Result<PrivyUser>">
            A result type encapsulating the PrivyUser on success.
          </ResponseField>

          ### Usage

          ```kotlin  theme={"system"}
          val params = SiweMessageParams(
              appDomain = domain,
              appUri = uri,
              chainId = chainId,
              walletAddress = walletAddress
          )

          // optional metadata
          val metadata = WalletLoginMetadata(walletClientType = walletClient, connectorType = connectorType)

          privy.siwe.link(message, signature, params, metadata).fold(
              onSuccess = { updatedUser ->
                  // Link success
                  // updatedUser contains the updated user object with the wallet added
              },
              onFailure = { e ->
                  // Link failure, either due to invalid signature or network error
              }
          )
          ```
        </Tab>

        <Tab title="Solana Wallet">
          To link a Solana wallet, use the Privy client's `siws` handler.

          ## Generate SIWS message

          ```kotlin  theme={"system"}
          public suspend fun generateMessage(params: SiwsMessageParams): Result<String>
          ```

          ### Parameters

          <ParamField path="params" type="SiwsMessageParams">
            Set of parameters required to generate the message.

            <Expandable defaultOpen="true">
              <ParamField path="appDomain" type="String" required>
                Your app's domain. e.g. "my-domain.com"
              </ParamField>

              <ParamField path="appUri" type="String" required>
                Your app's URI. e.g. "[https://my-domain.com](https://my-domain.com)"
              </ParamField>

              <ParamField path="walletAddress" type="String" required>
                The user's Solana wallet address.
              </ParamField>
            </Expandable>
          </ParamField>

          ### Returns

          <ResponseField name="String" type="Result<String>">
            A result type encapsulating the SIWS message that can be signed by the wallet on success.
          </ResponseField>

          ### Usage

          ```kotlin  theme={"system"}
          val params = SiwsMessageParams(
              appDomain = domain,
              appUri = uri,
              walletAddress = walletAddress
          )

          privy.siws.generateMessage(params = params).fold(
              onSuccess = { message ->
                  // request a Solana wallet signature on the message
              },
              onFailure = { e ->
                  // An error can be thrown if the network call to generate the message fails,
                  // or if invalid metadata was passed in.
              }
          )
          ```

          ## Sign the SIWS message

          Using the message returned by `generateMessage`, request a signature from the user's connected Solana wallet. You should do this using the library your app uses to connect to external wallets (e.g. the Solana Mobile SDK or Phantom). Once the user successfully signs the message, pass the signature into the `link` function.

          ## Link with SIWS

          ```kotlin  theme={"system"}
          public suspend fun link(
              message: String,
              signature: String,
              params: SiwsMessageParams,
              metadata: WalletLoginMetadata?,
          ): Result<PrivyUser>
          ```

          ### Parameters

          <ParamField path="message" type="String" required>
            The message returned from "generateMessage".
          </ParamField>

          <ParamField path="signature" type="String" required>
            The signature of the SIWS message, signed by the user's wallet.
          </ParamField>

          <ParamField path="params" type="SiwsMessageParams" required>
            The same SiwsMessageParams passed into "generateMessage".
          </ParamField>

          <ParamField path="metadata" type="WalletLoginMetadata">
            (Optional) you can pass additional metadata that will be stored with the linked wallet.

            <Expandable defaultOpen="true">
              <ParamField path="walletClientType" type="String">
                The client of the connected wallet (e.g. "phantom").
              </ParamField>

              <ParamField path="connectorType" type="String">
                A string identifying how wallet was connected (e.g. "wallet\_connect" or "mobile\_wallet\_protocol").
              </ParamField>
            </Expandable>
          </ParamField>

          ### Returns

          <ResponseField name="Result<PrivyUser>" type="Result<PrivyUser>">
            A result type encapsulating the PrivyUser on success.
          </ResponseField>

          ### Usage

          ```kotlin  theme={"system"}
          val params = SiwsMessageParams(
              appDomain = domain,
              appUri = uri,
              walletAddress = walletAddress
          )

          // optional metadata
          val metadata = WalletLoginMetadata(
              walletClientType = walletClient,
              connectorType = connectorType
          )

          privy.siws.link(message, signature, params, metadata).fold(
              onSuccess = { updatedUser ->
                  // Link success
                  // updatedUser contains the updated user object with the wallet added
              },
              onFailure = { e ->
                  // Link failure, either due to invalid signature or network error
              }
          )
          ```
        </Tab>
      </Tabs>
    </Tab>

    <Tab title="Passkeys">
      Use the following method from the `passkey` handler to link a new passkey to a user. Be sure to follow Android passkey setup instructions [here](/authentication/user-authentication/login-methods/passkey#android).

      ```kotlin  theme={"system"}
      suspend fun link(
          relyingParty: String,
          displayName: String? = null
      ): Result<PrivyUser>
      ```

      ### Parameters

      <ParamField path="relyingParty" type="String" required>
        The URL origin where your Digital Asset Links are available (e.g., `https://example.com`).
      </ParamField>

      <ParamField path="displayName" type="String">
        An optional display name to associate with the passkey. This name will be shown to the user when selecting which passkey to use for authentication.
      </ParamField>

      ### Returns

      <ResponseField name="Result<PrivyUser>" type="Result<PrivyUser>">
        A result type encapsulating the PrivyUser on success.
      </ResponseField>

      ## Usage

      ```kotlin  theme={"system"}
      val relyingParty = "https://yourdomain.com"
      val displayName = "Optional Display Name" // Optional parameter

      privy.passkey.link(
          relyingParty = relyingParty,
          displayName = displayName
      ).fold(
          onSuccess = { updatedUser ->
              // Successfully linked a passkey to an existing user
              // updatedUser contains the updated user object with the passkey added
              println("Passkey linked successfully!")
          },
          onFailure = { error ->
              // Handle error
              println("Link failed: ${error.message}")
          }
      )
      ```
    </Tab>

    <Tab title="OAuth">
      Use the following method from the OAuth handler to link a new OAuth account to an existing user:

      ```kotlin  theme={"system"}
      suspend fun link(oAuthProvider: OAuthProvider, appUrlScheme: String): Result<PrivyUser>
      ```

      ### Returns

      <ResponseField name="Result<PrivyUser>" type="Result<PrivyUser>">
        A Result containing the updated user object with the newly linked OAuth account on success, or an exception on failure.
      </ResponseField>

      ## Usage

      ```kotlin  theme={"system"}
      val scheme = "your-app-scheme://"

      privy.oAuth
          .link(OAuthProvider.Google, scheme)
          .fold(
              onSuccess = { user ->
                  // Successfully linked an OAuth account to an existing user
              },
              onFailure = { error ->
                  println("Linking failed: ${error.message}")
              }
          )
      ```
    </Tab>
  </Tabs>
</View>

<View title="Swift" icon="swift">
  <Tabs>
    <Tab title="Email/Phone">
      The steps to implementing the `linkWithCode` flow are analogous to the [`loginWithCode` flow](/authentication/user-authentication/login-methods/email).
      The same thing applies for the `PhoneNumberAccount` type, using `privy.sms.linkWithCode` similar to how [`privy.sms.loginWithCode`](/authentication/user-authentication/login-methods/sms) works.

      First, prompt the user for their email address and use the Privy client's `privy.email.sendCode` method to send them a one-time passcode:

      ```swift  theme={"system"}
      sendCode(to email: String) async throws
      ```

      ### Link With Code

      Then, prompt the user for the code they received and use the `linkWithCode` method:

      ```swift  theme={"system"}
      linkWithCode(_ code: String, sentTo email: String) async throws -> PrivyUser
      ```

      <ParamField path="code" type="String" required={true}>
        The one-time passcode sent to the user's email address.
      </ParamField>

      <ParamField path="sentTo" type="String" required={true}>
        The user's email address.
      </ParamField>

      ### Returns

      <ResponseField name="PrivyUser" type="PrivyUser">
        The updated user object with the newly linked account.
      </ResponseField>

      ### Throws

      An error if linking the account is unsuccessful.

      ## Usage

      ```swift  theme={"system"}
      // Send code to user's email
      do {
          try await privy.email.sendCode(to: email)
          // successfully sent code to users email
      } catch {
          print("error sending code to \(email): \(error)")
      }

      // Link the email using the code
      do {
          let user = try await privy.email.linkWithCode(code, sentTo: email)
          print("Email successfully linked!")
          // user has linked their email and user object is updated
      } catch {
          print("error linking email: \(error)")
      }
      ```
    </Tab>

    <Tab title="External Wallets">
      The steps to implementing the `link` flow are analogous to the [login flow's](/authentication/user-authentication/login-methods/wallet#swift) of both Sign in with Ethereum (SIWE) and Sign in with Solana (SIWS).

      <Tabs>
        <Tab title="Ethereum Wallet">
          To link an Ethereum wallet, use the Privy client's `siwe` handler.

          ## Generate SIWE message

          ```swift  theme={"system"}
          func generateMessage(params: SiweMessageParams) async throws -> String
          ```

          ### Parameters

          <ParamField path="params" type="SiweMessageParams" required>
            Set of parameters required to generate the message.

            <Expandable defaultOpen="true">
              <ParamField path="appDomain" type="String" required>
                Your app's domain.
              </ParamField>

              <ParamField path="appUri" type="String" required>
                Your app's URI.
              </ParamField>

              <ParamField path="chainId" type="String" required>
                EVM Chain ID, e.g. "1" for Ethereum Mainnet.
              </ParamField>

              <ParamField path="walletAddress" type="String" required>
                The user's [ERC-55](https://eips.ethereum.org/EIPS/eip-55) compliant wallet address.
              </ParamField>
            </Expandable>
          </ParamField>

          ### Returns

          <ResponseField name="String" type="String">
            The SIWE message that can be signed by the wallet.
          </ResponseField>

          ### Usage

          ```swift  theme={"system"}
          let params = SiweMessageParams(
              appDomain: appDomain,
              appUri: appUri,
              chainId: chainId,
              walletAddress: walletAddress
          )

          do {
              let message = try await privy.siwe.generateMessage(params: params)
              // request an EIP-191 `personal_sign` signature on the message
          } catch {
              // An error can be thrown if the network call to generate the message fails,
              // or if invalid metadata was passed in.
          }
          ```

          ## Sign the SIWE message

          Using the message returned by `generateMessage`, request an EIP-191 `personal_sign` signature from the user's connected wallet. You should do this using the library your app uses to connect to external wallets (e.g. the MetaMask SDK or WalletConnect). Once the user successfully signs the message, pass the signature into the `link` function.

          ## Link with SIWE

          ```swift  theme={"system"}
          func link(
              message: String,
              signature: String,
              params: SiweMessageParams,
              metadata: WalletLoginMetadata?
          ) async throws -> PrivyUser
          ```

          ### Parameters

          <ParamField path="message" type="String" required>
            The message returned from `generateMessage`.
          </ParamField>

          <ParamField path="signature" type="String" required>
            The signature of the SIWE message, signed by the user's wallet.
          </ParamField>

          <ParamField path="params" type="SiweMessageParams" required>
            The same SiweMessageParams passed into `generateMessage`.
          </ParamField>

          <ParamField path="metadata" type="WalletLoginMetadata?">
            (Optional) Additional metadata that will be stored with the linked wallet.

            <Expandable defaultOpen="true">
              <ParamField path="walletClientType" type="WalletClientType">
                An enum specifying the type of wallet used to link. e.g. `.metamask`
              </ParamField>

              <ParamField path="connectorType" type="String">
                A string identifying how wallet was connected. e.g. "wallet\_connect"
              </ParamField>
            </Expandable>
          </ParamField>

          ### Returns

          <ResponseField name="PrivyUser" type="PrivyUser">
            The updated user object with the wallet added.
          </ResponseField>

          ### Usage

          ```swift  theme={"system"}
          let params = SiweMessageParams(
              appDomain: appDomain,
              appUri: appUri,
              chainId: chainId,
              walletAddress: walletAddress
          )

          // optional metadata
          let metadata = WalletLoginMetadata(
              walletClientType: walletClientType,
              connectorType: connectorType
          )

          do {
              let updatedUser = try await privy.siwe.link(
                  message: message,
                  signature: signature,
                  params: params,
                  metadata: metadata
              )
              // Link success
              // updatedUser contains the updated user object with the wallet added
          } catch {
              // Link failure, either due to invalid signature or network error
          }
          ```
        </Tab>

        <Tab title="Solana Wallet">
          To link a Solana wallet, use the Privy client's `siws` handler.

          ## Generate SIWS message

          ```swift  theme={"system"}
          func generateMessage(params: SiwsMessageParams) async throws -> String
          ```

          ### Parameters

          <ParamField path="params" type="SiwsMessageParams" required>
            Set of parameters required to generate the message.

            <Expandable defaultOpen="true">
              <ParamField path="appDomain" type="String" required>
                Your app's domain.
              </ParamField>

              <ParamField path="appUri" type="String" required>
                Your app's URI.
              </ParamField>

              <ParamField path="walletAddress" type="String" required>
                The user's Solana wallet address.
              </ParamField>
            </Expandable>
          </ParamField>

          ### Returns

          <ResponseField name="String" type="String">
            The SIWS message that can be signed by the wallet.
          </ResponseField>

          ### Usage

          ```swift  theme={"system"}
          let params = SiwsMessageParams(
              appDomain: appDomain,
              appUri: appUri,
              walletAddress: walletAddress
          )

          do {
              let message = try await privy.siws.generateMessage(params: params)
              // request a signature on the message from the Solana wallet
          } catch {
              // An error can be thrown if the network call to generate the message fails,
              // or if invalid metadata was passed in.
          }
          ```

          ## Sign the SIWS message

          Using the message returned by `generateMessage`, request a signature from the user's connected Solana wallet. You should do this using the library your app uses to connect to Solana wallets (e.g. the Phantom SDK or Solana Mobile Wallet Adapter). Once the user successfully signs the message, pass the signature into the `link` function.

          ## Link with SIWS

          ```swift  theme={"system"}
          func link(
              message: String,
              signature: String,
              metadata: WalletLoginMetadata?
          ) async throws -> PrivyUser
          ```

          ### Parameters

          <ParamField path="message" type="String" required>
            The message returned from `generateMessage`.
          </ParamField>

          <ParamField path="signature" type="String" required>
            The signature of the SIWS message, signed by the user's Solana wallet.
          </ParamField>

          <ParamField path="metadata" type="WalletLoginMetadata?">
            (Optional) Additional metadata that will be stored with the linked wallet.

            <Expandable defaultOpen="true">
              <ParamField path="walletClientType" type="WalletClientType">
                An enum specifying the type of wallet used to link.
              </ParamField>

              <ParamField path="connectorType" type="String">
                A string identifying how wallet was connected.
              </ParamField>
            </Expandable>
          </ParamField>

          ### Returns

          <ResponseField name="PrivyUser" type="PrivyUser">
            The updated user object with the wallet added.
          </ResponseField>

          ### Usage

          ```swift  theme={"system"}
          let params = SiwsMessageParams(
              appDomain: appDomain,
              appUri: appUri,
              walletAddress: walletAddress
          )

          // optional metadata
          let metadata = WalletLoginMetadata(
              walletClientType: walletClientType,
              connectorType: connectorType
          )

          do {
              let updatedUser = try await privy.siws.link(
                  message: message,
                  signature: signature,
                  metadata: metadata
              )
              // Link success
              // updatedUser contains the updated user object with the wallet added
          } catch {
              // Link failure, either due to invalid signature or network error
          }
          ```
        </Tab>
      </Tabs>
    </Tab>

    <Tab title="Passkeys">
      Use the following method from the `passkey` handler to link a new passkey to a user. Be sure to follow iOS passkey setup instructions [here](/authentication/user-authentication/login-methods/passkey#swift).

      ```swift  theme={"system"}
      func link(relyingParty: String, displayName: String?) async throws -> PrivyUser
      ```

      ### Returns

      <ResponseField name="PrivyUser" type="PrivyUser">
        The updated user object with the newly linked passkey.
      </ResponseField>

      ## Usage

      ```swift  theme={"system"}
      do {
          let displayName = "Optional Display Name"

          let user = try await privy.passkey.link(
              relyingParty: relyingParty,
              displayName: displayName
          )

          // Successfully linked a passkey to an existing user
      } catch {
          print("Signup failed: \(error.localizedDescription)")
      }
      ```
    </Tab>

    <Tab title="OAuth">
      Use the following method from the OAuth handler to link a new OAuth account to an existing user.

      ```swift  theme={"system"}
      func link(with provider: OAuthProvider, appUrlScheme: String?) async throws -> PrivyUser
      ```

      ### Returns

      <ResponseField name="PrivyUser" type="PrivyUser">
        The updated user object with the newly linked OAuth account.
      </ResponseField>

      ## Usage

      ```swift  theme={"system"}
      do {
          let user = try await privy.oAuth.link(
              with: .google,
              appUrlScheme: "your-app-scheme"  // Optional
          )

          // Successfully linked an OAuth account to an existing user
      } catch {
          print("Linking failed: \(error.localizedDescription)")
      }
      ```
    </Tab>
  </Tabs>
</View>

<View title="Flutter" icon="flutter">
  <Tabs>
    <Tab title="Email/Phone">
      The steps to implementing the `linkWithCode` flow are analogous to the [`loginWithCode` flow](/authentication/user-authentication/login-methods/email#flutter). The same thing applies for phone accounts, using `privy.sms.linkWithCode` similar to how [`privy.sms.loginWithCode`](/authentication/user-authentication/login-methods/sms-whatsapp#flutter) works.

      First, prompt the user for their email address and use the Privy client's `privy.email.sendCode` method to send them a one-time passcode:

      ```dart  theme={"system"}
      Future<Result<void>> sendCode(String email)
      ```

      ## Link With Code

      Then, prompt the user for the code they received and use the `linkWithCode` method:

      ```dart  theme={"system"}
      Future<Result<PrivyUser>> linkWithCode({
        required String code,
        required String email,
      })
      ```

      <ParamField path="code" type="String" required>
        The one-time passcode sent to the user's email address.
      </ParamField>

      <ParamField path="email" type="String" required>
        The user's email address.
      </ParamField>

      ### Returns

      <ResponseField name="Result<PrivyUser>" type="Result<PrivyUser>">
        A Result object encapsulating the updated PrivyUser on success, providing immediate access to the user object with the newly linked account.
      </ResponseField>

      ## Usage

      ```dart  theme={"system"}
      // Send code to user's email
      final sendResult = await privy.email.sendCode("user@test.com");

      sendResult.fold(
        onSuccess: (_) {
          // OTP was successfully sent, now prompt user for code
        },
        onFailure: (error) {
          print("Error sending OTP: ${error.message}");
        },
      );

      // Link the email using the code
      final linkResult = await privy.email.linkWithCode(
        code: "123456",
        email: "user@test.com",
      );

      linkResult.fold(
        onSuccess: (updatedUser) {
          print("Email successfully linked!");
          // updatedUser contains the updated user object with the email added
        },
        onFailure: (error) {
          print("Error linking email: ${error.message}");
        },
      );
      ```
    </Tab>

    <Tab title="External Wallets">
      The steps to implementing the `link` flow are analogous to the [login flows](/authentication/user-authentication/login-methods/wallet#flutter) of both Sign in with Ethereum (SIWE) and Sign in with Solana (SIWS).

      <Tabs>
        <Tab title="Ethereum Wallet">
          To link an Ethereum wallet, use the Privy client's `siwe` handler.

          ## Generate SIWE message

          ```dart  theme={"system"}
          Future<Result<String>> generateMessage(SiweMessageParams params)
          ```

          ### Parameters

          <ParamField path="params" type="SiweMessageParams">
            Set of parameters required to generate the message.

            <Expandable defaultOpen="true">
              <ParamField path="appDomain" type="String" required>
                Your app's domain. e.g. "my-domain.com"
              </ParamField>

              <ParamField path="appUri" type="String" required>
                Your app's URI. e.g. "[https://my-domain.com](https://my-domain.com)"
              </ParamField>

              <ParamField path="chainId" type="String" required>
                EVM Chain ID, e.g. "1" for Ethereum Mainnet
              </ParamField>

              <ParamField path="walletAddress" type="String" required>
                The user's [ERC-55](https://eips.ethereum.org/EIPS/eip-55) compliant wallet address.
              </ParamField>
            </Expandable>
          </ParamField>

          ### Returns

          <ResponseField name="Result<String>" type="Result<String>">
            A result type encapsulating the SIWE message that can be signed by the wallet on success.
          </ResponseField>

          ### Usage

          ```dart  theme={"system"}
          final params = SiweMessageParams(
            appDomain: domain,
            appUri: uri,
            chainId: chainId,
            walletAddress: walletAddress,
          );

          final result = await privy.siwe.generateMessage(params);

          result.fold(
            onSuccess: (message) {
              // request an EIP-191 `personal_sign` signature on the message
            },
            onFailure: (error) {
              // An error can be thrown if the network call to generate the message fails,
              // or if invalid metadata was passed in.
            },
          );
          ```

          ## Sign the SIWE message

          Using the message returned by `generateMessage`, request an EIP-191 `personal_sign` signature from the user's connected wallet. You should do this using the library your app uses to connect to external wallets (e.g. the MetaMask SDK or WalletConnect). Once the user successfully signs the message, pass the signature into the `link` function.

          ## Link with SIWE

          ```dart  theme={"system"}
          Future<Result<PrivyUser>> link({
            required String message,
            required String signature,
            required SiweMessageParams params,
            WalletLoginMetadata? metadata,
          })
          ```

          ### Parameters

          <ParamField path="message" type="String" required>
            The message returned from "generateMessage".
          </ParamField>

          <ParamField path="signature" type="String" required>
            The signature of the SIWE message, signed by the user's wallet.
          </ParamField>

          <ParamField path="params" type="SiweMessageParams" required>
            The same SiweMessageParams passed into "generateMessage".
          </ParamField>

          <ParamField path="metadata" type="WalletLoginMetadata">
            (Optional) you can pass additional metadata that will be stored with the linked wallet.

            <Expandable defaultOpen="true">
              <ParamField path="walletClientType" type="WalletClientType">
                An enum specifying the type of wallet used to link. e.g. WalletClientType.metamask
              </ParamField>

              <ParamField path="connectorType" type="String">
                A string identifying how wallet was connected. e.g. "wallet\_connect"
              </ParamField>
            </Expandable>
          </ParamField>

          ### Returns

          <ResponseField name="Result<PrivyUser>" type="Result<PrivyUser>">
            A Result object encapsulating the updated PrivyUser on success, providing immediate access to the user object with the newly linked wallet.
          </ResponseField>

          ### Usage

          ```dart  theme={"system"}
          final params = SiweMessageParams(
            appDomain: domain,
            appUri: uri,
            chainId: chainId,
            walletAddress: walletAddress,
          );

          // optional metadata
          final metadata = WalletLoginMetadata(
            walletClientType: walletClient,
            connectorType: connectorType,
          );

          final result = await privy.siwe.link(
            message: message,
            signature: signature,
            params: params,
            metadata: metadata,
          );

          result.fold(
            onSuccess: (updatedUser) {
              // Link success
              // updatedUser contains the updated user object with the wallet added
            },
            onFailure: (error) {
              // Link failure, either due to invalid signature or network error
            },
          );
          ```
        </Tab>

        <Tab title="Solana Wallet">
          To link a Solana wallet, use the Privy client's `siws` handler.

          ## Generate SIWS message

          ```dart  theme={"system"}
          Future<Result<String>> generateMessage(SiwsMessageParams params)
          ```

          ### Parameters

          <ParamField path="params" type="SiwsMessageParams">
            Set of parameters required to generate the message.

            <Expandable defaultOpen="true">
              <ParamField path="appDomain" type="String" required>
                Your app's domain. e.g. "my-domain.com"
              </ParamField>

              <ParamField path="appUri" type="String" required>
                Your app's URI. e.g. "[https://my-domain.com](https://my-domain.com)"
              </ParamField>

              <ParamField path="walletAddress" type="String" required>
                The user's Solana wallet address.
              </ParamField>
            </Expandable>
          </ParamField>

          ### Returns

          <ResponseField name="Result<String>" type="Result<String>">
            A result type encapsulating the SIWS message that can be signed by the wallet on success.
          </ResponseField>

          ### Usage

          ```dart  theme={"system"}
          final params = SiwsMessageParams(
            appDomain: domain,
            appUri: uri,
            walletAddress: walletAddress,
          );

          final result = await privy.siws.generateMessage(params);

          result.fold(
            onSuccess: (message) {
              // request a signature on the message from the Solana wallet
            },
            onFailure: (error) {
              // An error can be thrown if the network call to generate the message fails,
              // or if invalid metadata was passed in.
            },
          );
          ```

          ## Sign the SIWS message

          Using the message returned by `generateMessage`, request a signature from the user's connected Solana wallet. You should do this using the library your app uses to connect to Solana wallets (e.g. the Phantom SDK or Solana Mobile Wallet Adapter). Once the user successfully signs the message, pass the signature into the `link` function.

          ## Link with SIWS

          ```dart  theme={"system"}
          Future<Result<PrivyUser>> link({
            required String message,
            required String signature,
            required SiwsMessageParams params,
            WalletLoginMetadata? metadata,
          })
          ```

          ### Parameters

          <ParamField path="message" type="String" required>
            The message returned from "generateMessage".
          </ParamField>

          <ParamField path="signature" type="String" required>
            The signature of the SIWS message, signed by the user's Solana wallet.
          </ParamField>

          <ParamField path="params" type="SiwsMessageParams" required>
            The same SiwsMessageParams passed into "generateMessage".
          </ParamField>

          <ParamField path="metadata" type="WalletLoginMetadata">
            (Optional) you can pass additional metadata that will be stored with the linked wallet.

            <Expandable defaultOpen="true">
              <ParamField path="walletClientType" type="WalletClientType">
                An enum specifying the type of wallet used to link. e.g. WalletClientType.phantom
              </ParamField>

              <ParamField path="connectorType" type="String">
                A string identifying how wallet was connected. e.g. "wallet\_connect"
              </ParamField>
            </Expandable>
          </ParamField>

          ### Returns

          <ResponseField name="Result<PrivyUser>" type="Result<PrivyUser>">
            A Result object encapsulating the updated PrivyUser on success, providing immediate access to the user object with the newly linked wallet.
          </ResponseField>

          ### Usage

          ```dart  theme={"system"}
          final params = SiwsMessageParams(
            appDomain: domain,
            appUri: uri,
            walletAddress: walletAddress,
          );

          // optional metadata
          final metadata = WalletLoginMetadata(
            walletClientType: walletClient,
            connectorType: connectorType,
          );

          final result = await privy.siws.link(
            message: message,
            signature: signature,
            params: params,
            metadata: metadata,
          );

          result.fold(
            onSuccess: (updatedUser) {
              // Link success
              // updatedUser contains the updated user object with the wallet added
            },
            onFailure: (error) {
              // Link failure, either due to invalid signature or network error
            },
          );
          ```
        </Tab>
      </Tabs>
    </Tab>

    <Tab title="Passkeys">
      Use the following method from the `passkey` handler to link a new passkey to a user. Be sure to follow the [Android](/basics/android/advanced/setup-passkeys) and [iOS](/authentication/user-authentication/login-methods/passkey#swift) setup instructions.

      ```dart  theme={"system"}
      Future<Result<PrivyUser>> link({
        required String relyingParty,
        String? displayName,
      })
      ```

      ### Parameters

      <ParamField path="relyingParty" type="String" required>
        The URL origin where your Digital Asset Links are available (e.g., `https://example.com`).
      </ParamField>

      <ParamField path="displayName" type="String">
        An optional display name to associate with the passkey. This name will be shown to the user when selecting which passkey to use for authentication.
      </ParamField>

      ### Returns

      <ResponseField name="Result<PrivyUser>" type="Result<PrivyUser>">
        A Result object encapsulating the updated PrivyUser on success, providing immediate access to the user object with the newly linked passkey.
      </ResponseField>

      ## Usage

      ```dart  theme={"system"}
      final relyingParty = "https://yourdomain.com";
      final displayName = "Optional Display Name"; // Optional parameter

      final result = await privy.passkey.link(
        relyingParty: relyingParty,
        displayName: displayName,
      );

      result.fold(
        onSuccess: (updatedUser) {
          // Successfully linked a passkey to an existing user
          // updatedUser contains the updated user object with the passkey added
          print("Passkey linked successfully!");
        },
        onFailure: (error) {
          // Handle error
          print("Link failed: ${error.message}");
        },
      );
      ```
    </Tab>
  </Tabs>
</View>
\n