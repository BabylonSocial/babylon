> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# HD wallets

**Privy enables you to import HD wallets for use via the Privy API.**

This allows you to migrate wallets from external sources to Privy, including from a different wallet provider. Or, your app can enable users to bring an existing external wallet into your application in order to access and manage their assets within your app seamlessly.

## Importing a wallet

To import an HD wallet, you'll provide your 12 or 24 word BIP39 mnemonic and the specific address and index you'd like to import.

<Info>
  If you'd like to import multiple addresses for the same HD wallet, you can make multiple import calls with the same mnemonic and each index/address pair you'd like to import.
</Info>

<View title="NodeJS" icon="node-js">
  To import an HD wallet with the NodeJS SDK, use the `import` method from the Privy client's `wallets()` interface. The Privy client will encrypt your mnemonic for secure transmission to the TEE. See [architecture](/wallets/wallets/import-a-wallet/architecture) for more details.

  <Tabs>
    <Tab title="Ethereum">
      ```ts  theme={"system"}
      import {PrivyClient} from '@privy-io/node';

      const privy = new PrivyClient({
        appId: 'your-app-id',
        appSecret: 'your-app-secret'
      });

      try {
        const wallet = await privy.wallets().import({
          wallet: {
            entropy_type: 'hd',
            address: '<your-wallet-address>',
            chain_type: 'ethereum',
            private_key: '<your-bip39-mnemonic>',
            index: 0 // your wallet index, typically 0 for the first address
          }
        });
      } catch (error) {
        console.error('Failed to import wallet:', error);
      }
      ```
    </Tab>

    <Tab title="Solana">
      ```ts  theme={"system"}
      import {PrivyClient} from '@privy-io/node';

      const privy = new PrivyClient({
        appId: 'your-app-id',
        appSecret: 'your-app-secret'
      });

      try {
        const wallet = await privy.wallets().import({
          wallet: {
            entropy_type: 'hd',
            address: '<your-wallet-address>',
            chain_type: 'solana',
            private_key: '<your-bip39-mnemonic>',
            index: 0 // your wallet index, typically 0 for the first address
          }
        });
      } catch (error) {
        console.error('Failed to import wallet:', error);
      }
      ```
    </Tab>
  </Tabs>

  The returned wallet is type `Wallet`. See [get wallet by ID](/api-reference/wallets/get) for type definition.

  When importing a wallet, it is also possible to provide an owner, policies, or signers.

  ```ts  theme={"system"}
  import {PrivyClient} from '@privy-io/node';

  const privy = new PrivyClient({
    appId: 'your-app-id',
    appSecret: 'your-app-secret'
  });

  const wallet = await privy.wallets().import({
    wallet: {
      entropy_type: 'hd',
      address: '<your-wallet-address>',
      chain_type: 'solana', // or "ethereum"
      private_key: '<your-bip39-mnemonic>',
      index: 0 // your wallet index, typically 0 for the first address
    },
    owner_id: '<your-owner-id>',
    additional_signers: [{signer_id: '<your-signer-id>'}],
    policy_ids: ['<your-policy-id>']
  });
  ```
</View>

