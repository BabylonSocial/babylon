> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Export a wallet

**Privy enables your users to export the private key for their embedded wallet**. This allows them to use their embedded wallet address with another wallet client, such as MetaMask or Phantom.

## Availability

Key export is only available in certain environments depending on how the wallet was created.

<Expandable title="environments where key export is available.">
  The environments where key export is available depends on the environment where the wallet was created.

  ### Wallets created client-side

  Wallets created client-side (e.g. through Privy's React, React Native, Swift, etc. SDKs) can only be exported via the `exportWallet` method in the React SDK.\
  \
  Due to the sensitive nature of key export, it is only available in web environments where the operation can be secured with strict browser security guarantees.\
  \
  If you'd like to enable key export with one of Privy's other client-side SDKs, we encourage setting up a minimal web page with Privy's React SDK and export wallet functionality that you can direct users to.

  <Info>
    By default, to use wallets, users authenticate to the Privy API directly from their client using
    their access token. This means that users can send transactions or export their keys using their
    access token with the Privy API, even if an application does not implement Privy's `exportWallet`
    method. This design ensures users always retain self-sovereign access to their wallet keys.

    To prevent users from unilaterally exporting keys, applications can set up a [2-of-2 key quorum](/controls/key-quorum/overview) as the wallet owner, consisting of the user and an authorization key controlled by the application's server. This requires authorization from both parties to export the wallet.
  </Info>

  ### Wallets created server-side

  Wallets created server-side can only be exported via Privy's server-side SDKs or REST API. This ensures that wallets are securely exported in an encrypted interaction between your app's and Privy's infrastructure.
</Expandable>

## Supported chains

Key export is available for all wallets on [Tier 2 and Tier 3 chains](/wallets/overview/chains).

## Usage

<View title="React" icon="react">
  To have your user export their embedded wallet's private key, **use Privy's `exportWallet` method:**

  <Tabs>
    <Tab title="EVM">
      ```tsx  theme={"system"}
      import {usePrivy} from '@privy-io/react-auth';
      ...
      const {exportWallet} = usePrivy();
      ```
    </Tab>

    <Tab title="Solana">
      ```tsx  theme={"system"}
      import {useExportWallet} from '@privy-io/react-auth/solana';
      ...
      const {exportWallet} = useExportWallet();
      ```
    </Tab>
  </Tabs>

  When invoked, **`exportWallet`** will open a modal where your user can copy the full private key for their embedded wallet. The modal will also link your user to [a guide](https://privy-io.notion.site/Transferring-Your-App-Account-9dab9e16c6034a7ab1ff7fa479b02828) for how to load their embedded wallet into another wallet client, such as MetaMask or Phantom.

  If your user is not **`authenticated`** or has not yet created an embedded wallet in your app, this method will fail.

  As an example, you might attach **`exportWallet`** to an export wallet button in your app:

  <Tabs>
    <Tab title="EVM">
      ```tsx  theme={"system"}
      import {usePrivy} from '@privy-io/react-auth';

      function ExportWalletButton() {
        const {ready, authenticated, user, exportWallet} = usePrivy();
        // Check that your user is authenticated
        const isAuthenticated = ready && authenticated;
        // Check that your user has an embedded wallet
        const hasEmbeddedWallet = !!user.linkedAccounts.find(
          (account) =>
            account.type === 'wallet' &&
            account.walletClientType === 'privy' &&
            account.chainType === 'ethereum'
        );

        return (
          <button onClick={exportWallet} disabled={!isAuthenticated || !hasEmbeddedWallet}>
            Export my wallet
          </button>
        );
      }
      ```
    </Tab>

    <Tab title="Solana">
      ```tsx  theme={"system"}
      import {usePrivy, type WalletWithMetadata} from '@privy-io/react-auth';
      import {useExportWallet} from '@privy-io/react-auth/solana';

      function ExportWalletButton() {
        const {ready, authenticated, user} = usePrivy();
        const {exportWallet} = useExportWallet();
        // Check that your user is authenticated
        const isAuthenticated = ready && authenticated;
        // Check that your user has an embedded wallet
        const hasEmbeddedWallet = !!user.linkedAccounts.find(
          (account): account is WalletWithMetadata =>
            account.type === 'wallet' &&
            account.walletClientType === 'privy' &&
            account.chainType === 'solana'
        );

        return (
          <button onClick={exportWallet} disabled={!isAuthenticated || !hasEmbeddedWallet}>
            Export my wallet
          </button>
        );
      }
      ```
    </Tab>
  </Tabs>

  <Info>
    If your application uses [smart wallets](/wallets/using-wallets/evm-smart-wallets/overview) on EVM
    networks, exporting the wallet will export the private key for the **smart wallet's signer**, and
    not the smart wallet itself. Users can control their smart wallet via this private key, but will
    be required to manually use it to sign calls to the contract for their smart wallet directly to
    use the smart wallet outside of your app.
  </Info>

  ### Exporting HD wallets

  If your user has multiple embedded wallets, you can export the private key for a specific wallet by passing the address of your desired wallet as an `address` parameter to the `exportWallet` method:

  <Tabs>
    <Tab title="EVM">
      ```tsx  theme={"system"}
      import {exportWallet} from '@privy-io/react-auth';
      ...
      const {exportWallet} = usePrivy();
      await exportWallet({address: 'insert-your-desired-address'});
      ```
    </Tab>

    <Tab title="Solana">
      ```tsx  theme={"system"}
      import {useExportWallet} from '@privy-io/react-auth/solana';
      ...
      const {exportWallet} = useExportWallet();
      await exportWallet({address: 'insert-your-desired-address'});
      ```

      If no `address` is passed to `exportWallet`, Privy will default to exporting the wallet at `walletIndex: 0`.
    </Tab>
  </Tabs>

  <Info>
    When your user exports their embedded wallet, their private key is assembled on a different origin
    than your app's origin. This means neither you nor Privy can ever access your user's private key.{' '}
    <b>Your user is the only party that can ever access their full private key.</b>
  </Info>
</View>

<View title="NodeJS" icon="node-js">
  <Info>
    This guide is for the **`@privy-io/node`** library only, as the feature is not available in the
    **`@privy-io/server-auth`** library.
  </Info>

  To export a wallet's private key with the NodeJS / Typescript SDK, use the `export` method from the client’s `wallets()` interface.
  This will internally generate an ECDH P-256 keypair and use it to perform an encrypted HPKE operation with the Wallet API to export the wallet's private key.

  ```ts  theme={"system"}
  import {PrivyClient} from '@privy-io/node';

  const privy = new PrivyClient({
    appId: 'your-app-id',
    appSecret: 'your-app-secret'
  });

  try {
    const {private_key} = await privy.wallets().export('wallet-id', {});
  } catch (error) {
    console.error('Failed to export wallet:', error);
  }
  ```

  If the wallet is owned by an authorization key, a user, or a key quorum, you must provide in the
  owner's information in the [authorization context](/controls/authorization-keys/using-owners/sign/signing-on-the-server) when exporting the wallet.

  ```ts  theme={"system"}
  import {PrivyClient} from '@privy-io/node';

  const privy = new PrivyClient({
    appId: 'your-app-id',
    appSecret: 'your-app-secret'
  });

  const {private_key} = await privy.wallets().export('wallet-id', {
    authorization_context: {
      authorization_private_keys: ['authorization-key'],
      user_jwts: ['user-jwt', 'user-jwt-2']
    }
  });
  ```
</View>

<View title="REST API" icon="terminal">
  To export a wallet's private key via the REST API, use the `/v1/wallets/{wallet_id}/export` endpoint. This endpoint uses Hybrid Public Key Encryption (HPKE) to securely transmit the private key.

  <Warning>
    Wallet export is restricted to wallet owners and enabled by default, unless explicitly disabled by
    a [`DENY` policy](/controls/policies/overview#policies). Wallets without owners cannot be
    exported.
  </Warning>

  <Tabs>
    <Tab title="cURL">
      ```bash  theme={"system"}
      curl --request POST \
        --url https://api.privy.io/v1/wallets/{wallet_id}/export \
        --header 'Authorization: Basic <encoded-value>' \
        --header 'Content-Type: application/json' \
        --header 'privy-app-id: <privy-app-id>' \
        --header 'privy-authorization-signature: <privy-authorization-signature>'
        --data '{
          "encryption_type": "HPKE",
          "recipient_public_key": "<base64-encoded-recipient-public-key>"
        }'
      ```
    </Tab>

    <Tab title="Typescript/Javascript">
      ```ts  theme={"system"}
      import {generateAuthorizationSignature} from "@privy-io/server-auth/wallet-api"

      // Generate a base64-encoded key pair for the recipient
      const keypair = await crypto.subtle.generateKey(
        {
          name: "ECDH",
          namedCurve: "P-256"
        },
        true,
        ["deriveKey", "deriveBits"]
      )
      const [publicKey, privateKey] = await Promise.all([
        crypto.subtle.exportKey("spki", keypair.value.publicKey),
        crypto.subtle.exportKey("pkcs8", keypair.value.privateKey)
      ])
      const [publicKeyBase64, privateKeyBase64] = [
        Buffer.from(publicKey).toString("base64"),
        Buffer.from(privateKey).toString("base64")
      ]

      // Create the signature for the request
      const input = {
        headers: {
          "privy-app-id": "your-privy-app-id",
        },
        method: "POST",
        url: `https://api.privy.io/v1/wallets/${walletId}/export`,
        version: 1,
        body: {
          encryption_type: "HPKE",
          recipient_public_key: publicKeyBase64,
        },
      };
      const signature = generateAuthorizationSignature({
        input: input,
        authorizationPrivateKey: "your-privy-authorization-private-key" // This should be the private key of your authorization key
      })

      // Make the request to export the wallet
      const res = await fetch(
        `https://api.privy.io/v1/wallets/${walletId}/export`,
        {
          method: input.method,
          headers: {
            ...input.headers,
            "Content-Type": "application/json",
            "privy-authorization-signature": signature as string,
            Authorization: generateBasicAuthHeader(
              "your-privy-app-id",
              "your-privy-app-secret"
            ),
          },
          body: JSON.stringify(input.body),
        }
      );
      ```
    </Tab>

    <Tab title="Python">
      ```python  theme={"system"}
      import requests
      import base64
      from cryptography.hazmat.primitives.asymmetric import ec
      from cryptography.hazmat.primitives import serialization

      # Generate a key pair for the recipient
      private_key = ec.generate_private_key(ec.SECP256R1())
      public_key = private_key.public_key()

      # Export keys to base64
      public_key_base64 = base64.b64encode(
          public_key.public_bytes(
              encoding=serialization.Encoding.PEM,
              format=serialization.PublicFormat.SubjectPublicKeyInfo
          )
      ).decode('utf-8')

      # Prepare the request data
      data = {
          "encryption_type": "HPKE",
          "recipient_public_key": public_key_base64,
      }

      # Make the request to export the wallet
      response = requests.post(
          f'https://api.privy.io/v1/wallets/{wallet_id}/export',
          headers={
              'Authorization': 'Basic <encoded-value>',
              'Content-Type': 'application/json',
              'privy-app-id': '<privy-app-id>',
              'privy-authorization-signature': '<privy-authorization-signature>'
          },
          json=data
      )
      ```
    </Tab>
  </Tabs>

  The endpoint will return the encrypted private key along with the encapsulation information needed for decryption:

  ```json  theme={"system"}
  {
    "encryption_type": "HPKE",
    "ciphertext": "Zb2XqqIpPlQKJhkb9GRoXa8N6pKLAlozYnXg713g7mCu5vvn6tGIRbeJj4XOUQkFeB9DRxKg",
    "encapsulated_key": "BLplgxEpMz+WMxDSOzGZe+Oa5kkt9FTxUudRRyO5zRj/OaDbUaddlE18uNv8UKxpecnrSy+UByG2C3oJTgTnGNk="
  }
  ```

  ### Decrypting the Private Key

  The exported private key is encrypted using Hybrid Public Key Encryption (HPKE) with the following configuration:

  * KEM: DHKEM\_P256\_HKDF\_SHA256
  * KDF: HKDF\_SHA256
  * AEAD: CHACHA20\_POLY1305
  * Mode: BASE

  To decrypt the private key, you'll need to use these same parameters along with your recipient private key. Here's how to implement the decryption in several languages:

  <Tabs>
    <Tab title="TypeScript">
      <CodeGroup>
        ```ts decrypt.ts theme={"system"}
        import {CipherSuite, DhkemP256HkdfSha256, HkdfSha256} from '@hpke/core';
        import {Chacha20Poly1305} from '@hpke/chacha20poly1305';

        /**
         * Decrypts a message using HPKE (Hybrid Public Key Encryption).
         *
         * Uses P-256 keys with HPKE to decrypt an encrypted message. The function expects base64-encoded
         * inputs and handles all necessary key imports and context creation for HPKE decryption.
         *
         * @param privateKeyBase64 Base64-encoded private key in PKCS8 format used for decryption.
         * @param encapsulatedKeyBase64 Base64-encoded raw public key bytes representing the
         *     encapsulated key.
         * @param ciphertextBase64 Base64-encoded encrypted message using base64url encoding that
         *     will be decrypted.
         * @returns A Promise that resolves to the decrypted message as a UTF-8 string.
         * @throws {Error} If decryption fails or if any of the inputs are incorrectly formatted.
         */
        async function decryptHPKEMessage(
          privateKeyBase64: string,
          encapsulatedKeyBase64: string,
          ciphertextBase64: string
        ): Promise<string> {
          // Initialize the cipher suite
          const suite = new CipherSuite({
            kem: new DhkemP256HkdfSha256(),
            kdf: new HkdfSha256(),
            aead: new Chacha20Poly1305()
          });

          // Convert base64 to ArrayBuffer using browser APIs
          const base64ToBuffer = (base64: string) =>
            Uint8Array.from(atob(base64), (c) => c.charCodeAt(0)).buffer;

          // Import private key using WebCrypto
          const privateKey = await crypto.subtle.importKey(
            'pkcs8',
            base64ToBuffer(privateKeyBase64),
            {
              name: 'ECDH',
              namedCurve: 'P-256'
            },
            true,
            ['deriveKey', 'deriveBits']
          );

          // Create recipient context and decrypt
          const recipient = await suite.createRecipientContext({
            recipientKey: privateKey,
            enc: base64ToBuffer(encapsulatedKeyBase64)
          });

          return new TextDecoder().decode(await recipient.open(base64ToBuffer(ciphertextBase64)));
        }
        ```

        ```ts example.ts {skip-check} theme={"system"}
        // The response from the export API endpoint
        const response = {
          encryption_type: 'HPKE',
          ciphertext: 'Zb2XqqIpPlQKJhkb9GRoXa8N6pKLAlozYnXg713g7mCu5vvn6tGIRbeJj4XOUQkFeB9DRxKg',
          encapsulated_key:
            'BLplgxEpMz+WMxDSOzGZe+Oa5kkt9FTxUudRRyO5zRj/OaDbUaddlE18uNv8UKxpecnrSy+UByG2C3oJTgTnGNk='
        };

        // Replace with your base64-encoded private key
        const privateKeyBase64 =
          'MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgU4RP++trEcTL2CPSgX9dKZAQ+XW3Pt49PNI4Elwia1qhRANCAAROjlGlaxrE9rIRc2jy0xmW7ajzkRqccVJsc2WMsXKoB2lG5NllwkSHwWsZkDbmqhYFk/WlDYl/MCiLnYYVtJf+';

        try {
          const privateKey = await decryptHPKEMessage(
            privateKeyBase64,
            response.encapsulated_key,
            response.ciphertext
          );
          console.log('Decrypted private key:', privateKey);
        } catch (error) {
          console.error('Failed to decrypt:', error);
        }
        ```
      </CodeGroup>
    </Tab>

    <Tab title="Python">
      <CodeGroup>
        ```python decrypt.py theme={"system"}
        from cryptography.hazmat.primitives import serialization
        from hpke import CipherSuite, KEMId, KDFId, AEADId
        import base64

        async def decrypt_hpke_message(
            private_key_base64: str,
            encapsulated_key_base64: str,
            ciphertext_base64: str
        ) -> str:
            """
            Decrypts a message using HPKE (Hybrid Public Key Encryption) with P-256 keys

            Args:
                private_key_base64: Base64-encoded private key in PKCS8 format used for decryption.
                encapsulated_key_base64: Base64-encoded raw public key bytes representing the
                                        encapsulated key.
                ciphertext_base64: Base64-encoded encrypted message using base64url encoding that
                                  will be decrypted.

            Returns:
                str: The decrypted message as a UTF-8 string

            Raises:
                ValueError: If decryption fails or if inputs are incorrectly formatted
            """
            # Initialize the cipher suite
            suite = CipherSuite.new(
                KEMId.DHKEM_P256_HKDF_SHA256,
                KDFId.HKDF_SHA256,
                AEADId.CHACHA20_POLY1305
            )

            # Convert base64 to bytes
            raw_public_key = base64.b64decode(encapsulated_key_base64)
            private_key_bytes = base64.b64decode(private_key_base64)
            ciphertext = base64.b64decode(ciphertext_base64)

            # Import private key
            loaded_private_key = serialization.load_der_private_key(
                private_key_bytes,
                password=None
            )
            private_number = loaded_private_key.private_numbers().private_value
            private_bytes = private_number.to_bytes(32, byteorder="big")  # P-256 uses 32 bytes
            private_kem_key = suite.kem.deserialize_private_key(private_bytes)

            # Create recipient context and decrypt
            encapsulated_kem_key = suite.kem.deserialize_public_key(raw_public_key)
            recipient_context = suite.create_recipient_context(
                encapsulated_kem_key.to_public_bytes(),
                private_kem_key
            )

            # Decrypt and return as UTF-8 string
            return recipient_context.open(ciphertext).decode("utf-8")
        ```

        ```python example.py theme={"system"}
        # The response from the export API endpoint
        response = {
            "encryption_type": "HPKE",
            "ciphertext": "Zb2XqqIpPlQKJhkb9GRoXa8N6pKLAlozYnXg713g7mCu5vvn6tGIRbeJj4XOUQkFeB9DRxKg",
            "encapsulated_key": "BLplgxEpMz+WMxDSOzGZe+Oa5kkt9FTxUudRRyO5zRj/OaDbUaddlE18uNv8UKxpecnrSy+UByG2C3oJTgTnGNk="
        }

        # Replace with your base64-encoded private key
        private_key_base64 = "MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgU4RP++trEcTL2CPSgX9dKZAQ+XW3Pt49PNI4Elwia1qhRANCAAROjlGlaxrE9rIRc2jy0xmW7ajzkRqccVJsc2WMsXKoB2lG5NllwkSHwWsZkDbmqhYFk/WlDYl/MCiLnYYVtJf+"

        # Decrypt the private key
        private_key = decrypt_hpke_message(
            private_key_base64, response["encapsulated_key"], response["ciphertext"]
        )
        print(private_key)
        ```
      </CodeGroup>
    </Tab>
  </Tabs>
</View>

<View title="Rust" icon="rust">
  To export a wallet's private key with the Rust SDK, use the `export` method from the client's `wallets()` interface. This will internally generate an ECDH P-256 keypair and use it to perform an encrypted HPKE operation with the Wallet API to export the wallet's private key.

  <Warning>
    Wallet export is restricted to wallet owners and enabled by default, unless explicitly disabled by a [`DENY` policy](/controls/policies/overview#policies). Wallets without owners cannot be exported.
  </Warning>

  ### Usage

  ```rust  theme={"system"}
  use privy_rs::{PrivyClient, AuthorizationContext, JwtUser};

  let client = PrivyClient::new(app_id, app_secret)?;

  // Create authorization context with user JWT
  let jwt_user = JwtUser(client.clone(), "user-jwt-token".to_string());
  let ctx = AuthorizationContext::new().push(jwt_user);

  // Export the wallet - encryption is handled automatically
  let exported = client
      .wallets()
      .export("wallet-id", &ctx)
      .await?;

  println!("Wallet exported successfully: {:?}", exported);
  ```

  ### Parameters and Returns

  See the Rust SDK documentation for detailed parameter and return types, including embedded examples:

  * [WalletsClient::export](https://docs.rs/privy-rs/latest/privy_rs/subclients/struct.WalletsClient.html#method.export)
  * [AuthorizationContext](https://docs.rs/privy-rs/latest/privy_rs/struct.AuthorizationContext.html)

  For REST API details, see the [API reference](/api-reference/wallets/export).

  <Info>
    The Rust SDK automatically handles HPKE encryption internally. The `export` method returns the decrypted private key directly, simplifying the export process while maintaining security through encrypted transmission.
  </Info>
</View>

<View title="Go" icon="golang">
  To export a wallet's private key with the Go SDK, use the `Export` method on the `Wallets` service.

  <Warning>
    Wallet export is restricted to wallet owners and enabled by default, unless explicitly disabled by
    a [`DENY` policy](/controls/policies/overview#policies). Wallets without owners cannot be
    exported.
  </Warning>

  ### Usage

  ```go  theme={"system"}
  exported, err := client.Wallets.Export(
      context.Background(),
      "wallet-id",
      privy.WalletExportParams{
          EncryptionType:     privy.WalletExportParamsEncryptionTypeHpke,
          RecipientPublicKey: "base64-encoded-public-key",
      },
  )
  if err != nil {
      log.Fatalf("failed to export wallet: %v", err)
  }

  fmt.Println("Ciphertext:", exported.Ciphertext)
  fmt.Println("Encapsulated key:", exported.EncapsulatedKey)
  ```

  ### Parameters and Returns

  See the [API reference](/api-reference/wallets/export) for more details.

  <Info>
    The `Export` method returns the encrypted private key (`Ciphertext`) and the encapsulated key
    (`EncapsulatedKey`). Your app must decrypt the ciphertext using the corresponding private key for
    the `RecipientPublicKey` provided in the request.
  </Info>
</View>

## Private key formats

The format of the exported private key varies depending on the chain type of the wallet:

| Chain      | Format            | Example                 |
| ---------- | ----------------- | ----------------------- |
| Ethereum   | Hex               | `0x...`                 |
| Solana     | Base58            | `5K...`                 |
| Spark      | Mnemonic          | `word1 word2 word3 ...` |
| NEAR       | ed25519: prefixed | `ed25519:...`           |
| Sui        | suiprivkey bech32 | `suiprivkey...`         |
| Bitcoin    | WIF               | `KwDi...`               |
| All others | Hex               | `0x...`                 |
\n