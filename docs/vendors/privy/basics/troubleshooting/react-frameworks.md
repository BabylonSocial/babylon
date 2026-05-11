> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Common framework errors

If you're running into build errors with your framework, check out the following troubleshooting steps:

<Tabs>
  <Tab title="Gatsby">
    If you're using a framework like [Gatsby](https://www.gatsbyjs.com/) and are running into build errors, check out some common errors below, and how to resolve them.

    ## iframe not initialized

    If you encounter an error like the one below:

    ```
    iframe not initialized
    ```

    There is likely an issue with how you are rendering the **`PrivyProvider`** component within your app.

    Namely, **if you are using Gatsby's [`wrapRootElement`](https://www.gatsbyjs.com/docs/reference/config-files/gatsby-browser/#wrapRootElement) to wrap your app with the `PrivyProvider`, you should use [`wrapPageElement`](https://www.gatsbyjs.com/docs/reference/config-files/gatsby-browser/#wrapPageElement) instead**, like below:

    ```tsx gatsby-browser.tsx theme={"system"}
    import React from 'react';

    import {PrivyProvider} from '@privy-io/react-auth';

    export const wrapPageElement = ({element}) => {
      return <PrivyProvider appId={'insert-your-app-id'}>{element}</PrivyProvider>;
    };
    ```

    Though Gatsby typically recommends using [**`wrapRootElement`**](https://www.gatsbyjs.com/docs/reference/config-files/gatsby-browser/#wrapRootElement) for React Contexts, the **`PrivyProvider`** component contains UI (HTML) elements as well, including a dialog (the Privy modal) and an iframe (the Privy iframe, used for embedded wallets). Given these UI elements, [**`wrapPageElement`**](https://www.gatsbyjs.com/docs/reference/config-files/gatsby-browser/#wrapPageElement) must be used instead of **`wrapRootElement`**.

    <Info>
      Still have questions? Reach out to our [support team](https://privy.io/slack) – we're here to help!
    </Info>
  </Tab>

  <Tab title="NextJS">
    If you're using a framework like [NextJS](https://nextjs.org/) and are running into build errors, check out some common errors below, and how to resolve them.

    ## App router

    If you are using the new [app router](https://nextjs.org/docs/app), you may encounter issues when attempting to wrap your app with the **`PrivyProvider`**. If so, follow the instructions below to set up your app with Privy:

    #### 1. Create a wrapper component for the **`PrivyProvider`**

    Since the **`PrivyProvider`** is a third-party React Context, it can only be used client-side, with the [**`'use client';`**](https://react.dev/reference/react/use-client) directive. Check out [these docs from NextJS](https://nextjs.org/docs/app/building-your-application/rendering/composition-patterns#using-context-providers) for more information.

    First, create a new component file and add [**`'use client';`**](https://react.dev/reference/react/use-client) as the first line. Then, within this same file, create a custom component (e.g. **`Providers`**) that accepts React [**`children`**](https://react.dev/learn/passing-props-to-a-component#passing-jsx-as-children) as props, and renders these [**`children`**](https://react.dev/learn/passing-props-to-a-component#passing-jsx-as-children), wrapped by the **`PrivyProvider`**:

    ```tsx  theme={"system"}
    // components/providers.tsx
    'use client';

    import {PrivyProvider} from '@privy-io/react-auth';

    export default function Providers({children}: {children: React.ReactNode}) {
      return <PrivyProvider appId="insert-your-privy-app-id">{children}</PrivyProvider>;
    }
    ```

    This wrapper component ensures that the **`PrivyProvider`** is only ever rendered client-side, as required by NextJS.

    #### 2. Wrap your app with the providers component in your **`RootLayout`**

    Next, in your app's [Root Layout](https://nextjs.org/docs/app/building-your-application/routing/pages-and-layouts#root-layout-required), wrap the layout's [**`children`**](https://react.dev/learn/passing-props-to-a-component#passing-jsx-as-children) with your providers component, like so:

    ```tsx  theme={"system"}
    import Providers from '../components/providers';

    export default function RootLayout({children}: {children: React.ReactNode}) {
      return (
        <html lang="en">
          <body>
            <Providers>{children}</Providers>
          </body>
        </html>
      );
    }
    ```

    Within your [**`RootLayout`**](https://nextjs.org/docs/app/building-your-application/routing/pages-and-layouts#root-layout-required), make sure you are using the wrapper component you created in step (1), *not* the raw **`PrivyProvider`** exported by the SDK.

    **That's it!** You can check out a complete example of Privy integrated into a NextJS app using the App Router [here](https://github.com/privy-io/examples/tree/main/privy-next-starter).

    <Info>
      Still have questions? Reach out to our [support team](https://privy.io/slack) – we're here to help!
    </Info>
  </Tab>

  <Tab title="Create React App">
    If you're using a framework like [Create React App](https://create-react-app.dev/) and are running into build errors, check out some common errors and how to resolve them.

    ## Missing Polyfills (Webpack 5)

    Since Create React App uses [Webpack 5](https://webpack.js.org/blog/2020-10-10-webpack-5-release/), you may encounter errors like the one below:

    ```
    BREAKING CHANGE: webpack < 5 used to include polyfills for node.js core modules by default.
    This is no longer the case. Verify if you need this module and configure a polyfill for it.
    ```

    This is because many standard web3 libraries, such as [`ethers.js`](https://docs.ethers.io/v5/), have dependencies that need to be polyfilled into your build environment. Webpack 5 no longer automatically handles these polyfills, which triggers this error.

    You can work past these issues by explicitly adding in these dependencies and overriding some configurations, as outlined below:

    #### 1. Install dependencies

    Run the following command in your project to install the necessary dependencies:

    ```sh  theme={"system"}
    npm i --save-dev react-app-rewired assert buffer process stream-browserify url
    ```

    #### 2. Configure your project with `react-app-rewired`

    In your `package.json`, in your start, build, and test scripts, update `react-scripts` to `react-app-rewired`. The "scripts" object should look like the following:

    ```json package.json theme={"system"}
    {
        ...,
        "scripts": {
            "start": "react-app-rewired start",
            "build": "react-app-rewired build",
            "test": "react-app-rewired test",
            "eject": "react-scripts eject"
        },
        ...
    }

    ```

    This allows you to bypass the default webpack configurations from `create-react-app`.

    #### 3. Add `config-overrides.js` to your project

    Lastly, at the root of your project, create a file called `config-overrides.js` and paste in the following:

    ```js config-overrides.js theme={"system"}
    const webpack = require('webpack');
    module.exports = function override(config) {
      config.resolve.fallback = {
        assert: require.resolve('assert'),
        buffer: require.resolve('buffer'),
        'process/browser': require.resolve('process/browser'),
        stream: require.resolve('stream-browserify'),
        url: require.resolve('url'),
        http: false,
        https: false,
        os: false
      };
      config.plugins.push(
        new webpack.ProvidePlugin({
          process: 'process/browser',
          Buffer: ['buffer', 'Buffer']
        })
      );
      config.ignoreWarnings = [/Failed to parse source map/];
      return config;
    };
    ```

    This tells your browser where to look for the dependencies that you've now added.

    **That's it!**

    <Info>
      Still have questions? Reach out to our [support team](https://privy.io/slack) – we're here to help!
    </Info>
  </Tab>

  <Tab title="Vite">
    If you're using a framework like [Vite](https://vitejs.dev/) and are running into build errors, check out some common errors below, and how to resolve them.

    ## `process` is not defined

    If you encounter an error like the one below:

    ```
    Uncaught (in promise) ReferenceError: process is not defined at ../../../node_modules/@coinbase/wallet-sdk/dist/CoinbaseWalletSDK.js
    ```

    This is due to an issue in one of Privy's necessary dependencies, the [Coinbase Wallet SDK](https://github.com/coinbase/coinbase-wallet-sdk). You can read more about the issue [here](https://github.com/coinbase/coinbase-wallet-sdk/issues/967).

    **To resolve the issue, we recommend using the [`vite-plugin-node-polyfills`](https://www.npmjs.com/package/vite-plugin-node-polyfills) package, which will polyfill the `process` dependency that Coinbase requires.**

    #### 1. Install **`vite-plugin-node-polyfills`**

    First, install [**`vite-plugin-node-polyfills`**](https://www.npmjs.com/package/vite-plugin-node-polyfills) as a dev dependency:

    ```sh  theme={"system"}
    npm i --save-dev vite-plugin-node-polyfills
    ```

    #### 2. Update your **`vite.config.ts`**

    Then, update your [**`vite.config.ts`**](https://vitejs.dev/config/) file to include the following to use the plugin:

    ```ts  theme={"system"}
    import {defineConfig} from 'vite';
    import {nodePolyfills} from 'vite-plugin-node-polyfills';

    // https://vitejs.dev/config/
    export default defineConfig({
      plugins: [nodePolyfills()]
    });
    ```

    **That's it!**

    <Info>
      Still have questions? Reach out to our [support team](https://privy.io/slack) - we're here to help!
    </Info>
  </Tab>
</Tabs>
\n