> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Integrating with tRPC

**[tRPC](https://trpc.io) is an end-to-end typesafe API built in Typescript.** This guide shows how to integrate Privy into any tRPC application.

There are two steps to enable auth in tRPC with Privy:

* in your [client](/recipes/trpc.mdx#configuring-your-client), include the user's access token on requests
* in your [server](/recipes/trpc.mdx#protecting-routes-on-your-server), secure procedures by validating the token included on requests

<Tip>
  If you're using tRPC with [zod](https://github.com/colinhacks/zod), check out [this transformation
  tool](https://transform.tools/typescript-to-zod) to automatically generate zod schemas from
  Privy's types (e.g. **`user.email`**).
</Tip>

## Configuring your client

**When your client (frontend) makes a request to one of your tRPC procedures, you should include the Privy auth token, so that your server can verify that the user is authenticated.**

<Info>
  The following works for both
  [`createTRPCProxyClient`](https://trpc.io/docs/typedoc/client/functions/createTRPCProxyClient-1)
  (vanilla) or [`createTRPCNextClient`](https://trpc.io/docs/nextjs#createtrpcnext-options)
  (Next.js). Note that while the configuration method signature is different between the two, the
  inner configuration object/strategy will remain the same. The example shown is for NextJS.
</Info>

When [scaffolding the tRPC client](https://trpc.io/docs/vanilla), pass the Privy auth token through the header of every request, via an [`httpBatchLink`](https://trpc.io/docs/links/httpBatchLink) within the `links` configuration. Below is an example:

```tsx  theme={"system"}
import {httpBatchLink} from '@trpc/client';
import {createTRPCNext} from '@trpc/next';

import {getAccessToken} from '@privy-io/react-auth';

export const api = createTRPCNext<AppRouter>({
  config() {
    return {
      links: [
        httpBatchLink({
          url: `your_base_url`,
          // apply the privy token to each request
          async headers() {
            return {
              Authorization: `Bearer ${(await getAccessToken()) || ''}`
            };
          }
        })
      ]
    };
  }
});
```

## Protecting routes on your server

**When your server receives a request from the client, it should validate the Privy auth token to confirm included in the request to ensure that it is authenticated.**

First, parse the passed token using jose where you create your tRPC context:

<CodeGroup>
  ```ts @privy-io/node theme={"system"}
  import * as trpc from '@trpc/server';
  import {inferAsyncReturnType} from '@trpc/server';
  import * as trpcNext from '@trpc/server/adapters/next';

  import {PrivyClient, VerifyAuthTokenResponse} from '@privy-io/node';

  // configure your privy server auth client

  const privy = new PrivyClient({
    appId: process.env.NEXT_PUBLIC_PRIVY_APP_ID || '',
    appSecret: process.env.PRIVY_APP_SECRET || ''
  });

  export async function createContext({req, res}: trpcNext.CreateNextContextOptions) {
    const authToken = req.headers.authorization.replace('Bearer ', '');
    let userClaim: VerifyAuthTokenResponse | undefined = undefined;

    if (authToken) {
      try {
        userClaim = await privy.utils().auth().verifyAuthToken(authToken);
        // the claim contains all details about the validated privy token and can be passed
        // via the context for use in all server routes
        // if you want to pull additional details about the user via your api / db, such as whether the user is an
        // admin, here's your chance!
      } catch (_) {
        // this is an expected error for tRPC procedures that don't need to be authenticated
        // if privy is expected, we will throw a 403 at the middleware level, shown in the next step
      }
    }
    return {
      userClaim
    };
  }
  export type Context = inferAsyncReturnType<typeof createContext>;
  ```

  ```ts @privy-io/server-auth theme={"system"}
  import * as trpc from '@trpc/server';
  import {inferAsyncReturnType} from '@trpc/server';
  import * as trpcNext from '@trpc/server/adapters/next';

  import {PrivyClient, AuthTokenClaims} from '@privy-io/server-auth';

  // configure your privy server auth client

  const privy = new PrivyClient(
    process.env.NEXT_PUBLIC_PRIVY_APP_ID || '',
    process.env.PRIVY_APP_SECRET || ''
  );

  export async function createContext({req, res}: trpcNext.CreateNextContextOptions) {
    const authToken = req.headers.authorization.replace('Bearer ', '');
    let userClaim: AuthTokenClaims | undefined = undefined;

    if (authToken) {
      try {
        userClaim = await privy.verifyAuthToken(authToken);
        // the claim contains all details about the validated privy token and can be passed
        // via the context for use in all server routes
        // if you want to pull additional details about the user via your api / db, such as whether the user is an
        // admin, here's your chance!
      } catch (_) {
        // this is an expected error for tRPC procedures that don't need to be authenticated
        // if privy is expected, we will throw a 403 at the middleware level, shown in the next step
      }
    }
    return {
      userClaim
    };
  }
  export type Context = inferAsyncReturnType<typeof createContext>;
  ```
</CodeGroup>

Next, create a middleware procedure for protecting routes:

```typescript {skip-check} theme={"system"}
const isPrivyAuthed = t.middleware(async ({ctx, next}) => {
  // check to make sure that the token was valid.
  // you can add further logic here, such as checking if the user is an admin,
  // if you added more user context within `createContext` above.
  if (!ctx.userClaim) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Not authenticated'
    });
  }
  return next({
    ctx
  });
});
export const privyProtectedProcedure = t.procedure.use(isPrivyAuthed);
```

Finally, when defining routes, you can use your procedure middleware to ensure the user is properly authenticated.

```typescript {skip-check} theme={"system"}
t.router({
  // this is accessible for everyone
  hello: t.procedure
    .input(z.string().nullish())
    .query(({input, ctx}) => `hello ${input ?? ctx.user?.name ?? 'world'}`),
  admin: t.router({
    // this is accessible only to admins
    secret: privyProtectedProcedure.query(({ctx}) => {
      return {
        secret: 'sauce'
      };
    })
  })
});
```
\n