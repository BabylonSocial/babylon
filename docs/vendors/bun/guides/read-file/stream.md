> ## Documentation Index
> Fetch the complete documentation index at: https://bun.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Read a file as a ReadableStream

The `Bun.file()` function accepts a path and returns a `BunFile` instance. The `BunFile` class extends `Blob` and allows you to lazily read the file in a variety of formats. Use `.stream()` to consume the file incrementally as a `ReadableStream`.

```ts  theme={"theme":{"light":"github-light","dark":"dracula"}}
const path = "/path/to/package.json";
const file = Bun.file(path);

const stream = file.stream();
```

***

The chunks of the stream can be consumed as an [async iterable](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols#the_async_iterator_and_async_iterable_protocols) using `for await`.

```ts  theme={"theme":{"light":"github-light","dark":"dracula"}}
for await (const chunk of stream) {
  chunk; // => Uint8Array
}
```

***

Refer to the [Streams](/runtime/streams) documentation for more information on working with streams in Bun.
