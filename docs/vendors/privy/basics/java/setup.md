> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# null

## Prerequisites

Before you begin, make sure you have [set up your Privy app and obtained your app ID and app
secret](/basics/get-started/dashboard/create-new-app) from the Privy Dashboard.

## Getting the `PrivyClient`

Import the `PrivyClient` class and create an instance of it, passing the Privy **app ID** and
**app secret** as parameters.

```java  theme={"system"}
import io.privy.api.PrivyClient;

PrivyClient client = PrivyClient.builder()
        .appId("your-privy-app-id")
        .appSecret("your-app-secret")
        .build();
```

This `client` is now your entrypoint to manage Privy from your server. With the `PrivyClient` you
can interact with wallets with methods for creating wallets, signing and sending transactions.
You can also manage users with methods for getting a user object, verifying an auth token, and
querying users.

## Authorization

If a resource (i.e. wallet, policy, key quorum) has an [owner](/controls/authorization-keys/using-owners/overview),
[authorization signatures](/api-reference/authorization-signatures) from the owner are required.
Use the [authorization context](/controls/authorization-keys/using-owners/sign/signing-on-the-server) to specify authorization private keys
and user JWTs of the wallet's owners, and the Java SDK will generate signatures and sign requests
under the hood.

<Tip>
  We strongly recommend reading [this
  guide](/controls/authorization-keys/using-owners/sign/signing-on-the-server) before using the Java
  SDK for the best development experience.
</Tip>

```java  theme={"system"}
AuthorizationContext context = AuthorizationContext.builder()
    .addUserJwts(Arrays.asList("jwt1", "jwt2"))
    .addAuthorizationPrivateKeys(Arrays.asList("privateKey1", "privateKey2"))
    .build();
```

## Rate limits

Privy rate limits REST API endpoints that you may call from your server.

<Tip>
  Learn more about optimizing your setup and handling rate limits in our
  [optimizing](/recipes/dashboard/optimizing) guide!
</Tip>
\n