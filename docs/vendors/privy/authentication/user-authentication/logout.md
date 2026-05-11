> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Logging users out

Logging out a user ends their authenticated session, removing their access credentials from the device and requiring them to authenticate again to access protected resources.

<View title="React" icon="react">
  ```tsx  theme={"system"}
  logout: () => Promise<void>
  ```

  ### Usage

  To log a user out, use the `logout` method from the `usePrivy` hook:

  ```tsx  theme={"system"}
  import { usePrivy } from '@privy-io/react-auth';

  function LogoutButton() {
    const { ready, authenticated, logout } = usePrivy();

    // Disable logout when Privy is not ready or the user is not authenticated
    const disableLogout = !ready || (ready && !authenticated);

    return (
      <button disabled={disableLogout} onClick={logout}>
        Log out
      </button>
    );
  }
  ```

  ### Callbacks

  You can attach callbacks to the logout process using the `useLogout` hook:

  ```tsx  theme={"system"}
  import { useLogout } from '@privy-io/react-auth';

  function LogoutButton() {
    const { logout } = useLogout({
      onSuccess: () => {
        console.log('User successfully logged out');
        // Redirect to landing page or perform other post-logout actions
      },
      onError: (error) => {
        console.error('Logout failed', error);
      }
    });

    return <button onClick={logout}>Log out</button>;
  }
  ```
</View>

<View title="React Native" icon="react">
  ```tsx  theme={"system"}
  logout: () => Promise<void>
  ```

  ### Usage

  To log a user out, use the `logout` method from the `usePrivy` hook:

  ```tsx  theme={"system"}
  import { usePrivy } from '@privy-io/expo';

  function LogoutButton() {
    const { logout } = usePrivy();

    return <Button onPress={() => logout()}>Log out</Button>;
  }
  ```

  ### Async Handling

  Since `logout` returns a Promise, you can await it to run code after the user has been logged out:

  ```tsx  theme={"system"}
  import { usePrivy } from '@privy-io/expo';

  function LogoutButton() {
    const { logout } = usePrivy();

    const handleLogout = async () => {
      await logout();
      // Perform actions after logout completes
      console.log('User logged out successfully');
    };

    return <Button onPress={handleLogout}>Log out</Button>;
  }
  ```
</View>

<View title="Swift" icon="swift">
  ```swift  theme={"system"}
  func logout()
  ```

  ### Usage

  To log out an authenticated user, call the `logout` method on the user object:

  ```swift  theme={"system"}
  privy.user.logout()
  ```

  ### Example

  ```swift  theme={"system"}
  import PrivySDK

  class ProfileViewController: UIViewController {
    @IBAction func logoutButtonTapped(_ sender: UIButton) {
      // Check if user is authenticated
      if let user = privy.user {
        user.logout()
        // Navigate back to login screen
        self.navigationController?.popToRootViewController(animated: true)
      }
    }
  }
  ```

  ### Effect

  This will clear the user state and delete the persisted user session.
</View>

<View title="Android" icon="android">
  ```kotlin  theme={"system"}
  suspend fun logout()
  ```

  ### Usage

  To log out an authenticated user, call the `logout` method:

  ```kotlin  theme={"system"}
  coroutineScope.launch {
    privy.logout()
  }
  ```

  ### Example

  ```kotlin  theme={"system"}
  import io.privy.android.Privy
  import kotlinx.coroutines.launch
  import kotlinx.coroutines.CoroutineScope
  import kotlinx.coroutines.Dispatchers

  class ProfileActivity : AppCompatActivity() {
    private val coroutineScope = CoroutineScope(Dispatchers.Main)

    private fun setupLogoutButton() {
      logoutButton.setOnClickListener {
        coroutineScope.launch {
          privy.logout()
          // Navigate back to login activity
          startActivity(Intent(this@ProfileActivity, LoginActivity::class.java))
          finish()
        }
      }
    }
  }
  ```

  ### Effect

  This will clear the user state and delete the persisted user session.
</View>

<View title="Flutter" icon="flutter">
  ```dart  theme={"system"}
  Future<void> logout()
  ```

  ### Usage

  To log out an authenticated user, call the `logout` method:

  ```dart  theme={"system"}
  await privy.logout();
  ```

  ### Example

  ```dart  theme={"system"}
  import 'package:flutter/material.dart';
  import 'package:privy_flutter/privy_flutter.dart';

  class ProfileScreen extends StatelessWidget {
    final Privy privy;

    const ProfileScreen({Key? key, required this.privy}) : super(key: key);

    @override
    Widget build(BuildContext context) {
      return Scaffold(
        appBar: AppBar(title: Text('Profile')),
        body: Center(
          child: ElevatedButton(
            onPressed: () async {
              await privy.logout();
              // Navigate back to login screen
              Navigator.of(context).pushReplacementNamed('/login');
            },
            child: Text('Log out'),
          ),
        ),
      );
    }
  }
  ```

  ### Effect

  This will clear the user state and delete the persisted user session.
</View>
\n