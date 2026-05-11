> ## Documentation Index
> Fetch the complete documentation index at: https://bun.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# fetch with unix domain sockets in Bun

In Bun, the `unix` option in `fetch()` lets you send HTTP requests over a [unix domain socket](https://en.wikipedia.org/wiki/Unix_domain_socket).

```ts fetch-unix.ts icon="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/typescript.svg?fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=5d73d76daf7eb7b158469d8c30d349b0" theme={"theme":{"light":"github-light","dark":"dracula"}}
const unix = "/var/run/docker.sock";

const response = await fetch("http://localhost/info", { unix });

const body = await response.json();
console.log(body); // { ... }
```

***

The `unix` option is a string that specifies the local file path to a unix domain socket. The `fetch()` function will use the socket to send the request to the server instead of using a TCP network connection. `https` is also supported by using the `https://` protocol in the URL instead of `http://`.

To send a `POST` request to an API endpoint over a unix domain socket:

```ts fetch-unix.ts icon="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/typescript.svg?fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=5d73d76daf7eb7b158469d8c30d349b0" theme={"theme":{"light":"github-light","dark":"dracula"}}
const response = await fetch("https://hostname/a/path", {
  unix: "/var/run/path/to/unix.sock",
  method: "POST",
  body: JSON.stringify({ message: "Hello from Bun!" }),
  headers: {
    "Content-Type": "application/json",
  },
});

const body = await response.json();
```
