> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Server-side user wallets

Privy enables creating **self-custodial** wallets for your users that can be used from your servers.

Privy enforces self-custody of the wallet by requiring a valid access token from the user for any wallet actions, ensuring the user is authenticated in your app. This guarantees that the **user must be in the loop** for any transaction invoked by your server.

At a high-level, you can create self-custodial wallets that can be used from your servers by:

<Steps>
  <Step title="Configure authentication settings">
    Configure the authentication settings from your existing authentication provider in the Privy
    Dashboard. Privy will use these settings to verify a user's access token.
  </Step>

  <Step title="Create your user">
    [Create a user](/user-management/migrating-users-to-privy/create-or-import-a-user) user in Privy
    using the user ID from your authentication provider. This user will be assigned as the owner of
    their wallet.
  </Step>

  <Step title="Create a wallet owned by your user">
    Create a wallet [owned](/controls/authorization-keys/owners/overview) by your user using their
    Privy user ID. When creating the wallet, you can optionally attach
    [policies](/controls/policies/overview) to the wallet to configure which kinds of transactions
    can be sent by your user.
  </Step>

  <Step title="Request a user key with a user's access token">
    While your user is authenticated in your app, use your user's access token to request an
    ephemeral [user key](/controls/authorization-keys/keys/create/user/overview) for your user. This
    key is required to sign requests to execute transactions, ensuring the user stays in the loop
    for all transactions.
  </Step>

  <Step title="Execute transactions from your server">
    Compute the user key's signature over your API request and execute transactions from your
    server.
  </Step>
</Steps>

Follow the guide below for more concrete instructions.

## 1. Configure authentication settings

Privy ensures that users are in the loop for all wallet actions by requiring a valid **access token** for your user issued by your authentication provider. This ensures your user is authenticated for all transactions executed by your server.

To verify a user's access token, Privy requires that your app register details of your authentication setup in the Privy Dashboard. Namely:

1. Get your **JWKS.json** endpoint from your authentication provider (e.g. Auth0, Firebase, Stytch). Privy will use this endpoint to verify access tokens for your users.
2. In the **Authentication** page of the **Configuration** section of the Privy Dashboard, enable **JWT-based authentication**.
3. Once JWT-based authentication has been enabled:
   1. Determine whether your app will be authenticating requests that contain your provider's JWTs from a **server side or client side environment**.
      {/* prettier-ignore */}
   2. Register the **JWKS.json** endpoint from your authentication provider and the name of the **JWT claim** that specifies the user's ID (typically `sub`).
      Privy can now verify access tokens issued by your authentication provider to authenticate users, and issue user keys for users.

## 2. Create your user

Next, [create a user](/user-management/migrating-users-to-privy/create-or-import-a-user) in Privy that will own your wallet. Pass the user ID from your authentication provider in the request to associate the user in Privy with the user in your authentication provider.

<View title="NodeJS" icon="node-js">
  Use the Privy client's `create` method on the `users()` interface to create a user.

  ```ts  theme={"system"}
  const user = await privy.users().create({
    linked_accounts: [
      {
        type: 'custom_auth',
        custom_user_id: 'insert-user-id-from-authentication-provider'
      }
    ]
  });

  // Save the Privy user ID
  const id = user.id;
  ```

  Make sure to save the `id` of the returned Privy user for the next step.
</View>

<View title="NodeJS (server-auth)" icon="node-js">
  Use the Privy client's `importUser` method to create a user.

  ```ts  theme={"system"}
  const user = await privy.importUser({
    linkedAccounts: [
      {
        type: 'custom_auth',
        customUserId: 'insert-user-id-from-authentication-provider'
      }
    ]
  });

  // Save the Privy user ID
  const id = user.id;
  ```

  Make sure to save the `id` of the returned Privy user for the next step.
</View>

<View title="REST API" icon="terminal">
  Make a `POST` request to:

  ```sh  theme={"system"}
  https://auth.privy.io/api/v1/users
  ```

  with the body:

  ```json  theme={"system"}
  {
    "linked_accounts": [
      {
        "type": "custom_auth",
        "custom_user_id": "insert-user-id-from-authentication-provider"
      }
    ]
  }
  ```

  Below is a **sample cURL command** for importing a new user into Privy:

  ```bash  theme={"system"}
  $ curl --request POST https://auth.privy.io/api/v1/users \
  -u "<your-privy-app-id>:<your-privy-app-secret>" \
  -H "privy-app-id: <your-privy-app-id>" \
  -H 'Content-Type: application/json' \
  -d '{
      "linked_accounts": [{
              "type": "custom_auth",
              "custom_user_id": "insert-user-id-from-authentication-provider"
      }]
  }'
  ```

  Make sure to save the `id` field returned in the response body for the next step
</View>

## 3. Create a wallet owned by your user

Next, given your Privy user ID from step 3, create a wallet [owned](/controls/authorization-keys/owners/overview) by your user. This ensures that the user is the only party that is allowed to authorize transactions from the wallet.

<Tip>
  When creating a wallet, you can also associate [policies](/controls/policies/overview) with the
  wallet to configure which kinds of transactions are allowed to be sent.
</Tip>

<View title="NodeJS" icon="node-js">
  Use the Privy client's `create` method on the `wallets()` interface to create a wallet.

  ```ts  theme={"system"}
  const {id, address} = await privy.wallets().create({
    chain_type: 'ethereum',
    owner: {user_id: 'insert-privy-user-id'},
    policy_ids: ['insert-any-policy-ids-to-associate-with-wallet']
  });
  ```

  Make sure to save the `id` of the returned wallet, to allow your server to transact with this wallet in the next step.
</View>

