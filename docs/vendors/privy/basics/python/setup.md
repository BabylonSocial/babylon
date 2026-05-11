> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# null

## Prerequisites

Before you begin, make sure you have [set up your Privy app and obtained your app ID and app secret](/basics/get-started/dashboard/create-new-app) from the Privy Dashboard.

## Getting the `PrivyClient`

Import the **`PrivyAPI`** class and create an instance of it, passing the Privy **app ID** and **app secret** as parameters.

```python  theme={"system"}
from privy import PrivyAPI

client = PrivyAPI(
    app_id="insert-your-app-id",
    app_secret="insert-your-app-secret"
)
```

This `client` is now your entrypoint to manage Privy from your server. With the `PrivyAPI` you can interact with wallets with methods for creating wallets, signing and sending transactions. You can also manage users with methods for getting a user object, verifying an auth token, and querying users.

## Interacting with wallets server-side

Authorization keys are the core primitive for managing wallets in Privy. In server-side environments, you can get
an authorization key from a user's JWT, or use one that you manage from your backend.

You can get a user's authorization key from their JWT by calling the `generate_user_signer` method:

```python  theme={"system"}
signer = client.wallets.generate_user_signer(
    user_jwt="insert-user-jwt"
)

client.update_authorization_key(signer.decrypted_authorization_key)
```

## Rate limits

Privy rate limits REST API endpoints that you may call from your server.

<Tip>
  Learn more about optimizing your setup and handling rate limits in our
  [optimizing](/recipes/dashboard/optimizing) guide!
</Tip>
\n