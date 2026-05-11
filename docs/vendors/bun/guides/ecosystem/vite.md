> ## Documentation Index
> Fetch the complete documentation index at: https://bun.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Build a frontend using Vite and Bun

<Note>
  You can use Vite with Bun, but many projects get faster builds & drop hundreds of dependencies by switching to [HTML
  imports](/bundler/html-static).
</Note>

***

Vite works out of the box with Bun. Get started with one of Vite's templates.

```bash terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
bun create vite my-app
```

```txt  theme={"theme":{"light":"github-light","dark":"dracula"}}
✔ Select a framework: › React
✔ Select a variant: › TypeScript + SWC
Scaffolding project in /path/to/my-app...
```

***

Then `cd` into the project directory and install dependencies.

```bash terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
cd my-app
bun install
```

***

Start the development server with the `vite` CLI using `bunx`.

The `--bun` flag tells Bun to run Vite's CLI using `bun` instead of `node`; by default Bun respects Vite's `#!/usr/bin/env node` [shebang line](https://en.wikipedia.org/wiki/Shebang_\(Unix\)).

```bash terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
bunx --bun vite
```

***

To simplify this command, update the `"dev"` script in `package.json` to the following.

```json package.json icon="file-json" theme={"theme":{"light":"github-light","dark":"dracula"}}
  "scripts": {
    "dev": "vite", // [!code --]
    "dev": "bunx --bun vite", // [!code ++]
    "build": "vite build",
    "serve": "vite preview"
  },
  // ...
```

***

Now you can start the development server with `bun run dev`.

```bash terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
bun run dev
```

***

The following command will build your app for production.

```sh terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
bunx --bun vite build
```

***

This is a stripped down guide to get you started with Vite + Bun. For more information, see the [Vite documentation](https://vite.dev/guide/).
