> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# null

<Tip>
  To see an example application that has the Privy Expo SDK configured with passkeys, check out our
  [Expo starter repo!](https://github.com/privy-io/examples/tree/main/privy-expo-starter)
</Tip>

## 0. Ensure you have configured a custom build configuration

<Info>
  If you have not already configured a custom build configuration, follow the [custom build
  configuration guide](/basics/react-native/installation#metro-build-configuration).
</Info>

## 1. Install additional peer dependencies

```sh  theme={"system"}
npx expo install react-native-passkeys
```

## 2. Update native app settings

<Tabs>
  <Tab title="iOS">
    Passkeys require that you associate a website with your app. To do so, you need to have the associated domain file on your website and the appropriate entitlement in your app.

    #### 1. Apple App Site Association

    * Create a `JSON` file with *at least* the following content

    ```json  theme={"system"}
    {
      "webcredentials": {
        "apps": ["<teamID>.<bundleID>"]
      }
    }
    ```

    * Make the file accessible on your website at the following path

    ```txt  theme={"system"}
    https://<your_domain>/.well-known/apple-app-site-association
    ```

    **Make sure to use your `teamID` and `bundleID` in the file hosted on your website.**

    For more information about supporting associated domains [see Apple's documentation](https://developer.apple.com/documentation/xcode/supporting-associated-domains).

    #### 2. App configuration

    Next, update your `app.json` (or `app.config.ts`) to include the `associatedDomains` and `deploymentTarget` like so:

    ```json  theme={"system"}
    {
      "expo": {
        "ios": {
          "associatedDomains": ["webcredentials:<your_domain>"]
        }
        "plugins": [
          [
            "expo-build-properties",
            {
              "ios": {
                "deploymentTarget": "15.0"
              }
            }
          ]
        ]
      }
    }
    ```

    #### 3. Build

    Lastly, build your app!

    ```sh  theme={"system"}
    npx expo prebuild -p ios
    npx expo run:ios
    ```
  </Tab>

  <Tab title="Android">
    To enable passkey support for your Android app, associate your app with a website that your app owns.

    #### 1. Digital Asset Links

    * Create a `JSON` file with *at least* the following content

    ```json  theme={"system"}
    [
      {
        "relation": ["delegate_permission/common.handle_all_urls"],
        "target": {
          "namespace": "android_app",
          "package_name": "<package_name>",
          "sha256_cert_fingerprints": ["<sha256_cert_fingerprint>"]
        }
      }
    ]
    ```

    * Make the file accessible on your website at the following path

    ```txt  theme={"system"}
    https://<your_domain>/.well-known/assetlinks.json
    ```

    **Make sure to use your `package_name` and `sha256_cert_fingerprint` in the file hosted on your website.**

    For more information on obtaining the `sha256_cert_fingerprint` for your app, see the [signing report documentation](https://developer.android.com/studio/publish/app-signing#signing_report). For more information about generally supporting Digital Asset Links [see Google's documentation](https://developer.android.com/training/sign-in/passkeys#add-support-dal).

    #### 2. Dashboard

    You will also need to add your `sha256_cert_fingerprint` to the allowed Android key hashes list in the `Settings` tab of the Privy dashboard.

    #### 3. App configuration

    Next, update your `app.json` (or `app.config.ts`) to look like:

    ```json  theme={"system"}
    {
      "expo": {
        "plugins": [
          [
            "expo-build-properties",
            {
              "android": {
                "compileSdkVersion": 34
              }
            }
          ]
        ]
      }
    }
    ```

    #### 4. Build

    Lastly, build your app!

    ```sh  theme={"system"}
    npx expo prebuild -p android
    npx expo run:android
    ```
  </Tab>
</Tabs>
\n