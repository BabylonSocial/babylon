> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Passkey enrollment

<Info>
  Enrolling in MFA does not automatically verify the user for wallet operations. Once enrolled,
  subsequent wallet actions will require MFA verification. See the [verification
  guides](/authentication/user-authentication/mfa/verify/overview) for how to complete MFA
  verification.
</Info>

Enroll users in MFA using passkeys, where they verify with a previously registered passkey through biometric authentication on their device.

<Tip>
  In order to use passkeys as an MFA method, make sure a valid passkey is linked to the user. You
  can set this up by following the steps [here](/user-management/users/linking-accounts)!
</Tip>

<Tabs>
  <Tab title="React">
    ## Setup

    To enroll users in MFA with passkeys, use the `initEnrollmentWithPasskey` and `submitEnrollmentWithPasskey` methods returned by the `useMfaEnrollment` hook:

    ```tsx  theme={"system"}
    import {useMfaEnrollment} from '@privy-io/react-auth';

    const {initEnrollmentWithPasskey, submitEnrollmentWithPasskey} = useMfaEnrollment();
    ```

    ## Initiating enrollment

    First, initiate enrollment by calling Privy's `initEnrollmentWithPasskey` method with no parameters. This method returns a `Promise` that will resolve to `void` indicating success.

    ```tsx  theme={"system"}
    await initEnrollmentWithPasskey();
    ```

    ## Completing enrollment

    Then, to have the user enroll, you must call Privy's `submitEnrollmentWithPasskey` method with a list of the user's passkey account `credentialIds`. You can find this list by querying the `user`'s `linkedAccounts` array for all accounts of `type: 'passkey'`:

    ```tsx  theme={"system"}
    import {usePrivy} from '@privy-io/react-auth';

    const {user} = usePrivy();

    // ...

    const credentialIds = user.linkedAccounts
      .filter((account): account is PasskeyWithMetadata => account.type === 'passkey')
      .map((x) => x.credentialId);

    await submitEnrollmentWithPasskey({credentialIds});
    ```

    <Accordion title="See an end-to-end example of enrolling users in MFA with passkeys">
      The component below serves as a reference implementation for how to enroll your users in MFA with passkeys!

      ```tsx Example enrolling passkeys for MFA theme={"system"}
      import {useMfaEnrollment, usePrivy} from '@privy-io/react-auth';

      export default function MfaEnrollmentWithPasskey() {
        const {user} = usePrivy();
        const {initEnrollmentWithPasskey, submitEnrollmentWithPasskey} = useMfaEnrollment();

        const handleEnrollmentWithPasskey = async () => {
          await initEnrollmentWithPasskey();

          const credentialIds = user.linkedAccounts
            .filter((account): account is PasskeyWithMetadata => account.type === 'passkey')
            .map((x) => x.credentialId);

          await submitEnrollmentWithPasskey({credentialIds});
        };

        return (
          <div>
            <div>Enable your passkeys for MFA</div>
            {user.linkedAccounts
              .filter((account): account is PasskeyWithMetadata => account.type === 'passkey')
              .map((account) => (
                <div key={account.id}>{account.credentialId}</div>
              ))}
            <button onClick={handleEnrollmentWithPasskey}>Enroll</button>
          </div>
        );
      }
      ```
    </Accordion>
  </Tab>

  <Tab title="React Native">
    ## Setup

    To enroll users in MFA with passkeys, use the `initMfaEnrollment` and `submitMfaEnrollment` methods returned by the `useMfaEnrollment` hook:

    ```tsx  theme={"system"}
    import {useMfaEnrollment} from '@privy-io/expo';

    const {initMfaEnrollment, submitMfaEnrollment} = useMfaEnrollment();
    ```

    ## Initiating enrollment

    First, initiate enrollment by calling Privy's `initMfaEnrollment` method with a JSON parameter of `{method: 'passkey'}`:

    ```tsx  theme={"system"}
    await initMfaEnrollment({method: 'passkey'});
    ```

    ## Completing enrollment

    Then, to have the user enroll, you must call Privy's `submitMfaEnrollment` method with a list of the user's passkey account `credentialIds`:

    ```tsx  theme={"system"}
    import {usePrivy} from '@privy-io/expo';

    const {user} = usePrivy();

    // ...

    const credentialIds = user.linked_accounts
      .filter((account): account is PasskeyWithMetadata => account.type === 'passkey')
      .map((x) => x.credentialId);

    await submitMfaEnrollment({method: 'passkey', credentialIds});
    ```

    <Accordion title="See an end-to-end example of enrolling users in MFA with passkeys">
      The component below serves as a reference implementation for how to enroll your users in MFA with passkeys!

      ```tsx Example enrolling passkeys for MFA theme={"system"}
      import {useMfaEnrollment, usePrivy} from '@privy-io/expo';

      export default function MfaEnrollmentWithPasskey() {
        const {user} = usePrivy();
        const {initMfaEnrollment, submitMfaEnrollment} = useMfaEnrollment();

        const handleEnrollmentWithPasskey = async () => {
          await initMfaEnrollment({method: 'passkey'});

          const credentialIds = user.linked_accounts
            .filter((account): account is PasskeyWithMetadata => account.type === 'passkey')
            .map((x) => x.credentialId);

          await submitMfaEnrollment({method: 'passkey', credentialIds});
        };

        return (
          <YStack>
            <Text>Enable your passkeys for MFA</Text>
            {user.linkedAccounts
              .filter((account): account is PasskeyWithMetadata => account.type === 'passkey')
              .map((account) => (
                <Text>ID: {account.id} {' '} Credential ID: {account.credentialId}</Text>
              ))}
            {// Initialize and submit the passkey credentials for MFA enrollment in one step }
            <Button onPress={handleEnrollmentWithPasskey}>
              <Text>Enroll</Text>
            </Button>
          </YStack>
        );
      }
      ```
    </Accordion>
  </Tab>

  <Tab title="Swift">
    ## Enrolling passkeys

    To enroll passkeys as an MFA method, call Privy's `submit` method with the list of passkey credential IDs that should be enabled for MFA. You can find the credential IDs from the user's linked accounts:

    ```swift  theme={"system"}
    guard let user = await privy.getUser() else { return }

    // Get credential IDs from linked passkey accounts
    let credentialIds = user.linkedAccounts
        .compactMap { account -> String? in
            if case .passkey(let passkey) = account {
                return passkey.credentialId
            }
            return nil
        }

    // Submit credential IDs to complete enrollment
    let updatedUser = try await user.mfa.passkeys.enroll.submit(credentialIds: credentialIds)

    // The updated user object will contain the newly enrolled mfaMethod
    print(updatedUser.mfaMethods)
    ```
  </Tab>

  <Tab title="Android">
    ## Enrolling passkeys

    To enroll passkeys as an MFA method, call Privy's `submit` method with the list of passkey credential IDs that should be enabled for MFA. You can find the credential IDs from the user's linked accounts:

    ```kotlin  theme={"system"}
    val user = privy.getUser() ?: return

    // Get credential IDs from linked passkey accounts
    val credentialIds = user.linkedAccounts
        .filterIsInstance<LinkedAccount.Passkey>()
        .map { it.credentialId }

    // Submit credential IDs to complete enrollment
    user.mfa.passkeys.enroll.submit(credentialIds)
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