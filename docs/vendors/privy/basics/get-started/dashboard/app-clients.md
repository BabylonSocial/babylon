> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# null

App clients allow you to create configure specific settings for different consumers/platforms for your app, including
mobile apps, web apps, and more. App client settings will override your app's default settings.

To add a client, go to the [Configuration > App settings page > Clients](https://dashboard.privy.io/apps?setting=clients\&page=settings) tab, and find the "Add app client" button.

<Tip>
  This step is optional if you're using the React SDK. App clients are required for all other mobile
  and non-web platforms to allow your app to interact with the Privy API.
</Tip>

<Tabs>
  <Tab title="Web Environments">
    ### Cookies

    Once you enable HttpOnly cookies on your app and add an app domain, Privy will automatically store a user's token as an HttpOnly cookie on the app domain.
    You can use app clients to enable or disable cookies for different environments.

    [Learn more about cookies here!](/recipes/react/cookies)

    ### Allowed origins

    Each app client can have a different set of allowed origins. You can set allowed origins on your app client.
    Note that if cookies are enabled, the app's domain must be one of the allowed origins.

    [Learn more about allowed origins here!](/recipes/react/allowed-domains)

    ### Session duration

    You can set the session duration for each app client. The session duration is the number of days that a user's session will last before they are logged out.

    ### Apple OAuth Client ID override

    If your application uses Apple as a social login method, you can specify a different client ID depending on which environment your application is running in. In order to use Apple login on an iOS app, the `Client ID` must be the Apple OAuth `bundleId`. All other platforms will require the `Client ID` to be the `Identifier` of the [Sign in with Apple service](https://developer.apple.com/documentation/signinwithapple/configuring-your-environment-for-sign-in-with-apple#Create-a-Services-ID).
  </Tab>

  <Tab title="Mobile/Other Environments">
    ### Allowed app identifiers

    To enforce secure usage of your Privy App ID, configure Privy to restrict which mobile apps can use your Privy App ID based on your mobile applications' application identifiers.
    An empty list will mean all requests are denied. You **must** configure at least one application identifier to use the React Native SDK.

    <Tabs>
      <Tab title="React Native">
        We'll use the unique value that identifies your app in the Apple App Store or Google Play Store.

        * For iOS apps, this is the [`bundleIdentifier`](https://docs.expo.dev/versions/latest/config/app/#bundleidentifier).
        * For Android apps, this is the [`package`](https://docs.expo.dev/versions/latest/config/app/#package).

        <CodeGroup>
          ```ts title="iOS (bundleIdentifier)" {2} theme={"system"}
          "iOS": {
              "bundleIdentifier": "com.myorg.app"
          }
          ```

          ```ts title="Android (package)" {2} theme={"system"}
          "android": {
              "package": "com.myorg.app"
          }
          ```
        </CodeGroup>

        <Tip>
          If you are using [Expo Go](https://expo.dev/client), add `host.exp.Exponent` to allow requests.
        </Tip>
      </Tab>

      <Tab title="Swift">
        We'll use your project's bundle identifier, which you can find under the "Identity" section of your app's target file.
        It likely has reverse domain format, like "com.myorg.app".
      </Tab>

      <Tab title="Android">
        We'll use your projects application ID from your app's build.gradle file.

        ```kotlin {3} theme={"system"}
        android {
            defaultConfig {
                applicationId = "com.myorg.app"
            }
        }
        ```
      </Tab>

      <Tab title="Unity">
        Copy your project's bundle identifier, which you can find under the "Identity" section of your app's target file. It likely has reverse domain format, like "com.myorg.app".
      </Tab>

      <Tab title="Flutter">
        To enforce secure usage of your Privy client ID, register your app's bundle identifier under the app client that was just created.

        1. Copy your iOS project's bundle identifier, which you can find under the "Identity" section of your app's target file.
        2. Copy your Android project's application ID from your app's build.gradle file.
      </Tab>
    </Tabs>

    ### Allowed URL schemes

    To use Privy's social login flows (e.g. Apple, Google, etc.) or integrate with a [global wallet](/wallets/global-wallets/overview),
    you must register the **URL scheme** (e.g. `myapp://`) for your application with Privy.

    An empty list will mean that all redirects coming from URL schemes will be rejected. You **must** register at least one URL scheme.

    <Tip>
      A full URL scheme, including path (e.g. `myapp://shire`) will only allow exactly that path. By
      specifying a scheme only (e.g. `myapp`), all paths will be supported.
    </Tip>

    <Tabs>
      <Tab title="React Native">
        To register your URL scheme, **copy your application's URL `scheme` from `app.json` or `app.config.ts`** and register it in the app client settings.

        <Warning>For **development only** if you are using [Expo Go](https://expo.dev/client), enter **`exp`** as the URL scheme for the Expo Go app.</Warning>

        ### Apple OAuth Client ID override

        If your application uses Apple as a social login method, you can specify a different client ID depending on which environment your application is running in. In order to use Apple login on an iOS app, the `Client ID` must be the Apple OAuth `bundleId`. All other platforms will require the `Client ID` to be the `Identifier` of the [Sign in with Apple service](https://developer.apple.com/documentation/signinwithapple/configuring-your-environment-for-sign-in-with-apple#Create-a-Services-ID).
      </Tab>

      <Tab title="Swift">
        First, register your URL scheme in your Xcode project. If you're unsure how, you can follow [these steps](https://developer.apple.com/documentation/xcode/defining-a-custom-url-scheme-for-your-app#Register-your-URL-scheme).
        Then, use the URL scheme you registered in the app client settings.

        ### Apple OAuth Client ID override

        If your application uses Apple as a social login method, you can specify a different client ID depending on which environment your application is running in. In order to use Apple login on an iOS app, the `Client ID` must be the Apple OAuth `bundleId`. All other platforms will require the `Client ID` to be the `Identifier` of the [Sign in with Apple service](https://developer.apple.com/documentation/signinwithapple/configuring-your-environment-for-sign-in-with-apple#Create-a-Services-ID).
      </Tab>

      <Tab title="Android">
        Add your URL scheme in your Android manifest. If you're unsure how, you can follow [this guide](https://developer.android.com/training/app-links/deep-linking).
        Then, use the URL scheme you registered in the app client settings.
      </Tab>

      <Tab title="Unity">
        For non-web platforms, be sure to [setup deeplinking](https://docs.unity3d.com/Manual/deep-linking.html) with your allowed URL scheme.

        ### Apple OAuth Client ID override

        If your application uses Apple as a social login method, you can specify a different client ID depending on which environment your application is running in. In order to use Apple login on an iOS app, the `Client ID` must be the Apple OAuth `bundleId`. All other platforms will require the `Client ID` to be the `Identifier` of the [Sign in with Apple service](https://developer.apple.com/documentation/signinwithapple/configuring-your-environment-for-sign-in-with-apple#Create-a-Services-ID).
      </Tab>
    </Tabs>

    <details>
      <summary><b>Why is this required?</b></summary>

      Certain flows within the Privy authentication process require Privy to register allowed callback URLs with third-party service providers. The plainest example of this is social login flows using the OAuth 2.0 Protocol, where Privy must register allowed callback URLs with Google, Apple, and other OAuth login providers.

      Configuring your allowed URL schemes in the Privy Dashboard ensures Privy updates the appropriate settings with these third-party service providers!
    </details>

    ### Session duration

    You can set the session duration for each app client. The session duration is the number of days that a user's session will last before they are logged out.
  </Tab>
</Tabs>
\n