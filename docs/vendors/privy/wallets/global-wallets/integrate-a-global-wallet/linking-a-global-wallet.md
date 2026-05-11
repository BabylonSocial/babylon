> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# null

<View title="React" icon="react">
  To prompt users to link their embedded wallet from a provider app, use the `linkCrossAppAccount` method from the `useCrossAppAccounts` hook:

  ```tsx  theme={"system"}
  import {usePrivy} from '@privy-io/react-auth';

  function Button() {
    const {ready, authenticated} = usePrivy();
    const {linkCrossAppAccount} = useCrossAppAccounts();

    return (
      <button
        onClick={() => linkCrossAppAccount({appId: 'insert-provider-app-id'})}
        disabled={!ready || !authenticated}
      >
        Link your [insert-provider-app-name] account
      </button>
    );
  }
  ```

  ## Parameters

  <ParamField path="appId" type="string" required>
    The Privy app ID of the provider app from which you'd like a user to link their account. You can
    find a list of Privy app IDs for provider apps in the **Cross-app ecosystem** page of the Privy
    Dashboard.
  </ParamField>

  ## Behavior

  When `linkCrossAppAccount` is invoked, the user will be redirected to a page hosted on the domain of the provider app you specified to authorize access to your own app.

  If the user successfully authorizes access, the user will be redirected back to your app, and an account of `type: 'cross_app'` will be added to the `linkedAccounts` array of their `user` object.

  `linkCrossAppAccount` will throw an error if:

  * The user does not authorize access to your app or exits the flow prematurely.
  * The provider app you request has not opted-in to share their wallets.
  * The user is not `authenticated` and thus cannot link an account from the provider app to an existing account within your requester's app.

  <tip>
    If the user is already logged in on the domain of the source `appId` you specify in
    `linkCrossAppAccount`, they will not have to login again and will only have to consent to sharing
    access to that account in your app.
  </tip>
</View>

<View title="React Native" icon="react">
  To prompt users to link their embedded wallet from a provider app, use the `linkWithCrossApp` method from the `useLinkWithCrossApp` hook:

  ```tsx  theme={"system"}
  import {usePrivy, useLinkWithCrossApp} from '@privy-io/expo';

  function LinkWithCrossAppButton() {
    const {isReady, user} = usePrivy();
    const {linkWithCrossApp} = useLinkWithCrossApp();

    return (
      <Button
        onPess={() => linkWithCrossApp({appId: 'insert-provider-app-id'})}
        disabled={!ready || !!user}
      >
        Link your [insert-provider-app-name] account
      </Button>
    );
  }
  ```

  ## Parameters

  <ParamField path="appId" type="string" required>
    The Privy app ID of the provider app from which you'd like a user to link their account. You can
    find a list of Privy app IDs for provider apps in the **Cross-app ecosystem** page of the Privy
    Dashboard.
  </ParamField>

  <ParamField path="redirectUri" type="string">
    A URL path that the provider will automatically redirect to after successful authentication. This
    defaults to a link back to your app root, eg. `'/'`, if not provided.
  </ParamField>

  ## Behavior

  When `linkWithCrossApp` is invoked, the user will be redirected to a page hosted on the domain of the provider app you specified to authorize access to your own app.

  If the user successfully authorizes access, the user will be redirected back to your app, and an account of `type: 'cross_app'` will be added to the `linked_accounts` array of their `user` object.

  `linkWithCrossApp` will throw an error if:

  * The user does not authorize access to your app or exits the flow prematurely.
  * The provider app you request has not opted-in to share their wallets.
  * The user is not `authenticated` and thus cannot link an account from the provider app to an existing account within your requester's app.

   
</View>
\n