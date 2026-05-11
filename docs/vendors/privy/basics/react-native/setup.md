> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# null

## Prerequisites

Before you begin, make sure you have [set up your Privy app and obtained your app ID](/basics/get-started/dashboard/create-new-app) and [client ID](/basics/get-started/dashboard/app-clients) from the Privy Dashboard.

<Warning>
  A properly set up app client is required for mobile apps and other non-web platforms to allow your
  app to interact with the Privy API. Please follow [this
  guide](/basics/get-started/dashboard/app-clients) to configure an app client.
</Warning>

## Initializing Privy

In your project, **import the `PrivyProvider` component and wrap your app with it**.
The `PrivyProvider` must wrap *any* component or page that will use the Privy React Native SDK, and it is generally recommended to render it as close to the root of your application as possible.

<Tabs>
  <Tab title="Using expo/router">
    Wrap your app with the `PrivyProvider` in the `app/_layout.tsx` file.

    ```tsx  theme={"system"}
    import {PrivyProvider} from '@privy-io/expo';

    import {Slot} from 'expo-router';

    export default function RootLayout() {
      return (
        <PrivyProvider appId="your-privy-app-id" clientId="your-privy-app-client-id">
          <Slot />
        </PrivyProvider>
      );
    }
    ```

    <Accordion title="Protect routes with `AuthBoundary`">
      ### Protect routes with `AuthBoundary`

      Setting up `PrivyProvider` is all you need to use the Privy React Native SDK throughout your app! But if you want to protect certain routes, we recommend you do so by using the `AuthBoundary` component, as follows:

      Start by setting up a [route group](https://docs.expo.dev/router/layouts/#groups), like `(app)/`, under your `app/` directory. Routes placed under this group will be protected by the `AuthBoundary` component, so only authenticated users can access them.

      ```text  theme={"system"}
      app
      ├── (app)
      │   ├── _layout.tsx
      │   └── index.tsx
      ├── _layout.tsx
      └── sign-in.tsx
      ```

      In the `(app)/_layout.tsx` file, wrap the `Stack` component with the `AuthBoundary` component:

      ```tsx  theme={"system"}
      import {Stack, Redirect} from 'expo-router';

      import {AuthBoundary} from '@privy-io/expo';

      export default function AppLayout() {
        return (
          <AuthBoundary
            loading={<FullScreenLoader />}
            error={(error) => <ErrorScreen error={error} />}
            unauthenticated={<Redirect href="/sign-in" />}
          >
            <Stack />
          </AuthBoundary>
        );
      }
      ```

      You must provide the following props to `AuthBoundary`:

      * `loading` and `error` are both custom components that you can define to show specific UIs during the loading and error states.
      * On `unauthenticated`, you should redirect the user to the sign in page, as defined above!

      If you want more details, or wish to take a manual approach without using `AuthBoundary`, take a look at [Expo Router's docs on Authentication](https://docs.expo.dev/router/reference/authentication/).
    </Accordion>
  </Tab>

  <Tab title="Without expo/router">
    Wrap your app with the `PrivyProvider` in the `App.tsx` file.

    ```tsx  theme={"system"}
    import {PrivyProvider} from '@privy-io/expo';

    import {HomeScreen} from './HomeScreen';

    export default function App() {
      return (
        <PrivyProvider appId="your-privy-app-id" clientId="your-privy-app-client-id">
          <HomeScreen />
        </PrivyProvider>
      );
    }
    ```
  </Tab>
</Tabs>

## Configuration

The `PrivyProvider` component accepts the following props:

<ParamField path="appId" type="string" required>
  Your Privy App ID. You can find this in the Privy Dashboard.
</ParamField>

<ParamField path="clientId" type="string" required>
  Your Privy Client ID. You can find this in the Privy Dashboard.
</ParamField>

## Waiting for Privy to be ready

When the `PrivyProvider` is first rendered, the Privy SDK will initialize some state about the current user. This might include checking if the user has a wallet connected, refreshing expired auth tokens, fetching up-to-date user data, and more.

**It's important to wait until the `PrivyProvider` has finished initializing *before* you consume Privy's state and interfaces**, to ensure that the state you consume is accurate and not stale.

To determine whether the Privy SDK has fully initialized, **check the `isReady` Boolean returned by the `usePrivy` hook.** When `isReady` is true, Privy has completed initialization, and your app can consume Privy's state and interfaces.

```tsx  theme={"system"}
import {usePrivy} from '@privy-io/expo';

function YourComponent() {
  const {isReady} = usePrivy();

  if (!isReady) {
    return <LoadingScreen />;
  }

  // Now it's safe to use other Privy hooks and state
  return <YourAuthenticatedContent />;
}
```

<CardGroup cols={2}>
  <Card title="Quickstart Guide" icon="rocket" href="/basics/react-native/quickstart">
    Learn how to [log users in](/authentication/user-authentication/login-methods/email) and
    [transact with embedded wallets](/wallets/wallets/create/create-a-wallet)
  </Card>

  <Card title="Example Repo" icon="code" href="https://github.com/privy-io/examples/tree/main/privy-expo-starter">
    Check out our [Expo starter
    repo](https://github.com/privy-io/examples/tree/main/privy-expo-starter) for a complete example
  </Card>
</CardGroup>
\n