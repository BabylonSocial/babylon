> ## Documentation Index
> Fetch the complete documentation index at: https://bun.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Error Handling

> Learn how to handle errors in Bun's development server

To activate development mode, set `development: true`.

```ts title="server.ts" icon="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/typescript.svg?fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=5d73d76daf7eb7b158469d8c30d349b0" theme={"theme":{"light":"github-light","dark":"dracula"}}
Bun.serve({
  development: true, // [!code ++]
  fetch(req) {
    throw new Error("woops!");
  },
});
```

In development mode, Bun will surface errors in-browser with a built-in error page.

<Frame><img src="https://mintcdn.com/bun-1dd33a4e/PY1574V41bdK8wNs/images/exception_page.png?fit=max&auto=format&n=PY1574V41bdK8wNs&q=85&s=26f9bec162e97288f1f0d736773b2b6e" alt="Bun's built-in 500 page" data-og-width="800" width="800" data-og-height="579" height="579" data-path="images/exception_page.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/bun-1dd33a4e/PY1574V41bdK8wNs/images/exception_page.png?w=280&fit=max&auto=format&n=PY1574V41bdK8wNs&q=85&s=77f5e65f2bd86c0c9f8aa548169764f6 280w, https://mintcdn.com/bun-1dd33a4e/PY1574V41bdK8wNs/images/exception_page.png?w=560&fit=max&auto=format&n=PY1574V41bdK8wNs&q=85&s=87988ad4288c5a0a06214ef0d7687f87 560w, https://mintcdn.com/bun-1dd33a4e/PY1574V41bdK8wNs/images/exception_page.png?w=840&fit=max&auto=format&n=PY1574V41bdK8wNs&q=85&s=5c605029819509b6e1dbba7ff684ef4f 840w, https://mintcdn.com/bun-1dd33a4e/PY1574V41bdK8wNs/images/exception_page.png?w=1100&fit=max&auto=format&n=PY1574V41bdK8wNs&q=85&s=5b1da6d3ac8b8583e9869385c0c9a8eb 1100w, https://mintcdn.com/bun-1dd33a4e/PY1574V41bdK8wNs/images/exception_page.png?w=1650&fit=max&auto=format&n=PY1574V41bdK8wNs&q=85&s=32e2a5d5903287da38118ea5016c44e1 1650w, https://mintcdn.com/bun-1dd33a4e/PY1574V41bdK8wNs/images/exception_page.png?w=2500&fit=max&auto=format&n=PY1574V41bdK8wNs&q=85&s=5015e6ff9569ae31243c6214021cd9f6 2500w" /></Frame>

### `error` callback

To handle server-side errors, implement an `error` handler. This function should return a `Response` to serve to the client when an error occurs. This response will supersede Bun's default error page in `development` mode.

```ts  theme={"theme":{"light":"github-light","dark":"dracula"}}
Bun.serve({
  fetch(req) {
    throw new Error("woops!");
  },
  error(error) {
    return new Response(`<pre>${error}\n${error.stack}</pre>`, {
      headers: {
        "Content-Type": "text/html",
      },
    });
  },
});
```

<Info>[Learn more about debugging in Bun](/runtime/debugger)</Info>
