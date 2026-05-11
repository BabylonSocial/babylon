> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Integrating your authentication provider with Privy

Follow the guide below to integrate your authentication provider with Privy.

<View title="React" icon="react">
  ### Implementation

  To integrate JWT-based authentication with Privy in your React application, you'll need to use
  the `useSubscribeToJwtAuthWithFlag` hook to subscribe the Privy SDK to your auth provider's
  state.

  #### Getting the state from your auth provider

  To get the state from your auth provider, import the provider's hook.

  ```tsx  theme={"system"}
  // Import your auth provider's hook or state management
  import { useAuth } from 'your-auth-provider';

  // Get auth details from your provider
  const { getToken, isLoading, isAuthenticated } = useAuth();
  ```

  #### Subscribing to the auth provider's state

  In a component that lives below both `PrivyProvider`, and your custom auth provider, call the
  `useSubscribeToJwtAuthWithFlag` hook to subscribe the Privy SDK to your auth provider's state.

  ```tsx  theme={"system"}
  import { useAuth } from 'your-auth-provider';
  import { useSubscribeToJwtAuthWithFlag } from '@privy-io/react-auth';

  const MyStateSyncComponent = () => {
      const { getToken, isLoading, isAuthenticated } = useAuth();

      useSubscribeToJwtAuthWithFlag({
          isAuthenticated,
          isLoading,
          getExternalJwt: async () => {
              if (isAuthenticated) {
                  const token = await getToken();
                  return token;
              }
          }
      })

      return null;
  }
  ```

  This hook will observe state from your auth provider and update the Privy SDK's authentication
  state accordingly.
  The hook itself (and the `MyStateSyncComponent` component) should be mounted throughout the
  lifetime of your app to ensure state is kept in sync.

  #### Integrate the provider with your app

  Make sure to nest your custom provider inside your auth provider in your app structure:

  ```tsx App.tsx theme={"system"}
  import { AuthProvider } from 'your-auth-provider';
  import PrivyAuthProvider from './PrivyAuthProvider';

  function App() {
      return (
          <AuthProvider>
              <PrivyAuthProvider>
                  {/* Invocation of `useSubscribeToJwtAuthWithFlag` must be below both providers */}
                  <MyStateSyncComponent />
                  <MainContent />
              </PrivyAuthProvider>
          </AuthProvider>
      );
  }

  export default App;
  ```

  #### Disabling the external auth provider

  If you want to disable the external auth provider, you can set the `enabled` flag to `false` in
  the hook configuration.

  ```tsx  theme={"system"}
  useSubscribeToJwtAuthWithFlag({
      enabled: false,
      isAuthenticated,
      // ...
  });
  ```

  Setting the `enabled` flag to `false` will disable the external auth provider and will stop
  Privy from attempting to synchronize its state with the external auth provider regardless of the
  value of the `isAuthenticated` flag, until `enabled` is set to `true` again.

  ### Advanced Usage

  <Warning>
    This approach is **not recommended for most use cases**, as it increases the complexity of setup significantly and
    can result in state synchronization issues if used incorrectly.

    Always prefer the flag-based approach when possible if your auth provider offers an `isAuthenticated` flag.
  </Warning>

  For more advanced usage, or in cases where your auth provider lives outside React or otherwise
  offers no `isAuthenticated` flag, you can use the `useSyncJwtBasedAuthState` hook to subscribe to
  the auth provider's state via state listeners.

  Let's say the library for your auth provider exports an `authStore` object that holds state.

  ```ts  theme={"system"}
  import { authStore } from 'your-auth-provider';
  ```

  This object has a `subscribe` method that takes a callback, and invokes it every time the
  auth state changes, most importantly when the user either logs in or out.

  ```ts  theme={"system"}
  authStore.subscribe(() => {
      console.log('Auth state changed');
  });
  ```

  The store object also has a `getState` method that returns the current state, which we can use to
  get the current JWT token whenever necessary.

  ```ts  theme={"system"}
  const authState = authStore.getState();
  console.log('Is authenticated:', authState.isAuthenticated);
  console.log('JWT token:', authState.token);
  ```

  By using the `useSyncJwtBasedAuthState` hook, we can link Privy to the auth provider's state store
  by using those two methods.

  ```ts  theme={"system"}
  import { useSyncJwtBasedAuthState } from '@privy-io/react-auth';
  import { authStore } from 'your-auth-provider';

  useSyncJwtBasedAuthState({
      subscribe: (onAuthStateChange) => {
          const unsubscribe = authStore.subscribe((state) => {
              onAuthStateChange(); // Notify Privy of the auth state change.
          });

          return unsubscribe; // Return the `unsubscribe` to avoid memory leaks.
      },
      getExternalJwt: () => {
          const authState = authStore.getState();
          if (authState.isAuthenticated) {
              return authState.token;
          }
      }
  })
  ```

  ### Accessing User Authentication Status

  Once configured, you can access the user's authentication status through the Privy SDK:

  ```tsx  theme={"system"}
  import { usePrivy } from '@privy-io/react-auth';

  function MainContent() {
      const { user, ready, authenticated } = usePrivy();

      if (!ready) {
          return <div>Loading...</div>;
      }

      if (!authenticated) {
          return <div>Please log in through your authentication provider</div>;
      }

      return (
          <div>
              <p>Welcome, authenticated user!</p>
              <p>User ID: {user.id}</p>
          </div>
      );
  }
  ```

  <Info>
    When using a custom authentication provider, you should not use the Privy `login` method (from `useLogin` or `usePrivy`). Instead, call the login method of your custom provider, and the Privy SDK will automatically synchronize its state.
  </Info>
