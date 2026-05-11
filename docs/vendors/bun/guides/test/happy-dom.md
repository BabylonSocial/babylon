> ## Documentation Index
> Fetch the complete documentation index at: https://bun.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Write browser DOM tests with Bun and happy-dom

You can write and run browser tests with Bun's test runner in conjunction with [Happy DOM](https://github.com/capricorn86/happy-dom). Happy DOM implements mocked versions of browser APIs like `document` and `location`.

***

To get started, install `happy-dom`.

```sh terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
bun add -d @happy-dom/global-registrator
```

***

This module exports a "registrator" that injects the mocked browser APIs to the global scope.

```ts happydom.ts icon="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/typescript.svg?fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=5d73d76daf7eb7b158469d8c30d349b0" theme={"theme":{"light":"github-light","dark":"dracula"}}
import { GlobalRegistrator } from "@happy-dom/global-registrator";

GlobalRegistrator.register();
```

***

We need to make sure this file is executed before any of our test files. That's a job for Bun's built-in [*preload*]() functionality. Create a `bunfig.toml` file in the root of your project (if it doesn't already exist) and add the following lines.

The `./happydom.ts` file should contain the registration code above.

```toml bunfig.toml icon="settings" theme={"theme":{"light":"github-light","dark":"dracula"}}
[test]
preload = "./happydom.ts"
```

***

Now running `bun test` inside our project will automatically execute `happydom.ts` first. We can start writing tests that use browser APIs.

```ts dom.test.ts icon="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/typescript.svg?fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=5d73d76daf7eb7b158469d8c30d349b0" theme={"theme":{"light":"github-light","dark":"dracula"}}
import { test, expect } from "bun:test";

test("set button text", () => {
  document.body.innerHTML = `<button>My button</button>`;
  const button = document.querySelector("button");
  expect(button?.innerText).toEqual("My button");
});
```

***

With Happy DOM properly configured, this test runs as expected.

```sh terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
bun test
```

```txt  theme={"theme":{"light":"github-light","dark":"dracula"}}

dom.test.ts:
✓ set button text [0.82ms]

 1 pass
 0 fail
 1 expect() calls
Ran 1 tests across 1 files. 1 total [125.00ms]
```

***

Refer to the [Happy DOM repo](https://github.com/capricorn86/happy-dom) and [Docs > Test runner > DOM](/test/dom) for complete documentation on writing browser tests with Bun.
