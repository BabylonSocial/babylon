> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# SMS and WhatsApp

Privy enables users to login with SMS or WhatsApp. Configure your app following this guide and make sure to read our recipe on [enabling SMS or WhatsApp](/recipes/dashboard/login-methods/sms).

<Note>
  Developers can enable **either** SMS or WhatsApp, but cannot utilize both. Once your account is
  enabled for SMS with your chosen provider, it **cannot** be switched.
</Note>

<View title="React" icon="react">
  ## Configuring your application

  Through your app's Privy configuration, you can set the default country code for phone numbers. This is useful if your application primarily serves users from a specific country. The default country can be set in your PrivyProvider, like so:

  ```tsx {5} theme={"system"}
  <PrivyProvider
    appId="your-privy-app-id"
    config={{
      intl: {
        defaultCountry: "US",
      },
      ...insertTheRestOfYourPrivyProviderConfig
    }}
  >
    {children}
  </PrivyProvider>
  ```

  To authenticate your users with a one-time passcode (OTP) sent to their phone number via either SMS or WhatsApp, use the `useLoginWithSms` hook.

  <Info>
    To authenticate your users with Privy's out of the box UIs, check out UI components [here](/authentication/user-authentication/ui-component).
  </Info>

  ## Send Code

  ```tsx  theme={"system"}
  sendCode: ({phoneNumber: string, disableSignup?: boolean}) => Promise<void>
  ```

  ### Parameters

  <ParamField path="phoneNumber" type="string" required>
    The phone number of the user to log in. Must follow specific formatting conventions (see below).
  </ParamField>

  <ParamField path="disableSignup" type="boolean">
    Whether to disable the ability to sign up with the phone number.
  </ParamField>

  ### Returns

  <ResponseField name="void" type="Promise<void>">
    A promise that resolves when the code is sent.
  </ResponseField>

  ## Formatting the phone number

  The `sendCode` method requires a `phoneNumber` string param that must follow these formatting conventions:

  * By default, the implicit phone number country code is +1/US.
  * Explicitly prepending a `(+)1` to the phone number will still be read as a US phone number.
  * For non-US phone numbers, append a `+${countryCode}` to the beginning of the input value.
  * Non-numerical values in the string are ignored, except for a leading `+` that denotes a custom country code.

  ## Login with Code

  ```tsx  theme={"system"}
  loginWithCode: ({ code: string }) => Promise<void>;
  ```

  ### Parameters

  <ParamField path="code" type="string" required>
    The one-time passcode sent to the user's phone number.
  </ParamField>

  ### Returns

  <ResponseField name="void" type="Promise<void>">
    A promise that resolves when the user is logged in.
  </ResponseField>

  ## Usage

  ```tsx  theme={"system"}
  import { useState } from "react";
  import { useLoginWithSms } from "@privy-io/react-auth";

  export default function LoginWithSms() {
    const [phoneNumber, setPhoneNumber] = useState("");
    const [code, setCode] = useState("");
    const { state, sendCode, loginWithCode } = useLoginWithSms();

    return (
      <div>
        {/* Prompt your user to enter their phone number */}
        <input onChange={(e) => setPhoneNumber(e.currentTarget.value)} value={phoneNumber} />
        {/* Once a phone number has been entered, send the OTP to it on click */}
        <button onClick={() => sendCode({ phoneNumber })}>Send Code</button>

        {/* Prompt your user to enter the OTP */}
        <input onChange={(e) => setCode(e.currentTarget.value)} value={code} />
        {/* Once an OTP has been entered, submit it to Privy on click */}
        <button onClick={() => loginWithCode({ code })}>Log in</button>
      </div>
    );
  }
  ```

  ## Tracking Flow State

  Track the state of the OTP flow via the `state` variable returned by the
  `useLoginWithSms` hook.

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

  You can optionally pass callbacks into the `useLoginWithSms` hook to run custom logic after a successful login or to handle errors that occur during the flow.

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
  To authenticate your users with a one-time passcode (OTP) sent to their phone number, use the `useLoginWithSMS` hook.

  <Info>
    To authenticate your users with Privy's out of the box UIs, check out UI components [here](/authentication/user-authentication/ui-component#react-native).
  </Info>

  ## Send Code

  ```jsx  theme={"system"}
  sendCode: ({phone: string}) => Promise<{success: boolean}>
  ```

  ### Parameters

  <ParamField path="phone" type="string" required>
    The phone number of the user to log in.
  </ParamField>

  ### Returns

  <ResponseField name="success" type="boolean">
    A promise that resolves to an object with a success property indicating if the code was sent successfully.
  </ResponseField>

  ## Login with Code

  ```jsx  theme={"system"}
  loginWithCode: ({ code: string, phone?: string, disableSignup?: boolean }) => Promise<{user: PrivyUser; isNewUser: boolean}>
  ```

  ### Parameters

  <ParamField path="code" type="string" required>
    The one-time passcode sent to the user's phone number.
  </ParamField>

  <ParamField path="phone" type="string">
    The user's phone number. Though this parameter is optional, it is highly recommended that you pass the user's phone number explicitly.
  </ParamField>

  <ParamField path="disableSignup" type="boolean">
    Whether to disable the ability to sign up with the phone number.
  </ParamField>

  ### Returns

  <ResponseField name="user" type="PrivyUser">
    The user object returned by the login process.
  </ResponseField>

  ## Usage

  ```jsx  theme={"system"}
  import { useState } from 'react';
  import { useLoginWithSMS } from '@privy-io/expo';

  export function LoginScreen() {
    const [phone, setPhone] = useState('');
    const [code, setCode] = useState('');
    const { sendCode, loginWithCode } = useLoginWithSMS();

    return (
      <View style={styles.container}>
        <Text>Login</Text>
        <TextInput value={phone} onChangeText={setPhone} placeholder="Phone" inputMode="tel" />
        <Button onPress={() => sendCode({ phone })}>Send Code</Button>

        <TextInput value={code} onChangeText={setCode} placeholder="Code" inputMode="numeric" />
        <Button onPress={() => loginWithCode({ code, phone })}>Login</Button>
      </View>
    );
  }
  ```

  ## Tracking login flow state

  The state variable returned from useLoginWithSMS will always be one of the following values.

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
    The current state of the SMS login flow.
  </ResponseField>

  <ResponseField name="error" type="Error | null">
    The error that occurred during the SMS login flow.
  </ResponseField>

  ## Callbacks

  You can optionally pass callbacks into the `useLoginWithSMS` hook to run custom logic after an OTP has been sent, after a successful login, or to handle errors that occur during the flow.

  ### `onSendCodeSuccess`

  ```tsx  theme={"system"}
  onSendCodeSuccess?: ((phone: string) => void) | undefined
  ```

  #### Parameters

  <ParamField path="phone" type="string">
    The phone number the code was sent to.
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
  To authenticate a user via their phone number, use the Privy client's `sms` handler.

  ## Send Code

  ```swift  theme={"system"}
  sendCode(to phoneNumber: String) async throws
  ```

  ### Parameters

  <ParamField path="to" type="String" required>
    The phone number of the user to log in. Must be in E.164 format (e.g., "+14155552671").
  </ParamField>

  ### Returns

  <ResponseField>
    Nothing, indicating success.
  </ResponseField>

  ### Throws

  An error if sending the code fails.

  ## Login with Code

  ```swift  theme={"system"}
  loginWithCode(_ code: String, sentTo phoneNumber: String) async throws -> PrivyUser
  ```

  ### Parameters

  <ParamField path="code" type="String" required>
    The one-time passcode sent to the user's phone number.
  </ParamField>

  <ParamField path="sentTo" type="String" required>
    The user's phone number.
  </ParamField>

  ### Returns

  <ResponseField name="PrivyUser" type="PrivyUser">
    The authenticated Privy user
  </ResponseField>

  ### Throws

  An error if logging the user in is unsuccessful.

  ## Usage

  ```swift  theme={"system"}
  // Send code to user's phone
  do {
      try await privy.sms.sendCode(to: "+14155552671")
      // successfully sent code to users phone
  } catch {
      print("error sending code: \(error)")
  }

  // Log the user in
  do {
      let user = try await privy.sms.loginWithCode("123456", sentTo: "+14155552671")
      // user successfully logged in
  } catch {
      print("error logging user in: \(error)")
  }
  ```
