> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Authentication state

Throughout your app, you may want to gate certain user experiences based on whether the current user is authenticated or not. Privy makes it easy to check your user's authentication status and handle it appropriately.

<View title="React" icon="react">
  You can use the boolean `authenticated` from the `usePrivy` hook to determine if your user is authenticated or not.

  ```tsx  theme={"system"}
  authenticated: boolean;
  ```

  <Tip>
    Before determining a user's auth status from Privy, you should verify that
    Privy has fully initialized and is **`ready`**
  </Tip>

  ### Usage

  ```tsx  theme={"system"}
  import { useRouter } from "next/router";

  import { usePrivy } from "@privy-io/react-auth";

  export default function MyComponent() {
  const { ready, authenticated, user } = usePrivy();
  const router = useRouter();

  if (!ready) {
      // Do nothing while the PrivyProvider initializes with updated user state
      return <></>;
  }

  if (ready && !authenticated) {
      // Replace this code with however you'd like to handle an unauthenticated user
      // As an example, you might redirect them to a login page
      router.push("/login");
  }

  if (ready && authenticated) {
      // Replace this code with however you'd like to handle an authenticated user
      return <p>User {user?.id} is logged in.</p>;
  }
  }
  ```
</View>

<View title="React Native" icon="react">
  You can use the `user` object from the `usePrivy` hook to determine if your user is authenticated or not.

  ```tsx  theme={"system"}
  user: User | null;
  ```

  ### Usage

  ```tsx  theme={"system"}
  import { useRouter } from "expo-router";
  import { usePrivy } from "@privy-io/expo";
  import { useEffect } from "react";
  import { Text, View } from "react-native";

  export default function MyComponent() {
    const { isReady, user } = usePrivy();
    const router = useRouter();

    useEffect(() => {
      if (isReady && !user) {
        // Replace this code with however you'd like to handle an unauthenticated user
        // As an example, you might redirect them to a login page
        router.replace("/login");
      }
    }, [isReady, user, router]);

    if (!isReady) {
      // Do nothing while the PrivyProvider initializes with updated user state
      return null;
    }

    if (isReady && !user) {
      // You could show a loading state or handle this differently
      return <Text>Not authenticated</Text>;
    }

    if (isReady && user) {
      // Replace this code with however you'd like to handle an authenticated user
      return (
        <View>
          <Text>User {user.id} is logged in.</Text>
        </View>
      );
    }
  }
  ```
</View>

<View title="Swift" icon="swift">
  The `AuthState` enum is used to describe the user's authenticated state.

  ```swift  theme={"system"}
  public enum AuthState {
    /// AuthState has not been determined yet, show loading
    case notReady

    /// User is unauthenticated
    case unauthenticated

    /// Auth state cannot be determined while no network connectivity is available, but session tokens exist in cache
    case authenticatedUnverified(AuthenticatedUnverifiedContext)

    /// User is authenticated and has an associated PrivyUser object
    case authenticated(PrivyUser)
  }
  ```

  ### Handling no network connectivity at SDK initialization:

  When the Privy SDK is initialized while there is no network connectivity, Privy will first check if a prior user session is persisted.

  If there is not, the auth state will be set to  `AuthState.unauthenticated`.

  If there is, Privy can't verify that validity of the prior session without network connectivity. Thus, the auth state will be set to  `AuthState.authenticatedUnverified`.

  Privy will automatically attempt to confirm the user's authenticated state when network connectivity is restored. Alternatively, you may explicitly call
  `Privy.onNetworkRestored()` once you determine network is restored.

  ### Usage

  There are various ways to determine user's auth state, outlined below:

  #### 1. Grab the user's current auth state

  ```swift  theme={"system"}
  public protocol Privy {
    /// Get the user's current auth state.
    func getAuthState() async -> AuthState
  }
  ```

  ```swift  theme={"system"}
  // Grab current auth state
  if case .authenticated(let user) = await privy.getAuthState() {
    // User is authenticated. Grab the user's linked accounts
    let linkedAccounts = user.linkedAccounts
  }
  ```

  #### 2. Subscribe to auth state updates

  Auth state is exposed as an AsyncStream on the Privy object:

  ```swift  theme={"system"}
  public protocol Privy {
    /// An AsyncStream that emits auth state changes.
    var authStateStream: AsyncStream<AuthState> { get }
  }
  ```

  ```swift  theme={"system"}
    let task = Task {
      for await authState in privy.authStateStream {
        switch authState {
          case .authenticated(let user):
            // User is authenticated. Grab the user's linked accounts
            let linkedAccounts = user.linkedAccounts
          case .notReady:
            // Privy was just initialized and has not determined auth state yet
          case .authenticatedUnverified:
            // Prior user session exists, but can't be refreshed / verified. Likely due to network connectivity.
          case .unauthenticated:
            // User in not authenticated. Perhaps show login screen.
        }
      }
    }
  ```

  #### 3. Directly grab the User

  As a convenience, you can grab the user object directly from the Privy instance. If the user is not null, there is an authenticated user.

  ```swift  theme={"system"}
  let privyUser = await privy.getUser()

  if (privyUser != null) {
    // User is authenticated
    let linkedAccounts = privyUser.linkedAccounts
  }
  ```
