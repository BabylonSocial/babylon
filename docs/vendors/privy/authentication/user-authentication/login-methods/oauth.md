> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# OAuth

export const platform_4 = "Flutter"

export const providers_4 = "Google, Apple, Twitter, and Discord"

export const platform_3 = "Android"

export const providers_3 = "Google, Discord, and Twitter"

export const platform_2 = "Swift"

export const providers_2 = "Google, Apple, Twitter and Discord"

export const platform_1 = "React Native"

export const providers_1 = "Google, Apple, Twitter, GitHub, Discord, LinkedIn, Spotify, TikTok, LINE, and Instagram"

export const platform_0 = "React"

export const providers_0 = "Google, Apple, Twitter, GitHub, Discord, LinkedIn, Spotify, TikTok, Instagram, and Line"

Privy offers the ability to sign up and log users in using OAuth providers. Users can sign in with familiar flows on Google, Apple, Twitter, Github, Discord, LinkedIn, TikTok, Spotify, Instagram, and LINE.

<Info>
  {' '}

  Google OAuth login may not work in in-app browsers (IABs), such as those embedded in social apps,
  due to Google's restrictions in these environments. Other OAuth providers are generally
  unaffected.
</Info>

<Tip>
  Enable your desired OAuth login method in the [Privy
  Dashboard](https://dashboard.privy.io/apps?page=login-methods\&logins=socials) before implementing
  this feature.
</Tip>

Login with OAuth is the onboarding flow your users are used to, integrated into your application in just a few lines of code.

<View title="React" icon="react">
  <Tip>
    The {platform_0} SDK supports OAuth login with {providers_0}. For all other OAuth providers, you can
    use [JWT-based authentication](/authentication/user-authentication/jwt-based-auth/overview).
  </Tip>

  <Info>
    To authenticate your users with Privy's out of the box UIs, check out UI components [here](/authentication/user-authentication/ui-component).
  </Info>

  Use `initOAuth` from the `useLoginWithOAuth` hook to trigger the OAuth login flow.

  ```jsx  theme={"system"}
  initOAuth: ({ provider: OAuthProviderType, disableSignup?: boolean }) => Promise<void>
  ```

  <ParamField path="provider" type="OAuthProviderType" required>
    The OAuth provider to use for authentication. Valid values are: `'google'`, `'apple'`, `'twitter'`,
    `'github'`, `'discord'`, `'linkedin'`, `'spotify'`, `'tiktok'`, `'instagram'`, `'line'`.
  </ParamField>

  <ParamField path="disableSignup" type="boolean">
    If set to true, the OAuth flow will only allow users to log in with existing accounts and prevent new account creation.
  </ParamField>

  ### Usage

  ```jsx  theme={"system"}
  import { useLoginWithOAuth } from '@privy-io/react-auth';

  export default function LoginWithOAuth() {
    const { state, loading, initOAuth } = useLoginWithOAuth();

    const handleLogin = async () => {
        try {
            // The user will be redirected to OAuth provider's login page
            await initOAuth({ provider: 'google' });
        } catch (err) {
            // Handle errors (network issues, validation errors, etc.)
            console.error(err);
        }
    };

    return (
        <div>
            <button onClick={handleLogin} disabled={loading}>
                {loading ? 'Logging in...' : 'Log in with Google'}
            </button>
        </div>
    );
  }
  ```

  ## Tracking Flow State

  Track the state of the OAuth flow via the `state` variable returned by the `useLoginWithOAuth` hook.

  ```tsx  theme={"system"}
  state:
  | {status: 'initial'}
  | {status: 'loading'}
  | {status: 'done'}
  | {status: 'error'; error: Error | null};
  ```

  <ResponseField name="status" type="'initial' | 'loading' | 'done' | 'error'">
    The current state of the OAuth flow.
  </ResponseField>

  <ResponseField name="error" type="Error | null">
    The error that occurred during the OAuth flow (only present when status is 'error').
  </ResponseField>

  ## Callbacks

  You can optionally pass callbacks to the `useLoginWithOAuth` hook to run custom logic after a successful login or to handle errors.

  ### `onComplete`

  ```tsx  theme={"system"}
  onComplete: ({user, isNewUser, wasAlreadyAuthenticated, loginMethod, linkedAccount}) => void
  ```

  #### Parameters

  <ParamField path="user" type="User">
    The user object returned after successful login.
  </ParamField>

  <ParamField path="isNewUser" type="boolean">
    Whether the user is a new user or an existing user.
  </ParamField>

  <ParamField path="wasAlreadyAuthenticated" type="boolean">
    Whether the user was already authenticated before the OAuth flow.
  </ParamField>

  <ParamField path="loginMethod" type="string">
    The login method used ('google', 'apple', etc.).
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
    The error that occurred during the OAuth flow.
  </ParamField>

  ### Example with Callbacks

  ```jsx  theme={"system"}
  import { useLoginWithOAuth } from '@privy-io/react-auth';

  export default function LoginWithOAuth() {
      const { initOAuth } = useLoginWithOAuth({
          onComplete: ({ user, isNewUser }) => {
              console.log('User logged in successfully', user);
              if (isNewUser) {
                  // Perform actions for new users
              }
          },
          onError: (error) => {
              console.error('Login failed', error);
          }
      });

      return (
          <button onClick={() => initOAuth({ provider: 'google' })}>
              Log in with Google
          </button>
      );
  }
  ```

  ## Security

  We recommend configuring allowed OAuth redirect URLs to restrict where users can be redirected after they log in with an external OAuth provider. [Learn more here](/recipes/react/allowed-oauth-redirects)!

  ## Accessing OAuth tokens

  For any OAuth login method for which you configure your own credentials, you are able to have the user’s OAuth and Refresh access tokens accessible to your app by toggling Return OAuth tokens and making use of the [useOAuthTokens](/recipes/react/oauth-tokens) hook.

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
  <Info>
    To authenticate your users with Privy's out of the box UIs, check out UI components [here](/authentication/user-authentication/ui-component#react-native).
  </Info>

  <Tip>
    The {platform_1} SDK supports OAuth login with {providers_1}. For all other OAuth providers, you can
    use [JWT-based authentication](/authentication/user-authentication/jwt-based-auth/overview).
  </Tip>

  ### Configure allowed URL schemes

  Prior to integrating OAuth login, make sure you have [properly configured your app's allowed URL schemes in the Privy dashboard](/basics/get-started/dashboard/app-clients#allowed-url-schemes).

  <Warning>Login with OAuth will **not** work if you have not completed this step.</Warning>

  ## Initializing the login flow

  <Tip>
    Privy supports native [Apple login](https://developer.apple.com/sign-in-with-apple/) when running
    on iOS. To configure native Apple login, follow this
    [guide](/basics/react-native/advanced/setup-apple-login).
  </Tip>

  Use `login` from the `useLoginWithOAuth` hook to authenticate users using an OAuth provider.

  ```tsx  theme={"system"}
  login: ({
    provider: OAuthProviderType,
    disableSignup?: boolean
  }) => Promise<PrivyUser>
  ```

  ### Parameters

  <ParamField path="provider" type="OAuthProviderType" required>
    The OAuth provider to use for authentication. Valid values are: `'google'`, `'apple'`, `'twitter'`,
    `'github'`, `'discord'`, `'linkedin'`, `'spotify'`, `'tiktok'`, `'instagram'`.
  </ParamField>

  <ParamField path="disableSignup" type="boolean">
    If true, the OAuth flow will only allow existing users to log in, preventing new account creation.
  </ParamField>

  ### Response

  <ResponseField name="user" type="PrivyUser">
    The user object returned after successful login.
  </ResponseField>

  ### Usage

  ```tsx  theme={"system"}
  import { useLoginWithOAuth } from '@privy-io/expo';

  export function LoginButton() {
    const { login, state } = useLoginWithOAuth();

    return (
      <Button
        onPress={() => login({ provider: 'google' })}
        disabled={state.status === 'loading'}
      >
        {state.status === 'loading' ? 'Logging in...' : 'Login with Google'}
      </Button>
    );
  }
  ```

  ### Handling errors

  The promise returned by the `login` method will reject with an error if the OAuth flow fails.

  ```tsx  theme={"system"}
  import { useLoginWithOAuth } from '@privy-io/expo';

  export function LoginScreen() {
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useLoginWithOAuth();

    const onPress = async () => {
      try {
        setIsLoading(true);
        const user = await login({ provider: 'google' });
        console.log('Login successful', user.id);
      } catch (error) {
        console.error('Login failed', error);
      } finally {
        setIsLoading(false);
      }
    };

    return (
      <Button
        disabled={isLoading}
        onPress={onPress}
        title="Login with Google"
      />
    );
  }
  ```

  ## Tracking Flow State

  Track the state of the OAuth flow via the `state` variable returned by the `useLoginWithOAuth` hook.

  ```tsx  theme={"system"}
  state:
    | {status: 'initial'}
    | {status: 'loading'}
    | {status: 'done'}
    | {status: 'error'; error: Error | null};
  ```

  <ResponseField name="status" type="'initial' | 'loading' | 'done' | 'error'">
    The current state of the OAuth flow.
  </ResponseField>

  <ResponseField name="error" type="Error | null">
    The error that occurred during the OAuth flow (only present when status is 'error').
  </ResponseField>

  ### Usage: Conditional Rendering

  ```tsx  theme={"system"}
  import { View, Text, Button } from 'react-native';
  import { usePrivy, useLoginWithOAuth, hasError } from '@privy-io/expo';

  export function LoginScreen() {
    const { user } = usePrivy();
    const { state, login } = useLoginWithOAuth();

    return state.status === 'done' ? (
      <View>
        <Text>You logged in successfully</Text>
      </View>
    ) : (
      <View>
        <Button
          disabled={state.status === 'loading'}
          onPress={() => login({ provider: 'google' })}
          title={state.status === 'loading' ? 'Logging in...' : 'Login with Google'}
        />

        {hasError(state) && (
          <Text>Error: {state.error.message}</Text>
        )}
      </View>
    );
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
    The {platform_2} SDK supports OAuth login with {providers_2}. For all other OAuth providers, you can
    use [JWT-based authentication](/authentication/user-authentication/jwt-based-auth/overview).
  </Tip>

  ### Configure allowed URL schemes

  Prior to integrating OAuth login, make sure you have [properly configured your app's allowed URL schemes in the Privy dashboard](/basics/get-started/dashboard/app-clients#allowed-url-schemes).

  <Warning>Login with OAuth will **not** work if you have not completed this step.</Warning>

  ## Initializing the login flow

  <Tip>
    Privy supports native [Apple login](https://developer.apple.com/sign-in-with-apple/) when running
    on iOS. To configure native Apple login, follow this [guide](/recipes/swift/apple).
  </Tip>

  To launch the oAuth flow, simply call `privy.oAuth.login`. As parameters to this method, pass the following fields:

  <ParamField path="provider" type="OAuthProvider" required>
    A member of the `OAuthProvider` enum specifying which OAuth provider the user should login with. Currently, `.google`, `.apple`, `.discord`, and `.twitter` are supported.
  </ParamField>

  <ParamField path="appUrlScheme" type="String">
    (Optional). Your app's URL scheme as a string. If you do not pass this value, Privy will use the first valid app URL scheme from your app's `info.plist`.
  </ParamField>

  ### Returns

  <ResponseField name="PrivyUser" type="PrivyUser">
    The authenticated Privy user
  </ResponseField>

  ### Throws

  An error if logging the user in is unsuccessful.

  ### Usage

  ```swift  theme={"system"}
  do {
      let privyUser = try await privy.oAuth.login(with: OAuthProvider.google, appUrlScheme: "privyiosdemo")
  } catch {
      print("OAuth login error: \(error)")
  }
  ```

  That's it! If your user was successfully authenticated, the `login` method will return the new AuthSession.

  ### Handling errors

  An error could be thrown if:

  * Your app url scheme is not explicitly provided or set in your info.plist
  * Your app url scheme is not registered in the Privy dashboard.
  * There was an issue generating the OAuth provider login URL
  * The user declined or cancelled the login attempt, or there was another error during authentication

  If an error is thrown, you can get a description of the error as a `string` from the `error` thrown by `privy.oAuth.login`.

  ## Native Apple login

  To configure native apple login, follow this [guide](/recipes/swift/apple).
</View>

<View title="Android" icon="android">
  <Tip>
    The {platform_3} SDK supports OAuth login with {providers_3}. For all other OAuth providers, you can
    use [JWT-based authentication](/authentication/user-authentication/jwt-based-auth/overview).
  </Tip>

  ### Configure allowed URL schemes

  Prior to integrating OAuth login, make sure you have [properly configured your app's allowed URL schemes in the Privy dashboard](/basics/get-started/dashboard/app-clients#allowed-url-schemes).

  <Warning>Login with OAuth will **not** work if you have not completed this step.</Warning>

  ## Configure your Android Manifest

  Add the following activity to your `AndroidManifest.xml` file to handle OAuth redirects:

  ```xml  theme={"system"}
  <activity
      android:name="io.privy.sdk.oAuth.PrivyRedirectActivity"
      android:exported="true"
      android:launchMode="singleTask">
      <intent-filter android:autoVerify="true">
          <action android:name="android.intent.action.VIEW" />
          <category android:name="android.intent.category.DEFAULT" />
          <category android:name="android.intent.category.BROWSABLE" />
          <data android:scheme="YOUR_CUSTOM_PRIVY_OAUTH_SCHEME" />
      </intent-filter>
  </activity>
  ```

  **Replace `YOUR_CUSTOM_PRIVY_OAUTH_SCHEME` with your app's custom URL scheme.**

  <Warning>
    This scheme must be unique for this activity as it can cause issues if they clash with other activities or apps.
  </Warning>

  ## Initializing the login flow

  To launch the oAuth flow, simply call `privy.oAuth.login`. As parameters to this method, pass the following fields:

  <ParamField path="provider" type="OAuthProvider" required>
    A member of the `OAuthProvider` enum specifying which OAuth provider the user should login with. Currently, `Google`, `Discord`, and `Twitter` are supported.
  </ParamField>

  <ParamField path="appUrlScheme" type="String" required>
    Your app's URL scheme as a string. This must match the scheme configured in your AndroidManifest.xml.
  </ParamField>

  ### Returns

  <ResponseField name="PrivyUser" type="Result<PrivyUser>">
    A `Result` containing the authenticated `PrivyUser`. Returns `Result.success` with the PrivyUser if authentication was successful, or `Result.failure` if there was an error.
  </ResponseField>

  ### Usage

  ```kotlin  theme={"system"}
  val scheme = "privytestapp://"

  viewModelScope.launch {
      val result = privy.oAuth.login(OAuthProvider.Google, scheme)
      result
          .onSuccess { user ->
              // Handle successful authentication
              println("OAuth login successful: ${user.id}")
          }
          .onFailure { error ->
              // Handle authentication error
              println("OAuth login error: ${error.message}")
          }
  }
  ```

  That's it! If your user was successfully authenticated, the `login` method will return the authenticated `PrivyUser`.

  ### Handling errors

  The `login` method returns a `Result` that will contain a failure if:

  * Your app URL scheme is not provided in the method call
  * Your app URL scheme is not registered in the Privy dashboard
  * Your app URL scheme doesn't match the one configured in your AndroidManifest.xml
  * There was an issue generating the OAuth provider login URL
  * The user declined or cancelled the login attempt, or there was another error during authentication

  You can handle these errors using the `onFailure` method as shown in the usage example above.
</View>

<View title="Unity" icon="unity">
  ### Configure allowed URL schemes

  Prior to integrating OAuth login, make sure you have [properly configured your app's allowed URL schemes in the Privy dashboard](/basics/get-started/dashboard/app-clients#allowed-url-schemes).

  <Warning>Login with OAuth will **not** work if you have not completed this step.</Warning>

  ## Initializing the login flow

  To authenticate a user via an OAuth account (e.g. Google, Discord, Apple), use the Privy client's `OAuth` handler.

  This is a two step process, though Privy's Unity SDK wraps it into a single method call:

  1. Generate an OAuth login URL corresponding to your desired OAuth provider
  2. Redirect the user to the login URL to have them authenticate with the chosen OAuth provider

  ## Supported OAuth Providers

  Privy's Unity SDK currently supports OAuth login with Google, Apple, Twitter, and Discord.

  We're actively working to expand our support for other OAuth providers.
  Interested in a specific provider that isn't currently supported? Contact us at [sales@privy.io](mailto:sales@privy.io).

  ## Initializing the login flow

  To launch the OAuth flow, simply call `PrivyManager.Instance.OAuth.LoginWithProvider`. As parameters to this method, pass the following fields:

  <ParamField path="provider" type="OAuthProvider" required>
    A member of the `OAuthProvider` enum specifying which OAuth provider the user should login with.
  </ParamField>

  <ParamField path="redirectUri" type="String" required>
    For WebGL builds, this will be your redirect URL. For applications, this will be your app's URL scheme.
  </ParamField>

  ### Usage

  ```csharp  theme={"system"}
  try
  {
      // Log the user in with Google OAuth
      await PrivyManager.Instance.OAuth.LoginWithProvider(OAuthProvider.Google, "myappscheme");
  }
  catch
  {
      // Login with OAuth was unsuccessful
      Debug.Log("Error logging user in.");
  }
  ```

  That's it! If your user was successfully authenticated, the `LoginWithProvider` method will return the new `AuthState` for a user.

  This method will throw an error if:

  * a `redirectUri` is not provided
  * the network call to authenticate the user fails
</View>

<View title="Flutter" icon="flutter">
  <Tip>
    The {platform_4} SDK supports OAuth login with {providers_4}. For all other OAuth providers, you can
    use [JWT-based authentication](/authentication/user-authentication/jwt-based-auth/overview).
  </Tip>

  ### Configure allowed URL schemes

  Prior to integrating OAuth login, make sure you have [properly configured your app's allowed URL schemes in the Privy dashboard](/basics/get-started/dashboard/app-clients#allowed-url-schemes).

  <Warning>Login with OAuth will **not** work if you have not completed this step.</Warning>

  ## Platform Configuration

  Before implementing OAuth login, you need to configure your app for OAuth redirects on both Android and iOS.

  ### Android Configuration

  Add the following activity to your `android/app/src/main/AndroidManifest.xml` file to handle OAuth redirects:

  ```xml  theme={"system"}
  <activity
      android:name="io.privy.sdk.oAuth.PrivyRedirectActivity"
      android:exported="true"
      android:launchMode="singleTask"
      android:theme="@android:style/Theme.Translucent.NoTitleBar">
      <intent-filter>
          <action android:name="android.intent.action.VIEW" />
          <category android:name="android.intent.category.DEFAULT" />
          <category android:name="android.intent.category.BROWSABLE" />
          <data android:scheme="YOUR_CUSTOM_PRIVY_OAUTH_SCHEME" />
      </intent-filter>
  </activity>
  ```

  **Replace `YOUR_CUSTOM_PRIVY_OAUTH_SCHEME` with your app's custom URL scheme.**

  <Warning>
    This scheme must be unique for this activity as it can cause issues if they clash with other activities or apps.
  </Warning>

  ### iOS Configuration

  Add your custom URL scheme to your `ios/Runner/Info.plist` file:

  ```xml  theme={"system"}
  <key>CFBundleURLTypes</key>
  <array>
      <dict>
          <key>CFBundleURLName</key>
          <string>privy.oauth</string>
          <key>CFBundleURLSchemes</key>
          <array>
              <string>YOUR_CUSTOM_PRIVY_OAUTH_SCHEME</string>
          </array>
      </dict>
  </array>
  ```

  **Replace `YOUR_CUSTOM_PRIVY_OAUTH_SCHEME` with your app's custom URL scheme.**

  <Tip>
    Privy supports native [Apple login](https://developer.apple.com/sign-in-with-apple/) when running
    on iOS. Apple Sign In requires iOS 13.0+ and is only available on iOS devices. To configure native Apple login, follow this [guide](/basics/get-started/dashboard/configure-login-methods#oauth-login-methods-google-twitter-etc:apple).
  </Tip>

  ## Initializing the login flow

  Use the `login` method from your Privy instance's OAuth module to authenticate users using an OAuth provider.

  ```dart  theme={"system"}
  Future<Result<PrivyUser>> login({
    required OAuthProvider provider,
    required String appUrlScheme,
  })
  ```

  ### Parameters

  <ParamField path="provider" type="OAuthProvider" required>
    The OAuth provider to use for authentication. Valid values are: `OAuthProvider.google`, `OAuthProvider.apple` (iOS only), `OAuthProvider.twitter`,
    `OAuthProvider.discord`.
  </ParamField>

  <ParamField path="appUrlScheme" type="String" required>
    Your app's custom URL scheme for redirecting back to the app after OAuth authentication.
  </ParamField>

  ### Response

  <ResponseField name="Result<PrivyUser>" type="Result<PrivyUser>">
    A `Result` containing the authenticated `PrivyUser` on success, or a `Failure` with error details.
  </ResponseField>

  ### Usage

  ```dart  theme={"system"}
  final result = await privy.oAuth.login(
    provider: OAuthProvider.google,
    appUrlScheme: 'your-app-scheme',
  );

  result.fold(
    onSuccess: (user) {
      print('Login successful: ${user.id}');
    },
    onFailure: (error) {
      print('Login failed: $error');
    },
  );
  ```

  ## Handling errors

  An error could be thrown if:

  * Your app URL scheme is not provided in the method call
  * Your app URL scheme is not registered in the Privy dashboard
  * There was an issue generating the OAuth provider login URL
  * The user declined or cancelled the login attempt, or there was another error during authentication
  * Apple Sign In is attempted on Android (Apple Sign In is only supported on iOS)

  You can handle these errors using the `Result.fold()` method as shown in the usage example above.

  ## Resources

  <Columns cols={3}>
    <Card title="Flutter starter repo" href="https://github.com/privy-io/examples/tree/main/privy-flutter-starter" icon="github" arrow="true">
      Get started with Flutter and Privy.
    </Card>
  </Columns>
</View>
\n