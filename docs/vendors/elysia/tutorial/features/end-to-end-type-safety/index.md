Features / IntroductionYour First RouteHandler and ContextStatus and HeadersValidationLifecycleGuardPluginEncapsulationCookieError HandlingValidation ErrorExtends ContextStandalone SchemaMacroOpenAPIMountUnit TestEnd-to-End Type SafetyWhat&#39;s Next?Documentation# End-to-End Type Safety [​](#end-to-end-type-safety)

Elysia provides an end-to-end type safety between backend and frontend without code generation similar to tRPC, using [Eden](#/eden/overview).

typescript```
import { Elysia } from 'elysia'
import { treaty } from '@elysiajs/eden'

// Backend
export const app = new Elysia()
	.get('/', 'Hello Elysia!')
	.listen(3000)

// Frontend
const client = treaty('localhost:3000')

const { data, error } = await client.get()

console.log(data) // Hello World
```

This works by inferring the types from the Elysia instance, and uses type hints to provide type safety for the client.

See [Eden Treaty](#/eden/treaty/overview).

## Assignment [​](#assignment)

Let's click the  icon in the preview to see how's the request is logged.

Show answer
