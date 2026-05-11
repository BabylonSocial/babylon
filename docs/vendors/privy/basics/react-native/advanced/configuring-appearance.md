> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# null

You can customize the theme and appearance of Privy's default UIs in your app.

## Brand color

Privy's default UIs for Expo support theming by using the **brand color** you have [set in the dashboard](/recipes/dashboard/customization#brand-color), or by setting a value specific to your mobile application by using the `PrivyElements` `config` prop.

If you want to set the value manually, instead of automatically through the dashboard, you should set the `accentColor` config option on the `PrivyElements` component.

```tsx  theme={"system"}
import {PrivyElements} from '@privy-io/expo/ui';

export default function RootLayout() {
  return (
    <>
      {/* Your app's content */}
      <PrivyElements config={{appearance: {accentColor: '#00AF55'}}} />
    </>
  );
}
```

## Color scheme (light and dark mode)

Privy's default UIs also support adapting the color scheme to both light and dark mode, via the `colorScheme` config option.

You can set a fixed value if that best matches the experience and design of your application, or you can use React Native's own `useColorScheme` hook to get a dynamic value and adapt to your user's settings.

```tsx  theme={"system"}
import {useColorScheme} from 'react-native';

import {PrivyElements} from '@privy-io/expo/ui';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <>
      {/* Your app's content */}
      <PrivyElements config={{appearance: {colorScheme}}} />
    </>
  );
}
```
\n