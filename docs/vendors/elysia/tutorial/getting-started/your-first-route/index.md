Getting Started / IntroductionYour First RouteHandler and ContextStatus and HeadersValidationLifecycleGuardPluginEncapsulationCookieError HandlingValidation ErrorExtends ContextStandalone SchemaMacroOpenAPIMountUnit TestEnd-to-End Type SafetyWhat&#39;s Next?Documentation# Your First Route [​](#your-first-route)

When we enter a website, it takes

- path like `/`, `/about`, or `/contact`
- method like `GET`, `POST`, or `DELETE`
To determine which resource to show, simply called "route".

In Elysia, we can define a route by:

- Call method named after HTTP method
- Path being the first argument
- Handler being the second argument
typescript```
import { Elysia } from 'elysia'

new Elysia()
	.get('/', 'Hello World!')
	.listen(3000)
```

## Routing [​](#routing)

Path in Elysia can be grouped into 3 types:

- static paths - static string to locate the resource
- dynamic paths - segment can be any value
- wildcards - path until a specific point can be anything
See [Route](#/essential/route).

## Static Path [​](#static-path)

Static path is a hardcoded string to locate the resource on the server.

ts```
import { Elysia } from 'elysia'

new Elysia()
	.get('/hello', 'hello')
	.get('/hi', 'hi')
	.listen(3000)
```

See [Static Path](#/essential/route#static-path).

## Dynamic path [​](#dynamic-path)

Dynamic paths match some part and capture the value to extract extra information.

To define a dynamic path, we can use a colon `:` followed by a name.

typescript```
import { Elysia } from 'elysia'

new Elysia()
    .get('/id/:id', ({ params: { id } }) => id)
    .listen(3000)
```

Here, a dynamic path is created with `/id/:id`, which tells Elysia to capture the value `:id` segment with value like /id/1, /id/123, /id/anything.

localhost/id/1/id/123/id/anything/id/id/anything/testGET

1See [Dynamic Path](#/essential/route#dynamic-path).

### Optional path parameters [​](#optional-path-parameters)

We can make a path parameter optional by adding a question mark `?` after the parameter name.

typescript```
import { Elysia } from 'elysia'

new Elysia()
    .get('/id/:id?', ({ params: { id } }) => `id ${id}`)
    .listen(3000)
```

localhost/id/id/1GET

See [Optional Path Parameters](#/essential/route#optional-path-parameters).

## Wildcards [​](#wildcards)

Dynamic paths allow capturing a single segment while wildcards allow capturing the rest of the path.

To define a wildcard, we can use an asterisk `*`.

typescript```
import { Elysia } from 'elysia'

new Elysia()
    .get('/id/*', ({ params }) => params['*'])
    .listen(3000)
```

localhost/id/1/id/123/id/anything/id/id/anything/restGET

1See [Wildcards](#/essential/route#wildcards).

## Assignment [​](#assignment)

Let's recap, and create 3 paths with different types:

Show answer- Static path `/elysia` that responds with `"Hello Elysia!"`
- Dynamic path `/friends/:name?` that responds with `"Hello {name}!"`
- Wildcard path `/flame-chasers/*` that responds with the rest of the path.
typescript```
import { Elysia } from 'elysia'

new Elysia()
	.get('/elysia', 'Hello Elysia!')
	.get('/friends/:name?', ({ params: { name } }) => `Hello ${name}!`)
	.get('/flame-chasers/*', ({ params }) => params['*'])
	.listen(3000)
```
