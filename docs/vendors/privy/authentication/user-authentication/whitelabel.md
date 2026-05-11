> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Whitelabel

All of Privy's frontend SDKs let you fully customize authentication to match your app’s brand and user experience. You can implement every authentication flow—including email, SMS, social logins, passkeys, Telegram, and multi-factor authentication (MFA)—with your own UI, while Privy manages security and backend logic.

<View title="React" icon="react">
  All of Privy's authentication flows can be whitelabeled, from email and SMS passwordless flows to social logins and passkeys.

  <Accordion title="Email" defaultOpen>
    To whitelabel Privy's passwordless email flow, use the `useLoginWithEmail` hook. Then, call `sendCode` and `loginWithCode` with the desired email address.

    ```tsx  theme={"system"}
    import {useLoginWithEmail} from '@privy-io/react-auth';
    ```

    ```tsx  theme={"system"}
    const {sendCode, loginWithCode} = useLoginWithEmail();
    sendCode({email: 'test@test.com'});
    loginWithCode({code: '123456'});
    ```

    Learn more about [email authentication and tracking login flow state](/authentication/user-authentication/login-methods/email).
  </Accordion>

  <Accordion title="SMS">
    To whitelabel the passwordless SMS flow, use the `useLoginWithSms` hook. Then, call `sendCode` and `loginWithCode` with the desired phone number.

    ```tsx  theme={"system"}
    import {useLoginWithSms} from '@privy-io/react-auth';
    ```

    ```tsx  theme={"system"}
    const {sendCode, loginWithCode} = useLoginWithSms();
    sendCode({phoneNumber: '+1234567890'});
    loginWithCode({code: '123456'});
    ```

    Learn more about [SMS authentication and tracking login flow state](/authentication/user-authentication/login-methods/sms).
  </Accordion>

  <Accordion title="Social logins">
    To whitelabel social login, use the `useLoginWithOAuth` hook and call `initOAuth` with your desired social login provider.

    ```tsx  theme={"system"}
    import {useLoginWithOAuth} from '@privy-io/react-auth';
    ```

    ```tsx  theme={"system"}
    const {initOAuth} = useLoginWithOAuth();
    initOAuth({provider: 'google'});
    ```

    Learn more about [social logins and tracking login flow state](/authentication/user-authentication/login-methods/oauth).
  </Accordion>

  <Accordion title="Passkeys">
    To whitelabel passkeys, use the `useLoginWithPasskey` hook and call `loginWithPasskey`.

    ```tsx  theme={"system"}
    import {useLoginWithPasskey} from '@privy-io/react-auth';
    ```

    ```tsx  theme={"system"}
    const {loginWithPasskey} = useLoginWithPasskey();
    loginWithPasskey();
    ```

    To sign up with a passkey:

    ```tsx  theme={"system"}
    import {useSignupWithPasskey} from '@privy-io/react-auth';
    ```

    ```tsx  theme={"system"}
    const {signupWithPasskey} = useSignupWithPasskey();
    signupWithPasskey();
    ```

    To link a passkey to an existing user:

    ```tsx  theme={"system"}
    import {useLinkWithPasskey} from '@privy-io/react-auth';
    ```

    ```tsx  theme={"system"}
    const {linkWithPasskey} = useLinkWithPasskey();
    linkWithPasskey();
    ```

    Learn more about [passkeys and tracking login flow state](/authentication/user-authentication/login-methods/passkey).
  </Accordion>

  <Accordion title="Telegram">
    To whitelabel the Telegram login flow, it's as simple as using the `useLoginWithTelegram` hook and calling `login`.

    ```tsx  theme={"system"}
    import {useLoginWithTelegram} from '@privy-io/react-auth';
    ```

    ```tsx  theme={"system"}
    const {login, state} = useLoginWithTelegram();
    login();
    ```

    Learn more about [Telegram authentication and tracking login flow state](/authentication/user-authentication/login-methods/telegram).
  </Accordion>

  <Accordion title="MFA">
    To whitelabel MFA with SMS, TOTP, or passkeys, follow the [custom UI guide](/authentication/user-authentication/mfa/custom-ui).
  </Accordion>
</View>

<View title="React Native" icon="react">
  Privy’s React Native SDK is whitelabel by default, enabling apps to implement custom
  authentication UI and flows using the SDK’s functions. Get started with email login
  [here](/authentication/user-authentication/login-methods/email#react-native).
</View>

<View title="Swift" icon="swift">
  Privy’s Swift SDK is whitelabel by default, enabling apps to implement custom authentication UI
  and flows using the SDK’s functions. Get started with email login
  [here](/authentication/user-authentication/login-methods/email#swift).
</View>

<View title="Android" icon="android">
  Privy’s Android SDK is whitelabel by default, enabling apps to implement custom authentication UI
  and flows using the SDK’s functions. Get started with email login
  [here](/authentication/user-authentication/login-methods/email#android).
</View>

<View title="Unity" icon="unity">
  Privy’s Unity SDK is whitelabel by default, enabling apps to implement custom authentication UI
  and flows using the SDK’s functions. Get started with email login
  [here](/authentication/user-authentication/login-methods/email#unity).
</View>

<View title="Flutter" icon="flutter">
  Privy’s Flutter SDK is whitelabel by default, enabling apps to implement custom authentication UI
  and flows using the SDK’s functions. Get started with email login
  [here](/authentication/user-authentication/login-methods/email#flutter).
</View>
\n