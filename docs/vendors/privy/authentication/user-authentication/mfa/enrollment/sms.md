> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# SMS enrollment

<Info>
  Enrolling in MFA does not automatically verify the user for wallet operations. Once enrolled,
  subsequent wallet actions will require MFA verification. See the [verification
  guides](/authentication/user-authentication/mfa/verify/overview) for how to complete MFA
  verification.
</Info>

Enroll users in MFA using SMS, where they authenticate with a 6-digit code sent to their phone number.

<Info>
  If your app has enabled SMS as a possible *login* method, users will **not** be able to enroll SMS as a valid *MFA* method.

  SMS must either be used as a login method to secure user accounts, or as an MFA method for additional security on the users' wallets, but cannot be used for both.
</Info>

<Tabs>
  <Tab title="React">
    ## Setup

    To enroll users in MFA with SMS, use the `initEnrollmentWithSms` and `submitEnrollmentWithSms` methods returned by the `useMfaEnrollment` hook:

    ```tsx  theme={"system"}
    import {useMfaEnrollment} from '@privy-io/react-auth';

    const {initEnrollmentWithSms, submitEnrollmentWithSms} = useMfaEnrollment();
    ```

    ## Initiating enrollment

    First, prompt your user to enter the phone number they'd like to use for MFA. Then, call Privy's `initEnrollmentWithSms` method. As a parameter, pass a JSON object with a `phoneNumber` field that contains the user's provided phone number as a string.

    ```tsx  theme={"system"}
    // Prompt the user for their phone number
    const phoneNumberInput = 'insert-phone-number-from-user';
    // Send an enrollment code to their phone number
    await initEnrollmentWithSms({phoneNumber: phoneNumberInput});
    ```

    Once `initEnrollmentWithSms` is called with a valid phone number, Privy will send a 6-digit MFA enrollment code to the provided number. This method returns a `Promise` that will resolve to `void` if the code was successfully sent, or will reject with an `error` if there was an error sending the code (e.g. invalid phone number).

    ## Completing enrollment

    Next, prompt the user to enter the 6-digit code that was sent to their phone number, and use the `submitEnrollmentWithSms` method to complete enrollment. As a parameter, you must pass a JSON object with both the original `phoneNumber` that the user enrolled, and the `mfaCode` they received at that number.

    ```tsx  theme={"system"}
    // Prompt the user for the code sent to their phone number
    const mfaCodeInput = 'insert-mfa-code-received-by-user';
    await submitEnrollmentWithSms({
      phoneNumber: phoneNumberInput, // From above
      mfaCode: mfaCodeInput,
    });
    ```

    <Accordion title="See an end-to-end example of enrolling users in MFA with SMS">
      The component below serves as a reference implementation for how to enroll your users in MFA with SMS!

      ```tsx Example enrolling a phone number for MFA theme={"system"}
      import {useMfaEnrollment} from '@privy-io/react-auth';

      export default function MfaEnrollmentWithSms() {
        const {initEnrollmentWithSms, submitEnrollmentWithSms} = useMfaEnrollment();

        const [phoneNumber, setPhoneNumber] = useState<string | null>(null);
        const [mfaCode, setMfaCode] = useState<string | null>(null);
        const [pendingMfaCode, setPendingMfaCode] = useState<boolean>(false);

        // Handler for when the user enters their phone number to enroll in MFA.
        const onEnteredPhoneNumber = () => {
          await initEnrollmentWithSms({phoneNumber: phoneNumber}); // Sends an MFA code to the `phoneNumber`
          setPendingMfaCode(true);
        }

        // Handler for when the user enters the MFA code sent to their phone number.
        const onEnteredMfaCode = () => {
          await submitEnrollmentWithSms({phoneNumber: phoneNumber, mfaCode: mfaCode});
          // See the error handling guide for details on how to handle errors
          setPendingMfaCode(false);
        }

        // If no MFA code has been sent yet, prompt the user for their phone number to enroll
        if (!pendingMfaCode) {
          // Input field for the user to enter the phone number they'd like to enroll for MFA
          return <>
            <input placeholder='(555) 555 5555' onChange={(event) => setPhoneNumber(event.target.value)}/>
            <button onClick={onEnteredPhoneNumber}>Enroll a Phone with MFA</button>
          </>;
        }

        // Input field for the user to enter the MFA code sent to their phone number
        return <>
          <input placeholder='123456' onChange={(event) => setMfaCode(event.target.value)}/>
          <button onClick={onEnteredMfaCode}>Submit Enrollment Code</button>
        </>;
      }
      ```
    </Accordion>
  </Tab>

  <Tab title="React Native">
    ## Setup

    To enroll users in MFA with SMS, use the `initMfaEnrollment` and `submitMfaEnrollment` methods returned by the `useMfaEnrollment` hook:

    ```tsx  theme={"system"}
    import {useMfaEnrollment} from '@privy-io/expo';

    const {initMfaEnrollment, submitMfaEnrollment} = useMfaEnrollment();
    ```

    ## Initiating enrollment

    First, prompt your user to enter the phone number they'd like to use for MFA. Then, call Privy's `initMfaEnrollment` method with the appropriate parameters:

    ```tsx  theme={"system"}
    // Prompt the user for their phone number
    const phoneNumberInput = 'insert-phone-number-from-user';
    // Send an enrollment code to their phone number
    await initMfaEnrollment({method: 'sms', phoneNumber: phoneNumberInput});
    ```

    Once `initMfaEnrollment` is called with a valid phone number, Privy will send a 6-digit MFA enrollment code to the provided number.

    ## Completing enrollment

    Next, prompt the user to enter the 6-digit code that was sent to their phone number, and use the `submitMfaEnrollment` method to complete enrollment:

    ```tsx  theme={"system"}
    // Prompt the user for the code sent to their phone number
    const mfaCodeInput = 'insert-mfa-code-received-by-user';
    await submitMfaEnrollment({
      method: 'sms',
      phoneNumber: phoneNumberInput, // From above
      code: mfaCodeInput,
    });
    ```

    <Accordion title="See an end-to-end example of enrolling users in MFA with SMS">
      The component below serves as a reference implementation for how to enroll your users in MFA with SMS!

      ```tsx Example enrolling a phone number for MFA theme={"system"}
      import {useMfaEnrollment} from '@privy-io/expo';

      export default function MfaEnrollmentWithSms() {
        const {initMfaEnrollment, submitMfaEnrollment} = useMfaEnrollment();

        const [phoneNumber, setPhoneNumber] = useState<string | null>(null);
        const [mfaCode, setMfaCode] = useState<string | null>(null);
        const [pendingMfaCode, setPendingMfaCode] = useState<boolean>(false);

        // Handler for when the user enters their phone number to enroll in MFA.
        const onEnteredPhoneNumber = () => {
          await initMfaEnrollment({method: 'sms', phoneNumber: phoneNumber}); // Sends an MFA code to the `phoneNumber`
          setPendingMfaCode(true);
        }

        // Handler for when the user enters the MFA code sent to their phone number.
        const onEnteredMfaCode = () => {
          await submitMfaEnrollment({method: 'sms', phoneNumber: phoneNumber, code: mfaCode});
          // See the error handling guide for details on how to handle errors
          setPendingMfaCode(false);
        }

        // If no MFA code has been sent yet, prompt the user for their phone number to enroll
        if (!pendingMfaCode) {
          // Input field for the user to enter the phone number they'd like to enroll for MFA
          return (
            <YStack gap={12}>
              <Input value={phoneNumber}
                onChangeText={setPhoneNumber}
                flex={1}
                keyboardType="number-pad"
              />
              <Button onPress={onEnteredPhoneNumber} flex={1}>
                <Text>Enroll a Phone with MFA</Text>
              </Button>
            </YStack>
          )
        }

        // Input field for the user to enter the MFA code sent to their phone number
        return
        <>
          <Input value={mfaCode} onChangeText={setMfaCode}/>
          <Button onPress={onEnteredMfaCode}><Text>Submit Enrollment Code</Text></Button>
        </>;
      }
      ```
    </Accordion>
  </Tab>

  <Tab title="Swift">
    ## Initiating enrollment

    First, prompt your user to enter the phone number they'd like to use for MFA. Then, call Privy's `sendCode` method with the user's phone number:

    ```swift  theme={"system"}
    guard let user = await privy.getUser() else { return }

    // Prompt the user for their phone number
    let phoneNumber = "+15555555555"
    // Send an enrollment code to their phone number
    try await user.mfa.sms.enroll.sendCode(to: phoneNumber)
    ```

    Once `sendCode` is called with a valid phone number, Privy will send a 6-digit MFA enrollment code to the provided number. The method throws if there was an error sending the code (e.g. invalid phone number).

    ## Completing enrollment

    Next, prompt the user to enter the 6-digit code that was sent to their phone number, and use the `submit` method to complete enrollment. You must pass both the `code` that the user entered and the `phoneNumber` it was sent to:

    ```swift  theme={"system"}
    // Prompt the user for the code sent to their phone number
    let mfaCode = "123456"
    let updatedUser = try await user.mfa.sms.enroll.submit(code: mfaCode, sentTo: phoneNumber)

    // The updated user object will contain the newly enrolled mfaMethod
    print(updatedUser.mfaMethods)
    ```
  </Tab>

  <Tab title="Android">
    ## Initiating enrollment

    First, prompt your user to enter the phone number they'd like to use for MFA. Then, call Privy's `sendCode` method with the user's phone number:

    ```kotlin  theme={"system"}
    val user = privy.getUser() ?: return

    // Prompt the user for their phone number
    val phoneNumber = "+15555555555"

    // Send an enrollment code to their phone number
    user.mfa.sms.enroll.sendCode(phoneNumber)
        .onSuccess {
            // Code sent successfully, show input for verification code
        }
        .onFailure { error ->
            // Handle error (e.g. invalid phone number)
        }
    ```

    Once `sendCode` is called with a valid phone number, Privy will send a 6-digit MFA enrollment code to the provided number. The method returns a `Result` that indicates success or failure.

    ## Completing enrollment

    Next, prompt the user to enter the 6-digit code that was sent to their phone number, and use the `submit` method to complete enrollment. You must pass both the `code` that the user entered and the `phoneNumber` it was sent to:

    ```kotlin  theme={"system"}
    // Prompt the user for the code sent to their phone number
    val mfaCode = "123456"

    user.mfa.sms.enroll.submit(mfaCode, phoneNumber)
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