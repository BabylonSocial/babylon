> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# 2-of-2 quorum: user and server as co-signers

Many apps want to give users self-custodial wallets while ensuring the server must approve every
transaction, wallet update, and key export. A **2-of-2 key quorum** achieves this: one quorum
member is the user, the other is an authorization key controlled by your server. Both must sign
every request to Privy's API.

This means that even if a user's account is compromised, an attacker cannot take unilateral action
with the wallet. Equally, your server alone cannot move funds without the user's consent.

At a high-level, you will:

<Steps>
  <Step title="Create a server authorization key">
    Generate a P-256 keypair and register the public key with Privy. Your server holds the private
    key and uses it to co-sign every request.
  </Step>

  <Step title="Create a 2-of-2 key quorum">
    Register a key quorum that contains the user ID and the server authorization key, with an
    `authorization_threshold` of 2.
  </Step>

  <Step title="Create a wallet owned by the quorum">
    Create a wallet whose owner is the key quorum. All subsequent actions on this wallet require
    both signatures.
  </Step>

  <Step title="Execute transactions with both signatures">
    For each request, collect the user's JWT, obtain a user signing key, sign with the server
    authorization key, and send both signatures to the Privy API.
  </Step>
</Steps>

***

## 1. Create a server authorization key

Your server needs a P-256 keypair. The private key stays on your server; the public key is
registered with Privy so it can verify your server's signatures.

<CardGroup cols={2}>
  <Card title="Create authorization keys" href="/controls/authorization-keys/keys/create/key">
    Generate a keypair and register it in the Privy Dashboard or via SDK.
  </Card>
</CardGroup>

Save the private key securely (e.g. in an environment variable or secrets manager). You will
reference it as `serverAuthorizationPrivateKey` in later steps.

***

## 2. Create a 2-of-2 key quorum

Once you have the server authorization key's public key and the user's Privy user ID, register a
key quorum that requires both to sign.

<Tip>
  Key quorums containing both user IDs and authorization keys must be created via the SDK or REST
  API. The Dashboard only supports pure authorization-key quorums.
</Tip>

<View title="NodeJS" icon="node-js">
  ```ts  theme={"system"}
  import {PrivyClient} from '@privy-io/node';

  const privy = new PrivyClient({
    appId: 'insert-your-app-id',
    appSecret: 'insert-your-app-secret'
  });

  const keyQuorum = await privy.keyQuorums().create({
    display_name: `2-of-2 quorum for user ${userId}`,
    public_keys: ['insert-server-authorization-public-key'],
    user_ids: ['insert-privy-user-id'],
    authorization_threshold: 2
  });

  const keyQuorumId = keyQuorum.id;
  ```

  Save the returned `id` — this is the `owner_id` you will assign to the wallet.
</View>

<View title="REST API" icon="terminal">
  Make a `POST` request to:

  ```sh  theme={"system"}
  https://api.privy.io/v1/key_quorums
  ```

  with the body:

  ```json  theme={"system"}
  {
    "display_name": "2-of-2 quorum for user <user-id>",
    "public_keys": ["<server-authorization-public-key>"],
    "user_ids": ["<privy-user-id>"],
    "authorization_threshold": 2
  }
  ```

  Sample cURL command:

  ```bash  theme={"system"}
  curl --request POST https://api.privy.io/v1/key_quorums \
    -u "<your-privy-app-id>:<your-privy-app-secret>" \
    -H "privy-app-id: <your-privy-app-id>" \
    -H "Content-Type: application/json" \
    -d '{
      "display_name": "2-of-2 quorum for user did:privy:xxxxxx",
      "public_keys": ["<server-authorization-public-key>"],
      "user_ids": ["did:privy:xxxxxx"],
      "authorization_threshold": 2
    }'
  ```

  Save the `id` field from the response body.
</View>

***

## 3. Create a wallet owned by the quorum

Create a wallet and set its `owner_id` to the key quorum ID from step 2.

<View title="NodeJS" icon="node-js">
  ```ts  theme={"system"}
  const {id: walletId, address} = await privy.wallets().create({
    chain_type: 'ethereum',
    owner_id: keyQuorumId
  });
  ```
</View>

<View title="REST API" icon="terminal">
  Make a `POST` request to:

  ```sh  theme={"system"}
  https://api.privy.io/v1/wallets
  ```

  with the body:

  ```json  theme={"system"}
  {
    "chain_type": "ethereum",
    "owner_id": "<key-quorum-id>"
  }
  ```

  Save the `id` of the wallet returned in the response.
</View>

<Tip>
  Attach [policies](/controls/policies/overview) to the wallet when creating it to further restrict
  which transactions are allowed, independent of the co-signing requirement.
</Tip>

***

## 4. Execute transactions with both signatures

Every request to the Privy API that acts on this wallet must include signatures from both the user
and the server. The flow below applies to transactions, wallet updates, and key export.

### How it works

```
Client                          Your server                      Privy API
  |                                  |                               |
  |-- (1) Build request payload      |                               |
  |-- (2) Sign with user key         |                               |
  |    (useAuthorizationSignature)   |                               |
  |                                  |                               |
  |-- (3) Send payload + user sig -->|                               |
  |                                  |-- (4) Sign with server key    |
  |                                  |-- (5) Send request +          |
  |                                  |       both sigs ------------->|
  |                                  |<-- response ------------------|
```

### Step-by-step

