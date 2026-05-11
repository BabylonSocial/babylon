> ## Documentation Index
> Fetch the complete documentation index at: https://bun.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Import a YAML file

Bun natively supports `.yaml` and `.yml` imports.

```yaml config.yaml icon="file-code" theme={"theme":{"light":"github-light","dark":"dracula"}}
database:
  host: localhost
  port: 5432
  name: myapp

server:
  port: 3000
  timeout: 30

features:
  auth: true
  rateLimit: true
```

***

Import the file like any other source file.

```ts config.ts icon="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/typescript.svg?fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=5d73d76daf7eb7b158469d8c30d349b0" theme={"theme":{"light":"github-light","dark":"dracula"}}
import config from "./config.yaml";

config.database.host; // => "localhost"
config.server.port; // => 3000
config.features.auth; // => true
```

***

You can also use named imports to destructure top-level properties:

```ts config.ts icon="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/typescript.svg?fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=5d73d76daf7eb7b158469d8c30d349b0" theme={"theme":{"light":"github-light","dark":"dracula"}}
import { database, server, features } from "./config.yaml";

console.log(database.name); // => "myapp"
console.log(server.timeout); // => 30
console.log(features.rateLimit); // => true
```

***

Bun also supports [Import Attributes](https://github.com/tc39/proposal-import-attributes) syntax:

```ts config.ts icon="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/typescript.svg?fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=5d73d76daf7eb7b158469d8c30d349b0" theme={"theme":{"light":"github-light","dark":"dracula"}}
import config from "./config.yaml" with { type: "yaml" };

config.database.port; // => 5432
```

***

For parsing YAML strings at runtime, use `Bun.YAML.parse()`:

```ts config.ts icon="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/typescript.svg?fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=5d73d76daf7eb7b158469d8c30d349b0" theme={"theme":{"light":"github-light","dark":"dracula"}}
const yamlString = `
name: John Doe
age: 30
hobbies:
  - reading
  - coding
`;

const data = Bun.YAML.parse(yamlString);
console.log(data.name); // => "John Doe"
console.log(data.hobbies); // => ["reading", "coding"]
```

***

## TypeScript Support

To add TypeScript support for your YAML imports, create a declaration file with `.d.ts` appended to the YAML filename (e.g., `config.yaml` → `config.yaml.d.ts`);

```ts config.yaml.d.ts icon="https://mintcdn.com/bun-1dd33a4e/nIz6GtMH5K-dfXeV/icons/typescript.svg?fit=max&auto=format&n=nIz6GtMH5K-dfXeV&q=85&s=5d73d76daf7eb7b158469d8c30d349b0" theme={"theme":{"light":"github-light","dark":"dracula"}}
const contents: {
  database: {
    host: string;
    port: number;
    name: string;
  };
  server: {
    port: number;
    timeout: number;
  };
  features: {
    auth: boolean;
    rateLimit: boolean;
  };
};

export = contents;
```

***

See [Docs > API > YAML](/runtime/yaml) for complete documentation on YAML support in Bun.
