> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Deeplinking Solana wallets in React Native applications

If your Expo mobile app uses Privy, you can implement wallet deeplinking to allow your users to connect their existing mobile wallets (like Phantom) with a seamless experience. This guide will walk you through the steps to set up wallet deeplinking in your Privy Expo app.

## 0. Setup

This guide assumes that you have already integrated Privy into your React native app. If you have not yet set up the basic integration, please first follow the [Privy quickstart](/basics/react-native/quickstart).

## 1. Install required packages

First, make sure you have the necessary dependencies:

```bash  theme={"system"}
npm install @privy-io/expo @privy-io/expo/connectors
```

## 2. Import the wallet connector hooks

Import the wallet connector hooks in your component:

```tsx  theme={"system"}
import {
  useDeeplinkWalletConnector,
  usePhantomDeeplinkWalletConnector,
  useBackpackDeeplinkWalletConnector
} from '@privy-io/expo/connectors';
```

Privy Expo provides several hooks for wallet deeplinking:

| Hook                                 | Description                                                                       |
| ------------------------------------ | --------------------------------------------------------------------------------- |
| `useDeeplinkWalletConnector`         | A generic wallet deeplinking connector that you can configure for various wallets |
| `usePhantomDeeplinkWalletConnector`  | A pre-configured connector specifically for Phantom wallet                        |
| `useBackpackDeeplinkWalletConnector` | A pre-configured connector specifically for Backpack wallet                       |

## 3. Set up the wallet connector

<Tabs>
  <Tab title="Phantom">
    To set up the Phantom wallet connector, use the `usePhantomDeeplinkWalletConnector` hook in your component:

    ```tsx  theme={"system"}
    export default function LoginScreen() {
      const {
        address,
        connect,
        disconnect,
        isConnected,
        signMessage,
        signTransaction,
        signAllTransactions,
        signAndSendTransaction
      } = usePhantomDeeplinkWalletConnector({
        appUrl: 'https://yourdapp.com',
        redirectUri: '/sign-in'
      });

      // Your component code here
    }
    ```

    ### Configuration options

    The `usePhantomDeeplinkWalletConnector` hook accepts the following configuration:

    | Parameter     | Type     | Description                                                                                                |
    | ------------- | -------- | ---------------------------------------------------------------------------------------------------------- |
    | `appUrl`      | `string` | The URL of your app that will be displayed in the wallet app as the requesting dapp, for metadata purposes |
    | `redirectUri` | `string` | The path in your app that the wallet should redirect to after completing an action                         |
  </Tab>

  <Tab title="Backpack">
    To set up the Backpack wallet connector, use the `useBackpackDeeplinkWalletConnector` hook in your component:

    ```tsx  theme={"system"}
    export default function LoginScreen() {
      const {
        address,
        connect,
        disconnect,
        isConnected,
        signMessage,
        signTransaction,
        signAllTransactions,
        signAndSendTransaction
      } = useBackpackDeeplinkWalletConnector({
        appUrl: 'https://yourdapp.com',
        redirectUri: '/sign-in'
      });

      // Your component code here
    }
    ```

    ### Configuration options

    The `useBackpackDeeplinkWalletConnector` hook accepts the following configuration:

    | Parameter     | Type     | Description                                                                                                |
    | ------------- | -------- | ---------------------------------------------------------------------------------------------------------- |
    | `appUrl`      | `string` | The URL of your app that will be displayed in the wallet app as the requesting dapp, for metadata purposes |
    | `redirectUri` | `string` | The path in your app that the wallet should redirect to after completing an action                         |
  </Tab>

  <Tab title="Other wallet providers">
    If you want to integrate with wallets other than Phantom or Backpack, you can use the generic `useDeeplinkWalletConnector` hook and configure it for your specific wallet:

    ```tsx  theme={"system"}
    export default function LoginScreen() {
      const {
        address,
        connect,
        disconnect,
        isConnected,
        signMessage,
        signTransaction,
        signAllTransactions,
        signAndSendTransaction
      } = useDeeplinkWalletConnector({
        // Base URL for the wallet
        baseUrl: 'https://solflare.com',
        // The name of the public key used for encryption
        encryptionPublicKeyName: 'solflare_encryption_public_key',
        // Other wallet-specific configuration
        appUrl: 'https://yourdapp.com',
        redirectUri: '/sign-in'
      });

      // Your component code here
    }
    ```

    ### Configuration options

    The generic `useDeeplinkWalletConnector` hook accepts the following wallet-specific configuration parameters:

    | Parameter                 | Type     | Description                                                                                                                                                   |
    | ------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
    | `baseUrl`                 | `string` | The base URL for the wallet's deeplink protocol. This is typically the wallet's website URL or a custom URL scheme (e.g., `https://solflare.com`).            |
    | `encryptionPublicKeyName` | `string` | The name of the key in localStorage where the wallet stores its encryption public key. This is used for secure communication between your app and the wallet. |
    | `appUrl`                  | `string` | The URL of your app that will be displayed in the wallet app as the requesting dapp, for metadata purposes                                                    |
    | `redirectUri`             | `string` | The path in your app that the wallet should redirect to after completing an action                                                                            |

    <Info>
      Always refer to the wallet provider's documentation for the specific deeplink protocol
      implementation and required parameters. Each wallet may implement deeplinking differently and
      require specific configuration values.
    </Info>
  </Tab>
