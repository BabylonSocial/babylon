> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Use signers

Once your user's have signers added on their wallets, your app can take actions on their behalf. This is done by sending requests to the Privy API to sign transactions with the user's wallet. Follow the guide below to get started with signing transactions on behalf of users.

## Requesting signatures

Wallets provisioned with signers can be used to transact and sign messages on behalf of a user from your server.

To get started, configure the [NodeJS SDK](/basics/nodeJS/setup) or the [REST API](/basics/rest-api/setup). This is how your application will make requests to the Privy API to sign transactions on behalf of users. The signing key you configured in the dashboard is the authorization signing key used to produce authorization signatures when submitting requests.

Once you have configured the NodeJS SDK or REST API, your application can send or sign transactions from a users wallet. Follow the NodeJS or REST API guides in the `Using wallets` section to learn more about signing requests with wallets.

## Getting wallets

From your server, you can query Privy to determine what wallets have been provisioned signers by a given user to allow your app to take actions on their behalf.

<View title="NodeJS" icon="node-js">
  Use the Privy client's `_get` method on the users interface to get the user object for your user. As a parameter to this method, pass the user's ID as a `string`:

  ```tsx  theme={"system"}
  const user = await privy.users()._get('insert-user-did');
  ```

  To get a list of the user's wallets, find all of the user's wallets from the user's linked accounts. Filter the `user.linkedAccounts` array for wallet entries with `type: 'wallet'`:

  ```tsx  theme={"system"}
  const walletsWithSessionSigners = user.linked_accounts.filter(
    (account) => account.type === 'wallet' && 'id' in account && account.delegated
  );
  ```

  This constitutes the user's wallets with any added signers. Wallets with signers will always have the `delegated` flag set to `true`.

  For wallets included in this array, your app may make requests to Privy to execute actions on behalf of the user.
</View>

<View title="NodeJS (server-auth)" icon="node-js">
  <Warning>
    The `@privy-io/server-auth` library is deprecated. We recommend integrating `@privy-io/node` for
    the latest features and support.
  </Warning>

  Use the Privy client's `getUser` method to get the user object for your user. As a parameter to this method, pass the user's DID as a `string`:

  ```tsx  theme={"system"}
  const user = await client.getUser({identityToken});
  ```

  To get a list of the user's wallets with signers, first find all of the user's embedded wallets from the user's linked accounts. Filter the `user.linkedAccounts` array for wallet entries with `type: 'wallet'` and `delegated: true`:

  ```tsx  theme={"system"}
  // The `WalletWithMetadata` type can be imported from '@privy-io/server-auth'
  const walletsWithSessionSigners = user.linkedAccounts.filter(
    (account): account is WalletWithMetadata =>
      account.type === 'wallet' && account.delegated === true
  );
  ```

  This constitutes the user's wallets with signers. Wallets with signers will always have the `delegated` flag set to `true`.

  For wallets included in this array, your app may make requests to Privy to execute actions on behalf of the user.
</View>

<View title="REST API" icon="terminal">
  Make a `GET` request to:

  ```bash  theme={"system"}
  https://auth.privy.io/api/v1/users/<user-did>
  ```

  Replace `<did>` with your desired Privy DID. It should have the format `did:privy:XXXXXX`.

  Below is a sample cURL command for this request:

  ```bash  theme={"system"}
  curl --request GET https://auth.privy.io/api/v1/users/<user-did> \
  -u "<your-privy-app-id>:<your-privy-app-secret>" \
  -H "privy-app-id: <your-privy-app-id>"
  ```

  Then, to get a list of the user's delegated wallets, inspect the `linked_accounts` field of the response body for all entries with the fields `type: 'wallet'` and `delegated: true`.
</View>
\n