> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Using user owners & signers

Once your application has successfully configured authentication settings, users can update and take actions with resources they own per the following flow.

<Steps>
  <Step title="Request a user key for a user">
    Make a request to the Privy API with the user's access token to request a user key. If the token
    is valid per your configured authentication settings, Privy will return a time-bound user key
    that can be used to sign requests.
  </Step>

  <Step title="Sign the request with the user key">
    Given the returned user key, [sign the request](/controls/authorization-keys/using-owners/sign)
    to update or take actions with a resource the user owns.
  </Step>

  <Step title="Pass the signature in request headers">
    Lastly, [pass the signature](/controls/authorization-keys/using-owners/action) from the user key
    in a `privy-authorization-signature` header for the request. Privy will verify the signature and
    execute the request only if the signature is valid.
  </Step>
</Steps>

Follow the guide below to learn how to request and use user keys from the Privy API.

<View title="NodeJS" icon="node-js">
  ### Set the authorization context to use the user's keypair

  Given the user's access token, the NodeJS SDK handles requesting the user key via the Privy API under
  the hood. Use the [authorization context](/controls/authorization-keys/using-owners/sign/signing-on-the-server) builder to set the user
  JWT, and pass it into wallet API functions that require owner's authorization, by setting the
  `user_jwts` property.

  ```ts  theme={"system"}
  import {AuthorizationContext} from '@privy-io/node';

  const authorizationContext: AuthorizationContext = {
    user_jwts: ['insert-user-jwt']
  };
  ```

  Wallet requests on the wallets owned by the user can now be made by passing in this newly created
  authorization context on the call to the `PrivyClient`.

  ```ts title="Example: Sign a message with the user's wallet" highlight={15-17} theme={"system"}
  import {PrivyClient} from '@privy-io/node';

  const privyClient = new PrivyClient({
    appId: 'insert-your-app-id',
    appSecret: 'insert-your-app-secret'
  });

  try {
    // With the authorization context, this method automatically signs the request.
    const response = await privyClient
      .wallets()
      .ethereum()
      .signMessage('insert-user-wallet-id', {
        message: 'Hello, Ethereum.',
        authorization_context: {
          user_jwts: ['insert-user-jwt']
        }
      });

    const signature = response.signature;
  } catch (error) {
    console.error(error);
  }
  ```
</View>

<View title="NodeJS (server-auth)" icon="node-js">
  <Warning>
    The `@privy-io/server-auth` library is deprecated. We recommend integrating `@privy-io/node` for
    the latest features and support.
  </Warning>

  #### 1. Request a user key for a user

  To request a user key with the NodeJS SDK, use the `generateUserSigner` method of the Privy client.

  ```ts  theme={"system"}
  import {PrivyClient} from '@privy-io/server-auth';

  const privy = new PrivyClient('insert-your-app-id', 'insert-your-app-secret');

  const {authorizationKey} = await privy.walletApi.generateUserSigner({
    userJwt: 'insert-user-jwt'
  });
  ```

  As a parameter to the method, pass an object containing the following.

  <ParamField path="userJwt" type="string" required>
    The user's JWT, to authenticate the user.

    If your app is using your own authentication provider, the user's JWT should verify against the JWKS.json endpoint you registered in the Dashboard.

    If your app is using Privy as your authentication provider, the user's JWT should be the access token issued by Privy.
  </ParamField>

  <Tip>
    Under the hood, the `generateUserSigner` method handles the encryption and decryption of the user
    key returned by the Privy API. This means your application does not need to handle the encryption
    of the user key.
  </Tip>

  #### 2. Update the Privy client to use the user's keypair

  Once you've generated a user authorization key for the user, update the Privy client to use the user authorization key via the `updateAuthorizationKey` method. This will configure the Privy client to sign requests with the provided key.

  ```ts  theme={"system"}
  import {PrivyClient} from '@privy-io/server-auth';

  const privy = new PrivyClient('insert-your-app-id', 'insert-your-app-secret');

  privy.walletApi.updateAuthorizationKey('insert-user-authorization-key');
  ```

  As a parameter to this method, pass the user authorization key returned by the `generateUserSigner` method as a `string`.

  #### 3. Execute requests with the user's authorization key

  Once the Privy client has been updated with a specific user's authorization key, the client will automatically sign requests made by the [`privy.walletApi.ethereum.*`](/wallets/using-wallets/ethereum/send-a-transaction) and [`privy.walletApi.solana.*`](/wallets/using-wallets/solana/send-a-transaction) methods. You do not need to take any extra steps to sign requests.
