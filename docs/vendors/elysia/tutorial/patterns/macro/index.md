Patterns / IntroductionYour First RouteHandler and ContextStatus and HeadersValidationLifecycleGuardPluginEncapsulationCookieError HandlingValidation ErrorExtends ContextStandalone SchemaMacroOpenAPIMountUnit TestEnd-to-End Type SafetyWhat&#39;s Next?Documentation# Macro [​](#macro)

Reusable route options.

Imagine we have an authentication check like this:

typescript```
import { Elysia, t } from 'elysia'

new Elysia()
	.post('/user', ({ body }) => body, {
		cookie: t.Object({
			session: t.String()
		}),
		beforeHandle({ cookie: { session } }) {
			if(!session.value) throw 'Unauthorized'
		}
	})
	.listen(3000)
```

If we have multiple routes that require authentication, we have to repeat the same options over and over again.

Instead, we can use a macro to reuse route options:

typescript```
import { Elysia, t } from 'elysia'

new Elysia()
	.macro('auth', {
		cookie: t.Object({
			session: t.String()
		}),
		// psuedo auth check
		beforeHandle({ cookie: { session }, status }) {
			if(!session.value) return status(401)
		}
	})
	.post('/user', ({ body }) => body, {
		auth: true
	})
	.listen(3000)
```

auth will then inline both cookie, and beforeHandle to the route.

Simply put, [Macro](#/patterns/macro) is a reusable route option, similar to function but as a route option with type soundness.

## Assignment [​](#assignment)

Let's define a macro to check if a body is a Fibonacci number:

typescript```
function isFibonacci(n: number) {
	let a = 0, b = 1
	while(b Show answer- To enforce type, we can define a `body` property in the macro.
- To short-circuit the request, we can use `status` function to return early.
typescript```
import { Elysia, t } from 'elysia'

function isPerfectSquare(x: number) {
    const s = Math.floor(Math.sqrt(x))
    return s * s === x
}

function isFibonacci(n: number) {
    if (n  body, {
		isFibonacci: true
	})
    .listen(3000)
```
