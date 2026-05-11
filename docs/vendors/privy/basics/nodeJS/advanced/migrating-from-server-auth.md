> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Migrating from server-auth

## Overview

If your app previously used Privy's `@privy-io/server-auth` SDK, follow the migration guide below to
upgrade to the `@privy-io/node` package.

The new `@privy-io/node` package is a major upgrade from the `@privy-io/server-auth` package, with
an improved structure, error handling, and better support for the latest features available in
Privy's API.

## Initialization

### 0. System requirements

The new `@privy-io/node` package, like its predecessor, is compatible with multiple server-side JavaScript runtimes.
Specifically, the following runtime versions are supported:

* Node.js 20 LTS or later ([non-EOL](https://endoflife.date/nodejs)) versions.
* Deno v1.28.0 or higher.
* Bun 1.0 or later.
* Cloudflare Workers.
* Vercel Edge Runtime.
* Nitro v2.6 or greater.

Refer to the [package's README](https://npmjs.com/package/@privy-io/node) for the most up-to-date list of supported runtimes.

### 1. Privy client initialization

The `PrivyClient` class now takes in a single configuration object, instead of
positional `appId` and `appSecret` parameters.

```ts  theme={"system"}
import {PrivyClient} from '@privy-io/server-auth' // [!code --]
import {PrivyClient as NewPrivyClient} from '@privy-io/node'; // [!code ++]

const privy = new PrivyClient('insert-your-app-id', 'insert-your-app-secret'); // [!code --]
const newPrivy = new NewPrivyClient({ // [!code ++]
  appId: 'insert-your-app-id', // [!code ++]
  appSecret: 'insert-your-app-secret' // [!code ++]
}); // [!code ++]
```

This results in a more consistent API as other configuration options are set.

### 2. Working with resources

The new package splits different groups of methods into resource-specific interfaces.

Whereas before you could call methods directly on the `PrivyClient` instance, you now generally need
to call methods on the resource-specific interfaces.

<Tip>
  The new SDK offers a one-to-one mapping of the API endpoints described in the [API
  reference](/api-reference/introduction). To facilitate this, methods called on the `PrivyClient`
  instance that need parameters to be passed in now take those in `snake_case` instead of
  `camelCase`, matching the API format exactly.
</Tip>

For example, for creating or importing a user with the `@privy-io/node` package, you will use the `users()` interface:

```ts {skip-check} theme={"system"}
import {AuthorizationContext, PrivyClient} from '@privy-io/node';

const privy = new PrivyClient({appId: 'insert-your-app-id', appSecret: 'insert-your-app-secret'});

const user = await privy.importUser({ // [!code --]
  linkedAccounts: [{type: 'email', address: 'test@example.com'}], // [!code --]
  wallets: [{chainType: 'ethereum'}] // [!code --]
}); // [!code --]
const user = await privy.users().create({ // [!code ++]
  // [!code ++]
  linked_accounts: [{type: 'email', address: 'test@example.com'}], // [!code ++]
  wallets: [{chain_type: 'ethereum'}] // [!code ++]
}); // [!code ++]
```

Likewise, many of the methods that were previously under the `walletApi` interface are now under the `wallets()` or \` interface.

| In `@privy-io/server-auth`             | In `@privy-io/node`                      |
| -------------------------------------- | ---------------------------------------- |
| `privy.walletApi.createWallet`         | `privy.wallets().create`                 |
| `privy.walletApi.rpc`                  | `privy.wallets().rpc`                    |
| `privy.walletApi.ethereum.signMessage` | `privy.wallets().ethereum().signMessage` |
| `privy.walletApi.createPolicy`         | `privy.policies().create`                |

### 3. Authorization signatures

The new package introduces the [`AuthorizationContext` interface](/controls/authorization-keys/using-owners/sign/signing-on-the-server),
which simplifies the process of generating authorization signatures.

```ts  theme={"system"}
import {PrivyClient} from '@privy-io/server-auth' // [!code --]
import {AuthorizationContext} from '@privy-io/node'; // [!code ++]

const privy = new PrivyClient('insert-your-app-id', 'insert-your-app-secret'); // [!code --]

privy.walletApi.updateAuthorizationKey('insert-your-authorization-private-key'); // [!code --]
const authorizationContext: AuthorizationContext = { // [!code ++]
  authorization_private_keys: ['insert-your-authorization-private-key'] // [!code ++]
}; // [!code ++]
```

Unlike before, where you would need to manually set an authorization key at the level of the client,
you will now **pass the authorization context as a parameter** to the method you are calling, giving you
fine grained control over the authorization context for each call, **allowing you to use different keys or
quorums for each request**.

Further, the new interface support combining different signing mechanisms in the authorization context as you see fit, for example,
by combining a user JWT and an authorization key for a resource that is owned by both a user and a service:

```ts  theme={"system"}
import {PrivyClient} from '@privy-io/server-auth' // [!code --]
import {AuthorizationContext} from '@privy-io/node';

const privy = new PrivyClient('insert-your-app-id', 'insert-your-app-secret'); // [!code --]

const {authorizationKey} = await privy.walletApi.generateUserSigner({ // [!code --]
  userJwt: 'insert-user-jwt' // [!code --]
}); // [!code --]
privy.walletApi.updateAuthorizationKey(authorizationKey); // [!code --]
const authorizationContext: AuthorizationContext = { // [!code ++]
  user_jwts: ['insert-user-jwt'], // [!code ++]
  authorization_private_keys: ['insert-authorization-private-key'] // [!code ++]
}; // [!code ++]
```

Check out the [Authorization Context](/controls/authorization-keys/using-owners/sign/signing-on-the-server) guide in full for more details on the new interface.

<Warning>
  The `privy.walletApi.generateUserSigner` method is no longer available in the `@privy-io/node`
  package. Instead you can set the `user_jwts` property on the authorization context, and the SDK
  will handle the authorization keys automatically.
</Warning>
\n