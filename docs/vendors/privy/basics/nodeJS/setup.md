> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# null

## Prerequisites

Before you begin:

* Get your [Privy app ID and app secret](/basics/get-started/dashboard/create-new-app) from the Privy Dashboard
* The following runtimes are supported:
  * Node.js 20 LTS or later ([non-EOL](https://endoflife.date/nodejs)) versions.
  * Deno v1.28.0 or higher.
  * Bun 1.0 or later.
  * Cloudflare Workers.
  * Vercel Edge Runtime.
  * Nitro v2.6 or greater.

## Instantiating the `PrivyClient`

Import the **`PrivyClient`** class and create an instance of it by passing the Privy **app ID** and **app secret** as parameters.

```ts  theme={"system"}
import {PrivyClient} from '@privy-io/node';

const privy = new PrivyClient({
  appId: 'insert-your-app-id',
  appSecret: 'insert-your-app-secret'
});
```

This `privy` **`PrivyClient`** is now your entry point to manage Privy from your server. With the `PrivyClient` you can interact with wallets with methods for creating wallets, signing and sending transactions. You can also manage users with methods for getting a user object, verifying an auth token, and importing new users.

## Rate limits

Privy rate limits REST API endpoints that you may call from your server.

<Tip>
  Learn more about optimizing your setup and handling rate limits in our
  [optimizing](/recipes/dashboard/optimizing) guide!
</Tip>
\n