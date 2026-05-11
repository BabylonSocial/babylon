> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Passkey

export const ExpoUserObject = ({description}) => {
  return <ResponseField name="user" type="PrivyUser">
      {description}
      <Expandable title="child attributes" defaultOpen="true">
        <ResponseField name="id" type="string">
          The Privy DID which you may use to identify your user on your backend
        </ResponseField>
        <ResponseField name="created_at" type="number">
          UNIX timestamp of when the user was created
        </ResponseField>
        <ResponseField name="linked_accounts" type="Array">
          An array of the user's linked accounts
          <Expandable title="Account Types">
            <ResponseField name="AppleAccount" type="Object">
              <Expandable title="child attributes" defaultOpen="true">
                <ResponseField name="type" type="string">
                  'apple_oauth'
                </ResponseField>
                <ResponseField name="email" type="string">
                  Email address associated with the user's Apple account
                </ResponseField>
                <ResponseField name="subject" type="number">
                  ID of user from Apple's user API
                </ResponseField>
                <ResponseField name="first_verified_at" type="number">
                  UNIX timestamp for when the account was first verified and linked to the user
                </ResponseField>
                <ResponseField name="latest_verified_at" type="number">
                  UNIX timestamp for when the account was last verified
                </ResponseField>
              </Expandable>
            </ResponseField>
            <ResponseField name="CustomJwtAccount" type="Object">
              <Expandable title="child attributes" defaultOpen="true">
                <ResponseField name="type" type="string">
                  'custom_auth'
                </ResponseField>
                <ResponseField name="custom_user_id" type="string">
                  ID of user from custom auth provider
                </ResponseField>
                <ResponseField name="first_verified_at" type="number">
                  UNIX timestamp for when the account was first verified and linked to the user
                </ResponseField>
                <ResponseField name="latest_verified_at" type="number">
                  UNIX timestamp for when the account was last verified
                </ResponseField>
              </Expandable>
            </ResponseField>
            <ResponseField name="DiscordAccount" type="Object">
              <Expandable title="child attributes" defaultOpen="true">
                <ResponseField name="type" type="string">
                  'discord_oauth'
                </ResponseField>
                <ResponseField name="subject" type="string">
                  ID of user from Discord user API response
                </ResponseField>
                <ResponseField name="email" type="string">
                  Email of user from Discord user API response
                </ResponseField>
                <ResponseField name="username" type="string">
                  Username of user from Discord user API response, including the 4-digit
                  discriminator prefixed by '#'
                </ResponseField>
                <ResponseField name="first_verified_at" type="number">
                  UNIX timestamp for when the account was first verified and linked to the user
                </ResponseField>
                <ResponseField name="latest_verified_at" type="number">
                  UNIX timestamp for when the account was last verified
                </ResponseField>
              </Expandable>
            </ResponseField>
            <ResponseField name="EmailAccount" type="Object">
              <Expandable title="child attributes" defaultOpen="true">
                <ResponseField name="type" type="string">
                  'email'
                </ResponseField>
                <ResponseField name="address" type="string">
                  Email address of user account
                </ResponseField>
                <ResponseField name="first_verified_at" type="number">
                  UNIX timestamp for when the account was first verified and linked to the user
                </ResponseField>
                <ResponseField name="latest_verified_at" type="number">
                  UNIX timestamp for when the account was last verified
                </ResponseField>
              </Expandable>
            </ResponseField>
            <ResponseField name="FarcasterAccount" type="Object">
              <Expandable title="child attributes" defaultOpen="true">
                <ResponseField name="type" type="string">
                  'farcaster'
                </ResponseField>
                <ResponseField name="fid" type="number">
                  FID of the user from Farcaster user API response
                </ResponseField>
                <ResponseField name="owner_address" type="string">
                  Wallet address of the user from Farcaster user API response (Farcaster wallet
                  address, not Privy embedded wallet address)
                </ResponseField>
                <ResponseField name="username" type="string" optional>
                  Username of user from Farcaster user API response (does not include the '@')
                </ResponseField>
                <ResponseField name="display_name" type="string" optional>
                  Display name of user from Farcaster user API response
                </ResponseField>
                <ResponseField name="bio" type="string" optional>
                  Bio of user from Farcaster user API response
                </ResponseField>
                <ResponseField name="profile_picture_url" type="string" optional>
                  Profile picture URL of the user from Farcaster user API response
                </ResponseField>
                <ResponseField name="homepage_url" type="string" optional>
                  Profile URL of the user from Farcaster user API response
                </ResponseField>
                <ResponseField name="first_verified_at" type="number">
                  UNIX timestamp for when the account was first verified and linked to the user
                </ResponseField>
                <ResponseField name="latest_verified_at" type="number">
                  UNIX timestamp for when the account was last verified
                </ResponseField>
              </Expandable>
            </ResponseField>
            <ResponseField name="GithubAccount" type="Object">
              <Expandable title="child attributes" defaultOpen="true">
                <ResponseField name="type" type="string">
                  'github_oauth'
                </ResponseField>
                <ResponseField name="subject" type="string">
                  ID of user from GitHub user API response
                </ResponseField>
                <ResponseField name="email" type="string">
                  Email of user from GitHub user API response
                </ResponseField>
                <ResponseField name="name" type="string">
                  Name of user from GitHub user API response
                </ResponseField>
                <ResponseField name="username" type="string">
                  Username of user from GitHub user API response
                </ResponseField>
                <ResponseField name="first_verified_at" type="number">
                  UNIX timestamp for when the account was first verified and linked to the user
                </ResponseField>
                <ResponseField name="latest_verified_at" type="number">
                  UNIX timestamp for when the account was last verified
                </ResponseField>
              </Expandable>
            </ResponseField>
            <ResponseField name="GoogleAccount" type="Object">
              <Expandable title="child attributes" defaultOpen="true">
                <ResponseField name="type" type="string">
                  'google_oauth'
                </ResponseField>
                <ResponseField name="subject" type="string">
                  'sub' pulled from Google-provided JWT with "openid" scope
                </ResponseField>
                <ResponseField name="email" type="string">
                  'email' from Google-provided JWT with "email" scope
                </ResponseField>
                <ResponseField name="name" type="string">
                  'name' from Google-provided JWT with "profile" scope
                </ResponseField>
                <ResponseField name="first_verified_at" type="number">
                  UNIX timestamp for when the account was first verified and linked to the user
                </ResponseField>
                <ResponseField name="latest_verified_at" type="number">
                  UNIX timestamp for when the account was last verified
                </ResponseField>
              </Expandable>
            </ResponseField>
            <ResponseField name="InstagramAccount" type="Object">
              <Expandable title="child attributes" defaultOpen="true">
                <ResponseField name="type" type="string">
                  'instagram_oauth'
                </ResponseField>
                <ResponseField name="subject" type="string">
                  ID of user from Instagram user API response
                </ResponseField>
                <ResponseField name="username" type="string">
                  The name displayed on a user's profile from Instagram's `/me` API response
                </ResponseField>
                <ResponseField name="first_verified_at" type="number">
                  UNIX timestamp for when the account was first verified and linked to the user
                </ResponseField>
                <ResponseField name="latest_verified_at" type="number">
                  UNIX timestamp for when the account was last verified
                </ResponseField>
              </Expandable>
            </ResponseField>
            <ResponseField name="LinkedinAccount" type="Object">
              <Expandable title="child attributes" defaultOpen="true">
                <ResponseField name="type" type="string">
                  'linkedin_oauth'
                </ResponseField>
                <ResponseField name="subject" type="string">
                  ID of user from LinkedIn user API response
                </ResponseField>
                <ResponseField name="email" type="string">
                  Email of user from LinkedIn user API response
                </ResponseField>
                <ResponseField name="name" type="string">
                  Name of user from LinkedIn user API response (does not include the '@')
                </ResponseField>
                <ResponseField name="first_verified_at" type="number">
                  UNIX timestamp for when the account was first verified and linked to the user
                </ResponseField>
                <ResponseField name="latest_verified_at" type="number">
                  UNIX timestamp for when the account was last verified
                </ResponseField>
              </Expandable>
            </ResponseField>
            <ResponseField name="PhoneAccount" type="Object">
              <Expandable title="child attributes" defaultOpen="true">
                <ResponseField name="type" type="string">
                  'phone'
                </ResponseField>
                <ResponseField name="number" type="string">
                  Phone number of user account (non-international numbers default to US)
                </ResponseField>
                <ResponseField name="first_verified_at" type="number">
                  UNIX timestamp for when the account was first verified and linked to the user
                </ResponseField>
                <ResponseField name="latest_verified_at" type="number">
                  UNIX timestamp for when the account was last verified
                </ResponseField>
              </Expandable>
            </ResponseField>
            <ResponseField name="SpotifyAccount" type="Object">
              <Expandable title="child attributes" defaultOpen="true">
                <ResponseField name="type" type="string">
                  'spotify_oauth'
                </ResponseField>
                <ResponseField name="subject" type="string">
                  ID of user from Spotify user API response
                </ResponseField>
                <ResponseField name="email" type="string">
                  Email of user from Spotify user API
                </ResponseField>
                <ResponseField name="name" type="string">
                  The name displayed on a user's profile from Spotify display_name API response
                </ResponseField>
                <ResponseField name="first_verified_at" type="number">
                  UNIX timestamp for when the account was first verified and linked to the user
                </ResponseField>
                <ResponseField name="latest_verified_at" type="number">
                  UNIX timestamp for when the account was last verified
                </ResponseField>
              </Expandable>
            </ResponseField>
            <ResponseField name="TelegramAccount" type="Object">
              <Expandable title="child attributes" defaultOpen="true">
                <ResponseField name="type" type="string">
                  'telegram'
                </ResponseField>
                <ResponseField name="telegram_user_id" type="string">
                  ID of a user's telegram account
                </ResponseField>
                <ResponseField name="first_name" type="string">
                  The first name displayed on a user's telegram account
                </ResponseField>
                <ResponseField name="last_name" type="string" optional>
                  The last name displayed on a user's telegram account
                </ResponseField>
                <ResponseField name="username" type="string" optional>
                  The username displayed on a user's telegram account
                </ResponseField>
                <ResponseField name="photo_url" type="string" optional>
                  The url of a user's telegram account profile picture
                </ResponseField>
                <ResponseField name="first_verified_at" type="number">
                  UNIX timestamp for when the account was first verified and linked to the user
                </ResponseField>
                <ResponseField name="latest_verified_at" type="number">
                  UNIX timestamp for when the account was last verified
                </ResponseField>
              </Expandable>
            </ResponseField>
            <ResponseField name="TwitterAccount" type="Object">
              <Expandable title="child attributes" defaultOpen="true">
                <ResponseField name="type" type="string">
                  'twitter_oauth'
                </ResponseField>
                <ResponseField name="subject" type="string">
                  ID of user from Twitter user API response
                </ResponseField>
                <ResponseField name="name" type="string">
                  Name of user from Twitter user API response
                </ResponseField>
                <ResponseField name="username" type="string">
                  Username of user from Twitter user API response (does not include the '@')
                </ResponseField>
                <ResponseField name="profile_picture_url" type="string" optional>
                  Profile picture URL of the user from Twitter user API response
                </ResponseField>
                <ResponseField name="first_verified_at" type="number">
                  UNIX timestamp for when the account was first verified and linked to the user
                </ResponseField>
                <ResponseField name="latest_verified_at" type="number">
                  UNIX timestamp for when the account was last verified
                </ResponseField>
              </Expandable>
            </ResponseField>
            <ResponseField name="WalletAccount" type="Object">
              <Expandable title="child attributes" defaultOpen="true">
                <ResponseField name="type" type="string">
                  'wallet'
                </ResponseField>
                <ResponseField name="chain_type" type="string">
                  Type of chain for the wallet: 'ethereum' or 'solana'
                </ResponseField>
                <ResponseField name="address" type="string">
                  Checksummed wallet address
                </ResponseField>
                <ResponseField name="first_verified_at" type="number">
                  UNIX timestamp for when the account was first verified and linked to the user
                </ResponseField>
                <ResponseField name="latest_verified_at" type="number">
                  UNIX timestamp for when the account was last verified
                </ResponseField>
              </Expandable>
            </ResponseField>
          </Expandable>
        </ResponseField>
      </Expandable>
    </ResponseField>;
};

