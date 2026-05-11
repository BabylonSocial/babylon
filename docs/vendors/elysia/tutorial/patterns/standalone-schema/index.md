Patterns / IntroductionYour First RouteHandler and ContextStatus and HeadersValidationLifecycleGuardPluginEncapsulationCookieError HandlingValidation ErrorExtends ContextStandalone SchemaMacroOpenAPIMountUnit TestEnd-to-End Type SafetyWhat&#39;s Next?Documentation# Standalone Schema [​](#standalone-schema)

When we define a schema using [Guard](#/essential/validation.html#guard), the schema will be added to a route. But it will be overridden if the route provides a schema:

typescript```
import { Elysia, t } from 'elysia'

new Elysia()
	.guard({
		body: t.Object({
			age: t.Number()
		})
	})
	.post(
		'/user',
		({ body }) => body,
		{
			// This will override the guard schema
			body: t.Object({
				name: t.String()
			})
		}
	)
	.listen(3000)
```

If we want a schema to co-exist with route schema, we can define it as standalone schema:

typescript```
import { Elysia, t } from 'elysia'

new Elysia()
	.guard({
		schema: 'standalone',
		body: t.Object({
			age: t.Number()
		})
	})
	.post(
		'/user',
		// body will have both age and name property
		({ body }) => body,
		{
			body: t.Object({
				name: t.String()
			})
		}
	)
	.listen(3000)
```

## Schema Library Interoperability [​](#schema-library-interoperability)

Schemas between standalone schemas can be from different validation libraries.

For example you can define a standalone schema using zod, and a local schema using Elysia.t, and both will works interchangeably.

## Assignment [​](#assignment)

Let's make both `age` and `name` properties required in the request body by using standalone schema.

Show answerWe can define a standalone schema by adding `schema: 'standalone'` in the guard options.

typescript```
import { Elysia, t } from 'elysia'
import { z } from 'zod'

new Elysia()
	.guard({
		schema: 'standalone',
		body: z.object({
			age: z.number()
		})
	})
	.post(
		'/user',
		({ body }) => body,
		{
			body: t.Object({
				name: t.String()
			})
		}
	)
	.listen(3000)
```
