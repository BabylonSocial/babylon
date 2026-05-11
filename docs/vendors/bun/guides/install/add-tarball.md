> ## Documentation Index
> Fetch the complete documentation index at: https://bun.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Add a tarball dependency

Bun's package manager can install any publicly available tarball URL as a dependency of your project.

```sh terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
bun add zod@https://registry.npmjs.org/zod/-/zod-3.21.4.tgz
```

***

Running this command will download, extract, and install the tarball to your project's `node_modules` directory. It will also add the following line to your `package.json`:

```json package.json icon="file-json" theme={"theme":{"light":"github-light","dark":"dracula"}}
{
  "dependencies": {
    "zod": "https://registry.npmjs.org/zod/-/zod-3.21.4.tgz" // [!code ++]
  }
}
```

***

The package `"zod"` can now be imported as usual.

```ts  theme={"theme":{"light":"github-light","dark":"dracula"}}
import { z } from "zod";
```

***

See [Docs > Package manager](/pm/cli/install) for complete documentation of Bun's package manager.
