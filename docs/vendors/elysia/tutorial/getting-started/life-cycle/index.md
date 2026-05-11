Getting Started / IntroductionYour First RouteHandler and ContextStatus and HeadersValidationLifecycleGuardPluginEncapsulationCookieError HandlingValidation ErrorExtends ContextStandalone SchemaMacroOpenAPIMountUnit TestEnd-to-End Type SafetyWhat&#39;s Next?Documentation# Lifecycle [​](#lifecycle)

Lifecycle hooks are functions that are executed on a specific event during the request-response cycle.

They allow you to run custom logic at a certain point

- [request](#/essential/life-cycle#request) - when a request is received
- [beforeHandle](#/essential/life-cycle#before-handle) - before executing a handler
- [afterResponse](#/essential/life-cycle#after-response) - after a response is sent, etc.
- [error](#/essential/life-cycle#on-error-error-handling) - when an error occurs

This can be useful for tasks like logging, authentication, etc.

To register a lifecycle hook, you can pass it as the 3rd argument of a route method:

typescript```
import { Elysia } from 'elysia'

new Elysia()
	.get('/1', () => 'Hello Elysia!')
	.get('/auth', () => {
		console.log('This is executed after "beforeHandle"')

		return 'Oh you are lucky!'
	}, {
		beforeHandle({ request, status }) {
			console.log('This is executed before handler')

			if(Math.random()  'Hello Elysia!')
```

Here we use `status(418)` which is the "I'm a teapot" status code. You can also use the string name directly: `status("I'm a teapot")`. See [Status](#/tutorial/getting-started/status-and-headers#status) for more on using status codes.

When `beforeHandle` returns a value, it will skip the handler and return the value instead.

This is useful for things like authentication, where you want to return a `401 Unauthorized` response if the user is not authenticated.

See [Life Cycle](#/essential/life-cycle), [Before Handle](#/essential/life-cycle#before-handle) for a more detailed explanation.

## Hook [​](#hook)

A function that intercepts the lifecycle event. because a function "hooks" into the lifecycle event

Hook can be categorized into 2 types:

- [Local Hook](#/essential/life-cycle#local-hook) - execute on a specific route
- [Interceptor Hook](#/essential/life-cycle#interceptor-hook) - execute on every route after the hook is registered
## Local Hook [​](#local-hook) A local hook is executed on a specific route.

To use a local hook, you can inline hook into a route handler:

typescript```
// Similar to previous code snippet
import { Elysia } from 'elysia'

new Elysia()
	.get('/1', () => 'Hello Elysia!')
	.get('/auth', () => {
		console.log('Run after "beforeHandle"')

		return 'Oh you are lucky!'
	}, {
		// This is a Local Hook
		beforeHandle({ request, status }) {
			console.log('Run before handler')

			if(Math.random()  'Hello Elysia!')
```

## Interceptor Hook [​](#interceptor-hook)

Register hook into every handler that came after the hook is called for the current instance only.

To add an interceptor hook, you can use `.on` followed by a lifecycle event:

typescript```
import { Elysia } from 'elysia'

new Elysia()
	.get('/1', () => 'Hello Elysia!')
	.onBeforeHandle(({ request, status }) => {
		console.log('This is executed before handler')

		if(Math.random()  {
		console.log('This is executed after "beforeHandle"')

		return 'Oh you are lucky!'
	})
	// "beforeHandle" is also applied
	.get('/2', () => 'Hello Elysia!')
```

Unlike Local Hook, Interceptor Hook will add the hook to every route that came after the hook is registered.

## Assignment [​](#assignment)

Let's put 2 types of hooks into practice.

Show answerWe can use `beforeHandle` to intercept the request before it reaches the handler, and return a response with `status` method.

typescript```
import { Elysia } from 'elysia'

new Elysia()
	.onBeforeHandle(({ query: { name }, status }) => {
		if(!name) return status(401)
	})
	.get('/auth', ({ query: { name = 'anon' } }) => {
		return `Hello ${name}!`
	})
	.get('/profile', ({ query: { name = 'anon' } }) => {
		return `Hello ${name}!`
	})
	.listen(3000)
```
