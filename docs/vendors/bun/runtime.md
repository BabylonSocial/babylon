> ## Documentation Index
> Fetch the complete documentation index at: https://bun.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Bun Runtime

> Execute JavaScript/TypeScript files, package.json scripts, and executable packages with Bun's fast runtime.

The Bun Runtime is designed to start fast and run fast.

Under the hood, Bun uses the [JavaScriptCore engine](https://developer.apple.com/documentation/javascriptcore), which is developed by Apple for Safari. In most cases, the startup and running performance is faster than V8, the engine used by Node.js and Chromium-based browsers. Its transpiler and runtime are written in Zig, a modern, high-performance language. On Linux, this translates into startup times [4x faster](https://twitter.com/jarredsumner/status/1499225725492076544) than Node.js.

| Command         | Time     |
| --------------- | -------- |
| `bun hello.js`  | `5.2ms`  |
| `node hello.js` | `25.1ms` |

This benchmark is based on running a simple Hello World script on Linux

## Run a file

Use `bun run` to execute a source file.

```bash terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
bun run index.js
```

Bun supports TypeScript and JSX out of the box. Every file is transpiled on the fly by Bun's fast native transpiler before being executed.

```bash terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
bun run index.js
bun run index.jsx
bun run index.ts
bun run index.tsx
```

Alternatively, you can omit the `run` keyword and use the "naked" command; it behaves identically.

```bash terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
bun index.tsx
bun index.js
```

### `--watch`

To run a file in watch mode, use the `--watch` flag.

```bash terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
bun --watch run index.tsx
```

<Note>
  When using `bun run`, put Bun flags like `--watch` immediately after `bun`.

  ```bash  theme={"theme":{"light":"github-light","dark":"dracula"}}
  bun --watch run dev # ✔️ do this
  bun run dev --watch # ❌ don't do this
  ```

  Flags that occur at the end of the command will be ignored and passed through to the `"dev"` script itself.
</Note>

## Run a `package.json` script

<Note>
  Compare to `npm run <script>` or `yarn <script>`
</Note>

```sh  theme={"theme":{"light":"github-light","dark":"dracula"}}
bun [bun flags] run <script> [script flags]
```

Your `package.json` can define a number of named `"scripts"` that correspond to shell commands.

```json package.json icon="file-json" theme={"theme":{"light":"github-light","dark":"dracula"}}
{
  // ... other fields
  "scripts": {
    "clean": "rm -rf dist && echo 'Done.'",
    "dev": "bun server.ts"
  }
}
```

Use `bun run <script>` to execute these scripts.

```bash terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
bun run clean
rm -rf dist && echo 'Done.'
```

```txt  theme={"theme":{"light":"github-light","dark":"dracula"}}
Cleaning...
Done.
```

Bun executes the script command in a subshell. On Linux & macOS, it checks for the following shells in order, using the first one it finds: `bash`, `sh`, `zsh`. On Windows, it uses [bun shell](/runtime/shell) to support bash-like syntax and many common commands.

<Note>⚡️ The startup time for `npm run` on Linux is roughly 170ms; with Bun it is `6ms`.</Note>

Scripts can also be run with the shorter command `bun <script>`, however if there is a built-in bun command with the same name, the built-in command takes precedence. In this case, use the more explicit `bun run <script>` command to execute your package script.

```bash terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
bun run dev
```

To see a list of available scripts, run `bun run` without any arguments.

```bash terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
bun run
```

```txt  theme={"theme":{"light":"github-light","dark":"dracula"}}
quickstart scripts:

 bun run clean
   rm -rf dist && echo 'Done.'

 bun run dev
   bun server.ts

2 scripts
```

Bun respects lifecycle hooks. For instance, `bun run clean` will execute `preclean` and `postclean`, if defined. If the `pre<script>` fails, Bun will not execute the script itself.

### `--bun`

It's common for `package.json` scripts to reference locally-installed CLIs like `vite` or `next`. These CLIs are often JavaScript files marked with a [shebang](https://en.wikipedia.org/wiki/Shebang_\(Unix\)) to indicate that they should be executed with `node`.

```js cli.js icon="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/javascript.svg?fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=dd7b5268d2e9410910a69804de702737" theme={"theme":{"light":"github-light","dark":"dracula"}}
#!/usr/bin/env node

// do stuff
```

By default, Bun respects this shebang and executes the script with `node`. However, you can override this behavior with the `--bun` flag. For Node.js-based CLIs, this will run the CLI with Bun instead of Node.js.

```bash terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
bun run --bun vite
```

### Filtering

In monorepos containing multiple packages, you can use the `--filter` argument to execute scripts in many packages at once.

Use `bun run --filter <name_pattern> <script>` to execute `<script>` in all packages whose name matches `<name_pattern>`.
For example, if you have subdirectories containing packages named `foo`, `bar` and `baz`, running

```bash terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
bun run --filter 'ba*' <script>
```

will execute `<script>` in both `bar` and `baz`, but not in `foo`.

Find more details in the docs page for [filter](/pm/filter#running-scripts-with-filter).

## `bun run -` to pipe code from stdin

`bun run -` lets you read JavaScript, TypeScript, TSX, or JSX from stdin and execute it without writing to a temporary file first.

```bash terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
echo "console.log('Hello')" | bun run -
```

```txt  theme={"theme":{"light":"github-light","dark":"dracula"}}
Hello
```

You can also use `bun run -` to redirect files into Bun. For example, to run a `.js` file as if it were a `.ts` file:

```bash terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
echo "console.log!('This is TypeScript!' as any)" > secretly-typescript.js
bun run - < secretly-typescript.js
```

```txt  theme={"theme":{"light":"github-light","dark":"dracula"}}
This is TypeScript!
```

For convenience, all code is treated as TypeScript with JSX support when using `bun run -`.

## `bun run --console-depth`

Control the depth of object inspection in console output with the `--console-depth` flag.

```bash terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
bun --console-depth 5 run index.tsx
```

This sets how deeply nested objects are displayed in `console.log()` output. The default depth is `2`. Higher values show more nested properties but may produce verbose output for complex objects.

```ts console.ts icon="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/typescript.svg?fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=5d73d76daf7eb7b158469d8c30d349b0" theme={"theme":{"light":"github-light","dark":"dracula"}}
const nested = { a: { b: { c: { d: "deep" } } } };
console.log(nested);
// With --console-depth 2 (default): { a: { b: [Object] } }
// With --console-depth 4: { a: { b: { c: { d: 'deep' } } } }
```

## `bun run --smol`

In memory-constrained environments, use the `--smol` flag to reduce memory usage at a cost to performance.

```bash terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
bun --smol run index.tsx
```

This causes the garbage collector to run more frequently, which can slow down execution. However, it can be useful in environments with limited memory. Bun automatically adjusts the garbage collector's heap size based on the available memory (accounting for cgroups and other memory limits) with and without the `--smol` flag, so this is mostly useful for cases where you want to make the heap size grow more slowly.

## Resolution order

Absolute paths and paths starting with `./` or `.\\` are always executed as source files. Unless using `bun run`, running a file with an allowed extension will prefer the file over a package.json script.

When there is a package.json script and a file with the same name, `bun run` prioritizes the package.json script. The full resolution order is:

1. package.json scripts, eg `bun run build`
2. Source files, eg `bun run src/main.js`
3. Binaries from project packages, eg `bun add eslint && bun run eslint`
4. (`bun run` only) System commands, eg `bun run ls`

***

# CLI Usage

```bash  theme={"theme":{"light":"github-light","dark":"dracula"}}
bun run <file or script>
```

### General Execution Options

<ParamField path="--silent" type="boolean">
  Don't print the script command
</ParamField>

<ParamField path="--if-present" type="boolean">
  Exit without an error if the entrypoint does not exist
</ParamField>

<ParamField path="--eval" type="string">
  Evaluate argument as a script. Alias: <code>-e</code>
</ParamField>

<ParamField path="--print" type="string">
  Evaluate argument as a script and print the result. Alias: <code>-p</code>
</ParamField>

<ParamField path="--help" type="boolean">
  Display this menu and exit. Alias: <code>-h</code>
</ParamField>

### Workspace Management

<ParamField path="--elide-lines" type="number" default="10">
  Number of lines of script output shown when using --filter (default: 10). Set to 0 to show all lines
</ParamField>

<ParamField path="--filter" type="string">
  Run a script in all workspace packages matching the pattern. Alias: <code>-F</code>
</ParamField>

<ParamField path="--workspaces" type="boolean">
  Run a script in all workspace packages (from the <code>workspaces</code> field in <code>package.json</code>)
</ParamField>

<ParamField path="--parallel" type="boolean">
  Run multiple scripts or workspace scripts concurrently with prefixed output
</ParamField>

<ParamField path="--sequential" type="boolean">
  Run multiple scripts or workspace scripts one after another with prefixed output
</ParamField>

<ParamField path="--no-exit-on-error" type="boolean">
  When using <code>--parallel</code> or <code>--sequential</code>, continue running other scripts when one fails
</ParamField>

### Runtime & Process Control

<ParamField path="--bun" type="boolean">
  Force a script or package to use Bun's runtime instead of Node.js (via symlinking node). Alias: <code>-b</code>
</ParamField>

<ParamField path="--shell" type="string">
  Control the shell used for <code>package.json</code> scripts. Supports either <code>bun</code> or <code>system</code>
</ParamField>

<ParamField path="--smol" type="boolean">
  Use less memory, but run garbage collection more often
</ParamField>

<ParamField path="--expose-gc" type="boolean">
  Expose <code>gc()</code> on the global object. Has no effect on <code>Bun.gc()</code>
</ParamField>

<ParamField path="--no-deprecation" type="boolean">
  Suppress all reporting of the custom deprecation
</ParamField>

<ParamField path="--throw-deprecation" type="boolean">
  Determine whether or not deprecation warnings result in errors
</ParamField>

<ParamField path="--title" type="string">
  Set the process title
</ParamField>

<ParamField path="--zero-fill-buffers" type="boolean">
  Boolean to force <code>Buffer.allocUnsafe(size)</code> to be zero-filled
</ParamField>

<ParamField path="--no-addons" type="boolean">
  Throw an error if <code>process.dlopen</code> is called, and disable export condition <code>node-addons</code>
</ParamField>

<ParamField path="--unhandled-rejections" type="string">
  One of <code>strict</code>, <code>throw</code>, <code>warn</code>, <code>none</code>, or{" "}
  <code>warn-with-error-code</code>
</ParamField>

<ParamField path="--console-depth" type="number" default="2">
  Set the default depth for <code>console.log</code> object inspection (default: 2)
</ParamField>

### Development Workflow

<ParamField path="--watch" type="boolean">
  Automatically restart the process on file change
</ParamField>

<ParamField path="--hot" type="boolean">
  Enable auto reload in the Bun runtime, test runner, or bundler
</ParamField>

<ParamField path="--no-clear-screen" type="boolean">
  Disable clearing the terminal screen on reload when --hot or --watch is enabled
</ParamField>

### Debugging

<ParamField path="--inspect" type="string">
  Activate Bun's debugger
</ParamField>

<ParamField path="--inspect-wait" type="string">
  Activate Bun's debugger, wait for a connection before executing
</ParamField>

<ParamField path="--inspect-brk" type="string">
  Activate Bun's debugger, set breakpoint on first line of code and wait
</ParamField>

### Dependency & Module Resolution

<ParamField path="--preload" type="string">
  Import a module before other modules are loaded. Alias: <code>-r</code>
</ParamField>

<ParamField path="--require" type="string">
  Alias of --preload, for Node.js compatibility
</ParamField>

<ParamField path="--import" type="string">
  Alias of --preload, for Node.js compatibility
</ParamField>

<ParamField path="--no-install" type="boolean">
  Disable auto install in the Bun runtime
</ParamField>

<ParamField path="--install" type="string" default="auto">
  Configure auto-install behavior. One of <code>auto</code> (default, auto-installs when no node\_modules),{" "}
  <code>fallback</code> (missing packages only), <code>force</code> (always)
</ParamField>

<ParamField path="-i" type="boolean">
  Auto-install dependencies during execution. Equivalent to --install=fallback
</ParamField>

<ParamField path="--prefer-offline" type="boolean">
  Skip staleness checks for packages in the Bun runtime and resolve from disk
</ParamField>

<ParamField path="--prefer-latest" type="boolean">
  Use the latest matching versions of packages in the Bun runtime, always checking npm
</ParamField>

<ParamField path="--conditions" type="string">
  Pass custom conditions to resolve
</ParamField>

<ParamField path="--main-fields" type="string">
  Main fields to lookup in <code>package.json</code>. Defaults to --target dependent
</ParamField>

<ParamField path="--preserve-symlinks" type="boolean">
  Preserve symlinks when resolving files
</ParamField>

<ParamField path="--preserve-symlinks-main" type="boolean">
  Preserve symlinks when resolving the main entry point
</ParamField>

<ParamField path="--extension-order" type="string" default=".tsx,.ts,.jsx,.js,.json">
  Defaults to: <code>.tsx,.ts,.jsx,.js,.json</code>
</ParamField>

### Transpilation & Language Features

<ParamField path="--tsconfig-override" type="string">
  Specify custom <code>tsconfig.json</code>. Default <code>\$cwd/tsconfig.json</code>
</ParamField>

<ParamField path="--define" type="string">
  Substitute K:V while parsing, e.g. <code>--define process.env.NODE\_ENV:"development"</code>. Values are parsed as
  JSON. Alias: <code>-d</code>
</ParamField>

<ParamField path="--drop" type="string">
  Remove function calls, e.g. <code>--drop=console</code> removes all <code>console.\*</code> calls
</ParamField>

<ParamField path="--loader" type="string">
  Parse files with <code>.ext:loader</code>, e.g. <code>--loader .js:jsx</code>. Valid loaders: <code>js</code>,{" "}
  <code>jsx</code>, <code>ts</code>, <code>tsx</code>, <code>json</code>, <code>toml</code>, <code>text</code>,{" "}
  <code>file</code>, <code>wasm</code>, <code>napi</code>. Alias: <code>-l</code>
</ParamField>

<ParamField path="--no-macros" type="boolean">
  Disable macros from being executed in the bundler, transpiler and runtime
</ParamField>

<ParamField path="--jsx-factory" type="string">
  Changes the function called when compiling JSX elements using the classic JSX runtime
</ParamField>

<ParamField path="--jsx-fragment" type="string">
  Changes the function called when compiling JSX fragments
</ParamField>

<ParamField path="--jsx-import-source" type="string" default="react">
  Declares the module specifier to be used for importing the jsx and jsxs factory functions. Default: <code>react</code>
</ParamField>

<ParamField path="--jsx-runtime" type="string" default="automatic">
  <code>automatic</code> (default) or <code>classic</code>
</ParamField>

<ParamField path="--jsx-side-effects" type="boolean">
  Treat JSX elements as having side effects (disable pure annotations)
</ParamField>

<ParamField path="--ignore-dce-annotations" type="boolean">
  Ignore tree-shaking annotations such as <code>@**PURE**</code>
</ParamField>

### Networking & Security

<ParamField path="--port" type="number">
  Set the default port for <code>Bun.serve</code>
</ParamField>

<ParamField path="--fetch-preconnect" type="string">
  Preconnect to a URL while code is loading
</ParamField>

<ParamField path="--max-http-header-size" type="number" default="16384">
  Set the maximum size of HTTP headers in bytes. Default is 16KiB
</ParamField>

<ParamField path="--dns-result-order" type="string" default="verbatim">
  Set the default order of DNS lookup results. Valid orders: <code>verbatim</code> (default), <code>ipv4first</code>,{" "}
  <code>ipv6first</code>
</ParamField>

<ParamField path="--use-system-ca" type="boolean">
  Use the system's trusted certificate authorities
</ParamField>

<ParamField path="--use-openssl-ca" type="boolean">
  Use OpenSSL's default CA store
</ParamField>

<ParamField path="--use-bundled-ca" type="boolean">
  Use bundled CA store
</ParamField>

<ParamField path="--redis-preconnect" type="boolean">
  Preconnect to <code>\$REDIS\_URL</code> at startup
</ParamField>

<ParamField path="--sql-preconnect" type="boolean">
  Preconnect to PostgreSQL at startup
</ParamField>

<ParamField path="--user-agent" type="string">
  Set the default User-Agent header for HTTP requests
</ParamField>

### Global Configuration & Context

<ParamField path="--env-file" type="string">
  Load environment variables from the specified file(s)
</ParamField>

<ParamField path="--cwd" type="string">
  Absolute path to resolve files & entry points from. This just changes the process' cwd
</ParamField>

<ParamField path="--config" type="string">
  Specify path to Bun config file. Default <code>\$cwd/bunfig.toml</code>. Alias: <code>-c</code>
</ParamField>

## Examples

Run a JavaScript or TypeScript file:

```bash  theme={"theme":{"light":"github-light","dark":"dracula"}}
bun run ./index.js
bun run ./index.tsx
```

Run a package.json script:

```bash  theme={"theme":{"light":"github-light","dark":"dracula"}}
bun run dev
bun run lint
```
