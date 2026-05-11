> ## Documentation Index
> Fetch the complete documentation index at: https://bun.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Test runner

> Bun's fast, built-in, Jest-compatible test runner with TypeScript support, lifecycle hooks, mocking, and watch mode

Bun ships with a fast, built-in, Jest-compatible test runner. Tests are executed with the Bun runtime, and support the following features.

* TypeScript and JSX
* Lifecycle hooks
* Snapshot testing
* UI & DOM testing
* Watch mode with `--watch`
* Script pre-loading with `--preload`

<Note>
  Bun aims for compatibility with Jest, but not everything is implemented. To track compatibility, see [this tracking
  issue](https://github.com/oven-sh/bun/issues/1825).
</Note>

## Run tests

```bash terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
bun test
```

Tests are written in JavaScript or TypeScript with a Jest-like API. Refer to [Writing tests](/test/writing-tests) for full documentation.

```ts math.test.ts icon="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/typescript.svg?fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=5d73d76daf7eb7b158469d8c30d349b0" theme={"theme":{"light":"github-light","dark":"dracula"}}
import { expect, test } from "bun:test";

test("2 + 2", () => {
  expect(2 + 2).toBe(4);
});
```

The runner recursively searches the working directory for files that match the following patterns:

* `*.test.{js|jsx|ts|tsx}`
* `*_test.{js|jsx|ts|tsx}`
* `*.spec.{js|jsx|ts|tsx}`
* `*_spec.{js|jsx|ts|tsx}`

You can filter the set of *test files* to run by passing additional positional arguments to `bun test`. Any test file with a path that matches one of the filters will run. Commonly, these filters will be file or directory names; glob patterns are not yet supported.

```bash terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
bun test <filter> <filter> ...
```

To filter by *test name*, use the `-t`/`--test-name-pattern` flag.

```sh terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
# run all tests or test suites with "addition" in the name
bun test --test-name-pattern addition
```

To run a specific file in the test runner, make sure the path starts with `./` or `/` to distinguish it from a filter name.

```bash terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
bun test ./test/specific-file.test.ts
```

The test runner runs all tests in a single process. It loads all `--preload` scripts (see [Lifecycle](/test/lifecycle) for details), then runs all tests. If a test fails, the test runner will exit with a non-zero exit code.

## CI/CD integration

`bun test` supports a variety of CI/CD integrations.

### GitHub Actions

`bun test` automatically detects if it's running inside GitHub Actions and will emit GitHub Actions annotations to the console directly.

No configuration is needed, other than installing `bun` in the workflow and running `bun test`.

#### How to install `bun` in a GitHub Actions workflow

To use `bun test` in a GitHub Actions workflow, add the following step:

```yaml title=".github/workflows/test.yml" icon="file-code" theme={"theme":{"light":"github-light","dark":"dracula"}}
jobs:
  build:
    name: build-app
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      - name: Install bun
        uses: oven-sh/setup-bun@v2
      - name: Install dependencies # (assuming your project has dependencies)
        run: bun install # You can use npm/yarn/pnpm instead if you prefer
      - name: Run tests
        run: bun test
```

From there, you'll get GitHub Actions annotations.

### JUnit XML reports (GitLab, etc.)

To use `bun test` with a JUnit XML reporter, you can use the `--reporter=junit` in combination with `--reporter-outfile`.

```sh terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
bun test --reporter=junit --reporter-outfile=./bun.xml
```

This will continue to output to stdout/stderr as usual, and also write a JUnit
XML report to the given path at the very end of the test run.

JUnit XML is a popular format for reporting test results in CI/CD pipelines.

## Timeouts

Use the `--timeout` flag to specify a *per-test* timeout in milliseconds. If a test times out, it will be marked as failed. The default value is `5000`.

```bash terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
# default value is 5000
bun test --timeout 20
```

## Concurrent test execution

By default, Bun runs all tests sequentially within each test file. You can enable concurrent execution to run async tests in parallel, significantly speeding up test suites with independent tests.

### `--concurrent` flag

Use the `--concurrent` flag to run all tests concurrently within their respective files:

```sh terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
bun test --concurrent
```

When this flag is enabled, all tests will run in parallel unless explicitly marked with `test.serial`.

### `--max-concurrency` flag

Control the maximum number of tests running simultaneously with the `--max-concurrency` flag:

```sh terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
# Limit to 4 concurrent tests
bun test --concurrent --max-concurrency 4

# Default: 20
bun test --concurrent
```

This helps prevent resource exhaustion when running many concurrent tests. The default value is 20.

### `test.concurrent`

Mark individual tests to run concurrently, even when the `--concurrent` flag is not used:

```ts title="math.test.ts" icon="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/typescript.svg?fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=5d73d76daf7eb7b158469d8c30d349b0" theme={"theme":{"light":"github-light","dark":"dracula"}}
import { test, expect } from "bun:test";

// These tests run in parallel with each other
test.concurrent("concurrent test 1", async () => {
  await fetch("/api/endpoint1");
  expect(true).toBe(true);
});

test.concurrent("concurrent test 2", async () => {
  await fetch("/api/endpoint2");
  expect(true).toBe(true);
});

// This test runs sequentially
test("sequential test", () => {
  expect(1 + 1).toBe(2);
});
```

### `test.serial`

Force tests to run sequentially, even when the `--concurrent` flag is enabled:

```ts title="math.test.ts" icon="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/typescript.svg?fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=5d73d76daf7eb7b158469d8c30d349b0" theme={"theme":{"light":"github-light","dark":"dracula"}}
import { test, expect } from "bun:test";

let sharedState = 0;

// These tests must run in order
test.serial("first serial test", () => {
  sharedState = 1;
  expect(sharedState).toBe(1);
});

test.serial("second serial test", () => {
  // Depends on the previous test
  expect(sharedState).toBe(1);
  sharedState = 2;
});

// This test can run concurrently if --concurrent is enabled
test("independent test", () => {
  expect(true).toBe(true);
});

// Chaining test qualifiers
test.failing.each([1, 2, 3])("chained qualifiers %d", input => {
  expect(input).toBe(0); // This test is expected to fail for each input
});
```

## Retry failed tests

Use the `--retry` flag to automatically retry failed tests up to a given number of times. If a test fails and then passes on a subsequent attempt, it is reported as passing.

```sh terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
bun test --retry 3
```

Per-test `{ retry: N }` overrides the global `--retry` value:

```ts  theme={"theme":{"light":"github-light","dark":"dracula"}}
// Uses the global --retry value
test("uses global retry", () => {
  /* ... */
});

// Overrides --retry with its own value
test("custom retry", { retry: 1 }, () => {
  /* ... */
});
```

You can also set this in `bunfig.toml`:

```toml title="bunfig.toml" icon="settings" theme={"theme":{"light":"github-light","dark":"dracula"}}
[test]
retry = 3
```

## Rerun tests

Use the `--rerun-each` flag to run each test multiple times. This is useful for detecting flaky or non-deterministic test failures.

```sh terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
bun test --rerun-each 100
```

## Randomize test execution order

Use the `--randomize` flag to run tests in a random order. This helps detect tests that depend on shared state or execution order.

```sh terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
bun test --randomize
```

When using `--randomize`, the seed used for randomization will be displayed in the test summary:

```sh terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
bun test --randomize
```

```txt  theme={"theme":{"light":"github-light","dark":"dracula"}}
# ... test output ...
 --seed=12345
 2 pass
 8 fail
Ran 10 tests across 2 files. [50.00ms]
```

### Reproducible random order with `--seed`

Use the `--seed` flag to specify a seed for the randomization. This allows you to reproduce the same test order when debugging order-dependent failures.

```sh terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
# Reproduce a previous randomized run
bun test --seed 123456
```

The `--seed` flag implies `--randomize`, so you don't need to specify both. Using the same seed value will always produce the same test execution order, making it easier to debug intermittent failures caused by test interdependencies.

## Bail out with `--bail`

Use the `--bail` flag to abort the test run early after a pre-determined number of test failures. By default Bun will run all tests and report all failures, but sometimes in CI environments it's preferable to terminate earlier to reduce CPU usage.

```sh terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
# bail after 1 failure
bun test --bail

# bail after 10 failure
bun test --bail=10
```

## Watch mode

Similar to `bun run`, you can pass the `--watch` flag to `bun test` to watch for changes and re-run tests.

```bash terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
bun test --watch
```

## Lifecycle hooks

Bun supports the following lifecycle hooks:

| Hook         | Description                 |
| ------------ | --------------------------- |
| `beforeAll`  | Runs once before all tests. |
| `beforeEach` | Runs before each test.      |
| `afterEach`  | Runs after each test.       |
| `afterAll`   | Runs once after all tests.  |

These hooks can be defined inside test files, or in a separate file that is preloaded with the `--preload` flag.

```sh terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
bun test --preload ./setup.ts
```

See [Test > Lifecycle](/test/lifecycle) for complete documentation.

## Mocks

Create mock functions with the `mock` function.

```ts title="math.test.ts" icon="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/typescript.svg?fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=5d73d76daf7eb7b158469d8c30d349b0" theme={"theme":{"light":"github-light","dark":"dracula"}}
import { test, expect, mock } from "bun:test";
const random = mock(() => Math.random());

test("random", () => {
  const val = random();
  expect(val).toBeGreaterThan(0);
  expect(random).toHaveBeenCalled();
  expect(random).toHaveBeenCalledTimes(1);
});
```

Alternatively, you can use `jest.fn()`, it behaves identically.

```ts title="math.test.ts" icon="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/typescript.svg?fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=5d73d76daf7eb7b158469d8c30d349b0" theme={"theme":{"light":"github-light","dark":"dracula"}}
import { test, expect, mock } from "bun:test"; // [!code --]
import { test, expect, jest } from "bun:test"; // [!code ++]

const random = mock(() => Math.random()); // [!code --]
const random = jest.fn(() => Math.random()); // [!code ++]
```

See [Test > Mocks](/test/mocks) for complete documentation.

## Snapshot testing

Snapshots are supported by `bun test`.

```ts title="math.test.ts" icon="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/typescript.svg?fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=5d73d76daf7eb7b158469d8c30d349b0" theme={"theme":{"light":"github-light","dark":"dracula"}}
// example usage of toMatchSnapshot
import { test, expect } from "bun:test";

test("snapshot", () => {
  expect({ a: 1 }).toMatchSnapshot();
});
```

To update snapshots, use the `--update-snapshots` flag.

```sh terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
bun test --update-snapshots
```

See [Test > Snapshots](/test/snapshots) for complete documentation.

## UI & DOM testing

Bun is compatible with popular UI testing libraries:

* [HappyDOM](https://github.com/capricorn86/happy-dom)
* [DOM Testing Library](https://testing-library.com/docs/dom-testing-library/intro/)
* [React Testing Library](https://testing-library.com/docs/react-testing-library/intro)

See [Test > DOM Testing](/test/dom) for complete documentation.

## Performance

Bun's test runner is fast.

<Frame><img src="https://mintcdn.com/bun-1dd33a4e/DJXb5ll7I0cV-M4b/images/buntest.jpeg?fit=max&auto=format&n=DJXb5ll7I0cV-M4b&q=85&s=385ddc5e64d35dd0534663d0f70ab116" alt="Running 266 React SSR tests faster than Jest can print its version number." data-og-width="2112" width="2112" data-og-height="716" height="716" data-path="images/buntest.jpeg" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/bun-1dd33a4e/DJXb5ll7I0cV-M4b/images/buntest.jpeg?w=280&fit=max&auto=format&n=DJXb5ll7I0cV-M4b&q=85&s=3521449d084de759182add8a38c60c3d 280w, https://mintcdn.com/bun-1dd33a4e/DJXb5ll7I0cV-M4b/images/buntest.jpeg?w=560&fit=max&auto=format&n=DJXb5ll7I0cV-M4b&q=85&s=37c3031df9eea4fef6f01f5ed3d5619b 560w, https://mintcdn.com/bun-1dd33a4e/DJXb5ll7I0cV-M4b/images/buntest.jpeg?w=840&fit=max&auto=format&n=DJXb5ll7I0cV-M4b&q=85&s=0b4986c07b5afc3fd75f5b0da4151b56 840w, https://mintcdn.com/bun-1dd33a4e/DJXb5ll7I0cV-M4b/images/buntest.jpeg?w=1100&fit=max&auto=format&n=DJXb5ll7I0cV-M4b&q=85&s=780b91c86953d3c5ec6bd4d6c7fd90d4 1100w, https://mintcdn.com/bun-1dd33a4e/DJXb5ll7I0cV-M4b/images/buntest.jpeg?w=1650&fit=max&auto=format&n=DJXb5ll7I0cV-M4b&q=85&s=14077e0b0e1766552cd69981352275bc 1650w, https://mintcdn.com/bun-1dd33a4e/DJXb5ll7I0cV-M4b/images/buntest.jpeg?w=2500&fit=max&auto=format&n=DJXb5ll7I0cV-M4b&q=85&s=a29453d4a392600e61619bc16ee3e6a3 2500w" /></Frame>

## AI Agent Integration

When using Bun's test runner with AI coding assistants, you can enable quieter output to improve readability and reduce context noise. This feature minimizes test output verbosity while preserving essential failure information.

### Environment Variables

Set any of the following environment variables to enable AI-friendly output:

* `CLAUDECODE=1` - For Claude Code
* `REPL_ID=1` - For Replit
* `AGENT=1` - Generic AI agent flag

### Behavior

When an AI agent environment is detected:

* Only test failures are displayed in detail
* Passing, skipped, and todo test indicators are hidden
* Summary statistics remain intact

```bash terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
# Example: Enable quiet output for Claude Code
CLAUDECODE=1 bun test

# Still shows failures and summary, but hides verbose passing test output
```

This feature is particularly useful in AI-assisted development workflows where reduced output verbosity improves context efficiency while maintaining visibility into test failures.

***

# CLI Usage

```bash  theme={"theme":{"light":"github-light","dark":"dracula"}}
bun test <patterns>
```

### Execution Control

<ParamField path="--timeout" type="number" default="5000">
  Set the per-test timeout in milliseconds (default 5000)
</ParamField>

<ParamField path="--rerun-each" type="number">
  Re-run each test file <code>NUMBER</code> times, helps catch certain bugs
</ParamField>

<ParamField path="--retry" type="number">
  Default retry count for all tests. Failed tests will be retried up to <code>NUMBER</code> times. Overridden by
  per-test <code>{`{ retry: N }`}</code>
</ParamField>

<ParamField path="--concurrent" type="boolean">
  Treat all tests as <code>test.concurrent()</code> tests
</ParamField>

<ParamField path="--randomize" type="boolean">
  Run tests in random order
</ParamField>

<ParamField path="--seed" type="number">
  Set the random seed for test randomization
</ParamField>

<ParamField path="--bail" type="number" default="1">
  Exit the test suite after <code>NUMBER</code> failures. If you do not specify a number, it defaults to 1.
</ParamField>

<ParamField path="--max-concurrency" type="number" default="20">
  Maximum number of concurrent tests to execute at once (default 20)
</ParamField>

### Test Filtering

<ParamField path="--todo" type="boolean">
  Include tests that are marked with <code>test.todo()</code>
</ParamField>

<ParamField path="--test-name-pattern" type="string">
  Run only tests with a name that matches the given regex. Alias: <code>-t</code>
</ParamField>

### Reporting

<ParamField path="--reporter" type="string">
  Test output reporter format. Available: <code>junit</code> (requires --reporter-outfile), <code>dots</code>. Default:
  console output.
</ParamField>

<ParamField path="--reporter-outfile" type="string">
  Output file path for the reporter format (required with --reporter)
</ParamField>

<ParamField path="--dots" type="boolean">
  Enable dots reporter. Shorthand for --reporter=dots
</ParamField>

### Coverage

<ParamField path="--coverage" type="boolean">
  Generate a coverage profile
</ParamField>

<ParamField path="--coverage-reporter" type="string" default="text">
  Report coverage in <code>text</code> and/or <code>lcov</code>. Defaults to <code>text</code>
</ParamField>

<ParamField path="--coverage-dir" type="string" default="coverage">
  Directory for coverage files. Defaults to <code>coverage</code>
</ParamField>

### Snapshots

<ParamField path="--update-snapshots" type="boolean">
  Update snapshot files. Alias: <code>-u</code>
</ParamField>

## Examples

Run all test files:

```bash terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
bun test
```

Run all test files with "foo" or "bar" in the file name:

```bash terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
bun test foo bar
```

Run all test files, only including tests whose names includes "baz":

```bash terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
bun test --test-name-pattern baz
```