<View title="NodeJS (server-auth)" icon="node-js">
  <Warning>
    The `@privy-io/server-auth` library is deprecated. We recommend integrating `@privy-io/node` for
    the latest features and support.
  </Warning>

  To import an HD wallet with the NodeJS SDK, use the `importWallet` method from the Privy client's `walletApi` class. The Privy client will encrypt your mnemonic for secure transmission to the TEE. See [architecture](/wallets/wallets/import-a-wallet/architecture) for more details.

  <Tabs>
    <Tab title="Ethereum">
      ```ts  theme={"system"}
      import {PrivyClient, WalletApiWalletResponseType} from '@privy-io/server-auth';

      const privy = new PrivyClient('your-app-id', 'your-app-secret');

      const wallet: WalletApiWalletResponseType = await privy.walletApi.importWallet({
        address: '<your-wallet-address>',
        chainType: 'ethereum',
        entropy: '<your-bip39-mnemonic>',
        entropyType: 'hd',
        index: 0 // your wallet index, typically 0 for the first address
      });
      ```
    </Tab>

    <Tab title="Solana">
      ```ts  theme={"system"}
      import {PrivyClient, WalletApiWalletResponseType} from '@privy-io/server-auth';

      const privy = new PrivyClient('your-app-id', 'your-app-secret');

      const wallet: WalletApiWalletResponseType = await privy.walletApi.importWallet({
        address: '<your-wallet-address>',
        chainType: 'solana',
        entropy: '<your-bip39-mnemonic>',
        entropyType: 'hd',
        index: 0 // your wallet index, typically 0 for the first address
      });
      ```
    </Tab>
  </Tabs>

  The returned wallet is type `WalletApiWalletResponseType`. See [get wallet by ID](/wallets/wallets/get-a-wallet/get-wallet-by-id#returns) for type definition.
</View>

<View title="REST API" icon="terminal">
  <Info>
    The REST API flow is the same for both EVM and Solana chains. Simply use `"chain_type":
      "ethereum"` for EVM wallets or `"chain_type": "solana"` for Solana wallets in the requests below.
  </Info>

  ### 1. Initialization

  Initialize a key import flow by calling the `/v1/wallets/import/init` endpoint with your wallet address, index, and chain type. See [authentication](/api-reference/introduction#authentication) for how to encode your app credentials.

  ```bash  theme={"system"}
  curl --request POST \
    --url https://api.privy.io/v1/wallets/import/init \
    --header 'Authorization: Basic <encoded-app-credentials>' \
    --header 'Content-Type: application/json' \
    --header 'privy-app-id: <privy-app-id>' \
    --data '{
      "address": "<your-wallet-address>",
      "chain_type": "ethereum",
      "entropy_type": "hd",
      "index": <your-wallet-index>,
      "encryption_type": "HPKE"
    }'
  ```

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

  ```ts  theme={"system"}
  import {Chacha20Poly1305} from '@hpke/chacha20poly1305';
  import {CipherSuite, DhkemP256HkdfSha256, HkdfSha256} from '@hpke/core';
  import {base64} from '@scure/base';

  const encryptWithHpke = async ({
    encryptionPublicKey,
    plaintextMnemonic
  }: {
    encryptionPublicKey: Uint8Array;
    plaintextMnemonic: Uint8Array;
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

    // Encrypt the plaintext wallet mnemonic
    const sender = await suite.createSenderContext({
      recipientPublicKey: publicKeyObject
    });
    const ciphertext = await sender.seal(Buffer.from(plaintextMnemonic).buffer);

    // Return the encapsulated key and ciphertext, converting ArrayBuffer to Uint8Array
    return {
      encapsulatedKey: new Uint8Array(sender.enc),
      ciphertext: new Uint8Array(ciphertext)
    };
  };

  // The encryption public key is returned by the `init` request to the Privy API
  // For example: BPoOQ5k9nRk37v+XQWkmFEjpvW6RS0HQsPF3+IbhgMlc2Qwp/vz7lln1h0MJj/l0crLUhyyjdmC9RnAcpAkUNVQ=
  const base64EncodedEncryptionPublicKey = '<encryption-public-key>';
  // The wallet's BIP39 mnemonic.
  // For example: "solution tree shed picnic exile caught pluck hammer flag strategy surprise fiber"
  const plaintextMnemonic = '<your-wallet-mnemonic>';

  const {encapsulatedKey, ciphertext} = await encryptWithHpke({
    encryptionPublicKey: base64.decode(base64EncodedEncryptionPublicKey),
    plaintextMnemonic: new Uint8Array(Buffer.from(plaintextMnemonic, 'utf-8'))
  });
  ```

  ### 3. Submission

  Submit your encrypted mnemonic to the Privy API by calling the `/v1/wallets/import/submit` endpoint with the rest of your wallet configuration (e.g. an owner, policies, or signers). See [creating a wallet](/api-reference/wallets/create) for more information on configuration options.

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
        "entropy_type": "hd",
        "index": <your-wallet-index>,
        "encryption_type": "HPKE",
        "ciphertext": "<base64-encoded-encrypted-mnemonic>",
        "encapsulated_key": "<base64-encoded-encapsulated-key>"
      },
      // Optional additional configuration
      "owner": {...},
      "policy_ids": [...],
      "additional_singers": [...]
    }'
  ```

  The endpoint will return the wallet object of your imported wallet:

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
</View>

## Using imported wallets

Imported wallets function the same way as Privy-generated wallets. See the API reference for [Ethereum](/api-reference/wallets/ethereum/eth-send-transaction) or [Solana](/api-reference/wallets/solana/sign-and-send-transaction) for information about how to send transactions and execute other wallet operations.
\n