> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# null

<View title="React" icon="react">
  To prompt users to log into your app with an account from a provider app, use the `loginWithCrossAppAccount` method from the `useCrossAppAccounts` hook:

  ```tsx {5,9} theme={"system"}
  import {usePrivy, useCrossAppAccounts} from '@privy-io/react-auth';

  function Button() {
    const {ready, authenticated} = usePrivy();
    const {loginWithCrossAppAccount} = useCrossAppAccounts();

    return (
      <button
        onClick={() => loginWithCrossAppAccount({appId: 'insert-provider-app-id'})}
        disabled={!ready || !authenticated}
      >
        Log in with [insert-provider-app-name]
      </button>
    );
  }
  ```

  ### Parameters

  <ParamField path="appId" type="string" required>
    The Privy app ID of the provider app from which you'd like a user to link their account. You can
    find a list of Privy app IDs for provider apps in the **Cross-app ecosystem** page of the Privy
    Dashboard.
  </ParamField>

  ### Behavior

  When `loginWithCrossAppAccount` is invoked, the user will be redirected to a page hosted on the domain of the provider app you specified to authorize access to your own app.

  If the user successfully authorizes access, the user will be redirected back to your app, and an account of `type: 'cross_app'` will be added to the `linkedAccounts` array of their `user` object.

  `loginWithCrossAppAccount` will throw an error if:

  * The user does not authorize access to your app or exits the flow prematurely.
  * The provider app you request has not opted-in to share their wallets.
  * The user does not already have an account with the provider app.

  <Tip>
    If the user is already logged in on the domain of the source `appId` you specify in
    `loginWithCrossAppAccount`, they will not have to login again and will only have to consent to
    sharing access to that account in your app.
  </Tip>

  ## Using the Privy login modal

  You can add any provider app to the list of login options in the Privy login modal by adding `"privy:"` + the provider's app ID to `loginMethodsAndOrder` or the `loginMethods` array in the Privy SDK configuration.

  <CodeGroup>
    ```tsx loginMethodsAndOrder theme={"system"}
      <PrivyProvider
        appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || ""}
        config={{
          loginMethodsAndOrder: {
            primary: ['email', 'google', 'privy:insert-provider-app-id'],
          },
          ...
        }}
      >
    ```

    ```tsx loginMethods theme={"system"}
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || ""}
      config={{
        loginMethods: ['email', 'google', 'privy:insert-provider-app-id'],
        ...
      }}
    >
    ```
  </CodeGroup>
</View>

<View title="React Native" icon="react">
  To prompt users to log into your app with an account from a provider app, use the `loginWithCrossApp` method from the `useLoginWithCrossApp` hook:

  ```tsx  theme={"system"}
  import {usePrivy, useLoginWithCrossApp} from '@privy-io/expo';

  function LoginWithCrossAppButton() {
    const {ready, user} = usePrivy();
    const {loginWithCrossApp} = useLoginWithCrossApp();

    return (
      <Button
        onPress={() => loginWithCrossApp({appId: 'insert-provider-app-id'})}
        disabled={!ready || !!user}
      >
        Log in with [insert-provider-app-name]
      </Button>
    );
  }
  ```

  <ParamField path="appId" type="string" required>
    The Privy app ID of the provider app from which you'd like a user to link their account. You can
    find a list of Privy app IDs for provider apps in the **Cross-app ecosystem** page of the Privy
    Dashboard.
  </ParamField>

  <ParamField path="redirectUri" type="string">
    A URL path that the provider will automatically redirect to after successful authentication. This
    defaults to a link back to your app root, eg. `'/'`, if not provided.
  </ParamField>

  When `loginWithCrossApp` is invoked, an in-app browser will open for a page hosted on the domain of
  the provider app you specified to authorize access to your own app.

  If the user successfully authorizes access, the user will be redirected back to your app, and an account of `type: 'cross_app'` will be added to the `linked_accounts` array of their `user` object.

  `loginWithCrossApp` will throw an error if:

  * The user does not authorize access to your app or exits the flow prematurely.
  * The provider app you request has not opted-in to share their wallets.
  * The user does not already have an account with the provider app.

  <Tip>
    If the user is already logged in on the domain of the target `appId` you specify in `loginWithCrossApp`, they will not have to login again and will only have to consent to sharing access to that account in your app.
  </Tip>
</View>

## Using the access token

Once the user has authenticated with the provider app. You can get their access token for making requests directly to the provider app using `useGetAccessTokenForProvider`.

```tsx {4,8-13} theme={"system"}
import {useGetAccessTokenForProvider} from '@privy-io/react-auth';

function Button() {
  const {getAccessTokenForProvider} = useGetAccessTokenForProvider();

  return (
    <button
      onClick={async () => {
        const {token} = await getAccessTokenForProvider();
        if (token) {
          const res = await getDataFromProviderApp(token);
        }
      }}
    >
      Make API request to provider
    </button>
  );
}
```
\n