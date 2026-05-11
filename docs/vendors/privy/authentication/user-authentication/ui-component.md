> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# UI components

Privy supports easy onboarding with an out-of-the-box user interface to log users in.

The fastest way to integrate Privy is with the Privy login modal. Your application can integrate this modal in just a few lines of code and easily toggle on login methods for your application in the Privy dashboard.

You can also design your own login UIs, and integrate with Privy's authentication APIs to offer a login experience that feels seamless within your application.

<img src="https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/Onboard.png?fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=73a585da38b0eae634f6446982028b74" alt="images/Onboard.png" data-og-width="1843" width="1843" data-og-height="1317" height="1317" data-path="images/Onboard.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/Onboard.png?w=280&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=a0181bc0854c3c81409ca325f82ae997 280w, https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/Onboard.png?w=560&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=d21a8d48921fbd16ee8bab7ab5fbc905 560w, https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/Onboard.png?w=840&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=8162f91ae65032eb2584b4127ac9afb4 840w, https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/Onboard.png?w=1100&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=952ae4c1d5ecb7dec7f6b88a35c9c4af 1100w, https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/Onboard.png?w=1650&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=66c54a8e3f6aadd2241f0ed5a0f3d7b8 1650w, https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/Onboard.png?w=2500&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=559b2d8255c227df7ad73f02e5ed4e35 2500w" />

<Info>
  [Configure your login methods](/basics/get-started/dashboard/configure-login-methods) in the Privy
  Dashboard before using the UI components.
</Info>

<View title="React" icon="react">
  <Tip>
    Privy's UIs are highly-customizable to seamlessly match the branding and design system of your
    app. Learn more about [customizing the login modal](/basics/react/advanced/configuring-appearance).
  </Tip>

  To have users login to your app with Privy's UIs, use the `login` method from the `useLogin` hook.

  ```tsx  theme={"system"}
  login: ({ loginMethods: PrivyClientConfig['loginMethods'], prefill?: { type: 'email' | 'phone', value: string }, disableSignup?: boolean, walletChainType?: 'ethereum-only' | 'solana-only' | 'ethereum-or-solana' }) => PrivyUser;
  ```

  ### Usage

  ```tsx  theme={"system"}
  import { useLogin, usePrivy } from '@privy-io/react-auth';

  function LoginButton() {
      const { ready, authenticated} = usePrivy();
      const { login } = useLogin();
      // Disable login when Privy is not ready or the user is already authenticated
      const disableLogin = !ready || (ready && authenticated);

      return (
          <button disabled={disableLogin} onClick={login}>
              Log in
          </button>
      );
  }
  ```

  ### Parameters

  <ParamField path="loginMethods" type="PrivyClientConfig['loginMethods']">
    Optionally specify which login methods to display in the modal.

    <Expandable title="Login Methods">
      The following login methods are supported:

      <ul>
        <ParamField path="wallet" type="string" />

        <ParamField path="email" type="string" />

        <ParamField path="sms" type="string" />

        <ParamField path="google" type="string" />

        <ParamField path="twitter" type="string" />

        <ParamField path="discord" type="string" />

        <ParamField path="github" type="string" />

        <ParamField path="linkedin" type="string" />

        <ParamField path="spotify" type="string" />

        <ParamField path="instagram" type="string" />

        <ParamField path="tiktok" type="string" />

        <ParamField path="apple" type="string" />

        <ParamField path="farcaster" type="string" />

        <ParamField path="telegram" type="string" />

        <ParamField path="line" type="string" />

        <ParamField path="passkey" type="string" />
      </ul>
    </Expandable>
  </ParamField>

  <ParamField path="prefill" type="{ type: 'email' | 'phone', value: string }">
    Optionally pre-fill the login modal with the user's email or phone number.
  </ParamField>

  <ParamField path="disableSignup" type="boolean">
    Prevent users from signing up for your app. This is useful when you want to enforce that users can only log in with existing accounts.
  </ParamField>

  <ParamField path="walletChainType" type="'ethereum-only' | 'solana-only' | 'ethereum-or-solana'">
    Filter the login wallet options to only show wallets that support the specified chain type.
  </ParamField>

  ### Callbacks

  You can easily attach callbacks to the `login` method using the `useLogin` hook. This allows you to run custom logic when a user successfully logs in or when there's an error.

  ```tsx  theme={"system"}
  import { useLogin } from '@privy-io/react-auth';

  function LoginButton() {
      const { login } = useLogin({
          onComplete: ({ user, isNewUser, wasAlreadyAuthenticated, loginMethod, loginAccount }) => {
              console.log('User logged in successfully', user);
              console.log('Is new user:', isNewUser);
              console.log('Was already authenticated:', wasAlreadyAuthenticated);
              console.log('Login method:', loginMethod);
              console.log('Login account:', loginAccount);
              // Navigate to dashboard, show welcome message, etc.
          },
          onError: (error) => {
              console.error('Login failed', error);
              // Show error message
          }
      });

      return <button onClick={login}>Log in</button>;
  }
  ```

  <ParamField path="onComplete" type="({ user, isNewUser, wasAlreadyAuthenticated, loginMethod, linkedAccount }) => void">
    Callback that executes when a user completes authentication. If the user is already authenticated when the component mounts, this callback executes immediately. Otherwise, it executes after successful login.

    <Expandable title="Callback Parameters">
      <ParamField path="user" type="PrivyUser">The user object with DID, linked accounts, and more.</ParamField>
      <ParamField path="isNewUser" type="boolean">Whether this is the user's first login or a returning user.</ParamField>
      <ParamField path="wasAlreadyAuthenticated" type="boolean">Whether the user was already authenticated when the component mounted.</ParamField>
      <ParamField path="loginMethod" type="string | null">The authentication method used ('email', 'sms', 'siwe', 'apple', 'discord', 'github', 'google', 'linkedin', 'spotify', 'tiktok', 'twitter', 'farcaster', 'passkey', 'telegram', 'line') or null if already authenticated.</ParamField>
      <ParamField path="loginAccount" type="object">The account used for authentication with type ('wallet', 'email', 'phone', 'google\_oauth', 'twitter\_oauth', 'discord\_oauth', 'github\_oauth', 'spotify\_oauth', 'instagram\_oauth', 'tiktok\_oauth', 'linkedin\_oauth', 'apple\_oauth', 'line\_oauth', 'custom\_auth', 'farcaster', 'passkey').</ParamField>
    </Expandable>
  </ParamField>

  <ParamField path="onError" type="(error) => void">
    Callback that executes when there's an error during login or when the user exits the login flow.
  </ParamField>
