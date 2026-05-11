> ## Documentation Index
> Fetch the complete documentation index at: https://bun.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Install a package under a different name

To install an npm package under an alias:

```sh terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
bun add my-custom-name@npm:zod
```

***

The `zod` package can now be imported as `my-custom-name`.

```ts index.ts icon="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/typescript.svg?fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=5d73d76daf7eb7b158469d8c30d349b0" theme={"theme":{"light":"github-light","dark":"dracula"}}
import { z } from "my-custom-name";

z.string();
```

***

See [Docs > Package manager](/pm/cli/install) for complete documentation of Bun's package manager.
