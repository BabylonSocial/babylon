> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Overview

<Info>
  Enrolling in MFA does not automatically verify the user for wallet operations. Once enrolled,
  subsequent wallet actions will require MFA verification. See the [verification
  guides](/authentication/user-authentication/mfa/verify/overview) for how to complete MFA
  verification.
</Info>

Enroll users in MFA so they can secure their embedded wallet with an additional authentication factor.

## Configuring MFA for custom UIs

<Tabs>
  <Tab title="React">
    The React SDK uses Privy's default MFA UIs by default. To use custom UIs instead, **set the `mfa.noPromptOnMfaRequired` field to `true` in the Privy provider**:

    ```tsx  theme={"system"}
    function MyApp({Component, pageProps}: AppProps) {
      return (
        <>
          <PrivyProvider
            appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID}
            config={{
              mfa: {
                // Defaults to 'false'. Set to 'true' to use custom UIs.
                noPromptOnMfaRequired: true,
              },
              ...insertTheRestOfYourConfig,
            }}
          >
            <Component {...pageProps} />
          </PrivyProvider>
        </>
      );
    }
    ```

    This configures Privy to not show its default UIs for wallet MFA, allowing your app to use custom enrollment and verification flows instead.
  </Tab>

  <Tab title="Other SDKs">
    The rest of Privy SDKs use custom UIs by default. No additional configuration is required to use custom MFA flows.
  </Tab>
</Tabs>

## Available MFA methods

Users can enroll in three MFA methods:

* **SMS**: Users authenticate with a 6-digit MFA code sent to their phone number
* **TOTP**: Users authenticate with a 6-digit MFA code from an authentication app, like Authy or Google Authenticator
* **Passkey**: Users verify with a previously registered passkey, generally through biometric authentication on their device

## Enrollment interfaces

<Tabs>
  <Tab title="React">
    To enroll users in MFA, use the `useMfaEnrollment` hook from Privy:

    ```tsx  theme={"system"}
    import {useMfaEnrollment} from '@privy-io/react-auth';

    const {
      initEnrollmentWithSms,
      submitEnrollmentWithSms,
      initEnrollmentWithTotp,
      submitEnrollmentWithTotp,
      initEnrollmentWithPasskey,
      submitEnrollmentWithPasskey,
    } = useMfaEnrollment();
    ```
  </Tab>

  <Tab title="React Native">
    To enroll users in MFA, use the `useMfaEnrollment` hook from Privy:

    ```tsx  theme={"system"}
    import {useMfaEnrollment} from '@privy-io/expo';

    const {initMfaEnrollment, submitMfaEnrollment} = useMfaEnrollment();
    ```
  </Tab>

  <Tab title="Swift">
    To enroll users in MFA, access the enrollment interfaces via the `user.mfa` namespace:

    ```swift  theme={"system"}
    // Access via the authenticated user
    guard let user = await privy.getUser() else { return }

    // SMS enrollment
    user.mfa.sms.enroll.sendCode(to:)
    user.mfa.sms.enroll.submit(code:sentTo:)

    // TOTP enrollment
    user.mfa.totp.enroll.generateSecret()
    user.mfa.totp.enroll.submit(code:)

    // Passkey enrollment
    user.mfa.passkeys.enroll.submit(credentialIds:)
    ```
  </Tab>

  <Tab title="Android">
    To enroll users in MFA, access the enrollment interfaces via the `user.mfa` namespace:

    ```kotlin  theme={"system"}
    // Access via the authenticated user
    val user = privy.getUser() ?: return

    // SMS enrollment
    user.mfa.sms.enroll.sendCode(phoneNumber)
    user.mfa.sms.enroll.submit(code, phoneNumber)

    // TOTP enrollment
    user.mfa.totp.enroll.generateSecret()
    user.mfa.totp.enroll.submit(code)

    // Passkey enrollment
    user.mfa.passkeys.enroll.submit(credentialIds)
    ```
  </Tab>
</Tabs>

## Next steps

<CardGroup cols={3}>
  <Card title="SMS enrollment" icon="message-sms" href="/authentication/user-authentication/mfa/enrollment/sms">
    Enroll users with SMS-based MFA
  </Card>

  <Card title="TOTP enrollment" icon="mobile" href="/authentication/user-authentication/mfa/enrollment/totp">
    Enroll users with authenticator apps
  </Card>

  <Card title="Passkey enrollment" icon="fingerprint" href="/authentication/user-authentication/mfa/enrollment/passkeys">
    Enroll users with passkeys
  </Card>
</CardGroup>
\n