<Steps>
  <Step title="Build the request payload on the client">
    Construct the JSON payload describing the request your app intends to make to the Privy API.
    This payload includes the target URL, HTTP method, required headers, and request body.

    <Tabs>
      <Tab title="React">
        ```tsx  theme={"system"}
        const requestPayload = {
          version: 1,
          url: `https://api.privy.io/v1/wallets/${walletId}/rpc`,
          method: 'POST',
          headers: {
            'privy-app-id': 'insert-your-app-id'
          },
          body: {
            caip2: 'eip155:1',
            method: 'eth_sendTransaction',
            chain_type: 'ethereum',
            params: {
              transaction: {
                to: '0xRecipientAddress',
                value: '0x2386f26fc10000',
                data: '0x'
              }
            }
          }
        } as const;
        ```
      </Tab>

      <Tab title="React Native">
        ```tsx  theme={"system"}
        const requestPayload = {
          version: 1,
          url: `https://api.privy.io/v1/wallets/${walletId}/rpc`,
          method: 'POST',
          headers: {
            'privy-app-id': 'insert-your-app-id'
          },
          body: {
            caip2: 'eip155:1',
            method: 'eth_sendTransaction',
            chain_type: 'ethereum',
            params: {
              transaction: {
                to: '0xRecipientAddress',
                value: '0x2386f26fc10000',
                data: '0x'
              }
            }
          }
        } as const;
        ```
      </Tab>
    </Tabs>
  </Step>

  <Step title="Sign the payload with the user's key on the client">
    Use the `useAuthorizationSignature` hook to sign the payload with the authenticated user's
    signing key. The hook handles key retrieval and signing entirely on the client — the user's
    private key never leaves the device.

    <Tabs>
      <Tab title="React">
        ```tsx  theme={"system"}
        import {useAuthorizationSignature} from '@privy-io/react-auth';

        const {generateAuthorizationSignature} = useAuthorizationSignature();

        const {signature: userSignature} = await generateAuthorizationSignature(requestPayload);
        ```
      </Tab>

      <Tab title="React Native">
        ```tsx  theme={"system"}
        import {useAuthorizationSignature} from '@privy-io/expo';

        const {generateAuthorizationSignature} = useAuthorizationSignature();

        const {signature: userSignature} = await generateAuthorizationSignature(requestPayload);
        ```
      </Tab>
    </Tabs>
  </Step>

  <Step title="Send the payload and user signature to your server">
    Forward both the request payload and the user's signature to your server. Your server will add
    its own signature before proxying the request to the Privy API.

    ```tsx  theme={"system"}
    await fetch('https://your-server.com/api/wallet-action', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        requestPayload,
        userSignature
      })
    });
    ```
  </Step>

  <Step title="Sign with the server key and send to Privy">
    On your server, generate the server's authorization signature over the same payload, then send
    the request to the Privy API with both signatures as a comma-delimited value in the
    `privy-authorization-signature` header.

    <View title="NodeJS" icon="node-js">
      ```ts  theme={"system"}
      import {generateAuthorizationSignature, type WalletApiRequestSignatureInput} from '@privy-io/node';

      // `requestPayload` and `userSignature` are received from the client
      const [serverSignature] = await generateAuthorizationSignature(privyClient, {
        input: requestPayload as WalletApiRequestSignatureInput,
        authorizationContext: {
          authorization_private_keys: ['insert-server-authorization-private-key'],
        }
      });

      const response = await fetch(requestPayload.url, {
        method: requestPayload.method,
        headers: {
          ...requestPayload.headers,
          Authorization: `Basic ${Buffer.from('app-id:app-secret').toString('base64')}`,
          'Content-Type': 'application/json',
          'privy-authorization-signature': `${userSignature},${serverSignature}`
        },
        body: JSON.stringify(requestPayload.body)
      });
      ```
    </View>

    <View title="REST API" icon="terminal">
      Generate a P-256 signature over the formatted payload using your server's authorization private
      key. Follow [this guide](/controls/authorization-keys/using-owners/sign/utility-functions) for
      formatting and signing details.

      Then send the request with both signatures:

      ```bash  theme={"system"}
      curl --request POST https://api.privy.io/v1/wallets/<wallet-id>/rpc \
        -u "<your-privy-app-id>:<your-privy-app-secret>" \
        -H "privy-app-id: <your-privy-app-id>" \
        -H "privy-authorization-signature: <user-signature>,<server-signature>" \
        -H "Content-Type: application/json" \
        -d '{
          "caip2": "eip155:1",
          "method": "eth_sendTransaction",
          "chain_type": "ethereum",
          "params": {
            "transaction": {
              "to": "0xRecipientAddress",
              "value": "0x2386f26fc10000",
              "data": "0x"
            }
          }
        }'
      ```
    </View>
  </Step>
</Steps>

Privy validates that both signatures are present, valid, and correspond to members of the wallet's
key quorum. If either signature is missing or invalid, the request is rejected.

***

## Learn more

<CardGroup cols={3}>
  <Card title="Key quorums" href="/controls/key-quorum/overview">
    Learn how key quorums define ownership and authorization thresholds.
  </Card>

  <Card title="Authorization keys" href="/controls/authorization-keys/keys/create/key">
    Create and manage server-controlled authorization keys.
  </Card>

  <Card title="Policies" href="/controls/policies/overview">
    Restrict which transactions are allowed with wallet policies.
  </Card>
</CardGroup>
\n