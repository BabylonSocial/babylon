> ## Documentation Index
> Fetch the complete documentation index at: https://bun.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Use Neon's Serverless Postgres with Bun

[Neon](https://neon.tech/) is a fully managed serverless Postgres. Neon separates compute and storage to offer modern developer features such as autoscaling, branching, bottomless storage, and more.

***

Get started by creating a project directory, initializing the directory using `bun init`, and adding the [Neon serverless driver](https://github.com/neondatabase/serverless/) as a project dependency.

```sh terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
mkdir bun-neon-postgres
cd bun-neon-postgres
bun init -y
bun add @neondatabase/serverless
```

***

Create a `.env.local` file and add your [Neon Postgres connection string](https://neon.tech/docs/connect/connect-from-any-app) to it.

```ini .env.local icon="settings" theme={"theme":{"light":"github-light","dark":"dracula"}}
DATABASE_URL=postgresql://usertitle:password@ep-adj-noun-guid.us-east-1.aws.neon.tech/neondb?sslmode=require
```

***

Paste the following code into your project's `index.ts` file.

```ts index.ts icon="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/typescript.svg?fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=5d73d76daf7eb7b158469d8c30d349b0" theme={"theme":{"light":"github-light","dark":"dracula"}}
import { neon } from "@neondatabase/serverless";

// Bun automatically loads the DATABASE_URL from .env.local
// Refer to: https://bun.com/docs/runtime/environment-variables for more information
const sql = neon(process.env.DATABASE_URL);

const rows = await sql`SELECT version()`;

console.log(rows[0].version);
```

***

Start the program using `bun ./index.ts`. The Postgres version should be printed to the console.

```sh terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
bun ./index.ts
```

```txt  theme={"theme":{"light":"github-light","dark":"dracula"}}
PostgreSQL 16.2 on x86_64-pc-linux-gnu, compiled by gcc (Debian 10.2.1-6) 10.2.1 20210110, 64-bit
```

***

This example used the Neon serverless driver's SQL-over-HTTP functionality. Neon's serverless driver also exposes `Client` and `Pool` constructors to enable sessions, interactive transactions, and node-postgres compatibility.

Refer to [Neon's documentation](https://neon.tech/docs/serverless/serverless-driver) for a complete overview of the serverless driver.
