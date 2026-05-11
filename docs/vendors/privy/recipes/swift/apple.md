> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Login with Apple

Privy supports native [Apple login](https://developer.apple.com/sign-in-with-apple/) on iOS. Apple is an OAuth2.0 compliant authentication provider, but requires a specific implementation of Apple sign-in within iOS apps.

<Tip>
  Prior to integrating Sign in with Apple, make sure your app's `Bundle ID` rather than the `Service
    ID`, is configured as the `Client ID` within the [Privy
  Dashboard](/basics/get-started/dashboard/app-clients) for the Apple Social login credentials.
</Tip>

## The "Sign in with Apple" button

Apple's [Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/sign-in-with-apple) has a clear definition of how the Sign in with Apple button should look.
In order to ensure compliance with Apple's guidelines, we recommend you use the `ASAuthorizationAppleIDButton` class from Apple's `AuthenticationServices` framework.

**Take a look at the snippet below** if you wish to use the `ASAuthorizationAppleIDButton` in SwiftUI.

```swift  theme={"system"}
struct SignInWithApple: UIViewRepresentable {
  typealias UIViewType = ASAuthorizationAppleIDButton
  func makeUIView(context: Context) -> ASAuthorizationAppleIDButton {
    return ASAuthorizationAppleIDButton()
  }

  func updateUIView(_ uiView: ASAuthorizationAppleIDButton, context: Context) {
  }
}
```

<Warning>
  Apple's `AuthenticationServices` framework also offers the [`SignInWithAppleButton` SwiftUI
  View](https://developer.apple.com/documentation/authenticationservices/signinwithapplebutton/),
  but relying on `ASAuthorizationAppleIDButton` instead allows the PrivySDK to handle the whole
  authentication process for you.
</Warning>

## Initializing Apple login

Privy automatically implements and launches Apple's native `ASAuthorizationController` after calling `privy.oAuth.login(with: OAuthProvider.apple)`. Add the `SignInWithApple` button to your view as described above, and trigger the login method when tapped.

```swift  theme={"system"}
// Add the SignInWithApple button with your view and register the tap gesture
SignInWithApple()
    .onTapGesture {
        // Ideally this is called in a view model, but showcasing logic here for brevity
        Task {
            do {
                // The `appUrlScheme` param is not necessary for using Sign in with Apple.
                // Privy will use the first valid app URL scheme from your app's info.plist.
                // Ensure your client's url schemes are registered in the Privy dashboard
                let authSession = try await privy.oAuth.login(with: OAuthProvider.apple)
            } catch {
                debugPrint("Error: \(error)")
                // Handle errors
            }
        }
    }
```
\n