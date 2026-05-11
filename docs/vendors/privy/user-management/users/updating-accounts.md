> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Updating user accounts

<View title="React" icon="react">
  <Tabs>
    <Tab title="Email">
      To prompt users to change their email, you can use the `updateEmail` method from the `usePrivy` hook:

      ```tsx  theme={"system"}
      updateEmail: () => void
      ```

      ### Usage

      ```tsx  theme={"system"}
      import {usePrivy} from '@privy-io/react-auth';
      const {updateEmail} = usePrivy();
      ```

      When invoked, the method will open the Privy modal and guide the user through updating their existing email to a new one. If a user does not already have an email account and attempts to update it, Privy will throw an error indicating such.

      ### Example

      ```tsx  theme={"system"}
      import {usePrivy} from '@privy-io/react-auth';

      function Page() {
        const {ready, authenticated, user, updateEmail} = usePrivy();

        return (
          <button onClick={updateEmail} disabled={!ready || !authenticated || !user.email}>
            Update your email
          </button>
        );
      }
      ```

      <Info>
        In the event that a user encounters an error through the flow, their existing account will be maintained.
      </Info>
    </Tab>

    <Tab title="Phone Number">
      To prompt users to change their phone number, you can use the `updatePhone` method from the `usePrivy` hook:

      ```tsx  theme={"system"}
      updatePhone: () => void
      ```

      ### Usage

      ```tsx  theme={"system"}
      import {usePrivy} from '@privy-io/react-auth';
      const {updatePhone} = usePrivy();
      ```

      When invoked, the method will open the Privy modal and guide the user through updating their existing phone number to a new one. If a user does not already have a phone account and attempts to update it, Privy will throw an error indicating such.

      ### Example

      ```tsx  theme={"system"}
      import {usePrivy} from '@privy-io/react-auth';

      function Page() {
        const {ready, authenticated, user, updatePhone} = usePrivy();

        return (
          <button onClick={updatePhone} disabled={!ready || !authenticated || !user.phone}>
            Update your phone number
          </button>
        );
      }
      ```

      <Info>
        In the event that a user encounters an error through the flow, their existing account will be maintained.
      </Info>
    </Tab>
  </Tabs>

  ### Callbacks

  To configure callbacks for Privy's `updateEmail` and `updatePhone` methods, use the `useUpdateAccount` hook:

  ```tsx  theme={"system"}
  useUpdateAccount: ({
    onSuccess?: ({user, updateMethod, updatedAccount}) => void,
    onError?: (error, details) => void
  }) => {updateEmail: () => void, updatePhone: () => void}
  ```

  ### Usage

  ```tsx  theme={"system"}
  import {useUpdateAccount} from '@privy-io/react-auth';

  const {updateEmail, updatePhone} = useUpdateAccount({
    onSuccess: ({user, updateMethod, updatedAccount}) => {
      console.log(user, updateMethod, updatedAccount);
      // Any logic you'd like to execute if the user successfully updates an account
    },
    onError: (error, details) => {
      console.log(error, details);
      // Any logic you'd like to execute after a user exits the updateAccount flow or there is an error
    }
  });

  // Then call one of the update methods in your code, which will invoke these callbacks on completion
  ```

  ### Parameters

  The `useUpdateAccount` hook accepts an options object with the following fields:

  <ParamField path="onSuccess" type="({user: User, updateMethod: string, updatedAccount: LinkedAccountType}) => void">
    Optional callback to run after a user successfully updates an account.
  </ParamField>

  <ParamField path="onError" type="(error: string, details: {updateMethod: string}) => void">
    Optional callback to run if there is an error during the update account flow, or if the user exits the flow prematurely.
  </ParamField>

  ### Callback Details

  #### onSuccess

  If set, the `onSuccess` callback will execute after a user has successfully updated either their phone or email on their Privy account.

  Within this callback, you can access:

  <ResponseField name="user" type="User">
    The user object with the user's DID, linked accounts, and more.
  </ResponseField>

  <ResponseField name="updateMethod" type="string">
    A string indicating the type of update flow just executed for the authenticated user.
    Possible values are `'email'` or `'sms'`.
  </ResponseField>

  <ResponseField name="updatedAccount" type="LinkedAccountType">
    An object representing the account that was just updated on the authenticated user.
  </ResponseField>

  <details>
    <summary><b>See an example of using the onSuccess callback for updating an account!</b></summary>

    As an example, you might configure an `onSuccess` callback to support the following behavior:

    * If the user updates an email to their account, add the new updated email to your own Users DB.

    Below is a template for implementing the above with `onSuccess`:

    ```tsx  theme={"system"}
    const {updateEmail, updatePhone} = useUpdateAccount({
      onSuccess: ({user, updatedAccount}) => {
        if (updatedAccount === 'email') {
          // show a toast, send analytics event, etc...
        } else if (updatedAccount === 'sms') {
          // show a toast, send analytics event, etc...
        }
      }
    });
    ```
  </details>

  #### onError

  If set, the `onError` callback will execute after a user initiates an update account attempt and there is an error, or if the user exits the update account flow prematurely.

  Within this callback, you can access:

  <ResponseField name="error" type="string">
    The error code with more information about the error.
  </ResponseField>

  <ResponseField name="details.updateMethod" type="string">
    A string indicating the type of update account flow just attempted for the authenticated user.
  </ResponseField>
