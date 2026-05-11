> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# null

## Prerequisites

Before you begin, make sure you have [set up your Privy app and obtained your app ID](/basics/get-started/dashboard/create-new-app) and [client ID](/basics/get-started/dashboard/app-clients) from the Privy Dashboard.

<Warning>
  A properly set up app client is required for mobile apps and other non-web platforms to allow your
  app to interact with the Privy API. Please follow this guide to configure an app client by
  following this guide [here](/basics/get-started/dashboard/app-clients).
</Warning>

## Initializing Privy

First, import the Privy package at the top of your file:

```dart  theme={"system"}
import 'package:privy_flutter/privy_flutter.dart';
```

Initialize a **Privy** instance with a **`PrivyConfig`** object:

```dart  theme={"system"}
final privyConfig = PrivyConfig(
  appId: "YOUR_APP_ID",
  appClientId: "YOUR_CLIENT_ID",
  logLevel: PrivyLogLevel.verbose,
);

final privy = Privy(config: privyConfig);
```

## Configuration

The configuration fields for the PrivyConfig are:

<ParamField body="appId" type="String" required>
  Your Privy application ID, which can be obtained from the [**Privy Developer
  Dashboard**](https://dashboard.privy.io), under App Settings > Basics
</ParamField>

<ParamField body="appClientId" type="String" required>
  Your app client ID, which can be obtained from the [**Privy Developer
  Dashboard**](https://dashboard.privy.io), under App Settings > Clients
</ParamField>

<ParamField body="logLevel" type="PrivyLogLevel" optional>
  (Optional) Your preferred log level. If no log level is specified, it will default to
  `PrivyLogLevel.NONE`.
</ParamField>

<ParamField body="customAuthConfig" type="LoginWithCustomAuthConfig" optional>
  (Optional) Only use this if you plan to use custom authentication. Find more information
  [here](/authentication/user-authentication/jwt-based-auth/overview).
</ParamField>

<Tip>
  Be sure to maintain a single instance of Privy across the lifetime of your application.
  Initializing multiple instances of Privy will result in unexpected errors.
</Tip>

## Waiting for Privy to be ready

When the Privy SDK is initialized, the user's authentication state will be set to `NotReady` until Privy finishes initialization. This might include checking if the user has a wallet connected, refreshing expired auth tokens, fetching up-to-date user data, and more.

**It's important to wait until Privy has finished initializing *before* you consume Privy's state and interfaces**, to ensure that the state you consume is accurate and not stale.

For your convenience, we've added an async `awaitReady()` function that you can use to wait for Privy to finish initializing:

```dart  theme={"system"}
Future<void> checkPrivyAuth() async {
  // Show loading state
  setState(() => isLoading = true);

  // Wait for Privy SDK to be ready
  await privy.awaitReady();

  // Check if user is authenticated
  bool isAuthenticated = privy.currentAuthState.isAuthenticated;

  // Update UI based on authentication state
  setState(() {
    isLoading = false;
    isUserAuthenticated = isAuthenticated;
  });
}

// Example usage in a widget
@override
Widget build(BuildContext context) {
  return isLoading
    ? LoadingScreen()
    : (isUserAuthenticated ? AppScreen() : LoginScreen());
}
```

<CardGroup cols={2}>
  <Card title="Quickstart Guide" icon="rocket" href="/basics/flutter/quickstart">
    Learn how to [log users in](/authentication/user-authentication/login-methods/email) and
    [transact with embedded wallets](/wallets/wallets/create/create-a-wallet)
  </Card>

  <Card title="Flutter Starter Repo" icon="code" href="https://github.com/privy-io/examples/tree/main/privy-flutter-starter">
    Check out our [Flutter starter
    repo](https://github.com/privy-io/examples/tree/main/privy-flutter-starter) for a complete
    example
  </Card>
</CardGroup>
\n