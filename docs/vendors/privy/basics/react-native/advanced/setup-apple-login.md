> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# null

Privy supports native [Apple login](https://developer.apple.com/sign-in-with-apple/) when running on iOS.
Apple is an OAuth2.0 compliant authentication provider, but requires a specific implementation of Apple sign-in within iOS apps.

<Tip>
  Prior to integrating Sign in with Apple, make sure you configure [Apple as a login method in your
  dashboard.](/basics/get-started/dashboard/configure-login-methods) Make sure your app's `Bundle
    ID` rather than the `Service ID`, is configured as the `Client ID` within the **Privy Dashboard**.
</Tip>

### Installing the Apple Authentication module

```sh  theme={"system"}
npx expo install expo-apple-authentication
```

You can configure `expo-apple-authentication` using its built-in [config plugin](https://docs.expo.dev/versions/latest/sdk/apple-authentication/#configuration-in-app-config) if you use config plugins.

In your `app.json` config file:

* Set the `ios.usesAppleSignIn` property to `true`.
* Add `"expo-apple-authentication"` to the `plugins` array.

```json  theme={"system"}
{
  "expo": {
    "ios": {
      "usesAppleSignIn": true
    },
    "plugins": ["expo-apple-authentication"]
  }
}
```

## Initializing the login flow

With Privy's Expo SDK, you can use `'apple'` just as any other [OAuth provider](/authentication/user-authentication/login-methods/oauth).

```tsx  theme={"system"}
import {useLoginWithOAuth} from '@privy-io/expo';

export function LoginScreen() {
  const {login} = useLoginWithOAuth();

  return (
    <View>
      <Button onPress={() => login({provider: 'apple'})}>Login with Apple</Button>
    </View>
  );
}
```

Refer to our [OAuth login](/authentication/user-authentication/login-methods/oauth) guide for more information on login with OAuth providers.

## Using the web based flow instead of the native flow

<Tip>
  Privy will **automatically** fallback to the web-based flow on Android devices, where native Apple
  sign-in isn't supported.
</Tip>

For the best possible user experience, we recommend using the native "Sign in with Apple" flow as described above. However, if you are unable to use the native flow, or prefer not to, you can use the web based flow instead:

```tsx  theme={"system"}
import {useLoginWithOAuth} from '@privy-io/expo';

export function LoginScreen() {
  const {login} = useLoginWithOAuth();

  return (
    <View style={styles.container}>
      <Button onPress={() => login({provider: 'apple', isLegacyAppleIosBehaviorEnabled: true})}>
        Login with Apple
      </Button>
    </View>
  );
}
```
\n