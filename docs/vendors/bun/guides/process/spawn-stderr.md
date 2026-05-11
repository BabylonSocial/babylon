> ## Documentation Index
> Fetch the complete documentation index at: https://bun.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Read stderr from a child process

When using [`Bun.spawn()`](/runtime/child-process), the child process inherits the `stderr` of the spawning process. If instead you'd prefer to read and handle `stderr`, set the `stderr` option to `"pipe"`.

```ts  theme={"theme":{"light":"github-light","dark":"dracula"}}
const proc = Bun.spawn(["echo", "hello"], {
  stderr: "pipe",
});

proc.stderr; // => ReadableStream
```

***

To read `stderr` until the child process exits, use .text()

```ts  theme={"theme":{"light":"github-light","dark":"dracula"}}
const proc = Bun.spawn(["echo", "hello"], {
  stderr: "pipe",
});

const errors: string = await proc.stderr.text();
if (errors) {
  // handle errors
}
```

***

See [Docs > API > Child processes](/runtime/child-process) for complete documentation.
