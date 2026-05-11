> ## Documentation Index
> Fetch the complete documentation index at: https://bun.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Convert an ArrayBuffer to a Buffer

The Node.js [`Buffer`](https://nodejs.org/api/buffer.html) API predates the introduction of `ArrayBuffer` into the JavaScript language. Bun implements both.

Use the static `Buffer.from()` method to create a `Buffer` from an `ArrayBuffer`.

```ts  theme={"theme":{"light":"github-light","dark":"dracula"}}
const arrBuffer = new ArrayBuffer(64);
const nodeBuffer = Buffer.from(arrBuffer);
```

***

To create a `Buffer` that only views a portion of the underlying buffer, pass the offset and length to the constructor.

```ts  theme={"theme":{"light":"github-light","dark":"dracula"}}
const arrBuffer = new ArrayBuffer(64);
const nodeBuffer = Buffer.from(arrBuffer, 0, 16); // view first 16 bytes
```

***

See [Docs > API > Binary Data](/runtime/binary-data#conversion) for complete documentation on manipulating binary data with Bun.
