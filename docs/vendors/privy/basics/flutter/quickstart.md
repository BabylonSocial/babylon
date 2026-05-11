> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Quickstart

> Learn how to authenticate users, create embedded wallets, and send transactions in your Flutter app

## Prerequisites

This guide assumes that you have completed the [setup](/basics/flutter/setup) guide.

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

```dart  theme={"system"}
final Result<void> result = await privy.sms.sendCode("+14155552671");

result.fold(
  onSuccess: (_) {
    // OTP was sent successfully
  },
  onFailure: (error) {
    // Handle error sending OTP
    print(error.message);
  },
);

```

If the OTP is sent successfully, **`sendCode`** will return `Success()` with no associated type. If the provided email address is invalid, or sending the OTP fails, **`sendCode`** will return `Failure()` containing a `PrivyException`.

#### 2. Authenticate with OTP

The user will then receive an SMS with a 6-digit OTP. Prompt for this OTP within your application, then authenticate the user with the `loginWithCode` method. Pass the following parameters to this method:

<ParamField name="code" type="String" required>
  OTP code inputted by the user in your app.
</ParamField>

<ParamField name="phoneNumber" type="String" required>
  The user's phone number.
</ParamField>

```dart  theme={"system"}
final Result<PrivyUser> result = await privy.sms.loginWithCode(
  code: code,
  phoneNumber: phoneNumber,
);

result.fold(
  onSuccess: (user) {
    // User authenticated successfully
  },
  onFailure: (error) {
    // Handle authentication error
  },
);

```

If the OTP/phone number combination is valid, Privy will successfully authenticate your user and `loginWithCode` will return `Success()` with an encapsulated `PrivyUser`.
If the provided OTP/phone number combination is invalid, `loginWithCode` will return `Failure()`, containing a PrivyException.

## The embedded wallet

<Tabs>
  <Tab title="Ethereum">
    ### Create an embedded wallet

    To create an EVM embedded wallet for your user, call the `createEthereumWallet` method on your `PrivyUser` instance.

    ```dart  theme={"system"}
    abstract class PrivyUser {
      // Other privy user methods

      /// Creates an Ethereum embedded wallet for the user.
      Future<Result<EmbeddedEthereumWallet>> createEthereumWallet({bool allowAdditional = false});
    }

    ```

    <ParamField name="allowAdditional" type="Bool" optional default="false">
      Ethereum embedded wallets are [hierarchical deterministic (HD)
      wallets](https://www.ledger.com/academy/crypto/what-are-hierarchical-deterministic-hd-wallets),
      and a user's seed entropy can support multiple separate embedded wallets. If a user already has a
      wallet and you'd like to create additional HD wallets for them, pass in `true` for the
      `allowAdditional` parameter.
    </ParamField>

    If a wallet is successfully created for the user, an **`EmbeddedEthereumWallet`** object is returned as an encapsulated value of `Success()`.

    This method will fail if:

    * The user is not authenticated
    * If a user already has 9 or more wallets
    * If the network call to create the wallet fails
    * If a user already has an embedded wallet and `allowAdditional` is not set to true.

    ### Using the embedded wallet

    To enable your app to request signatures and transactions from the embedded wallet, Privy Ethereum embedded wallets expose a provider *inspired by* the [**EIP-1193 provider**](https://eips.ethereum.org/EIPS/eip-1193) standard. This allows you request signatures and transactions from the wallet via a familiar [**JSON-RPC API**](https://ethereum.org/en/developers/docs/apis/json-rpc/) (e.g. [`personal_sign`](https://docs.metamask.io/wallet/reference/personal_sign/)).

    Once you have an instance of an `EmbeddedEthereumWallet`, you can make RPC requests by using the `provider: EmbeddedEthereumWalletProvider` hook and using its `request` method. For example, `wallet.provider.request(request: rpcRequest)`. This request method will suspend and await if the embedded wallet needs to wait for any internal ready state.

    ```dart  theme={"system"}
    /// Defines the Ethereum Wallet Provider interface for sending RPC requests.
    abstract class EmbeddedEthereumWalletProvider {
       /**
        * Sends a request to the Ethereum provider
        *
        * @param The RPC request
        * @return The response received
        */
      Future<Result<EthereumRpcResponse>> request(EthereumRpcRequest request);
    }
    ```

    As a parameter to this method, to this method, pass an **`EthereumRpcRequest`** object that contains:

    * **`method`**: the name of the JSON-RPC method for the wallet to execute (e.g. `'personal_sign'`)
    * **`params`**: an array of parameters required by your specified **`method`**

    By default, embedded wallets are connected to the Ethereum mainnet. To send a transaction on a different network, simply set the wallet's `chainId` in the transaction request.

    Example usage:

    ```dart  theme={"system"}
    // Get the Privy user
    final user = privy.user;

    // Check if the user is authenticated
    if (user != null) {
      // Retrieve the list of user's embedded Ethereum wallets
      final ethereumWallets = user.embeddedEthereumWallets;

      if (ethereumWallets.isNotEmpty) {
        // Grab the desired wallet. Here, we retrieve the first wallet
        final ethereumWallet = ethereumWallets.first;

        // Make an RPC request
        ethereumWallet.provider.request(
          request: EthereumRpcRequest(
            method: "personal_sign",
            params: ["A message to sign", ethereumWallet.address],
          ),
        );
      }
    }
    ```
  </Tab>

  <Tab title="Solana">
    ### Creating the embedded wallet

    To create a Solana embedded wallet for your user, call the `createSolanaWallet` method on your `PrivyUser` instance.

    ```dart  theme={"system"}
    abstract class PrivyUser {
      /// Creates a Solana embedded wallet for the user.
      Future<Result<EmbeddedSolanaWallet>> createSolanaWallet();
    }
    ```

    If a wallet is successfully created for the user, an **`EmbeddedSolanaWallet`** object is returned as an encapsulated value of `Success()`.

    This method will `Failure()` with a PrivyException if:

    * The user is not authenticated
    * A user already has a Solana wallet
    * If the network call to create the wallet fails

    ### Using the embedded wallet

    Privy supports requesting signatures on messages and transactions from a user's Solana embedded wallet using the `signMessage` RPC. To request a signature, get the Solana embedded wallet provider and call the `signMessage` method on it with a base-64 encoded message to sign. If the signature is computed successfully, `signMessage` will return it as a base64-encoded string.

    ```dart  theme={"system"}
    abstract class EmbeddedSolanaWalletProvider {
      /**
       * Request a signature on a Base64 encoded message or transaction
       *
       * @param message Base64 encoded message or transaction
       * @return The Base64 encoded computed signature
       */
      Future<Result<String>> signMessage(String message);
    }
    ```

    Example usage:

    ```dart  theme={"system"}
    // Get the current user
    final user = privy.user;

    // Check if the user is authenticated
    if (user != null) {
      // Check if the user has at least one Solana wallet
      if (user.embeddedSolanaWallets.isNotEmpty) {
        // Retrieve the user's Solana wallet
        final solanaWallet = user.embeddedSolanaWallets.first;

        // Sign a message
        final result = await solanaWallet.provider.signMessage(
          // Base 64 encoded: "Hello! I am the base64 encoded message to be signed."
          "SGVsbG8hIEkgYW0gdGhlIGJhc2U2NCBlbmNvZGVkIG1lY3NhZ2UgdG8gYmUgc2lnbmVkLg=="
        );
      }
    }
    ```
  </Tab>
</Tabs>
\n