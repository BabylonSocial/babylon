> ## Documentation Index
> Fetch the complete documentation index at: https://bun.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Build an app with Nuxt and Bun

Bun supports [Nuxt](https://nuxt.com) out of the box. Initialize a Nuxt app with official `nuxi` CLI.

```sh terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
bunx nuxi init my-nuxt-app
```

```txt  theme={"theme":{"light":"github-light","dark":"dracula"}}
✔ Which package manager would you like to use?
bun
◐ Installing dependencies...
bun install v1.3.3 (16b4bf34)
 + @nuxt/devtools@0.8.2
 + nuxt@3.7.0
 785 packages installed [2.67s]
✔ Installation completed.
✔ Types generated in .nuxt
✨ Nuxt project has been created with the v3 template. Next steps:
 › cd my-nuxt-app
 › Start development server with bun run dev
```

***

To start the dev server, run `bun --bun run dev` from the project root. This will execute the `nuxt dev` command (as defined in the `"dev"` script in `package.json`).

<Note>
  The `nuxt` CLI uses Node.js by default; passing the `--bun` flag forces the dev server to use the Bun runtime instead.
</Note>

```sh terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
cd my-nuxt-app
bun --bun run dev
```

```txt  theme={"theme":{"light":"github-light","dark":"dracula"}}
nuxt dev
Nuxi 3.6.5
Nuxt 3.6.5 with Nitro 2.5.2
  > Local:    http://localhost:3000/
  > Network:  http://192.168.0.21:3000/
  > Network:  http://[fd8a:d31d:481c:4883:1c64:3d90:9f83:d8a2]:3000/

✔ Nuxt DevTools is enabled v0.8.0 (experimental)
ℹ Vite client warmed up in 547ms
✔ Nitro built in 244 ms
```

***

Once the dev server spins up, open [http://localhost:3000](http://localhost:3000) to see the app. The app will render Nuxt's built-in `NuxtWelcome` template component.

To start developing your app, replace `<NuxtWelcome />` in `app.vue` with your own UI.

<Frame>
  ![Demo Nuxt app running on
  localhost](https://github.com/oven-sh/bun/assets/3084745/2c683ecc-3298-4bb0-b8c0-cf4cfaea1daa)
</Frame>

***

For production build, while the default preset is already compatible with Bun, you can also use [Bun preset](https://nitro.build/deploy/runtimes/bun) to generate better optimized builds.

```ts nuxt.config.ts icon="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/typescript.svg?fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=5d73d76daf7eb7b158469d8c30d349b0" theme={"theme":{"light":"github-light","dark":"dracula"}}
export default defineNuxtConfig({
  nitro: {
    preset: "bun", // [!code ++]
  },
});
```

Alternatively, you can set the preset via environment variable:

```sh terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
NITRO_PRESET=bun bun run build
```

<Note>
  Some packages provide Bun-specific exports that Nitro will not bundle correctly using the default preset. In this
  case, you need to use Bun preset so that the packages will work correctly in production builds.
</Note>

After building with bun, run:

```sh terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
bun run ./.output/server/index.mjs
```

***

Refer to the [Nuxt website](https://nuxt.com/docs) for complete documentation.
