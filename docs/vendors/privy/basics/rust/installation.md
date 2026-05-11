> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# null

In a backend Rust environment, you can use the [**`privy-rs`**](https://crates.io/crates/privy-rs) crate to authorize requests and manage your application from your server. This library includes helpful utilities around verifying access tokens issued by Privy and interacting with Privy's API to query and import users, create wallets, manage invite lists, and more.

Add the Privy Rust SDK to your `Cargo.toml`:

```toml Cargo.toml theme={"system"}
[dependencies]
privy-rs = "X.Y.Z"
```

You can always get the latest version from [crates.io](https://crates.io/crates/privy-rs) or, alternatively, add it directly using cargo.

```bash  theme={"system"}
cargo add privy-rs
```

<Info>
  The Privy Rust SDK requires Rust 1.88 or later and uses `tokio` / `reqwest` as its async runtime
  and HTTP client.
</Info>
\n