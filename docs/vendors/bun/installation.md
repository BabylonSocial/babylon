> ## Documentation Index
> Fetch the complete documentation index at: https://bun.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Installation

> Install Bun with npm, Homebrew, Docker, or the official script.

## Overview

Bun ships as a single, dependency-free executable. You can install it via script, package manager, or Docker across macOS, Linux, and Windows.

<Tip>After installation, verify with `bun --version` and `bun --revision`.</Tip>

## Installation

<Tabs>
  <Tab title="macOS & Linux">
    <CodeGroup>
      ```bash curl icon="globe" theme={"theme":{"light":"github-light","dark":"dracula"}}
      curl -fsSL https://bun.com/install | bash
      ```
    </CodeGroup>

    <Note>
      **Linux users**  The `unzip` package is required to install Bun. Use `sudo apt install unzip` to install the unzip package. Kernel version 5.6 or higher is strongly recommended, but the minimum is 5.1. Use `uname -r` to check Kernel version.
    </Note>
  </Tab>

  <Tab title="Windows">
    <CodeGroup>
      ```powershell PowerShell icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
      powershell -c "irm bun.sh/install.ps1|iex"
      ```
    </CodeGroup>

    <Warning>
      Bun requires Windows 10 version 1809 or later.
    </Warning>

    For support and discussion, please join the **#windows** channel on our [Discord](https://bun.com/discord).
  </Tab>

  <Tab title="Package Managers">
    <CodeGroup>
      ```bash npm icon="npm" theme={"theme":{"light":"github-light","dark":"dracula"}}
      npm install -g bun # the last `npm` command you'll ever need
      ```

      ```bash Homebrew icon="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/homebrew.svg?fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=5c6dc69e5e0d20fb807fba0a9cd45023" theme={"theme":{"light":"github-light","dark":"dracula"}}
      brew install oven-sh/bun/bun
      ```

      ```bash Scoop icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
      scoop install bun
      ```
    </CodeGroup>
  </Tab>

  <Tab title="Docker">
    Bun provides a Docker image that supports both Linux x64 and arm64.

    ```bash Docker icon="docker" theme={"theme":{"light":"github-light","dark":"dracula"}}
    docker pull oven/bun
    docker run --rm --init --ulimit memlock=-1:-1 oven/bun
    ```

    ### Image Variants

    There are also image variants for different operating systems:

    ```bash Docker icon="docker" theme={"theme":{"light":"github-light","dark":"dracula"}}
    docker pull oven/bun:debian
    docker pull oven/bun:slim
    docker pull oven/bun:distroless
    docker pull oven/bun:alpine
    ```
  </Tab>
</Tabs>

To check that Bun was installed successfully, open a new terminal window and run:

```bash terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
bun --version
# Output: 1.x.y

# See the precise commit of `oven-sh/bun` that you're using
bun --revision
# Output: 1.x.y+b7982ac13189
```

<Warning>
  If you've installed Bun but are seeing a `command not found` error, you may have to manually add the installation
  directory (`~/.bun/bin`) to your `PATH`.
</Warning>

<Accordion title="Add Bun to your PATH">
  <Tabs>
    <Tab title="macOS & Linux">
      <Steps>
        <Step title="Determine which shell you're using">
          ```bash terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
          echo $SHELL
          # /bin/zsh  or /bin/bash or /bin/fish
          ```
        </Step>

        <Step title="Open your shell configuration file">
          * For bash: `~/.bashrc`
          * For zsh: `~/.zshrc`
          * For fish: `~/.config/fish/config.fish`
        </Step>

        <Step title="Add the Bun directory to PATH">
          Add this line to your configuration file:

          ```bash terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
          export BUN_INSTALL="$HOME/.bun"
          export PATH="$BUN_INSTALL/bin:$PATH"
          ```
        </Step>

        <Step title="Reload your shell configuration">
          ```bash terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
          source ~/.bashrc  # or ~/.zshrc
          ```
        </Step>
      </Steps>
    </Tab>

    <Tab title="Windows">
      <Steps>
        <Step title="Determine if the bun binary is properly installed">
          ```bash terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
          & "$env:USERPROFILE\.bun\bin\bun" --version
          ```

          If the command runs successfully but `bun --version` is not recognized, it means that bun is not in your system's PATH. To fix this, open a Powershell terminal and run the following command:

          ```bash terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
          [System.Environment]::SetEnvironmentVariable(
            "Path",
            [System.Environment]::GetEnvironmentVariable("Path", "User") + ";$env:USERPROFILE\.bun\bin",
            [System.EnvironmentVariableTarget]::User
          )
          ```
        </Step>

        <Step title="Restart your terminal">
          After running the command, restart your terminal and test with `bun --version`

          ```bash terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
          bun --version
          ```
        </Step>
      </Steps>
    </Tab>
  </Tabs>
