> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Quickstart

> Learn how to create users, embedded wallets, and send transactions in your Rust app

## 0. Prerequisites

This guide assumes that you have completed the [Setup](/basics/rust/setup) guide to get a Privy client instance.

## 1. Creating a wallet

First, we will create a wallet. You will use this wallet's `id` in future calls to sign messages and send transactions.

<Tabs>
  <Tab title="Ethereum">
    ```rust  theme={"system"}
    use privy_rs::{PrivyClient, generated::types::{CreateWalletBody, WalletChainType}};

    let wallet = client
        .wallets()
        .create(
            None, // idempotency_key (optional)
            &CreateWalletBody {
                chain_type: WalletChainType::Ethereum,
                additional_signers: None,
                owner: None,
                owner_id: None,
                policy_ids: vec![],
            },
        )
        .await?;

    let wallet_id = wallet.id;
    ```
  </Tab>

  <Tab title="Solana">
    ```rust  theme={"system"}
    use privy_rs::{PrivyClient, generated::types::{CreateWalletBody, WalletChainType}};

    let wallet = client
        .wallets()
        .create(
            None, // idempotency_key (optional)
            &CreateWalletBody {
                chain_type: WalletChainType::Solana,
                additional_signers: None,
                owner: None,
                owner_id: None,
                policy_ids: vec![],
            },
        )
        .await?;

    let wallet_id = wallet.id;
    ```
  </Tab>
</Tabs>

<Tip>[Learn more](/wallets/wallets/create/create-a-wallet) about creating wallets.</Tip>

