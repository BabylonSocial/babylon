> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Private keys

**Privy enables you to import wallet private keys for use via the Privy API.**

This allows you to migrate wallets from external sources to Privy, including from a different wallet provider. Or, your app can enable users to bring an existing external wallet into your application in order to access and manage their assets within your app seamlessly.

## Importing a wallet

<View title="React" icon="react">
  To import a private key wallet with the React SDK, use the `importWallet` method from the `useImportWallet` hook:

  ```tsx  theme={"system"}
  importWallet: (input: {privateKey: string}) => Promise<Wallet>;
  ```

  <Tabs>
    <Tab title="EVM">
      ### Usage

      ```tsx  theme={"system"}
      import {useImportWallet} from '@privy-io/react-auth';

      const {importWallet} = useImportWallet();

      const wallet = await importWallet({
        privateKey: 'your-wallet-private-key'
      });
      ```

      ### Parameters

      <ParamField header="privateKey" type="string">
        The hex-encoded private key of the ethereum wallet to import, with or without a `0x` prefix.
      </ParamField>

      ### Returns

      <ResponseField name="wallet" type="Promise<Wallet>">
        A `Promise` for the imported wallet object.
      </ResponseField>
    </Tab>

    <Tab title="Solana">
      ### Usage

      ```tsx  theme={"system"}
      import {useImportWallet} from '@privy-io/react-auth/solana';

      const {importWallet} = useImportWallet();

      const wallet = await importWallet({
        privateKey: 'your-wallet-private-key'
      });
      ```

      ### Parameters

      <ParamField header="privateKey" type="string">
        The base58-encoded private key of the solana wallet to import.
      </ParamField>

      ### Returns

      <ResponseField name="wallet" type="Promise<Wallet>">
        A `Promise` for the imported wallet object.
      </ResponseField>
    </Tab>
  </Tabs>
</View>

<View title="NodeJS" icon="node-js">
  To import a private key wallet with the NodeJS SDK, use the `import` method from the Privy client’s `wallets()` interface. The Privy client will encrypt your private key for secure transmission to the TEE. See [architecture](/wallets/wallets/import-a-wallet/architecture) for more details.

  <Tabs>
    <Tab title="EVM">
      For EVM wallets, the Privy client accepts a hex-encoded private key, with or without a `0x` prefix.

      ```ts  theme={"system"}
      import {PrivyClient} from '@privy-io/node';

      const privy = new PrivyClient({
        appId: 'your-app-id',
        appSecret: 'your-app-secret'
      });

      try {
        const wallet = await privy.wallets().import({
          wallet: {
            entropy_type: 'private-key',
            chain_type: 'ethereum',
            address: '<your-wallet-address>',
            private_key: '<your-hex-encoded-wallet-private-key>'
          }
        });
      } catch (error) {
        console.error('Failed to import wallet:', error);
      }
      ```

      Alternatively, you can also pass the private key directly as binary (`Uint8Array`).

      ```ts  theme={"system"}
      import {PrivyClient} from '@privy-io/node';

      const privy = new PrivyClient({
        appId: 'your-app-id',
        appSecret: 'your-app-secret'
      });

      const wallet = await privy.wallets().import({
        wallet: {
          entropy_type: 'private-key',
          chain_type: 'ethereum',
          address: '<your-wallet-address>',
          private_key: '<your-uint8array-wallet-private-key>'
        }
      });
      ```
    </Tab>

    <Tab title="Solana">
      For Solana wallets, the Privy client accepts a base58-encoded private key.

      ```ts  theme={"system"}
      import {PrivyClient} from '@privy-io/node';

      const privy = new PrivyClient({
        appId: 'your-app-id',
        appSecret: 'your-app-secret'
      });

      try {
        const wallet = await privy.wallets().import({
          wallet: {
            entropy_type: 'private-key',
            chain_type: 'solana',
            address: '<your-wallet-address>',
            private_key: '<your-base58-encoded-wallet-private-key>'
          }
        });
      } catch (error) {
        console.error('Failed to import wallet:', error);
      }
      ```

      Alternatively, you can also pass the private key directly as binary (`Uint8Array`).

      ```ts  theme={"system"}
      import {PrivyClient} from '@privy-io/node';

      const privy = new PrivyClient({
        appId: 'your-app-id',
        appSecret: 'your-app-secret'
      });

      const wallet = await privy.wallets().import({
        wallet: {
          entropy_type: 'private-key',
          chain_type: 'solana',
          address: '<your-wallet-address>',
          private_key: '<your-uint8array-wallet-private-key>'
        }
      });
      ```
    </Tab>
  </Tabs>

  The returned wallet is type `Wallet`. See [get wallet by ID](/api-reference/wallets/get) for type definition.
