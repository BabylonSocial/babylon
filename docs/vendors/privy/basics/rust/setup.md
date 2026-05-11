> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# null

## Prerequisites

Before you begin:

* Get your [Privy app ID and app secret](/basics/get-started/dashboard/create-new-app) from the Privy Dashboard
* Rust 1.88 or later
* A `tokio` async runtime

## Instantiating the `PrivyClient`

Import the **`PrivyClient`** struct and create an instance by passing your Privy **app ID** and **app secret** as parameters.

```rust  theme={"system"}
use privy_rs::PrivyClient;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let client = PrivyClient::new(
        "insert-your-app-id".to_string(),
        "insert-your-app-secret".to_string()
    )?;

    Ok(())
}
```

<Tip>
  You can also store your credentials as environment variables for security:

  ```rust  theme={"system"}
  let app_id = std::env::var("PRIVY_APP_ID")
      .expect("PRIVY_APP_ID environment variable not set");
  let app_secret = std::env::var("PRIVY_APP_SECRET")
      .expect("PRIVY_APP_SECRET environment variable not set");

  let client = PrivyClient::new_from_env()?;
  ```
</Tip>

This `client` **`PrivyClient`** is now your entry point to manage Privy from your server. With the `PrivyClient` you can interact with wallets with methods for creating wallets, signing and sending transactions. You can also manage users with methods for getting a user object, verifying an auth token, and importing new users.

## Authorization

If a resource (i.e. wallet, policy, key quorum) has an [owner](/controls/authorization-keys/using-owners/overview),
[authorization signatures](/api-reference/authorization-signatures) from the owner are required.
Use the [authorization context](/controls/authorization-keys/using-owners/sign/signing-on-the-server) to specify authorization private keys
and user JWTs of the wallet's owners, and the Rust SDK will generate signatures and sign requests
under the hood.

<Tip>
  We strongly recommend reading [this
  guide](/controls/authorization-keys/using-owners/sign/signing-on-the-server) before using the Rust
  SDK for the best development experience.
</Tip>

```rust  theme={"system"}
use privy_rs::{AuthorizationContext, PrivateKey, JwtUser};

let client = PrivyClient::new(app_id, app_secret)?;

let ctx = AuthorizationContext::new()
    .push(JwtUser(client.clone(), "jwt1".to_string()))
    .push(JwtUser(client.clone(), "jwt2".to_string()))
    .push(PrivateKey("authorization-key".to_string()));
```

## Rate limits

Privy rate limits REST API endpoints that you may call from your server.

<Tip>
  Learn more about optimizing your setup and handling rate limits in our
  [optimizing](/recipes/dashboard/optimizing) guide!
</Tip>
\n