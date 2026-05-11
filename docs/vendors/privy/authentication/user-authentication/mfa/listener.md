> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# MFA required listener

Once you've set up your app's logic for guiding a user to complete MFA, you need to configure Privy to invoke this logic whenever MFA is required by the user's embedded wallet.

## Registering the listener

<Tabs>
  <Tab title="React">
    To set up this configuration, use Privy's `useRegisterMfaListener` hook. As a parameter, you must pass a JSON object with an `onMfaRequired` callback.

    ### onMfaRequired callback

    Privy will invoke the `onMfaRequired` callback you set whenever the user is required to complete MFA to use the embedded wallet. When this occurs, any use of the embedded wallet will be "paused" until the user has successfully completed MFA with Privy.

    In this callback, you should invoke your app's logic for guiding through completing MFA (done via the `useMfa` hook). Within this callback, you can also access an `methods` parameter that contains a list of available MFA methods that the user has enrolled in (`'sms'` and/or `'totp'` and/or `'passkey'`).

    ```tsx MFAProvider.tsx theme={"system"}
    import {useRegisterMfaListener, MfaMethod} from '@privy-io/react-auth';

    import {MFAModal} from '../components/MFAModal';

    export const MFAProvider = ({children}: {children: React.ReactNode}) => {
      const [isMfaModalOpen, setIsMfaModelOpen] = useState(false);
      const [mfaMethods, setMfaMethods] = useState<MfaMethod[]>([]);

      useRegisterMfaListener({
        // Privy will invoke this whenever the user is required to complete MFA
        onMfaRequired: (methods) => {
          // Update app's state with the list of available MFA methods for the user
          setMfaMethods(methods);
          // Open MFA modal to allow user to complete MFA
          setIsMfaModalOpen(true);
        },
      });

      return (
        <div>
          {/* This `MFAModal` component includes all logic for completing the MFA flow with Privy's `useMfa` hook */}
          <MFAModal isOpen={isMfaModalOpen} setIsOpen={setIsMfaModalOpen} mfaMethods={mfaMethods} />
          {children}
        </div>
      );
    };
    ```

    <Info>
      In order for Privy to invoke your app's MFA flow, the component that calls Privy's `useRegisterMfaListener` hook **must be mounted** whenever the user's embedded wallet requires that they complete MFA.

      We recommend that you render this component near the root of your application, so that it is always rendered whenever the embedded wallet may be used.
    </Info>
  </Tab>

  <Tab title="React Native">
    To set up this configuration, use Privy's `useRegisterMfaListener` hook:

    ```tsx MFAProvider.tsx theme={"system"}
    import {useRegisterMfaListener, MfaMethod} from '@privy-io/expo';

    import {MFAModal} from '../components/MFAModal';

    export const MFAProvider = ({children}: {children: React.ReactNode}) => {
      const [isMfaModalOpen, setIsMfaModelOpen] = useState(false);
      const [mfaMethods, setMfaMethods] = useState<MfaMethod[]>([]);

      useRegisterMfaListener({
        // Privy will invoke this whenever the user is required to complete MFA
        onMfaRequired: (methods) => {
          // Update app's state with the list of available MFA methods for the user
          setMfaMethods(methods);
          // Open MFA modal to allow user to complete MFA
          setIsMfaModalOpen(true);
        },
      });

      return (
        <View>
          {/* This `MFAModal` component includes all logic for completing the MFA flow with Privy's `useMfa` hook */}
          <MFAModal isOpen={isMfaModalOpen} setIsOpen={setIsMfaModalOpen} mfaMethods={mfaMethods} />
          {children}
        </View>
      );
    };
    ```

    <Info>
      In order for Privy to invoke your app's MFA flow, the component that calls Privy's `useRegisterMfaListener` hook **must be mounted** whenever the user's embedded wallet requires that they complete MFA.

      We recommend that you render this component near the root of your application, so that it is always rendered whenever the embedded wallet may be used.
    </Info>
  </Tab>

  <Tab title="Swift">
    To set up this configuration, implement the `PrivyMfaPromptDelegate` protocol and configure it via `PrivyMFAConfig`. When an operation requires MFA verification, the SDK will automatically call your delegate's `onMfaRequired` method.

    ### Setting up the delegate

    First, create a class that implements the `PrivyMfaPromptDelegate` protocol:

    ```swift MfaPromptHandler.swift theme={"system"}
    import PrivySDK

    @MainActor
    final class MfaPromptHandler: ObservableObject, PrivyMfaPromptDelegate {
        @Published var isShowingPrompt = false

        private var user: PrivyUser!

        func onMfaRequired(for user: PrivyUser) {
            self.user = user
            self.isShowingPrompt = true
        }

        func submit(privy: Privy) {
            // Code would be read from the view model
            let code = "123456"

            Task {
                do {
                    try await user.mfa.totp.verify.submit(code: code)
                    await privy.mfa.resumeBlockedActions()
                } catch {
                    // Show the error in UI so the user can retry
                }
            }
        }

        // Called if the user decides to cancel the flow
        func cancel(privy: Privy) {
            Task {
                await privy.mfa.resumeBlockedActions(throwing: MfaError.cancelled)
            }
        }
    }
    ```

    ### Configuring the MFA delegate

    Configure the delegate either at initialization or at runtime:

    ```swift Configure at initialization theme={"system"}
    let mfaHandler = MfaPromptHandler()
    let mfaConfig = PrivyMFAConfig(delegate: mfaHandler)

    let config = PrivyConfig(
        appId: "your-app-id",
        appClientId: "your-client-id",
        mfaConfig: mfaConfig
    )

    let privy = PrivySdk.initialize(config: config)
    ```

    ```swift Configure at runtime theme={"system"}
    // You can also set the config at runtime
    let mfaHandler = MfaPromptHandler()
    let mfaConfig = PrivyMFAConfig(delegate: mfaHandler)
    privy.mfa.setConfig(mfaConfig)
    ```

    ### Completing verification and resuming operations

    After the user completes MFA verification, you **must** call `resumeBlockedActions()` to unblock any pending wallet operations:

    ```swift  theme={"system"}
    // After successful MFA verification
    try await user.mfa.totp.verify.submit(code: mfaCode)
    await privy.mfa.resumeBlockedActions()
    ```

    <Warning>
      If `resumeBlockedActions()` is not called within 5 minutes of the operation that triggered the delegate, the original wallet operation will throw with a `.embeddedWalletFailure(reason: .timeoutOnMfa)` error.
    </Warning>

    ### Handling cancellation

    If the user cancels the MFA flow, you must still call `resumeBlockedActions` to unblock operations. Pass an error to indicate cancellation:

    ```swift  theme={"system"}
    // If the user cancels MFA
    await privy.mfa.resumeBlockedActions(throwing: MyError.mfaCancelled)
    ```
  </Tab>

  <Tab title="Android">
    To set up this configuration, implement the `MfaListener` interface and configure it via `MfaConfig`. When an operation requires MFA verification, the SDK will automatically call your listener's `onMfaRequired` method.

    ### Setting up the listener

    First, create a class that implements the `MfaListener` interface:

    ```kotlin MfaPromptHandler.kt theme={"system"}
    import io.privy.auth.PrivyUser
    import io.privy.auth.mfa.MfaListener

    class MfaPromptHandler(
        private val onMfaRequired: (user: PrivyUser) -> Unit
    ) : MfaListener {
        override fun onMfaRequired(user: PrivyUser) {
            // Called on the main thread - safe to show UI directly
            onMfaRequired.invoke(user)
        }
    }
    ```

    ### Configuring the MFA listener

    Configure the listener either at initialization or at runtime:

    ```kotlin Configure at initialization theme={"system"}
    import io.privy.sdk.Privy
    import io.privy.sdk.PrivyConfig
    import io.privy.auth.mfa.MfaConfig
    import kotlin.time.Duration.Companion.minutes

    val mfaHandler = MfaPromptHandler { user ->
        // Show your MFA UI
        showMfaBottomSheet(user)
    }

    val config = PrivyConfig(
        appId = "your-app-id",
        appClientId = "your-client-id",
        mfaConfig = MfaConfig(
            listener = mfaHandler,
            timeout = 5.minutes
        )
    )

    val privy = Privy.init(context, config)
    ```

    ```kotlin Configure at runtime theme={"system"}
    // You can also set the config at runtime
    val mfaHandler = MfaPromptHandler { user ->
        showMfaBottomSheet(user)
    }

    privy.mfa.setConfig(
        MfaConfig(
            listener = mfaHandler,
            timeout = 5.minutes
        )
    )
    ```

    ### Completing verification and resuming operations

    After the user completes MFA verification, you **must** call `resumeBlockedActions()` to unblock any pending wallet operations:

    ```kotlin  theme={"system"}
    // After successful MFA verification
    viewModelScope.launch {
        user.mfa.totp.verify.submit(mfaCode).onSuccess {
            privy.mfa.resumeBlockedActions()
        }.onFailure { error ->
            // Show error to user
        }
    }
    ```

    <Warning>
      If `resumeBlockedActions()` is not called within the configured timeout (default 5 minutes), the original wallet operation will fail with a timeout error.
    </Warning>

    ### Handling cancellation

    If the user cancels the MFA flow, you must still call `resumeBlockedActions` to unblock operations. Pass an error to indicate cancellation:

    ```kotlin  theme={"system"}
    // If the user cancels MFA
    privy.mfa.resumeBlockedActions(mfaError = Exception("User cancelled MFA"))
    ```
  </Tab>
