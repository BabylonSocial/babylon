> ## Documentation Index
> Fetch the complete documentation index at: https://bun.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Set environment variables

The current environment variables can be accessed via `process.env` or `Bun.env`.

```ts index.ts icon="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/typescript.svg?fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=5d73d76daf7eb7b158469d8c30d349b0" theme={"theme":{"light":"github-light","dark":"dracula"}}
Bun.env.API_TOKEN; // => "secret"
process.env.API_TOKEN; // => "secret"
```

***

Set these variables in a `.env` file.

Bun reads the following files automatically (listed in order of increasing precedence).

* `.env`
* `.env.production`, `.env.development`, `.env.test` (depending on value of `NODE_ENV`)
* `.env.local` (not loaded when `NODE_ENV=test`)

```ini .env icon="settings" theme={"theme":{"light":"github-light","dark":"dracula"}}
FOO=hello
BAR=world
```

***

Variables can also be set via the command line.

<CodeGroup>
  ```sh Linux/macOS icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
  FOO=helloworld bun run dev
  ```

  ```sh Windows icon="windows" theme={"theme":{"light":"github-light","dark":"dracula"}}
  # Using CMD
  set FOO=helloworld && bun run dev

  # Using PowerShell
  $env:FOO="helloworld"; bun run dev
  ```
</CodeGroup>

***

See [Docs > Runtime > Environment variables](/runtime/environment-variables) for more information on using environment variables with Bun.
