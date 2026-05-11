Getting Started / IntroductionYour First RouteHandler and ContextStatus and HeadersValidationLifecycleGuardPluginEncapsulationCookieError HandlingValidation ErrorExtends ContextStandalone SchemaMacroOpenAPIMountUnit TestEnd-to-End Type SafetyWhat&#39;s Next?Documentation# Plugin [​](#plugin)

Every Elysia instance can be plug-and-play with other instances using the `use` method.

typescript```
import { Elysia } from 'elysia'

const user = new Elysia()
	.get('/profile', 'User Profile')
	.get('/settings', 'User Settings')

new Elysia()
	.use(user)
	.get('/', 'Home')
	.listen(3000)
```

Once applied, all routes from `user` instance will be available in `app` instance.

### Plugin Config [​](#plugin-config)

You can also create a plugin that takes an argument and returns an Elysia instance to make a more dynamic plugin.

typescript```
import { Elysia } from 'elysia'

const user = ({ log = false }) => new Elysia()
	.onBeforeHandle(({ request }) => {
		if (log) console.log(request)
	})
	.get('/profile', 'User Profile')
	.get('/settings', 'User Settings')

new Elysia()
	.use(user({ log: true }))
	.get('/', 'Home')
	.listen(3000)
```

It's also recommended that you read about [Key Concept: Dependency](/key-concept.html#dependency) to understand how Elysia handles dependencies between plugins.

## Assignment [​](#assignment)

Let's apply the `user` instance to the `app` instance.

Show answerSimilar to the above example, we can use the `use` method to plug the `user` instance into the `app` instance.

typescript```
import { Elysia } from 'elysia'

const user = new Elysia()
	.get('/profile', 'User Profile')
	.get('/settings', 'User Settings')

const app = new Elysia()
	.use(user)
	.get('/', 'Home')
	.listen(3000)
```
