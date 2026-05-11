> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# null

**By default, the Privy Expo SDK makes use of [`expo-secure-store`](https://docs.expo.dev/versions/latest/sdk/securestore/) package to persist sessions after your app is closed.**

### Custom storage adapters

If you'd rather persist sessions in a different way, you can easily build an adapter and provide it as an optional prop to the **`PrivyProvider`** component:

```tsx  theme={"system"}
import MyStorageProvider from 'my-storage-provider';

import {PrivyProvider} from '@privy-io/expo';
import type {Storage} from '@privy-io/js-sdk-core';

import AppContent from './AppContent';

const myStorage: Storage = {
  get: (key) => MyStorageProvider.getItem(key),
  put: (key, val) => MyStorageProvider.setItem(key, val),
  del: (key) => MyStorageProvider.deleteItem(key),
  getKeys: () => MyStorageProvider.allKeys()
};

export function App() {
  return (
    <PrivyProvider appId={'my-app-id'} storage={myStorage}>
      <AppContent />
    </PrivyProvider>
  );
}
```

### Customizing the access policy for `expo-secure-store`

The default **`expo-secure-store`** adapter setup requires the device to be unlocked at least once before accessing storage, which allows you to perform background operations, but still require the user to be in the loop after a device restart. Your app can customize the storage adapter, although be aware that this can have unexpected effects on Privy authentication state. Only do so if you are fully aware of the implications the changes you make will have.

Create a [**Custom Storage Adapter**](#custom-storage-adapters) that specifies the desired value for [**`keychainAccessible`**](https://docs.expo.dev/versions/latest/sdk/securestore/#constants) as a [**configuration option**](https://docs.expo.dev/versions/latest/sdk/securestore/#securestoreoptions) for each method.

```tsx  theme={"system"}
import * as SecureStore from 'expo-secure-store';

import type {Storage} from '@privy-io/js-sdk-core';

// We can require the user to set a passcode on the device to allow accessing storage, so Privy
// state is inaccessible if the user hasn't set or removes a passcode.
export const MyRestrictiveSecureStorageAdapter: Storage = {
  get(key) {
    return SecureStore.getItemAsync(key, {
      keychainAccessible: SecureStore.WHEN_PASSCODE_SET_THIS_DEVICE_ONLY
    });
  },
  put(key, val) {
    return SecureStore.setItemAsync(key, val as string, {
      keychainAccessible: SecureStore.WHEN_PASSCODE_SET_THIS_DEVICE_ONLY
    });
  },
  del(key) {
    return SecureStore.deleteItemAsync(key, {
      keychainAccessible: SecureStore.WHEN_PASSCODE_SET_THIS_DEVICE_ONLY
    });
  },
  getKeys: async () => []
};
```
\n