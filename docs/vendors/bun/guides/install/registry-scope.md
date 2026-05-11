> ## Documentation Index
> Fetch the complete documentation index at: https://bun.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Configure a private registry for an organization scope with bun install

Private registries can be configured using either [`.npmrc`](/pm/npmrc) or [`bunfig.toml`](/runtime/bunfig#install-registry). While both are supported, we recommend using **bunfig.toml** for enhanced flexibility and Bun-specific options.

To configure a registry for a particular npm scope:

```toml bunfig.toml icon="settings" theme={"theme":{"light":"github-light","dark":"dracula"}}
[install.scopes]
# as a string
"@myorg1" = "https://usertitle:password@registry.myorg.com/"

# as an object with username/password
# you can reference environment variables
"@myorg2" = {
  username = "myusername",
  password = "$npm_pass",
  url = "https://registry.myorg.com/"
}

# as an object with token
"@myorg3" = { token = "$npm_token", url = "https://registry.myorg.com/" }

```

***

Your `bunfig.toml` can reference environment variables. Bun automatically loads environment variables from `.env.local`, `.env.[NODE_ENV]`, and `.env`. See [Docs > Environment variables](/runtime/environment-variables) for more information.

```toml bunfig.toml icon="settings" theme={"theme":{"light":"github-light","dark":"dracula"}}
[install.scopes]
"@myorg3" = { token = "$npm_token", url = "https://registry.myorg.com/" }
```

***

See [Docs > Package manager](/pm/cli/install) for complete documentation of Bun's package manager.