</View>

<View title="React Native" icon="react">
  <Tabs>
    <Tab title="Email">
      To update a user's email, use the `useUpdateEmail` hook:

      ```tsx  theme={"system"}
      const {sendCode, updateEmail} = useUpdateEmail();
      ```

      ### Send an OTP

      First, use the `sendCode` method to send an OTP verification code to the user's new email address:

      ```tsx  theme={"system"}
      sendCode: ({newEmailAddress: string}) => Promise<void>
      ```

      ### Usage

      ```tsx  theme={"system"}
      import {useUpdateEmail} from '@privy-io/expo';
      const {sendCode} = useUpdateEmail();
      ```

      ### Parameters

      <ParamField path="newEmailAddress" type="string">
        The new email address to be validated.
      </ParamField>

      This will send a one-time passcode to the new email address, which the user will need to enter to verify it and confirm the update.
      The method returns a `Promise` that resolves if the code was sent successfully, and rejects otherwise.

      ### Example

      ```tsx  theme={"system"}
      import {useUpdateEmail} from '@privy-io/expo';

      function UpdateEmailForm() {
        const {sendCode} = useUpdateEmail();

        const [newEmailAddress, setNewEmailAddress] = useState('');

        return (
          <View>
            <Input value={newEmailAddress} onChangeText={setNewEmailAddress} />
            <Button onPress={() => sendCode({newEmailAddress})}>Send code</Button>
          </View>
        );
      }
      ```

      ### Verify the OTP

      Prompt the user for the OTP they received and verify the OTP by passing it to the `updateEmail` method:

      ```tsx  theme={"system"}
      updateEmail: ({newEmailAddress: string, code: string}) => Promise<User>
      ```

      ### Usage

      ```tsx  theme={"system"}
      import {useUpdateEmail} from '@privy-io/expo';
      const {updateEmail} = useUpdateEmail();
      ```

      ### Parameters

      <ParamField path="newEmailAddress" type="string">
        The new email address to set.
      </ParamField>

      <ParamField path="code" type="string">
        The one time code received on the new email address.
      </ParamField>

      ### Returns

      <ResponseField name="user" type="Promise<User>">
        A `Promise` that resolves with the updated user object if the update was successful, and rejects otherwise.
      </ResponseField>

      ### Example

      ```tsx  theme={"system"}
      import {useUpdateEmail} from '@privy-io/expo';

      function ConfirmEmailUpdateForm() {
        const {updateEmail} = useUpdateEmail();

        const [code, setCode] = useState('');

        return (
          <View>
            <Input value={code} onChangeText={setCode} />
            <Button onPress={() => updateEmail({code, newEmailAddress})}>Confirm</Button>
          </View>
        );
      }
      ```
    </Tab>

    <Tab title="Phone Number">
      To update a user's phone number, use the `useUpdatePhone` hook:

      ```tsx  theme={"system"}
      const {sendCode, updatePhone} = useUpdatePhone();
      ```

      ### Send an OTP

      First, use the `sendCode` method to send an OTP verification code to the user's new phone number:

      ```tsx  theme={"system"}
      sendCode: ({newPhoneNumber: string}) => Promise<void>
      ```

      ### Usage

      ```tsx  theme={"system"}
      import {useUpdatePhone} from '@privy-io/expo';
      const {sendCode} = useUpdatePhone();
      ```

      ### Parameters

      <ParamField path="newPhoneNumber" type="string">
        The new phone number to be validated.
      </ParamField>

      This will send a one-time passcode to the new phone number, which the user will need to enter to verify it and confirm the update.
      The method returns a `Promise` that resolves if the code was sent successfully, and rejects otherwise.

      ### Example

      ```tsx  theme={"system"}
      import {useUpdatePhone} from '@privy-io/expo';

      function UpdatePhoneForm() {
        const {sendCode} = useUpdatePhone();

        const [newPhoneNumber, setNewPhoneNumber] = useState('');

        return (
          <View>
            <Input value={newPhoneNumber} onChangeText={setNewPhoneNumber} />
            <Button onPress={() => sendCode({newPhoneNumber})}>Send code</Button>
          </View>
        );
      }
      ```

      ### Verify the OTP

      Prompt the user for the OTP they received and verify the OTP by passing it to the `updatePhone` method:

      ```tsx  theme={"system"}
      updatePhone: ({newPhoneNumber: string, code: string}) => Promise<User>
      ```

      ### Usage

      ```tsx  theme={"system"}
      import {useUpdatePhone} from '@privy-io/expo';
      const {updatePhone} = useUpdatePhone();
      ```

      ### Parameters

      <ParamField path="newPhoneNumber" type="string">
        The new phone number to set.
      </ParamField>

      <ParamField path="code" type="string">
        The one time code received on the new phone number.
      </ParamField>

      ### Returns

      <ResponseField name="user" type="Promise<User>">
        A `Promise` that resolves with the updated user object if the update was successful, and rejects otherwise.
      </ResponseField>

      ### Example

      ```tsx  theme={"system"}
      import {useUpdatePhone} from '@privy-io/expo';

      function ConfirmPhoneUpdateForm() {
        const {updatePhone} = useUpdatePhone();

        const [code, setCode] = useState('');

        return (
          <View>
            <Input value={code} onChangeText={setCode} />
            <Button onPress={() => updatePhone({code, newPhoneNumber})}>Confirm</Button>
          </View>
        );
      }
      ```
    </Tab>
  </Tabs>