</View>

<View title="NodeJS (server-auth)" icon="node-js">
  <Warning>
    The `@privy-io/server-auth` library is deprecated. We recommend integrating `@privy-io/node` for
    the latest features and support.
  </Warning>

  To import a private key wallet with the NodeJS SDK, use the `importWallet` method from the Privy client’s `walletApi` class. The Privy client will encrypt your private key for secure transmission to the TEE. See [architecture](/wallets/wallets/import-a-wallet/architecture) for more details.

  <Tabs>
    <Tab title="EVM">
      For EVM wallets, the Privy client accepts a hex-encoded private key, with or without a `0x` prefix.

      ```ts  theme={"system"}
      import {PrivyClient, WalletApiWalletResponseType} from '@privy-io/server-auth';

      const privy = new PrivyClient('your-app-id', 'your-app-secret');

      const wallet: WalletApiWalletResponseType = await privy.walletApi.importWallet({
        address: '<your-wallet-address>',
        chainType: 'ethereum',
        entropy: '<your-hex-encoded-wallet-private-key>',
        entropyType: 'private-key'
      });
      ```
    </Tab>

    <Tab title="Solana">
      For Solana wallets, the Privy client accepts a base58-encoded private key.

      ```ts  theme={"system"}
      import {PrivyClient, WalletApiWalletResponseType} from '@privy-io/server-auth';

      const privy = new PrivyClient('your-app-id', 'your-app-secret');

      const wallet: WalletApiWalletResponseType = await privy.walletApi.importWallet({
        address: '<your-wallet-address>',
        chainType: 'solana',
        entropy: '<your-base58-encoded-wallet-private-key>',
        entropyType: 'private-key'
      });
      ```
    </Tab>
  </Tabs>

  The returned wallet is type `WalletApiWalletResponseType`. See [get wallet by ID](/wallets/wallets/get-a-wallet/get-wallet-by-id#returns) for type definition.
</View>

<View title="REST API" icon="terminal">
  ### 1. Initialization

  Initialize a key import flow by calling the `/v1/wallets/import/init` endpoint with your wallet address and chain type. See [authentication](/api-reference/introduction#authentication) for how to encode your app credentials.

  <Tabs>
    <Tab title="EVM">
      ```bash  theme={"system"}
      curl --request POST \
        --url https://api.privy.io/v1/wallets/import/init \
        --header 'Authorization: Basic <encoded-app-credentials>' \
        --header 'Content-Type: application/json' \
        --header 'privy-app-id: <privy-app-id>' \
        --data '{
          "address": "<your-wallet-address>",
          "chain_type": "ethereum",
          "entropy_type": "private-key",
          "encryption_type": "HPKE"
        }'
      ```
    </Tab>

    <Tab title="Solana">
      ```bash  theme={"system"}
      curl --request POST \
        --url https://api.privy.io/v1/wallets/import/init \
        --header 'Authorization: Basic <encoded-app-credentials>' \
        --header 'Content-Type: application/json' \
        --header 'privy-app-id: <privy-app-id>' \
        --data '{
          "address": "<your-wallet-address>",
          "chain_type": "solana",
          "entropy_type": "private-key",
          "encryption_type": "HPKE"
        }'
      ```
    </Tab>
  </Tabs>

  The endpoint will return a public key to encrypt your private key with:

  ```json  theme={"system"}
  {
    "encryption_public_key": "<base64-encoded-encryption-public-key>",
    "encryption_type": "HPKE"
  }
  ```

  ### 2. Encryption

  Encrypt your private key using Hybrid Public Key Encryption (HPKE) with the following configuration:

  * KEM: DHKEM\_P256\_HKDF\_SHA256
  * KDF: HKDF\_SHA256
  * AEAD: CHACHA20\_POLY1305
  * Mode: BASE

  There are two outputs from the encryption step that you'll provide to Privy during submission:

  * `ciphertext`: The encrypted private key
  * `encapsulated_key`: The encapsulated key

  Here's an example of how to encrypt a private key in TypeScript:

  <Tabs>
    <Tab title="EVM">
      ```ts  theme={"system"}
      import {Chacha20Poly1305} from '@hpke/chacha20poly1305';
      import {CipherSuite, DhkemP256HkdfSha256, HkdfSha256} from '@hpke/core';
      import {base64} from '@scure/base';

      const encryptWithHpke = async ({
        encryptionPublicKey,
        plaintextPrivateKey
      }: {
        encryptionPublicKey: Uint8Array;
        plaintextPrivateKey: Uint8Array;
      }) => {
        // Deserialize the raw key returned by the `init` request to the Privy API to a public key object
        const suite = new CipherSuite({
          kem: new DhkemP256HkdfSha256(),
          kdf: new HkdfSha256(),
          aead: new Chacha20Poly1305()
        });
        const publicKeyObject = await suite.kem.deserializePublicKey(
          Buffer.from(encryptionPublicKey).buffer
        );

        // Encrypt the plaintext wallet private key
        const sender = await suite.createSenderContext({
          recipientPublicKey: publicKeyObject
        });
        const ciphertext = await sender.seal(Buffer.from(plaintextPrivateKey).buffer);

        // Return the encapsulated key and ciphertext, converting ArrayBuffer to Uint8Array
        return {
          encapsulatedKey: new Uint8Array(sender.enc),
          ciphertext: new Uint8Array(ciphertext)
        };
      };

      // The encryption public key is returned by the `init` request to the Privy API
      // For example: BPoOQ5k9nRk37v+XQWkmFEjpvW6RS0HQsPF3+IbhgMlc2Qwp/vz7lln1h0MJj/l0crLUhyyjdmC9RnAcpAkUNVQ=
      const base64EncodedEncryptionPublicKey = '<encryption-public-key>';
      // The wallet private key in hex format. This may have a '0x' prefix or may not depending on the
      // provider you're importing from, so make sure to remove it before encrypting if present as shown below.
      // For example: 0xe42f4dc0c8396e93891f05c3a34228c395f9b02505ffd0e79d7d2098af8b20a3
      const hexEncodedPlaintextPrivateKey = '<your-wallet-private-key>';

      const {encapsulatedKey, ciphertext} = await encryptWithHpke({
        encryptionPublicKey: base64.decode(base64EncodedEncryptionPublicKey),
        plaintextPrivateKey: new Uint8Array(
          Buffer.from(
            // Be sure to remove the `0x` prefix if present
            hexEncodedPlaintextPrivateKey.replace(/^0x/, ''),
            'hex'
          )
        )
      });
      ```
    </Tab>

    <Tab title="Solana">
      ```ts  theme={"system"}
      import {Chacha20Poly1305} from '@hpke/chacha20poly1305';
      import {CipherSuite, DhkemP256HkdfSha256, HkdfSha256} from '@hpke/core';
      import {base58, base64} from '@scure/base';

      const encryptWithHpke = async ({
        encryptionPublicKey,
        plaintextPrivateKey
      }: {
        encryptionPublicKey: Uint8Array;
        plaintextPrivateKey: Uint8Array;
      }) => {
        // Deserialize the raw key returned by the `init` request to the Privy API to a public key object
        const suite = new CipherSuite({
          kem: new DhkemP256HkdfSha256(),
          kdf: new HkdfSha256(),
          aead: new Chacha20Poly1305()
        });
        const publicKeyObject = await suite.kem.deserializePublicKey(
          Buffer.from(encryptionPublicKey).buffer
        );

        // Encrypt the plaintext wallet private key
        const sender = await suite.createSenderContext({
          recipientPublicKey: publicKeyObject
        });
        const ciphertext = await sender.seal(Buffer.from(plaintextPrivateKey).buffer);

        // Return the encapsulated key and ciphertext, converting ArrayBuffer to Uint8Array
        return {
          encapsulatedKey: new Uint8Array(sender.enc),
          ciphertext: new Uint8Array(ciphertext)
        };
      };

      // The encryption public key is returned by the `init` request to the Privy API
      // For example: BPoOQ5k9nRk37v+XQWkmFEjpvW6RS0HQsPF3+IbhgMlc2Qwp/vz7lln1h0MJj/l0crLUhyyjdmC9RnAcpAkUNVQ=
      const base64EncodedEncryptionPublicKey = '<encryption-public-key>';
      // The wallet private key in base58 format. This is commonly the format used when exporting a Solana wallet from another provider.
      // For example: 4ANrq8ysACrNqmjWnekSPpud8GEdPN9YB7isMBbCxKWYrzcyAWnttYe8dPxfkhkR9mwLh4SfyZx4cUXnJAmZvbQ2
      const base58EncodedPlaintextPrivateKey = '<your-wallet-private-key>';

      const {encapsulatedKey, ciphertext} = await encryptWithHpke({
        encryptionPublicKey: base64.decode(base64EncodedEncryptionPublicKey),
        plaintextPrivateKey: base58.decode(base58EncodedPlaintextPrivateKey)
      });
      ```
    </Tab>
  </Tabs>

  ### 3. Submission

  Submit your encrypted private key to the Privy API by calling the `/v1/wallets/import/submit` endpoint with the rest of your wallet configuration (e.g. an owner, policies, or signers). See [creating a wallet](/api-reference/wallets/create) for more information on configuration options.

  <Tabs>
    <Tab title="EVM">
      ```bash  theme={"system"}
      curl --request POST \
        --url https://api.privy.io/v1/wallets/import/submit \
        --header 'Authorization: Basic <encoded-app-credentials>' \
        --header 'Content-Type: application/json' \
        --header 'privy-app-id: <privy-app-id>' \
        --data '{
          "wallet": {
            "address": "<your-wallet-address>",
            "chain_type": "ethereum",
            "entropy_type": "private-key",
            "encryption_type": "HPKE",
            "ciphertext": "<base64-encoded-encrypted-private-key>",
            "encapsulated_key": "<base64-encoded-encapsulated-key>"
          },
          // Optional additional configuration
          "owner": {...},
          "policy_ids": [...],
          "additional_singers": [...]
        }'
      ```
    </Tab>

    <Tab title="Solana">
      ```bash  theme={"system"}
      curl --request POST \
        --url https://api.privy.io/v1/wallets/import/submit \
        --header 'Authorization: Basic <encoded-app-credentials>' \
        --header 'Content-Type: application/json' \
        --header 'privy-app-id: <privy-app-id>' \
        --data '{
          "wallet": {
            "address": "<your-wallet-address>",
            "chain_type": "solana",
            "entropy_type": "private-key",
            "encryption_type": "HPKE",
            "ciphertext": "<base64-encoded-encrypted-private-key>",
            "encapsulated_key": "<base64-encoded-encapsulated-key>"
          },
          // Optional additional configuration
          "owner": {...},
          "policy_ids": [...],
          "additional_singers": [...]
        }'
      ```
    </Tab>
  </Tabs>

  The endpoint will return the wallet object of your imported wallet:

  <Tabs>
    <Tab title="EVM">
      ```json  theme={"system"}
      {
        "id": "<privy-wallet-id>",
        "address": "<your-wallet-address>",
        "chain_type": "ethereum",
        "policy_ids": [],
        "additional_signers": [],
        "exported_at": null,
        "imported_at": 1753300563195,
        "created_at": 1753300563197,
        "owner_id": null
      }
      ```
    </Tab>

    <Tab title="Solana">
      ```json  theme={"system"}
      {
        "id": "<privy-wallet-id>",
        "address": "<your-wallet-address>",
        "chain_type": "solana",
        "policy_ids": [],
        "additional_signers": [],
        "exported_at": null,
        "imported_at": 1753300563195,
        "created_at": 1753300563197,
        "owner_id": null
      }
      ```
    </Tab>
  </Tabs>
</View>

<View title="Rust" icon="rust">
  To import a private key wallet with the Rust SDK, use the `import()` method. The Rust SDK automatically handles the HPKE encryption for secure transmission to the TEE. See [architecture](/wallets/wallets/import-a-wallet/architecture) for more details.

  ### Usage

  ```rust  theme={"system"}
  use privy_rs::{PrivyClient, generated::types::*};

  let client = PrivyClient::new(app_id, app_secret)?;

  // Import an Ethereum wallet from private key
  let imported_wallet = client
      .wallets()
      .import(
          "0x742d35Cc6635C0532925a3b8D2dB4C5e64b1C0dB", // wallet address
          "your-hex-encoded-private-key", // private key (with or without 0x prefix)
          WalletImportSupportedChains::Ethereum,
          None,   // owner
          vec![], // policy_ids
          vec![], // additional_signers
      )
      .await?
      .into_inner();

  println!("Imported wallet {} with address {}", imported_wallet.id, imported_wallet.address);
  ```

  ### Parameters and Returns

  See the Rust SDK documentation for detailed parameter and return types, including embedded examples:

  * [WalletsClient::import](https://docs.rs/privy-rs/latest/privy_rs/subclients/struct.WalletsClient.html#method.import)
  * [WalletImportBody](https://docs.rs/privy-rs/latest/privy_rs/generated/types/struct.WalletImportBody.html)
  * [WalletImportData](https://docs.rs/privy-rs/latest/privy_rs/generated/types/struct.WalletImportData.html)
  * [Wallet](https://docs.rs/privy-rs/latest/privy_rs/generated/types/struct.Wallet.html)

  For REST API details, see the [API reference](/api-reference/wallets/import).

  <Info>
    The Rust SDK automatically handles the HPKE encryption process internally when importing wallets. You don't need to manually encrypt the private key - simply provide the raw private key string and the SDK will handle secure transmission to Privy's infrastructure.
  </Info>
</View>

<View title="Go" icon="golang">
  To import a private key wallet with the Go SDK, use the `InitImport` and `SubmitImport` methods. The SDK handles HPKE encryption for secure transmission to the TEE. See [architecture](/wallets/wallets/import-a-wallet/architecture) for more details.

  ### Usage

  ```go  theme={"system"}
  // Step 1: Initialize import
  initResp, err := client.Wallets.InitImport(context.Background(), privy.WalletInitImportParams{
      OfPrivateKey: &privy.WalletInitImportParamsBodyPrivateKey{
          Address:        "your-wallet-address",
          ChainType:      "ethereum",
          EncryptionType: "HPKE",
      },
  })
  if err != nil {
      log.Fatalf("failed to init import: %v", err)
  }

  // Step 2: Encrypt the private key using the public key from initResp, then submit
  wallet, err := client.Wallets.SubmitImport(context.Background(), privy.WalletSubmitImportParams{
      Wallet: privy.WalletSubmitImportParamsWalletUnion{
          OfPrivateKey: &privy.WalletSubmitImportParamsWalletPrivateKey{
              Address:         "your-wallet-address",
              ChainType:       "ethereum",
              EncryptionType:  "HPKE",
              Ciphertext:      "base64-encoded-encrypted-private-key",
              EncapsulatedKey: "base64-encoded-encapsulated-key",
          },
      },
  })
  if err != nil {
      log.Fatalf("failed to submit import: %v", err)
  }

  fmt.Println("Imported wallet:", wallet.ID, wallet.Address)
  ```

  ### Parameters and Returns

  See the [API reference](/api-reference/wallets/import) for more details.
</View>

## Using imported wallets

Imported wallets function the same way as Privy-generated wallets. See the API reference for [Ethereum](/api-reference/wallets/ethereum/eth-send-transaction) or [Solana](/api-reference/wallets/solana/sign-and-send-transaction) for information about how to send transactions and execute other wallet operations.
\n