</View>

<View title="Java" icon="java">
  ### Set the authorization context to use the user's keypair

  Given the user's access token, the Java SDK handles requesting the user key via the Privy API under
  the hood. Use the [authorization context](/controls/authorization-keys/using-owners/sign/signing-on-the-server) builder to set the user
  JWT, and pass it into wallet API functions that require owner's authorization, by using
  `.addUserJwt()`.

  ```java  theme={"system"}
      AuthorizationContext authorizationContext = AuthorizationContext.builder()
          .addUserJwt("insert-user-jwt")
          .build();
  ```

  Wallet requests on the wallets owned by the user can now be made by passing in this newly created
  authorization context on the call to the `PrivyClient`.

  ```java title="Example: Sign a message with the user's wallet" highlight={4-6,14} theme={"system"}
  try {
      String message = "Hello, Ethereum.";

      AuthorizationContext authorizationContext = AuthorizationContext.builder()
          .addUserJwt("insert-user-jwt")
          .build();

      // With the authorization context, this method automatically signs the request.
      EthereumPersonalSignRpcResponseData response = privyClient
          .wallets()
          .ethereum()
          .signMessage(
              walletId,
              message.getBytes(StandardCharsets.UTF_8),
              authorizationContext
          );

      String signature = response.signature();
  } catch (APIException e) {
      String errorBody = e.bodyAsString();
      System.err.println(errorBody);
  } catch (Exception e) {
      System.err.println(e.getMessage());
  }
  ```
</View>

<View title="Go" icon="golang">
  ### Set the authorization context to use the user's keypair

  Given the user's access token, the Go SDK handles requesting the user key via the Privy API under
  the hood. Use the [authorization context](/controls/authorization-keys/using-owners/sign/signing-on-the-server) to set the user
  JWT, and pass it into wallet API functions that require owner's authorization, by setting the
  `UserJwts` field.

  ```go  theme={"system"}
  import "github.com/privy-io/go-sdk/authorization"

  authCtx := &authorization.AuthorizationContext{
      UserJwts: []string{"insert-user-jwt"},
  }
  ```

  Wallet requests on the wallets owned by the user can now be made by passing in this newly created
  authorization context on the call to the Privy client.

  ```go title="Example: Sign a message with the user's wallet" highlight={6-8,15} theme={"system"}
  import (
      privy "github.com/privy-io/go-sdk"
      "github.com/privy-io/go-sdk/authorization"
  )

  authCtx := &authorization.AuthorizationContext{
      UserJwts: []string{"insert-user-jwt"},
  }

  // With the authorization context, this method automatically signs the request.
  response, err := client.Wallets.Ethereum.SignMessage(
      context.Background(),
      "insert-user-wallet-id",
      "Hello, Ethereum.",
      privy.WithAuthorizationContext(authCtx),
  )
  if err != nil {
      log.Fatalf("failed to sign message: %v", err)
  }

  signature := response.Signature
  ```
</View>