</Tabs>

## Example MFA modal

<Accordion title="See a recommended abstraction for guiding users to complete MFA">
  To simplify the implementation, we recommend abstracting the logic into a self-contained component that can be used whenever the user needs to complete an MFA flow.

  For instance, you might write an `MFAModal` component that allows the user to (1) select their desired method of their enrolled MFA methods, (2) request an MFA code, and (3) submit the MFA code to Privy for verification.

  <Tabs>
    <Tab title="React">
      ```tsx Example modal for guiding users through the MFA flow theme={"system"}
      import Modal from 'react-modal';

      import {
        useMfa,
        errorIndicatesMfaVerificationFailed,
        errorIndicatesMfaMaxAttempts,
        errorIndicatesMfaTimeout,
        MfaMethod,
      } from '@privy-io/react-auth';

      type Props = {
        // List of available MFA methods that the user has enrolled in
        mfaMethods: MfaMethod[];
        // Boolean indicator to determine whether or not the modal should be open
        isOpen: boolean;
        // Helper function to open/close the modal */
        setIsOpen: (isOpen: boolean) => void;
      };

      export const MFAModal = ({mfaMethods, isOpen, setIsOpen}: Props) => {
        const {init, submit, cancel} = useMfa();
        // Stores the user's selected MFA method
        const [selectedMethod, setSelectedMethod] = useState<MfaMethod | null>(null);
        // Stores the user's MFA code
        const [mfaCode, setMfaCode] = useState('');
        // Stores the options for passkey MFA
        const [options, setOptions] = useState(null);
        // Stores an error message to display
        const [error, setError] = useState('');

        // Helper function to request an MFA code for a given method
        const onMfaInit = async (method: MfaMethod) => {
          const response = await init(method);
          setError('');
          setSelectedMethod(method);
          if (method === 'passkey') {
            setOptions(response);
          }
        };

        // Helper function to submit an MFA code to Privy for verification
        const onMfaSubmit = async () => {
          try {
            if (selectedMethod === 'passkey') {
              await submit(selectedMethod, options);
            } else {
              await submit(selectedMethod, mfaCode);
            }
            setSelectedMethod(null); // Clear the MFA flow once complete
            setIsOpen(false); // Close the modal
          } catch (e) {
            // Handling possible errors with MFA code submission
            if (errorIndicatesMfaVerificationFailed(e)) {
              setError('Incorrect MFA code, please try again.');
              // Allow the user to re-enter the code and call `submit` again
            } else if (errorIndicatesMfaMaxAttempts(e)) {
              setError('Maximum MFA attempts reached, please request a new code.');
              setSelectedMethod(null); // Clear the MFA flow to allow the user to try again
            } else if (errorIndicatesMfaTimeout(e)) {
              setError('MFA code has expired, please request a new code.');
              setSelectedMethod(null); // Clear the MFA flow to allow the user to try again
            }
          }
        };

        // Helper function to clean up state when the user closes the modal
        const onModalClose = () => {
          cancel(); // Cancel any in-progress MFA flows
          setIsOpen(false);
        };

        return (
          <Modal isOpen={isOpen} onAfterClose={onModalClose}>
            {/* Button for the user to select an MFA method and request an MFA code */}
            {mfaMethods.map((method) => (
              <button onClick={() => onMfaInit(method)}>Choose to MFA with {method}</button>
            ))}
            {/* Input field for the user to enter their MFA code and submit it */}
            {selectedMethod && selectedMethod !== 'passkey' && (
              <div>
                <p>Enter your MFA code below</p>
                <input placeholder="123456" onChange={(event) => setMfaCode(event.target.value)} />
                <button onClick={() => onMfaSubmit()}>Submit Code</button>
              </div>
            )}
            {/* Display error message if there is one */}
            {!!error.length && <p>{error}</p>}
          </Modal>
        );
      };
      ```
    </Tab>

    <Tab title="React Native">
      ```tsx Example modal for guiding users through the MFA flow theme={"system"}
      import Modal from 'react-native';

      import {
        useMfa,
        errorIndicatesMfaVerificationFailed,
        errorIndicatesMfaMaxAttempts,
        errorIndicatesMfaTimeout,
        MfaMethod,
      } from '@privy-io/expo';

      type Props = {
        // List of available MFA methods that the user has enrolled in
        mfaMethods: MfaMethod[];
        // Boolean indicator to determine whether or not the modal should be open
        isOpen: boolean;
        // Helper function to open/close the modal */
        setIsOpen: (isOpen: boolean) => void;
      };

      export const MFAModal = ({mfaMethods, isOpen, setIsOpen}: Props) => {
        const {init, submit, cancel} = useMfa();
        const [selectedMethod, setSelectedMethod] = useState<MfaMethod | null>(null);
        const [mfaCode, setMfaCode] = useState('');
        const [options, setOptions] = useState(null);
        const [error, setError] = useState('');

        const onMfaInit = async (method: MfaMethod) => {
          const response = await init({method});
          setError('');
          setSelectedMethod(method);
          if (method === 'passkey') {
            setOptions(response);
          }
        };

        const onMfaSubmit = async () => {
          try {
            if (selectedMethod === 'passkey') {
              await submit({method: selectedMethod, mfaCode: options});
            } else {
              await submit({method: selectedMethod, mfaCode});
            }
            setSelectedMethod(null);
            setIsOpen(false);
          } catch (e) {
            if (errorIndicatesMfaVerificationFailed(e)) {
              setError('Incorrect MFA code, please try again.');
            } else if (errorIndicatesMfaMaxAttempts(e)) {
              setError('Maximum MFA attempts reached, please request a new code.');
              setSelectedMethod(null);
            } else if (errorIndicatesMfaTimeout(e)) {
              setError('MFA code has expired, please request a new code.');
              setSelectedMethod(null);
            }
          }
        };

        const onModalClose = () => {
          cancel();
          setIsOpen(false);
        };

        return (
          <Modal visible={isOpen} animationType="slide" onRequestClose={onModalClose}>
            <View style={{padding: 20}}>
              {mfaMethods.map((method) => (
                <Button
                  key={method}
                  title={`Choose to MFA with ${method}`}
                  onPress={() => onMfaInit(method)}
                />
              ))}

              {selectedMethod && selectedMethod !== 'passkey' && (
                <View>
                  <Text>Enter your MFA code below</Text>
                  <TextInput
                    placeholder="123456"
                    value={mfaCode}
                    onChangeText={setMfaCode}
                    keyboardType="numeric"
                    style={{borderBottomWidth: 1, marginBottom: 10}}
                  />
                  <Button title="Submit Code" onPress={onMfaSubmit} />
                </View>
              )}

              {error.length > 0 && <Text style={{color: 'red'}}>{error}</Text>}
              <Button title="Close" onPress={onModalClose} />
            </View>
          </Modal>
        );
      };
      ```
    </Tab>

    <Tab title="Swift">
      ```swift Example view for guiding users through the MFA flow theme={"system"}
      import PrivySDK
      import SwiftUI

      struct MFAView: View {
          @Binding var isPresented: Bool
          @State private var totpCode: String = ""
          @State private var errorMessage: String?
          @State private var isVerifying = false

          let privy: Privy
          let user: PrivyUser

          var body: some View {
              VStack(spacing: 24) {
                  Text("MFA Required")
                      .font(.headline)
                  Text("Enter your 6-digit TOTP code")
                      .font(.subheadline)
                      .foregroundColor(.secondary)

                  TextField("123456", text: $totpCode)
                      .keyboardType(.numberPad)
                      .multilineTextAlignment(.center)
                      .font(.system(size: 32, weight: .bold, design: .monospaced))
                      .frame(width: 180)
                      .disabled(isVerifying)

                  if let errorMessage {
                      Text(errorMessage)
                          .font(.caption)
                          .foregroundColor(.red)
                          .multilineTextAlignment(.center)
                  }

                  HStack(spacing: 16) {
                      Button("Cancel") {
                          cancel()
                      }
                      .foregroundColor(.red)
                      .disabled(isVerifying)

                      Button {
                          submit()
                      } label: {
                          if isVerifying {
                              ProgressView()
                          } else {
                              Text("Verify")
                          }
                      }
                      .buttonStyle(.borderedProminent)
                      .disabled(totpCode.count != 6 || isVerifying)
                  }
              }
              .padding(32)
          }

          private func submit() {
              isVerifying = true
              errorMessage = nil
              let code = totpCode

              Task {
                  do {
                      try await user.mfa.totp.verify.submit(code: code)
                      await privy.mfa.resumeBlockedActions()
                      isPresented = false
                  } catch {
                      errorMessage = error.localizedDescription
                  }
                  isVerifying = false
              }
          }

          private func cancel() {
              Task {
                  await privy.mfa.resumeBlockedActions(throwing: TestAppError.mfaCancelled)
              }
              isPresented = false
          }
      }
      ```
    </Tab>

    <Tab title="Android">
      ```kotlin Example Composable for guiding users through the MFA flow theme={"system"}
      import androidx.compose.foundation.layout.*
      import androidx.compose.material3.*
      import androidx.compose.runtime.*
      import androidx.compose.ui.Alignment
      import androidx.compose.ui.Modifier
      import androidx.compose.ui.unit.dp
      import io.privy.auth.PrivyUser
      import io.privy.sdk.Privy
      import kotlinx.coroutines.launch

      @Composable
      fun MfaVerificationSheet(
          privy: Privy,
          user: PrivyUser,
          onDismiss: () -> Unit
      ) {
          var totpCode by remember { mutableStateOf("") }
          var errorMessage by remember { mutableStateOf<String?>(null) }
          var isVerifying by remember { mutableStateOf(false) }
          val scope = rememberCoroutineScope()

          Column(
              modifier = Modifier
                  .fillMaxWidth()
                  .padding(24.dp),
              horizontalAlignment = Alignment.CenterHorizontally
          ) {
              Text(
                  text = "MFA Required",
                  style = MaterialTheme.typography.headlineSmall
              )
              Spacer(modifier = Modifier.height(8.dp))
              Text(
                  text = "Enter your 6-digit TOTP code",
                  style = MaterialTheme.typography.bodyMedium
              )
              Spacer(modifier = Modifier.height(16.dp))

              OutlinedTextField(
                  value = totpCode,
                  onValueChange = { totpCode = it },
                  label = { Text("Code") },
                  enabled = !isVerifying,
                  singleLine = true
              )

              errorMessage?.let {
                  Spacer(modifier = Modifier.height(8.dp))
                  Text(text = it, color = MaterialTheme.colorScheme.error)
              }

              Spacer(modifier = Modifier.height(16.dp))
              Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                  TextButton(
                      onClick = {
                          privy.mfa.resumeBlockedActions(
                              mfaError = Exception("User cancelled")
                          )
                          onDismiss()
                      },
                      enabled = !isVerifying
                  ) {
                      Text("Cancel")
                  }
                  Button(
                      onClick = {
                          scope.launch {
                              isVerifying = true
                              errorMessage = null
                              user.mfa.totp.verify.submit(totpCode)
                                  .onSuccess {
                                      privy.mfa.resumeBlockedActions()
                                      onDismiss()
                                  }
                                  .onFailure { error ->
                                      errorMessage = error.message
                                  }
                              isVerifying = false
                          }
                      },
                      enabled = totpCode.length == 6 && !isVerifying
                  ) {
                      if (isVerifying) {
                          CircularProgressIndicator(modifier = Modifier.size(16.dp))
                      } else {
                          Text("Verify")
                      }
                  }
              }
          }
      }
      ```
    </Tab>
  </Tabs>

  Notice how the modal contains all logic for requesting the MFA code, submitting the MFA code, handling errors, and cancelling an in-progress MFA code.

  Then, when your app needs to prompt a user to complete MFA, they can simply display this `MFAModal` component (or `MFAView` in Swift) and configure it with the list of MFA methods that are available for the current user.
