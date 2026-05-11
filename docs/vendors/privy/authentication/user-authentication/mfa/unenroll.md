> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Unenrolling MFA methods

<Info>Unenrolling an MFA method requires MFA verification.</Info>

Allow users to remove previously enrolled MFA methods from their account.

<Tabs>
  <Tab title="React">
    Privy allows users to delete MFA methods via the `unenrollWithSms`, `unenrollWithTotp`, and `unenrollWithPasskey` methods returned from the `useMfaEnrollment` hook:

    ```tsx  theme={"system"}
    import {useMfaEnrollment} from '@privy-io/react-auth';

    const {unenrollWithSms, unenrollWithTotp, unenrollWithPasskey} = useMfaEnrollment();
    ```

    ## Unenrolling SMS

    To remove SMS as an MFA method:

    ```tsx  theme={"system"}
    await unenrollWithSms();
    ```

    ## Unenrolling TOTP

    To remove TOTP as an MFA method:

    ```tsx  theme={"system"}
    await unenrollWithTotp();
    ```

    ## Unenrolling passkeys

    To remove passkeys as an MFA method:

    ```tsx  theme={"system"}
    await unenrollWithPasskey();
    ```

    ## Complete example

    ```tsx Example unenrolling SMS/TOTP/passkey theme={"system"}
    import {useMfaEnrollment} from '@privy-io/react-auth';

    export default function MfaUnenrollment() {
      const {unenrollWithSms, unenrollWithTotp, unenrollWithPasskey} = useMfaEnrollment();

      return (
        <div>
          <button onClick={unenrollWithSms}>Unenroll SMS</button>
          <button onClick={unenrollWithTotp}>Unenroll TOTP</button>
          <button onClick={unenrollWithPasskey}>Unenroll passkey</button>
        </div>
      );
    }
    ```
  </Tab>

  <Tab title="React Native">
    Privy allows users to delete MFA methods via the `unenrollMfa` method returned from the `useMfaEnrollment` hook:

    ```tsx  theme={"system"}
    import {useMfaEnrollment} from '@privy-io/expo';

    const {unenrollMfa} = useMfaEnrollment();
    ```

    ## Unenrolling SMS

    To remove SMS as an MFA method:

    ```tsx  theme={"system"}
    await unenrollMfa({method: 'sms'});
    ```

    ## Unenrolling TOTP

    To remove TOTP as an MFA method:

    ```tsx  theme={"system"}
    await unenrollMfa({method: 'totp'});
    ```

    ## Unenrolling passkeys

    To remove passkeys as an MFA method:

    ```tsx  theme={"system"}
    await unenrollMfa({method: 'passkey'});
    ```

    <Info>
      By default, unenrolling a passkey will also unlink it as a valid login method. To modify this behavior, set the `removeForLogin` option to `false`:

      ```tsx  theme={"system"}
      await unenrollMfa({method: 'passkey', removeForLogin: false});
      ```
    </Info>

    ## Complete example

    ```tsx Example unenrolling SMS/TOTP/passkey theme={"system"}
    import {useMfaEnrollment} from '@privy-io/expo';

    export default function MfaUnenrollment() {
      const {unenrollMfa} = useMfaEnrollment();

      return (
        <YStack>
          <Button onPress={() => unenrollMfa({method: 'sms'})}>
            <Text>Unenroll SMS</Text>
          </Button>
          <Button onPress={() => unenrollMfa({method: 'totp'})}>
            <Text>Unenroll TOTP</Text>
          </Button>
          <Button onPress={() => unenrollMfa({method: 'passkey'})}>
            <Text>Unenroll passkey</Text>
          </Button>
        </YStack>
      );
    }
    ```
  </Tab>

  <Tab title="Swift">
    Privy allows users to unenroll from MFA methods via the `unenroll` method on each MFA namespace:

    ```swift  theme={"system"}
    guard let user = await privy.getUser() else { return }

    // Unenroll from specific MFA methods
    try await user.mfa.sms.unenroll()
    try await user.mfa.totp.unenroll()
    try await user.mfa.passkeys.unenroll()
    ```

    ## Unenrolling SMS

    To remove SMS as an MFA method:

    ```swift  theme={"system"}
    let updatedUser = try await user.mfa.sms.unenroll()
    ```

    ## Unenrolling TOTP

    To remove TOTP as an MFA method:

    ```swift  theme={"system"}
    let updatedUser = try await user.mfa.totp.unenroll()
    ```

    ## Unenrolling passkeys

    To remove passkeys as an MFA method:

    ```swift  theme={"system"}
    let updatedUser = try await user.mfa.passkeys.unenroll()
    ```

    <Info>
      By default, unenrolling a passkey will also unlink it as a valid login method. To keep the passkey as a login method, set the `removeForLogin` parameter to `false`:

      ```swift  theme={"system"}
      let updatedUser = try await user.mfa.passkeys.unenroll(removeForLogin: false)
      ```
    </Info>
  </Tab>

  <Tab title="Android">
    Privy allows users to unenroll from MFA methods via the `unenroll` method on each MFA namespace:

    ```kotlin  theme={"system"}
    val user = privy.getUser() ?: return

    // Unenroll from specific MFA methods
    user.mfa.sms.unenroll()
    user.mfa.totp.unenroll()
    user.mfa.passkeys.unenroll()
    ```

    ## Unenrolling SMS

    To remove SMS as an MFA method:

    ```kotlin  theme={"system"}
    user.mfa.sms.unenroll()
        .onSuccess { updatedUser ->
            // SMS MFA removed successfully
        }
        .onFailure { error ->
            // Handle error
        }
    ```

    ## Unenrolling TOTP

    To remove TOTP as an MFA method:

    ```kotlin  theme={"system"}
    user.mfa.totp.unenroll()
        .onSuccess { updatedUser ->
            // TOTP MFA removed successfully
        }
        .onFailure { error ->
            // Handle error
        }
    ```

    ## Unenrolling passkeys

    To remove passkeys as an MFA method:

    ```kotlin  theme={"system"}
    user.mfa.passkeys.unenroll()
        .onSuccess { updatedUser ->
            // Passkey MFA removed successfully
        }
        .onFailure { error ->
            // Handle error
        }
    ```

    <Info>
      By default, unenrolling a passkey will also unlink it as a valid login method. To keep the passkey as a login method, set the `removeForLogin` parameter to `false`:

      ```kotlin  theme={"system"}
      user.mfa.passkeys.unenroll(removeForLogin = false)
          .onSuccess { updatedUser ->
              // Passkey MFA removed, but passkey still valid for login
          }
      ```
    </Info>
  </Tab>
</Tabs>
\n