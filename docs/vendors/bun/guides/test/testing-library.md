> ## Documentation Index
> Fetch the complete documentation index at: https://bun.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Using Testing Library with Bun

You can use [Testing Library](https://testing-library.com/) with Bun's test runner.

***

As a prerequisite to using Testing Library you will need to install [Happy Dom](https://github.com/capricorn86/happy-dom). ([see Bun's Happy DOM guide for more information](/guides/test/happy-dom)).

```sh terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
bun add -D @happy-dom/global-registrator
```

***

Next you should install the Testing Library packages you are planning on using. For example, if you are setting up testing for React your installs may look like this. You will also need to install `@testing-library/jest-dom` to get matchers working later.

```sh terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
bun add -D @testing-library/react @testing-library/dom @testing-library/jest-dom
```

***

Next you will need to create a preload script for Happy DOM and for Testing Library. For more details about the Happy DOM setup script see [Bun's Happy DOM guide](/guides/test/happy-dom).

```ts happydom.ts icon="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/typescript.svg?fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=5d73d76daf7eb7b158469d8c30d349b0" theme={"theme":{"light":"github-light","dark":"dracula"}}
import { GlobalRegistrator } from "@happy-dom/global-registrator";

GlobalRegistrator.register();
```

***

For Testing Library, you will want to extend Bun's `expect` function with Testing Library's matchers. Optionally, to better match the behavior of test-runners like Jest, you may want to run cleanup after each test.

```ts testing-library.ts icon="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/typescript.svg?fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=5d73d76daf7eb7b158469d8c30d349b0" theme={"theme":{"light":"github-light","dark":"dracula"}}
import { afterEach, expect } from "bun:test";
import { cleanup } from "@testing-library/react";
import * as matchers from "@testing-library/jest-dom/matchers";

expect.extend(matchers);

// Optional: cleans up `render` after each test
afterEach(() => {
  cleanup();
});
```

***

Next, add these preload scripts to your `bunfig.toml` (you can also have everything in a single `preload.ts` script if you prefer).

```toml bunfig.toml icon="settings" theme={"theme":{"light":"github-light","dark":"dracula"}}
[test]
preload = ["./happydom.ts", "./testing-library.ts"]
```

***

If you are using TypeScript you will also need to make use of declaration merging in order to get the new matcher types to show up in your editor. To do this, create a type declaration file that extends `Matchers` like this.

```ts matchers.d.ts icon="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/typescript.svg?fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=5d73d76daf7eb7b158469d8c30d349b0" theme={"theme":{"light":"github-light","dark":"dracula"}}
import { TestingLibraryMatchers } from "@testing-library/jest-dom/matchers";
import { Matchers, AsymmetricMatchers } from "bun:test";

declare module "bun:test" {
  interface Matchers<T> extends TestingLibraryMatchers<typeof expect.stringContaining, T> {}
  interface AsymmetricMatchers extends TestingLibraryMatchers {}
}
```

***

You should now be able to use Testing Library in your tests

```tsx myComponent.test.tsx icon="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/typescript.svg?fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=5d73d76daf7eb7b158469d8c30d349b0" theme={"theme":{"light":"github-light","dark":"dracula"}}
import { test, expect } from "bun:test";
import { screen, render } from "@testing-library/react";
import { MyComponent } from "./myComponent";

test("Can use Testing Library", () => {
  render(MyComponent);
  const myComponent = screen.getByTestId("my-component");
  expect(myComponent).toBeInTheDocument();
});
```

***

Refer to the [Testing Library docs](https://testing-library.com/), [Happy DOM repo](https://github.com/capricorn86/happy-dom) and [Docs > Test runner > DOM](/test/dom) for complete documentation on writing browser tests with Bun.
