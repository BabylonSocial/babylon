---
url: 'https://elysiajs.com/eden/overview.md'
---

# End-to-End Type Safety&#x20;

Imagine you have a toy train set.

Each piece of the train track has to fit perfectly with the next one, like puzzle pieces.

End-to-end type safety is like making sure all the pieces of the track match up correctly so the train doesn't fall off or get stuck.

For a framework to have end-to-end type safety means that you can connect the client and server in a type-safe manner.

Elysia provides end-to-end type safety **without code generation** out of the box with an RPC-like connector, **Eden**.

Other frameworks that support e2e type safety:

* tRPC
* Remix
* SvelteKit
* Nuxt
* TS-Rest

Elysia allows you to change the type on the server, and it will be instantly reflected on the client, helping with auto-completion and type enforcement.

## Eden

Eden is an RPC-like client to connect Elysia with **end-to-end type safety** using only TypeScript's type inference instead of code generation.

It allows you to sync client and server types effortlessly, weighing less than 2KB.

Eden consists of 2 modules:

1. Eden Treaty **(recommended)**: an improved RPC version of Eden Treaty 1 (edenTreaty)
2. Eden Fetch: A fetch-like client with type safety

Below is an overview, use cases, and a comparison for each module.

## Eden Treaty (Recommended)

Eden Treaty is an object-like representation of an Elysia server providing end-to-end type safety and a significantly improved developer experience.

With Eden Treaty, we can interact with an Elysia server with full-type support and auto-completion, error handling with type narrowing, and create type-safe unit tests.

Example usage of Eden Treaty:

```typescript twoslash
// @filename: server.ts
import { Elysia, t } from 'elysia'

const app = new Elysia()
    .get('/', 'hi')
    .get('/users', () => 'Skadi')
    .put('/nendoroid/:id', ({ body }) => body, {
        body: t.Object({
            name: t.String(),
            from: t.String()
        })
    })
    .get('/nendoroid/:id/name', () => 'Skadi')
    .listen(3000)

export type App = typeof app

// @filename: index.ts
// ---cut---
import { treaty } from '@elysiajs/eden'
import type { App } from './server'

const app = treaty<App>('localhost:3000')

// @noErrors
app.
//  ^|




// Call [GET] at '/'
const { data } = await app.get()

// Call [PUT] at '/nendoroid/:id'
const { data: nendoroid, error } = await app.nendoroid({ id: 1895 }).put({
    name: 'Skadi',
    from: 'Arknights'
})
```

## Eden Fetch

A fetch-like alternative to Eden Treaty for developers who prefer fetch syntax.

```typescript
import { edenFetch } from '@elysiajs/eden'
import type { App } from './server'

const fetch = edenFetch<App>('http://localhost:3000')

const { data } = await fetch('/name/:name', {
    method: 'POST',
    params: {
        name: 'Saori'
    },
    body: {
        branch: 'Arius',
        type: 'Striker'
    }
})
```

::: tip NOTE
Unlike Eden Treaty, Eden Fetch doesn't provide WebSocket implementation for the Elysia server.
:::
