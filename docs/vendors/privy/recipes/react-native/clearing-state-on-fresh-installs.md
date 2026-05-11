> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# null

The React Native SDK for Privy stores session state in the Expo Secure Store, powered by the Keychain on iOS.
This means that when a user reinstalls your app, Privy is able to restore their existing session.

This is great for user experience, and is standard behavior for iOS apps throughout.
However, there are some cases where you may want to clear the state on a fresh install.

## Log out the user on a fresh install

To do this, you should keep a flag in your app's storage, one that you can check to see if the app has been reinstalled, and set it on first launch.

First, install the `@react-native-async-storage/async-storage` package, as a way to store the flag in your app's storage in a way that it does not persist across app reinstalls.

```sh  theme={"system"}
npx expo install @react-native-async-storage/async-storage
```

Then, in your app, you can check for a fresh install and clear the state on a fresh install.
Make sure to run this code in the root of your app, so it runs as soon as the app is launched, like so:

```ts  theme={"system"}
import {useEffect} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {usePrivy} from '@privy-io/expo';

// ...

const {logout} = usePrivy();

useEffect(() => {
  const checkForFreshInstall = async () => {
    const hasLaunchedBefore = await AsyncStorage.getItem('hasLaunchedBefore');
    if (!hasLaunchedBefore) {
      await AsyncStorage.setItem('hasLaunchedBefore', 'true');
      await logout();
    }
  };
  checkForFreshInstall();
}, [logout]);
```

This will clear the state on a fresh install, but ensure state is restored on subsequent launches.

### My app is already in production

If your application is already deployed in production, note that this will also **log out every user the first time** they launch after this update, as if it were a fresh install.

This can be circumvented by doing an intermediate release first, that includes the `setItem` logic only, but not the `logout` call yet.

```ts  theme={"system"}
import AsyncStorage from '@react-native-async-storage/async-storage';

const checkForFreshInstall = async () => {
  const hasLaunchedBefore = await AsyncStorage.getItem('hasLaunchedBefore');
  if (!hasLaunchedBefore) {
    await AsyncStorage.setItem('hasLaunchedBefore', 'true');
    // No logout in this release, add it in the next release.
  }
};
```

This ensures that no users are logged out on the first launch after this update, and that they will be ready for the next update.
\n