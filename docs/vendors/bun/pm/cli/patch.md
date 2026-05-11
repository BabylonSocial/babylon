> ## Documentation Index
> Fetch the complete documentation index at: https://bun.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# bun patch

> Persistently patch node_modules packages in a git-friendly way

`bun patch` lets you persistently patch node\_modules in a maintainable, git-friendly way.

Sometimes, you need to make a small change to a package in `node_modules/` to fix a bug or add a feature. `bun patch` makes it easy to do this without vendoring the entire package and reuse the patch across multiple installs, multiple projects, and multiple machines.

Features:

* Generates `.patch` files applied to dependencies in `node_modules` on install
* `.patch` files can be committed to your repository, reused across multiple installs, projects, and machines
* `"patchedDependencies"` in `package.json` keeps track of patched packages
* `bun patch` lets you patch packages in `node_modules/` while preserving the integrity of Bun's [Global Cache](/pm/global-cache)
* Test your changes locally before committing them with `bun patch --commit <pkg>`
* To preserve disk space and keep `bun install` fast, patched packages are committed to the Global Cache and shared across projects where possible

#### Step 1. Prepare the package for patching

To get started, use `bun patch <pkg>` to prepare the package for patching:

```bash terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
# you can supply the package name
bun patch react

# ...and a precise version in case multiple versions are installed
bun patch react@17.0.2

# or the path to the package
bun patch node_modules/react
```

<Note>
  Don't forget to call `bun patch <pkg>`! This ensures the package folder in `node_modules/` contains a fresh copy of the package with no symlinks/hardlinks to Bun's cache.

  If you forget to do this, you might end up editing the package globally in the cache!
</Note>

#### Step 2. Test your changes locally

`bun patch <pkg>` makes it safe to edit the `<pkg>` in `node_modules/` directly, while preserving the integrity of Bun's [Global Cache](/pm/global-cache). This works by re-creating an unlinked clone of the package in `node_modules/` and diffing it against the original package in the Global Cache.

#### Step 3. Commit your changes

Once you're happy with your changes, run `bun patch --commit <path or pkg>`.

Bun will generate a patch file in `patches/`, update your `package.json` and lockfile, and Bun will start using the patched package:

```bash terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
# you can supply the path to the patched package
bun patch --commit node_modules/react

# ... or the package name and optionally the version
bun patch --commit react@17.0.2

# choose the directory to store the patch files
bun patch --commit react --patches-dir=mypatches

# `patch-commit` is available for compatibility with pnpm
bun patch-commit react
```

***

# CLI Usage

```bash  theme={"theme":{"light":"github-light","dark":"dracula"}}
bun patch <package>@<version>
```

### Patch Generation

<ParamField path="--commit" type="boolean">
  Install a package containing modifications in <code>dir</code>
</ParamField>

<ParamField path="--patches-dir" type="string">
  The directory to put the patch file in (only if --commit is used)
</ParamField>

### Dependency Management

<ParamField path="--production" type="boolean">
  Don't install devDependencies. Alias: <code>-p</code>
</ParamField>

<ParamField path="--ignore-scripts" type="boolean">
  Skip lifecycle scripts in the project's <code>package.json</code> (dependency scripts are never run)
</ParamField>

<ParamField path="--trust" type="boolean">
  Add to <code>trustedDependencies</code> in the project's <code>package.json</code> and install the package(s)
</ParamField>

<ParamField path="--global" type="boolean">
  Install globally. Alias: <code>-g</code>
</ParamField>

<ParamField path="--omit" type="string">
  Exclude <code>dev</code>, <code>optional</code>, or <code>peer</code> dependencies from install
</ParamField>

### Project Files & Lockfiles

<ParamField path="--yarn" type="boolean">
  Write a <code>yarn.lock</code> file (yarn v1). Alias: <code>-y</code>
</ParamField>

<ParamField path="--no-save" type="boolean">
  Don't update <code>package.json</code> or save a lockfile
</ParamField>

<ParamField path="--save" type="boolean" default="true">
  Save to <code>package.json</code> (true by default)
</ParamField>

<ParamField path="--frozen-lockfile" type="boolean">
  Disallow changes to lockfile
</ParamField>

<ParamField path="--save-text-lockfile" type="boolean">
  Save a text-based lockfile
</ParamField>

<ParamField path="--lockfile-only" type="boolean">
  Generate a lockfile without installing dependencies
</ParamField>

### Installation Control

<ParamField path="--backend" type="string" default="clonefile">
  Platform-specific optimizations for installing dependencies. Possible values: <code>clonefile</code> (default),{" "}
  <code>hardlink</code>, <code>symlink</code>, <code>copyfile</code>
</ParamField>

<ParamField path="--linker" type="string">
  Linker strategy (one of <code>isolated</code> or <code>hoisted</code>)
</ParamField>

<ParamField path="--dry-run" type="boolean">
  Don't install anything
</ParamField>

<ParamField path="--force" type="boolean">
  Always request the latest versions from the registry & reinstall all dependencies. Alias: <code>-f</code>
</ParamField>

<ParamField path="--no-verify" type="boolean">
  Skip verifying integrity of newly downloaded packages
</ParamField>

### Network & Registry

<ParamField path="--ca" type="string">
  Provide a Certificate Authority signing certificate
</ParamField>

<ParamField path="--cafile" type="string">
  Same as <code>--ca</code>, but as a file path to the certificate
</ParamField>

<ParamField path="--registry" type="string">
  Use a specific registry by default, overriding <code>.npmrc</code>, <code>bunfig.toml</code>, and environment
  variables
</ParamField>

<ParamField path="--network-concurrency" type="number" default="48">
  Maximum number of concurrent network requests (default 48)
</ParamField>

### Performance & Resource

<ParamField path="--concurrent-scripts" type="number" default="5">
  Maximum number of concurrent jobs for lifecycle scripts (default 5)
</ParamField>

### Caching

<ParamField path="--cache-dir" type="string">
  Store & load cached data from a specific directory path
</ParamField>

<ParamField path="--no-cache" type="boolean">
  Ignore manifest cache entirely
</ParamField>

### Output & Logging

<ParamField path="--silent" type="boolean">
  Don't log anything
</ParamField>

<ParamField path="--quiet" type="boolean">
  Only show tarball name when packing
</ParamField>

<ParamField path="--verbose" type="boolean">
  Excessively verbose logging
</ParamField>

<ParamField path="--no-progress" type="boolean">
  Disable the progress bar
</ParamField>

<ParamField path="--no-summary" type="boolean">
  Don't print a summary
</ParamField>

### Platform Targeting

<ParamField path="--cpu" type="string">
  Override CPU architecture for optional dependencies (e.g., <code>x64</code>, <code>arm64</code>, <code>\*</code> for
  all)
</ParamField>

<ParamField path="--os" type="string">
  Override operating system for optional dependencies (e.g., <code>linux</code>, <code>darwin</code>, <code>\*</code> for
  all)
</ParamField>

### Global Configuration & Context

<ParamField path="--config" type="string">
  Specify path to config file (<code>bunfig.toml</code>). Alias: <code>-c</code>
</ParamField>

<ParamField path="--cwd" type="string">
  Set a specific current working directory
</ParamField>

### Help

<ParamField path="--help" type="boolean">
  Print this help menu. Alias: <code>-h</code>
</ParamField>
