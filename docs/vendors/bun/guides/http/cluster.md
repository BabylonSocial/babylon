> ## Documentation Index
> Fetch the complete documentation index at: https://bun.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Start a cluster of HTTP servers

> Run multiple HTTP servers concurrently via the "reusePort" option to share the same port across multiple processes

To run multiple HTTP servers concurrently, use the `reusePort` option in `Bun.serve()` which shares the same port across multiple processes.

This automatically load balances incoming requests across multiple instances of Bun.

```ts server.ts icon="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/typescript.svg?fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=5d73d76daf7eb7b158469d8c30d349b0" theme={"theme":{"light":"github-light","dark":"dracula"}}
import { serve } from "bun";

const id = Math.random().toString(36).slice(2);

serve({
  port: process.env.PORT || 8080,
  development: false,

  // Share the same port across multiple processes
  // This is the important part!
  reusePort: true,

  async fetch(request) {
    return new Response("Hello from Bun #" + id + "!\n");
  },
});
```

***

<Note>
  **Linux only** — Windows and macOS ignore the `reusePort` option. This is an operating system limitation with
  `SO_REUSEPORT`, unfortunately.
</Note>

After saving the file, start your servers on the same port.

Under the hood, this uses the Linux `SO_REUSEPORT` and `SO_REUSEADDR` socket options to ensure fair load balancing across multiple processes. [Learn more about `SO_REUSEPORT` and `SO_REUSEADDR`](https://lwn.net/Articles/542629/)

```ts cluster.ts icon="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/typescript.svg?fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=5d73d76daf7eb7b158469d8c30d349b0" theme={"theme":{"light":"github-light","dark":"dracula"}}
import { spawn } from "bun";

const cpus = navigator.hardwareConcurrency; // Number of CPU cores
const buns = new Array(cpus);

for (let i = 0; i < cpus; i++) {
  buns[i] = spawn({
    cmd: ["bun", "./server.ts"],
    stdout: "inherit",
    stderr: "inherit",
    stdin: "inherit",
  });
}

function kill() {
  for (const bun of buns) {
    bun.kill();
  }
}

process.on("SIGINT", kill);
process.on("exit", kill);
```

***

Bun has also implemented the `node:cluster` module, but this is a faster, simple, and limited alternative.
