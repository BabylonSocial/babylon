> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Authorization keys

Authorization keys allow the party that controls the key to execute actions on wallets and policies by signing requests to the Privy API. Examples of authorization keys include a key controlled by your app's server or a passkey controlled by a user.

You can create authorization keys for your application via the **Privy Dashboard** or via the **REST API**.

<View title="Dashboard" icon="terminal">
  To create a new authorization key in the Dashboard, visit the [**Authorization keys**](https://dashboard.privy.io/apps?page=authorization-keys) page of the **Wallets** section for your app.

  Click the **New key** button and copy and save the generated **Private key**. Privy does not save this key and cannot help you recover it later. You can also set a human-readable **Key name**.

  In this process, Privy generates a keypair for your app directly on your device, and shows you the private key.

  * The private key (e.g. the key you copy) is generated on your device, and is only ever known to your app. Neither Privy nor the secure enclave ever sees the private key, and cannot sign payloads with it. **Make sure you save this key.**
  * The public key is registered with the secure enclave that secures your wallets, and is used to verify signatures produced by your app.

  <Info>
    Securely store this private key. Authorization keys can control wallets and execute actions, so treat them like production credentials. Privy does not store the private key and cannot help you retrieve it.
  </Info>
</View>

<View title="NodeJS" icon="node-js">
  To create a new authorization key with the NodeJS SDK, use the `generateP256KeyPair` function.

  ```ts  theme={"system"}
  import {generateP256KeyPair} from '@privy-io/node';

  const {privateKey, publicKey} = await generateP256KeyPair();
  ```

  This will return a `privateKey` and `publicKey` in DER format (no headers or
  footers), which you can use directly in the the methods of the Privy SDK,
  such as when setting `owners` or when building an
  [`AuthorizationContext`](/controls/authorization-context).

  For example, you can use the generated keypair as the owner of a wallet:

  ```ts  theme={"system"}
  import {PrivyClient} from '@privy-io/node';

  const wallet = await privy.wallets().create({
    chain_type: 'ethereum',
    owner: { public_key: publicKey }
  });

  const {signature} = await privy.wallets().ethereum().signMessage(wallet.id, {
    message: 'Hello, world!',
    authorization_context: { authorization_private_keys: [privateKey] }
  });
  ```
</View>

<View title="REST API" icon="terminal">
  Authorization keys are [P-256](https://neuromancer.sk/std/nist/P-256) public-private keypairs.

  <Info>
    Securely store the private key. Authorization keys can control wallets and execute actions, so treat them like production credentials. Privy does not store this and cannot help you recover it.
  </Info>

  You can create a keypair with the following command:

  ```sh  theme={"system"}
  openssl ecparam -name prime256v1 -genkey -noout -out private.pem && \
  openssl ec -in private.pem -pubout -out public.pem
  ```

  This creates PEM-formatted files in your working directory for local storage. When registering the public key with the Privy API, you'll need to convert it to base64-encoded DER format:

  ```sh  theme={"system"}
  openssl ec -pubin -in public.pem -outform DER | base64
  ```

  Next, follow [this guide](/controls/key-quorum/create) to register your public key with the Privy API.

  <Tip>
    If you locally generate an authorization key and register it with the Privy API, make sure to note down the `id` in the response. You will use this value as the `owner_id` when specifying owners elsewhere (e.g. creating or updating wallets) or `signer_id` when specifying additional signers.
  </Tip>
</View>

<View title="Passkeys" icon="terminal">
  Passkeys can be registered as authorization keys via either the Privy Dashboard or REST API.
  Simply follow the instructions in the Dashboard or REST API section to register the key, and pass
  the passkey's public key into the public key field of the request.
</View>
\n