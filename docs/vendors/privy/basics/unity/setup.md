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

Initialize Privy as early as possible in your game's lifecycle by calling `PrivyManager.Initialize(PrivyConfig config)`:

```csharp  theme={"system"}
var config = new PrivyConfig{
    AppId = "YOUR_APP_ID",
    ClientId = "YOUR_CLIENT_ID"
};

PrivyManager.Initialize(config);
```

## Configuration

The configuration fields for the PrivyConfig are:

<ParamField name="AppId" type="String" required>
  Your Privy application ID, which can be obtained from the [**Privy Developer
  Dashboard**](https://dashboard.privy.io), under App Settings > Basics
</ParamField>

<ParamField name="ClientId" type="String" required>
  Your app client ID, which can be obtained from the [**Privy Developer
  Dashboard**](https://dashboard.privy.io), under App Settings > Clients
</ParamField>

<Tip>
  Be sure to initialize Privy only once at the start of your game. Initializing multiple instances
  of Privy will result in unexpected errors.
</Tip>
\n