> ## Documentation Index
> Fetch the complete documentation index at: https://bun.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Sleep for a fixed number of milliseconds

The `Bun.sleep` method provides a convenient way to create a void `Promise` that resolves in a fixed number of milliseconds.

```ts  theme={"theme":{"light":"github-light","dark":"dracula"}}
// sleep for 1 second
await Bun.sleep(1000);
```

***

Internally, this is equivalent to the following snippet that uses [`setTimeout`](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/setTimeout).

```ts  theme={"theme":{"light":"github-light","dark":"dracula"}}
await new Promise(resolve => setTimeout(resolve, ms));
```

***

See [Docs > API > Utils](/runtime/utils) for more useful utilities.
