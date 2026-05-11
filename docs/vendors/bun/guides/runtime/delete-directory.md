> ## Documentation Index
> Fetch the complete documentation index at: https://bun.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Delete directories

To recursively delete a directory and all its contents, use `rm` from `node:fs/promises`. This is like running `rm -rf` in JavaScript.

```ts delete-directory.ts icon="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/typescript.svg?fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=5d73d76daf7eb7b158469d8c30d349b0" theme={"theme":{"light":"github-light","dark":"dracula"}}
import { rm } from "node:fs/promises";

// Delete a directory and all its contents
await rm("path/to/directory", { recursive: true, force: true });
```

***

These options configure the deletion behavior:

* `recursive: true` - Delete subdirectories and their contents
* `force: true` - Don't throw errors if the directory doesn't exist

You can also use it without `force` to ensure the directory exists:

```ts delete-directory.ts icon="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/typescript.svg?fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=5d73d76daf7eb7b158469d8c30d349b0" theme={"theme":{"light":"github-light","dark":"dracula"}}
try {
  await rm("path/to/directory", { recursive: true });
} catch (error) {
  if (error.code === "ENOENT") {
    console.log("Directory doesn't exist");
  } else {
    throw error;
  }
}
```

***

See [Docs > API > FileSystem](/runtime/file-io) for more filesystem operations.
