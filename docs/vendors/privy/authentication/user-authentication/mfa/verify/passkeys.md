> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Passkey verification

Verify users with passkey-based MFA by prompting them to authenticate with their registered passkey.

<Tabs>
  <Tab title="React">
    ## Requesting an MFA challenge

    To request an MFA challenge for the current user, call the `init` method from the `useMfa` hook, passing `'passkey'` as the MFA method parameter:

    ```tsx  theme={"system"}
    import {useMfa} from '@privy-io/react-auth';

    const {init, submit} = useMfa();

    // Request a passkey MFA challenge
    const options = await init('passkey');
    ```

    When the MFA method is `'passkey'`, `init` will return an object with options to pass to the native passkey system. The method returns a `Promise` that resolves with these options if the challenge was successfully created, and rejects with an error if there was an issue.

    ## Submitting the MFA verification

    Once `init` has resolved successfully, prompt the user to select a passkey by calling `submit` with the options returned from the `init` method:

    ```tsx  theme={"system"}
    const options = await init('passkey');

    // Submit will trigger the system's native passkey prompt
    await submit('passkey', options);
    ```

    When `submit` resolves successfully, the user has completed MFA and can proceed to use their embedded wallet.
  </Tab>

  <Tab title="React Native">
    ## Requesting an MFA challenge

    To request an MFA challenge for the current user, call the `init` method from the `useMfa` hook with the appropriate parameters:

    ```tsx  theme={"system"}
    import {useMfa} from '@privy-io/expo';

    const {init, submit} = useMfa();

    // Request a passkey MFA challenge
    const options = await init({method: 'passkey'});
    ```

    When the MFA method is `'passkey'`, `init` will return an object with options to pass to the native passkey system.

    ## Submitting the MFA verification

    Once `init` has resolved successfully, prompt the user to select a passkey by calling `submit` with the options returned from the `init` method:

    ```tsx  theme={"system"}
    const options = await init({method: 'passkey'});

    // Submit will trigger the system's native passkey prompt
    await submit({method: 'passkey', mfaCode: options});
    ```

    When `submit` resolves successfully, the user has completed MFA and can proceed to use their embedded wallet.
  </Tab>

  <Tab title="Swift">
    ## Submitting the MFA verification

    For passkey verification, call the `submit` method with the relying party URL. This will trigger the system's native passkey prompt for biometric authentication:

    ```swift  theme={"system"}
    guard let user = await privy.getUser() else { return }

    do {
        // Submit will trigger the system's native passkey prompt
        try await user.mfa.passkeys.verify.submit(relyingParty: "https://yourdomain.com")

        // If you've set up an MFA required listener, notify Privy MFA succeeded and to continue pending actions
        await privy.mfa.resumeBlockedActions()
    } catch {
        // Either prompt user to try again, or notify Privy MFA failed and pass the error to the call site
        await privy.mfa.resumeBlockedActions(throwing: error)
    }
    ```

    The `relyingParty` parameter should be the URL origin where your [Apple App Site Association](/authentication/user-authentication/login-methods/passkey) file is hosted (e.g., `https://example.com`).

    When `submit` completes successfully, the user has completed MFA and can proceed to use their embedded wallet.

    <Warning>
      If your app uses an [MFA required listener](/authentication/user-authentication/mfa/listener), you must call `privy.mfa.resumeBlockedActions()` after successful verification to unblock any pending wallet operations.
    </Warning>
  </Tab>

  <Tab title="Android">
    ## Submitting the MFA verification

    For passkey verification, call the `submit` method with the relying party URL. This will trigger the system's native passkey prompt for biometric authentication:

    ```kotlin  theme={"system"}
    val user = privy.getUser() ?: return

    user.mfa.passkeys.verify.submit(relyingParty = "https://yourdomain.com")
        .onSuccess {
            // If you've set up an MFA required listener, notify Privy MFA succeeded
            privy.mfa.resumeBlockedActions()
        }
        .onFailure { error ->
            // Either prompt user to try again, or notify Privy MFA failed
            privy.mfa.resumeBlockedActions(mfaError = error)
        }
    ```

    The `relyingParty` parameter should be the URL origin where your [Digital Asset Links](/authentication/user-authentication/login-methods/passkey) file is hosted (e.g., `https://example.com`).

    When `submit` completes successfully, the user has completed MFA and can proceed to use their embedded wallet.

    <Warning>
      If your app uses an [MFA required listener](/authentication/user-authentication/mfa/listener), you must call `privy.mfa.resumeBlockedActions()` after successful verification to unblock any pending wallet operations.
    </Warning>
  </Tab>
</Tabs>
\n