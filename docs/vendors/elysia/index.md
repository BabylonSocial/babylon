[Skip to content](#VPContent)Return to topAre you an LLM? View /llms.txt for optimized Markdown documentation, or /llms-full.txt for full documentation bundle- ## The first production ready, and most loved Bun framework ### Trusted by team at [](https://x.com/shlomiatar/status/1822381556142362734)[](https://github.com/elysiajs/elysia/discussions/1312#discussioncomment-13913513)[](https://x.com/alexvcasillas/status/1952653952501076142)[](https://github.com/elysiajs/elysia/discussions/1312#discussioncomment-13924470)[](https://github.com/elysiajs/elysia/discussions/1312#discussioncomment-13922081)[](https://github.com/elysiajs/elysia/discussions/1312#discussioncomment-13931725)[](https://github.com/elysiajs/elysia/discussions/1312#discussioncomment-14405781)typescript``` import { Elysia, file } from 'elysia'  new Elysia()  .get('/', 'Hello World')  .get('/image', file('mika.webp'))  .get('/stream', function* () {  yield 'Hello'  yield 'World'  })  .ws('/realtime', {  message(ws, message) {  ws.send('got:' + message)  }  })  .listen(3000) ```  Elysia  Bun2,454,631 reqs/s
-  Gin Go676,019
-  Spring Java506,087
-  Fastify Node415,600
-  Express Node113,117
-  Nest Node105,064
Measured in requests/second. Result from [TechEmpower Benchmark](https://www.techempower.com/benchmarks/#hw=ph&test=plaintext&section=data-r22) Round 22 (2023-10-17) in PlainText

typescript```
import { Elysia, t } from 'elysia'

new Elysia()
	.put('/', ({ body: { file } }) => file, {
		body: t.Object({
			file: t.File({ type: 'image' })
		})
	})
```

index.tsauth.tstypescript```
import { Elysia } from 'elysia'
import { auth } from './auth'

new Elysia()
	.use(auth)
	.get('/profile', ({ user }) => user, {
        auth: true
	})
```

typescript```
import { Elysia, t } from 'elysia'

export const auth = new Elysia()
	.macro('auth', {
		cookie: t.Object({
			ssid: t.String()
		}),
		resolve({ cookie, status }) {
			if(!cookie.ssid.value) return status(401)

			return {
				user: cookie.ssid.value
			}
		}
	})
```

typescript```
import { treaty } from '@elysiajs/eden'
import type { App } from 'server'

const api = treatyApp>('api.elysiajs.com')

const { data } = await api.profile.patch({
    age: 21
})
```

typescript```
import { Elysia } from 'elysia'
import { openapi } from '@elysiajs/openapi'

new Elysia()
	.use(openapi())
```

### Introducing our most powerful feature yet

## TypeScript to OpenAPI

Elysia can generate OpenAPI specifications directly from your TypeScript code without any annotations, without any configuration and CLI running.

Allowing you to turn your actual code from any library like Prisma, Drizzle and every TypeScript library into your own API documentation.

typescript```
import { Elysia } from 'elysia'
import { openapi, fromTypes } from '@elysiajs/openapi'

export const app = new Elysia()
	.use(
		openapi({
			// ↓ Where magic happens
			references: fromTypes()
		})
	)
```

TypeBoxZodValibotArkTypeEffectts```
import { Elysia, t } from 'elysia'

new Elysia()
	// Try hover body  ↓
	.post('/user', ({ body }) => body, {
		body: t.Object({
			name: t.Literal('SaltyAom'),
			age: t.Number(),
			friends: t.Array(t.String())
		})
	})
```

ts```
import { Elysia } from 'elysia'
import { z } from 'zod'

new Elysia()
	// Try hover body  ↓
	.post('/user', ({ body }) => body, {
		body: z.object({
			name: z.literal('SaltyAom'),
			age: z.number(),
			friends: z.array(z.string())
		})
	})
```

ts```
import { Elysia } from 'elysia'
import * as v from 'valibot'

new Elysia()
	// Try hover body  ↓
	.post('/user', ({ body }) => body, {
		body: v.object({
			name: v.literal('SaltyAom'),
			age: v.number(),
			friends: v.array(v.string())
		})
	})
```

ts```
import { Elysia } from 'elysia'
import { type } from 'arktype'

new Elysia()
	// Try hover body  ↓
	.post('/user', ({ body }) => body, {
		body: type({
			name: '"Elysia"',
			age: 'number',
			friends: 'string[]'
		})
	})
```

ts```
import { Elysia } from 'elysia'
import { Schema } from 'effect'

new Elysia()
	// Try hover body  ↓
	.post('/user', ({ body }) => body, {
		body: Schema.standardSchemaV1(
			Schema.Struct({
				name: Schema.Literal('Elysia'),
				age: Schema.Number,
				friends: Schema.Array(Schema.String)
			})
		)
	})
```

11.88ms

POST /character/:id/chat

Playback

RequestValidationTransactionUploadSynctypescript```
import { treaty } from '@elysiajs/eden'
import type { App } from 'server'

const api = treatyApp>('api.elysiajs.com')

const { data } = await api.profile.patch({
    age: 21
})
```

typescript```
import { treaty } from '@elysiajs/eden'
import { app } from './index'
import { test, expect } from 'bun:test'

const server = treaty(app)

test('should handle duplicated user', async () => {
	const { error } = await server.user.put({Argument of type '{ username: string; }' is not assignable to parameter of type '{ username: string; password: string; }'.
  Property 'password' is missing in type '{ username: string; }' but required in type '{ username: string; password: string; }'.	    username: 'mika',
	})

	expect(error?.value).toEqual({
		success: false,
		message: 'Username already taken'
	})
})
```

##  Your code,  Your Runtime

### Elysia is optimized for Bun,

### but  not vendor lock-in  to Bun

### Elysia is built on Web-Standard

### allowing you to run Elysia anywhere

## What people say about

 Elysia [Jetfuel on bun at X! @shlomiatar who built the framework has an eye for picking the right tools for the job.](https://x.com/AqueelMiq/status/1822380943279296832)[also a shoutout to @saltyAom and the phenomenal Elysia js that is powering our server driven UI. Incredible work.](https://x.com/shlomiatar/status/1822381556142362734)[htmx works great w/ @bunjavascript, @elysiaJS and @tursodatabase btw](https://x.com/htmx_org/status/1792949584769224897)[I’m a Node.js + Fastify diehard, but the Bun + Elysia combo looks very promising 👀](https://x.com/nuqs47ng/status/1991618158583771524)[Already using Elysia (+Bun) anywhere I can. Wouldn't want to back to node+express even if you'd pay me a mil.](https://x.com/Erwin_AI/status/1991740419110269107)[You can use Express with Bun, but often we see people using Elysia, Hono, or Bun.serve() directly.](https://x.com/jarredsumner/status/1781132294692233609)[Started using @elysiaJS to create a Discord Bot and found the type system beautifully easy. DX is fantastic and coding is fun! Use @DrizzleORM with PostgreSQL. So much easier than I've used before. ElysiaJS has proved to me that great performance and DX can live together. 😎](https://x.com/runyasak/status/1797618641648968117)[Was introduced to @elysiaJS today and it looks pretty solid. end-to-end type safety/guard/swapper are killer features of the modern web! (and it's fast)](https://x.com/hd_nvim/status/1735182378036027650)[so excited to be part of the amazing @elysiaJS community!](https://x.com/scalar/status/1744024831014920403)[handling tables with ~350k rows like it's nothing. Working on allowing @ag_grid server side row model when connecting a custom backend to @openbb_finance Terminal Pro. Backend in @elysiaJS + @bunjsproject.](https://x.com/josedonato__/status/1815706393367703890)[Elysia single handedly carrying js backends I have been using it almost exclusively for all my projects](https://x.com/Bewinxed/status/1896977430247833858)[I've been playing a bit with @bunjavascript and @elysiaJS, need to do a few more tweaks before the release, but next version should work more natively with bun when it comes to TS support detection, e.g. the CLI works without ts-node installed.](https://x.com/MikroORM/status/1821993062114967711)[both engineering+monetary contributions are paramount for OSS we proudly sponsor dozens of projects: @elysiaJS @LitestarAPI @honojs @daveshanley @kevin_jahns @MarijnJH & help maintain repos+contribute to OSS at blistering cadence. it's @scalar's ethos to be a catalyst for OSS](https://x.com/MarcLaventure/status/1773751085792174246)[I am building something with Bun + ElysiaJS and the speed and ergonomics are way out of this world!!!! I can't go back to express + node... Bun Hot reload an HTTP server and test runner is instantaneous!!! Elysia is a breath of fresh air + inferred types + openapi + plugins + file handling + ai sdk + typed client.... The dev experience is 100x - if you try you won't ever go back!!](https://x.com/meabed/status/1991531982933631247)[One diff ElysiaJS made in our org is that it makes it easy to refactor fearlessly. You can be pretty certain if things won't work simply because TypeScript will tell you that your types don't match](https://x.com/haxiom_io/status/1989357386398900670)[ElysiaJS was the first framework that truly sparked my interest in JS/TS. I used to avoid it entirely. I usually stick to Python, mostly using FastAPI. When I tried ElysiaJS for the first time (v1.1), I immediately felt it provides an amazing dev experience. Love ElysiaJS 😘](https://x.com/stacia__x/status/1990837540220465536)[I’m ngl we don’t talk about @elysiaJS enough](https://x.com/Rasmic/status/1964897923046703399)## Because of You

 Elysia is  not owned by an organization, driven by volunteers, and community.  Elysia is possible by these awesome sponsors.

- [Jarred Sumnerfor 2 years ](https://github.com/Jarred-Sumner)
- [San Francisco Compute Companyfor 2 years ](https://sfcompute.com?from=elysia)
- [CodeRabbitfor 7 months ](https://coderabbit.ai?from=elysia)
- [Better Authfor 6 months ](https://github.com/better-auth)
- [Comp AIfor 6 months ](https://github.com/trycompai)
- [Muxfor 2 months ](https://github.com/muxinc)
- [Zephyr Cloud IOfor a month ](https://github.com/ZephyrCloudIO)
- [Photonfor 11 days ](https://github.com/photon-hq)

- [Scalarfor 2 years ](https://github.com/scalar)

- [_typedev for 2 years](https://github.com/pauldvu)
- [DOM CHAROENYOS for 2 years](https://github.com/dome)
- [Naoki Takahashi for 2 years](https://github.com/Lazialize)
- [Khyber Sen for 2 years](https://github.com/kkysen)
- [MeCode for 2 years](https://github.com/mecode-asia)
- [yoyismee for 2 years](https://github.com/yoyoismee)
- [Vallaris Maps Platforms for a year](https://github.com/VallarisMapsPlatforms)
- [Firat Özcan for a year](https://github.com/firatoezcan)
- [TranspaClean for a year](https://github.com/TranspaClean)
- [Phoomparin Mano for 6 months](https://github.com/heypoom)
- [Pitsanu Kittipittayakorn for 6 months](https://github.com/ultimagz)
- [Alex Ozerov for 6 months](https://github.com/BOTKooper)
- [Siriwat K for 5 months](https://github.com/siriwatknp)
- [frankwang for 19 days](https://github.com/Frank-III)
- [ And you](https://github.com/sponsors/saltyaom)

- [](https://github.com/acoshift)
- [](https://github.com/iceman951)
- [](https://github.com/gabriel-peracio)
- [](https://github.com/kyung-min-sun)
- [](https://github.com/Scalahansolo)
- [](https://github.com/coreh)
- [](https://github.com/jvitormelo)
- [](https://github.com/ehudthelefthand)
- [](https://github.com/newnok6)
- [](https://github.com/braden-w)
- [](https://github.com/narze)
- [](https://github.com/jittat)
- [](https://github.com/Phonbopit)
- [](https://github.com/lomithrani)
- [](https://github.com/devstojko)
- [](https://github.com/fredericoo)
- [](https://github.com/ricardo-devis-agullo)
- [](https://github.com/4ndrs)
- [](https://github.com/drsmile1001)
- [](https://github.com/Yokk1e)
- [](https://github.com/bc-jasond)
- [](https://github.com/martiinii)
- [](https://github.com/TerranceN)
- [](https://github.com/codingthailand)
- [](https://github.com/sparanoid)
- [](https://github.com/jirapat-su)
- [](https://github.com/jk-gan)
- [](https://github.com/xeusteerapat)
- [](https://github.com/belizwp)
- [](https://github.com/CharlesSOo)
- [](https://github.com/aidansunbury)
- [](https://github.com/aidendotgg)
- [](https://github.com/frzi)
- [](https://github.com/dtinth)
- [](https://github.com/sansarun)
- [](https://github.com/DaxServer)
- [](https://github.com/leomotors)
- [](https://github.com/HelloYeew)
- [](https://github.com/heyfirst)
- [](https://github.com/marcellocurto)
- [](https://github.com/hassadee)
- [](https://github.com/Kuuuuuuuu)
- [](https://github.com/imkylecat)
- [](https://github.com/tonchanon)
- [](https://github.com/Basone01)
- [](https://github.com/nathanchapman)
- [](https://github.com/takzobye)
- [](https://github.com/nocommenz)
- [](https://github.com/YuzuZensai)
- [](https://github.com/hadth-rook)
- [](https://github.com/mikndotdev)
- [](https://github.com/florentdrousset)
- [](https://github.com/xibn)
- [](https://github.com/gjbianco)
- [](https://github.com/neahtSan)
- [](https://github.com/Tamicktom)
- [](https://github.com/boehs)
- [](https://github.com/sukinoverse)
- [](https://github.com/tawatchai-c)
- [](https://github.com/Black3800)
- [](https://github.com/spicyzboss)
- [](https://github.com/wteja)
- [](https://github.com/Th1nkK1D)
- [](https://github.com/zortos293)
- [](https://github.com/coopbri)
- [](https://github.com/dokugo)
- [](https://github.com/myke-awoniran)
- [](https://github.com/matoruru)
- [](https://github.com/kitravee)
- [](https://github.com/aka-nahal)

Thank you for making Elysia possible

We can only develop Elysia full-time thanks to your support.

[Become a sponsor ](https://github.com/sponsors/saltyaom) With love from our community

### Ask about Elysia

What makes Elysia differentWhy is Elysia fastElysia compare to HonoSetup OpenAPI with ElysiaDoes Elysia support OpenTelemetryCan I use Elysia with Node.jsElysia on Cloudflare Worker
