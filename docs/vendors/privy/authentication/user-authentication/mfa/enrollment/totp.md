> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# TOTP enrollment

<Info>
  Enrolling in MFA does not automatically verify the user for wallet operations. Once enrolled,
  subsequent wallet actions will require MFA verification. See the [verification
  guides](/authentication/user-authentication/mfa/verify/overview) for how to complete MFA
  verification.
</Info>

Enroll users in MFA using TOTP (Time-based One-Time Password), where they authenticate with a 6-digit code from an authenticator app like Authy or Google Authenticator.

<Tabs>
  <Tab title="React">
    ## Setup

    To enroll users in MFA with TOTP, use the `initEnrollmentWithTotp` and `submitEnrollmentWithTotp` methods returned by the `useMfaEnrollment` hook:

    ```tsx  theme={"system"}
    import {useMfaEnrollment} from '@privy-io/react-auth';

    const {initEnrollmentWithTotp, submitEnrollmentWithTotp} = useMfaEnrollment();
    ```

    ## Initiating enrollment

    First, initiate enrollment by calling Privy's `initEnrollmentWithTotp` method with no parameters. This method returns a `Promise` for an `authUrl` and `secret` that the user will need in order to complete enrollment.

    ```tsx  theme={"system"}
    const {authUrl, secret} = await initEnrollmentWithTotp();
    ```

    Then, to have the user enroll, you can either:

    * Display the TOTP `authUrl` as a QR code to the user, and prompt them to scan it with their TOTP client (commonly, a mobile app like Google Authenticator or Authy)
    * Allow the user to copy the TOTP `secret` and paste it into their TOTP client

    <Tip>
      You can directly pass in the `authUrl` from above into a library like `react-qr-code` to render the URL as a QR code to your user.
    </Tip>

    ## Completing enrollment

    Once your user has successfully scanned the QR code, an enrollment code for Privy will appear within their TOTP client. Prompt the user to enter this code in your app, and call Privy's `submitEnrollmentWithTotp` method. As a parameter, pass a JSON object with an `mfaCode` field that contains the MFA code from the user as a string.

    ```tsx  theme={"system"}
    const mfaCodeInput = 'insert-mfa-code-from-user-totp-app'; // Prompt the user for the code in their TOTP app
    await submitEnrollmentWithTotp({mfaCode: mfaCodeInput});
    ```

    <Accordion title="See an end-to-end example of enrolling users in MFA with TOTP">
      The component below serves as a reference implementation for how to enroll your users in MFA with TOTP!

      ```tsx Example enrolling a TOTP client for MFA theme={"system"}
      import {useMfaEnrollment} from '@privy-io/react-auth';
      import QRCode from 'react-qr-code';
      import {CopyableElement} from '../components/CopyableElement';

      export default function MfaEnrollmentWithTotp() {
        const {initEnrollmentWithTotp, submitEnrollmentWithTotp} = useMfaEnrollment();
        const [totpAuthUrl, setTotpAuthUrl] = useState<string | null>(null);
        const [totpSecret, setTotpSecret] = useState<string | null>(null);
        const [mfaCode, setMfaCode] = useState<string | null>(null);

        // Handler for when the user is ready to enroll in TOTP MFA
        const onGenerateTotpUrl = async () => {
          const {authUrl, secret} = await initEnrollmentWithTotp();
          setTotpAuthUrl(authUrl);
          setTotpSecret(secret);
        }

        // Handler for when the user enters the MFA code from their TOTP client
        const onEnteredMfaCode = async () => {
          await submitEnrollmentWithTotp({mfaCode: mfaCode});
          // See the error handling guide for details on how to handle errors
        }

        return(
          <div>
            {/* QR code for the user to scan */}
            {totpAuthUrl && totpSecret ?
              {/* If TOTP values have been generated... */}
              <>
                {/* ...show the user a QR code with the `authUrl` that they can scan...  */}
                <QRCode value={totpAuthUrl} />
                {/* ...or give them the option to copy the `secret` into their TOTP client  */}
                <CopyableElement value={totpSecret} />
              </> :
              {/* Else, show a button to generate the totpAuthUrl */}
              <button onClick={() => onGenerateTotpUrl()}>Show QR Code</button>
            }
            {/* Input field for the user to enter their MFA code */}
            <p>Enter the code from your authenticator app below.</p>
            <input placeholder='123456' onChange={(event) => setMfaCode(event.target.value)}/>
            <button onClick={() => submitEnrollmentWithTotp({mfaCode: mfaCode})}>Submit Enrollment Code</button>
          </div>
        );
      }
      ```
    </Accordion>
  </Tab>

  <Tab title="React Native">
    ## Setup

    To enroll users in MFA with TOTP, use the `initMfaEnrollment` and `submitMfaEnrollment` methods returned by the `useMfaEnrollment` hook:

    ```tsx  theme={"system"}
    import {useMfaEnrollment} from '@privy-io/expo';

    const {initMfaEnrollment, submitMfaEnrollment} = useMfaEnrollment();
    ```

    ## Initiating enrollment

    First, initiate enrollment by calling Privy's `initMfaEnrollment` method with a JSON parameter of `{method: 'totp'}`:

    ```tsx  theme={"system"}
    const {authUrl} = await initMfaEnrollment({method: 'totp'});
    ```

    Then, to have the user enroll, you can display the TOTP `authUrl` as a QR code to the user, and prompt them to scan it with their TOTP client.

    <Tip>
      You can directly pass in the `authUrl` from above into a library like `expo-linking` to deep link into a TOTP application for MFA.
    </Tip>

    ## Completing enrollment

    Once your user has successfully linked into their TOTP application, prompt the user to enter the code in your app, and call Privy's `submitMfaEnrollment` method:

    ```tsx  theme={"system"}
    const mfaCodeInput = 'insert-mfa-code-from-user-totp-app'; // Prompt the user for the code in their TOTP app
    await submitMfaEnrollment({method: 'totp', code: mfaCodeInput});
    ```

    <Accordion title="See an end-to-end example of enrolling users in MFA with TOTP">
      The component below serves as a reference implementation for how to enroll your users in MFA with TOTP!

      ```tsx Example enrolling a TOTP client for MFA theme={"system"}
      import {useMfaEnrollment} from '@privy-io/expo';

      export default function MfaEnrollmentWithTotp() {
        const {initMfaEnrollment, submitMfaEnrollment} = useMfaEnrollment();
        const [totpAuthUrl, setTotpAuthUrl] = useState<string | null>(null);
        const [mfaCode, setMfaCode] = useState<string | null>(null);

        // Handler for when the user is ready to enroll in TOTP MFA
        const onGenerateTotpUrl = async () => {
          const {authUrl} = await initMfaEnrollment({method: 'totp'});
          setTotpAuthUrl(authUrl);
        }

        // Handler for when the user enters the MFA code from their TOTP client
        const onMfaEnrollmentSubmit = async () => {
          await submitMfaEnrollment({method: 'totp', code: mfaCode});
          // See the error handling guide for details on how to handle errors
        }

        return(
            {/* QR code for the user to scan */}
            <YStack gap={12}>
                    <Text>TOTP MFA Enrollment</Text>
                    {
                      // Check to see if the totpAuthUrl is generated
                      !!totpAuthUrl && <Text onPress={() => Linking.openURL(totpAuthUrl)} >{totpAuthUrl}</Text>
                      <XStack gap={12}>
                        <Input
                          value={mfaCode}
                          onChangeText={setMfaCode}
                          flex={1}
                          keyboardType="number-pad"
                        />
                        {// Once the TOTP code is received in the authenticator app and input above, submit for enrollment}
                        <Button onPress={onMfaEnrollmentSubmit} flex={1}>
                          <Text>Verify OTP</Text>
                        </Button>
                      </XStack>
                    }
                  </YStack>
        );
      }
      ```
    </Accordion>
  </Tab>

  <Tab title="Swift">
    ## Initiating enrollment

    First, initiate enrollment by calling Privy's `generateSecret` method. This method returns a `TotpSecret` containing the `secret` and `authUrl` that the user will need in order to complete enrollment:

    ```swift  theme={"system"}
    guard let user = await privy.getUser() else { return }

    let totpSecret = try await user.mfa.totp.enroll.generateSecret()

    // Access the secret for manual entry
    print(totpSecret.secret)

    // Access the auth URL for QR code generation
    print(totpSecret.authUrl)
    ```

    Then, to have the user enroll, you can either:

    * Display the TOTP `authUrl` as a QR code to the user, and prompt them to scan it with their TOTP client (commonly, a mobile app like Google Authenticator or Authy)
    * Allow the user to copy the TOTP `secret` and paste it into their TOTP client

    ## Completing enrollment

    Once your user has successfully scanned the QR code or entered the secret, an enrollment code for Privy will appear within their TOTP client. Prompt the user to enter this code in your app, and call Privy's `submit` method:

    ```swift  theme={"system"}
    // Prompt the user for the code in their TOTP app
    let mfaCode = "123456"
    let updatedUser = try await user.mfa.totp.enroll.submit(code: mfaCode)

    // The updated user object will contain the newly enrolled mfaMethod
    print(updatedUser.mfaMethods)
    ```
  </Tab>

  <Tab title="Android">
    ## Initiating enrollment

    First, initiate enrollment by calling Privy's `generateSecret` method. This method returns a `TotpSecret` containing the `secret` and `authUrl` that the user will need in order to complete enrollment:

    ```kotlin  theme={"system"}
    val user = privy.getUser() ?: return

    user.mfa.totp.enroll.generateSecret()
        .onSuccess { totpSecret ->
            // Access the secret for manual entry
            println(totpSecret.secret)

            // Access the auth URL for QR code generation
            println(totpSecret.authUrl)
        }
        .onFailure { error ->
            // Handle error
        }
    ```

    Then, to have the user enroll, you can either:

    * Display the TOTP `authUrl` as a QR code to the user, and prompt them to scan it with their TOTP client (commonly, a mobile app like Google Authenticator or Authy)
    * Allow the user to copy the TOTP `secret` and paste it into their TOTP client

    ## Completing enrollment

    Once your user has successfully scanned the QR code or entered the secret, an enrollment code for Privy will appear within their TOTP client. Prompt the user to enter this code in your app, and call Privy's `submit` method:

    ```kotlin  theme={"system"}
    // Prompt the user for the code in their TOTP app
    val mfaCode = "123456"

    user.mfa.totp.enroll.submit(mfaCode)
        .onSuccess { updatedUser ->
            // The updated user object will contain the newly enrolled mfaMethod
            println(updatedUser.mfaMethods)
        }
        .onFailure { error ->
            // Handle error
        }
    ```
  </Tab>
</Tabs>
\n