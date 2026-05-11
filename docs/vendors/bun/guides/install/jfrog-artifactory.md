> ## Documentation Index
> Fetch the complete documentation index at: https://bun.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Using bun install with Artifactory

[JFrog Artifactory](https://jfrog.com/artifactory/) is a package management system for npm, Docker, Maven, NuGet, Ruby, Helm, and more. It allows you to host your own private npm registry, npm packages, and other types of packages as well.

To use it with `bun install`, add a `bunfig.toml` file to your project with the following contents:

***

### Configure with bunfig.toml

Make sure to replace `MY_SUBDOMAIN` with your JFrog Artifactory subdomain, such as `jarred1234` and MY\_TOKEN with your JFrog Artifactory token.

```toml bunfig.toml icon="settings" theme={"theme":{"light":"github-light","dark":"dracula"}}
[install.registry]
url = "https://MY_SUBDOMAIN.jfrog.io/artifactory/api/npm/npm/_auth=MY_TOKEN"
# You can use an environment variable here
# url = "$NPM_CONFIG_REGISTRY"
```

***

### Configure with `$NPM_CONFIG_REGISTRY`

Like with npm, you can use the `NPM_CONFIG_REGISTRY` environment variable to configure JFrog Artifactory with bun install.
