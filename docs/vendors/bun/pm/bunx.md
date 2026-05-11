> ## Documentation Index
> Fetch the complete documentation index at: https://bun.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# bunx

> Run packages from npm

<Note>`bunx` is an alias for `bun x`. The `bunx` CLI will be auto-installed when you install `bun`.</Note>

Use `bunx` to auto-install and run packages from `npm`. It's Bun's equivalent of `npx` or `yarn dlx`.

```bash terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
bunx cowsay "Hello world!"
```

<Note>
  ⚡️ **Speed** — With Bun's fast startup times, `bunx` is [roughly 100x
  faster](https://twitter.com/jarredsumner/status/1606163655527059458) than `npx` for locally installed packages.
</Note>

Packages can declare executables in the `"bin"` field of their `package.json`. These are known as *package executables* or *package binaries*.

```json package.json icon="file-json" theme={"theme":{"light":"github-light","dark":"dracula"}}
{
  // ... other fields
  "name": "my-cli",
  "bin": {
    "my-cli": "dist/index.js"
  }
}
```

These executables are commonly plain JavaScript files marked with a [shebang line](https://en.wikipedia.org/wiki/Shebang_\(Unix\)) to indicate which program should be used to execute them. The following file indicates that it should be executed with `node`.

```js dist/index.js icon="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/javascript.svg?fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=dd7b5268d2e9410910a69804de702737" theme={"theme":{"light":"github-light","dark":"dracula"}}
#!/usr/bin/env node

console.log("Hello world!");
```

These executables can be run with `bunx`,

```bash terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
bunx my-cli
```

As with `npx`, `bunx` will check for a locally installed package first, then fall back to auto-installing the package from `npm`. Installed packages will be stored in Bun's global cache for future use.

## Arguments and flags

To pass additional command-line flags and arguments through to the executable, place them after the executable name.

```bash terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
bunx my-cli --foo bar
```

***

## Shebangs

By default, Bun respects shebangs. If an executable is marked with `#!/usr/bin/env node`, Bun will spin up a `node` process to execute the file. However, in some cases it may be desirable to run executables using Bun's runtime, even if the executable indicates otherwise. To do so, include the `--bun` flag.

```bash terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
bunx --bun my-cli
```

The `--bun` flag must occur *before* the executable name. Flags that appear *after* the name are passed through to the executable.

```bash terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
bunx --bun my-cli # good
bunx my-cli --bun # bad
```

## Package flag

**`--package <pkg>` or `-p <pkg>`** - Run binary from specific package. Useful when binary name differs from package name:

```bash terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
bunx -p renovate renovate-config-validator
bunx --package @angular/cli ng
```

To force bun to always be used with a script, use a shebang.

```js dist/index.js icon="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/javascript.svg?fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=dd7b5268d2e9410910a69804de702737" theme={"theme":{"light":"github-light","dark":"dracula"}}
#!/usr/bin/env bun
```

***

## Usage

```bash  theme={"theme":{"light":"github-light","dark":"dracula"}}
bunx [flags] <package>[@version] [flags and arguments for the package]
```

Execute an npm package executable (CLI), automatically installing into a global shared cache if not installed in `node_modules`.

### Flags

<ParamField path="--bun" type="boolean">
  Force the command to run with Bun instead of Node.js, even if the executable contains a Node shebang (`#!/usr/bin/env
    node`)
</ParamField>

<ParamField path="-p, --package" type="string">
  Specify package to install when binary name differs from package name
</ParamField>

<ParamField path="--no-install" type="boolean">
  Skip installation if package is not already installed
</ParamField>

<ParamField path="--verbose" type="boolean">
  Enable verbose output during installation
</ParamField>

<ParamField path="--silent" type="boolean">
  Suppress output during installation
</ParamField>

### Examples

```bash terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
# Run Prisma migrations
bunx prisma migrate

# Format a file with Prettier
bunx prettier foo.js

# Run a specific version of a package
bunx uglify-js@3.14.0 app.js

# Use --package when binary name differs from package name
bunx -p @angular/cli ng new my-app

# Force running with Bun instead of Node.js, even if the executable contains a Node shebang
bunx --bun vite dev foo.js
```