</View>

<View title="React Native" icon="react">
  <Tip>
    Make sure you have [properly configured PrivyElements](/basics/react-native/advanced/setup-privyelements) before using UI components for authentication.
  </Tip>

  <Warning>
    **OAuth providers require URL scheme configuration**: If you plan to use social login methods (`google`, `apple`, `discord`, etc.) or integrate with global wallets, you **must** configure your app's URL scheme in the [App Client settings](/basics/get-started/dashboard/app-clients#allowed-url-schemes). Without this configuration, OAuth login will fail silently with "Authentication failed" errors.
  </Warning>

  <Info>
    Privy's UIs are highly-customizable to seamlessly match the branding and design system of your app. Learn more about [customizing the login modal](/basics/react-native/advanced/configuring-appearance).
  </Info>

  To have users login to your app with Privy's UIs, use the `login` method from the `useLogin` hook.

  ```javascript  theme={"system"}
  login: ({ loginMethods: LoginMethod[], appearance?: { logo?: string } }) => void;
  ```

  ### Usage

  ```tsx  theme={"system"}
  import { useLogin } from '@privy-io/expo/ui';

  function LoginButton() {
      const { login } = useLogin();

      return (
          <Button
              onPress={() => {
                  login({ loginMethods: ['email', 'sms']})
                      .then((session) => {
                          console.log('User logged in', session.user);
                      })
              }}
              title="Log in"
          />
      );
  }
  ```

  ### Parameters

  <ParamField path="loginMethods" type="LoginMethod[]">
    An array of login methods for your users to choose from. The supported methods are `'email'`, `'sms'`, `'google'`, `'discord'`, `'twitter'`, `'github'`, `'spotify'`, `'instagram'`, `'tiktok'`, `'linkedin'`, and `'apple'`.
  </ParamField>

  <ParamField path="appearance.logo" type="string">
    (Optional) a url for the logo shown in the Login Method selection step. Aspect ratio should be 2:1.
  </ParamField>

  ### Returns

  <ResponseField name="user" type="PrivyUser">
    The user that logged in, with all of their properties.
  </ResponseField>
</View>
\n