Privy offers the ability to sign up and log users in using a passkey. This lets users access their account simply and securely.

<Tip>
  Enable passkey authentication in the [Privy
  Dashboard](https://dashboard.privy.io/apps?page=login-methods) before implementing this feature.
</Tip>

<View title="React" icon="react">
  ## Login with Passkey

  <Info>
    To authenticate your users with Privy's out of the box UIs, check out UI components [here](/authentication/user-authentication/ui-component).
  </Info>

  Use `loginWithPasskey` from the `useLoginWithPasskey` hook to trigger the passkey login flow.

  ```jsx  theme={"system"}
  loginWithPasskey: ({ passkey?: string }) => void
  ```

  <ParamField path="passkey" type="string">
    Optionally prompt the user to sign in with a specific passkey credential.
  </ParamField>

  ### Usage

  ```jsx  theme={"system"}
  import { useLoginWithPasskey } from '@privy-io/react-auth';

  export default function LoginWithPasskey() {
    const { loginWithPasskey } = useLoginWithPasskey();

    return (
      <div>
        <button onClick={loginWithPasskey}>Log in with passkey</button>
      </div>
    );
  }
  ```

  ## Sign up with Passkey

  Use `signupWithPasskey` from the `useSignupWithPasskey` hook to trigger the passkey signup flow.

  ```jsx  theme={"system"}
  signupWithPasskey: () => void
  ```

  ### Usage

  ```jsx  theme={"system"}
  import { useSignupWithPasskey } from '@privy-io/react-auth';

  export default function SignupWithPasskey() {
    const { signupWithPasskey } = useSignupWithPasskey();

    return (
      <div>
        <button onClick={signupWithPasskey}>Sign up with passkey</button>
      </div>
    );
  }
  ```

  ## Tracking Flow State

  Track the state of the passkey flow via the `state` variable returned by both the
  `useLoginWithPasskey` and `useSignupWithPasskey` hooks.

  ```tsx  theme={"system"}
  state:
    | {status: 'initial'}
    | {status: 'error'; error: Error | null}
    | {status: 'generating-challenge'}
    | {status: 'awaiting-passkey'}
    | {status: 'submitting-response'}
    | {status: 'done'};
  ```

  <ResponseField name="status" type="'initial' | 'error' | 'generating-challenge' | 'awaiting-passkey' | 'submitting-response' | 'done'">
    The current state of the passkey flow.
  </ResponseField>

  <ResponseField name="error" type="Error | null">
    The error that occurred during the passkey flow.
  </ResponseField>

  ## Callbacks

  You can optionally pass callbacks into the `useLoginWithPasskey` and `useSignupWithPasskey` hooks to run custom logic after a successful login or signup, or to handle errors that occur during the flow.

  ### `onComplete`

  ```tsx  theme={"system"}
  onComplete: ({user, isNewUser, wasAlreadyAuthenticated, loginMethod, linkedAccount}) => void
  ```

  #### Parameters

  <ParamField path="User" type="PrivyUser">
    The [user object](/user-management/users/the-user-object) returned after successful login or signup."
  </ParamField>

  <ParamField path="isNewUser" type="boolean">
    Whether the user is a new user or an existing user.
  </ParamField>

  <ParamField path="wasAlreadyAuthenticated" type="boolean">
    Whether the user was already authenticated before the passkey flow.
  </ParamField>

  <ParamField path="loginMethod" type="'passkey'">
    The login method used to authenticate the user.
  </ParamField>

  <ParamField path="linkedAccount" type="LinkedAccount">
    The linked account if the user was already authenticated.
  </ParamField>

  ### `onError`

  ```tsx  theme={"system"}
  onError: (error: Error) => void
  ```

  #### Parameters

  <ParamField path="error" type="Error">
    The error that occurred during the passkey flow.
  </ParamField>

  ## Resources

  <Columns cols={3}>
    <Card title="React starter repo" href="https://github.com/privy-io/examples/tree/main/privy-react-starter" icon="github" arrow="true">
      Get started with React and Privy.
    </Card>

    <Card title="Next.js starter repo" href="https://github.com/privy-io/examples/tree/main/privy-next-starter" icon="github" arrow="true">
      Get started with Next.js and Privy.
    </Card>

    <Card title="Whitelabel starter repo" href="https://github.com/privy-io/examples/tree/main/privy-react-whitelabel-starter" icon="github" arrow="true">
      Get started with a whitelabel Privy integration.
    </Card>
  </Columns>
</View>

<View title="React Native" icon="react">
  <Tip>
    Follow the [passkeys setup guide](/basics/react-native/advanced/setup-passkeys) to enable passkey authentication in your React Native app.
  </Tip>

  <Info>
    To authenticate your users with Privy's out of the box UIs, check out UI components [here](/authentication/user-authentication/ui-component#react-native).
  </Info>

  ## Login with Passkey

  Use `loginWithPasskey` from the `useLoginWithPasskey` hook to authenticate users using a passkey. Before using this method, ensure you have setup passkeys as described in this [guide](/basics/react-native/advanced/setup-passkeys).

  ```tsx  theme={"system"}
  loginWithPasskey: ({ relyingParty: string }) => Promise<PrivyUser>
  ```

  ### Parameters

  <ParamField path="relyingParty" type="string" required>
    The URL origin where your Apple App Site Association or Digital Asset Links are available (e.g. `https://example.com`).
  </ParamField>

  ### Response

  <ExpoUserObject description="The user object returned after successful login." />

  ### Usage

  ```tsx  theme={"system"}
  import {useLoginWithPasskey} from '@privy-io/expo/passkey';

  export function LoginButton() {
    const {loginWithPasskey} = useLoginWithPasskey();

    return (
      <Button onPress={() => loginWithPasskey({relyingParty: '<your-applications-relying-party>'})}>
        Login
      </Button>
    );
  }
  ```

  ## Sign up with Passkey

  Use `signupWithPasskey` from the `useSignupWithPasskey` hook to sign up users using a passkey.

  ```tsx  theme={"system"}
  signupWithPasskey: ({ relyingParty: string }) => Promise<PrivyUser>
  ```

  ### Parameters

  <ParamField path="relyingParty" type="string" required>
    The URL origin where your Apple App Site Association or Digital Asset Links are available (e.g. `https://example.com`).
  </ParamField>

  ### Response

  <ExpoUserObject description="The user object returned after successful signup." />

  ### Usage

  ```tsx  theme={"system"}
  import {useSignupWithPasskey} from '@privy-io/expo/passkey';

  export function SignupButton() {
    const {signupWithPasskey} = useSignupWithPasskey();

    return (
      <Button onPress={() => signupWithPasskey({relyingParty: '<your-applications-relying-party>'})}>
        Signup
      </Button>
    );
  }
  ```

  ## Tracking Flow State

  Track the state of the passkey flow via the `state` variable returned by both the
  `useLoginWithPasskey` and `useSignupWithPasskey` hooks.

  ```tsx  theme={"system"}
  state:
    | {status: 'initial'}
    | {status: 'error'; error: Error | null}
    | {status: 'generating-challenege'}
    | {status: 'awaiting-passkey'}
    | {status: 'submitting-response'}
    | {status: 'done'};
  ```

  <ResponseField name="status" type="'initial' | 'error' | 'generating-challenege' | 'awaiting-passkey' | 'submitting-response' | 'done'">
    {/* spellchecker:disable-line */}

    The current state of the passkey flow.
  </ResponseField>

  <ResponseField name="error" type="Error | null">
    The error that occurred during the passkey flow.
  </ResponseField>

  ## Callbacks

  You can optionally pass callbacks into the `useLoginWithPasskey` and `useSignupWithPasskey` hooks to run custom logic after a successful login or signup, or to handle errors that occur during the flow.

  ### `onSuccess`

  ```tsx  theme={"system"}
  onSuccess: (user: PrivyUser, isNewUser: boolean) => Promise<void>
  ```

  #### Parameters

  <ExpoUserObject description="The user object returned after successful login or signup." />

  <ParamField path="isNewUser" type="boolean">
    Whether the user is a new user or an existing user.
  </ParamField>

  #### Usage

  ```tsx  theme={"system"}
  import {useLoginWithPasskey} from '@privy-io/expo/passkey';

  export function LoginScreen() {
    const {loginWithPasskey} = useLoginWithPasskey({
      onSuccess(user, isNewUser) {
        // show a toast, send analytics event, etc...
      },
    });

    // ...
  }
  ```

  ### `onError`

  ```tsx  theme={"system"}
  onError: (error: Error) => Promise<void>
  ```

  #### Parameters

  <ParamField path="error" type="Error">
    The error that occurred during the passkey flow.
  </ParamField>

  #### Usage

  ```tsx  theme={"system"}
  import {useLoginWithPasskey} from '@privy-io/expo/passkey';

  export function LoginScreen() {
    const {loginWithPasskey} = useLoginWithPasskey({
      onError(error) {
        // show a toast, update form errors, etc...
      },
    });

    // ...
  }
  ```

  ## Resources

  <Columns cols={3}>
    <Card title="Expo starter repo" href="https://github.com/privy-io/examples/tree/main/privy-expo-starter" icon="github" arrow="true">
      Get started with Expo and Privy.
    </Card>

    <Card title="Expo bare starter repo" href="https://github.com/privy-io/examples/tree/main/privy-expo-bare-starter" icon="github" arrow="true">
      Get started with Expo bare and Privy.
    </Card>
  </Columns>
</View>

<View title="Swift" icon="swift">
  <Tip>
    Ensure an [apple-app-site-association (AASA) file is present on your domain](https://developer.apple.com/documentation/Xcode/supporting-associated-domains) in the .well-known directory, and that it contains an entry for your app’s App ID for the webcredentials service.
  </Tip>

  ## Login with Passkey

  Use `login` from the `privy.passkey` interface to authenticate an existing user who has already registered a passkey. This method allows returning users to log in using their previously created passkey credentials. Before using this method, ensure you have setup passkeys as described in the passkey setup guide.

  ```swift  theme={"system"}
  func login(relyingParty: String) async throws -> PrivyUser
  ```

  ### Parameters

  <ParamField path="relyingParty" type="String" required>
    The URL origin where your Digital Asset Links are available (e.g., `https://example.com`).
  </ParamField>

  ### Returns

  <ResponseField name="PrivyUser" type="PrivyUser">
    The authenticated Privy user
  </ResponseField>

  ### Usage

  ```swift  theme={"system"}
  do {
      let user = try await privy.passkey.login(relyingParty: relyingParty)

      // Successfully authenticated an existing user with a passkey
  } catch {
      print("Login failed: \(error.localizedDescription)")
  }
  ```

  ## Sign up with Passkey

  Use `signup` from the `privy.passkey` interface to create a new user account and register a passkey for them. This method creates a new user in your Privy app, whereas `login` authenticates an existing user who has already registered a passkey.

  ```kotlin  theme={"system"}
  func signup(relyingParty: String, displayName: String?) async throws -> PrivyUser
  ```

  ### Parameters

  <ParamField path="relyingParty" type="String" required>
    The URL origin where your Digital Asset Links are available (e.g., `https://example.com`).
  </ParamField>

  <ParamField path="displayName" type="String">
    An optional display name to associate with the passkey. This name will be shown to the user when selecting which passkey to use for authentication.
  </ParamField>

  ### Returns

  <ResponseField name="PrivyUser" type="PrivyUser">
    The authenticated Privy user
  </ResponseField>

  ### Usage

  ```swift  theme={"system"}
  do {
      let displayName = "Optional Display Name"

      let user = try await privy.passkey.signup(
          relyingParty: relyingParty,
          displayName: displayName
      )

      // Successfully created a new user with authenticated by a passkey
  } catch {
      print("Signup failed: \(error.localizedDescription)")
  }
  ```
</View>

<View title="Android" icon="android">
  <Tip>
    Follow the [passkeys setup guide](/basics/android/advanced/setup-passkeys) to enable passkey authentication in your Android app.
  </Tip>

  ## Login with Passkey

  Use `login` from the `privy.passkey` interface to authenticate an existing user who has already registered a passkey. This method allows returning users to log in using their previously created passkey credentials. Before using this method, ensure you have setup passkeys as described in the passkey setup guide.

  ```kotlin  theme={"system"}
  suspend fun login(relyingParty: String): Result<PrivyUser>
  ```

  ### Parameters

  <ParamField path="relyingParty" type="String" required>
    The URL origin where your Digital Asset Links are available (e.g., `https://example.com`).
  </ParamField>

  ### Response

  Returns a `Result<PrivyUser>` containing the user object after successful login.

  <Expandable title="PrivyUser">
    <ParamField body="id" type="String" required>
      The unique identifier for this user
    </ParamField>

    <ParamField body="linkedAccounts" type="List<LinkedAccount>" required>
      A list of linked accounts for this user. A linked account can be any of the methods a user
      authenticated with, or a user's embedded wallet

      <Expandable title="Properties">
        <Expandable title="CustomAuth">
          <ParamField body="customUserId" type="String" required>
            ID of user from custom auth provider
          </ParamField>

          <ParamField body="firstVerifiedAt" type="Int?">
            UNIX timestamp for when the account was first verified and linked to the user
          </ParamField>

          <ParamField body="latestVerifiedAt" type="Int?">
            UNIX timestamp for when the account was last verified
          </ParamField>
        </Expandable>

        <Expandable title="EmbeddedEthereumWalletAccount">
          <ParamField body="id" type="String?">
            The unique identifier for this embedded wallet
          </ParamField>

          <ParamField body="address" type="String" required>
            The wallet address
          </ParamField>

          <ParamField body="chainId" type="String?">
            The chain ID for this wallet
          </ParamField>

          <ParamField body="recoveryMethod" type="String?">
            The recovery method configured for this wallet
          </ParamField>

          <ParamField body="hdWalletIndex" type="Int" required>
            The HD wallet index (0 is the primary wallet)
          </ParamField>
        </Expandable>

        <Expandable title="EmbeddedSolanaWalletAccount">
          <ParamField body="id" type="String?">
            The unique identifier for this embedded wallet
          </ParamField>

          <ParamField body="address" type="String" required>
            The wallet address
          </ParamField>

          <ParamField body="chainId" type="String?">
            The chain ID for this wallet
          </ParamField>

          <ParamField body="recoveryMethod" type="String?">
            The recovery method configured for this wallet
          </ParamField>

          <ParamField body="hdWalletIndex" type="Int" required>
            The HD wallet index (0 is the primary wallet)
          </ParamField>
        </Expandable>

        <Expandable title="ExternalWalletAccount">
          <ParamField body="address" type="String" required>
            The wallet address
          </ParamField>

          <ParamField body="chainType" type="ChainType" required>
            The type of blockchain: ethereum or solana
          </ParamField>

          <ParamField body="chainId" type="String?">
            The chain ID for this wallet
          </ParamField>

          <ParamField body="walletClientType" type="String?">
            The wallet client type
          </ParamField>

          <ParamField body="connectorType" type="String?">
            The connector type used
          </ParamField>

          <ParamField body="firstVerifiedAt" type="Int?">
            UNIX timestamp for when the account was first verified and linked to the user
          </ParamField>

          <ParamField body="latestVerifiedAt" type="Int?">
            UNIX timestamp for when the account was last verified
          </ParamField>
        </Expandable>

        <Expandable title="PhoneAccount">
          <ParamField body="phoneNumber" type="String" required>
            Phone number of user account
          </ParamField>
        </Expandable>

        <Expandable title="EmailAccount">
          <ParamField body="emailAddress" type="String" required>
            Email address of user account
          </ParamField>
        </Expandable>

        <Expandable title="GoogleOAuthAccount">
          <ParamField body="subject" type="String" required>
            ID of user from Google user API response
          </ParamField>

          <ParamField body="email" type="String" required>
            Email of user from Google user API response
          </ParamField>

          <ParamField body="name" type="String?">
            Name of user from Google user API response
          </ParamField>

          <ParamField body="firstVerifiedAt" type="Int?">
            UNIX timestamp for when the account was first verified and linked to the user
          </ParamField>

          <ParamField body="latestVerifiedAt" type="Int?">
            UNIX timestamp for when the account was last verified
          </ParamField>
        </Expandable>

        <Expandable title="TwitterOAuthAccount">
          <ParamField body="subject" type="String" required>
            ID of user from Twitter user API response
          </ParamField>

          <ParamField body="username" type="String" required>
            Username of user from Twitter user API response (does not include the '@')
          </ParamField>

          <ParamField body="name" type="String?">
            Name of user from Twitter user API response
          </ParamField>

          <ParamField body="email" type="String?">
            Email of user from Twitter user API response
          </ParamField>

          <ParamField body="profilePictureUrl" type="String?">
            Profile picture URL of the user from Twitter user API response
          </ParamField>

          <ParamField body="firstVerifiedAt" type="Int?">
            UNIX timestamp for when the account was first verified and linked to the user
          </ParamField>

          <ParamField body="latestVerifiedAt" type="Int?">
            UNIX timestamp for when the account was last verified
          </ParamField>
        </Expandable>

        <Expandable title="DiscordOAuthAccount">
          <ParamField body="subject" type="String" required>
            ID of user from Discord user API response
          </ParamField>

          <ParamField body="username" type="String" required>
            Username of user from Discord user API response
          </ParamField>

          <ParamField body="email" type="String?">
            Email of user from Discord user API response
          </ParamField>

          <ParamField body="firstVerifiedAt" type="Int?">
            UNIX timestamp for when the account was first verified and linked to the user
          </ParamField>

          <ParamField body="latestVerifiedAt" type="Int?">
            UNIX timestamp for when the account was last verified
          </ParamField>
        </Expandable>

        <Expandable title="PasskeyAccount">
          <ParamField body="credentialId" type="String" required>
            The credential ID for this passkey
          </ParamField>

          <ParamField body="authenticatorName" type="String?">
            Name of the authenticator device
          </ParamField>

          <ParamField body="createdWithBrowser" type="String?">
            Browser used to create the passkey
          </ParamField>

          <ParamField body="createdWithOs" type="String?">
            Operating system used to create the passkey
          </ParamField>

          <ParamField body="createdWithDevice" type="String?">
            Device used to create the passkey
          </ParamField>

          <ParamField body="publicKey" type="String?">
            The public key for this passkey
          </ParamField>

          <ParamField body="enrolledInMfa" type="Boolean" required>
            Whether this passkey is enrolled in multi-factor authentication
          </ParamField>

          <ParamField body="verifiedAt" type="Long" required>
            UNIX timestamp for when the account was verified
          </ParamField>

          <ParamField body="firstVerifiedAt" type="Long?">
            UNIX timestamp for when the account was first verified and linked to the user
          </ParamField>

          <ParamField body="latestVerifiedAt" type="Long?">
            UNIX timestamp for when the account was last verified
          </ParamField>
        </Expandable>

        <br />
      </Expandable>
    </ParamField>

    <ParamField body="identityToken" type="String?">
      The identity token for this user, if configured in the Privy dashboard. This token is an optional
      JWT provided by Privy when identity token generation is enabled in the dashboard settings. It
      returns null if the user is unauthenticated or if the feature is not configured
    </ParamField>

    <ParamField body="embeddedEthereumWallets" type="List<EmbeddedEthereumWallet>" required>
      A list of the user's embedded Ethereum wallets. These wallets expose a "provider" instance which
      can be used to take wallet actions
    </ParamField>

    <ParamField body="embeddedSolanaWallets" type="List<EmbeddedSolanaWallet>" required>
      A list of the user's embedded Solana wallets. These wallets expose a "provider" instance which can
      be used to take wallet actions
    </ParamField>

    <br />
  </Expandable>

  ### Usage

  ```kotlin  theme={"system"}
  val result = privy.passkey.login(relyingParty = "https://<your-applications-relying-party>")

  result.fold(
      onSuccess = { user ->
          // Handle successful login
      },
      onFailure = { error ->
          // Handle login error
      }
  )
  ```

  ## Sign up with Passkey

  Use `signup` from the `privy.passkey` interface to create a new user account and register a passkey for them. This method creates a new user in your Privy app, whereas `login` authenticates an existing user who has already registered a passkey.

  ```kotlin  theme={"system"}
  suspend fun signup(relyingParty: String, displayName: String? = null): Result<PrivyUser>
  ```

  ### Parameters

  <ParamField path="relyingParty" type="String" required>
    The URL origin where your Digital Asset Links are available (e.g., `https://example.com`).
  </ParamField>

  <ParamField path="displayName" type="String">
    An optional display name to associate with the passkey. This name will be shown to the user when selecting which passkey to use for authentication.
  </ParamField>

  ### Response

  Returns a `Result<PrivyUser>` containing the user object after successful signup.

  <Expandable title="PrivyUser">
    <ParamField body="id" type="String" required>
      The unique identifier for this user
    </ParamField>

    <ParamField body="linkedAccounts" type="List<LinkedAccount>" required>
      A list of linked accounts for this user. A linked account can be any of the methods a user
      authenticated with, or a user's embedded wallet

      <Expandable title="Properties">
        <Expandable title="CustomAuth">
          <ParamField body="customUserId" type="String" required>
            ID of user from custom auth provider
          </ParamField>

          <ParamField body="firstVerifiedAt" type="Int?">
            UNIX timestamp for when the account was first verified and linked to the user
          </ParamField>

          <ParamField body="latestVerifiedAt" type="Int?">
            UNIX timestamp for when the account was last verified
          </ParamField>
        </Expandable>

        <Expandable title="EmbeddedEthereumWalletAccount">
          <ParamField body="id" type="String?">
            The unique identifier for this embedded wallet
          </ParamField>

          <ParamField body="address" type="String" required>
            The wallet address
          </ParamField>

          <ParamField body="chainId" type="String?">
            The chain ID for this wallet
          </ParamField>

          <ParamField body="recoveryMethod" type="String?">
            The recovery method configured for this wallet
          </ParamField>

          <ParamField body="hdWalletIndex" type="Int" required>
            The HD wallet index (0 is the primary wallet)
          </ParamField>
        </Expandable>

        <Expandable title="EmbeddedSolanaWalletAccount">
          <ParamField body="id" type="String?">
            The unique identifier for this embedded wallet
          </ParamField>

          <ParamField body="address" type="String" required>
            The wallet address
          </ParamField>

          <ParamField body="chainId" type="String?">
            The chain ID for this wallet
          </ParamField>

          <ParamField body="recoveryMethod" type="String?">
            The recovery method configured for this wallet
          </ParamField>

          <ParamField body="hdWalletIndex" type="Int" required>
            The HD wallet index (0 is the primary wallet)
          </ParamField>
        </Expandable>

        <Expandable title="ExternalWalletAccount">
          <ParamField body="address" type="String" required>
            The wallet address
          </ParamField>

          <ParamField body="chainType" type="ChainType" required>
            The type of blockchain: ethereum or solana
          </ParamField>

          <ParamField body="chainId" type="String?">
            The chain ID for this wallet
          </ParamField>

          <ParamField body="walletClientType" type="String?">
            The wallet client type
          </ParamField>

          <ParamField body="connectorType" type="String?">
            The connector type used
          </ParamField>

          <ParamField body="firstVerifiedAt" type="Int?">
            UNIX timestamp for when the account was first verified and linked to the user
          </ParamField>

          <ParamField body="latestVerifiedAt" type="Int?">
            UNIX timestamp for when the account was last verified
          </ParamField>
        </Expandable>

        <Expandable title="PhoneAccount">
          <ParamField body="phoneNumber" type="String" required>
            Phone number of user account
          </ParamField>
        </Expandable>

        <Expandable title="EmailAccount">
          <ParamField body="emailAddress" type="String" required>
            Email address of user account
          </ParamField>
        </Expandable>

        <Expandable title="GoogleOAuthAccount">
          <ParamField body="subject" type="String" required>
            ID of user from Google user API response
          </ParamField>

          <ParamField body="email" type="String" required>
            Email of user from Google user API response
          </ParamField>

          <ParamField body="name" type="String?">
            Name of user from Google user API response
          </ParamField>

          <ParamField body="firstVerifiedAt" type="Int?">
            UNIX timestamp for when the account was first verified and linked to the user
          </ParamField>

          <ParamField body="latestVerifiedAt" type="Int?">
            UNIX timestamp for when the account was last verified
          </ParamField>
        </Expandable>

        <Expandable title="TwitterOAuthAccount">
          <ParamField body="subject" type="String" required>
            ID of user from Twitter user API response
          </ParamField>

          <ParamField body="username" type="String" required>
            Username of user from Twitter user API response (does not include the '@')
          </ParamField>

          <ParamField body="name" type="String?">
            Name of user from Twitter user API response
          </ParamField>

          <ParamField body="email" type="String?">
            Email of user from Twitter user API response
          </ParamField>

          <ParamField body="profilePictureUrl" type="String?">
            Profile picture URL of the user from Twitter user API response
          </ParamField>

          <ParamField body="firstVerifiedAt" type="Int?">
            UNIX timestamp for when the account was first verified and linked to the user
          </ParamField>

          <ParamField body="latestVerifiedAt" type="Int?">
            UNIX timestamp for when the account was last verified
          </ParamField>
        </Expandable>

        <Expandable title="DiscordOAuthAccount">
          <ParamField body="subject" type="String" required>
            ID of user from Discord user API response
          </ParamField>

          <ParamField body="username" type="String" required>
            Username of user from Discord user API response
          </ParamField>

          <ParamField body="email" type="String?">
            Email of user from Discord user API response
          </ParamField>

          <ParamField body="firstVerifiedAt" type="Int?">
            UNIX timestamp for when the account was first verified and linked to the user
          </ParamField>

          <ParamField body="latestVerifiedAt" type="Int?">
            UNIX timestamp for when the account was last verified
          </ParamField>
        </Expandable>

        <Expandable title="PasskeyAccount">
          <ParamField body="credentialId" type="String" required>
            The credential ID for this passkey
          </ParamField>

          <ParamField body="authenticatorName" type="String?">
            Name of the authenticator device
          </ParamField>

          <ParamField body="createdWithBrowser" type="String?">
            Browser used to create the passkey
          </ParamField>

          <ParamField body="createdWithOs" type="String?">
            Operating system used to create the passkey
          </ParamField>

          <ParamField body="createdWithDevice" type="String?">
            Device used to create the passkey
          </ParamField>

          <ParamField body="publicKey" type="String?">
            The public key for this passkey
          </ParamField>

          <ParamField body="enrolledInMfa" type="Boolean" required>
            Whether this passkey is enrolled in multi-factor authentication
          </ParamField>

          <ParamField body="verifiedAt" type="Long" required>
            UNIX timestamp for when the account was verified
          </ParamField>

          <ParamField body="firstVerifiedAt" type="Long?">
            UNIX timestamp for when the account was first verified and linked to the user
          </ParamField>

          <ParamField body="latestVerifiedAt" type="Long?">
            UNIX timestamp for when the account was last verified
          </ParamField>
        </Expandable>

        <br />
      </Expandable>
    </ParamField>

    <ParamField body="identityToken" type="String?">
      The identity token for this user, if configured in the Privy dashboard. This token is an optional
      JWT provided by Privy when identity token generation is enabled in the dashboard settings. It
      returns null if the user is unauthenticated or if the feature is not configured
    </ParamField>

    <ParamField body="embeddedEthereumWallets" type="List<EmbeddedEthereumWallet>" required>
      A list of the user's embedded Ethereum wallets. These wallets expose a "provider" instance which
      can be used to take wallet actions
    </ParamField>

    <ParamField body="embeddedSolanaWallets" type="List<EmbeddedSolanaWallet>" required>
      A list of the user's embedded Solana wallets. These wallets expose a "provider" instance which can
      be used to take wallet actions
    </ParamField>

    <br />
  </Expandable>

  ### Usage

  ```kotlin  theme={"system"}
  val result = privy.passkey.signup(relyingParty = "https://<your-applications-relying-party>")

  result.fold(
      onSuccess = { user ->
          // Handle successful signup
      },
      onFailure = { error ->
          // Handle signup error
      }
  )
  ```
</View>

<View title="Flutter" icon="flutter">
  <Tip>
    To enable passkeys for your Flutter app, you need to set them up for both iOS and Android. Follow the [Android passkeys setup guide](/basics/android/advanced/setup-passkeys), and ensure an apple-app-site-association (AASA) file is present on your domain in the .well-known directory that contains an entry for your app's App ID for the webcredentials service.
  </Tip>

  ## Login with Passkey

  Use `login` from the `privy.passkey` interface to authenticate an existing user who has already registered a passkey. This method allows returning users to log in using their previously created passkey credentials. Before using this method, ensure you have setup passkeys as described in the passkey setup guide.

  ```dart  theme={"system"}
  Future<Result<PrivyUser>> login({
    required String relyingParty,
  })
  ```

  ### Parameters

  <ParamField path="relyingParty" type="String" required>
    The URL origin where your Digital Asset Links are available (e.g., `https://example.com`).
  </ParamField>

  ### Response

  Returns a `Result<PrivyUser>` containing the user object after successful login.

  ### Usage

  ```dart  theme={"system"}
  final result = await privy.passkey.login(
    relyingParty: "https://<your-applications-relying-party>",
  );

  result.fold(
    onSuccess: (user) {
      // Handle successful login
    },
    onFailure: (error) {
      // Handle login error
    },
  );
  ```

  ## Sign up with Passkey

  Use `signup` from the `privy.passkey` interface to create a new user account and register a passkey for them. This method creates a new user in your Privy app, whereas `login` authenticates an existing user who has already registered a passkey.

  ```dart  theme={"system"}
  Future<Result<PrivyUser>> signup({
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

  ### Response

  Returns a `Result<PrivyUser>` containing the user object after successful signup.

  ### Usage

  ```dart  theme={"system"}
  final result = await privy.passkey.signup(
    relyingParty: "https://<your-applications-relying-party>",
    displayName: "My Passkey", // optional
  );

  result.fold(
    onSuccess: (user) {
      // Handle successful signup
    },
    onFailure: (error) {
      // Handle signup error
    },
  );
  ```
</View>
\n