</View>

<View title="React Native" icon="react">
  ### Implementation

  To integrate JWT-based authentication with Privy in your React Native application, you'll need to create a custom `PrivyProvider` wrapper that supplies your auth token to Privy.

  #### Create a custom `PrivyProvider` wrapper

  Create a component that wraps the `PrivyProvider` with your custom auth configuration:

  ```tsx PrivyAuthProvider.tsx theme={"system"}
  import { useCallback, PropsWithChildren } from 'react';
  import { PrivyProvider } from '@privy-io/expo';

  // Import your auth provider's hook or state management
  import { useAuth0 } from 'react-native-auth0';

  const PrivyAuthProvider: React.FC<PropsWithChildren> = ({ children }) => {
      // Get auth details from your auth provider
      const { user: auth0User, isLoading, getCredentials } = useAuth0();

      // Create a callback to get the token
      const getCustomToken = useCallback(async () => {
          // Your logic to retrieve the JWT token from your auth provider
          try {
              const creds = await getCredentials();
              return creds?.idToken;
          } catch (error) {
              // If there's an error, the user is likely not authenticated
              return undefined;
          }
      }, [isLoading, auth0User, getCredentials]); // Re-create when auth state changes

      return (
          <PrivyProvider
              appId='your-privy-app-id'
              config={{
                  customAuth: {
                      enabled: true,
                      // Indicates if your auth provider is currently updating auth state
                      isLoading: isLoading,
                      // Callback to get the user's JWT token
                      getCustomAccessToken: getCustomToken,
                  }
              }}
          >
              {children}
          </PrivyProvider>
      );
  };

  export default PrivyAuthProvider;
  ```

  #### Integrate the provider with your app

  Make sure to nest your custom provider inside your auth provider in your app structure:

  ```tsx App.tsx theme={"system"}
  import { Auth0Provider } from 'react-native-auth0';
  import PrivyAuthProvider from './PrivyAuthProvider';

  function App() {
      return (
          <Auth0Provider
              domain="your-domain.auth0.com"
              clientId="your-client-id"
          >
              {/* Our custom wrapper must be nested inside your AuthProvider */}
              <PrivyAuthProvider>
                  {/* Your app content */}
                  <MainContent />
              </PrivyAuthProvider>
          </Auth0Provider>
      );
  }

  export default App;
  ```

  ### Accessing User Authentication Status

  Once configured, you can access the user's authentication status through the Privy SDK:

  ```tsx  theme={"system"}
  import { usePrivy } from '@privy-io/expo';
  import { View, Text } from 'react-native';

  function MainContent() {
      const { user, ready } = usePrivy();

      if (!ready) {
          return <Text>Loading...</Text>;
      }

      if (!user) {
          return <Text>Please log in through your authentication provider</Text>;
      }

      return (
          <View>
              <Text>Welcome, authenticated user!</Text>
              <Text>User ID: {user.id}</Text>
          </View>
      );
  }
  ```

  <Info>
    When using a custom authentication provider in React Native, you should let your auth provider handle the authentication flow. Privy will automatically synchronize its state based on the token provided by your `getCustomAccessToken` callback.
  </Info>
