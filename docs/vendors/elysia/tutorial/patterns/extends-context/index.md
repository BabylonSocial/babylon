Patterns / IntroductionYour First RouteHandler and ContextStatus and HeadersValidationLifecycleGuardPluginEncapsulationCookieError HandlingValidation ErrorExtends ContextStandalone SchemaMacroOpenAPIMountUnit TestEnd-to-End Type SafetyWhat&#39;s Next?Documentation# Extends Context [​](#extends-context)

Elysia provides a context with small utilities to help you get started.

You can extend Elysia's context with:

- [Decorate](#/essential/handler.html#decorate)
- [State](#/essential/handler.html#state)
- [Resolve](#/essential/handler.html#resolve)
- [Derive](#/essential/handler.html#derive)
## Decorate [​](#decorate) Singleton, and immutable properties that are shared across all requests.

typescript```
import { Elysia } from 'elysia'

class Logger {
    log(value: string) {
        console.log(value)
    }
}

new Elysia()
    .decorate('logger', new Logger())
    .get('/', ({ logger }) => {
        logger.log('hi')

        return 'hi'
    })
```

Decorated value it will be available in the context as a read-only property, see [Decorate](#/essential/handler.html#decorate).

## State [​](#state)

A mutable reference that is shared across all requests.

typescript```
import { Elysia } from 'elysia'

new Elysia()
	.state('count', 0)
	.get('/', ({ store }) => {
		store.count++

		return store.count
	})
```

State will be available in context.store that is shared across every request, see [State](#/essential/handler.html#state).

## Resolve / Derive [​](#resolve-derive)

[Decorate](#/essential/handler.html#decorate) value is registered as a singleton.While [Resolve](#/essential/handler.html#resolve), and [Derive](#/essential/handler.html#derive) allows you to abstract a context value per request.

typescript```
import { Elysia } from 'elysia'

new Elysia()
	.derive(({ headers: { authorization } }) => ({
		authorization
	}))
	.get('/', ({ authorization }) => authorization)
```

Any returned value will be available in context except status, which will be send to client directly, and abort the subsequent handlers.

Syntax for both [resolve](#/essential/handler.html#resolve), [derive](#/essential/handler.html#derive) is similar but they have different use cases.

Under the hood, both is a syntax sugar (with type safety) of a lifecycle:

- [derive](#/essential/handler.html#derive) is based on [transform](#/essential/life-cycle.html#transform)
- [resolve](#/essential/handler.html#resolve) is based on [before handle](#/essential/life-cycle.html#before-handle)

Since [derive](#/essential/handler.html#resolve) is based on [transform](#/essential/life-cycle.html#transform), which means that data isn't validated, and coerce/transform yet. It's better to use [resolve](#/essential/handler.html#resolve) if you need validated data.

## Scope [​](#scope)

[State](#/essential/handler.html#state), and [Decorate](#/essential/handler.html#decorate) are shared across all requests, and instances.
[Resolve](#/essential/handler.html#resolve), and [Derive](#/essential/handler.html#derive) are per request, and have an encapsulation scope (as they're based on life-cycle event).If you want to use a resolved/derived value from a plugin, you would have to declare a [Scope](#/essential/plugin.html#scope).

typescript```
import { Elysia } from 'elysia'

const plugin = new Elysia()
	.derive(
		{ as: 'scoped' },
		({ headers: { authorization } }) => ({
			authorization
		})
	)

new Elysia()
	.use(plugin)
	.get('/', ({ authorization }) => authorization)
	.listen(3000)
```

## Assignment [​](#assignment)

Let's try to extend Elysia's context.

Show answerWe can use [resolve](#/essential/handler.html#resolve) to extract age from query.

typescript```
import { Elysia, t } from 'elysia'

class Logger {
	log(info: string) {
		console.log(info)
	}
}

new Elysia()
	.decorate('logger', new Logger())
	.onRequest(({ request, logger }) => {
		logger.log(`Request to ${request.url}`)
	})
	.guard({
		query: t.Optional(
			t.Object({
				age: t.Number({ min: 15 })
			})
		)
	})
	.resolve(({ query: { age }, status }) => {
		if(!age) return status(401)

		return { age }
	})
	.get('/profile', ({ age }) => age)
	.listen(3000)
```
