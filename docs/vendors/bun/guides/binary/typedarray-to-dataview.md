> ## Documentation Index
> Fetch the complete documentation index at: https://bun.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Convert a Uint8Array to a DataView

A [`Uint8Array`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array) is a *typed array* class, meaning it is a mechanism for viewing data in an underlying `ArrayBuffer`. The following snippet creates a \[`DataView`] instance over the same range of data as the `Uint8Array`.

```ts  theme={"theme":{"light":"github-light","dark":"dracula"}}
const arr: Uint8Array = ...
const dv = new DataView(arr.buffer, arr.byteOffset, arr.byteLength);
```

***

See [Docs > API > Binary Data](/runtime/binary-data#conversion) for complete documentation on manipulating binary data with Bun.
