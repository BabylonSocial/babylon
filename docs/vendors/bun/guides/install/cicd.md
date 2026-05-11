> ## Documentation Index
> Fetch the complete documentation index at: https://bun.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Install dependencies with Bun in GitHub Actions

Use the official [`setup-bun`](https://github.com/oven-sh/setup-bun) GitHub Action to install `bun` in your GitHub Actions runner.

```yaml workflow.yml icon="file-code" theme={"theme":{"light":"github-light","dark":"dracula"}}
title: my-workflow
jobs:
  my-job:
    title: my-job
    runs-on: ubuntu-latest
    steps:
      # ...
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2 // [!code ++]

      # run any `bun` or `bunx` command
      - run: bun install // [!code ++]
```

***

To specify a version of Bun to install:

```yaml workflow.yml icon="file-code" theme={"theme":{"light":"github-light","dark":"dracula"}}
title: my-workflow
jobs:
  my-job:
    title: my-job
    runs-on: ubuntu-latest
    steps:
      # ...
      - uses: oven-sh/setup-bun@v2
         with: # [!code ++]
          version: "latest" # or "canary" # [!code ++]
```

***

Refer to the [README.md](https://github.com/oven-sh/setup-bun) for complete documentation of the `setup-bun` GitHub Action.