<View title="REST API" icon="terminal">
  <Info>
    Directly managing user authorization keys via the REST API is an advanced integration. If you are
    using a Privy SDK, you do not need to directly manage the user's authorization key or manually
    generate authorization signatures.
  </Info>

  <Tip>
    For security, Privy encrypts user authorization keys under a public key you provide to ensure that only your app can decrypt them. If you are just getting started with your integration, you can test the flow without encryption by following the **Without encryption** sections of the guide below.

    In production environments, we strongly recommend requesting user authorization keys **with encryption** as a security best practice.
  </Tip>

  #### 1. Generate an ECH P-256 keypair

  <Tabs>
    <Tab title="With encryption">
      To begin, create an [ECH P-256](https://csrc.nist.gov/csrc/media/events/workshop-on-elliptic-curve-cryptography-standards/documents/papers/session6-adalier-mehmet.pdf) public-private keypair to encrypt and decrypt your user's authorization key. Privy will encrypt the authorization under the public key for your keypair, and your server can decrypt the authorization key using the keypair's corresponding private key.

      When interacting with the Privy API, your ECH P-256 public-private keypair must be in the [SPKI](https://en.wikipedia.org/wiki/Simple_public-key_infrastructure) format.

      As an example, you can create an ECH P-256 keypair like so.

      <Accordion title="Show code examples of creating ECH P-256 keypairs">
        <Tabs>
          <Tab title="TypeScript">
            ```typescript  theme={"system"}
            import * as crypto from 'crypto';

            async function generateEcdhP256KeyPair(): Promise<{
              privateKey: CryptoKey;
              recipientPublicKey: string;
            }> {
              // Generate a P-256 key pair
              const keyPair = await crypto.subtle.generateKey(
                {
                  name: 'ECDH',
                  namedCurve: 'P-256'
                },
                true,
                ['deriveBits']
              );

              // The privateKey will be used later to decrypt the encapsulatedKey data returned from the /v1/user_signers/authenticate endpoint.
              const privateKey = keyPair.privateKey;

              // The publicKey will be used to encrypt the session key and will be sent to the /v1/user_signers/authenticate endpoint.
              // The publicKey must be a base64-encoded, SPKI-format string
              const publicKeyInSpkiFormat = await crypto.subtle.exportKey('spki', keyPair.publicKey);
              const recipientPublicKey = Buffer.from(publicKeyInSpkiFormat).toString('base64');

              return {privateKey, recipientPublicKey};
            }
            ```
          </Tab>

          <Tab title="Python">
            ```python  theme={"system"}
            import base64
            from cryptography.hazmat.primitives import serialization
            from cryptography.hazmat.primitives.asymmetric import ec
            from typing import Tuple

            def generate_ecdh_p256_key_pair() -> Tuple[ec.EllipticCurvePrivateKey, str]:
                # Generate a P-256 key pair
                private_key = ec.generate_private_key(ec.SECP256R1())
                public_key = private_key.public_key()

                # Export the public key in SPKI format
                public_key_spki = public_key.public_key_bytes(
                    encoding=serialization.Encoding.DER,
                    format=serialization.PublicFormat.SubjectPublicKeyInfo
                )

                # Convert to base64 string
                recipient_public_key = base64.b64encode(public_key_spki).decode('utf-8')

                return private_key, recipient_public_key
            ```
          </Tab>
        </Tabs>
      </Accordion>
    </Tab>

    <Tab title="Without encryption">
      If you are requesting user authorization keys without encryption, you can skip this step.
    </Tab>
  </Tabs>

  #### 2. Request a user's authorization key

  <Tip>
    If you are just getting started with your integration and skipped step 1, you should omit the
    `encryption_type` and `recipient_public_key` parameters of the request body blank.
  </Tip>

  Next, use the user's access token to request a user authorization key for the user. If you generated a P256 keypair in step 1, you will also use the public key you generated to request the user authorization key.

  Make a request to:

  ```sh  theme={"system"}
  https://api.privy.io/v1/wallets/authenticate
  ```

  In the request body, pass the following parameters.

  <Accordion title="Show request body">
    <Tabs>
      <Tab title="With encryption">
        <ParamField path="user_jwt" type="string" required>
          The user's JWT, to be used to authenticate the user.

          If your app is using your own authentication provider, the user's JWT should verify against the JWKS.json endpoint you registered in the Dashboard.

          If your app is using Privy as your authentication provider, the user's JWT should be the access token issued by Privy.
        </ParamField>

        <ParamField path="encryption_type" type="'HPKE" required>
          The encryption type for the authentication response. Currently only supports HPKE. Omit this field
          if you are requesting the authorization key unencrypted.
        </ParamField>

        <ParamField path="recipient_public_key" type="string" required>
          The public key of your ECDH keypair, in base64-encoded, SPKI-format, whose private key will be
          able to decrypt the session key. This keypair must be generated securely and the private key must
          be kept confidential. The public key sent should be in base64-encoded DER format.
        </ParamField>
      </Tab>

      <Tab title="Without encryption">
        <ParamField path="user_jwt" type="string" required>
          The user's JWT, to be used to authenticate the user.

          If your app is using your own authentication provider, the user's JWT should verify against the JWKS.json endpoint you registered in the Dashboard.

          If your app is using Privy as your authentication provider, the user's JWT should be the access token issued by Privy.
        </ParamField>
      </Tab>
    </Tabs>
  </Accordion>

  In the response, Privy will return the following. Make sure to save the `encrypted_authorization_key.encapsulated_key` and `encrypted._authorization_key.ciphertext` fields to use later.

  <Accordion title="Show response body">
    <Tabs>
      <Tab title="With encryption">
        <ResponseField name="encrypted_authorization_key" type="object">
          The encrypted authorization key, once decrypted, can be used to sign transactions on the wallet, acting as a temporary AuthorizationPrivateKey.
          Once decrypted, you will need to generate an [authorization signature](/api-reference/authorization-signatures) and pass it as a header under `privy-authorization-signature`.

          <Expandable defaultOpen="true">
            <ResponseField name="encryption_type" type="'HPKE'">
              The encryption type used. Currently only supports HPKE.
            </ResponseField>

            <ResponseField name="encapsulated_key" type="string">
              Base64-encoded ephemeral public key used in the HPKE encryption process. Required for decryption.
            </ResponseField>

            <ResponseField name="ciphertext" type="string">
              The encrypted authorization key corresponding to the user's current authentication session.
            </ResponseField>
          </Expandable>
        </ResponseField>

        <ResponseField name="expires_at" type="number">
          The expiration time of the authorization key in seconds since the epoch.
        </ResponseField>

        <ResponseField name="wallets" type="object[]">
          The wallets that the signer has access to.
        </ResponseField>
      </Tab>

      <Tab title="Without encryption">
        <ResponseField name="authorization_key" type="string">
          The raw authorization key. Using this key, you will need to generate an [authorization signature](/api-reference/authorization-signatures) and pass it as a header under `privy-authorization-signature`.
        </ResponseField>

        <ResponseField name="expires_at" type="number">
          The expiration time of the authorization key in seconds since the epoch.
        </ResponseField>

        <ResponseField name="wallets" type="object[]">
          The wallets that the signer has access to.
        </ResponseField>
      </Tab>
    </Tabs>
  </Accordion>

  See an example request and successful response below.

  <Accordion title="Show example request and response">
    <Tabs>
      <Tab title="With encryption">
        An example request for an authorization key with encryption might look like the following:

        ```sh  theme={"system"}
        curl -X POST "https://api.privy.io/v1/wallets/authenticate" \
          -H "Authorization: Basic <insert-basic-auth-header>" \
          -H "Content-Type: application/json" \
          -H "privy-app-id: <insert-your-app-id>" \
          -d '{
            "user_jwt": <insert-user-jwt>,
            "encryption_type": "HPKE",
            "recipient_public_key": <insert-your-p256-public-key>
          }'
        ```

        A successful sample response will look like the following:

        ```json  theme={"system"}
        {
          "encrypted_authorization_key": {
            "encryption_type": "HPKE",
            "encapsulated_key": "<encapsulated-key>",
            "ciphertext": "<ciphertext>"
          },
          "expires_at": 1715270400,
          "wallets": [
            {
              "id": "<wallet-id>",
              "chain_type": "ethereum",
              "address": "<wallet-address>"
            }
          ]
        }
        ```
      </Tab>

      <Tab title="Without encryption">
        An example request for an authorization key without encryption might look like the following:

        ```sh  theme={"system"}
        curl -X POST "https://api.privy.io/v1/wallets/authenticate" \
          -H "Authorization: Basic <insert-basic-auth-header>" \
          -H "Content-Type: application/json" \
          -H "privy-app-id: <insert-your-app-id>" \
          -d '{
            "user_jwt": <insert-user-jwt>
          }'
        ```

        A successful sample response will look like the following:

        ```json  theme={"system"}
        {
          "authorization_key": "<authorization-key>",
          "expires_at": 1715270400,
          "wallets": [
            {
              "id": "<wallet-id>",
              "chain_type": "ethereum",
              "address": "<wallet-address>"
            }
          ]
        }
        ```
      </Tab>
    </Tabs>
  </Accordion>

  ### 3. Decrypt the authorization key

  <Tabs>
    <Tab title="With encryption">
      Finally, decrypt the authorization key using the returned `encrypted_authorization_key.encapsulated_key` and `encrypted_authorization_key.ciphertext` fields, as well as the private key you generated in step 1.

      <Accordion title="Show code examples for decrypting the authorization key">
        <Tabs>
          <Tab title="TypeScript">
            ```ts  theme={"system"}
            import {Chacha20Poly1305} from '@hpke/chacha20poly1305';
            import {CipherSuite, DhkemP256HkdfSha256, HkdfSha256} from '@hpke/core';

            // Initialize the cipher suite
            const suite = new CipherSuite({
                kem: new DhkemP256HkdfSha256(),
                kdf: new HkdfSha256(),
                aead: new Chacha20Poly1305(),
            });

            // Convert base64 to ArrayBuffer using browser APIs
            const base64ToBuffer = (base64: string) => Uint8Array.from(atob(base64), (c) => c.charCodeAt(0)).buffer;

            // Import private key using WebCrypto
            const privateKey = await crypto.subtle.importKey(
                'pkcs8',
                base64ToBuffer('insert-base64-encoded-private-key'),
                {
                name: 'ECDH',
                namedCurve: 'P-256',
                },
                true,
                ['deriveKey', 'deriveBits'],
            );

            // Create recipient context and decrypt
            const recipient = await suite.createRecipientContext({
                recipientKey: privateKey,
                enc: base64ToBuffer('insert-encapsulated-key-from-api-response'),
            });

            return new TextDecoder().decode(await recipient.open(base64ToBuffer('insert-ciphertext-from-api-response')));
            ```
          </Tab>

          <Tab title="Python">
            ```python  theme={"system"}
            import base64
            from pyhpke import CipherSuite, KEM, KDF, AEAD
            from cryptography.hazmat.primitives import serialization

            def decrypt_hpke_message() -> str:
                # Initialize the cipher suite with P-256, HKDF-SHA256, and ChaCha20Poly1305
                suite = CipherSuite.new(
                    kem=KEM.DHKEM_P256_HKDF_SHA256,
                    kdf=KDF.HKDF_SHA256,
                    aead=AEAD.CHACHA20_POLY1305
                )

                # Decode base64 inputs
                private_key_bytes = base64.b64decode('insert-your-base64-encoded-private-key')
                encapsulated_key = base64.b64decode('insert-encapsulated-key-from-api-response')
                ciphertext = base64.b64decode('insert-ciphertext-from-api-response')

                # Load the private key from PKCS#8 format
                private_key = serialization.load_der_private_key(private_key_bytes, password=None)

                # Create recipient context and decrypt
                recipient = suite.create_recipient_context(
                    enc=encapsulated_key,
                    recipient_key=private_key
                )

                # Decrypt and return as string
                plaintext = recipient.open(ciphertext)
                return plaintext.decode('utf-8')
            ```
          </Tab>
        </Tabs>
      </Accordion>
    </Tab>

    <Tab title="Without encryption">
      If you did not provide a public key with which Privy encrypted the authorization key, you can skip this step. You can simply used the returned user `authorization_key` to sign requests.
    </Tab>
  </Tabs>

  ### 4. Sign requests with the authorization key

  Now that you have successfully retrieved the authorization key for your user, continue to [this guide](/controls/authorization-keys/using-owners/sign) to learn how to sign requests to the Privy API.
</View>
\n