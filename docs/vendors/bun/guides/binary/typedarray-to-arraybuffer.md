> ## Documentation Index
> Fetch the complete documentation index at: https://bun.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Convert a Uint8Array to an ArrayBuffer

A [`Uint8Array`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array) is a *typed array* class, meaning it is a mechanism for viewing data in an underlying `ArrayBuffer`. The underlying `ArrayBuffer` is accessible via the `buffer` property.

```ts  theme={"theme":{"light":"github-light","dark":"dracula"}}
const arr = new Uint8Array(64);
arr.buffer; // => ArrayBuffer(64)
```

***

The `Uint8Array` may be a view over a *subset* of the data in the underlying `ArrayBuffer`. In this case, the `buffer` property will return the entire buffer, and the `byteOffset` and `byteLength` properties will indicate the subset.

```ts  theme={"theme":{"light":"github-light","dark":"dracula"}}
const arr = new Uint8Array(64, 16, 32);
arr.buffer; // => ArrayBuffer(64)
arr.byteOffset; // => 16
arr.byteLength; // => 32
```

***

See [Docs > API > Binary Data](/runtime/binary-data#conversion) for complete documentation on manipulating binary data with Bun.
