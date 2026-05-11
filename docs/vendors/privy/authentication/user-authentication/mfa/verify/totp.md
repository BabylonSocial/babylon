> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# TOTP verification

Verify users with TOTP-based MFA by requesting and submitting a 6-digit code from their authenticator app.

<Tabs>
  <Tab title="React">
    ## Requesting an MFA challenge

    To request an MFA challenge for the current user, call the `init` method from the `useMfa` hook, passing `'totp'` as the MFA method parameter:

    ```tsx  theme={"system"}
    import {useMfa} from '@privy-io/react-auth';

    const {init, submit} = useMfa();

    // Request a TOTP MFA challenge
    await init('totp');
    ```

    The `init` method will prepare an MFA challenge for the TOTP method. The user will receive the MFA code within their authenticator app. The method returns a `Promise` that resolves if the challenge was successfully created, and rejects with an error if there was an issue.

    ## Submitting the MFA verification

    Once `init` has resolved successfully, prompt the user to get their MFA code from their authenticator app and enter it within your app. Then, call the `submit` method from `useMfa`. As parameters, pass the MFA method (`'totp'`) and the MFA code that the user entered:

    ```tsx  theme={"system"}
    const mfaCode = 'insert-mfa-code-from-user';
    await submit('totp', mfaCode);
    ```

    When `submit` resolves successfully, the user has completed MFA and can proceed to use their embedded wallet.
  </Tab>

  <Tab title="React Native">
    ## Requesting an MFA challenge

    To request an MFA challenge for the current user, call the `init` method from the `useMfa` hook with the appropriate parameters:

    ```tsx  theme={"system"}
    import {useMfa} from '@privy-io/expo';

    const {init, submit} = useMfa();

    // Request a TOTP MFA challenge
    await init({method: 'totp'});
    ```

    The `init` method will prepare an MFA challenge for the TOTP method. The user will receive the MFA code within their authenticator app.

    ## Submitting the MFA verification

    Once `init` has resolved successfully, prompt the user to get their MFA code from their authenticator app and enter it within your app. Then, call the `submit` method:

    ```tsx  theme={"system"}
    const mfaCode = 'insert-mfa-code-from-user';
    await submit({method: 'totp', mfaCode});
    ```

    When `submit` resolves successfully, the user has completed MFA and can proceed to use their embedded wallet.
  </Tab>

  <Tab title="Swift">
    ## Submitting the MFA verification

    For TOTP verification, no initialization step is required since the code is generated locally by the user's authenticator app. Prompt the user to get their MFA code from their authenticator app and enter it within your app. Then, call the `submit` method:

    ```swift  theme={"system"}
    guard let user = await privy.getUser() else { return }

    let mfaCode = "123456" // Code entered by user from authenticator app

    do {
        try await user.mfa.totp.verify.submit(code: mfaCode)

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
    ## Submitting the MFA verification

    For TOTP verification, no initialization step is required since the code is generated locally by the user's authenticator app. Prompt the user to get their MFA code from their authenticator app and enter it within your app. Then, call the `submit` method:

    ```kotlin  theme={"system"}
    val user = privy.getUser() ?: return

    val mfaCode = "123456" // Code entered by user from authenticator app

    user.mfa.totp.verify.submit(mfaCode)
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