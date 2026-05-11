> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# SMS verification

Verify users with SMS-based MFA by requesting and submitting a 6-digit code sent to their enrolled phone number.

<Tabs>
  <Tab title="React">
    ## Requesting an MFA challenge

    To request an MFA challenge for the current user, call the `init` method from the `useMfa` hook, passing `'sms'` as the MFA method parameter:

    ```tsx  theme={"system"}
    import {useMfa} from '@privy-io/react-auth';

    const {init, submit} = useMfa();

    // Request an SMS MFA challenge
    await init('sms');
    ```

    The `init` method will prepare an MFA challenge for the SMS method. The user will receive an SMS with their MFA code at the phone number they originally enrolled. The method returns a `Promise` that resolves if the challenge was successfully created, and rejects with an error if there was an issue.

    ## Submitting the MFA verification

    Once `init` has resolved successfully, prompt the user to get their MFA code from their SMS and enter it within your app. Then, call the `submit` method from `useMfa`. As parameters, pass the MFA method (`'sms'`) and the MFA code that the user entered:

    ```tsx  theme={"system"}
    const mfaCode = 'insert-mfa-code-from-user';
    await submit('sms', mfaCode);
    ```

    When `submit` resolves successfully, the user has completed MFA and can proceed to use their embedded wallet.
  </Tab>

  <Tab title="React Native">
    ## Requesting an MFA challenge

    To request an MFA challenge for the current user, call the `init` method from the `useMfa` hook with the appropriate parameters:

    ```tsx  theme={"system"}
    import {useMfa} from '@privy-io/expo';

    const {init, submit} = useMfa();

    // Request an SMS MFA challenge
    await init({method: 'sms'});
    ```

    The `init` method will prepare an MFA challenge for the SMS method. The user will receive an SMS with their MFA code at the phone number they originally enrolled.

    ## Submitting the MFA verification

    Once `init` has resolved successfully, prompt the user to get their MFA code from their SMS and enter it within your app. Then, call the `submit` method:

    ```tsx  theme={"system"}
    const mfaCode = 'insert-mfa-code-from-user';
    await submit({method: 'sms', mfaCode});
    ```

    When `submit` resolves successfully, the user has completed MFA and can proceed to use their embedded wallet.
  </Tab>

  <Tab title="Swift">
    ## Requesting an MFA challenge

    To request an MFA challenge for the current user, call the `sendCode` method from `user.mfa.sms.verify`:

    ```swift  theme={"system"}
    guard let user = await privy.getUser() else { return }

    // Request an SMS MFA challenge
    try await user.mfa.sms.verify.sendCode()
    ```

    The `sendCode` method will prepare an MFA challenge for the SMS method. The user will receive an SMS with their MFA code at the phone number they originally enrolled. The method throws if there was an issue sending the code.

    ## Submitting the MFA verification

    Once `sendCode` has completed successfully, prompt the user to get their MFA code from their SMS and enter it within your app. Then, call the `submit` method:

    ```swift  theme={"system"}
    let mfaCode = "123456" // Code entered by user

    do {
        try await user.mfa.sms.verify.submit(code: mfaCode)

        // If you've set up an MFA required listener, notify Privy MFA succeeded and to continue pending actions
        await privy.mfa.resumeBlockedActions()
    } catch {
        // Either prompt user to try again, or notify Privy MFA failed and pass the error to the call site
        await privy.mfa.resumeBlockedActions(throwing: error)
    }
    ```

    When `submit` completes successfully, the user has completed MFA and can proceed to use their embedded wallet.

    <Warning>
      If your app uses an [MFA required listener](/authentication/user-authentication/mfa/listener), you must call `privy.mfa.resumeBlockedActions()` after successful verification to unblock any pending wallet operations.
    </Warning>
  </Tab>

  <Tab title="Android">
    ## Requesting an MFA challenge

    To request an MFA challenge for the current user, call the `sendCode` method from `user.mfa.sms.verify`:

    ```kotlin  theme={"system"}
    val user = privy.getUser() ?: return

    // Request an SMS MFA challenge
    user.mfa.sms.verify.sendCode()
        .onSuccess {
            // Code sent successfully, show input for verification code
        }
        .onFailure { error ->
            // Handle error
        }
    ```

    The `sendCode` method will prepare an MFA challenge for the SMS method. The user will receive an SMS with their MFA code at the phone number they originally enrolled.

    ## Submitting the MFA verification

    Once `sendCode` has completed successfully, prompt the user to get their MFA code from their SMS and enter it within your app. Then, call the `submit` method:

    ```kotlin  theme={"system"}
    val mfaCode = "123456" // Code entered by user

    user.mfa.sms.verify.submit(mfaCode)
        .onSuccess {
            // If you've set up an MFA required listener, notify Privy MFA succeeded
            privy.mfa.resumeBlockedActions()
        }
        .onFailure { error ->
            // Either prompt user to try again, or notify Privy MFA failed
            privy.mfa.resumeBlockedActions(mfaError = error)
        }
    ```

    When `submit` completes successfully, the user has completed MFA and can proceed to use their embedded wallet.

    <Warning>
      If your app uses an [MFA required listener](/authentication/user-authentication/mfa/listener), you must call `privy.mfa.resumeBlockedActions()` after successful verification to unblock any pending wallet operations.
    </Warning>
  </Tab>
</Tabs>
\n