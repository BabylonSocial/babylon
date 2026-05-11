Patterns / IntroductionYour First RouteHandler and ContextStatus and HeadersValidationLifecycleGuardPluginEncapsulationCookieError HandlingValidation ErrorExtends ContextStandalone SchemaMacroOpenAPIMountUnit TestEnd-to-End Type SafetyWhat&#39;s Next?Documentation# Cookie [​](#cookie)

You interact with cookies by using [cookie](#/patterns/cookie) from context.

typescript```
import { Elysia } from 'elysia'

new Elysia()
	.get('/', ({ cookie: { visit } }) => {
		const total = +visit.value ?? 0
		visit.value++

		return `You have visited ${visit.value} times`
	})
	.listen(3000)
```

Cookie is a reactive object. Once modified, it will be reflected in response.

## Value [​](#value)

Elysia will then try to coerce it into its respective value when a type annotation if provided.

typescript```
import { Elysia } from 'elysia'

new Elysia()
	.get('/', ({ cookie: { visit } }) => {
		visit.value ??= 0
		visit.value.total++

		return `You have visited ${visit.value.total} times`
	}, {
		cookie: t.Object({
			visit: t.Optional(
				t.Object({
					total: t.Number()
				})
			)
		})
	})
	.listen(3000)
```

We can use [cookie schema](#/patterns/cookie.html#cookie-schema) to validate and parse cookie.

## Attribute [​](#attribute)

We can get/set cookie attribute by its respective property name.

Otherwise, use `.set()` to bulk set attribute.

typescript```
import { Elysia } from 'elysia'

new Elysia()
	.get('/', ({ cookie: { visit } }) => {
		visit.value ??= 0
		visit.value++

		visit.httpOnly = true
		visit.path = '/'

		visit.set({
			sameSite: 'lax',
			secure: true,
			maxAge: 60 * 60 * 24 * 7
		})

		return `You have visited ${visit.value} times`
	})
	.listen(3000)
```

See [Cookie Attribute](#/patterns/cookie.html#cookie-attribute).

## Remove [​](#remove)

We can remove cookie by calling `.remove()` method.

typescript```
import { Elysia } from 'elysia'

new Elysia()
	.get('/', ({ cookie: { visit } }) => {
		visit.remove()

		return `Cookie removed`
	})
	.listen(3000)
```

## Cookie Signature [​](#cookie-signature)

Elysia can sign cookies to prevent tampering by:

- Provide a cookie secret to the Elysia constructor.
- Use `t.Cookie` to provide secret for each cookie.
typescript```
import { Elysia } from 'elysia'

new Elysia({
	cookie: {
		secret: 'Fischl von Luftschloss Narfidort',
	}
})
	.get('/', ({ cookie: { visit } }) => {
		visit.value ??= 0
		visit.value++

		return `You have visited ${visit.value} times`
	}, {
		cookie: t.Cookie({
			visit: t.Optional(t.Number())
        }, {
            secrets: 'Fischl von Luftschloss Narfidort',
            sign: ['visit']
        })
	})
	.listen(3000)
```

If multiple secrets are provided, Elysia will use the first secret to sign cookies, and try to verify with the rest.

See [Cookie Signature](#/patterns/cookie.html#cookie-signature), [Cookie Rotation](#/patterns/cookie.html#cookie-rotation).

## Assignment [​](#assignment)

Let's create a simple counter that tracks how many times you have visited the site.

Show answer- We can update the cookie value by modifying `visit.value`.
- We can set HTTP only attribute by setting `visit.httpOnly = true`.
typescript```
import { Elysia, t } from 'elysia'

new Elysia()
	.get('/', ({ cookie: { visit } }) => {
		visit.value ??= 0
		visit.value++

		visit.httpOnly = true

		return `You have visited ${visit.value} times`
	}, {
		cookie: t.Object({
			visit: t.Optional(
				t.Number()
			)
		})
	})
	.listen(3000)
```
