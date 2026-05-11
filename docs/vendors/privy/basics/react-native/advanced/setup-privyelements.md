> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Setting up Privy UIs

Before integrating Privy's default UIs into your app, you must first ensure the necessary components and fonts are installed.

## Custom Build Configuration

Using Privy UIs requires a custom build configuration for your React Native application. This is necessary to ensure that the Privy SDK can properly interact with the native components and libraries it relies on.

For detailed instructions, see the [Custom Build Configuration](/basics/react-native/installation#metro-build-configuration) guide.

## Install Peer Dependencies

First, install the necessary peer dependencies:

```bash  theme={"system"}
npx expo install react-native-svg expo-clipboard react-native-qrcode-styled react-native-safe-area-context viem
```

## Fonts

### Install Font Packages

Install the following packages:

```bash  theme={"system"}
npx expo install expo-font @expo-google-fonts/inter
```

### Load Fonts

<Tabs>
  <Tab title="Using expo/router">
    Load the necessary fonts in your app's root layout (typically in `app/_layout.tsx`):

    ```tsx  theme={"system"}
    import {Inter_400Regular, Inter_500Medium, Inter_600SemiBold} from '@expo-google-fonts/inter';
    import {useFonts} from 'expo-font';

    export default function RootLayout() {
      useFonts({
        Inter_400Regular,
        Inter_500Medium,
        Inter_600SemiBold,
      });

      // ...
    }
    ```
  </Tab>

  <Tab title="Without expo/router">
    Load the necessary fonts in your app's root component (typically in `App.tsx`):

    ```tsx  theme={"system"}
    import {Inter_400Regular, Inter_500Medium, Inter_600SemiBold} from '@expo-google-fonts/inter';
    import {useFonts} from 'expo-font';

    export default function App() {
      useFonts({
        Inter_400Regular,
        Inter_500Medium,
        Inter_600SemiBold,
      });

      // ...
    }
    ```
  </Tab>
</Tabs>

## PrivyElements Component

Privy's default UIs in the React Native SDK are powered by the `PrivyElements` modal component.

<Warning>Only mount `PrivyElements` once in your app.</Warning>

```tsx  theme={"system"}
import {PrivyElements} from '@privy-io/expo/ui';

export default function RootLayout() {
  return (
    <>
      {/* Your app's content */}
      <PrivyElements />
    </>
  );
}
```
\n