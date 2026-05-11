> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Setting a system theme for the Privy modal

**With Privy, you can style your login modal to match your user's system preferences for light or dark mode.** Below is a short guide for how to configure your login modal to match your user's system settings.

### 1. Get your user's system preferences

To start, you should determine if your user's system preferences are configured for light mode, or for dark mode.Based on their system preferences, your user's device will automatically set the [`prefers-color-scheme`](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-color-scheme) CSS media feature in your website to indicate their light/dark preference. You can simply query this media feature to determine if your user prefers light or dark mode.

Below is a sample React hook to determine if your user prefers light or dark mode; feel free to use this directly in your app!

```tsx  theme={"system"}
import {useEffect, useState} from 'react';

// Returns true if the user prefers dark mode, and false otherwise
export default function useDarkMode() {
  const [darkMode, setDarkMode] = useState(false);

  const modeMe = (e: MediaQueryListEvent) => {
    setDarkMode(!!e.matches);
  };

  useEffect(() => {
    // Query the `prefers-color-scheme` media feature
    const matchMedia = window.matchMedia('(prefers-color-scheme: dark)');
    setDarkMode(matchMedia.matches);
    // Listen to changes in the `prefers-color-scheme` media feature
    matchMedia.addEventListener('change', modeMe);
    return () => matchMedia.removeEventListener('change', modeMe);
  }, []);

  return darkMode;
}
```

### 2. Construct a light and dark theme

Next, in your frontend code, [create an `appearance` configuration object](/basics/react/advanced/configuring-appearance) for both light *and* dark mode. You can use the default Privy light and dark themes, e.g.:

<View title="Light" icon="react">
  ```tsx  theme={"system"}
  const lightModeConfig = {
    appearance: {
      theme: 'light',
      logo: 'light-logo-url'
    }
  };
  ```
</View>

<View title="Dark" icon="react">
  ```tsx  theme={"system"}
  const darkModeConfig = {
    appearance: {
      theme: 'dark',
      logo: 'dark-logo-url'
    }
  };
  ```
</View>

Or, you can create custom `lightModeConfig` and `darkModeConfig` objects (with custom [`theme`](/basics/react/advanced/configuring-appearance#theme)s and [`accentColor`](/basics/react/advanced/configuring-appearance#accent-color)s) to match the modal's light and dark modes with your app's branding.

### 3. Conditionally set your theme based on the user's system preferences

Lastly, in your `PrivyProvider`, conditionally pass in the `lightModeConfig` (your light mode configuration object) or `darkModeConfig` (your dark mode configuration object) depending on the user's system preferences from step 1.

```tsx  theme={"system"}
// 1. Query the user's system preferences for light or dark mode
const darkMode = useDarkMode();

// 2. Construct your light mode and dark mode configuration objects
const lightModeConfig = {
  /* your light mode configuration object */
};
const darkModeConfig = {
  /* your dark mode configuration object */
};

// 3. When you render your `PrivyProvider`, change the `config` property based on the user's system preferences
return (
  <PrivyProvider appId={'your-app-ID'} config={darkMode ? darkModeConfig : lightModeConfig}>
    {children}
  </PrivyProvider>
);
```

**That's it!** Your Privy modal's theme will now automatically match the user's system preference for light or dark mode.
\n