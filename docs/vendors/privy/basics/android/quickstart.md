> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Quickstart

> Learn how to authenticate users, create embedded wallets, and send transactions in your Android app

## Prerequisites

This guide assumes that you have completed the [setup](/basics/android/setup) guide.

## Check user's authentication state

```kotlin  theme={"system"}
coroutineScope.launch {
  val authState = privy.getAuthState()

  when(authState) {
      is AuthState.Authenticated -> {
          // User is authenticated. Grab the user's linked accounts
          val privyUser = authState.user
      }
      AuthState.NotReady -> {
          // Privy was just initialized and has not determined auth state yet
          // authState will never be this case after calling getAuthState()
      }
      is AuthState.AuthenticatedUnverified -> {
          // Prior user session exists, but can't be verified due to no network connectivity.
          // Privy will automatically attempt to verify authenticated state when network is restored.
      }
      AuthState.Unauthenticated -> {
          // User in not authenticated.
      }
  }
}
```

## Authenticate your user

<Tip>
  This quickstart guide will demonstrate how to authenticate a user with a one time password as an
  example, but Privy supports many authentication methods. Explore our [Authentication
  docs](/authentication/overview) to learn about other methods such as socials, passkeys, and
  external wallets to authenticate users in your app.
</Tip>

Privy offers a variety of authentication mechanisms. The example below showcases authenticating a user via SMS.

This is a two step process:

1. Send an OTP to the user provided phone number.
2. Verify the OTP sent to the user.