</View>

<View title="Android" icon="android">
  The `AuthState` sealed type is used to describe the user's authenticated state.

  ```kotlin  theme={"system"}
  public sealed interface AuthState {
    // AuthState has not been determined yet, show loading
    public data object NotReady : AuthState

    // User is unauthenticated
    public data object Unauthenticated : AuthState

    // Auth state cannot be determined while no network connectivity is available, but session tokens exist in cache
    public data class AuthenticatedUnverified(/* */) : AuthState

    // User is authenticated and has an associated PrivyUser object
    public data class Authenticated(val user: PrivyUser) : AuthState
  }
  ```

  ### Handling no network connectivity at SDK initialization:

  When the Privy SDK is initialized while there is no network connectivity, Privy will first check if a prior user session is persisted.

  If there is not, auth state will be set to  `AuthState.Unauthenticated`.

  If there is, Privy can't verify that validity of the prior session without network connectivity. Thus, auth state will be set to  `AuthState.AuthenticatedUnverified`.

  Privy will automatically attempt to confirm the user's authenticated state when network connectivity is restored. Alternatively, you may explicitly call
  `Privy.onNetworkRestored()` once you determine network is restored.

  ### Usage

  There are various ways to determine a user's auth state:

  #### 1. Grab the user's current auth state

  ```kotlin  theme={"system"}
  coroutineScope.launch {
    val authState = privy.getAuthState()

    if (authState is AuthState.Authenticated) {
      // User is authenticated. Grab the user's linked accounts
      val privyUser = currentAuthState.user
      val linkedAccount = privyUser.linkedAccounts
    }
  }
  ```

  #### 2. Subscribe to auth state updates

  Auth state is exposed as a StateFlow on the Privy object:

  ```kotlin  theme={"system"}
  public interface Privy {
   // A state flow that can be subscribed to for auth state updates
   public val authState: StateFlow<AuthState>
  }
  ```

  ```kotlin  theme={"system"}
  coroutineScope.launch {
      privy.authState.collectLatest { authState ->
          when(authState) {
              is AuthState.Authenticated -> {
                  // User is authenticated. Grab the user's linked accounts
                  val privyUser = authState.user
                  val linkedAccounts = privyUser.linkedAccounts
              }
              AuthState.NotReady -> {
                  // Privy was just initialized and has not determined auth state yet
              }
              is AuthState.AuthenticatedUnverified -> {
                  // Prior user session exists, but can't be verified due to no network connectivity.
              }
              AuthState.Unauthenticated -> {
                  // User in not authenticated. Perhaps show login screen.
              }
          }
      }
  }
  ```

  #### 3. Directly grab the User

  As a convenience, you can grab the user object directly from the Privy instance. If the user is not null, there is an authenticated user.

  ```kotlin  theme={"system"}
  coroutineScope.launch {
    val privyUser = privy.getUser()

    if (privyUser != null) {
      // User is authenticated
      val linkedAccounts = privyUser.linkedAccounts
    }
  }
  ```
</View>

