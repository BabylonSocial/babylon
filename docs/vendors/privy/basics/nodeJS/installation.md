> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# null

<Info>
  This guide is for the **`@privy-io/node`** library. If you are looking for the deprecated
  **`@privy-io/server-auth`** library, please see the
  [NodeJS](/basics/nodeJS-server-auth/installation) guide.
</Info>

In a backend JS environment, you can use the **`@privy-io/node`** library to authorize requests and
manage your application from your server.
This library includes helpful utilities around verifying access tokens issued by Privy and
interacting with Privy's API to query and import users, create wallets, manage invite lists, and
more.

Install the Privy Server SDK using your package manager of choice:

<CodeGroup>
  ```bash npm theme={"system"}
  npm install @privy-io/node@latest
  ```

  ```bash pnpm theme={"system"}
  pnpm install @privy-io/node@latest
  ```

  ```bash yarn theme={"system"}
  yarn add @privy-io/node@latest
  ```
</CodeGroup>
\n