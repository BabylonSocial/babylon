> ## Documentation Index
> Fetch the complete documentation index at: https://bun.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Node-API

> Use Bun's Node-API module to build native add-ons to Node.js

Node-API is an interface for building native add-ons to Node.js. Bun implements 95% of this interface from scratch, so most existing Node-API extensions will work with Bun out of the box. Track the completion status of it in [this issue](https://github.com/oven-sh/bun/issues/158).

As in Node.js, `.node` files (Node-API modules) can be required directly in Bun.

```js  theme={"theme":{"light":"github-light","dark":"dracula"}}
const napi = require("./my-node-module.node");
```

Alternatively, use `process.dlopen`:

```js  theme={"theme":{"light":"github-light","dark":"dracula"}}
let mod = { exports: {} };
process.dlopen(mod, "./my-node-module.node");
```
