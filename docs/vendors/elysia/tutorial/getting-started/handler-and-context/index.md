Getting Started / IntroductionYour First RouteHandler and ContextStatus and HeadersValidationLifecycleGuardPluginEncapsulationCookieError HandlingValidation ErrorExtends ContextStandalone SchemaMacroOpenAPIMountUnit TestEnd-to-End Type SafetyWhat&#39;s Next?Documentation# Handler and Context [​](#handler-and-context)

Handler - a resource or a route function to send data back to client.

ts```
import { Elysia } from 'elysia'

new Elysia()
    // `() => 'hello world'` is a handler
    .get('/', () => 'hello world')
    .listen(3000)
```

A handler can also be a literal value, see [Handler](#/essential/handler)

ts```
import { Elysia } from 'elysia'

new Elysia()
    // `'hello world'` is a handler
    .get('/', 'hello world')
    .listen(3000)
```

Using an inline value can be useful for static resources like files.

## Context [​](#context)

Contains information about each request. It is passed as the only argument of a handler.

typescript```
import { Elysia } from 'elysia'

new Elysia()
	.get('/', (context) => context.path)
            // ^ This is a context
```

Context stores information about the request like:

- [body](#/essential/validation#body) - data sent by client to server like form data, JSON payload.
- [query](#/essential/validation#query) - query string as an object. (Query is extracted from a value after pathname starting from '?' question mark sign)
- [params](#/essential/validation#params) - Path parameters parsed as object
- [headers](#/essential/validation#headers) - HTTP Header, additional information about the request like "Content-Type".

See [Context](#/essential/handler#context).

## Preview [​](#preview)

You can preview the result by looking under the editor section.

There should be a tiny navigator on the top left of the preview window.

You can use it to switch between path and method to see the response.

You can also click  to edit body, and headers.

## Assignment [​](#assignment)

Let's try extracting context parameters:

Show answer- We can extract `body`, `query`, and `headers` from the first parameter of a callback function.
- We can then return them like `{ body, query, headers }`.
typescript```
import { Elysia } from 'elysia'

new Elysia()
	.post('/', ({ body, query, headers }) => {
		return {
			query,
			body,
			headers
		}
	})
	.listen(3000)
```
