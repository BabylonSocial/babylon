> ## Documentation Index
> Fetch the complete documentation index at: https://bun.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Read stdout from a child process

When using [`Bun.spawn()`](/runtime/child-process), the `stdout` of the child process can be consumed as a `ReadableStream` via `proc.stdout`.

```ts  theme={"theme":{"light":"github-light","dark":"dracula"}}
const proc = Bun.spawn(["echo", "hello"]);

const output = await proc.stdout.text();
output; // => "hello"
```

***

To instead pipe the `stdout` of the child process to `stdout` of the parent process, set "inherit".

```ts  theme={"theme":{"light":"github-light","dark":"dracula"}}
const proc = Bun.spawn(["echo", "hello"], {
  stdout: "inherit",
});
```

***

See [Docs > API > Child processes](/runtime/child-process) for complete documentation.
