> ## Documentation Index
> Fetch the complete documentation index at: https://bun.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# bun info

> Display package metadata from the npm registry

`bun info` displays package metadata from the npm registry.

## Usage

```bash terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
bun info react
```

This will display information about the `react` package, including its latest version, description, homepage, dependencies, and more.

## Viewing specific versions

To view information about a specific version:

```bash terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
bun info react@18.0.0
```

## Viewing specific properties

You can also query specific properties from the package metadata:

```bash terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
bun info react version
bun info react dependencies
bun info react repository.url
```

## JSON output

To get the output in JSON format, use the `--json` flag:

```bash terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
bun info react --json
```

## Alias

`bun pm view` is an alias for `bun info`:

```bash terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
bun pm view react  # equivalent to: bun info react
```

## Examples

```bash terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
# View basic package information
bun info is-number

# View a specific version
bun info is-number@7.0.0

# View all available versions
bun info is-number versions

# View package dependencies
bun info express dependencies

# View package homepage
bun info lodash homepage

# Get JSON output
bun info react --json
```