</View>

<View title="Swift" icon="swift">
  <Tabs>
    <Tab title="Email">
      To update a user's email, use the `privy.email.updateWithCode` method:

      ```swift  theme={"system"}
      updateWithCode(_ code: String, sentTo email: String) async throws
      ```

      ## Send an OTP

      First, use the `sendCode` method to send an OTP verification code to the user's new email address:

      ```swift  theme={"system"}
      sendCode(to email: String) async throws
      ```

      ### Usage

      ```swift  theme={"system"}
      try await privy.email.sendCode(to: "newemail@privy.io")
      // successfully sent code to user's new email
      ```

      ### Parameters

      <ParamField path="to email" type="string">
        The new email address to be validated.
      </ParamField>

      This will send a one-time passcode to the new email address,
      which the user will need to enter to verify it and confirm the
      update.

      ## Verify the OTP

      Prompt the user for the OTP they received and verify the OTP by
      passing it to the `updateWithCode` method:

      ```swift  theme={"system"}
      updateWithCode(_ code: String, sentTo email: String) async throws
      ```

      ### Usage

      ```swift  theme={"system"}
      try await privy.email.updateWithCode("123456", sentTo: "newemail@privy.io")
      ```

      ### Parameters

      <ParamField path="_ code" type="string">
        The one time code received on the new email address.
      </ParamField>

      <ParamField path="sentTo email" type="string">
        The new email address to set.
      </ParamField>
    </Tab>

    <Tab title="Phone Number">
      To update a user's phone number, use the `privy.sms.updateWithCode` method:

      ```swift  theme={"system"}
      updateWithCode(_ code: String, sentTo phoneNumber: String) async throws
      ```

      ## Send an OTP

      First, use the `sendCode` method to send an OTP verification code to the user's new phone number:

      ```swift  theme={"system"}
      sendCode(to phoneNumber: String) async throws
      ```

      ### Usage

      ```swift  theme={"system"}
      try await privy.sms.sendCode(to: "+1234567890")
      // successfully sent code to user's new phone number
      ```

      ### Parameters

      <ParamField path="to phoneNumber" type="string">
        The new phone number to be validated.
      </ParamField>

      This will send a one-time passcode to the new phone number,
      which the user will need to enter to verify it and confirm the
      update.

      ## Verify the OTP

      Prompt the user for the OTP they received and verify the OTP by
      passing it to the `updateWithCode` method:

      ```swift  theme={"system"}
      updateWithCode(_ code: String, sentTo phoneNumber: String) async throws
      ```

      ### Usage

      ```swift  theme={"system"}
      try await privy.sms.updateWithCode("123456", sentTo: "+1234567890")
      ```

      ### Parameters

      <ParamField path="_ code" type="string">
        The one time code received on the new phone number.
      </ParamField>

      <ParamField path="sentTo phoneNumber" type="string">
        The new phone number to set.
      </ParamField>
    </Tab>
  </Tabs>