</View>

<View title="Swift" icon="swift">
  ### Implementation

  To integrate JWT-based authentication with Privy in your Swift application, you'll need to initialize the Privy SDK with a token provider callback and handle authentication.

  #### Initialize Privy with a token provider callback

  First, initialize the Privy SDK with a `tokenProvider` callback that will provide the JWT from your custom auth provider:

  ```swift Privy initialization with custom auth theme={"system"}
  let privy = PrivyConfig(
      appId: "YOUR_APP_ID",
      appClientId: "YOUR_APP_CLIENT_ID",
      customAuthConfig: PrivyLoginWithCustomAuthConfig {
          // Client logic to provide the JWT
          // This might involve network requests or accessing secure storage
          return await fetchAccessTokenFromAuthProvider()
      }
  )
  ```

  ```swift Example token provider implementation theme={"system"}
  private func fetchAccessTokenFromAuthProvider() async throws -> String? {
      // Your custom logic to retrieve the JWT token
      // This might be from shared preferences, secure storage, or an API call
      try await yourAuthManager.getAccessToken()
  }
  ```

  This `tokenProvider` callback should:

  * Return the current user's access token as a `String` when authenticated
  * Return `nil` when the user is not authenticated

  #### Authenticate your user

  Once you have defined a `tokenProvider` callback, authenticate your user with Privy using the `loginWithCustomAccessToken` method:

  ```swift Authenticating with Privy theme={"system"}
  do {
      try await privy.customJwt.loginWithCustomAccessToken()
      // User is now authenticated with Privy
  } catch {
      // Handle authentication errors
      print("Failed to authenticate with Privy: \(error)")
  }
  ```

  If the provided token is valid, Privy will successfully authenticate your user. If the token is invalid, this method will throw an error.

  #### Example with Auth0

  Here's an example using Auth0's Swift SDK for authentication:

  ```swift Auth0 Integration Example theme={"system"}
  // Store the Auth0 token
  var auth0Token: String? = nil

  // Set up the token provider to return the stored token
  let config = PrivyConfig(
      appId: "YOUR_APP_ID",
      appClientId: "YOUR_APP_CLIENT_ID",
      customAuthConfig: PrivyLoginWithCustomAuthConfig {
          return auth0Token
      }
  )

  // Handle Auth0 authentication
  Auth0.webAuth().start { result in
      if case .success(let credentials) = result {
          auth0Token = credentials.accessToken

          Task {
              do {
                  // Authenticate with Privy using the token
                  try await privy.customJwt.loginWithCustomAccessToken()

                  // Now the user is authenticated with Privy
                  // You can access their wallet and other features
              } catch {
                  print("Privy authentication failed: \(error)")
              }
          }
      } else {
          print("Auth0 authentication failed")
      }
  }
  ```

  ### Authentication Flow

  When using custom authentication with the Swift SDK:

  1. When the Privy SDK is first initialized, it attempts to restore any prior session
  2. If a prior session exists, Privy automatically tries to reauthenticate using your `tokenProvider`
  3. You can manually trigger authentication by calling `loginWithCustomAccessToken`
  4. After successful authentication, you have access to the `PrivyUser` object and wallet functionality

  <Info>
    When your app starts up, as soon as you determine your user is authenticated via your custom auth provider, you should call Privy's `loginWithCustomAccessToken` method to synchronize the authentication state.
  </Info>

  ### Accessing User Data

  Once authenticated, you can access the user's data and embedded wallets:

  ```swift  theme={"system"}
  // Check if user is authenticated
  if let user = privy.user {
      // Access user information
      let userId = user.id

      // Access embedded wallets
      if let wallet = user.embeddedEthereumWallets.first {
          let walletAddress = wallet.address
          print("User has Ethereum wallet with address: \(walletAddress)")
      }
  }
  ```

  Privy identifies users based on the unique ID assigned by your auth provider (stored in the `sub` claim of their access token). You can view all users in the **Users** section of the Privy Developer Dashboard.
