> ## Documentation Index
> Fetch the complete documentation index at: https://bun.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Read a file as a string

The `Bun.file()` function accepts a path and returns a `BunFile` instance. The `BunFile` class extends `Blob` and allows you to lazily read the file in a variety of formats. Use `.text()` to read the contents as a string.

```ts  theme={"theme":{"light":"github-light","dark":"dracula"}}
const path = "/path/to/file.txt";
const file = Bun.file(path);

const text = await file.text();
// string
```

***

Any relative paths will be resolved relative to the project root (the nearest directory containing a `package.json` file).

```ts  theme={"theme":{"light":"github-light","dark":"dracula"}}
const path = "./file.txt";
const file = Bun.file(path);
```
