> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# null

## Prerequisites

Before you begin, make sure you have [set up your Privy app and obtained your app ID](/basics/get-started/dashboard/create-new-app) and [client ID](/basics/get-started/dashboard/app-clients) from the Privy Dashboard.

<Warning>
  A properly set up app client is required for mobile apps and other non-web platforms to allow your
  app to interact with the Privy API. Please follow [this
  guide](/basics/get-started/dashboard/app-clients) to configure an app client.
</Warning>

## Initializing Privy

First, import the **Privy SDK** at the top of the file:

```swift  theme={"system"}
import PrivySDK
```

Initialize a **Privy** instance with a **`PrivyConfig`** object:

```swift  theme={"system"}
let config = PrivyConfig(
    appId: "YOUR_APP_ID",
    appClientId: "YOUR_APP_CLIENT_ID",
    loggingConfig: .init(
        logLevel: .verbose
    )
)

let privy: Privy = PrivySdk.initialize(config: config)
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

<ParamField body="loggingConfig" type="PrivyLoggingConfig" optional>
  (Optional) Your preferred log level and logging method. If no log level is specified, it will
  default to `PrivyLogLevel.NONE`.
</ParamField>

<ParamField body="customAuthConfig" type="LoginWithCustomAuthConfig" optional>
  (Optional) Only use this if you plan to use custom authentication. Find more information
  [here](/authentication/user-authentication/jwt-based-auth/overview).
</ParamField>

<Tip>
  Be sure to maintain a single instance of Privy across the lifetime of your application.
  Initializing multiple instances of Privy will result in unexpected errors.
</Tip>
\n