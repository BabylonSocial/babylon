> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Get user connected wallets

A user may come in with both embedded and external wallets. Privy makes it easy to find all of a user's connected wallets so you can help them take an onchain action with the appropriate wallet.

It's worth distinguishing connected vs. linked wallets:

* **Linked wallets** are embedded or external wallets tied to a user object. They may or may not be connected.
* **Connected wallets** are embedded or external wallets currently available for the web client. They may or may not be linked to a user's account.

<Tip>
  Not seeing all of the external wallets connected to the application? Make sure you have [completed
  the steps to connect](/wallets/connectors/setup/configuring-external-connector-wallets) any
  wallets to your application.
</Tip>

Both **external wallets** (that users *connect* to your site) and **embedded wallets** (that users *create* within your app) result in a unified object representing the wallet.

<View title="React" icon="react">
  <Tabs>
    <Tab title="Ethereum">
      To access connected wallets with the React SDK, use the `wallets` array from the `useWallets` hook:

      ```tsx  theme={"system"}
      const wallets: ConnectedWallet[]
      ```

      ### Usage

      ```tsx  theme={"system"}
      import {useWallets} from '@privy-io/react-auth';
      const { wallets } = useWallets();
      const desiredWallet = wallets.find((wallet) => wallet.address === desiredAddress);
      ```

      The **`wallets`** array includes an object for all wallets a user has connected to your site.
    </Tab>

    <Tab title="Solana">
      To access connected wallets with the React SDK, use the `wallets` array from the `useWallets` hook:

      ```tsx  theme={"system"}
      const wallets: ConnectedStandardSolanaWallet[]
      ```

      ### Usage

      ```tsx  theme={"system"}
      import {useWallets} from '@privy-io/react-auth/solana';
      const { wallets } = useWallets();
      const desiredWallet = wallets.find((wallet) => wallet.address === desiredAddress);
      ```

      The **`wallets`** array includes an object for all wallets a user has connected to your site. The array is ordered from most recently connected to least recently connected.
    </Tab>
  </Tabs>

  ## Waiting for wallets to be `ready`

  When your page loads in the user's browser, the Privy SDK determines what wallets the user has connected to your app in two ways:

  * For **external wallets**, Privy determines what wallets are connected via EIP-6963 for injected wallets (e.g. browser extension wallets) and via WalletConnect for mobile wallets.
  * For **embedded wallets**, Privy determines if the user has an embedded wallet by loading the Privy iframe which stores the private key material used for the wallet.

  To determine if Privy has fully processed all external and embedded wallet connections, use the **`ready`** boolean returned by the **`useWallets`** hooks.

  Concretely, **`ready`** will be `false` while Privy is determining what wallets are available for the user, and will be `true` once Privy has settled on the current set of connected wallets.

  ***

  ## `useWallets` vs. `usePrivy`

  The **`useWallets`** and **`usePrivy`** hooks all return information about a user's wallets. The key difference between the them is:

  * **`useWallets`** will return all *connected* wallets (EVM and Solana), which you can use to request signatures or take onchain actions (via transactions).
  * **`usePrivy`** will return all *linked* wallets, which you can use to verify that a user owns a given wallet address.

  Linked wallets are not necessarily actively connected to your site, so you may not always be able to request a signature or transaction from them. Similarly, connected wallets are not necessarily linked, as a user may have connected their wallet without signing a message to verify that they own the wallet address.

  Concretely, if your use case only requires you to verify that a user owns a given wallet address, you should use the wallets information returned by the **`usePrivy`** hook.

  ### Accessing linked wallets

  To access linked wallets (both embedded and external wallets tied to the user account), use `user.linkedAccounts` from the **`usePrivy`** hook:

  ```tsx  theme={"system"}
  import {usePrivy} from '@privy-io/react-auth';

  const { user } = usePrivy();

  // Filter for wallet accounts from all linked accounts
  const linkedWallets = user?.linkedAccounts.filter(
    (account) => account.type === 'wallet' ||
                 account.type === 'smart_wallet'
  );

  // Access wallet addresses
  linkedWallets?.forEach((wallet) => {
    console.log(wallet.address);
  });
  ```

  Otherwise, if your use case requires you to take actions on a *connected* wallet, such as getting its network or requesting a signature or transaction, you should use the wallets information returned by the **`useWallets`** hooks instead.
</View>

<View title="React Native" icon="react">
  <Tabs>
    <Tab title="Ethereum">
      To access connected wallets with the React Native SDK, use the `wallets` array from the `useEmbeddedEthereumWallet` hook:

      ```tsx  theme={"system"}
      const wallets: ConnectedEthereumWallet[]
      ```

      ### Usage

      ```tsx  theme={"system"}
      import {useEmbeddedEthereumWallet} from '@privy-io/expo';
      const {wallets} = useEmbeddedEthereumWallet();
      const desiredWallet = wallets.find((wallet) => wallet.address === desiredAddress);
      ```
    </Tab>

    <Tab title="Solana">
      To access connected wallets with the React Native SDK, use the `wallets` array from the `useEmbeddedSolanaWallet` hook:

      ```tsx  theme={"system"}
      const wallets: ConnectedSolanaWallet[]
      ```

      ### Usage

      ```tsx  theme={"system"}
      import {useEmbeddedSolanaWallet} from '@privy-io/expo';
      const {wallets} = useEmbeddedSolanaWallet();
      const desiredWallet = wallets.find((wallet) => wallet.address === desiredAddress);
      ```
    </Tab>
  </Tabs>
