> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# null

## Requirements

* A React Native project using the latest version
* iOS and Android platform support (Web is not supported)

## Installation

### Core Dependencies

Install the Privy React Native SDK and its peer dependencies:

```bash  theme={"system"}
npx expo install expo-apple-authentication expo-application expo-crypto expo-linking expo-secure-store expo-web-browser react-native-passkeys react-native-webview @privy-io/expo-native-extensions @privy-io/expo
```

### Required Polyfills

Install the necessary polyfills:

```bash  theme={"system"}
npm i fast-text-encoding react-native-get-random-values @ethersproject/shims
```

<Tip>
  If your app uses the Expo [bare workflow](https://docs.expo.dev/bare/) ("React Native without Expo"), also run:

  ```bash  theme={"system"}
  npx pod-install
  ```
</Tip>

### Configure Polyfills

<Tabs>
  <Tab title="Using expo/router">
    Create an `entrypoint.js` file and update your `package.json`:

    ```js entrypoint.js theme={"system"}
    // Import required polyfills first
    import 'fast-text-encoding';
    import 'react-native-get-random-values';
    import '@ethersproject/shims';
    // Then import the expo router
    import 'expo-router/entry';
    ```

    ```json package.json theme={"system"}
    {
      "name": "<your app name>",
      "main": "entrypoint.js"
    }
    ```
  </Tab>

  <Tab title="Without expo/router">
    Import the polyfills at the root of your application:

    ```jsx  theme={"system"}
    // Import required polyfills first
    import 'fast-text-encoding';
    import 'react-native-get-random-values';
    import '@ethersproject/shims';

    // Other imports
    ...

    // Your app's root component
    export default function App() {
      ...
    }
    ```
  </Tab>
</Tabs>

<Note>
  If you're using the `@solana/web3.js` package, install the buffer dependency:

  ```bash  theme={"system"}
  npm i buffer
  ```

  And add this code after importing `react-native-get-random-values`:

  ```js  theme={"system"}
  import 'react-native-get-random-values';
  import {Buffer} from 'buffer';
  global.Buffer = Buffer;
  ```
</Note>

<Accordion title="Metro build configuration">
  This guide ensures that your application satisfies the following requirements for integrating:

  * uses an [expo development build](https://docs.expo.dev/develop/development-builds/introduction/).
  * has a custom [`metro.config.js` file](https://docs.expo.dev/guides/customizing-metro/#customizing) to customize the Metro bundler settings
  * enables [package exports for the Metro bundler:](https://reactnative.dev/blog/2023/06/21/package-exports-support#for-app-developers)
  * uses the `bundler` setting for [Typescript's `moduleResolution`](https://www.typescriptlang.org/tsconfig#moduleResolution)

  ## Enabling Package Exports

  <Info>
    React Native 0.79, and Expo 53, have [enabled package exports by default](https://reactnative.dev/blog/2025/04/08/react-native-0.79#metro-faster-startup-and-package-exports-support).

    Some popular packages present incompatibilities with this change, and the community is working to get these fixed at source.
    In the meantime, we present a fix below by disabling package exports for the incompatibilities we have found.
  </Info>

  Update your `metro.config.js` like so:

  ```js  theme={"system"}
  //...other config logic

  // Enable package exports for select libraries
  ...
  const resolveRequestWithPackageExports = (context, moduleName, platform) => {
    // Package exports in `isows` (a `viem`) dependency are incompatible, so they need to be disabled
    if (moduleName === "isows") {
      const ctx = {
        ...context,
        unstable_enablePackageExports: false,
      };
      return ctx.resolveRequest(ctx, moduleName, platform);
    }

    // Package exports in `zustand@4` are incompatible, so they need to be disabled
    if (moduleName.startsWith("zustand")) {
      const ctx = {
        ...context,
        unstable_enablePackageExports: false,
      };
      return ctx.resolveRequest(ctx, moduleName, platform);
    }

    // Package exports in `jose` are incompatible, so the browser version is used
    if (moduleName === "jose") {
      const ctx = {
        ...context,
        unstable_conditionNames: ["browser"],
      };
      return ctx.resolveRequest(ctx, moduleName, platform);
    }

    // The following block is only needed if you are
    // running React Native 0.78 *or older*.
    if (moduleName.startsWith('@privy-io/')) {
      const ctx = {
        ...context,
        unstable_enablePackageExports: true,
      };
      return ctx.resolveRequest(ctx, moduleName, platform);
    }

    return context.resolveRequest(context, moduleName, platform);
  };

  config.resolver.resolveRequest = resolveRequestWithPackageExports;

  ...
  module.exports = config;
  ```

  ## Typescript's Module Resolution

  Also configure your `tsconfig.json` like so:

  ```json  theme={"system"}
  {
    "extends": "expo/tsconfig.base",
    "compilerOptions": {
      "strict": true,
      // Allows us to use conditional/deep imports on published packages
      "moduleResolution": "Bundler"
    }
  }
  ```
</Accordion>
\n