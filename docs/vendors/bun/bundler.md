> ## Documentation Index
> Fetch the complete documentation index at: https://bun.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Bundler

> Bun's fast native bundler for JavaScript, TypeScript, JSX, and more

export const name_0 = undefined

Bun's fast native bundler can be used via the `bun build` CLI command or the `Bun.build()` JavaScript API.

### At a Glance

* JS API: `await Bun.build({ entrypoints, outdir })`
* CLI: `bun build <entry> --outdir ./out`
* Watch: `--watch` for incremental rebuilds
* Targets: `--target browser|bun|node`
* Formats: `--format esm|cjs|iife` (experimental for cjs/iife)

<Tabs>
  <Tab title="JavaScript">
    ```ts title="build.ts" icon="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/typescript.svg?fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=5d73d76daf7eb7b158469d8c30d349b0" theme={"theme":{"light":"github-light","dark":"dracula"}}
    await Bun.build({
      entrypoints: ['./index.tsx'],
      outdir: './build',
    });
    ```
  </Tab>

  <Tab title="CLI">
    ```bash terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
    bun build ./index.tsx --outdir ./build
    ```
  </Tab>
</Tabs>

It's fast. The numbers below represent performance on esbuild's [three.js benchmark](https://github.com/oven-sh/bun/tree/main/bench/bundle).

<Frame>
  <img src="https://mintcdn.com/bun-1dd33a4e/PY1574V41bdK8wNs/images/bundler-speed.png?fit=max&auto=format&n=PY1574V41bdK8wNs&q=85&s=0a549e542fceb7d51f84976fe1d151e4" caption="Bundling 10 copies of three.js from scratch, with sourcemaps and minification" data-og-width="2690" width="2690" data-og-height="1072" height="1072" data-path="images/bundler-speed.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/bun-1dd33a4e/PY1574V41bdK8wNs/images/bundler-speed.png?w=280&fit=max&auto=format&n=PY1574V41bdK8wNs&q=85&s=c92e84677eb9da86699582482f7d0752 280w, https://mintcdn.com/bun-1dd33a4e/PY1574V41bdK8wNs/images/bundler-speed.png?w=560&fit=max&auto=format&n=PY1574V41bdK8wNs&q=85&s=de00bc18218a9e7e4a710f88ab82d6f7 560w, https://mintcdn.com/bun-1dd33a4e/PY1574V41bdK8wNs/images/bundler-speed.png?w=840&fit=max&auto=format&n=PY1574V41bdK8wNs&q=85&s=07d97d8810d903fe052476caddbc2646 840w, https://mintcdn.com/bun-1dd33a4e/PY1574V41bdK8wNs/images/bundler-speed.png?w=1100&fit=max&auto=format&n=PY1574V41bdK8wNs&q=85&s=6ad21a681255af55a711bbceccfef746 1100w, https://mintcdn.com/bun-1dd33a4e/PY1574V41bdK8wNs/images/bundler-speed.png?w=1650&fit=max&auto=format&n=PY1574V41bdK8wNs&q=85&s=8decffe83aa2e455b19b1c389214994e 1650w, https://mintcdn.com/bun-1dd33a4e/PY1574V41bdK8wNs/images/bundler-speed.png?w=2500&fit=max&auto=format&n=PY1574V41bdK8wNs&q=85&s=5db3e9a0ef08d32d43b64d35c7626895 2500w" />
</Frame>

## Why bundle?

The bundler is a key piece of infrastructure in the JavaScript ecosystem. As a brief overview of why bundling is so important:

* **Reducing HTTP requests.** A single package in `node_modules` may consist of hundreds of files, and large applications may have dozens of such dependencies. Loading each of these files with a separate HTTP request becomes untenable very quickly, so bundlers are used to convert our application source code into a smaller number of self-contained "bundles" that can be loaded with a single request.
* **Code transforms.** Modern apps are commonly built with languages or tools like TypeScript, JSX, and CSS modules, all of which must be converted into plain JavaScript and CSS before they can be consumed by a browser. The bundler is the natural place to configure these transformations.
* **Framework features.** Frameworks rely on bundler plugins & code transformations to implement common patterns like file-system routing, client-server code co-location (think `getServerSideProps` or Remix loaders), and server components.
* **Full-stack Applications.** Bun's bundler can handle both server and client code in a single command, enabling optimized production builds and single-file executables. With build-time HTML imports, you can bundle your entire application — frontend assets and backend server — into a single deployable unit.

Let's jump into the bundler API.

<Note>The Bun bundler is not intended to replace `tsc` for typechecking or generating type declarations.</Note>

## Basic example

Let's build our first bundle. You have the following two files, which implement a simple client-side rendered React app.

<CodeGroup>
  ```tsx index.tsx icon="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/typescript.svg?fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=5d73d76daf7eb7b158469d8c30d349b0" theme={"theme":{"light":"github-light","dark":"dracula"}}
  import * as ReactDOM from "react-dom/client";
  import { Component } from "./Component";

  const root = ReactDOM.createRoot(document.getElementById("root")!);
  root.render(<Component message="Sup!" />);
  ```

  ```tsx Component.tsx icon="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/typescript.svg?fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=5d73d76daf7eb7b158469d8c30d349b0" theme={"theme":{"light":"github-light","dark":"dracula"}}
  export function Component(props: { message: string }) {
    return <h1>{props.message}</h1>;
  }
  ```
</CodeGroup>

Here, `index.tsx` is the "entrypoint" to our application. Commonly, this will be a script that performs some side effect, like starting a server or—in this case—initializing a React root. Because we're using TypeScript & JSX, we need to bundle our code before it can be sent to the browser.

To create our bundle:

<CodeGroup>
  ```ts build.ts icon="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/typescript.svg?fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=5d73d76daf7eb7b158469d8c30d349b0" theme={"theme":{"light":"github-light","dark":"dracula"}}
  await Bun.build({
    entrypoints: ["./index.tsx"],
    outdir: "./out",
  });
  ```

  ```bash terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
  bun build ./index.tsx --outdir ./out
  ```
</CodeGroup>

For each file specified in `entrypoints`, Bun will generate a new bundle. This bundle will be written to disk in the `./out` directory (as resolved from the current working directory). After running the build, the file system looks like this:

```text title="file system" icon="folder-tree" theme={"theme":{"light":"github-light","dark":"dracula"}}
.
├── index.tsx
├── Component.tsx
└── out
    └── index.js
```

The contents of `out/index.js` will look something like this:

```js title="out/index.js" icon="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/javascript.svg?fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=dd7b5268d2e9410910a69804de702737" theme={"theme":{"light":"github-light","dark":"dracula"}}
// out/index.js
// ...
// ~20k lines of code
// including the contents of `react-dom/client` and all its dependencies
// this is where the $jsxDEV and $createRoot functions are defined

// Component.tsx
function Component(props) {
  return $jsxDEV(
    "p",
    {
      children: props.message,
    },
    undefined,
    false,
    undefined,
    this,
  );
}

// index.tsx
var rootNode = document.getElementById("root");
var root = $createRoot(rootNode);
root.render(
  $jsxDEV(
    Component,
    {
      message: "Sup!",
    },
    undefined,
    false,
    undefined,
    this,
  ),
);
```

## Watch mode

Like the runtime and test runner, the bundler supports watch mode natively.

```bash terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
bun build ./index.tsx --outdir ./out --watch
```

## Content types

Like the Bun runtime, the bundler supports an array of file types out of the box. The following table breaks down the bundler's set of standard "loaders". Refer to [Bundler > File types](/bundler/loaders) for full documentation.

| Extensions                                            | Details                                                                                                                                                                                                                                                                                                                                                      |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `.js` `.jsx` `.cjs` `.mjs` `.mts` `.cts` `.ts` `.tsx` | Uses Bun's built-in transpiler to parse the file and transpile TypeScript/JSX syntax to vanilla JavaScript. The bundler executes a set of default transforms including dead code elimination and tree shaking. At the moment Bun does not attempt to down-convert syntax; if you use recently ECMAScript syntax, that will be reflected in the bundled code. |
| `.json`                                               | JSON files are parsed and inlined into the bundle as a JavaScript object.<br /><br />`js<br/>import pkg from "./package.json";<br/>pkg.name; // => "my-package"<br/>`                                                                                                                                                                                        |
| `.jsonc`                                              | JSON with comments. Files are parsed and inlined into the bundle as a JavaScript object.<br /><br />`js<br/>import config from "./config.jsonc";<br/>config.name; // => "my-config"<br/>`                                                                                                                                                                    |
| `.toml`                                               | TOML files are parsed and inlined into the bundle as a JavaScript object.<br /><br />`js<br/>import config from "./bunfig.toml";<br/>config.logLevel; // => "debug"<br/>`                                                                                                                                                                                    |
| `.yaml` `.yml`                                        | YAML files are parsed and inlined into the bundle as a JavaScript object.<br /><br />`js<br/>import config from "./config.yaml";<br/>config.name; // => "my-app"<br/>`                                                                                                                                                                                       |
| `.txt`                                                | The contents of the text file are read and inlined into the bundle as a string.<br /><br />`js<br/>import contents from "./file.txt";<br/>console.log(contents); // => "Hello, world!"<br/>`                                                                                                                                                                 |
| `.html`                                               | HTML files are processed and any referenced assets (scripts, stylesheets, images) are bundled.                                                                                                                                                                                                                                                               |
| `.css`                                                | CSS files are bundled together into a single `.css` file in the output directory.                                                                                                                                                                                                                                                                            |
| `.node` `.wasm`                                       | These files are supported by the Bun runtime, but during bundling they are treated as assets.                                                                                                                                                                                                                                                                |

### Assets

If the bundler encounters an import with an unrecognized extension, it treats the imported file as an external file. The referenced file is copied as-is into `outdir`, and the import is resolved as a path to the file.

<CodeGroup>
  ```ts Input icon="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/typescript.svg?fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=5d73d76daf7eb7b158469d8c30d349b0" theme={"theme":{"light":"github-light","dark":"dracula"}}
  // bundle entrypoint
  import logo from "./logo.svg";
  console.log(logo);
  ```

  ```ts Output icon="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/javascript.svg?fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=dd7b5268d2e9410910a69804de702737" theme={"theme":{"light":"github-light","dark":"dracula"}}
  // bundled output
  var logo = "./logo-a7305bdef.svg";
  console.log(logo);
  ```
</CodeGroup>

The exact behavior of the file loader is also impacted by [`naming`](#naming) and [`publicPath`](#publicpath).

<Info>Refer to the [Bundler > Loaders](/bundler/loaders) page for more complete documentation on the file loader.</Info>

### Plugins

The behavior described in this table can be overridden or extended with plugins. Refer to the [Bundler > Loaders](/bundler/loaders) page for complete documentation.

## API

### entrypoints

<Badge>Required</Badge>

An array of paths corresponding to the entrypoints of our application. One bundle will be generated for each entrypoint.

<Tabs>
  <Tab title="JavaScript">
    ```ts title="build.ts" icon="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/typescript.svg?fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=5d73d76daf7eb7b158469d8c30d349b0" theme={"theme":{"light":"github-light","dark":"dracula"}}
    const result = await Bun.build({
      entrypoints: ["./index.ts"],
    });
    // => { success: boolean, outputs: BuildArtifact[], logs: BuildMessage[] }
    ```
  </Tab>

  <Tab title="CLI">
    ```bash terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
    bun build ./index.ts
    ```
  </Tab>
</Tabs>

### files

A map of file paths to their contents for in-memory bundling. This allows you to bundle virtual files that don't exist on disk, or override the contents of files that do exist. This option is only available in the JavaScript API.

File contents can be provided as a `string`, `Blob`, `TypedArray`, or `ArrayBuffer`.

#### Bundle entirely from memory

You can bundle code without any files on disk by providing all sources via `files`:

```ts title="build.ts" icon="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/typescript.svg?fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=5d73d76daf7eb7b158469d8c30d349b0" theme={"theme":{"light":"github-light","dark":"dracula"}}
const result = await Bun.build({
  entrypoints: ["/app/index.ts"],
  files: {
    "/app/index.ts": `
      import { greet } from "./greet.ts";
      console.log(greet("World"));
    `,
    "/app/greet.ts": `
      export function greet(name: string) {
        return "Hello, " + name + "!";
      }
    `,
  },
});

const output = await result.outputs[0].text();
console.log(output);
```

When all entrypoints are in the `files` map, the current working directory is used as the root.

#### Override files on disk

In-memory files take priority over files on disk. This lets you override specific files while keeping the rest of your codebase unchanged:

```ts title="build.ts" icon="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/typescript.svg?fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=5d73d76daf7eb7b158469d8c30d349b0" theme={"theme":{"light":"github-light","dark":"dracula"}}
// Assume ./src/config.ts exists on disk with development settings
await Bun.build({
  entrypoints: ["./src/index.ts"],
  files: {
    // Override config.ts with production values
    "./src/config.ts": `
      export const API_URL = "https://api.production.com";
      export const DEBUG = false;
    `,
  },
  outdir: "./dist",
});
```

#### Mix disk and virtual files

Real files on disk can import virtual files, and virtual files can import real files:

```ts title="build.ts" icon="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/typescript.svg?fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=5d73d76daf7eb7b158469d8c30d349b0" theme={"theme":{"light":"github-light","dark":"dracula"}}
// ./src/index.ts exists on disk and imports "./generated.ts"
await Bun.build({
  entrypoints: ["./src/index.ts"],
  files: {
    // Provide a virtual file that index.ts imports
    "./src/generated.ts": `
      export const BUILD_ID = "${crypto.randomUUID()}";
      export const BUILD_TIME = ${Date.now()};
    `,
  },
  outdir: "./dist",
});
```

This is useful for code generation, injecting build-time constants, or testing with mock modules.

### outdir

The directory where output files will be written.

<Tabs>
  <Tab title="JavaScript">
    ```ts title="build.ts" icon="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/typescript.svg?fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=5d73d76daf7eb7b158469d8c30d349b0" theme={"theme":{"light":"github-light","dark":"dracula"}}
    const result = await Bun.build({
      entrypoints: ['./index.ts'],
      outdir: './out'
    });
    // => { success: boolean, outputs: BuildArtifact[], logs: BuildMessage[] }
    ```
  </Tab>

  <Tab title="CLI">
    ```bash terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
    bun build ./index.ts --outdir ./out
    ```
  </Tab>
</Tabs>

If `outdir` is not passed to the JavaScript API, bundled code will not be written to disk. Bundled files are returned in an array of `BuildArtifact` objects. These objects are Blobs with extra properties; see [Outputs](#outputs) for complete documentation.

```ts title="build.ts" icon="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/typescript.svg?fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=5d73d76daf7eb7b158469d8c30d349b0" theme={"theme":{"light":"github-light","dark":"dracula"}}
const result = await Bun.build({
  entrypoints: ["./index.ts"],
});

for (const res of result.outputs) {
  // Can be consumed as blobs
  await res.text();

  // Bun will set Content-Type and Etag headers
  new Response(res);

  // Can be written manually, but you should use `outdir` in this case.
  Bun.write(path.join("out", res.path), res);
}
```

When `outdir` is set, the `path` property on a `BuildArtifact` will be the absolute path to where it was written to.

### target

The intended execution environment for the bundle.

<Tabs>
  <Tab title="JavaScript">
    ```ts title="build.ts" icon="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/typescript.svg?fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=5d73d76daf7eb7b158469d8c30d349b0" theme={"theme":{"light":"github-light","dark":"dracula"}}
    await Bun.build({
      entrypoints: ['./index.ts'],
      outdir: './out',
      target: 'browser', // default
    })
    ```
  </Tab>

  <Tab title="CLI">
    ```bash terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
    bun build ./index.ts --outdir ./out --target browser
    ```
  </Tab>
</Tabs>

Depending on the target, Bun will apply different module resolution rules and optimizations.

<Card title="browser" icon="globe">
  **Default.** For generating bundles that are intended for execution by a browser. Prioritizes the `"browser"` export
  condition when resolving imports. Importing any built-in modules, like `node:events` or `node:path` will work, but
  calling some functions, like `fs.readFile` will not work.
</Card>

<Card title="bun" icon="server">
  For generating bundles that are intended to be run by the Bun runtime. In many cases, it isn't necessary to bundle server-side code; you can directly execute the source code without modification. However, bundling your server code can reduce startup times and improve running performance. This is the target to use for building full-stack applications with build-time HTML imports, where both server and client code are bundled together.

  All bundles generated with `target: "bun"` are marked with a special `// @bun` pragma, which indicates to the Bun runtime that there's no need to re-transpile the file before execution.

  If any entrypoints contains a Bun shebang (`#!/usr/bin/env bun`) the bundler will default to `target: "bun"` instead of `"browser"`.

  When using `target: "bun"` and `format: "cjs"` together, the `// @bun @bun-cjs` pragma is added and the CommonJS wrapper function is not compatible with Node.js.
</Card>

<Card title="node" icon="node">
  For generating bundles that are intended to be run by Node.js. Prioritizes the `"node"` export condition when
  resolving imports, and outputs `.mjs`. In the future, this will automatically polyfill the Bun global and other
  built-in `bun:*` modules, though this is not yet implemented.
</Card>

### format

Specifies the module format to be used in the generated bundles.

Bun defaults to `"esm"`, and provides experimental support for `"cjs"` and `"iife"`.

#### format: "esm" - ES Module

This is the default format, which supports ES Module syntax including top-level await, `import.meta`, and more.

<Tabs>
  <Tab title="JavaScript">
    ```ts title="build.ts" icon="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/typescript.svg?fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=5d73d76daf7eb7b158469d8c30d349b0" theme={"theme":{"light":"github-light","dark":"dracula"}}
    await Bun.build({
      entrypoints: ['./index.tsx'],
      outdir: './out',
      format: "esm",
    })
    ```
  </Tab>

  <Tab title="CLI">
    ```bash terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
    bun build ./index.tsx --outdir ./out --format esm
    ```
  </Tab>
</Tabs>

To use ES Module syntax in browsers, set `format` to `"esm"` and make sure your `<script type="module">` tag has `type="module"` set.

#### format: "cjs" - CommonJS

To build a CommonJS module, set `format` to `"cjs"`. When choosing `"cjs"`, the default target changes from `"browser"` (esm) to `"node"` (cjs). CommonJS modules transpiled with `format: "cjs"`, `target: "node"` can be executed in both Bun and Node.js (assuming the APIs in use are supported by both).

<Tabs>
  <Tab title="JavaScript">
    ```ts title="build.ts" icon="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/typescript.svg?fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=5d73d76daf7eb7b158469d8c30d349b0" theme={"theme":{"light":"github-light","dark":"dracula"}}
    await Bun.build({
      entrypoints: ['./index.tsx'],
      outdir: './out',
      format: "cjs",
    })
    ```
  </Tab>

  <Tab title="CLI">
    ```bash terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
    bun build ./index.tsx --outdir ./out --format cjs
    ```
  </Tab>
</Tabs>

#### format: "iife" - IIFE

TODO: document IIFE once we support globalNames.

### `jsx`

Configure JSX transform behavior. Allows fine-grained control over how JSX is compiled.

**Classic runtime example** (uses `factory` and `fragment`):

<CodeGroup>
  ```ts index.ts icon="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/typescript.svg?fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=5d73d76daf7eb7b158469d8c30d349b0" theme={"theme":{"light":"github-light","dark":"dracula"}}
  await Bun.build({
    entrypoints: ["./app.tsx"],
    outdir: "./out",
    jsx: {
      factory: "h",
      fragment: "Fragment",
      runtime: "classic",
    },
  });
  ```

  ```bash terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
  # JSX configuration is handled via bunfig.toml or tsconfig.json
  bun build ./app.tsx --outdir ./out
  ```
</CodeGroup>

**Automatic runtime example** (uses `importSource`):

<CodeGroup>
  ```ts index.ts icon="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/typescript.svg?fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=5d73d76daf7eb7b158469d8c30d349b0" theme={"theme":{"light":"github-light","dark":"dracula"}}
  await Bun.build({
    entrypoints: ["./app.tsx"],
    outdir: "./out",
    jsx: {
      importSource: "preact",
      runtime: "automatic",
    },
  });
  ```

  ```bash terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
  # JSX configuration is handled via bunfig.toml or tsconfig.json
  bun build ./app.tsx --outdir ./out
  ```
</CodeGroup>

### splitting

Whether to enable code splitting.

<Tabs>
  <Tab title="JavaScript">
    ```ts title="build.ts" icon="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/typescript.svg?fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=5d73d76daf7eb7b158469d8c30d349b0" theme={"theme":{"light":"github-light","dark":"dracula"}}
    await Bun.build({
      entrypoints: ['./index.tsx'],
      outdir: './out',
      splitting: false, // default
    })
    ```
  </Tab>

  <Tab title="CLI">
    ```bash terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
    bun build ./index.tsx --outdir ./out --splitting
    ```
  </Tab>
</Tabs>

When `true`, the bundler will enable code splitting. When multiple entrypoints both import the same file, module, or set of files/modules, it's often useful to split the shared code into a separate bundle. This shared bundle is known as a chunk. Consider the following files:

<CodeGroup>
  ```ts entry-a.ts icon="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/typescript.svg?fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=5d73d76daf7eb7b158469d8c30d349b0" theme={"theme":{"light":"github-light","dark":"dracula"}}
  import { shared } from "./shared.ts";
  ```

  ```ts entry-b.ts icon="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/typescript.svg?fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=5d73d76daf7eb7b158469d8c30d349b0" theme={"theme":{"light":"github-light","dark":"dracula"}}
  import { shared } from "./shared.ts";
  ```

  ```ts shared.ts icon="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/typescript.svg?fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=5d73d76daf7eb7b158469d8c30d349b0" theme={"theme":{"light":"github-light","dark":"dracula"}}
  export const shared = "shared";
  ```
</CodeGroup>

To bundle `entry-a.ts` and `entry-b.ts` with code-splitting enabled:

<Tabs>
  <Tab title="JavaScript">
    ```ts title="build.ts" icon="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/typescript.svg?fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=5d73d76daf7eb7b158469d8c30d349b0" theme={"theme":{"light":"github-light","dark":"dracula"}}
    await Bun.build({
      entrypoints: ['./entry-a.ts', './entry-b.ts'],
      outdir: './out',
      splitting: true,
    })
    ```
  </Tab>

  <Tab title="CLI">
    ```bash terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
    bun build ./entry-a.ts ./entry-b.ts --outdir ./out --splitting
    ```
  </Tab>
</Tabs>

Running this build will result in the following files:

```text title="file system" icon="folder-tree" theme={"theme":{"light":"github-light","dark":"dracula"}}
.
├── entry-a.tsx
├── entry-b.tsx
├── shared.tsx
└── out
    ├── entry-a.js
    ├── entry-b.js
    └── chunk-2fce6291bf86559d.js
```

The generated `chunk-2fce6291bf86559d.js` file contains the shared code. To avoid collisions, the file name automatically includes a content hash by default. This can be customized with [`naming`](#naming).

### plugins

A list of plugins to use during bundling.

```ts title="build.ts" icon="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/typescript.svg?fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=5d73d76daf7eb7b158469d8c30d349b0" theme={"theme":{"light":"github-light","dark":"dracula"}}
await Bun.build({
  entrypoints: ["./index.tsx"],
  outdir: "./out",
  plugins: [
    /* ... */
  ],
});
```

Bun implements a universal plugin system for both Bun's runtime and bundler. Refer to the [plugin documentation](/bundler/plugins) for complete documentation.

### env

Controls how environment variables are handled during bundling. Internally, this uses `define` to inject environment variables into the bundle, but makes it easier to specify the environment variables to inject.

#### env: "inline"

Injects environment variables into the bundled output by converting `process.env.FOO` references to string literals containing the actual environment variable values.

<Tabs>
  <Tab title="JavaScript">
    ```ts title="build.ts" icon="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/typescript.svg?fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=5d73d76daf7eb7b158469d8c30d349b0" theme={"theme":{"light":"github-light","dark":"dracula"}}
    await Bun.build({
      entrypoints: ['./index.tsx'],
      outdir: './out',
      env: "inline",
    })
    ```
  </Tab>

  <Tab title="CLI">
    ```bash terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
    bun build ./index.tsx --outdir ./out --env inline
    ```
  </Tab>
</Tabs>

For the input below:

```js title="input.js" icon="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/javascript.svg?fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=dd7b5268d2e9410910a69804de702737" theme={"theme":{"light":"github-light","dark":"dracula"}}
// input.js
console.log(process.env.FOO);
console.log(process.env.BAZ);
```

The generated bundle will contain the following code:

```js title="output.js" icon="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/javascript.svg?fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=dd7b5268d2e9410910a69804de702737" theme={"theme":{"light":"github-light","dark":"dracula"}}
// output.js
console.log("bar");
console.log("123");
```

#### env: "PUBLIC\_\*" (prefix)

Inlines environment variables matching the given prefix (the part before the `*` character), replacing `process.env.FOO` with the actual environment variable value. This is useful for selectively inlining environment variables for things like public-facing URLs or client-side tokens, without worrying about injecting private credentials into output bundles.

<Tabs>
  <Tab title="JavaScript">
    ```ts title="build.ts" icon="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/typescript.svg?fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=5d73d76daf7eb7b158469d8c30d349b0" theme={"theme":{"light":"github-light","dark":"dracula"}}
    await Bun.build({
      entrypoints: ['./index.tsx'],
      outdir: './out',
      
      // Inline all env vars that start with "ACME_PUBLIC_"
      env: "ACME_PUBLIC_*",
    })
    ```
  </Tab>

  <Tab title="CLI">
    ```bash terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
    bun build ./index.tsx --outdir ./out --env ACME_PUBLIC_*
    ```
  </Tab>
</Tabs>

For example, given the following environment variables:

```bash terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
FOO=bar BAZ=123 ACME_PUBLIC_URL=https://acme.com
```

And source code:

```tsx index.tsx icon="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/typescript.svg?fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=5d73d76daf7eb7b158469d8c30d349b0" theme={"theme":{"light":"github-light","dark":"dracula"}}
console.log(process.env.FOO);
console.log(process.env.ACME_PUBLIC_URL);
console.log(process.env.BAZ);
```

The generated bundle will contain the following code:

```js title="output.js" icon="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/javascript.svg?fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=dd7b5268d2e9410910a69804de702737" theme={"theme":{"light":"github-light","dark":"dracula"}}
console.log(process.env.FOO);
console.log("https://acme.com");
console.log(process.env.BAZ);
```

#### env: "disable"

Disables environment variable injection entirely.

### sourcemap

Specifies the type of sourcemap to generate.

<Tabs>
  <Tab title="JavaScript">
    ```ts title="build.ts" icon="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/typescript.svg?fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=5d73d76daf7eb7b158469d8c30d349b0" theme={"theme":{"light":"github-light","dark":"dracula"}}
    await Bun.build({
      entrypoints: ['./index.tsx'],
      outdir: './out',
      sourcemap: 'linked', // default 'none'
    })
    ```
  </Tab>

  <Tab title="CLI">
    ```bash terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
    bun build ./index.tsx --outdir ./out --sourcemap linked
    ```
  </Tab>
</Tabs>

| Value        | Description                                                                                                                                                                                                                                                                                                                                                                                         |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `"none"`     | Default. No sourcemap is generated.                                                                                                                                                                                                                                                                                                                                                                 |
| `"linked"`   | A separate `*.js.map` file is created alongside each `*.js` bundle using a `//# sourceMappingURL` comment to link the two. Requires `--outdir` to be set. The base URL of this can be customized with `--public-path`.<br /><br />`js<br/>// <bundled code here><br/><br/>//# sourceMappingURL=bundle.js.map<br/>`                                                                                  |
| `"external"` | A separate `*.js.map` file is created alongside each `*.js` bundle without inserting a `//# sourceMappingURL` comment.<br /><br />Generated bundles contain a debug id that can be used to associate a bundle with its corresponding sourcemap. This `debugId` is added as a comment at the bottom of the file.<br /><br />`js<br/>// <generated bundle code><br/><br/>//# debugId=<DEBUG ID><br/>` |
| `"inline"`   | A sourcemap is generated and appended to the end of the generated bundle as a base64 payload.<br /><br />`js<br/>// <bundled code here><br/><br/>//# sourceMappingURL=data:application/json;base64,<encoded sourcemap here><br/>`                                                                                                                                                                   |

The associated `*.js.map` sourcemap will be a JSON file containing an equivalent `debugId` property.

### minify

Whether to enable minification. Default `false`.

<Note>When targeting `bun`, identifiers will be minified by default.</Note>

To enable all minification options:

<Tabs>
  <Tab title="JavaScript">
    ```ts title="build.ts" icon="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/typescript.svg?fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=5d73d76daf7eb7b158469d8c30d349b0" theme={"theme":{"light":"github-light","dark":"dracula"}}
    await Bun.build({
      entrypoints: ['./index.tsx'],
      outdir: './out',
      minify: true, // default false
    })
    ```
  </Tab>

  <Tab title="CLI">
    ```bash terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
    bun build ./index.tsx --outdir ./out --minify
    ```
  </Tab>
</Tabs>

To granularly enable certain minifications:

<Tabs>
  <Tab title="JavaScript">
    ```ts title="build.ts" icon="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/typescript.svg?fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=5d73d76daf7eb7b158469d8c30d349b0" theme={"theme":{"light":"github-light","dark":"dracula"}}
    await Bun.build({
      entrypoints: ['./index.tsx'],
      outdir: './out',
      minify: {
        whitespace: true,
        identifiers: true,
        syntax: true,
      },
    })
    ```
  </Tab>

  <Tab title="CLI">
    ```bash terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
    bun build ./index.tsx --outdir ./out --minify-whitespace --minify-identifiers --minify-syntax
    ```
  </Tab>
</Tabs>

### external

A list of import paths to consider external. Defaults to `[]`.

<Tabs>
  <Tab title="JavaScript">
    ```ts title="build.ts" icon="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/typescript.svg?fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=5d73d76daf7eb7b158469d8c30d349b0" theme={"theme":{"light":"github-light","dark":"dracula"}}
    await Bun.build({
      entrypoints: ['./index.tsx'],
      outdir: './out',
      external: ["lodash", "react"], // default: []
    })
    ```
  </Tab>

  <Tab title="CLI">
    ```bash terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
    bun build ./index.tsx --outdir ./out --external lodash --external react
    ```
  </Tab>
</Tabs>

An external import is one that will not be included in the final bundle. Instead, the import statement will be left as-is, to be resolved at runtime.

For instance, consider the following entrypoint file:

```tsx index.tsx icon="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/typescript.svg?fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=5d73d76daf7eb7b158469d8c30d349b0" theme={"theme":{"light":"github-light","dark":"dracula"}}
import _ from "lodash";
import { z } from "zod";

const value = z.string().parse("Hello world!");
console.log(_.upperCase(value));
```

Normally, bundling `index.tsx` would generate a bundle containing the entire source code of the "zod" package. If instead, we want to leave the import statement as-is, we can mark it as external:

<Tabs>
  <Tab title="JavaScript">
    ```ts title="build.ts" icon="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/typescript.svg?fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=5d73d76daf7eb7b158469d8c30d349b0" theme={"theme":{"light":"github-light","dark":"dracula"}}
    await Bun.build({
      entrypoints: ['./index.tsx'],
      outdir: './out',
      external: ['zod'],
    })
    ```
  </Tab>

  <Tab title="CLI">
    ```bash terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
    bun build ./index.tsx --outdir ./out --external zod
    ```
  </Tab>
</Tabs>

The generated bundle will look something like this:

```js title="out/index.js" icon="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/javascript.svg?fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=dd7b5268d2e9410910a69804de702737" theme={"theme":{"light":"github-light","dark":"dracula"}}
import { z } from "zod";

// ...
// the contents of the "lodash" package
// including the `_.upperCase` function

var value = z.string().parse("Hello world!");
console.log(_.upperCase(value));
```

To mark all imports as external, use the wildcard `*`:

<Tabs>
  <Tab title="JavaScript">
    ```ts title="build.ts" icon="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/typescript.svg?fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=5d73d76daf7eb7b158469d8c30d349b0" theme={"theme":{"light":"github-light","dark":"dracula"}}
    await Bun.build({
      entrypoints: ['./index.tsx'],
      outdir: './out',
      external: ['*'],
    })
    ```
  </Tab>

  <Tab title="CLI">
    ```bash terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
    bun build ./index.tsx --outdir ./out --external '*'
    ```
  </Tab>
</Tabs>

### packages

Control whether package dependencies are included to bundle or not. Possible values: `bundle` (default), `external`. Bun treats any import which path do not start with `.`, `..` or `/` as package.

<Tabs>
  <Tab title="JavaScript">
    ```ts title="build.ts" icon="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/typescript.svg?fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=5d73d76daf7eb7b158469d8c30d349b0" theme={"theme":{"light":"github-light","dark":"dracula"}}
    await Bun.build({
      entrypoints: ['./index.ts'],
      packages: 'external',
    })
    ```
  </Tab>

  <Tab title="CLI">
    ```bash terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
    bun build ./index.ts --packages external
    ```
  </Tab>
</Tabs>

### naming

Customizes the generated file names. Defaults to `./[dir]/[name].[ext]`.

<Tabs>
  <Tab title="JavaScript">
    ```ts title="build.ts" icon="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/typescript.svg?fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=5d73d76daf7eb7b158469d8c30d349b0" theme={"theme":{"light":"github-light","dark":"dracula"}}
    await Bun.build({
      entrypoints: ['./index.tsx'],
      outdir: './out',
      naming: "[dir]/[name].[ext]", // default
    })
    ```
  </Tab>

  <Tab title="CLI">
    ```bash terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
    bun build ./index.tsx --outdir ./out --entry-naming "[dir]/[name].[ext]"
    ```
  </Tab>
</Tabs>

By default, the names of the generated bundles are based on the name of the associated entrypoint.

```text title="file system" icon="folder-tree" theme={"theme":{"light":"github-light","dark":"dracula"}}
.
├── index.tsx
└── out
    └── index.js
```

With multiple entrypoints, the generated file hierarchy will reflect the directory structure of the entrypoints.

```text title="file system" icon="folder-tree" theme={"theme":{"light":"github-light","dark":"dracula"}}
.
├── index.tsx
└── nested
    └── index.tsx
└── out
    ├── index.js
    └── nested
        └── index.js
```

The names and locations of the generated files can be customized with the `naming` field. This field accepts a template string that is used to generate the filenames for all bundles corresponding to entrypoints. where the following tokens are replaced with their corresponding values:

* `[name]` - The name of the entrypoint file, without the extension.
* `[ext]` - The extension of the generated bundle.
* `[hash]` - A hash of the bundle contents.
* `[dir]` - The relative path from the project root to the parent directory of the source file.

For example:

| Token               | `[name]` | `[ext]` | `[hash]`   | `[dir]`             |
| ------------------- | -------- | ------- | ---------- | ------------------- |
| `./index.tsx`       | `index`  | `js`    | `a1b2c3d4` | `""` (empty string) |
| `./nested/entry.ts` | `entry`  | `js`    | `c3d4e5f6` | `"nested"`          |

We can combine these tokens to create a template string. For instance, to include the hash in the generated bundle names:

<Tabs>
  <Tab title="JavaScript">
    ```ts title="build.ts" icon="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/typescript.svg?fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=5d73d76daf7eb7b158469d8c30d349b0" theme={"theme":{"light":"github-light","dark":"dracula"}}
    await Bun.build({
      entrypoints: ['./index.tsx'],
      outdir: './out',
      naming: 'files/[dir]/[name]-[hash].[ext]',
    })
    ```
  </Tab>

  <Tab title="CLI">
    ```bash terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
    bun build ./index.tsx --outdir ./out --entry-naming 'files/[dir]/[name]-[hash].[ext]'
    ```
  </Tab>
</Tabs>

This build would result in the following file structure:

```text title="file system" icon="folder-tree" theme={"theme":{"light":"github-light","dark":"dracula"}}
.
├── index.tsx
└── out
    └── files
        └── index-a1b2c3d4.js
```

When a string is provided for the `naming` field, it is used only for bundles that correspond to entrypoints. The names of chunks and copied assets are not affected. Using the JavaScript API, separate template strings can be specified for each type of generated file.

<Tabs>
  <Tab title="JavaScript">
    ```ts title="build.ts" icon="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/typescript.svg?fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=5d73d76daf7eb7b158469d8c30d349b0" theme={"theme":{"light":"github-light","dark":"dracula"}}
    await Bun.build({
      entrypoints: ['./index.tsx'],
      outdir: './out',
      naming: {
        // default values
        entry: '[dir]/[name].[ext]',
        chunk: '[name]-[hash].[ext]',
        asset: '[name]-[hash].[ext]',
      },
    })
    ```
  </Tab>

  <Tab title="CLI">
    ```bash terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
    bun build ./index.tsx --outdir ./out \
      --entry-naming '[dir]/[name].[ext]' \
      --chunk-naming '[name]-[hash].[ext]' \
      --asset-naming '[name]-[hash].[ext]'
    ```
  </Tab>
</Tabs>

### root

The root directory of the project.

<Tabs>
  <Tab title="JavaScript">
    ```ts title="build.ts" icon="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/typescript.svg?fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=5d73d76daf7eb7b158469d8c30d349b0" theme={"theme":{"light":"github-light","dark":"dracula"}}
    await Bun.build({
      entrypoints: ['./pages/a.tsx', './pages/b.tsx'],
      outdir: './out',
      root: '.',
    })
    ```
  </Tab>

  <Tab title="CLI">
    ```bash terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
    bun build ./pages/a.tsx ./pages/b.tsx --outdir ./out --root .
    ```
  </Tab>
</Tabs>

If unspecified, it is computed to be the first common ancestor of all entrypoint files. Consider the following file structure:

```text title="file system" icon="folder-tree" theme={"theme":{"light":"github-light","dark":"dracula"}}
.
└── pages
  └── index.tsx
  └── settings.tsx
```

We can build both entrypoints in the `pages` directory:

<Tabs>
  <Tab title="JavaScript">
    ```js  theme={"theme":{"light":"github-light","dark":"dracula"}}
    await Bun.build({
      entrypoints: ['./pages/index.tsx', './pages/settings.tsx'],
      outdir: './out',
    })
    ```
  </Tab>

  <Tab title="CLI">
    ```bash  theme={"theme":{"light":"github-light","dark":"dracula"}}
    bun build ./pages/index.tsx ./pages/settings.tsx --outdir ./out
    ```
  </Tab>
</Tabs>

This would result in a file structure like this:

```text title="file system" icon="folder-tree" theme={"theme":{"light":"github-light","dark":"dracula"}}
.
└── pages
  └── index.tsx
  └── settings.tsx
└── out
  └── index.js
  └── settings.js
```

Since the `pages` directory is the first common ancestor of the entrypoint files, it is considered the project root. This means that the generated bundles live at the top level of the `out` directory; there is no `out/pages` directory.

This behavior can be overridden by specifying the `root` option:

<Tabs>
  <Tab title="JavaScript">
    ```js  theme={"theme":{"light":"github-light","dark":"dracula"}}
    await Bun.build({
      entrypoints: ['./pages/index.tsx', './pages/settings.tsx'],
      outdir: './out',
      root: '.',
    })
    ```
  </Tab>

  <Tab title="CLI">
    ```bash  theme={"theme":{"light":"github-light","dark":"dracula"}}
    bun build ./pages/index.tsx ./pages/settings.tsx --outdir ./out --root .
    ```
  </Tab>
</Tabs>

By specifying `.` as `root`, the generated file structure will look like this:

```
.
└── pages
  └── index.tsx
  └── settings.tsx
└── out
  └── pages
    └── index.js
    └── settings.js
```

### publicPath

A prefix to be appended to any import paths in bundled code.

In many cases, generated bundles will contain no import statements. After all, the goal of bundling is to combine all of the code into a single file. However there are a number of cases with the generated bundles will contain import statements.

* **Asset imports** — When importing an unrecognized file type like `*.svg`, the bundler defers to the file loader, which copies the file into `outdir` as is. The import is converted into a variable
* **External modules** — Files and modules can be marked as external, in which case they will not be included in the bundle. Instead, the import statement will be left in the final bundle.
* **Chunking.** When `splitting` is enabled, the bundler may generate separate "chunk" files that represent code that is shared among multiple entrypoints.

In any of these cases, the final bundles may contain paths to other files. By default these imports are relative. Here is an example of a simple asset import:

<CodeGroup>
  ```ts Input icon="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/typescript.svg?fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=5d73d76daf7eb7b158469d8c30d349b0" theme={"theme":{"light":"github-light","dark":"dracula"}}
  import logo from "./logo.svg";
  console.log(logo);
  ```

  ```ts Output icon="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/javascript.svg?fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=dd7b5268d2e9410910a69804de702737" theme={"theme":{"light":"github-light","dark":"dracula"}}
  var logo = "./logo-a7305bdef.svg";
  console.log(logo);
  ```
</CodeGroup>

Setting `publicPath` will prefix all file paths with the specified value.

<Tabs>
  <Tab title="JavaScript">
    ```ts title="build.ts" icon="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/typescript.svg?fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=5d73d76daf7eb7b158469d8c30d349b0" theme={"theme":{"light":"github-light","dark":"dracula"}}
    await Bun.build({
      entrypoints: ['./index.tsx'],
      outdir: './out',
      publicPath: 'https://cdn.example.com/', // default is undefined
    })
    ```
  </Tab>

  <Tab title="CLI">
    ```bash terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
    bun build ./index.tsx --outdir ./out --public-path 'https://cdn.example.com/'
    ```
  </Tab>
</Tabs>

The output file would now look something like this.

```js title="out/index.js" icon="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/javascript.svg?fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=dd7b5268d2e9410910a69804de702737" theme={"theme":{"light":"github-light","dark":"dracula"}}
var logo = "https://cdn.example.com/logo-a7305bdef.svg";
```

### define

A map of global identifiers to be replaced at build time. Keys of this object are identifier names, and values are JSON strings that will be inlined.

<Tabs>
  <Tab title="JavaScript">
    ```ts title="build.ts" icon="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/typescript.svg?fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=5d73d76daf7eb7b158469d8c30d349b0" theme={"theme":{"light":"github-light","dark":"dracula"}}
    await Bun.build({
      entrypoints: ['./index.tsx'],
      outdir: './out',
      define: {
        STRING: JSON.stringify("value"),
        "nested.boolean": "true",
      },
    })
    ```
  </Tab>

  <Tab title="CLI">
    ```bash terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
    bun build ./index.tsx --outdir ./out --define STRING='"value"' --define nested.boolean=true
    ```
  </Tab>
</Tabs>

### loader

A map of file extensions to built-in loader names. This can be used to quickly customize how certain files are loaded.

<Tabs>
  <Tab title="JavaScript">
    ```ts title="build.ts" icon="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/typescript.svg?fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=5d73d76daf7eb7b158469d8c30d349b0" theme={"theme":{"light":"github-light","dark":"dracula"}}
    await Bun.build({
      entrypoints: ['./index.tsx'],
      outdir: './out',
      loader: {
        ".png": "dataurl",
        ".txt": "file",
      },
    })
    ```
  </Tab>

  <Tab title="CLI">
    ```bash terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
    bun build ./index.tsx --outdir ./out --loader .png:dataurl --loader .txt:file
    ```
  </Tab>
</Tabs>

### banner

A banner to be added to the final bundle, this can be a directive like `"use client"` for react or a comment block such as a license for the code.

<Tabs>
  <Tab title="JavaScript">
    ```ts title="build.ts" icon="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/typescript.svg?fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=5d73d76daf7eb7b158469d8c30d349b0" theme={"theme":{"light":"github-light","dark":"dracula"}}
    await Bun.build({
      entrypoints: ['./index.tsx'],
      outdir: './out',
      banner: '"use client";'
    })
    ```
  </Tab>

  <Tab title="CLI">
    ```bash terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
    bun build ./index.tsx --outdir ./out --banner '"use client";'
    ```
  </Tab>
</Tabs>

### footer

A footer to be added to the final bundle, this can be something like a comment block for a license or just a fun easter egg.

<Tabs>
  <Tab title="JavaScript">
    ```ts title="build.ts" icon="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/typescript.svg?fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=5d73d76daf7eb7b158469d8c30d349b0" theme={"theme":{"light":"github-light","dark":"dracula"}}
    await Bun.build({
      entrypoints: ['./index.tsx'],
      outdir: './out',
      footer: '// built with love in SF'
    })
    ```
  </Tab>

  <Tab title="CLI">
    ```bash terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
    bun build ./index.tsx --outdir ./out --footer '// built with love in SF'
    ```
  </Tab>
</Tabs>

### drop

Remove function calls from a bundle. For example, `--drop=console` will remove all calls to `console.log`. Arguments to calls will also be removed, regardless of if those arguments may have side effects. Dropping `debugger` will remove all `debugger` statements.

<Tabs>
  <Tab title="JavaScript">
    ```ts title="build.ts" icon="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/typescript.svg?fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=5d73d76daf7eb7b158469d8c30d349b0" theme={"theme":{"light":"github-light","dark":"dracula"}}
    await Bun.build({
      entrypoints: ['./index.tsx'],
      outdir: './out',
      drop: ["console", "debugger", "anyIdentifier.or.propertyAccess"],
    })
    ```
  </Tab>

  <Tab title="CLI">
    ```bash terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
    bun build ./index.tsx --outdir ./out --drop console --drop debugger
    ```
  </Tab>
</Tabs>

### features

Enable compile-time feature flags for dead-code elimination. This provides a way to conditionally include or exclude code paths at bundle time using `import { feature } from "bun:bundle"`.

```ts title="app.ts" icon="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/typescript.svg?fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=5d73d76daf7eb7b158469d8c30d349b0" theme={"theme":{"light":"github-light","dark":"dracula"}}
import { feature } from "bun:bundle";

if (feature("PREMIUM")) {
  // Only included when PREMIUM flag is enabled
  initPremiumFeatures();
}

if (feature("DEBUG")) {
  // Only included when DEBUG flag is enabled
  console.log("Debug mode");
}
```

<Tabs>
  <Tab title="JavaScript">
    ```ts title="build.ts" icon="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/typescript.svg?fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=5d73d76daf7eb7b158469d8c30d349b0" theme={"theme":{"light":"github-light","dark":"dracula"}}
    await Bun.build({
      entrypoints: ['./app.ts'],
      outdir: './out',
      features: ["PREMIUM"],  // PREMIUM=true, DEBUG=false
    })
    ```
  </Tab>

  <Tab title="CLI">
    ```bash terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
    bun build ./app.ts --outdir ./out --feature PREMIUM
    ```
  </Tab>
</Tabs>

The `feature()` function is replaced with `true` or `false` at bundle time. Combined with minification, unreachable code is eliminated:

```ts title="Input" icon="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/typescript.svg?fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=5d73d76daf7eb7b158469d8c30d349b0" theme={"theme":{"light":"github-light","dark":"dracula"}}
import { feature } from "bun:bundle";
const mode = feature("PREMIUM") ? "premium" : "free";
```

```js title="Output (with --feature PREMIUM --minify)" icon="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/javascript.svg?fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=dd7b5268d2e9410910a69804de702737" theme={"theme":{"light":"github-light","dark":"dracula"}}
var mode = "premium";
```

```js title="Output (without --feature PREMIUM, with --minify)" icon="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/javascript.svg?fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=dd7b5268d2e9410910a69804de702737" theme={"theme":{"light":"github-light","dark":"dracula"}}
var mode = "free";
```

**Key behaviors:**

* `feature()` requires a string literal argument — dynamic values are not supported
* The `bun:bundle` import is completely removed from the output
* Works with `bun build`, `bun run`, and `bun test`
* Multiple flags can be enabled: `--feature FLAG_A --feature FLAG_B`
* For type safety, augment the `Registry` interface to restrict `feature()` to known flags (see below)

**Use cases:**

* Platform-specific code (`feature("SERVER")` vs `feature("CLIENT")`)
* Environment-based features (`feature("DEVELOPMENT")`)
* Gradual feature rollouts
* A/B testing variants
* Paid tier features

**Type safety:** By default, `feature()` accepts any string. To get autocomplete and catch typos at compile time, create an `env.d.ts` file (or add to an existing `.d.ts`) and augment the `Registry` interface:

```ts title="env.d.ts" icon="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/typescript.svg?fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=5d73d76daf7eb7b158469d8c30d349b0" theme={"theme":{"light":"github-light","dark":"dracula"}}
declare module "bun:bundle" {
  interface Registry {
    features: "DEBUG" | "PREMIUM" | "BETA_FEATURES";
  }
}
```

Ensure the file is included in your `tsconfig.json` (e.g., `"include": ["src", "env.d.ts"]`). Now `feature()` only accepts those flags, and invalid strings like `feature("TYPO")` become type errors.

### optimizeImports

Skip parsing unused submodules of barrel files (re-export index files). When you import only a few named exports from a large library, normally the bundler parses every file the barrel re-exports. With `optimizeImports`, only the submodules you actually use are parsed.

```ts title="build.ts" icon="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/typescript.svg?fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=5d73d76daf7eb7b158469d8c30d349b0" theme={"theme":{"light":"github-light","dark":"dracula"}}
await Bun.build({
  entrypoints: ["./app.ts"],
  outdir: "./out",
  optimizeImports: ["antd", "@mui/material", "lodash-es"],
});
```

For example, `import { Button } from 'antd'` normally parses all \~3000 modules that `antd/index.js` re-exports. With `optimizeImports: ['antd']`, only the `Button` submodule is parsed.

This works for **pure barrel files** — files where every named export is a re-export (`export { X } from './x'`). If a barrel file has any local exports (`export const foo = ...`), or if any importer uses `import *`, all submodules are loaded.

`export *` re-exports are always loaded (never deferred) to avoid circular resolution issues. Only named re-exports (`export { X } from './x'`) that aren't used by any importer are deferred.

**Automatic mode:** Packages with `"sideEffects": false` in their `package.json` get barrel optimization automatically — no `optimizeImports` config needed. Use `optimizeImports` for packages that don't have this field.

**Plugins:** Resolve and load plugins work correctly with barrel optimization. Deferred submodules go through the plugin pipeline when they are eventually loaded.

### metafile

Generate metadata about the build in a structured format. The metafile contains information about all input files, output files, their sizes, imports, and exports. This is useful for:

* **Bundle analysis**: Understand what's contributing to bundle size
* **Visualization**: Feed into tools like [esbuild's bundle analyzer](https://esbuild.github.io/analyze/) or other visualization tools
* **Dependency tracking**: See the full import graph of your application
* **CI integration**: Track bundle size changes over time

<Tabs>
  <Tab title="JavaScript">
    ```ts title="build.ts" icon="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/typescript.svg?fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=5d73d76daf7eb7b158469d8c30d349b0" theme={"theme":{"light":"github-light","dark":"dracula"}}
    const result = await Bun.build({
      entrypoints: ['./src/index.ts'],
      outdir: './dist',
      metafile: true,
    });

    if (result.metafile) {
      // Analyze inputs
      for (const [path, meta] of Object.entries(result.metafile.inputs)) {
        console.log(`${path}: ${meta.bytes} bytes`);
      }

      // Analyze outputs
      for (const [path, meta] of Object.entries(result.metafile.outputs)) {
        console.log(`${path}: ${meta.bytes} bytes`);
      }

      // Save for external analysis tools
      await Bun.write('./dist/meta.json', JSON.stringify(result.metafile));
    }
    ```
  </Tab>

  <Tab title="CLI">
    ```bash terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
    bun build ./src/index.ts --outdir ./dist --metafile ./dist/meta.json
    ```
  </Tab>
</Tabs>

#### Markdown metafile

Use `--metafile-md` to generate a markdown metafile, which is LLM-friendly and easy to read in the terminal:

```bash terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
bun build ./src/index.ts --outdir ./dist --metafile-md ./dist/meta.md
```

Both `--metafile` and `--metafile-md` can be used together:

```bash terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
bun build ./src/index.ts --outdir ./dist --metafile ./dist/meta.json --metafile-md ./dist/meta.md
```

#### `metafile` option formats

In the JavaScript API, `metafile` accepts several forms:

```ts title="build.ts" icon="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/typescript.svg?fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=5d73d76daf7eb7b158469d8c30d349b0" theme={"theme":{"light":"github-light","dark":"dracula"}}
// Boolean — include metafile in the result object
await Bun.build({
  entrypoints: ["./src/index.ts"],
  outdir: "./dist",
  metafile: true,
});

// String — write JSON metafile to a specific path
await Bun.build({
  entrypoints: ["./src/index.ts"],
  outdir: "./dist",
  metafile: "./dist/meta.json",
});

// Object — specify separate paths for JSON and markdown output
await Bun.build({
  entrypoints: ["./src/index.ts"],
  outdir: "./dist",
  metafile: {
    json: "./dist/meta.json",
    markdown: "./dist/meta.md",
  },
});
```

The metafile structure contains:

```ts  theme={"theme":{"light":"github-light","dark":"dracula"}}
interface BuildMetafile {
  inputs: {
    [path: string]: {
      bytes: number;
      imports: Array<{
        path: string;
        kind: ImportKind;
        original?: string; // Original specifier before resolution
        external?: boolean;
      }>;
      format?: "esm" | "cjs" | "json" | "css";
    };
  };
  outputs: {
    [path: string]: {
      bytes: number;
      inputs: {
        [path: string]: { bytesInOutput: number };
      };
      imports: Array<{ path: string; kind: ImportKind }>;
      exports: string[];
      entryPoint?: string;
      cssBundle?: string; // Associated CSS file for JS entry points
    };
  };
}
```

## Outputs

The `Bun.build` function returns a `Promise<BuildOutput>`, defined as:

```ts title="build.ts" icon="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/typescript.svg?fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=5d73d76daf7eb7b158469d8c30d349b0" theme={"theme":{"light":"github-light","dark":"dracula"}}
interface BuildOutput {
  outputs: BuildArtifact[];
  success: boolean;
  logs: Array<object>; // see docs for details
  metafile?: BuildMetafile; // only when metafile: true
}

interface BuildArtifact extends Blob {
  kind: "entry-point" | "chunk" | "asset" | "sourcemap";
  path: string;
  loader: Loader;
  hash: string | null;
  sourcemap: BuildArtifact | null;
}
```

The `outputs` array contains all the files that were generated by the build. Each artifact implements the Blob interface.

```ts title="build.ts" icon="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/typescript.svg?fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=5d73d76daf7eb7b158469d8c30d349b0" theme={"theme":{"light":"github-light","dark":"dracula"}}
const build = await Bun.build({
  /* */
});

for (const output of build.outputs) {
  await output.arrayBuffer(); // => ArrayBuffer
  await output.bytes(); // => Uint8Array
  await output.text(); // string
}
```

Each artifact also contains the following properties:

| Property    | Description                                                                                                                                                  |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `kind`      | What kind of build output this file is. A build generates bundled entrypoints, code-split "chunks", sourcemaps, bytecode, and copied assets (like images).   |
| `path`      | Absolute path to the file on disk                                                                                                                            |
| `loader`    | The loader was used to interpret the file. See [Bundler > Loaders](/bundler/loaders) to see how Bun maps file extensions to the appropriate built-in loader. |
| `hash`      | The hash of the file contents. Always defined for assets.                                                                                                    |
| `sourcemap` | The sourcemap file corresponding to this file, if generated. Only defined for entrypoints and chunks.                                                        |

Similar to `BunFile`, `BuildArtifact` objects can be passed directly into `new Response()`.

```ts title="build.ts" icon="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/typescript.svg?fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=5d73d76daf7eb7b158469d8c30d349b0" theme={"theme":{"light":"github-light","dark":"dracula"}}
const build = await Bun.build({
  /* */
});

const artifact = build.outputs[0];

// Content-Type header is automatically set
return new Response(artifact);
```

The Bun runtime implements special pretty-printing of `BuildArtifact` object to make debugging easier.

<CodeGroup>
  ```ts build.ts icon="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/typescript.svg?fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=5d73d76daf7eb7b158469d8c30d349b0" theme={"theme":{"light":"github-light","dark":"dracula"}}
  // build.ts
  const build = await Bun.build({
    /* */
  });

  const artifact = build.outputs[0];
  console.log(artifact);
  ```

  ```bash Shell output theme={"theme":{"light":"github-light","dark":"dracula"}}
  bun run build.ts

  BuildArtifact (entry-point) {
    path: "./index.js",
    loader: "tsx",
    kind: "entry-point",
    hash: "824a039620219640",
    Blob (74756 bytes) {
      type: "text/javascript;charset=utf-8"
    },
    sourcemap: BuildArtifact (sourcemap) {
      path: "./index.js.map",
      loader: "file",
      kind: "sourcemap",
      hash: "e7178cda3e72e301",
      Blob (24765 bytes) {
        type: "application/json;charset=utf-8"
      },
      sourcemap: null
    }
  }
  ```
</CodeGroup>

## Bytecode

The `bytecode: boolean` option can be used to generate bytecode for any JavaScript/TypeScript entrypoints. This can greatly improve startup times for large applications. Requires `"target": "bun"` and is dependent on a matching version of Bun.

* **CommonJS**: Works with or without `compile: true`. Generates a `.jsc` file alongside each entrypoint.
* **ESM**: Requires `compile: true`. Bytecode and module metadata are embedded in the standalone executable.

Without an explicit `format`, bytecode defaults to CommonJS.

<Tabs>
  <Tab title="JavaScript">
    ```ts title="build.ts" icon="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/typescript.svg?fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=5d73d76daf7eb7b158469d8c30d349b0" theme={"theme":{"light":"github-light","dark":"dracula"}}
    // CommonJS bytecode (generates .jsc files)
    await Bun.build({
      entrypoints: ["./index.tsx"],
      outdir: "./out",
      bytecode: true,
    })

    // ESM bytecode (requires compile)
    await Bun.build({
      entrypoints: ["./index.tsx"],
      outfile: "./mycli",
      bytecode: true,
      format: "esm",
      compile: true,
    })
    ```
  </Tab>

  <Tab title="CLI">
    ```bash terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
    # CommonJS bytecode
    bun build ./index.tsx --outdir ./out --bytecode

    # ESM bytecode (requires --compile)
    bun build ./index.tsx --outfile ./mycli --bytecode --format=esm --compile
    ```
  </Tab>
</Tabs>

## Executables

Bun supports "compiling" a JavaScript/TypeScript entrypoint into a standalone executable. This executable contains a copy of the Bun binary.

```bash terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
bun build ./cli.tsx --outfile mycli --compile
./mycli
```

Refer to [Bundler > Executables](/bundler/executables) for complete documentation.

## Logs and errors

On failure, `Bun.build` returns a rejected promise with an `AggregateError`. This can be logged to the console for pretty printing of the error list, or programmatically read with a try/catch block.

```ts title="build.ts" icon="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/typescript.svg?fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=5d73d76daf7eb7b158469d8c30d349b0" theme={"theme":{"light":"github-light","dark":"dracula"}}
try {
  const result = await Bun.build({
    entrypoints: ["./index.tsx"],
    outdir: "./out",
  });
} catch (e) {
  // TypeScript does not allow annotations on the catch clause
  const error = e as AggregateError;
  console.error("Build Failed");

  // Example: Using the built-in formatter
  console.error(error);

  // Example: Serializing the failure as a JSON string.
  console.error(JSON.stringify(error, null, 2));
}
```

Most of the time, an explicit try/catch is not needed, as Bun will neatly print uncaught exceptions. It is enough to just use a top-level await on the `Bun.build` call.

Each item in `error.errors` is an instance of `BuildMessage` or `ResolveMessage` (subclasses of `Error`), containing detailed information for each error.

```ts title="build.ts" icon="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/typescript.svg?fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=5d73d76daf7eb7b158469d8c30d349b0" theme={"theme":{"light":"github-light","dark":"dracula"}}
class BuildMessage {
  name: string;
  position?: Position;
  message: string;
  level: "error" | "warning" | "info" | "debug" | "verbose";
}

class ResolveMessage extends BuildMessage {
  code: string;
  referrer: string;
  specifier: string;
  importKind: ImportKind;
}
```

On build success, the returned object contains a `logs` property, which contains bundler warnings and info messages.

```ts title="build.ts" icon="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/typescript.svg?fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=5d73d76daf7eb7b158469d8c30d349b0" theme={"theme":{"light":"github-light","dark":"dracula"}}
const result = await Bun.build({
  entrypoints: ["./index.tsx"],
  outdir: "./out",
});

if (result.logs.length > 0) {
  console.warn("Build succeeded with warnings:");
  for (const message of result.logs) {
    // Bun will pretty print the message object
    console.warn(message);
  }
}
```

## Reference

```ts Typescript Definitions icon="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/typescript.svg?fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=5d73d76daf7eb7b158469d8c30d349b0" expandable theme={"theme":{"light":"github-light","dark":"dracula"}}
interface Bun {
  build(options: BuildOptions): Promise<BuildOutput>;
}

interface BuildConfig {
  entrypoints: string[]; // list of file path
  outdir?: string; // output directory
  target?: Target; // default: "browser"
  /**
   * Output module format. Top-level await is only supported for `"esm"`.
   *
   * Can be:
   * - `"esm"`
   * - `"cjs"` (**experimental**)
   * - `"iife"` (**experimental**)
   *
   * @default "esm"
   */
  format?: "esm" | "cjs" | "iife";
  /**
   * JSX configuration object for controlling JSX transform behavior
   */
  jsx?: {
    runtime?: "automatic" | "classic";
    importSource?: string;
    factory?: string;
    fragment?: string;
    sideEffects?: boolean;
    development?: boolean;
  };
  naming?:
    | string
    | {
        chunk?: string;
        entry?: string;
        asset?: string;
      };
  root?: string; // project root
  splitting?: boolean; // default true, enable code splitting
  plugins?: BunPlugin[];
  external?: string[];
  packages?: "bundle" | "external";
  publicPath?: string;
  define?: Record<string, string>;
  loader?: { [k in string]: Loader };
  sourcemap?: "none" | "linked" | "inline" | "external" | boolean; // default: "none", true -> "inline"
  /**
   * package.json `exports` conditions used when resolving imports
   *
   * Equivalent to `--conditions` in `bun build` or `bun run`.
   *
   * https://nodejs.org/api/packages.html#exports
   */
  conditions?: Array<string> | string;

  /**
   * Controls how environment variables are handled during bundling.
   *
   * Can be one of:
   * - `"inline"`: Injects environment variables into the bundled output by converting `process.env.FOO`
   *   references to string literals containing the actual environment variable values
   * - `"disable"`: Disables environment variable injection entirely
   * - A string ending in `*`: Inlines environment variables that match the given prefix.
   *   For example, `"MY_PUBLIC_*"` will only include env vars starting with "MY_PUBLIC_"
   */
  env?: "inline" | "disable" | `${string}*`;
  minify?:
    | boolean
    | {
        whitespace?: boolean;
        syntax?: boolean;
        identifiers?: boolean;
      };
  /**
   * Ignore dead code elimination/tree-shaking annotations such as @__PURE__ and package.json
   * "sideEffects" fields. This should only be used as a temporary workaround for incorrect
   * annotations in libraries.
   */
  ignoreDCEAnnotations?: boolean;
  /**
   * Force emitting @__PURE__ annotations even if minify.whitespace is true.
   */
  emitDCEAnnotations?: boolean;

  /**
   * Generate bytecode for the output. This can dramatically improve cold
   * start times, but will make the final output larger and slightly increase
   * memory usage.
   *
   * - CommonJS: works with or without `compile: true`
   * - ESM: requires `compile: true`
   *
   * Without an explicit `format`, defaults to CommonJS.
   *
   * Must be `target: "bun"`
   * @default false
   */
  bytecode?: boolean;
  /**
   * Add a banner to the bundled code such as "use client";
   */
  banner?: string;
  /**
   * Add a footer to the bundled code such as a comment block like
   *
   * `// made with bun!`
   */
  footer?: string;

  /**
   * Drop function calls to matching property accesses.
   */
  drop?: string[];

  /**
   * - When set to `true`, the returned promise rejects with an AggregateError when a build failure happens.
   * - When set to `false`, returns a {@link BuildOutput} with `{success: false}`
   *
   * @default true
   */
  throw?: boolean;

  /**
   * Custom tsconfig.json file path to use for path resolution.
   * Equivalent to `--tsconfig-override` in the CLI.
   */
  tsconfig?: string;

  outdir?: string;
}

interface BuildOutput {
  outputs: BuildArtifact[];
  success: boolean;
  logs: Array<BuildMessage | ResolveMessage>;
}

interface BuildArtifact extends Blob {
  path: string;
  loader: Loader;
  hash: string | null;
  kind: "entry-point" | "chunk" | "asset" | "sourcemap" | "bytecode";
  sourcemap: BuildArtifact | null;
}

type Loader =
  | "js"
  | "jsx"
  | "ts"
  | "tsx"
  | "css"
  | "json"
  | "jsonc"
  | "toml"
  | "yaml"
  | "text"
  | "file"
  | "napi"
  | "wasm"
  | "html";

interface BuildOutput {
  outputs: BuildArtifact[];
  success: boolean;
  logs: Array<BuildMessage | ResolveMessage>;
}

declare class ResolveMessage {
  readonly name: "ResolveMessage";
  readonly position: Position | null;
  readonly code: string;
  readonly message: string;
  readonly referrer: string;
  readonly specifier: string;
  readonly importKind:
    | "entry_point"
    | "stmt"
    | "require"
    | "import"
    | "dynamic"
    | "require_resolve"
    | "at"
    | "at_conditional"
    | "url"
    | "internal";
  readonly level: "error" | "warning" | "info" | "debug" | "verbose";

  toString(): string;
}
```

***

## CLI Usage

```bash  theme={"theme":{"light":"github-light","dark":"dracula"}}
bun build <entry points>
```

### General Configuration

<ParamField path="--production" type="boolean">
  Set <code>NODE\_ENV=production</code> and enable minification
</ParamField>

<ParamField path="--bytecode" type="boolean">
  Use a bytecode cache when compiling
</ParamField>

<ParamField path="--target" type="string" default="browser">
  Intended execution environment for the bundle. One of <code>browser</code>, <code>bun</code>, or <code>node</code>
</ParamField>

<ParamField path="--conditions" type="string">
  Pass custom resolution conditions
</ParamField>

<ParamField path="--env" type="string" default="disable">
  Inline environment variables into the bundle as <code>process.env.\${name_0}</code>. To inline variables matching a
  prefix, use a glob like <code>FOO\_PUBLIC\_\*</code>
</ParamField>

### Output & File Handling

<ParamField path="--outdir" type="string" default="dist">
  Output directory (used when building multiple entry points)
</ParamField>

<ParamField path="--outfile" type="string">
  Write output to a specific file
</ParamField>

<ParamField path="--sourcemap" type="string" default="none">
  Generate source maps. One of <code>linked</code>, <code>inline</code>, <code>external</code>, or <code>none</code>
</ParamField>

<ParamField path="--banner" type="string">
  Add a banner to the output (e.g. <code>"use client"</code> for React Server Components)
</ParamField>

<ParamField path="--footer" type="string">
  Add a footer to the output (e.g. <code>// built with bun!</code>)
</ParamField>

<ParamField path="--format" type="string" default="esm">
  Module format of the output bundle. One of <code>esm</code>, <code>cjs</code>, or <code>iife</code>. Defaults to{" "}
  <code>cjs</code> when <code>--bytecode</code> is used.
</ParamField>

### File Naming

<ParamField path="--entry-naming" type="string" default="[dir]/[name].[ext]">
  Customize entry point filenames
</ParamField>

<ParamField path="--chunk-naming" type="string" default="[name]-[hash].[ext]">
  Customize chunk filenames
</ParamField>

<ParamField path="--asset-naming" type="string" default="[name]-[hash].[ext]">
  Customize asset filenames
</ParamField>

### Bundling Options

<ParamField path="--root" type="string">
  Root directory used when bundling multiple entry points
</ParamField>

<ParamField path="--splitting" type="boolean">
  Enable code splitting for shared modules
</ParamField>

<ParamField path="--public-path" type="string">
  Prefix to be added to import paths in bundled code
</ParamField>

<ParamField path="--external" type="string">
  Exclude modules from the bundle (supports wildcards). Alias: <code>-e</code>
</ParamField>

<ParamField path="--packages" type="string" default="bundle">
  How to treat dependencies: <code>external</code> or <code>bundle</code>
</ParamField>

<ParamField path="--no-bundle" type="boolean">
  Transpile only — do not bundle
</ParamField>

<ParamField path="--css-chunking" type="boolean">
  Chunk CSS files together to reduce duplication (only when multiple entry points import CSS)
</ParamField>

### Minification & Optimization

<ParamField path="--emit-dce-annotations" type="boolean" default="true">
  Re-emit Dead Code Elimination annotations. Disabled when <code>--minify-whitespace</code> is used
</ParamField>

<ParamField path="--minify" type="boolean">
  Enable all minification options
</ParamField>

<ParamField path="--minify-syntax" type="boolean">
  Minify syntax and inline constants
</ParamField>

<ParamField path="--minify-whitespace" type="boolean">
  Minify whitespace
</ParamField>

<ParamField path="--minify-identifiers" type="boolean">
  Minify variable and function identifiers
</ParamField>

<ParamField path="--keep-names" type="boolean">
  Preserve original function and class names when minifying
</ParamField>

### Development Features

<ParamField path="--watch" type="boolean">
  Rebuild automatically when files change
</ParamField>

<ParamField path="--no-clear-screen" type="boolean">
  Don’t clear the terminal when rebuilding with <code>--watch</code>
</ParamField>

<ParamField path="--react-fast-refresh" type="boolean">
  Enable React Fast Refresh transform (for development testing)
</ParamField>

### Standalone Executables

<ParamField path="--compile" type="boolean">
  Generate a standalone Bun executable containing the bundle. Implies <code>--production</code>
</ParamField>

<ParamField path="--compile-exec-argv" type="string">
  Prepend arguments to the standalone executable’s <code>execArgv</code>
</ParamField>

### Windows Executable Details

<ParamField path="--windows-hide-console" type="boolean">
  Prevent a console window from opening when running a compiled Windows executable
</ParamField>

<ParamField path="--windows-icon" type="string">
  Set an icon for the Windows executable
</ParamField>

<ParamField path="--windows-title" type="string">
  Set the Windows executable product name
</ParamField>

<ParamField path="--windows-publisher" type="string">
  Set the Windows executable company name
</ParamField>

<ParamField path="--windows-version" type="string">
  Set the Windows executable version (e.g. <code>1.2.3.4</code>)
</ParamField>

<ParamField path="--windows-description" type="string">
  Set the Windows executable description
</ParamField>

<ParamField path="--windows-copyright" type="string">
  Set the Windows executable copyright notice
</ParamField>

### Experimental & App Building

<ParamField path="--app" type="boolean">
  <b>(EXPERIMENTAL)</b> Build a web app for production using Bun Bake
</ParamField>

<ParamField path="--server-components" type="boolean">
  <b>(EXPERIMENTAL)</b> Enable React Server Components
</ParamField>

<ParamField path="--debug-dump-server-files" type="boolean">
  When <code>--app</code> is set, dump all server files to disk even for static builds
</ParamField>

<ParamField path="--debug-no-minify" type="boolean">
  When <code>--app</code> is set, disable all minification
</ParamField>
