> ## Documentation Index
> Fetch the complete documentation index at: https://bun.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Write a string to a file

This code snippet writes a string to disk at a particular *absolute path*.

It uses the fast [`Bun.write()`](/runtime/file-io#writing-files-bun-write) API to efficiently write data to disk. The first argument is a *destination*; the second is the *data* to write.

```ts  theme={"theme":{"light":"github-light","dark":"dracula"}}
const path = "/path/to/file.txt";
await Bun.write(path, "Lorem ipsum");
```

***

Any relative paths will be resolved relative to the project root (the nearest directory containing a `package.json` file).

```ts  theme={"theme":{"light":"github-light","dark":"dracula"}}
const path = "./file.txt";
await Bun.write(path, "Lorem ipsum");
```

***

You can pass a `BunFile` as the destination. `Bun.write()` will write the data to its associated path.

```ts  theme={"theme":{"light":"github-light","dark":"dracula"}}
const path = Bun.file("./file.txt");
await Bun.write(path, "Lorem ipsum");
```

***

`Bun.write()` returns the number of bytes written to disk.

```ts  theme={"theme":{"light":"github-light","dark":"dracula"}}
const path = "./file.txt";
const bytes = await Bun.write(path, "Lorem ipsum");
// => 11
```

***

See [Docs > API > File I/O](/runtime/file-io#writing-files-bun-write) for complete documentation of `Bun.write()`.
