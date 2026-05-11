> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Error handling

When both enrolling in and completing MFA, Privy sends a 6-digit code to the user's selected MFA method, that the user must submit to Privy in order to verify their identity.

When submitting this MFA code, Privy may respond with an error if:

* The code is incorrect
* The user has reached the maximum number of attempts for this MFA flow
* The MFA flow has timed out

If the user enters an incorrect code (e.g. by mistyping), they are allowed to retry code submission up to a **maximum of four attempts**.

## Error helper functions

Privy provides helper functions to parse errors raised by MFA code submission methods. Each of these functions accepts the raw error raised as a parameter, and returns a `Boolean` indicating if the error meets a certain condition.

<Tabs>
  <Tab title="React">
    ```tsx  theme={"system"}
    import {
      errorIndicatesMfaVerificationFailed,
      errorIndicatesMfaMaxAttempts,
      errorIndicatesMfaTimeout,
    } from '@privy-io/react-auth';
    ```

    ### errorIndicatesMfaVerificationFailed

    Indicates the user entered an incorrect MFA code. Allow the user to re-enter the code and call `submit` again.

    ### errorIndicatesMfaMaxAttempts

    Indicates the user has reached the maximum number of attempts for this MFA flow. A new MFA code must be requested via `init`.

    ### errorIndicatesMfaTimeout

    Indicates that the current MFA code has expired. A new MFA code must be requested via `init`.
  </Tab>

  <Tab title="React Native">
    ```tsx  theme={"system"}
    import {
      errorIndicatesMfaVerificationFailed,
      errorIndicatesMfaMaxAttempts,
      errorIndicatesMfaTimeout,
    } from '@privy-io/expo';
    ```

    ### errorIndicatesMfaVerificationFailed

    Indicates the user entered an incorrect MFA code. Allow the user to re-enter the code and call `submit` again.

    ### errorIndicatesMfaMaxAttempts

    Indicates the user has reached the maximum number of attempts for this MFA flow. A new MFA code must be requested via `init`.

    ### errorIndicatesMfaTimeout

    Indicates that the current MFA code has expired. A new MFA code must be requested via `init`.
  </Tab>

  <Tab title="Swift">
    In Swift, MFA errors are thrown as `PrivyError` values with `EmbeddedWalletFailureReason` cases:

    | Error Case                           | Description                                                 |
    | ------------------------------------ | ----------------------------------------------------------- |
    | `.missingOrInvalidMfa`               | The user entered an incorrect MFA code                      |
    | `.timeoutOnMfa`                      | The MFA flow timed out                                      |
    | `.mfaChallengeExpired`               | The MFA challenge expired before verification completed     |
    | `.mfaVerificationMaxAttemptsReached` | The maximum number of MFA verification attempts was reached |
  </Tab>

  <Tab title="Android">
    In Android, MFA errors are returned as failures in the `Result` type. The SDK provides specific error codes that can be checked:

    | Error Code                     | Description                            |
    | ------------------------------ | -------------------------------------- |
    | `missing_or_invalid_mfa`       | The user entered an incorrect MFA code |
    | `expired_or_invalid_mfa_token` | The MFA token expired or is invalid    |

    You can also catch `MfaRequiredOrInvalidException` when an operation requires MFA verification.
  </Tab>
</Tabs>

## Example usage

<Tabs>
  <Tab title="React / React Native">
    ```tsx Handling errors during MFA code submission theme={"system"}
    import {
      errorIndicatesMfaVerificationFailed,
      errorIndicatesMfaMaxAttempts,
      errorIndicatesMfaTimeout
    } from '@privy-io/react-auth'; // or '@privy-io/expo' for React Native

    try {
      // Errors from enrollment methods can be handled similarly
      await submit('insert-mfa-method', 'insert-mfa-code');
    } catch (e) {
      if (errorIndicatesMfaVerificationFailed(e)) {
        console.error('Incorrect MFA code, please try again.');
        // Allow the user to re-enter the code and call `submit` again
      } else if (errorIndicatesMfaMaxAttempts(e)) {
        console.error('Maximum MFA attempts reached, please request a new code.');
        // Allow the user to request a new code with `init`
      } else if (errorIndicatesMfaTimeout(e)) {
        console.error('MFA code has expired, please request a new code.');
        // Allow the user to request a new code with `init`
      }
    }
    ```
  </Tab>

  <Tab title="Swift">
    ```swift Handling errors during MFA code submission theme={"system"}
    do {
        try await user.mfa.totp.verify.submit(code: mfaCode)
    } catch let error as PrivyError {
        switch error.errorCode {
        case .embeddedWalletFailure(let reason):
            switch reason {
            case .missingOrInvalidMfa:
                // Incorrect code - allow the user to re-enter
                errorMessage = "Incorrect MFA code, please try again."
            case .timeoutOnMfa:
                // Code expired - need to start over
                errorMessage = "MFA code has expired, please request a new code."
            case .mfaChallengeExpired:
                // Challenge expired - need to start a new MFA flow
                errorMessage = "MFA challenge expired, please start over."
            case .mfaVerificationMaxAttemptsReached:
                // Max attempts reached - need to start a new MFA flow
                errorMessage = "Maximum attempts reached, please request a new code."
            default:
                errorMessage = "An error occurred: \(error.localizedDescription)"
            }
        default:
            errorMessage = "An error occurred: \(error.localizedDescription)"
        }
    }
    ```
  </Tab>

  <Tab title="Android">
    ```kotlin Handling errors during MFA code submission theme={"system"}
    import io.privy.auth.mfa.MfaRequiredOrInvalidException
    import io.privy.auth.mfa.privyPromptForMfaErrorCodes

    user.mfa.totp.verify.submit(mfaCode)
        .onSuccess {
            // MFA verification succeeded
        }
        .onFailure { error ->
            when {
                error is MfaRequiredOrInvalidException -> {
                    // MFA is required or the code was invalid
                    errorMessage = "Incorrect MFA code, please try again."
                }
                error.message?.contains("missing_or_invalid_mfa") == true -> {
                    // Incorrect code - allow the user to re-enter
                    errorMessage = "Incorrect MFA code, please try again."
                }
                error.message?.contains("expired_or_invalid_mfa_token") == true -> {
                    // Token expired - need to start a new MFA flow
                    errorMessage = "MFA code has expired, please request a new code."
                }
                else -> {
                    errorMessage = "An error occurred: ${error.message}"
                }
            }
        }
    ```
  </Tab>
</Tabs>
\n