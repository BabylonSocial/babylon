> ## Documentation Index
> Fetch the complete documentation index at: https://bun.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Detect when code is executed with Bun

The recommended way to detect when code is being executed with Bun is to check `process.versions.bun`. This works in both JavaScript and TypeScript without requiring any additional type definitions.

```ts  theme={"theme":{"light":"github-light","dark":"dracula"}}
if (process.versions.bun) {
  // this code will only run when the file is run with Bun
}
```

***

Alternatively, you can check for the existence of the `Bun` global. This is similar to how you'd check for the existence of the `window` variable to detect when code is being executed in a browser.

<Note>
  This approach will result in a type error in TypeScript unless `@types/bun` is installed. You can install it with `bun
    add -d @types/bun`.
</Note>

```ts  theme={"theme":{"light":"github-light","dark":"dracula"}}
if (typeof Bun !== "undefined") {
  // this code will only run when the file is run with Bun
}
```
