Getting Started / IntroductionYour First RouteHandler and ContextStatus and HeadersValidationLifecycleGuardPluginEncapsulationCookieError HandlingValidation ErrorExtends ContextStandalone SchemaMacroOpenAPIMountUnit TestEnd-to-End Type SafetyWhat&#39;s Next?Documentation# Encapsulation [​](#encapsulation)

Elysia hooks are encapsulated to its own instance only.

If you create a new instance, it will not share hooks with other instances.

ts```
import { Elysia } from 'elysia'

const profile = new Elysia()
	.onBeforeHandle(
		({ query: { name }, status }) => {
			if(!name)
				return status(401)
		}
	)
	.get('/profile', () => 'Hi!')

new Elysia()
	.use(profile)
	.patch('/rename', () => 'Ok! XD')
	.listen(3000)
```

localhost/profile/renameGET

Try changing the path in the URL bar to /rename and see the result

Elysia isolates lifecycle unless explicitly stated.

This is similar to export in JavaScript, where you need to export the function to make it available outside the module.

To "export" the lifecycle to other instances, you must specify the scope.

### Scope [​](#scope)

There are 3 scopes available:

- local (default) - apply to only current instance and descendant only
- scoped - apply to parent, current instance and descendants
- global - apply to all instance that apply the plugin (all parents, current, and descendants)
In our case, we want to apply the sign-in check to the `app` which is a direct parent, so we can use either scoped or global.

ts```
import { Elysia } from 'elysia'

const profile = new Elysia()
	.onBeforeHandle(
		{ as: 'scoped' },
		({ cookie }) => {
			throwIfNotSignIn(cookie)
		}
	)
	.get('/profile', () => 'Hi there!')

const app = new Elysia()
	.use(profile)
	// This has sign in check
	.patch('/rename', ({ body }) => updateProfile(body))
```

localhost/profile/renameGET

Casting lifecycle to "scoped" will export lifecycle to parent instance. While "global" will export lifecycle to all instances that has a plugin.

Learn more about this in [scope](#/essential/plugin.html#scope-level).

## Guard [​](#guard)

Similar to lifecycle, schema is also encapsulated to its own instance.

We can specify guard scope similar to lifecycle.

typescript```
import { Elysia } from 'elysia'

const user = new Elysia()
	.guard({
		as: 'scoped',
		query: t.Object({
			age: t.Number(),
			name: t.Optional(t.String())
		}),
		beforeHandle({ query: { age }, status }) {
			if(age  'Hi!')
	.get('/settings', () => 'Settings')
```

It's very important to note that every hook will affect all routes after its declaration.

See [Scope](#/essential/plugin.html#scope) for more information.

## Assignment [​](#assignment)

Let's define a scope for `nameCheck`, and `ageCheck` to make our app works.

Show answerWe can modify scope as follows:

- modify `nameCheck` scope to scoped
- modify `ageCheck` scope to global
typescript```
import { Elysia, t } from 'elysia'

const nameCheck = new Elysia()
	.onBeforeHandle(
		{ as: 'scoped' },
		({ query: { name }, status }) => {
			if(!name) return status(401)
		}
	)

const ageCheck = new Elysia()
	.guard({
		as: 'global',
		query: t.Object({
			age: t.Number(),
			name: t.Optional(t.String())
		}),
		beforeHandle({ query: { age }, status }) {
			if(age  'Ok! XD')

const profile = new Elysia()
	.use(ageCheck)
	.use(name)
	.get('/profile', () => 'Hi!')

new Elysia()
	.use(profile)
	.listen(3000)
```