</View>

<View title="Android" icon="android">
  <Tabs>
    <Tab title="Email">
      To update a user's email, use the `privy.email.updateWithCode` method:

      ```kotlin  theme={"system"}
      suspend fun updateWithCode(code: String, email: String): Result<Unit>
      ```

      ## Send an OTP

      First, use the `sendCode` method to send an OTP verification code to the user's new email address:

      ```kotlin  theme={"system"}
      suspend fun sendCode(email: String): Result<Unit>
      ```

      ### Usage

      ```kotlin  theme={"system"}
      privy.email.sendCode(email = "newemail@privy.io").fold(
          onSuccess = {
              // Successfully sent code to user's new email address
          },
          onFailure = { error ->
              // Handle error
          }
      )
      ```

      ### Parameters

      <ParamField path="email" type="String">
        The new email address to be validated.
      </ParamField>

      This will send a one-time passcode to the new email address, which the user will need to enter to verify it and confirm the update.

      ## Verify the OTP

      Prompt the user for the OTP they received and verify the OTP by passing it to the `updateWithCode` method:

      ```kotlin  theme={"system"}
      suspend fun updateWithCode(code: String, email: String): Result<Unit>
      ```

      ### Usage

      ```kotlin  theme={"system"}
      privy.email.updateWithCode(code = "123456", email = "newemail@privy.io").fold(
          onSuccess = {
              // Email address successfully updated
          },
          onFailure = { error ->
              // Handle error
          }
      )
      ```

      ### Parameters

      <ParamField path="code" type="String">
        The one time code received on the new email address.
      </ParamField>

      <ParamField path="email" type="String">
        The new email address to set.
      </ParamField>
    </Tab>

    <Tab title="Phone Number">
      To update a user's phone number, use the `privy.sms.updateWithCode` method:

      ```kotlin  theme={"system"}
      suspend fun updateWithCode(code: String, phoneNumber: String): Result<Unit>
      ```

      ## Send an OTP

      First, use the `sendCode` method to send an OTP verification code to the user's new phone number:

      ```kotlin  theme={"system"}
      suspend fun sendCode(phoneNumber: String): Result<Unit>
      ```

      ### Usage

      ```kotlin  theme={"system"}
      privy.sms.sendCode(phoneNumber = "+15551234567").fold(
          onSuccess = {
              // Successfully sent code to user's new phone number
          },
          onFailure = { error ->
              // Handle error
          }
      )
      ```

      ### Parameters

      <ParamField path="phoneNumber" type="String">
        The new phone number to be validated.
      </ParamField>

      This will send a one-time passcode to the new phone number, which the user will need to enter to verify it and confirm the update.

      ## Verify the OTP

      Prompt the user for the OTP they received and verify the OTP by passing it to the `updateWithCode` method:

      ```kotlin  theme={"system"}
      suspend fun updateWithCode(code: String, phoneNumber: String): Result<Unit>
      ```

      ### Usage

      ```kotlin  theme={"system"}
      privy.sms.updateWithCode(code = "123456", phoneNumber = "+15551234567").fold(
          onSuccess = {
              // Phone number successfully updated
          },
          onFailure = { error ->
              // Handle error
          }
      )
      ```

      ### Parameters

      <ParamField path="code" type="String">
        The one time code received on the new phone number.
      </ParamField>

      <ParamField path="phoneNumber" type="String">
        The new phone number to set.
      </ParamField>
    </Tab>
  </Tabs>
</View>
\n