</View>

<View title="Android" icon="android">
  To authenticate a user via their phone number, use the Privy client's `sms` handler.

  ## Send Code

  ```kotlin  theme={"system"}
  sendCode(phoneNumber: String): Result<Unit>
  ```

  ### Parameters

  <ParamField path="phoneNumber" type="String" required>
    The phone number of the user to log in. Must be in E.164 format (e.g., "+14155552671").
  </ParamField>

  ### Returns

  <ResponseField name="Result<Unit>" type="Result<Unit>">
    A Result object that indicates whether the operation was successful. Returns Result.success if the code was sent successfully, or Result.failure if there was an error.
  </ResponseField>

  ## Login with Code

  ```kotlin  theme={"system"}
  loginWithCode(code: String, phoneNumber: String?): Result<PrivyUser>
  ```

  ### Parameters

  <ParamField path="code" type="String" required>
    The one-time passcode sent to the user's phone number.
  </ParamField>

  <ParamField path="phoneNumber" type="String">
    (Optional) The user's phone number. Though this parameter is optional, it is highly recommended that you pass the user's phone number explicitly. If phone number is omitted, the phone number from sendCode will be used.
  </ParamField>

  ### Returns

  <ResponseField name="Result<PrivyUser>" type="Result<PrivyUser>">
    A Result object containing the PrivyUser if successful, or an error if the operation failed.
  </ResponseField>

  ## Usage

  ```kotlin  theme={"system"}
  // Send code to user's phone number
  val result: Result<Unit> = privy.sms.sendCode(phoneNumber = "+14155552671")

  result.fold(
    onSuccess = {
      // OTP was successfully sent
    },
    onFailure = {
      println("Error sending OTP: ${it.message}")
    }
  )

  // Authenticate with the OTP code
  val result: Result<PrivyUser> = privy.sms.loginWithCode(code = "123456", phoneNumber = "+14155552671")

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

<View title="Flutter" icon="flutter">
  To authenticate a user via their phone number, use the Privy client's `sms` handler.

  ## Send Code

  ```dart  theme={"system"}
  sendCode(String phoneNumber): Future<Result<void>>
  ```

  ### Parameters

  <ParamField path="phoneNumber" type="String" required>
    The phone number of the user to log in. Must be in E.164 format (e.g., "+14155552671").
  </ParamField>

  ### Returns

  <ResponseField name="Result<void>" type="Future<Result<void>>">
    A Result object that indicates whether the operation was successful. Returns Result.success if the code was sent successfully, or Result.failure if there was an error.
  </ResponseField>

  ## Login with Code

  ```dart  theme={"system"}
  loginWithCode({required String code, String? phoneNumber}): Future<Result<PrivyUser>>
  ```

  ### Parameters

  <ParamField path="code" type="String" required>
    The one-time passcode sent to the user's phone number.
  </ParamField>

  <ParamField path="phoneNumber" type="String">
    (Optional) The user's phone number. Though this parameter is optional, it is highly recommended that you pass the user's phone number explicitly. If phone number is omitted, the phone number from sendCode will be used.
  </ParamField>

  ### Returns

  <ResponseField name="Result<PrivyUser>" type="Future<Result<PrivyUser>>">
    A Result object containing the PrivyUser if successful, or an error if the operation failed.
  </ResponseField>

  ## Usage

  ```dart  theme={"system"}
  // Send code to user's phone number
  final Result<void> result = await privy.sms.sendCode("+14155552671");

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
  final Result<PrivyUser> result = await privy.sms.loginWithCode(
    code: code,
    phoneNumber: phoneNumber,
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