<Note>
  Please be sure to configure SMS as a login method on the [**Privy Developer
  Dashboard**](https://dashboard.privy.io) under User Management > Authentication.
</Note>

#### 1. Send an OTP to the user's phone number via SMS

After collecting and validating your users phone number, send an OTP by calling the **`sendCode`** method.
Note: you must provide the phone number in [E.164 format](https://www.twilio.com/docs/glossary/what-e164).

```kotlin  theme={"system"}
val result: Result<Unit> = privy.sms.sendCode(phoneNumber = "+14155552671")

result.fold(
  onSuccess = {
    // OTP was successfully sent
  },
  onFailure = {
    println("Error sending OTP: ${it.message}")
  }
)
```

If the OTP is sent successfully, `sendCode` will return `Result.success` with no associated type.
If the provided phone number is invalid, or sending the OTP fails, **`sendCode`** will return `Result.failure`.

#### 2. Authenticate with OTP

The user will then receive an SMS with a 6-digit OTP. Prompt for this OTP within your application, then authenticate the user with the `loginWithCode` method. Pass the following parameters to this method:

<ParamField name="code" type="String">
  OTP code inputted by the user in your app.
</ParamField>

<ParamField name="phoneNumber" type="String">
  The user's phone number.
</ParamField>

```kotlin  theme={"system"}
val result: Result<PrivyUser> = privy.sms.loginWithCode(code = "123456", phoneNumber = "+14155552671")

result.fold(
  onSuccess = { user ->
    // User logged in
  },
  onFailure = {
    println("Error logging in user: ${it.message}")
  }
)
```

If the OTP/phone number combination is valid, Privy will successfully authenticate your user and `loginWithCode` will return `Result.success` with an encapsulated `PrivyUser`.
If the provided OTP/phone number combination is invalid, `loginWithCode` will return `Result.failure`.

## The Embedded wallet

<Tabs>
  <Tab title="Ethereum">
    ### Create an embedded wallet

    To create an EVM embedded wallet for your user, call the `createEthereumWallet` method on your `PrivyUser` instance.

    ```kotlin  theme={"system"}
    public interface PrivyUser {
      // Other privy user methods

      public suspend fun createEthereumWallet(allowAdditional: Boolean = false):  Result<EmbeddedEthereumWallet>

      // ...
    }
    ```

    <ParamField name="allowAdditional" type="Boolean" optional default="false">
      Ethereum embedded wallets are [hierarchical deterministic (HD)
      wallets](https://www.ledger.com/academy/crypto/what-are-hierarchical-deterministic-hd-wallets),
      and a user's seed entropy can support multiple separate embedded wallets. If a user already has a
      wallet and you'd like to create additional HD wallets for them, pass in `true` for the
      `allowAdditional` parameter.
    </ParamField>

    If a wallet is successfully created for the user, an **`EmbeddedEthereumWallet`** object is returned as an encapsulated value of Result.success.

    This method will `Result.failure` if:

    * The user is not authenticated
    * If a user already has 9 or more wallets
    * If the network call to create the wallet fails
    * If a user already has an embedded wallet and `allowAdditional` is not set to true.

    #### Example

    ```kotlin  theme={"system"}
    privy.user?.let { privyUser ->
      // non null user means user is authenticated
      val result = privyUser.createEthereumWallet(allowAdditional = false)

      result.fold(
        onSuccess = { ethereumWallet ->
          println("Created wallet with address: ${ethereumWallet.address}")
        },
        onFailure = {
          println("Error creating Ethereum wallet: ${it.message}")
        }
      )
    }
    ```

    ### Using the embedded wallet

    To enable your app to request signatures and transactions from the embedded wallet, Privy Ethereum embedded wallets expose a provider *inspired by* the [**EIP-1193 provider**](https://eips.ethereum.org/EIPS/eip-1193) standard. This allows you request signatures and transactions from the wallet via a familiar [**JSON-RPC API**](https://ethereum.org/en/developers/docs/apis/json-rpc/) (e.g. [`personal_sign`](https://docs.metamask.io/wallet/reference/personal_sign/)).

    Once you have an instance of an `EmbeddedEthereumWallet`, you can make RPC requests by using the `provider: EmbeddedEthereumWalletProvider` hook and using its `request` method. For example, `wallet.provider.request(request: rpcRequest)`. This request method will suspend and await if the embedded wallet needs to wait for any internal ready state.

    ```kotlin  theme={"system"}
    public interface EmbeddedEthereumWalletProvider {
     /**
      * Sends a request to the Ethereum provider
      *
      * @param The RPC request
      * @return The response received
      */
     public suspend fun request(request: EthereumRpcRequest): Result<EthereumRpcResponse>
    }
    ```

    As a parameter to this method, to this method, pass an **`EthereumRpcRequest`** object that contains:

    * **`method`**: the name of the JSON-RPC method for the wallet to execute (e.g. `'personal_sign'`)
    * **`params`**: an array of parameters required by your specified **`method`**

    By default, embedded wallets are connected to the Ethereum mainnet. To send a transaction on a different network, simply set the wallet's `chainId` in the transaction request.

    Example usage:

    ```kotlin  theme={"system"}
    // Get Privy user
    val user = privy.user

    // check if user is authenticated
    if (user != null) {
      // Retrieve list of user's embedded Ethereum wallets
      val ethereumWallets = user.embeddedEthereumWallets

      if (ethereumWallets.isNotEmpty()) {
        // Grab the desired wallet. Here, we retrieve the first wallet
        val ethereumWallet = ethereumWallets.first()

        // Make an rpc request
        ethereumWallet.provider.request(
          request = EthereumRpcRequest.personalSign("A message to sign", ethereumWallet.address),
        )
      }
    }
    ```
  </Tab>

  <Tab title="Solana">
    ### Create an embedded wallet

    To create a Solana embedded wallet for your user, call the `createSolanaWallet` method on your `PrivyUser` instance.

    ```kotlin  theme={"system"}
    public interface PrivyUser {
      // Other privy user methods

      public suspend fun createSolanaWallet():  Result<EmbeddedSolanaWallet>

      // ...
    }
    ```

    If a wallet is successfully created for the user, an **`EmbeddedSolanaWallet`** object is returned as an encapsulated value of Result.success.

    This method will `Result.failure` if:

    * The user is not authenticated
    * A user already has a Solana wallet
    * If the network call to create the wallet fails

    #### Example

    ```kotlin  theme={"system"}
    privy.user?.let { privyUser ->
      // non null user means user is authenticated
      val result = privyUser.createSolanaWallet()

      result.fold(
        onSuccess = { solanaWallet ->
          println("Created wallet with address: ${solanaWallet.address}")
        },
        onFailure = {
          println("Error creating Solana wallet: ${it.message}")
        }
      )
    }
    ```

    ### Using the embedded wallet

    Privy supports requesting signatures on messages and transactions from a user's Solana embedded wallet using the `signMessage` RPC. To request a signature, get the Solana embedded wallet provider and call the `signMessage` method on it with a base-64 encoded message to sign. If the signature is computed successfully, `signMessage` will return it as a base64-encoded string.

    ```kotlin  theme={"system"}
    public interface EmbeddedSolanaWalletProvider {
      /**
       * Request a signature on a Base64 encoded message or transaction
       *
       * @param message Base64 encoded message or transaction
       * @return The Base64 encoded computed signature
       */
      public suspend fun signMessage(message: String): Result<String>
    }
    ```

    Example usage:

    ```kotlin  theme={"system"}
    // Get current auth state
    val user = privy.user

    // check if user is authenticated
    if (user != null) {
        // Retrieve the user's Solana wallet
        val solanaWallet = user.embeddedSolanaWallets.first()

        if (solanaWallet != null) {
            // Base 64 encoded: "Hello! I am the base64 encoded message to be signed."
            val result = solanaWallet.provider.signMessage("SGVsbG8hIEkgYW0gdGhlIGJhc2U2NCBlbmNvZGVkIG1lc3NhZ2UgdG8gYmUgc2lnbmVkLg==")
        }
    }
    ```
  </Tab>
</Tabs>
\n