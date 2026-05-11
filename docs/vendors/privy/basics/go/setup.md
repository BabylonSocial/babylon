> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Setup

> Configure the Privy Go SDK client with app credentials and authorization context

## Prerequisites

Before getting started:

* Obtain a [Privy app ID and app secret](/basics/get-started/dashboard/create-new-app) from the Privy Dashboard
* Install Go 1.23 or later

## Instantiating the `PrivyClient`

Import the `go-sdk` package and create a new client instance by passing the Privy **app ID** and
**app secret** as parameters.

```go  theme={"system"}
package main

import (
	privy "github.com/privy-io/go-sdk"
)

func main() {
	client := privy.NewPrivyClient(privy.PrivyClientOptions{
		AppID:     "your-privy-app-id",
		AppSecret: "your-app-secret",
	})
}
```

This `client` is the entry point for managing Privy resources from a server. The `PrivyClient`
provides methods for creating wallets, signing and sending transactions, retrieving user objects,
verifying auth tokens, and querying users.

## Authorization

If a resource (i.e. wallet, policy, or key quorum) has an [owner](/controls/authorization-keys/using-owners/overview),
[authorization signatures](/api-reference/authorization-signatures) from the owner are required.
The [authorization context](/controls/authorization-keys/using-owners/sign/signing-on-the-server) accepts authorization private keys
and user JWTs of the wallet's owners. The Go SDK generates signatures and signs requests
automatically.

<Tip>
  Review the [signing on the
  server](/controls/authorization-keys/using-owners/sign/signing-on-the-server) guide before using
  the Go SDK for the best development experience.
</Tip>

```go  theme={"system"}
import "github.com/privy-io/go-sdk/authorization"

authCtx := authorization.AuthorizationContext{
	PrivateKeys: []string{"privateKey1", "privateKey2"},
	UserJwts:    []string{"jwt1", "jwt2"},
}
```

## Rate limits

Privy rate limits REST API endpoints called from a server.

<Tip>
  Learn more about optimizing request patterns and handling rate limits in the
  [optimizing](/recipes/dashboard/optimizing) guide.
</Tip>

## Next steps

<CardGroup cols={2}>
  <Card title="Quickstart" icon="rocket" href="/basics/go/quickstart">
    Create wallets, sign messages, and send transactions with the Go SDK.
  </Card>

  <Card title="Authorization keys" icon="key" href="/controls/authorization-keys/overview">
    Add an extra layer of security by signing requests with authorization keys.
  </Card>
</CardGroup>
\n