</View>

<View title="Android" icon="android">
  ### Implementation

  To integrate JWT-based authentication with Privy in your Android application, you'll need to initialize the Privy SDK with a token provider callback and handle authentication.

  #### Initialize Privy with a token provider callback

  First, initialize the Privy SDK with a `tokenProvider` callback that will provide the JWT from your custom auth provider:

  ```kotlin Privy initialization with custom auth theme={"system"}
  private val privy: Privy = Privy.init(
      context = applicationContext, // Be sure to only pass in Application context
      config = PrivyConfig(
          appId = "YOUR_APP_ID",
          appClientId = "YOUR_APP_CLIENT_ID",
          logLevel = PrivyLogLevel.NONE,
          customAuthConfig = LoginWithCustomAuthConfig(
              tokenProvider = {
                  // Return the user's access token if they're authenticated
                  // Or return null if they're not authenticated
                  fetchTokenFromAuthProvider()
              }
          )
      )
  )

  // Example token provider implementation
  private suspend fun fetchTokenFromAuthProvider(): String? {
      return try {
          // Your custom logic to retrieve the JWT token
          // This might be from shared preferences, secure storage, or an API call
          yourAuthManager.getAccessToken()
      } catch (e: Exception) {
          // If there's an error, the user is likely not authenticated
          null
      }
  }
  ```

  The `tokenProvider` callback should:

  * Return the current user's access token as a `String` when authenticated
  * Return `null` when the user is not authenticated
  * Be implemented as a suspending function that can perform asynchronous operations

  #### Authenticate your user

  Once you've initialized Privy with a `tokenProvider` callback, authenticate your user with Privy using the `loginWithCustomAccessToken` method:

  ```kotlin Authenticating with Privy theme={"system"}
  // Make sure to call this in a coroutine scope
  val privyLoginResult = privy.customAuth.loginWithCustomAccessToken()

  privyLoginResult.fold(
      onSuccess = { user ->
          Log.d("Privy", "Privy login success! User: ${user}")
          // Now you can access user information and wallet functionality
      },
      onFailure = { error ->
          Log.d("Privy", "Privy login failure! $error")
          // Handle authentication error
      }
  )
  ```

  If the provided access or identity token is valid, Privy will authenticate your user and return a `Result.success` with the `PrivyUser` object. If the token is invalid, it will return a `Result.failure`.

  #### Example integration with Auth0

  Here's an example of integrating with Auth0 for Android:

  ```kotlin Auth0 Integration Example theme={"system"}
  private val auth0 = Auth0(
      clientId = "YOUR_AUTH0_CLIENT_ID",
      domain = "YOUR_AUTH0_DOMAIN"
  )

  // Store the Auth0 token
  private var auth0Token: String? = null

  // Initialize Privy with token provider that returns the Auth0 token
  private val privy = Privy.init(
      context = applicationContext,
      config = PrivyConfig(
          appId = "YOUR_PRIVY_APP_ID",
          appClientId = "YOUR_PRIVY_APP_CLIENT_ID",
          customAuthConfig = LoginWithCustomAuthConfig(
              tokenProvider = { auth0Token }
          )
      )
  )

  // Authenticate with Auth0, then with Privy
  private fun authenticateUser() {
      val callback = object : Callback<Credentials, AuthenticationException> {
          override fun onSuccess(credentials: Credentials) {
              // Store the token
              auth0Token = credentials.accessToken

              // Authenticate with Privy
              lifecycleScope.launch {
                  val privyResult = privy.customAuth.loginWithCustomAccessToken()
                  privyResult.fold(
                      onSuccess = { user ->
                          Log.d("Auth", "Successfully authenticated with Privy")
                          // Proceed with authenticated user
                      },
                      onFailure = { error ->
                          Log.e("Auth", "Failed to authenticate with Privy", error)
                      }
                  )
              }
          }

          override fun onFailure(error: AuthenticationException) {
              Log.e("Auth", "Auth0 authentication failed", error)
          }
      }

      // Start Auth0 authentication
      WebAuthProvider.login(auth0)
          .withScheme("demo")
          .start(this, callback)
  }
  ```

  ### Authentication flow

  When using custom authentication with the Android SDK:

  1. When the Privy SDK is first initialized, it attempts to restore any prior session
  2. If a prior session exists, Privy automatically tries to reauthenticate using your `tokenProvider`
  3. You can manually trigger authentication by calling `loginWithCustomAccessToken`
  4. After successful authentication, you have access to the `PrivyUser` object and wallet functionality

  <Info>
    It's important to await the `privy.awaitReady()` call before triggering any other Privy flows to ensure the SDK has completed initialization and attempted session restoration.
  </Info>

  ### Accessing user data and wallets

  Once authenticated, you can access the user's data and embedded wallets:

  ```kotlin  theme={"system"}
  // Check if user is authenticated
  val user = privy.user
  if (user != null) {
      // Access user information
      val userId = user.id

      // Access embedded Ethereum wallets
      val ethereumWallets = user.embeddedEthereumWallets
      if (ethereumWallets.isNotEmpty()) {
          val walletAddress = ethereumWallets.first().address
          Log.d("Wallet", "User has Ethereum wallet with address: $walletAddress")
      }
  }
  ```

  Privy identifies users based on the unique ID that your auth provider has assigned (stored in the `sub` claim of their access token). You can view all users in the **Users** section of the Privy Developer Dashboard.
