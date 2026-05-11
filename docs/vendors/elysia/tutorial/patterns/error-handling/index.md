Patterns / IntroductionYour First RouteHandler and ContextStatus and HeadersValidationLifecycleGuardPluginEncapsulationCookieError HandlingValidation ErrorExtends ContextStandalone SchemaMacroOpenAPIMountUnit TestEnd-to-End Type SafetyWhat&#39;s Next?Documentation# Error Handling [​](#error-handling)

[onError](#/essential/life-cycle#on-error-error-handling) is called when an error is thrown.It accepts context similar to a handler but includes an additional:

- error - a thrown error
- [code](#/essential/life-cycle#error-code) - error code

typescript``` import { Elysia } from 'elysia'  new Elysia()  .onError(({ code, status }) => {  if(code === "NOT_FOUND")  return 'uhe~ are you lost?'   return status(418, "My bad! But I'm cute so you'll forgive me, right?")  })  .get('/', () => 'ok')  .listen(3000) ``` You can return a [status](#/essential/handler#status) to override the default error status.

## Custom Error [​](#custom-error)

You can provide a custom error with [error code](#/essential/life-cycle#error-code) as follows:

typescript```
import { Elysia } from 'elysia'

class NicheError extends Error {
	constructor(message: string) {
		super(message)
	}
}

new Elysia()
	.error({
		'NICHE': NicheError
	})
	.onError(({ error, code, status }) => {
		if(code === 'NICHE') {
			// Typed as NicheError
			console.log(error)

			return status(418, "We have no idea how you got here")
		}
	})
	.get('/', () => {
        throw new NicheError('Custom error message')
	})
	.listen(3000)
```

Elysia uses [error codes](#/essential/life-cycle#error-code) to narrow down the type of error.

It's recommended to register custom errors as Elysia can narrow down the type.

### Error Status Code [​](#error-status-code)

You can also provide a custom status code by adding a status property to class:

typescript```
import { Elysia } from 'elysia'

class NicheError extends Error {
	status = 418

	constructor(message: string) {
		super(message)
	}
}
```

Elysia will use this status code if the error is thrown, see [Custom Status Code](#/error-handling.html#custom-status-code).

### Error Response [​](#error-response)

You can also define a custom error response directly into the error by providing a `toResponse` method:

typescript```
import { Elysia } from 'elysia'

class NicheError extends Error {
	status = 418

	constructor(message: string) {
		super(message)
	}

	toResponse() {
		return { message: this.message }
	}
}
```

Elysia will use this response if the error is thrown, see [Custom Error Response](#/error-handling.html#custom-error-response).

## Assignment [​](#assignment)

Let's try to extend Elysia's context.

Show answer 1. You can narrow down the error by &quot;NOT_FOUND&quot; to override 404 response. 2. Provide your error to `.error()` method with status property of 418. typescript```
import { Elysia } from 'elysia'

class YourError extends Error {
	status = 418

	constructor(message: string) {
		super(message)
	}
}

new Elysia()
	.error({
		"YOUR_ERROR": YourError
	})
	.onError(({ code, status }) => {
		if(code === "NOT_FOUND")
			return "Hi there"
	})
	.get('/', () => {
		throw new YourError("A")
	})
	.listen(3000)
```
