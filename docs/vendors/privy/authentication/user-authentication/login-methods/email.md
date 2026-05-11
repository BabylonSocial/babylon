> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Email

Privy enables users to login to your application with SMS or email. With Privy, your application can verify ownership of a user's email address or phone number to send them notifications, campaigns, and more to keep them activated.

<Tip>
  Enable email authentication in the [Privy
  Dashboard](https://dashboard.privy.io/apps?page=login-methods) before implementing this feature.
</Tip>

<Info>
  Privy uses [`mailchecker`](https://github.com/FGRibreau/mailchecker/) to detect temporary email
  domains. To block them automatically, turn the setting on in the [Privy
  Dashboard](https://dashboard.privy.io/apps?page=login-methods).
</Info>

<View title="React" icon="react">
  To authenticate your users with a one-time passcode (OTP) sent to their email address, use the `useLoginWithEmail` hook.

  <Info>
    To authenticate your users with Privy's out of the box UIs, check out UI components [here](/authentication/user-authentication/ui-component).
  </Info>

  ## Send Code

  ```tsx  theme={"system"}
  sendCode: ({email: string, disableSignup?: boolean}) => Promise<void>
  ```

  ### Parameters

  <ParamField path="email" type="string" required>
    The email address of the user to log in.
  </ParamField>

  <ParamField path="disableSignup" type="boolean">
    Whether to disable the ability to sign up with the email address.
  </ParamField>

  ### Returns

  <ResponseField name="void" type="Promise<void>">
    A promise that resolves when the code is sent.
  </ResponseField>

  ## Login with Code

  ```tsx  theme={"system"}
  loginWithCode: ({ code: string }) => Promise<void>;
  ```

  ### Parameters

  <ParamField path="code" type="string" required>
    The one-time passcode sent to the user's email address.
  </ParamField>

  ### Returns

  <ResponseField name="void" type="Promise<void>">
    A promise that resolves when the user is logged in.
  </ResponseField>

  ## Usage

  ```tsx  theme={"system"}
  import { useState } from "react";
  import { useLoginWithEmail } from "@privy-io/react-auth";

  export default function LoginWithEmail() {
    const [email, setEmail] = useState("");
    const [code, setCode] = useState("");
    const { sendCode, loginWithCode } = useLoginWithEmail();

    return (
        <div>
            <input onChange={(e) => setEmail(e.currentTarget.value)} value={email} />
            <button onClick={() => sendCode({ email })}>Send Code</button>
            <input onChange={(e) => setCode(e.currentTarget.value)} value={code} />
            <button onClick={() => loginWithCode({ code })}>Login</button>
        </div>
    );
  }
  ```

  ## Tracking Flow State

  Track the state of the OTP flow via the `state` variable returned by the
  `useLoginWithEmail` hook.

  ```ts  theme={"system"}
  type OtpFlowState =
    | {status: 'initial'}
    | {status: 'error'; error: Error | null}
    | {status: 'sending-code'}
    | {status: 'awaiting-code-input'}
    | {status: 'submitting-code'}
    | {status: 'done'};
  ```

  <ResponseField name="status" type="'initial' | 'error' | 'sending-code' | 'awaiting-code-input' | 'submitting-code' | 'done'">
    The current state of the OTP flow.
  </ResponseField>

  <ResponseField name="error" type="Error | null">
    The error that occurred during the OTP flow.
  </ResponseField>

  ## Callbacks

  You can optionally pass callbacks into the `useLoginWithEmail` hook to run custom logic after a successful login or to handle errors that occur during the flow.

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

<View title="React Native" icon="react">
  To authenticate your users with a one-time passcode (OTP) sent to their email address, use the `useLoginWithEmail` hook.

  <Info>
    To authenticate your users with Privy's out of the box UIs, check out UI components [here](/authentication/user-authentication/ui-component#react-native).
  </Info>

  ## Send Code

  ```jsx  theme={"system"}
  sendCode: ({email: string}) => Promise<{success: boolean}>
  ```

  ### Parameters

  <ParamField path="email" type="string" required>
    The email address of the user to log in.
  </ParamField>

  ### Returns

  <ResponseField name="success" type="boolean">
    A promise that resolves to an object with a success property indicating if the code was sent successfully.
  </ResponseField>

  ## Login with Code

  ```jsx  theme={"system"}
  loginWithCode: ({ code: string, email?: string, disableSignup?: boolean }) => Promise<{user: PrivyUser; isNewUser: boolean}>
  ```

  ### Parameters

  <ParamField path="code" type="string" required>
    The one-time passcode sent to the user's email address.
  </ParamField>

  <ParamField path="email" type="string">
    The user's email address. Though this parameter is optional, it is highly recommended that you pass the user's email address explicitly.
  </ParamField>

  <ParamField path="disableSignup" type="boolean">
    Whether to disable the ability to sign up with the email address.
  </ParamField>

  ### Returns

  <ResponseField name="user" type="PrivyUser">
    The user object returned by the login process.
  </ResponseField>

  ## Usage

  ```jsx  theme={"system"}
  import { useState } from 'react';
  import { useLoginWithEmail } from '@privy-io/expo';

  export default function LoginWithEmail() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const { sendCode, loginWithCode } = useLoginWithEmail();

  return (
      <View>
      <TextInput value={email} onChangeText={setEmail} placeholder="Email" />
      <Button onPress={() => sendCode({ email })}>Send Code</Button>
      <TextInput value={code} onChangeText={setCode} placeholder="Code" />
      <Button onPress={() => loginWithCode({ code, email })}>Login</Button>
      </View>
  );
  }
  ```

  ## Tracking login flow state

  The state variable returned from useLoginWithEmail will always be one of the following values.

  ```ts  theme={"system"}
  type OtpFlowState =
  | {status: 'initial'}
  | {status: 'error'; error: Error | null}
  | {status: 'sending-code'}
  | {status: 'awaiting-code-input'}
  | {status: 'submitting-code'}
  | {status: 'done'};
  ```

  <ResponseField name="status" type="'initial' | 'error' | 'sending-code' | 'awaiting-code-input' | 'submitting-code' | 'done'">
    The current state of the email login flow.
  </ResponseField>

  <ResponseField name="error" type="Error | null">
    The error that occurred during the email login flow.
  </ResponseField>

  ## Callbacks

  You can optionally pass callbacks into the `useLoginWithEmail` hook to run custom logic after an OTP has been sent, after a successful login, or to handle errors that occur during the flow.

  ### `onSendCodeSuccess`

  ```tsx  theme={"system"}
  onSendCodeSuccess?: ((email: string) => void) | undefined
  ```

  #### Parameters

  <ParamField path="email" type="string">
    The email the code was sent to.
  </ParamField>

  ### `onLoginSuccess`

  ```tsx  theme={"system"}
  onLoginSuccess?: ((user: User, isNewUser: boolean) => void) | undefined
  ```

  #### Parameters

  <ParamField path="user" type="User">
    The PrivyUser returned by loginWithCode.
  </ParamField>

  <ParamField path="isNewUser" type="boolean">
    Whether the user is a new user or an existing user.
  </ParamField>

  ### `onError`

  ```tsx  theme={"system"}
  onError?: (error: Error) => void
  ```

  #### Parameters

  <ParamField path="error" type="Error">
    The error that occurred during the login flow.
  </ParamField>

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
  To authenticate a user via their email address, use the Privy client's `email` handler.

  ## Send Code

  ```swift  theme={"system"}
  sendCode(to email: String) async throws
  ```

  ### Parameters

  <ParamField path="to" type="String" required>
    The email address of the user to log in.
  </ParamField>

  ### Returns

  <ResponseField>
    Nothing, indicating success.
  </ResponseField>

  ### Throws

  An error if sending the code fails.

  ## Login with Code

  ```swift  theme={"system"}
  loginWithCode(_ code: String, sentTo email: String) async throws -> PrivyUser
  ```

  ### Parameters

  <ParamField path="code" type="String" required>
    The one-time passcode sent to the user's email address.
  </ParamField>

  <ParamField path="sentTo" type="String" required>
    The user's email address.
  </ParamField>

  ### Returns

  <ResponseField name="PrivyUser" type="PrivyUser">
    The authenticated Privy user
  </ResponseField>

  ### Throws

  An error if logging the user in is unsuccessful.

  ## Usage

  ```swift  theme={"system"}
  // Send code to user's email
  do {
      try await privy.email.sendCode(to: "myuser@privy.io")
      // successfully sent code to users email
  } catch {
      print("error sending code to \(email): \(error)")
  }

  // Log the user in
  do {
      let user = try await privy.email.loginWithCode("123456", sentTo: "myuser@privy.io")
      // user successfully logged in
  } catch {
      print("error logging user in: \(error)")
  }
  ```
</View>

<View title="Android" icon="android">
  To authenticate a user via their email address, use the Privy client's `email` handler.

  ## Send Code

  ```kotlin  theme={"system"}
  sendCode(email: String): Result<Unit>
  ```

  ### Parameters

  <ParamField path="email" type="String" required>
    The email address of the user to log in.
  </ParamField>

  ### Returns

  <ResponseField name="Result<Unit>" type="Result<Unit>">
    A Result object that indicates whether the operation was successful. Returns Result.success if the code was sent successfully, or Result.failure if there was an error.
  </ResponseField>

  ## Login with Code

  ```kotlin  theme={"system"}
  loginWithCode(code: String, email: String?): Result<PrivyUser>
  ```

  ### Parameters

  <ParamField path="code" type="String" required>
    The one-time passcode sent to the user's email address.
  </ParamField>

  <ParamField path="email" type="String">
    (Optional) The user's email address. Though this parameter is optional, it is highly recommended that you pass the user's email address explicitly. If email is omitted, the email from sendCode will be used.
  </ParamField>

  ### Returns

  <ResponseField name="Result<PrivyUser>" type="Result<PrivyUser>">
    A Result object containing the PrivyUser if successful, or an error if the operation failed.
  </ResponseField>

  ## Usage

  ```kotlin  theme={"system"}
  // Send code to user's email
  val result: Result<Unit> = privy.email.sendCode(email = "user_email@gmail.com")

  result.fold(
    onSuccess = {
      // OTP was successfully sent
    },
    onFailure = {
      println("Error sending OTP: ${it.message}")
    }
  )

  // Authenticate with the OTP code
  val result: Result<PrivyUser> = privy.email.loginWithCode(code = "123456", email = "user_email@gmail.com")

  result.fold(
    onSuccess = { user ->
      // User logged in
    },
    onFailure = {
      println("Error logging in user: ${it.message}")
    }
  )
  ```
</View>

<View title="Unity" icon="unity">
  To authenticate a user via their email address, use the Privy client's `Email` handler.

  ## Send Code

  ```csharp  theme={"system"}
  SendCode(string email): Task<bool>
  ```

  ### Parameters

  <ParamField path="email" type="string" required>
    The email address of the user to log in.
  </ParamField>

  ### Returns

  <ResponseField name="Task<bool>" type="Task<bool>">
    A Task that resolves to a boolean indicating whether the code was sent successfully.
  </ResponseField>

  ## Login with Code

  ```csharp  theme={"system"}
  LoginWithCode(string email, string code): Task
  ```

  ### Parameters

  <ParamField path="email" type="string" required>
    The user's email address.
  </ParamField>

  <ParamField path="code" type="string" required>
    The one-time passcode sent to the user's email address.
  </ParamField>

  ### Returns

  <ResponseField name="Task" type="Task">
    A Task that completes when the user is successfully authenticated, or throws an exception if authentication fails.
  </ResponseField>

  ## Usage

  ```csharp  theme={"system"}
  // Send code to user's email
  bool success = await PrivyManager.Instance.Email.SendCode(email);

  if (success)
  {
      // Prompt user to enter the OTP they received at their email address through your UI
  }
  else
  {
      // There was an error sending an OTP to your user's email
  }

  // Authenticate with the OTP code
  try
  {
      // User will be authenticated if this call is successful
      await PrivyManager.Instance.Email.LoginWithCode(email, code);
      // User is now logged in
  }
  catch
  {
      // If "LoginWithCode" throws an exception, user login was unsuccessful.
      Debug.Log("Error logging user in.");
  }
  ```
</View>

<View title="Flutter" icon="flutter">
  To authenticate a user via their email address, use the Privy client's `email` handler.

  ## Send Code

  ```dart  theme={"system"}
  sendCode(String email): Future<Result<void>>
  ```

  ### Parameters

  <ParamField path="email" type="String" required>
    The email address of the user to log in.
  </ParamField>

  ### Returns

  <ResponseField name="Result<void>" type="Future<Result<void>>">
    A Result object that indicates whether the operation was successful. Returns Result.success if the code was sent successfully, or Result.failure if there was an error.
  </ResponseField>

  ## Login with Code

  ```dart  theme={"system"}
  loginWithCode({required String code, String? email}): Future<Result<PrivyUser>>
  ```

  ### Parameters

  <ParamField path="code" type="String" required>
    The one-time passcode sent to the user's email address.
  </ParamField>

  <ParamField path="email" type="String">
    (Optional) The user's email address. Though this parameter is optional, it is highly recommended that you pass the user's email address explicitly. If email is omitted, the email from sendCode will be used.
  </ParamField>

  ### Returns

  <ResponseField name="Result<PrivyUser>" type="Future<Result<PrivyUser>>">
    A Result object containing the PrivyUser if successful, or an error if the operation failed.
  </ResponseField>

  ## Usage

  ```dart  theme={"system"}
  // Send code to user's email
  final Result<void> result = await privy.email.sendCode(email);

  result.fold(
    onSuccess: (_) {
      // OTP was sent successfully
    },
    onFailure: (error) {
      // Handle error sending OTP
      print(error.message);
    },
  );

  // Authenticate with the OTP code
  final Result<PrivyUser> result = await privy.email.loginWithCode(
    code: code,
    email: email,
  );

  result.fold(
    onSuccess: (user) {
      // User authenticated successfully
    },
    onFailure: (error) {
      // Handle authentication error
    },
  );
  ```

  ## Resources

  <Columns cols={3}>
    <Card title="Flutter starter repo" href="https://github.com/privy-io/examples/tree/main/privy-flutter-starter" icon="github" arrow="true">
      Get started with Flutter and Privy.
    </Card>
  </Columns>
</View>
\n