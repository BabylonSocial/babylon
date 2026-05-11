> ## Documentation Index
> Fetch the complete documentation index at: https://bun.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Write a ReadableStream to a file

To write a `ReadableStream` to disk, first create a `Response` instance from the stream. This `Response` can then be written to disk using [`Bun.write()`](/runtime/file-io#writing-files-bun-write).

```ts  theme={"theme":{"light":"github-light","dark":"dracula"}}
const stream: ReadableStream = ...;
const path = "./file.txt";
const response = new Response(stream);

await Bun.write(path, response);
```

***

See [Docs > API > File I/O](/runtime/file-io#writing-files-bun-write) for complete documentation of `Bun.write()`.