</Accordion>

***

## Upgrading

Once installed, the binary can upgrade itself:

```bash terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
bun upgrade
```

<Tip>
  **Homebrew users** <br />
  To avoid conflicts with Homebrew, use `brew upgrade bun` instead.

  **Scoop users** <br />
  To avoid conflicts with Scoop, use `scoop update bun` instead.
</Tip>

***

## Canary Builds

[-> View canary build](https://github.com/oven-sh/bun/releases/tag/canary)

Bun automatically releases an (untested) canary build on every commit to main. To upgrade to the latest canary build:

```bash terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
# Upgrade to latest canary
bun upgrade --canary

# Switch back to stable
bun upgrade --stable
```

The canary build is useful for testing new features and bug fixes before they're released in a stable build. To help the Bun team fix bugs faster, canary builds automatically upload crash reports to Bun's team.

***

## Installing Older Versions

Since Bun is a single binary, you can install older versions by re-running the installer script with a specific version.

<Tabs>
  <Tab title="Linux & macOS">
    To install a specific version, pass the git tag to the install script:

    ```bash terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
    curl -fsSL https://bun.com/install | bash -s "bun-v1.3.3"
    ```
  </Tab>

  <Tab title="Windows">
    On Windows, pass the version number to the PowerShell install script:

    ```powershell PowerShell icon="windows" theme={"theme":{"light":"github-light","dark":"dracula"}}
    iex "& {$(irm https://bun.com/install.ps1)} -Version 1.3.3"
    ```
  </Tab>
</Tabs>

***

## Direct Downloads

To download Bun binaries directly, visit the [releases page on GitHub](https://github.com/oven-sh/bun/releases).

### Latest Version Downloads

<CardGroup cols={2}>
  <Card icon="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/linux.svg?fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=dd592a34657ecfae61ac4f30614fdce7" title="Linux x64" href="https://github.com/oven-sh/bun/releases/latest/download/bun-linux-x64.zip" data-og-width="216" width="216" data-og-height="256" height="256" data-path="icons/linux.svg" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/linux.svg?w=280&fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=14221739bbddbb7111ed143f47706765 280w, https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/linux.svg?w=560&fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=f09e6c4af8dcef0bf3ebf76c37adb929 560w, https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/linux.svg?w=840&fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=e2dcd6d81b834c62cbdef969b0f7a384 840w, https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/linux.svg?w=1100&fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=b5fd4131a518d92a766e6c7c078801e3 1100w, https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/linux.svg?w=1650&fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=7b8cb702ff95c9113f926e294c2d1bd3 1650w, https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/linux.svg?w=2500&fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=16386d14d51f58fa9fed82ee7d81980a 2500w">
    Standard Linux x64 binary
  </Card>

  <Card icon="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/linux.svg?fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=dd592a34657ecfae61ac4f30614fdce7" title="Linux x64 Baseline" href="https://github.com/oven-sh/bun/releases/latest/download/bun-linux-x64-baseline.zip" data-og-width="216" width="216" data-og-height="256" height="256" data-path="icons/linux.svg" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/linux.svg?w=280&fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=14221739bbddbb7111ed143f47706765 280w, https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/linux.svg?w=560&fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=f09e6c4af8dcef0bf3ebf76c37adb929 560w, https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/linux.svg?w=840&fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=e2dcd6d81b834c62cbdef969b0f7a384 840w, https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/linux.svg?w=1100&fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=b5fd4131a518d92a766e6c7c078801e3 1100w, https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/linux.svg?w=1650&fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=7b8cb702ff95c9113f926e294c2d1bd3 1650w, https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/linux.svg?w=2500&fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=16386d14d51f58fa9fed82ee7d81980a 2500w">
    For older CPUs without AVX2
  </Card>

  <Card icon="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/windows.svg?fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=b5c6194cb0ee60e6bc5726f4df48b4a5" title="Windows x64" href="https://github.com/oven-sh/bun/releases/latest/download/bun-windows-x64.zip" data-og-width="88" width="88" data-og-height="88" height="88" data-path="icons/windows.svg" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/windows.svg?w=280&fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=671dd719ddfdd9f6926ada8aa2f0008f 280w, https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/windows.svg?w=560&fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=3e51448b42391982794ae3cb1e9653ce 560w, https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/windows.svg?w=840&fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=79091cd8bb160441e44affb1d0208756 840w, https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/windows.svg?w=1100&fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=3398cfe348b0418fccdc3eda3c5a56db 1100w, https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/windows.svg?w=1650&fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=9a10a13378f5194503c81ee62bcd2d16 1650w, https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/windows.svg?w=2500&fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=a05b3bd0f94f2af4e43cc86f44e7f92b 2500w">
    Standard Windows binary
  </Card>

  <Card icon="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/windows.svg?fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=b5c6194cb0ee60e6bc5726f4df48b4a5" title="Windows x64 Baseline" href="https://github.com/oven-sh/bun/releases/latest/download/bun-windows-x64-baseline.zip" data-og-width="88" width="88" data-og-height="88" height="88" data-path="icons/windows.svg" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/windows.svg?w=280&fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=671dd719ddfdd9f6926ada8aa2f0008f 280w, https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/windows.svg?w=560&fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=3e51448b42391982794ae3cb1e9653ce 560w, https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/windows.svg?w=840&fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=79091cd8bb160441e44affb1d0208756 840w, https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/windows.svg?w=1100&fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=3398cfe348b0418fccdc3eda3c5a56db 1100w, https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/windows.svg?w=1650&fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=9a10a13378f5194503c81ee62bcd2d16 1650w, https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/windows.svg?w=2500&fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=a05b3bd0f94f2af4e43cc86f44e7f92b 2500w">
    For older CPUs without AVX2
  </Card>

  <Card icon="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/windows.svg?fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=b5c6194cb0ee60e6bc5726f4df48b4a5" title="Windows ARM64" href="https://github.com/oven-sh/bun/releases/latest/download/bun-windows-aarch64.zip" data-og-width="88" width="88" data-og-height="88" height="88" data-path="icons/windows.svg" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/windows.svg?w=280&fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=671dd719ddfdd9f6926ada8aa2f0008f 280w, https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/windows.svg?w=560&fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=3e51448b42391982794ae3cb1e9653ce 560w, https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/windows.svg?w=840&fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=79091cd8bb160441e44affb1d0208756 840w, https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/windows.svg?w=1100&fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=3398cfe348b0418fccdc3eda3c5a56db 1100w, https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/windows.svg?w=1650&fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=9a10a13378f5194503c81ee62bcd2d16 1650w, https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/windows.svg?w=2500&fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=a05b3bd0f94f2af4e43cc86f44e7f92b 2500w">
    Windows on ARM (Snapdragon, etc.)
  </Card>

  <Card icon="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/apple.svg?fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=be745b4256bdcc762c03ec2d442e3045" title="macOS ARM64" href="https://github.com/oven-sh/bun/releases/latest/download/bun-darwin-aarch64.zip" data-og-width="842" width="842" data-og-height="1000" height="1000" data-path="icons/apple.svg" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/apple.svg?w=280&fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=007f4eea8a26aec635d0fd532ec0b72f 280w, https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/apple.svg?w=560&fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=a3ae5d3504d4a5268dec4fe81ba7e36f 560w, https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/apple.svg?w=840&fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=9fe61a4efd2d3110e963f255d04b63e1 840w, https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/apple.svg?w=1100&fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=1222e81aea597941a1f5abaed4ea5271 1100w, https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/apple.svg?w=1650&fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=68ef3bd3e1aeca47513b8e7a78781705 1650w, https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/apple.svg?w=2500&fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=41185fcc4a6a4f34ab9968c68e5befe7 2500w">
    Apple Silicon (M1/M2/M3)
  </Card>

  <Card icon="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/apple.svg?fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=be745b4256bdcc762c03ec2d442e3045" title="macOS x64" href="https://github.com/oven-sh/bun/releases/latest/download/bun-darwin-x64.zip" data-og-width="842" width="842" data-og-height="1000" height="1000" data-path="icons/apple.svg" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/apple.svg?w=280&fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=007f4eea8a26aec635d0fd532ec0b72f 280w, https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/apple.svg?w=560&fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=a3ae5d3504d4a5268dec4fe81ba7e36f 560w, https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/apple.svg?w=840&fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=9fe61a4efd2d3110e963f255d04b63e1 840w, https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/apple.svg?w=1100&fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=1222e81aea597941a1f5abaed4ea5271 1100w, https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/apple.svg?w=1650&fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=68ef3bd3e1aeca47513b8e7a78781705 1650w, https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/apple.svg?w=2500&fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=41185fcc4a6a4f34ab9968c68e5befe7 2500w">
    Intel Macs
  </Card>

  <Card icon="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/linux.svg?fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=dd592a34657ecfae61ac4f30614fdce7" title="Linux ARM64" href="https://github.com/oven-sh/bun/releases/latest/download/bun-linux-aarch64.zip" data-og-width="216" width="216" data-og-height="256" height="256" data-path="icons/linux.svg" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/linux.svg?w=280&fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=14221739bbddbb7111ed143f47706765 280w, https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/linux.svg?w=560&fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=f09e6c4af8dcef0bf3ebf76c37adb929 560w, https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/linux.svg?w=840&fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=e2dcd6d81b834c62cbdef969b0f7a384 840w, https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/linux.svg?w=1100&fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=b5fd4131a518d92a766e6c7c078801e3 1100w, https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/linux.svg?w=1650&fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=7b8cb702ff95c9113f926e294c2d1bd3 1650w, https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/linux.svg?w=2500&fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=16386d14d51f58fa9fed82ee7d81980a 2500w">
    ARM64 Linux systems
  </Card>
</CardGroup>

### Musl Binaries

For distributions without `glibc` (Alpine Linux, Void Linux):

* [Linux x64 musl](https://github.com/oven-sh/bun/releases/latest/download/bun-linux-x64-musl.zip)
* [Linux x64 musl baseline](https://github.com/oven-sh/bun/releases/latest/download/bun-linux-x64-musl-baseline.zip)
* [Linux ARM64 musl](https://github.com/oven-sh/bun/releases/latest/download/bun-linux-aarch64-musl.zip)

<Note>
  If you encounter an error like `bun: /lib/x86_64-linux-gnu/libm.so.6: version GLIBC_2.29 not found`, try using the
  musl binary. Bun's install script automatically chooses the correct binary for your system.
</Note>

***

## CPU Requirements

Bun has specific CPU requirements based on the binary you're using:

<Tabs>
  <Tab title="Standard Builds">
    **x64 binaries** target the Haswell CPU architecture (AVX and AVX2 instructions required)

    | Platform | Intel Requirement               | AMD Requirement    |
    | -------- | ------------------------------- | ------------------ |
    | x64      | Haswell (4th gen Core) or newer | Excavator or newer |
  </Tab>

  <Tab title="Baseline Builds">
    **x64-baseline binaries** target the Nehalem architecture for older CPUs

    | Platform     | Intel Requirement               | AMD Requirement    |
    | ------------ | ------------------------------- | ------------------ |
    | x64-baseline | Nehalem (1st gen Core) or newer | Bulldozer or newer |

    <Warning>
      Baseline builds are slower than regular builds. Use them only if you encounter an "Illegal
      Instruction" error.
    </Warning>
  </Tab>
</Tabs>

<Note>
  Bun does not support CPUs older than the baseline target, which mandates the SSE4.2 extension. macOS requires version
  13.0 or later.
</Note>

***

## Uninstall

To remove Bun from your system:

<Tabs>
  <Tab title="macOS & Linux">
    ```bash terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
    rm -rf ~/.bun
    ```
  </Tab>

  <Tab title="Windows">
    ```powershell PowerShell icon="windows" theme={"theme":{"light":"github-light","dark":"dracula"}}
    powershell -c ~\.bun\uninstall.ps1
    ```
  </Tab>

  <Tab title="Package Managers">
    <CodeGroup>
      ```bash npm icon="npm" theme={"theme":{"light":"github-light","dark":"dracula"}}
      npm uninstall -g bun
      ```

      ```bash Homebrew icon="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/homebrew.svg?fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=5c6dc69e5e0d20fb807fba0a9cd45023" theme={"theme":{"light":"github-light","dark":"dracula"}}
      brew uninstall bun
      ```

      ```bash Scoop icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
      scoop uninstall bun
      ```
    </CodeGroup>
  </Tab>
</Tabs>