</Tabs>

## 4. Using the connector in your UI

Now you can implement UI components to interact with the wallet:

```tsx  theme={"system"}
return (
  <View>
    <H4>Wallet Deeplinking</H4>
    <Text>Connected: {isConnected ? 'true' : 'false'}</Text>

    {!isConnected && <Button onPress={() => connect()}>Connect Wallet</Button>}

    {isConnected && (
      <>
        <Text>Address: {address}</Text>
        <Button onPress={() => disconnect()}>Disconnect</Button>
        <Button onPress={handleSignMsg}>Sign message</Button>
        <Button onPress={handleSignTx}>Sign transaction</Button>
        <Button onPress={handleSignAndSendTx}>Sign and send transaction</Button>
        <Button onPress={handleSignAllTxs}>Sign all transactions</Button>
      </>
    )}
  </View>
);
```

## 5. Implementing the wallet functions

Here are examples of how to implement the handler functions for various wallet actions:

```tsx  theme={"system"}
// Function to handle message signing
const handleSignMsg = async () => {
  try {
    const message = 'Hello, Privy Expo!';
    const signature = await signMessage(message);
    console.log('Message signed:', signature);
  } catch (error) {
    console.error('Error signing message:', error);
  }
};

// Function to handle transaction signing
const handleSignTx = async () => {
  try {
    // Create a transaction
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: new PublicKey(address),
        toPubkey: new PublicKey('DESTINATION_ADDRESS'),
        lamports: LAMPORTS_PER_SOL * 0.01
      })
    );

    const signedTx = await signTransaction(transaction);
    console.log('Transaction signed:', signedTx);
  } catch (error) {
    console.error('Error signing transaction:', error);
  }
};

// Function to handle signing and sending a transaction
const handleSignAndSendTx = async () => {
  try {
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: new PublicKey(address),
        toPubkey: new PublicKey('DESTINATION_ADDRESS'),
        lamports: LAMPORTS_PER_SOL * 0.01
      })
    );

    const signature = await signAndSendTransaction(transaction);
    console.log('Transaction sent:', signature);
  } catch (error) {
    console.error('Error sending transaction:', error);
  }
};

// Function to handle signing multiple transactions
const handleSignAllTxs = async () => {
  try {
    const transactions = [
      new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: new PublicKey(address),
          toPubkey: new PublicKey('DESTINATION_ADDRESS_1'),
          lamports: LAMPORTS_PER_SOL * 0.01
        })
      ),
      new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: new PublicKey(address),
          toPubkey: new PublicKey('DESTINATION_ADDRESS_2'),
          lamports: LAMPORTS_PER_SOL * 0.01
        })
      )
    ];

    const signedTxs = await signAllTransactions(transactions);
    console.log('Transactions signed:', signedTxs);
  } catch (error) {
    console.error('Error signing transactions:', error);
  }
};
```

<Info>
  The configuration for the generic connector will depend on the specific wallet you're integrating
  with. Refer to each wallet's documentation for their deeplinking protocol.
</Info>

## How deeplinking works

When a user interacts with your app:

1. Your app initiates a connection request using the `connect()` function
2. The user is directed to their installed wallet app
3. The user approves or denies the action in their wallet
4. The wallet redirects back to your app with the result
5. Your app updates its state based on the wallet's response

This flow provides a seamless experience for users, allowing them to interact with your dApp using their preferred wallet without having to switch contexts or manually copy addresses.

**That's it! You've successfully integrated wallet deeplinking in your Privy React Native app 🎉**

<Info>
  For the best user experience, consider implementing fallbacks for when a user doesn't have the
  wallet installed. You might prompt them to install the wallet or offer them an alternative login
  method.
</Info>
\n