</Accordion>

## Catching MFA errors inline

<Tabs>
  <Tab title="React / React Native">
    The React and React Native SDKs do not support inline MFA errors, and require the listener to be set up for MFA flows.
  </Tab>

  <Tab title="Swift">
    As an alternative to registering a listener, your app can catch MFA errors directly when performing wallet operations. This approach gives you more control over when and how to prompt for MFA verification.

    When an operation requires MFA, the SDK throws a `.embeddedWalletFailure(reason: .mfaRequired)` error. Your app can catch this error, prompt the user to complete MFA, and retry the operation.

    ```swift  theme={"system"}
    func signMessageWithMfa() async {
        guard let user = privy.user else { return }
        guard let wallet = user.embeddedSolanaWallets.first else { return }

        let message = "SGVsbG8hIEkgYW0gdGhlIGJhc2U2NCBlbmNvZGVkIG1lc3NhZ2UgdG8gYmUgc2lnbmVkLg=="

        do {
            // Attempt the wallet operation
            let signature = try await wallet.provider.signMessage(message: message)
            print("Signature: \(signature)")
        } catch PrivyError.embeddedWalletFailure(reason: .mfaRequired(let user)) {
            // MFA is required - prompt user to verify
            do {
                // Show your MFA UI and collect the TOTP code
                let totpCode = await showMfaPromptAndGetCode()

                // Verify the MFA code
                try await user.mfa.totp.verify.submit(code: totpCode)

                // Retry the original operation after successful verification
                let signature = try await wallet.provider.signMessage(message: message)
                print("Signature: \(signature)")
            } catch {
                print("MFA verification failed: \(error.localizedDescription)")
            }
        } catch {
            print("Wallet operation failed: \(error.localizedDescription)")
        }
    }
    ```

    <Info>
      This inline approach works well for apps with simple MFA flows or when your app needs fine-grained control over the MFA experience. For more complex apps with multiple wallet operations, consider using the [listener approach](#registering-the-listener).
    </Info>
  </Tab>

  <Tab title="Android">
    As an alternative to registering a listener, your app can catch MFA errors directly when performing wallet operations. This approach gives you more control over when and how to prompt for MFA verification.

    When an operation requires MFA, the SDK returns a `Result.failure` with an `MfaRequiredOrInvalidException`. Your app can catch this error, prompt the user to complete MFA, and retry the operation.

    ```kotlin  theme={"system"}
    suspend fun signMessageWithMfa() {
        val user = privy.getUser() ?: return
        val wallet = user.embeddedSolanaWallets.firstOrNull() ?: return

        val message = "SGVsbG8hIEkgYW0gdGhlIGJhc2U2NCBlbmNvZGVkIG1lc3NhZ2UgdG8gYmUgc2lnbmVkLg=="

        wallet.provider.signMessage(message)
            .onSuccess { signature ->
                println("Signature: $signature")
            }
            .onFailure { error ->
                if (error is MfaRequiredOrInvalidException) {
                    // MFA is required - prompt user to verify
                    val totpCode = showMfaPromptAndGetCode()

                    user.mfa.totp.verify.submit(totpCode)
                        .onSuccess {
                            // Retry the original operation after successful verification
                            wallet.provider.signMessage(message)
                                .onSuccess { signature ->
                                    println("Signature: $signature")
                                }
                        }
                        .onFailure { mfaError ->
                            println("MFA verification failed: ${mfaError.message}")
                        }
                } else {
                    println("Wallet operation failed: ${error.message}")
                }
            }
    }
    ```

    <Info>
      This inline approach works well for apps with simple MFA flows or when your app needs fine-grained control over the MFA experience. For more complex apps with multiple wallet operations, consider using the [listener approach](#registering-the-listener).
    </Info>
  </Tab>
</Tabs>
\n