> ## Documentation Index
> Fetch the complete documentation index at: https://bun.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Set a code coverage threshold with the Bun test runner

Bun's test runner supports built-in code coverage reporting via the `--coverage` flag.

```sh terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
bun test --coverage
```

```txt  theme={"theme":{"light":"github-light","dark":"dracula"}}
test.test.ts:
✓ math > add [0.71ms]
✓ math > multiply [0.03ms]
✓ random [0.13ms]
-------------|---------|---------|-------------------
File         | % Funcs | % Lines | Uncovered Line #s
-------------|---------|---------|-------------------
All files    |   66.67 |   77.78 |
 math.ts     |   50.00 |   66.67 |
 random.ts   |   50.00 |   66.67 |
-------------|---------|---------|-------------------

 3 pass
 0 fail
 3 expect() calls
```

***

To set a minimum coverage threshold, add the following line to your `bunfig.toml`. This requires that 90% of your codebase is covered by tests.

```toml bunfig.toml icon="settings" theme={"theme":{"light":"github-light","dark":"dracula"}}
[test]
# to require 90% line-level and function-level coverage
coverageThreshold = 0.9
```

***

If your test suite does not meet this threshold, `bun test` will exit with a non-zero exit code to signal a failure.

```sh terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
bun test --coverage
```

```txt  theme={"theme":{"light":"github-light","dark":"dracula"}}
<test output>
$ echo $?
1 # this is the exit code of the previous command
```

***

Different thresholds can be set for line-level and function-level coverage.

```toml bunfig.toml icon="settings" theme={"theme":{"light":"github-light","dark":"dracula"}}
[test]
# to set different thresholds for lines and functions
coverageThreshold = { lines = 0.5, functions = 0.7 }
```

***

See [Docs > Test runner > Coverage](/test/code-coverage) for complete documentation on code coverage reporting in Bun.
