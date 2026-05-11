> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# null

## Requirements

* React 18 or higher
* TypeScript 5 or higher

## Installation

Install the Privy React SDK using your package manager of choice:

<CodeGroup>
  ```bash npm theme={"system"}
  npm install @privy-io/react-auth@latest
  ```

  ```bash pnpm theme={"system"}
  pnpm install @privy-io/react-auth@latest
  ```

  ```bash yarn theme={"system"}
  yarn add @privy-io/react-auth@latest
  ```
</CodeGroup>

<Accordion title="Solana dependencies">
  If your app uses Privy's Solana wallets, install the following peer dependencies:

  * `@solana/kit`
  * `@solana-program/memo`
  * `@solana-program/system`
  * `@solana-program/token`

  Additionally, if you are using webpack, include the following configurations to add them to webpack's `externals` config. Note that these configurations are not needed if you are using Turbopack:

  ```js  theme={"system"}
  // webpack.config.js
  module.exports = {
    //...
    externals: {
      ['@solana/kit']: 'commonjs @solana/kit',
      ['@solana-program/memo']: 'commonjs @solana-program/memo',
      ['@solana-program/system']: 'commonjs @solana-program/system',
      ['@solana-program/token']: 'commonjs @solana-program/token'
    }
  };

  // next.config.js
  module.exports = {
    webpack: (config) => {
      // ...
      config.externals['@solana/kit'] = 'commonjs @solana/kit';
      config.externals['@solana-program/memo'] = 'commonjs @solana-program/memo';
      config.externals['@solana-program/system'] = 'commonjs @solana-program/system';
      config.externals['@solana-program/token'] = 'commonjs @solana-program/token';
      return config;
    }
  };
  ```
</Accordion>
\n