</View>

<View title="Swift" icon="swift">
  <Tabs>
    <Tab title="Ethereum">
      To access connected Ethereum wallets using the Swift SDK, use the `embeddedEthereumWallets` property from the `PrivyUser` object:

      ```swift  theme={"system"}
      var embeddedEthereumWallets: [EmbeddedEthereumWallet] { get }
      ```

      ### Usage

      ```swift  theme={"system"}
      guard let user = privy.user else {
          // If user is null, user is not authenticated
          return
      }

      // Retrieve list of user's embedded Ethereum wallets
      let ethereumWallets = user.embeddedEthereumWallets

      // Grab the desired wallet. Here, we retrieve the first wallet
      guard let ethereumWallet = ethereumWallets.first else {
          // No ETH wallets
          return
      }
      ```
    </Tab>

    <Tab title="Solana">
      To access connected Solana wallets using the Swift SDK, use the `embeddedSolanaWallets` property from the `PrivyUser` object:

      ```swift  theme={"system"}
      var embeddedSolanaWallets: [EmbeddedSolanaWallet] { get }
      ```

      ### Usage

      ```swift  theme={"system"}
      guard let user = privy.user else {
          // User is not authenticated
          return
      }

      // Retrieve list of user's embedded Solana wallets
      let solanaWallets = user.embeddedSolanaWallets

      // Grab the desired wallet. Here, we retrieve the first wallet
      guard let solanaWallet = solanaWallets.first else {
          // No SOL wallets
          return
      }
      ```
    </Tab>
  </Tabs>
</View>

<View title="Android" icon="android">
  <Tabs>
    <Tab title="Ethereum">
      To access connected Ethereum wallets using the Android SDK, use the `embeddedEthereumWallets` property from the `PrivyUser` object:

      ```kotlin  theme={"system"}
      val embeddedEthereumWallets: List<EmbeddedEthereumWallet>
      ```

      ### Usage

      ```kotlin  theme={"system"}
      val user = privy.user
      if (user != null) {
          val ethereumWallets = user.embeddedEthereumWallets
          if (ethereumWallets.isNotEmpty()) {
              val ethereumWallet = ethereumWallets.first()
          }
      }
      ```

      The **`embeddedEthereumWallets`** property includes an array of objects for all Ethereum wallets a user has connected to your app. The array is ordered from most recently connected to least recently connected.
    </Tab>

    <Tab title="Solana">
      To access connected Solana wallets using the Android SDK, use the `embeddedSolanaWallets` property from the `PrivyUser` object:

      ```kotlin  theme={"system"}
      val embeddedSolanaWallets: List<EmbeddedSolanaWallet>
      ```

      ### Usage

      ```kotlin  theme={"system"}
      val user = privy.user
      if (user != null) {
          val solanaWallets = user.embeddedSolanaWallets
          if (solanaWallets.isNotEmpty()) {
              val solanaWallet = solanaWallets.first()
          }
      }
      ```

      The **`embeddedSolanaWallets`** property includes an array of objects for all Solana wallets a user has connected to your app. The array is ordered from most recently connected to least recently connected.
    </Tab>
  </Tabs>
</View>

<View title="Flutter" icon="flutter">
  <Tabs>
    <Tab title="Ethereum">
      To retrieve a user's Ethereum wallet using the Flutter SDK, follow these steps:

      ```dart  theme={"system"}
      final user = privy.user;
      final EmbeddedEthereumWallet ethereumWallet = user.embeddedEthereumWallets.first;
      ```

      ### Usage

      ```dart  theme={"system"}
      import 'package:privy_flutter/privy_flutter.dart';

      // Get the user's first Ethereum wallet
      final user = privy.user;
      if (user != null && user.embeddedEthereumWallets.isNotEmpty) {
        final wallet = user.embeddedEthereumWallets.first;

        // Access wallet properties
        final address = wallet.address;
      }
      ```

      The **`embeddedEthereumWallets`** property includes an array of objects for all Ethereum wallets a user has connected to your app. The array is ordered from most recently connected to least recently connected.
    </Tab>

    <Tab title="Solana">
      To retrieve a user's Solana wallet using the Flutter SDK, follow these steps:

      ```dart  theme={"system"}
      final user = privy.user;
      final EmbeddedSolanaWallet solanaWallet = user.embeddedSolanaWallets.first;
      ```

      ### Usage

      ```dart  theme={"system"}
      import 'package:privy_flutter/privy_flutter.dart';

      // Get the user's first Solana wallet
      final user = privy.user;
      if (user != null && user.embeddedSolanaWallets.isNotEmpty) {
        final wallet = user.embeddedSolanaWallets.first;

        // Access wallet properties
        final address = wallet.address;
      }
      ```

      The **`embeddedSolanaWallets`** property includes an array of objects for all Solana wallets a user has connected to your app. The array is ordered from most recently connected to least recently connected.
    </Tab>
  </Tabs>
</View>
\n