</View>

<View title="Flutter" icon="flutter">
  ### Implementation

  To integrate JWT-based authentication with Privy in your Flutter application, you'll need to initialize the Privy SDK with a token provider callback and handle authentication.

  #### Initialize Privy with a token provider callback

  First, initialize the Privy SDK with a `tokenProvider` callback that will provide the JWT from your custom auth provider:

  ```dart Privy initialization with custom auth theme={"system"}
  // Define a function to retrieve the token from your auth provider
  Future<String?> _retrieveCustomAuthAccessToken() async {
    // Implement logic to fetch the access token from your auth provider
    // Return the token if the user is authenticated, or null if not
    try {
      // Your custom logic to retrieve the JWT token
      // This might be from secure storage or an API call
      final token = await yourAuthService.getAccessToken();
      return token;
    } catch (e) {
      // If there's an error, the user is likely not authenticated
      return null;
    }
  }

  // Initialize Privy with the token provider
  final privyConfig = PrivyConfig(
    appId: "YOUR_APP_ID",
    appClientId: "YOUR_APP_CLIENT_ID",
    logLevel: PrivyLogLevel.NONE,
    customAuthConfig: LoginWithCustomAuthConfig(
      tokenProvider: _retrieveCustomAuthAccessToken,
    ),
  );

  final privy = Privy(config: privyConfig);
  ```

  The `tokenProvider` callback should:

  * Return the current user's access token as a `String` when authenticated
  * Return `null` when the user is not authenticated
  * Be implemented as an async function that can perform asynchronous operations

  #### Await SDK readiness

  Before performing any operations with the SDK, make sure to await its readiness:

  ```dart Awaiting SDK readiness theme={"system"}
  // Wait for the SDK to be ready before proceeding
  await privy.awaitReady();
  ```

  This ensures that the SDK has completed initialization and attempted session restoration if a prior session exists.

  #### Authenticate your user

  Once you've initialized Privy with a `tokenProvider` callback, authenticate your user with Privy using the `loginWithCustomAccessToken` method:

  ```dart Authenticating with Privy theme={"system"}
  // Authenticate with Privy
  final result = await privy.customAuth.loginWithCustomAccessToken();

  result.fold(
    onSuccess: (user) {
      print("Privy login success! User: ${user}");
      // Now you can access user information and wallet functionality
    },
    onFailure: (error) {
      print("Privy login failure! ${error.message}");
      // Handle authentication error
    },
  );
  ```

  If the provided access or identity token is valid, Privy will authenticate your user and return `Success()` with an encapsulated `PrivyUser`. If the token is invalid, it will return a `Failure()` with a PrivyException.

  #### Example integration with Firebase Auth

  Here's an example of integrating with Firebase Authentication:

  ```dart Firebase Auth Integration Example theme={"system"}
  import 'package:firebase_auth/firebase_auth.dart';
  import 'package:privy_flutter/privy_flutter.dart';

  class AuthService {
    final FirebaseAuth _auth = FirebaseAuth.instance;
    late final Privy _privy;

    // Initialize Privy with Firebase token provider
    Future<void> initPrivy() async {
      final privyConfig = PrivyConfig(
        appId: "YOUR_PRIVY_APP_ID",
        appClientId: "YOUR_PRIVY_APP_CLIENT_ID",
        logLevel: PrivyLogLevel.NONE,
        customAuthConfig: LoginWithCustomAuthConfig(
          tokenProvider: _getFirebaseIdToken,
        ),
      );

      _privy = Privy(config: privyConfig);

      // Wait for Privy to be ready
      await _privy.awaitReady();
    }

    // Firebase token provider function
    Future<String?> _getFirebaseIdToken() async {
      try {
        final user = _auth.currentUser;
        if (user == null) return null;

        // Get the ID token
        return await user.getIdToken();
      } catch (e) {
        print("Error getting Firebase ID token: $e");
        return null;
      }
    }

    // Sign in with Firebase, then with Privy
    Future<Result<PrivyUser>> signInWithEmailAndPassword(String email, String password) async {
      try {
        // Sign in with Firebase
        await _auth.signInWithEmailAndPassword(
          email: email,
          password: password,
        );

        // After Firebase auth succeeds, authenticate with Privy
        return await _privy.customAuth.loginWithCustomAccessToken();
      } catch (e) {
        return Result.failure(AuthError("Firebase authentication failed: $e"));
      }
    }
  }
  ```

  ### Authentication flow

  When using custom authentication with the Flutter SDK:

  1. When the Privy SDK is first initialized, it attempts to restore any prior session
  2. If a prior session exists, Privy automatically tries to reauthenticate using your `tokenProvider`
  3. You can manually trigger authentication by calling `loginWithCustomAccessToken`
  4. After successful authentication, you have access to the `PrivyUser` object and wallet functionality

  <Info>
    It's important to `await privy.awaitReady()` before triggering any other Privy flows to ensure the SDK has completed initialization and attempted session restoration.
  </Info>

  ### Accessing user data and wallets

  Once authenticated, you can access the user's data and embedded wallets:

  ```dart  theme={"system"}
  // Check if user is authenticated
  final user = privy.user;
  if (user != null) {
    // Access user information
    final userId = user.id;

    // Access embedded Ethereum wallets
    final ethereumWallets = user.embeddedEthereumWallets;
    if (ethereumWallets.isNotEmpty) {
      final walletAddress = ethereumWallets.first.address;
      print("User has Ethereum wallet with address: $walletAddress");
    }
  }
  ```

  Privy identifies users based on the unique ID that your auth provider has assigned (stored in the `sub` claim of their access token). You can view all users in the **Users** section of the Privy Developer Dashboard.
</View>
\n