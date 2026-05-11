> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Overview

Once users have successfully enrolled in MFA with Privy, they will be required to complete MFA whenever the private key for their embedded wallet must be used. This includes:

* Signing messages and transactions
* Recovering the embedded wallet on new devices
* Exporting the wallet's private key
* Setting a password on the wallet
* Enrolling another MFA method or unenrolling an existing one

<Tip>
  Once a user has completed MFA on a given device, they can continue to use the wallet on that device *without* needing to complete MFA for 15 minutes.

  After 15 minutes have elapsed, Privy will require that the user complete MFA again to re-authorize use of the wallet's private key.
</Tip>

## Requirements for custom MFA verification

To ensure users can complete MFA when required, your app must:

1. **Set up a flow** to guide the user through completing MFA when required
2. **Register an event listener** to configure Privy to invoke the flow whenever MFA is required. [Read more about the MFA required listener here](/authentication/user-authentication/mfa/listener).

## Verification interfaces

<Tabs>
  <Tab title="React">
    To set up a flow to have the user complete MFA, use Privy's `useMfa` hook:

    ```tsx  theme={"system"}
    import {useMfa} from '@privy-io/react-auth';

    const {init, submit, cancel} = useMfa();
    ```

    This flow has three core components:

    1. **Requesting an MFA challenge** (`init`) - Sends an MFA code to the user's enrolled method
    2. **Submitting the MFA verification** (`submit`) - Verifies the code provided by the user
    3. **Cancelling the MFA flow** (`cancel`) - Cancels an in-progress MFA flow if needed
  </Tab>

  <Tab title="React Native">
    To set up a flow to have the user complete MFA, use Privy's `useMfa` hook:

    ```tsx  theme={"system"}
    import {useMfa} from '@privy-io/expo';

    const {init, submit, cancel} = useMfa();
    ```

    This flow has three core components:

    1. **Requesting an MFA challenge** (`init`) - Sends an MFA code to the user's enrolled method
    2. **Submitting the MFA verification** (`submit`) - Verifies the code provided by the user
    3. **Cancelling the MFA flow** (`cancel`) - Cancels an in-progress MFA flow if needed
  </Tab>

  <Tab title="Swift">
    To set up a flow to have the user complete MFA, access the verification interfaces via the authenticated `user.mfa` namespace:

    ```swift  theme={"system"}
    guard let user = await privy.getUser() else { return }

    // SMS verification
    try await user.mfa.sms.verify.sendCode()
    try await user.mfa.sms.verify.submit(code: mfaCode)

    // TOTP verification
    try await user.mfa.totp.verify.submit(code: mfaCode)

    // Passkey verification
    try await user.mfa.passkeys.verify.submit(relyingParty: "https://yourdomain.com")
    ```

    This flow has two core components:

    1. **Requesting an MFA challenge** (e.g. `sendCode` for SMS) - Sends an MFA code to the user's enrolled method
    2. **Submitting the MFA verification** (`submit`) - Verifies the code provided by the user

    <Warning>
      If your app uses an [MFA required listener](/authentication/user-authentication/mfa/listener), you must call `privy.mfa.resumeBlockedActions()` after successful verification to unblock any pending wallet operations.
      If you do not call this, the initial call that triggered MFA will never resolve.
    </Warning>
  </Tab>

  <Tab title="Android">
    To set up a flow to have the user complete MFA, access the verification interfaces via the authenticated `user.mfa` namespace:

    ```kotlin  theme={"system"}
    val user = privy.getUser() ?: return

    // SMS verification
    user.mfa.sms.verify.sendCode()
    user.mfa.sms.verify.submit(mfaCode)

    // TOTP verification
    user.mfa.totp.verify.submit(mfaCode)

    // Passkey verification
    user.mfa.passkeys.verify.submit(relyingParty = "https://yourdomain.com")
    ```

    This flow has two core components:

    1. **Requesting an MFA challenge** (e.g. `sendCode` for SMS) - Sends an MFA code to the user's enrolled method
    2. **Submitting the MFA verification** (`submit`) - Verifies the code provided by the user

    <Warning>
      If your app uses an [MFA required listener](/authentication/user-authentication/mfa/listener), you must call `privy.mfa.resumeBlockedActions()` after successful verification to unblock any pending wallet operations.
      If you do not call this, the initial call that triggered MFA will never resolve.
    </Warning>
  </Tab>
</Tabs>

## Cancelling the MFA flow

<Tabs>
  <Tab title="React">
    After `init` has been called and the corresponding `submit` call has not yet occurred, the user may cancel their in-progress MFA flow if they wish.

    To cancel the current MFA flow, call the `cancel` method from the `useMfa` hook:

    ```tsx  theme={"system"}
    cancel();
    ```
  </Tab>

  <Tab title="React Native">
    After `init` has been called and the corresponding `submit` call has not yet occurred, the user may cancel their in-progress MFA flow if they wish.

    To cancel the current MFA flow, call the `cancel` method from the `useMfa` hook:

    ```tsx  theme={"system"}
    cancel();
    ```
  </Tab>

  <Tab title="Swift">
    <Warning>
      If the user cancels the MFA flow or verification fails, you must still call `resumeBlockedActions` to unblock any pending wallet operations. Pass an error to indicate the verification was cancelled.
    </Warning>

    ```swift  theme={"system"}
    // Cancel the MFA flow by resuming with an error
    await privy.mfa.resumeBlockedActions(throwing: MyError.mfaCancelled)
    ```

    See our [MFA required listener guide](/authentication/user-authentication/mfa/listener) for more details about this flow.
  </Tab>

  <Tab title="Android">
    <Warning>
      If the user cancels the MFA flow or verification fails, you must still call `resumeBlockedActions` to unblock any pending wallet operations. Pass an error to indicate the verification was cancelled.
    </Warning>

    ```kotlin  theme={"system"}
    // Cancel the MFA flow by resuming with an error
    privy.mfa.resumeBlockedActions(mfaError = Exception("User cancelled MFA"))
    ```

    See our [MFA required listener guide](/authentication/user-authentication/mfa/listener) for more details about this flow.
  </Tab>
</Tabs>

## Next steps

<CardGroup cols={3}>
  <Card title="SMS verification" icon="message-sms" href="/authentication/user-authentication/mfa/verify/sms">
    Verify users with SMS codes
  </Card>

  <Card title="TOTP verification" icon="mobile" href="/authentication/user-authentication/mfa/verify/totp">
    Verify users with authenticator apps
  </Card>

  <Card title="Passkey verification" icon="fingerprint" href="/authentication/user-authentication/mfa/verify/passkeys">
    Verify users with passkeys
  </Card>
</CardGroup>

<CardGroup cols={2}>
  <Card title="MFA required listener" icon="bell" href="/authentication/user-authentication/mfa/listener">
    Register an MFA event listener
  </Card>

  <Card title="Error handling" icon="circle-exclamation" href="/authentication/user-authentication/mfa/errors">
    Handle MFA verification errors
  </Card>
</CardGroup>
\n