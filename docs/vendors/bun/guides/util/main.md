> ## Documentation Index
> Fetch the complete documentation index at: https://bun.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Get the absolute path to the current entrypoint

The `Bun.main` property contains the absolute path to the current entrypoint.

<CodeGroup>
  ```ts foo.ts icon="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/typescript.svg?fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=5d73d76daf7eb7b158469d8c30d349b0" theme={"theme":{"light":"github-light","dark":"dracula"}}
  console.log(Bun.main);
  ```

  ```ts index.ts icon="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/typescript.svg?fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=5d73d76daf7eb7b158469d8c30d349b0" theme={"theme":{"light":"github-light","dark":"dracula"}}
  import "./foo.ts";
  ```
</CodeGroup>

***

The printed path corresponds to the file that is executed with `bun run`.

```sh terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
bun run index.ts
```

```txt  theme={"theme":{"light":"github-light","dark":"dracula"}}
/path/to/index.ts
```

```sh terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
bun run foo.ts
```

```txt  theme={"theme":{"light":"github-light","dark":"dracula"}}
/path/to/foo.ts
```

***

See [Docs > API > Utils](/runtime/utils) for more useful utilities.