<Note>
  When using the `PrivyClient` to work with the API, all errors thrown will be instances of
  `privy_rs::Error`. This error type implements `std::error::Error`, so you can use it with `?` to
  propagate errors or your favorite error handling library such as `anyhow`. You can see more
  examples in the [error handling](#5-error-handling) section below.
</Note>

## 2. Signing a message

Next, we'll sign a plaintext message with the wallet using chain-specific signing methods. Make sure to specify your wallet ID from creation in the input.

<Tabs>
  <Tab title="Ethereum">
    ```rust  theme={"system"}
    use privy_rs::AuthorizationContext;

    // Create empty authorization context for unowned wallet
    let ctx = AuthorizationContext::new();

    let message = "Hello, Privy!";
    let response = client
        .wallets()
        .ethereum()
        .sign_message(&wallet_id, message, &ctx, None)
        .await?;

    // Signature is hex-encoded for Ethereum
    let signature = response.signature;
    ```
  </Tab>

  <Tab title="Solana">
    ```rust  theme={"system"}
    use privy_rs::AuthorizationContext;
    use base64::{Engine as _, engine::general_purpose};

    // Create empty authorization context for unowned wallet
    let ctx = AuthorizationContext::new();

    let message = "Hello, Privy!";
    // Solana requires the message to be base64 encoded
    let base64_message = general_purpose::STANDARD.encode(message.as_bytes());

    let response = client
        .wallets()
        .solana()
        .sign_message(&wallet_id, &base64_message, &ctx, None)
        .await?;

    // Signature is base64-encoded for Solana
    let signature = response.signature;
    ```
  </Tab>
</Tabs>

<Tip>[Learn more](/wallets/using-wallets/ethereum/sign-a-message) about signing messages.</Tip>

## 3. Sending transactions

<Info>
  Your wallet must have some funds in order to send a transaction. You can use a testnet
  [faucet](https://console.optimism.io/faucet) to test transacting on a testnet (e.g. Base Sepolia)
  or send funds to the wallet on the network of your choice.
</Info>

To send a transaction from your wallet, use chain-specific transaction methods. The SDK will populate missing network-related values, sign your transaction, broadcast it to the network, and return the transaction hash to you.

In the request, make sure to specify your wallet `id` from your wallet creation above, as well as the `caip2` chain ID for the network you want to transact on.

<Tabs>
  <Tab title="Ethereum">
    ```rust  theme={"system"}
    use privy_rs::{AuthorizationContext, generated::types::*};

    // Create empty authorization context for unowned wallet
    let ctx = AuthorizationContext::new();

    let caip2 = "eip155:11155111"; // Sepolia testnet
    let recipient_address = "0x742d35Cc6635C0532925a3b8c17d6d1E9C2F7ca"; // Your recipient address

    let transaction = EthereumSendTransactionRpcInputParamsTransaction {
        to: Some(recipient_address.to_string()),
        value: Some("0x1".to_string()), // 1 wei
        gas_limit: None,
        max_fee_per_gas: None,
        max_priority_fee_per_gas: None,
        data: Some("0x".to_string()),
        chain_id: Some(11155111), // Sepolia testnet
        from: None,
        gas_price: None,
        nonce: None,
        type_: None,
    };

    let response = client
        .wallets()
        .ethereum()
        .send_transaction(&wallet_id, caip2, transaction, &ctx, None)
        .await?;

    let transaction_hash = response.hash;
    ```
  </Tab>

  <Tab title="Solana">
    ```rust  theme={"system"}
    use privy_rs::AuthorizationContext;

    // Create empty authorization context for unowned wallet
    let ctx = AuthorizationContext::new();

    let caip2 = "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp"; // Solana Mainnet

    // A base64 encoded serialized transaction to sign
    let transaction = "insert-base-64-encoded-serialized-transaction";

    let response = client
        .wallets()
        .solana()
        .sign_and_send_transaction(&wallet_id, caip2, transaction, &ctx, None)
        .await?;

    let transaction_hash = response.hash;
    ```
  </Tab>
</Tabs>

<Tip>
  [Learn more](/wallets/using-wallets/ethereum/send-a-transaction) about sending transactions.
</Tip>

<Tip>
  If you're interested in more control, you can prepare and broadcast the transaction yourself, and
  simply use raw signing methods to sign the transaction with a wallet.
</Tip>

## 4. Creating a user

To create a user for your application, you can use the `create` method, passing in linked accounts, custom metadata, and wallets that should be associated with said user.

```rust  theme={"system"}
use privy_rs::generated::types::{
    CreateUserBody, LinkedAccountEmailInput,
    LinkedAccountEmailInputType, LinkedAccountInput,
    LinkedAccountCustomAuthInput, LinkedAccountCustomAuthInputType,
};

let user = client
    .users()
    .create(&CreateUserBody {
        linked_accounts: vec![
            LinkedAccountInput::CustomAuthInput(LinkedAccountCustomAuthInput {
                custom_user_id: "your-subject-id".to_string(),
                type_: LinkedAccountCustomAuthInputType::CustomAuth,
            }),
            LinkedAccountInput::EmailInput(LinkedAccountEmailInput {
                address: "user@example.com".to_string(),
                type_: LinkedAccountEmailInputType::Email,
            }),
        ],
        create_embedded_wallet: Some(false),
        custom_metadata: None,
    })
    .await?;

let user_id = user.id;
```

<Tip>
  [Learn more](/user-management/migrating-users-to-privy/create-or-import-a-user) about creating
  users, and look at our [pregenerating wallets](/recipes/pregenerate-wallets) guide for linking
  wallets to your users before they even sign in.
</Tip>

## 5. Error handling

In the examples above we use `?` to propagate errors, however the Rust SDK provides comprehensive error handling through multiple specialized error types. All error types implement `std::error::Error`, allowing seamless integration with Rust's error handling ecosystem.

### Error types

The SDK provides the following main error categories:

#### PrivyApiError

The core generated client error type that represents all possible API communication failures:

| Error Variant            | Description                                 | When It Occurs                                    |
| ------------------------ | ------------------------------------------- | ------------------------------------------------- |
| `InvalidRequest`         | Request doesn't conform to API requirements | Missing required fields, invalid data formats     |
| `CommunicationError`     | Network or connection issues                | Network timeouts, DNS failures, connection drops  |
| `InvalidUpgrade`         | Connection upgrade failed                   | WebSocket or HTTP/2 upgrade errors                |
| `ErrorResponse`          | Documented API error response               | Authentication failures, insufficient permissions |
| `ResponseBodyError`      | Failed to read response body                | Corrupted response data                           |
| `InvalidResponsePayload` | Response deserialization failed             | Unexpected response format                        |
| `UnexpectedResponse`     | Undocumented response code                  | New API responses not yet supported               |
| `Custom`                 | Consumer-defined hook error                 | Custom validation or processing failures          |

#### PrivyCreateError

Client initialization errors that occur when creating a `PrivyClient` instance:

| Error Variant        | Description                        | When It Occurs               |
| -------------------- | ---------------------------------- | ---------------------------- |
| `InvalidHeaderValue` | Invalid HTTP header value provided | Malformed app credentials    |
| `Client`             | HTTP client creation failed        | Network configuration issues |

#### PrivySignedApiError

Errors for operations requiring cryptographic signatures (authorization keys):

| Error Variant         | Description                          | When It Occurs                       |
| --------------------- | ------------------------------------ | ------------------------------------ |
| `Api`                 | Privy API returned an error response | Authentication failures, rate limits |
| `SignatureGeneration` | Failed to generate request signature | Invalid private key, signing errors  |

#### PrivyExportError

Wallet export operation errors:

| Error Variant         | Description                          | When It Occurs                         |
| --------------------- | ------------------------------------ | -------------------------------------- |
| `Api`                 | Privy API returned an error response | Export permissions, wallet access      |
| `SignatureGeneration` | Failed to generate request signature | Invalid authorization key              |
| `Key`                 | Decryption or key handling failed    | Invalid encryption key, corrupted data |

#### CryptoError

General cryptographic operation errors:

| Error Variant | Description                        | When It Occurs                          |
| ------------- | ---------------------------------- | --------------------------------------- |
| `Signing`     | Digital signature operation failed | Invalid key, signature algorithm issues |
| `Key`         | Key handling operation failed      | Key parsing, loading, or format errors  |

#### KeyError

Cryptographic key management errors:

| Error Variant    | Description                | When It Occurs                          |
| ---------------- | -------------------------- | --------------------------------------- |
| `Io`             | File I/O error reading key | Missing key file, permission denied     |
| `InvalidFormat`  | Key data is malformed      | Invalid PEM/DER format, corrupted data  |
| `HpkeDecryption` | HPKE decryption failed     | Wrong decryption key, corrupted payload |
| `Other`          | Unknown error occurred     | Unexpected system errors                |

#### SigningError

Digital signature creation errors:

| Error Variant | Description                  | When It Occurs                     |
| ------------- | ---------------------------- | ---------------------------------- |
| `Key`         | Invalid signing key          | Wrong key type, corrupted key data |
| `Signature`   | Cryptographic signing failed | Algorithm errors, hardware issues  |
| `Other`       | Unknown signing error        | Unexpected cryptographic errors    |

#### SignatureGenerationError

Authorization signature generation errors:

| Error Variant   | Description                  | When It Occurs                     |
| --------------- | ---------------------------- | ---------------------------------- |
| `Serialization` | Request serialization failed | Invalid request data structure     |
| `Signing`       | Signing process failed       | Key errors, cryptographic failures |

### Basic error handling

```rust  theme={"system"}
use privy_rs::{PrivyClient, PrivyCreateError, PrivyApiError, generated::types::*};

// Using the ? operator for error propagation
async fn create_wallet_with_basic_handling() -> Result<String, Box<dyn std::error::Error>> {
    let client = PrivyClient::new("your-app-id", "your-app-secret")?;

    let wallet = client
        .wallets()
        .create(
            None,
            &CreateWalletBody {
                chain_type: WalletChainType::Ethereum,
                additional_signers: None,
                owner: None,
                owner_id: None,
                policy_ids: vec![],
            },
        )
        .await?;

    Ok(wallet.id)
}
```

### Advanced error handling

```rust  theme={"system"}
use privy_rs::{PrivyClient, PrivyCreateError, PrivySignedApiError, generated::types::*};

async fn create_wallet_with_detailed_handling() -> Result<String, String> {
    // Handle client creation errors
    let client = match PrivyClient::new("your-app-id", "your-app-secret") {
        Ok(client) => client,
        Err(PrivyCreateError::InvalidHeaderValue(e)) => {
            return Err(format!("Invalid credentials format: {}", e));
        }
        Err(PrivyCreateError::Client(e)) => {
            return Err(format!("HTTP client creation failed: {}", e));
        }
    };

    // Handle wallet creation errors
    match client
        .wallets()
        .create(
            None,
            &CreateWalletBody {
                chain_type: WalletChainType::Ethereum,
                additional_signers: None,
                owner: None,
                owner_id: None,
                policy_ids: vec![],
            },
        )
        .await
    {
        Ok(wallet) => Ok(wallet.id),
        Err(e) => {
            // e is of type PrivyApiError here
            match e {
                PrivyApiError::InvalidRequest(msg) => {
                    Err(format!("Invalid request: {}", msg))
                }
                PrivyApiError::CommunicationError(req_err) => {
                    Err(format!("Network error: {}", req_err))
                }
                PrivyApiError::ErrorResponse(response) => {
                    Err(format!("API error response: {:?}", response))
                }
                _ => Err(format!("Unexpected error: {}", e)),
            }
        }
    }
}

// Example with authorization key signing
async fn sign_with_auth_key() -> Result<String, String> {
    use privy_rs::{AuthorizationContext, PrivateKey};

    let client = PrivyClient::new("your-app-id", "your-app-secret")
        .map_err(|e| format!("Client creation failed: {}", e))?;

    let key = PrivateKey("authorization-key".to_string());
    let ctx = AuthorizationContext::new().push(key);

    let wallet_id = "wallet-id";
    let message = "Hello, Privy!";

    match client
        .wallets()
        .ethereum()
        .sign_message(wallet_id, message, &ctx, None)
        .await
    {
        Ok(response) => Ok(response.signature),
        Err(PrivySignedApiError::Api(api_err)) => {
            Err(format!("API error: {}", api_err))
        }
        Err(PrivySignedApiError::SignatureGeneration(sig_err)) => {
            Err(format!("Signature generation failed: {}", sig_err))
        }
    }
}
```

### Integration with error handling libraries

The SDK works seamlessly with popular Rust error handling libraries:

<Tabs>
  <Tab title="anyhow">
    ```rust  theme={"system"}
    use anyhow::Result;
    use privy_rs::PrivyClient;

    async fn create_wallet() -> Result<String> {
        let client = PrivyClient::new("your-app-id", "your-app-secret")?;

        let wallet = client
            .wallets()
            .create(None, &create_wallet_body)
            .await?;

        Ok(wallet.id)
    }
    ```
  </Tab>

  <Tab title="thiserror">
    ```rust  theme={"system"}
    use thiserror::Error;
    use privy_rs::{PrivyCreateError, PrivySignedApiError, PrivyExportError, CryptoError, PrivyApiError};

    #[derive(Error, Debug)]
    pub enum AppError {
        #[error("Client creation failed: {0}")]
        ClientCreation(#[from] PrivyCreateError),

        #[error("API communication failed: {0}")]
        Api(#[from] PrivyApiError),

        #[error("API operation with signing failed: {0}")]
        SignedApi(#[from] PrivySignedApiError),

        #[error("Wallet export failed: {0}")]
        Export(#[from] PrivyExportError),

        #[error("Cryptographic operation failed: {0}")]
        Crypto(#[from] CryptoError),

        #[error("Configuration error: {0}")]
        ConfigError(String),
    }

    async fn create_wallet() -> Result<String, AppError> {
        let client = PrivyClient::new("your-app-id", "your-app-secret")?;

        let wallet = client
            .wallets()
            .create(None, &create_wallet_body)
            .await?;

        Ok(wallet.id)
    }
    ```
  </Tab>
</Tabs>

<Tip>
  We also implement logging via the [tracing](https://crates.io/crates/tracing) crate, which is a
  popular and well-supported logging facade for Rust.
</Tip>

## Next steps & advanced topics

* For an additional layer of security, you can choose to sign your requests with [authorization keys](/controls/authorization-keys/overview).
* To restrict what wallets can do, you can set up [policies](/controls/policies/overview).
* To prevent double sending the same transaction, take a look at our support for [idempotency](/api-reference/idempotency-keys) keys.
* If you want to require multiple parties to sign off before sending a transaction for a wallet, you can accomplish this through the use of [quorum approvals](/controls/quorum-approvals/overview).
\n