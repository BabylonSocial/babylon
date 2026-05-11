> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Telegram

Telegram is an end to end encrypted messaging platform with in-application experiences.

Privy enables your application to easily integrate Login with Telegram in multiple ways. From a regular web environment, users can authenticate to your application with their Telegram account.

<Tip>
  Enable Telegram authentication in the [Privy
  Dashboard](https://dashboard.privy.io/apps?page=login-methods\&logins=socials) before implementing
  this feature.
</Tip>

<Warning>
  Telegram does not support `.xyz` domains for authentication. If your application uses a `.xyz`
  domain, Telegram will not send authentication messages during the login flow. To work around this
  limitation, you must use a different top-level domain (TLD) for your application, or set up a
  separate domain with a different TLD specifically for handling Telegram authentication.
</Warning>

<Tip>
  Privy also enables seamless login within Telegram, so users can zero-click authenticate to your
  Telegram bot or mini-app. Check out our recipe for setting up [seamless login with
  Telegram](/recipes/react/seamless-telegram).
</Tip>

<View title="React" icon="react">
  <Info>
    To authenticate your users with Privy's out of the box UIs, check out UI components [here](/authentication/user-authentication/ui-component).
  </Info>

  To authenticate your users with Telegram, use the `useLoginWithTelegram` hook.

  ```tsx  theme={"system"}
  login: () => Promise<void>
  ```

  ## Usage

  ```tsx  theme={"system"}
  import {useLoginWithTelegram} from '@privy-io/react-auth';

  export default function LoginWithTelegram() {
    const {login, state} = useLoginWithTelegram();

    const handleLogin = async () => {
      try {
        // Telegram's authentication pop-up will emerge, the user can then follow the steps to link its account.
        // If the login is successful, the user will be authenticated and the authentication information will be returned as a result
        const authenticationInfo = await login();
      } catch (err) {
        // Handle errors due to network availability, captcha failure, or input validation here
      }
    };

    return <button onClick={handleLogin}>Log in with Telegram</button>;
  }
  ```

  <Tip>
    Before using the `useLoginWithTelegram` hook, ensure that Telegram is enabled in **Socials** tab of the **Login Methods** page on the the Privy [dashboard](https://dashboard.privy.io/apps?page=login-methods\&logins=socials)
  </Tip>

  ## Tracking Flow State

  Track the state of the Telegram authentication flow via the `state` variable returned by the
  `useLoginWithTelegram` hook.

  ```ts  theme={"system"}
  type TelegramAuthFlowState =
    | {status: 'initial'}
    | {status: 'loading'}
    | {status: 'done'}
    | {status: 'error'; error: Error | null};
  ```

  <ResponseField name="status" type="'initial' | 'loading' | 'done' | 'error'">
    The current state of the Telegram authentication flow.
  </ResponseField>

  <ResponseField name="error" type="Error | null">
    The error that occurred during the Telegram authentication flow.
  </ResponseField>

  ## Callbacks

  You can optionally pass callbacks into the `useLoginWithTelegram` hook to run custom logic after a successful login or to handle errors that occur during the flow.

  ### `onComplete`

  ```tsx  theme={"system"}
  onComplete?: ((params: {
      user: User;
      isNewUser: boolean;
      wasAlreadyAuthenticated: boolean;
      loginMethod: LoginMethod | null;
      loginAccount: LinkedAccountWithMetadata | null;
  }) => void) | undefined
  ```

  #### Parameters

  <ParamField path="user" type="User">
    The user object corresponding to the authenticated user.
  </ParamField>

  <ParamField path="isNewUser" type="boolean">
    Whether the user is a new user or an existing user.
  </ParamField>

  <ParamField path="wasAlreadyAuthenticated" type="boolean">
    Whether the user entered the application already authenticated.
  </ParamField>

  <ParamField path="loginMethod" type="LoginMethod | null">
    The method used by the user to login.
  </ParamField>

  <ParamField path="loginAccount" type="LinkedAccountWithMetadata | null">
    The account corresponding to the loginMethod used.
  </ParamField>

  ### `onError`

  ```tsx  theme={"system"}
  onError: (error: Error) => void
  ```

  #### Parameters

  <ParamField path="error" type="Error">
    The error that occurred during the login flow.
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
\n