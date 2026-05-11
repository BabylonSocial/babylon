> ## Documentation Index
> Fetch the complete documentation index at: https://bun.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Streaming HTTP Server with Async Iterators

In Bun, [`Response`](https://developer.mozilla.org/en-US/docs/Web/API/Response) objects can accept an async generator function as their body. This allows you to stream data to the client as it becomes available, rather than waiting for the entire response to be ready.

```ts stream-iterator.ts icon="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/typescript.svg?fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=5d73d76daf7eb7b158469d8c30d349b0" theme={"theme":{"light":"github-light","dark":"dracula"}}
Bun.serve({
  port: 3000,
  fetch(req) {
    return new Response(
      // An async generator function
      async function* () {
        yield "Hello, ";
        await Bun.sleep(100);
        yield "world!";

        // you can also yield a TypedArray or Buffer
        yield new Uint8Array(["\n".charCodeAt(0)]);
      },
      { headers: { "Content-Type": "text/plain" } },
    );
  },
});
```

***

You can pass any async iterable directly to `Response`:

```ts stream-iterator.ts icon="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/typescript.svg?fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=5d73d76daf7eb7b158469d8c30d349b0" theme={"theme":{"light":"github-light","dark":"dracula"}}
Bun.serve({
  port: 3000,
  fetch(req) {
    return new Response(
      {
        [Symbol.asyncIterator]: async function* () {
          yield "Hello, ";
          await Bun.sleep(100);
          yield "world!";
        },
      },
      { headers: { "Content-Type": "text/plain" } },
    );
  },
});
```
