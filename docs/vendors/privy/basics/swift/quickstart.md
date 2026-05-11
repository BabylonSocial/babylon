> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Quickstart

> Learn how to authenticate users, create embedded wallets, and send transactions in your Swift app.

## Prerequisites

This guide assumes that you have completed the [setup](/basics/swift/setup) guide.

## Check user's authentication state

```swift  theme={"system"}
// Grab current auth state
let authState = await privy.getAuthState()

switch authState {
    case .authenticated(let user):
        // User is authenticated. Grab the user's linked accounts
        let linkedAccounts = user.linkedAccounts
    case .notReady:
        // Privy was just initialized and has not determined auth state yet
        // authState will never be this case after calling getAuthState()
    case .authenticatedUnverified:
        // Prior user session exists, but can't be verified due to no network connectivity.
        // Privy will automatically attempt to verify authenticated state when network is restored.
    case .unauthenticated:
        // User in not authenticated.
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

```swift  theme={"system"}
do {
    let phoneNumber = "+14155552671"
    try await privy.sms.sendCode(to: phoneNumber)
    // OTP sent successfully - prompt user for OTP
} catch {
    // OTP could fail if the network request fails
    print("Error sending code: \(error))
}
```

If the OTP is sent successfully, `sendCode` will not throw an error.
If the provided phone number is invalid, or sending the OTP fails, **`sendCode`** will throw an error.

#### 2. Authenticate with OTP

The user will then receive an SMS with a 6-digit OTP. Prompt for this OTP within your application, then authenticate the user with the `loginWithCode` method. Pass the following parameters to this method:

<ParamField name="code" type="String">
  OTP code inputted by the user in your app.
</ParamField>

<ParamField name="phoneNumber" type="String">
  The user's phone number.
</ParamField>

```swift  theme={"system"}
do {
    let phoneNumber = "+14155552671"
    let inputtedOtp = "123456"
    let privyUser = try await privy.sms.loginWithCode(inputtedOtp, sentTo: phoneNumber)
    print("Logged in with sms! User: \(privyUser.id)")
} catch {
    print("Error logging user in: \(error)")
}
```

If the OTP/phone number combination is valid, Privy will successfully authenticate your user and `loginWithCode` will return the `PrivyUser`.
If the provided OTP/phone number combination is invalid, `loginWithCode` will throw an error that speicfies the error reason.

## The embedded wallet

Privy's embedded wallets are compatible with the Ethereum and Solana blockchains.

<Tabs>
  <Tab title="Ethereum">
    ### Creating the embedded wallet

    To create an EVM embedded wallet for your user, call `PrivyUser.createEthereumWallet`.

    ```swift  theme={"system"}
    public protocol PrivyUser {
        // Other privy user methods

        func createEthereumWallet(allowAdditional: Bool) async throws -> EmbeddedEthereumWallet
    }
    ```

    <ParamField name="allowAdditional" type="Bool" optional default="false">
      Ethereum embedded wallets are [hierarchical deterministic (HD)
      wallets](https://www.ledger.com/academy/crypto/what-are-hierarchical-deterministic-hd-wallets),
      and a user's seed entropy can support multiple separate embedded wallets. If a user already has a
      wallet and you'd like to create additional HD wallets for them, pass in `true` for the
      `allowAdditional` parameter.
    </ParamField>

    If a wallet is successfully created for the user, the newly created EmbeddedEthereumWallet is returned.

    The method will throw an error if

    * The user is not authenticated
    * If a user already has 9 or more wallets
    * If the network call to create the wallet fails
    * If a user already has an embedded wallet and allowAdditional is not set to true.

    #### Example

    ```swift  theme={"system"}
    if let user = privy.user {
        // If user not null, user is authenticated
        do {
            let ethereumWallet = try await user.createEthereumWallet()
            print("Created wallet with address: \(ethereumWallet.address)")
        } catch {
            print("Error creating embedded wallet: \(error.localizedDescription)")
        }
    }
    ```

    ### Using the embedded wallet

    To enable your app to request signatures and transactions from the embedded wallet, Privy Ethereum embedded wallets expose a provider *inspired by* the [**EIP-1193 provider**](https://eips.ethereum.org/EIPS/eip-1193) standard. This allows you request signatures and transactions from the wallet via a familiar [**JSON-RPC API**](https://ethereum.org/en/developers/docs/apis/json-rpc/) (e.g. [`personal_sign`](https://docs.metamask.io/wallet/reference/personal_sign/)).

    Once you have an instance of an `EmbeddedEthereumWallet`, you can make RPC requests by using the `provider: EmbeddedEthereumWalletProvider` hook and using its `request` method. For example, `wallet.provider.request(request: rpcRequest)`.

    ```swift  theme={"system"}
    public protocol EmbeddedEthereumWallet: EmbeddedWalletBehavior {
        var provider: EmbeddedEthereumWalletProvider { get }
    }
    ```

    As a parameter to this method, to this method, pass an `EthereumRpcRequest` object that contains:

    * **method**: the name of the JSON-RPC method for the wallet to execute (e.g. `personal_sign`)
    * **params**: an array of parameters required by your specified method

    By default, embedded wallets are connected to the Ethereum mainnet. To send a transaction on a different network, simply set the wallet's chainId in the transaction request.

    #### Example

    ```swift  theme={"system"}
    if let user = privy.user {
        // If user not null, user is authenticated
        do {
            // Retrieve list of user's embedded Ethereum wallets
            let ethereumWallets = user.embeddedEthereumWallets

            // Grab the desired wallet. Here, we retrieve the first wallet
            if let wallet = ethereumWallets.first {
                let data = EthereumRpcRequest(method: "personal_sign", params: ["A message to sign", wallet.address])
                let signature = try await wallet.provider.request(data)
                print("Result signature: \(signature)")
            }
        } catch {
            print("personal_sign error: \(error.localizedDescription)")
        }
    }
    ```
  </Tab>

  <Tab title="Solana">
    ### Creating the embedded wallet

    To create a Solana embedded wallet for your user, call `PrivyUser.createSolanaWallet`.

    If a wallet is successfully created for the user, the newly created EmbeddedSolanaWallet is returned.

    The method will throw an error if

    * The user is not authenticated
    * If a user already has a Solana wallet
    * If the network call to create the wallet fails

    #### Example

    ```swift  theme={"system"}
    if let user = privy.user {
        // If user not null, user is authenticated
        do {
            let solanaWallet = try await user.createSolanaWallet()
            print("Created wallet with address: \(solanaWallet.address)")
        } catch {
            print("Error creating embedded wallet: \(error)")
        }
    }
    ```

    ### Using the embedded wallet

    Privy supports requesting signatures on messages and transactions from a user's Solana embedded wallet using the `signMessage` RPC. To request a signature, get the Solana embedded wallet provider and call the `signMessage` method on it with a base-64 encoded message to sign. If the signature is computed successfully, `signMessage` will return it as a base64-encoded string.

    ```swift  theme={"system"}
    public protocol EmbeddedSolanaWalletProvider {
        /// Request a signature on a Base64 encoded message or transaction
        /// - Parameters:
        ///     - message: Base64 encoded message or transaction
        ///
        /// - Returns: The Base64 encoded computed signature
        ///
        /// - Throws: an error if signing the message is unsuccessful
        func signMessage(message: String) async throws -> String
    }
    ```

    #### Example

    ```swift  theme={"system"}
    if let user = privy.user {
        // If user not null, user is authenticated
        do {
            // Retrieve list of user's embedded Solana wallets
            let solanaWallets = user.embeddedSolanaWallets

            // Grab the desired wallet. Here, we retrieve the first wallet
            if let wallet = solanaWallets.first {
                // Base 64 encoded: "Hello! I am the base64 encoded message to be signed."
                let message = "SGVsbG8hIEkgYW0gdGhlIGJhc2U2NCBlbmNvZGVkIG1lc3NhZ2UgdG8gYmUgc2lnbmVkLg=="
                let signature = try await solanaProvider.signMessage(message: message)
                print("Result signature: \(signature)")
            }
        } catch {
            print("Error creating embedded wallet: \(error.localizedDescription)")
        }
    }
    ```
  </Tab>
</Tabs>
\n