<View title="NodeJS (server-auth)" icon="node-js">
  Use the `createWallet` method of the Privy client's `walletApi` class to create a user:

  ```ts  theme={"system"}
  const {id, address} = await privy.walletApi.createWallet({
    chainType: 'ethereum',
    owner: {userId: 'insert-privy-user-id'},
    policyIds: ['insert-any-policy-ids-to-associate-with-wallet']
  });
  ```

  Make sure to save the `id` of the returned wallet, to allow your server to transact with this wallet in the next step.
</View>

<View title="REST API" icon="terminal">
  To create a new wallet for a user, make a `POST` request to:

  ```sh  theme={"system"}
  https://api.privy.io/v1/wallets
  ```

  with the body:

  ```json  theme={"system"}
  {
    "owner": [
      {
        "user_id": "insert-privy-user-id"
      }
    ],
    "chain_type": "specify-'ethereum'-or-'solana'"
  }
  ```

  Below is a **sample cURL command** for creating a wallet owned by your user.

  ```bash  theme={"system"}
  curl --request POST https://api.privy.io/v1/wallets \
      -u "<your-privy-app-id>:<your-privy-app-secret>" \
      -H "privy-app-id: <your-privy-app-id>" \
      -H 'Content-Type: application/json' \
      -d '{
      "owner": {
          "user_id": "did:privy:xxxxxx"
      },
      "chain_type": "ethereum"
      }'
  ```

  Make sure to save the `id` of the wallet in the response body, to execute transactions with the wallet in your next step.
</View>

## 4. Request a user key

When your user is authenticated in your application and wants to take action with their wallet, first make a request from your frontend to your server with the user's access token.

You will use this access token to request an ephemeral [user key](/controls/authorization-keys/keys/create/user/overview). This key is required to sign requests to the Privy API to ensure that users authorize transactions that are being sent.

Next, once your server has the user's access token, make a request to Privy to get the user key.

<View title="NodeJS" icon="node-js">
  The NodeJS SDK will automatically handle requesting the user key when required whenever you set
  a `user_jwt` on the [authorization context](/controls/authorization-keys/using-owners/sign/signing-on-the-server) object.

  ```ts  theme={"system"}
  const authorizationContext: AuthorizationContext = {
    user_jwts: ['insert-user-jwt']
  };
  ```
</View>

<View title="NodeJS (server-auth)" icon="node-js">
  To request a user key, use the `generateUserSigner` method of the Privy client's `walletApi` class:

  ```ts  theme={"system"}
  const {authorizationKey} = await privy.walletApi.generateUserSigner({
    userJwt: 'insert-user-jwt-from-authentication-provider'
  });
  ```

  Next, update the Privy client to use the returned user key using the `updateAuthorizationKey` method:

  ```ts  theme={"system"}
  privy.walletApi.updateAuthorizationKey('insert-user-key-from-above');
  ```

  Your Privy client will now automatically use this user key to sign requests to Privy's API.
</View>

<View title="REST API" icon="terminal">
  Make a `POST` request to:

  ```sh  theme={"system"}
  https://api.privy.io/v1/wallets/authenticate
  ```

  with the body:

  ```json  theme={"system"}
  {
    "user_jwt": "insert-user-jwt-from-authentication-provider"
  }
  ```

  Below is a sample cURL command for requesting a user key.

  ```bash  theme={"system"}
  curl -X POST "https://api.privy.io/v1/wallets/authenticate" \
  -H "Authorization: Basic <insert-basic-auth-header>" \
  -H "Content-Type: application/json" \
  -H "privy-app-id: <insert-your-app-id>" \
  -d '{
      "user_jwt": <insert-user-jwt>,
  }'
  ```

  Save the `authorization_key` returned in the response body to be used in the next step.

  <Tip>
    In production environments, we strongly recommend using asymmetric encryption when requesting user
    keys from Privy's API. View [this guide](/controls/authorization-keys/keys/create/user/request) to
    learn more.
  </Tip>
</View>

## 5. Execute transactions from your server

Lastly, execute transactions from your server with the user key. All requests to the Privy API to execute a transaction must be signed by the user key to ensure the user authorizes the transaction. Follow the steps below to sign a request and execute a transaction with the REST API.

<Tip>
  You can also enable [key export of a user's wallet](/wallets/wallets/export) with a valid access
  token from the user.
</Tip>

<View title="NodeJS" icon="node-js">
  Provided you've set the `user_jwt` on the [authorization context](/controls/authorization-keys/using-owners/sign/signing-on-the-server)
  object as shown in step 4, the Privy client will automatically sign requests to the Privy API
  with user's key.
  You can simply use the
  [`privy.wallets().ethereum()`](/wallets/using-wallets/ethereum/send-a-transaction)
  and
  [`privy.wallets().solana()`](/wallets/using-wallets/solana/send-a-transaction)
  interfaces to take actions with wallets, and the SDK will automatically sign requests under the
  hood.
</View>

<View title="NodeJS (server-auth)" icon="node-js">
  The Privy client will automatically sign requests to the Privy API with the key you provided in the step above. You can simply use the [`privy.walletApi.ethereum.*`](/wallets/using-wallets/ethereum/send-a-transaction) and [`privy.walletApi.solana.*`](/wallets/using-wallets/solana/send-a-transaction) interfaces to take actions with wallets, and the SDK will automatically sign requests under the hood.
</View>

<View title="REST API" icon="terminal">
  Follow [this guide](/controls/authorization-keys/using-owners/sign) to learn how to sign requests to the Privy API. Make sure to include the signature as a `privy-authorization-signature` header on all transaction requests.

  Then, follow the respective guides for executing transactions on [Ethereum](/wallets/using-wallets/ethereum/send-a-transaction) and [Solana](/wallets/using-wallets/solana/send-a-transaction).
</View>
\n