<View title="Unity" icon="unity">
  The `AuthState` enum is used to describe the user's authenticated state.

  ```csharp  theme={"system"}
  public enum AuthState
  {
      NotReady, // Privy has not yet finished initializing
      Unauthenticated, // User is unauthenticated
      Authenticated // User is authenticated
  }
  ```

  ### Usage

  There are various ways to determine a user's auth state, outlined below:

  #### 1. Grab the user's current auth state

  ```csharp  theme={"system"}
  public interface IPrivy {
    // Get the user's current authentication state.
    Task<AuthState> GetAuthState();
  }
  ```

  ```csharp  theme={"system"}
  var authState = await PrivyManager.Instance.GetAuthState();
  Debug.Log(authState);
  ```

  #### 2. Subscribe to auth state updates

  You can also subscribe to `AuthState` updates via the `SetAuthStateChangeCallback` listener.

  ```csharp  theme={"system"}
  public interface IPrivy {
    // Sets a callback method to be invoked when the authentication state changes.
    void SetAuthStateChangeCallback(Action<AuthState> callback);
  }
  ```

  ```csharp  theme={"system"}
  PrivyManager.Instance.SetAuthStateChangeCallback(authState =>
  {
      // User's authentication state has updated
      Debug.Log(authState);
  });
  ```

  #### 3. Directly grab the User

  As a convenience, you can grab the user object directly from the Privy instance.
  If the user is not null, there is an authenticated user.

  ```csharp  theme={"system"}
  public interface IPrivy {
    // Get the current user.
    Task<PrivyUser> GetUser();
  }
  ```

  ```csharp  theme={"system"}
  var privyUser = await PrivyManager.Instance.GetUser();

  if (privyUser != null)
  {
    var linkedAccounts = privyUser.LinkedAccounts;
  }
  ```
</View>

<View title="Flutter" icon="flutter">
  A user's authentication state is described by the AuthState sealed class.

  ```dart  theme={"system"}
  /// Base class representing different authentication states.
  sealed class AuthState {
    const AuthState();
  }

  /// Represents the initial state before authentication status is determined.
  class NotReady extends AuthState {
    const NotReady();
  }

  /// Represents the state when the user is not authenticated.
  class Unauthenticated extends AuthState {
    const Unauthenticated();
  }

  /// Represents the state when the user is authenticated.
  class Authenticated extends AuthState {
    final PrivyUser user;

    /// Constructor accepting the authenticated user's details.
    const Authenticated(this.user);
  }
  ```

  The current auth state and an auth state stream are accessible directly on the Privy object.

  ```dart  theme={"system"}
  abstract interface class Privy {
    // Get the current authentication state.
    AuthState get currentAuthState;

    // A stream for auth state updates.
    Stream<AuthState> get authStateStream;
  }
  ```

  ### Accessing authentication state

  There are various ways to determine user's auth state, outlined below. Mix and match to fit the needs of your application.

  #### 1. Directly retrieve the user

  As a convenience, you can grab the user object directly from the Privy instance. If the user is not null, there is an authenticated user.

  ```dart  theme={"system"}
  final privyUser = privy.user;

  if (privyUser != null) {
    // User is authenticated
    final linkedAccounts = privyUser.linkedAccounts;
  }
  ```

  #### 2. Retrieve the current auth state

  ```dart  theme={"system"}
  // Grab current auth state
  final currentAuthState = privy.currentAuthState;

  if (currentAuthState is Authenticated) {
    // User is authenticated. Retrieve the associated user from the auth state.
    final privyUser = currentAuthState.user;
    final linkedAccounts = privyUser.linkedAccounts;
  }
  ```

  #### 3. Subscribe to auth state updates

  ```dart  theme={"system"}
  privy.authStateStream.listen((authState) {
    switch (authState) {
      case Authenticated():
        // User is authenticated. Retrieve the user.
        final privyUser = authState.user;
        final userId = privyUser.linkedAccounts;
        break;
      case NotReady():
        // Privy is not yet ready. Ensure Privy is initialized first.
        break;
      case Unauthenticated():
        // User is not authenticated. You may want to show the login screen.
        break;
    }
  });
  ```
</View>
\n