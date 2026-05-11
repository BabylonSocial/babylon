> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Migrating to 2.0

## Overview

If your app previously used Privy's Swift `1.Y.Z` SDK, follow the migration guide below to upgrade to `2.0`.

Privy's 2.Y.Z Swift SDK is Swift 6 compliant and adhere's to the new [strict concurrency standards](https://developer.apple.com/documentation/swift/adoptingswift6).
We've taken this opportunity to also introduce some major API changes, which are outlined below in logical sections.

## Initialization

### 1. App client ID required at initialization

Previously, apps were only required to pass in an `appId` when initializing the Privy SDK. Now, `appClientId` is required too. You can retrieve more information on how to retrieve your appClientId [here](/basics/get-started/dashboard/app-clients).

```swift Initializing the Privy SDK theme={"system"}
let config = PrivyConfig(appId: "<your-app-id>") // Remove
let config = PrivyConfig(appId: "<your-app-id>", appClientId: "<client-id>") // Add
let privy: Privy = PrivySdk.initialize(config: config)
```

### 2. PrivySdk.initialize can only be called once

It's important to use a single instance of Privy across the lifetime of your application. Calling PrivySdk.initialize multiple times will result in a fatal error.

### 3. Privy.awaitReady()

When the Privy SDK is first initialized, the user's authentication state will be set to `notReady` until Privy finishes initialization. We've added an async `privy.awaitReady()` function that allows you to await initialization completion. During this time, we suggest you show a loading state to your user.

<Info>
  Calling PrivySDK functions before calling `privy.awaitReady()` might result in unexpected
  functionality.
</Info>

Here's an example with some pseudocode:

```swift  theme={"system"}
Task {
  // Show loading UI
  uiState = .loading

  // Await ready
  await privy.awaitReady()

  if let case let .authenticated(privyUser) = privy.authState {
    // user is authenticated - show authenticated screen
  } else {
    // user not authenticated - show login screen
  }
}
```

## Authentication

### AuthState

The `AuthState` represents the authentication state of your user.

```swift  theme={"system"}
public enum AuthState {
    /// Auth state has not been determined yet. Call `privy.awaitReady` to ensure auth state is set.
    case notReady

    /// Auth state cannot be determined while no network connectivity is available, but session tokens exist in cache.
    case authenticatedUnverified(AuthenticatedUnverifiedContext)

    /// The user is unauthenticated
    case unauthenticated

    /// The user is authenticated, and can be accessed via the associated value
    case authenticated(PrivyUser)
}
```

#### Accessing AuthState

The current auth state can be accessed any time via `privy.authState`.

#### Subscribing to AuthState updates

Auth state updates are exposed via `privy.authStateStream`, which is an AsyncStream.

```swift  theme={"system"}
func subscribeToAuthStateUpdates() {
  let task = Task {
      for await authState in privy.authStateStream {
          print("New auth state from Privy: \(authState)")
      }
  }

  // Cancel the task at some point in the future
  // task.cancel()
}
```

### The PrivyUser

After authenticating a user via any login method, you will receive the `PrivyUser` object. The `PrivyUser` represents an authenticated user. All user specific actions, such as creating a wallet or retrieving the user's access token, are accessed via the `PrivyUser`.

You may retrieve the `PrivyUser` anytime by calling `privy.user`. If this value is non-null, there is an authenticated user. If the value is null, there is no authenticated user.

The `PrivyUser` can also be retrieved via the associated type of the "authenticated" auth state:

```swift  theme={"system"}
if case .authenticated(let privyUser) = privy.authState {
  // user is authenticated
}
```

Use the `PrivyUser` object to:

* Get the user's ID
* Get the user's identity token
* Get the user's access token
* Get the user's linked accounts
* Get the user's embedded Ethereum wallets
* Get the user's embedded Solana wallets
* Create an embedded Ethereum wallet
* Create an embedded Solana wallet
* Refresh the user
* Log the user out

### Miscellaneous

#### Errors

We've significantly enhanced our error handling. When an SDK function throws an error, it will be a `PrivyError`, which contains an `errorCode` and a `localizedDescription`.

#### AuthSession

The `AuthSession` is no longer exposed. Values previously available in AuthSession are now available through different methods:

* `PrivyUser`: can be accessed via `privy.user` as described above.
* `accessToken`: can be accessed via `privy.user.getAccessToken()`. This method will return the user's access token, refreshing the session if needed.

#### Session Refresh

To refresh / update a `PrivyUser`, you'd previously call `privy.refreshSession`. Now, trigger the refresh via the `PrivyUser`, specifically, `privyUser.refresh`.

#### Logout

To logout an authenticated user, call `await privyUser.logout()` instead of `privy.logout()`. Once calling logout, the `PrivyUser` instance is no longer valid.

#### Linked Accounts

* `LinkedAccount` and its associated types are no longer `Codable`, `Hashable`, `Identifiable` or `Equatable`.
* `LinkedAccount.embeddedWallet` is now split into chain specific values - `LinkedAccount.embeddedEthereumWallet` and `LinkedAccount.embeddedSolanaWallet`
* The `chainId` property on the embedded wallet linked accounts is removed.
* `firstVerifiedAt` and `latestVerifiedAt` fields are now optional values.

#### Other type changes

* `firstVerifiedAt`, `latestVerifiedAt`, and `createdAt` fields now have type `Date` instead of `TimeInterval` or `Int`
* `verifiedAt` fields now replaced with `firstVerifiedAt` and `latestVerifiedAt`
* `LoginMethod` is no longer `Equatable`

### Login with SMS

* The `OtpFlowState` enum is no longer exposed. You should manually handle state management based on function results. For example, if `LoginWithSms.loginWithCode` throws an error, you can catch the error and update your UI accordingly.
* `LoginWithSms.sendCode` now throws an error if sending code is unsuccessful, instead of returning false
* `LoginWithSms.loginWithCode` now returns `PrivyUser`
* `LoginWithSms.loginWithCode` now requires phone number to be passed in as a parameter (previously was optional)

### Login with email

* The `OtpFlowState` enum is no longer exposed. You should manually handle state management based on function results. For example, if `LoginWithEmail.loginWithCode` throws an error, you can catch the error and update your UI accordingly.
* `LoginWithEmail.sendCode` now throws an error if sending code is unsuccessful, instead of returning false
* `LoginWithEmail.linkWithCode` no longer returns anything, and throws an error if linking fails
* `LoginWithEmail.loginWithCode` now returns `PrivyUser`
* `LoginWithEmail.loginWithCode` now requires email to be passed in (no longer optional)

### Login with custom auth

* `LoginWithCustomAccessToken.loginWithCustomAccessToken` now returns `PrivyUser`
* When initializing the PrivySDK, you should now pass the `TokenProvider` through the `PrivyLoginWithCustomAuthConfig` field in the `PrivyConfig` object. This allows Privy to access your user's access token at initialization while attempting to restore the Privy user's session.

### Login with SIWE

* `SiweFlowState` enum is no longer exposed. You should manually handle state management based on function results. For example, if `LoginWithSiwe.loginWithSiwe` throws an error, you can catch the error and update your UI accordingly.
* `LoginWithSiwe.loginWithSiwe` now returns `PrivyUser`
* `LoginWithSiwe.loginWithSiwe` now requires message and params to be passed in (no longer optional)
* `LoginWithSiwe.linkWithSiwe` no long returns anything, and throws an error if linking fails
* `LoginWithSiwe.linkWithSiwe` now requires message and params to be passed in (no longer optional)

### Login with OAuth

* LoginWithOAuth.login now returns `PrivyUser`

## Embedded wallets

### Overview

Previously, all embedded wallet APIs were accessible directly from the `privy.embeddedWallet` object, which is no longer available.

All embedded wallet APIs are now available via the `PrivyUser` instead. This is because all embedded wallet actions require an authenticated user, so adding the methods inside the authenticated `PrivyUser` was the most logical.

As an example, when creating an Ethereum wallet:

```swift  theme={"system"}
try await privy.embeddedWallet.createWallet(chainType: .ethereum) // Remove
try await privy.user.createEthereumWallet() // Add
```

### Connecting the wallet

In SDK 1.Y.Z, you had to ensure wallets were connected prior to accessing them by calling `privy.connectWallet()`. This method is now removed as **we handle connected state internally!** You may access the user's embedded wallets at anytime, without ensuring "wallet connected" state.

Because you no longer need to manage wallet state, `EmbeddedWalletState` has been removed.

### Ethereum vs Solana

Now, all embedded wallet APIs are chain specific and available via the `PrivyUser`.

#### Creating a wallet

Ethereum:

```swift  theme={"system"}
try await privy.embeddedWallet.createWallet(chainType: .ethereum) // Remove
let ethereumWallet = try await privy.user.createEthereumWallet() // Add
```

Solana:

```swift  theme={"system"}
try await privy.embeddedWallet.createWallet(chainType: .solana) // Remove
let solanaWallet = try await privy.user.createSolanaWallet() // Add
```

#### Retrieving a wallet

Ethereum:

```swift  theme={"system"}
// Ensure wallets are connected // Remove
guard case .connected(let wallets) = privy.embeddedWallet.embeddedWalletState else { // Remove
    print("Wallet not connected") // Remove
    return // Remove
} // Remove

// Grab first ethereum wallet from connected wallets // Remove
guard let wallet = wallets.first, wallet.chainType == .ethereum else { // Remove
    print("No Ethereum wallets available") // Remove
    return // Remove
} // Remove

// Directly grab ethereum wallets, without worrying about connected state // Add
let ethereumWallets: [EmbeddedEthereumWallet] = privy.user.embeddedEthereumWallets // Add
```

Solana:

```swift  theme={"system"}
// Ensure wallets are connected // Remove
guard case .connected(let wallets) = privy.embeddedWallet.embeddedWalletState else { // Remove
    print("Wallet not connected") // Remove
    return // Remove
} // Remove

// Grab first ethereum wallet from connected wallets // Remove
guard let wallet = wallets.first, wallet.chainType == .solana else { // Remove
    print("No Solana wallets available") // Remove
    return // Remove
} // Remove

// Directly grab ethereum wallets, without worrying about connected state // Add
let solanaWallets: [EmbeddedSolanaWallet] = privy.user.embeddedSolanaWallets // Add
```

#### Using a wallet / rpc providers

Instead of grabbing the wallet's provider via `try privy.embeddedWallet.getEthereumProvider(for: wallet.address)`, the provider is now available directly on the wallet instance. For example:

Ethereum:

```swift  theme={"system"}
// Create or retrieve the embedded Ethereum wallet
let ethereumWallet: EmbeddedEthereumWallet = privy.user.createEthereumWallet()

try await ethereumWallet.provider.request(
    // Note: RpcRequest was renamed to EthereumRpcRequest
    EthereumRpcRequest(...)
)
```

Further, switching and retrieving the EVM chain is now an async operation:

```swift  theme={"system"}
// retrieve current chain
let currentChain = await ethereumWallet.provider.chainId

// set chain to Sepolia
await ethereumWallet.provider.switchChain(chainId: 11155111, rpcUrl: nil)
```

Solana:

```swift  theme={"system"}
// Create or retrieve the embedded Ethereum wallet
let solanaWallet: EmbeddedSolanaWallet = privy.user.createSolanaWallet()

try await solanaWallet.provider.signMessage(...)
```

#### Changing the EVM chain

When utilizing the `EmbeddedEthereumWalletProvider`, you may specify the EVM Chain by calling `provider.switchChain`. This was previously named `provider.configure`.
\n