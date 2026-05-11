> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Farcaster

[**Farcaster**](https://www.farcaster.xyz/) is a sufficiently decentralized social network whose core social graph is stored onchain.
Privy enables your users to log in to your application using their Farcaster account. Privy uses a standard called **Sign in with Farcaster** ([FIP-11](https://github.com/farcasterxyz/protocol/discussions/110))
to issue a signature request to a user's Farcaster account via the client a user has.

<Tip>
  Enable Farcaster authentication in the [Privy
  Dashboard](https://dashboard.privy.io/apps?page=login-methods\&logins=socials) before implementing
  this feature.
</Tip>

Your application can even request permissions from the user to become a signer for their Farcaster account, allowing your application to engage with the Farcaster social graph on their behalf.

<Tip>
  Interested in building a Farcaster Mini App? Check out our [Farcaster Mini App
  recipe](/recipes/farcaster/mini-apps)!
</Tip>

<View title="React" icon="react">
  <Info>
    Privy currently only supports Farcaster login in React via the Privy UIs. To enable Farcaster login, you need to configure the Privy SDK with the `farcaster` login method. Explore our UI components [here](/authentication/user-authentication/ui-component).
  </Info>

  ```tsx  theme={"system"}
  <PrivyProvider
    appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID}
    config={{
      // This configures farcaster and other login methods for your app.
      appearance: {
          loginMethods: ['farcaster', ...otherLoginMethods]
      },
      ...otherConfig
    }}
  >
  ```

  From there, you can prompt your users to authenticate via the `login` method:

  ```tsx  theme={"system"}
  import { usePrivy } from '@privy-io/react';
  ...
  const { login } = usePrivy();
  login();
  ```

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
  To authenticate a user via Farcaster ([SIWF](https://github.com/farcasterxyz/protocol/discussions/110)), use the `loginWithFarcaster` method
  from the `useLoginWithFarcaster` hook.

  <Info>
    To authenticate your users with Privy's out of the box UIs, check out UI components [here](/authentication/user-authentication/ui-component#react-native).
  </Info>

  ```javascript  theme={"system"}
  loginWithFarcaster(input: {
    relyingParty: string;
    redirectUrl?: string;
    disableSignup?: boolean;
  }, config?: {
    pollIntervalMs?: number;
    pollAttempts?: number;
  }): Promise<PrivyUser | null>;
  ```

  ### Initializing the login flow

  To initialize login, use the `loginWithFarcaster` function from the `useLoginWithFarcaster` hook to start the Farcaster login flow.

  ```tsx  theme={"system"}
  import { useLoginWithFarcaster } from '@privy-io/expo';

  const { loginWithFarcaster, state } = useLoginWithFarcaster();
  ```

  As a parameter to `loginWithFarcaster`, you should pass an object containing:

  <ParamField path="input.relyingParty" type="string" required>
    Your app's website. Described in SIWF spec as "Origin domain of app frontend."
  </ParamField>

  <ParamField path="input.redirectUrl" type="string">
    A URL path that Farcaster will automatically redirect to after successful authentication. This defaults to a link back to your app root, eg. `'/'`, if not provided.
  </ParamField>

  <ParamField path="input.disableSignup" type="boolean">
    If true, the flow will only allow existing users to log in, preventing new account creation.
  </ParamField>

  <ParamField path="options.pollIntervalMs" type="number">
    The interval in milliseconds which your app will poll a status endpoint to check if the user has successfully signed in using Farcaster.
  </ParamField>

  <ParamField path="options.pollAttempts" type="number">
    The number of polling attempts that will be made to check for successful login.
  </ParamField>

  <Warning>
    If you pass in custom polling configuration, make sure to give the user enough time to go through the login process on Farcaster. The default values are `pollIntervalMs = 1000` and `pollAttempts = 10` giving the user 10 seconds to go through the login process. In our testing, this is usually enough time, but you may want to make it longer.
  </Warning>

  When this method is invoked, the user will be deeplinked to the Farcaster app on their device if they have it installed, or an installation page for the app. Within the Farcaster app, they can complete the login flow.

  If `loginWithFarcaster` succeeds, it will return a `PrivyUser` object with details about the authenticated user.

  Reasons `loginWithFarcaster` might fail include:

  * the network request fails
  * the login attempt is made after the user is already logged in
  * the user cancels the login flow after being linked out to Farcaster
  * the user takes too long to login and the polling time expires

  ### Tracking Flow State

  Track the state of the Farcaster flow via the `state` variable returned by the `useLoginWithFarcaster` hook.

  ```tsx  theme={"system"}
  state:
    | {status: 'initial'}
    | {status: 'error'; error: Error | null}
    | {status: 'generating-uri'}
    | {status: 'awaiting-uri'}
    | {status: 'polling-status'}
    | {status: 'submitting-token'}
    | {status: 'done'};
  ```

  <ResponseField name="status" type="'initial' | 'error' | 'generating-uri' | 'awaiting-uri' | 'polling-status' | 'submitting-token' | 'done'">
    The current state of the Farcaster flow.
  </ResponseField>

  <ResponseField name="error" type="Error | null">
    The error that occurred during the Farcaster flow (only present when status is 'error').
  </ResponseField>

  ### Usage: Conditional Rendering

  ```tsx  theme={"system"}
  import { View, ActivityIndicator, Text } from 'react-native';
  import { useLoginWithFarcaster, hasError } from '@privy-io/expo';

  export function LoginScreen() {
    const { state, loginWithFarcaster } = useLoginWithFarcaster();

    return (
      <View>
        <Button
          onPress={() => loginWithFarcaster({ relyingParty: 'https://example.app' })}
          title="Login with Farcaster"
          disabled={state.status !== 'initial' && state.status !== 'error'}
        />

        {state.status === 'polling-status' && (
          <View>
            <ActivityIndicator />
            <Text>Waiting for Farcaster confirmation...</Text>
          </View>
        )}

        {hasError(state) && (
          <Text style={{ color: 'red' }}>
            Error: {state.error.message}
          </Text>
        )}
      </View>
    );
  }
  ```

  ### Callbacks

  You can optionally pass callbacks to the `useLoginWithFarcaster` hook to run custom logic after a successful login or to handle errors.

  #### `onSuccess`

  ```tsx  theme={"system"}
  onSuccess: (user: PrivyUser, isNewUser: boolean) => Promise<void>
  ```

  ##### Parameters

  <ParamField path="user" type="PrivyUser">
    The user object returned after successful login.
  </ParamField>

  <ParamField path="isNewUser" type="boolean">
    Whether the user is a new user or an existing user.
  </ParamField>

  #### `onError`

  ```tsx  theme={"system"}
  onError: (error: Error) => Promise<void>
  ```

  ##### Parameters

  <ParamField path="error" type="Error">
    The error that occurred during the Farcaster flow.
  </ParamField>

  #### Usage with Callbacks

  ```tsx  theme={"system"}
  import { useLoginWithFarcaster } from '@privy-io/expo';

  export function LoginScreen() {
    const { loginWithFarcaster } = useLoginWithFarcaster({
      onSuccess(user, isNewUser) {
        console.log('Login successful', { user, isNewUser });
        // Navigate to home screen, show welcome message, etc.
      },
      onError(error) {
        console.error('Login failed', error);
        // Show error toast, update UI, etc.
      }
    });

    return (
      <Button
        onPress={() => loginWithFarcaster({ relyingParty: 'https://example.app' })}
        title="Login with Farcaster"
      />
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
\n