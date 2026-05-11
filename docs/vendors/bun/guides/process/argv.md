> ## Documentation Index
> Fetch the complete documentation index at: https://bun.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Parse command-line arguments

The *argument vector* is the list of arguments passed to the program when it is run. It is available as `Bun.argv`.

```ts cli.ts icon="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/typescript.svg?fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=5d73d76daf7eb7b158469d8c30d349b0" theme={"theme":{"light":"github-light","dark":"dracula"}}
console.log(Bun.argv);
```

***

Running this file with arguments results in the following:

```sh terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
bun run cli.ts --flag1 --flag2 value
```

```txt  theme={"theme":{"light":"github-light","dark":"dracula"}}
[ '/path/to/bun', '/path/to/cli.ts', '--flag1', '--flag2', 'value' ]
```

***

To parse `argv` into a more useful format, `util.parseArgs` would be helpful.

Example:

```ts cli.ts icon="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/typescript.svg?fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=5d73d76daf7eb7b158469d8c30d349b0" theme={"theme":{"light":"github-light","dark":"dracula"}}
import { parseArgs } from "util";

const { values, positionals } = parseArgs({
  args: Bun.argv,
  options: {
    flag1: {
      type: "boolean",
    },
    flag2: {
      type: "string",
    },
  },
  strict: true,
  allowPositionals: true,
});

console.log(values);
console.log(positionals);
```

***

then it outputs

```sh terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
bun run cli.ts --flag1 --flag2 value
```

```txt  theme={"theme":{"light":"github-light","dark":"dracula"}}
{
  flag1: true,
  flag2: "value",
}
[ "/path/to/bun", "/path/to/cli.ts" ]
```
