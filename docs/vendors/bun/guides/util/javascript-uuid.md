> ## Documentation Index
> Fetch the complete documentation index at: https://bun.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Generate a UUID

Use `crypto.randomUUID()` to generate a UUID v4. This API works in Bun, Node.js, and browsers. It requires no dependencies.

```ts  theme={"theme":{"light":"github-light","dark":"dracula"}}
crypto.randomUUID();
// => "123e4567-e89b-42d3-a456-426614174000"
```

***

In Bun, you can also use `Bun.randomUUIDv7()` to generate a [UUID v7](https://www.ietf.org/archive/id/draft-peabody-dispatch-new-uuid-format-01.html).

```ts  theme={"theme":{"light":"github-light","dark":"dracula"}}
Bun.randomUUIDv7();
// => "0196a000-bb12-7000-905e-8039f5d5b206"
```

***

See [Docs > API > Utils](/runtime/utils) for more useful utilities.
