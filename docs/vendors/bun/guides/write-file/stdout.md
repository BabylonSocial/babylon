> ## Documentation Index
> Fetch the complete documentation index at: https://bun.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Write to stdout

The `console.log` function writes to `stdout`. It will automatically append a line break at the end of the printed data.

```ts  theme={"theme":{"light":"github-light","dark":"dracula"}}
console.log("Lorem ipsum");
```

***

For more advanced use cases, Bun exposes `stdout` as a `BunFile` via the `Bun.stdout` property. This can be used as a destination for [`Bun.write()`](/runtime/file-io#writing-files-bun-write).

```ts  theme={"theme":{"light":"github-light","dark":"dracula"}}
await Bun.write(Bun.stdout, "Lorem ipsum");
```

***

See [Docs > API > File I/O](/runtime/file-io#writing-files-bun-write) for complete documentation of `Bun.write()`.
