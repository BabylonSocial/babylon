> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Quickstart

> Learn how to authenticate users, create embedded wallets, and send transactions in your React Native app

## 0. Prerequisites

This guide assumes that you have completed the [setup](/basics/react-native/setup) guide.

## 1. Enable a user to log in via email

<Tip>
  This quickstart guide will demonstrate how to authenticate a user with a one time password as an
  example, but Privy supports many authentication methods. Explore our [Authentication
  docs](/authentication/overview) to learn about other methods such as socials, passkeys, and
  external wallets to authenticate users in your app.
</Tip>

**To authenticate a user via their email address, use the React Native SDK's `useLoginWithEmail` hook.**

```tsx  theme={"system"}
import {useLoginWithEmail} from '@privy-io/expo';
...
const {sendCode, loginWithCode} = useLoginWithEmail();
```

Ensure that this hook is mounted in a component that is wrapped by the [PrivyProvider](/basics/react-native/setup#initializing-privy).
You can use the returned methods **`sendCode`** and **`loginWithCode`** to authenticate your user per the instructions below.

### Send an OTP

Send a one-time passcode (OTP) to the user's **email** by passing their email address to the **`sendCode`** method returned from `useLoginWithEmail`:

```tsx  theme={"system"}
import {useLoginWithEmail} from '@privy-io/expo';

export function LoginScreen() {
  const [email, setEmail] = useState('');
  const [codeSent, setCodeSent] = useState(false);

  const {sendCode} = useLoginWithEmail();

  return (
    <View>
      <Text>Login</Text>

      {/* prettier-ignore */}
      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        inputMode="email"
      />

      {!codeSent ? (
        <Button
          onPress={async () => {
            await sendCode({email});
            setCodeSent(true);
          }}
        >
          Send Code
        </Button>
      ) : (
        {/* prettier-ignore */}
        <Button onPress={() => loginWithCode({code: code, email})}>
          Login
        </Button>
      )}
    </View>
  );
}
```

## 2. Create an embedded wallet for the user

Your app can configure Privy to [**automatically** create wallets](/basics/react-native/advanced/automatic-wallet-creation) for your users as part of their **login** flow. The embedded wallet will be generated and linked to the user object upon authentication.

Alternatively your app can [**manually** create wallets](/wallets/wallets/create/create-a-wallet) for users when required.

<Info>Privy can provision wallets for your users on both **Ethereum** and **Solana**.</Info>

## 3. Send and sign transactions using the embedded wallet

To request signatures and transactions from a wallet, you must first get an EIP1193 provider for the wallet.

<Tabs>
  <Tab title="Ethereum">
    ```ts  theme={"system"}
    import {useEmbeddedEthereumWallet} from '@privy-io/expo';
    // Get an EIP-1193 Provider
    const {wallets} = useEmbeddedEthereumWallet();
    const provider = await wallets[0].getProvider();
    ```

    Once you have the embedded wallet's EIP-1193 provider, you can use the provider's **`request`** method to send JSON-RPC requests that request signatures and transactions from the wallet!

    The **`request`** method accepts an object with the fields:

    * **`method`** (required): the name of the JSON-RPC method as a string (e.g. **`personal_sign`** or **`eth_sendTransaction`**)
    * **`params`** (optional): an array of arguments for the JSON-RPC method specified by **`method`**

    <Tabs>
      <Tab title="Example signature">
        ```tsx  theme={"system"}
        // Get address
        const accounts = await provider.request({
          method: 'eth_requestAccounts'
        });

        // Sign message
        const message = 'I hereby vote for foobar';
        const signature = await provider.request({
          method: 'personal_sign',
          params: [message, accounts[0]]
        });
        ```
      </Tab>

      <Tab title="Example transaction">
        ```tsx  theme={"system"}
        // Get address
        // Get an EIP-1193 Provider
        const provider = await wallet.getProvider();
        const accounts = await provider.request({
          method: 'eth_requestAccounts'
        });

        // Send transaction (will be signed and populated)
        const response = await provider.request({
          method: 'eth_sendTransaction',
          params: [
            {
              from: accounts[0],
              to: '0x0000000000000000000000000000000000000000',
              value: '1'
            }
          ]
        });
        ```
      </Tab>
    </Tabs>
  </Tab>

  <Tab title="Solana">
    ```ts  theme={"system"}
    import {useEmbeddedSolanaWallet} from '@privy-io/expo';
    // get a Solana provider
    const {wallets} = useEmbeddedSolanaWallet();
    const provider = await wallets[0].getProvider();
    ```

    Once you have the embedded wallet's Solana provider, you can use the provider's methods to interact with the Solana blockchain.

    <Tabs>
      <Tab title="Example signature">
        ```tsx  theme={"system"}
        // Sign message
        const message = 'Hello world';
        const {signature} = await provider.request({
          method: 'signMessage',
          params: {message}
        });
        ```
      </Tab>

      <Tab title="Example transaction">
        ```tsx  theme={"system"}
        // Create a connection to the Solana network
        const connection = new Connection('insert-your-rpc-url-here');

        // Create your transaction (either legacy Transaction or VersionedTransaction)
        // transaction = ...

        // Send the transaction
        const {signature} = await provider.request({
          method: 'signAndSendTransaction',
          params: {
            transaction: transaction,
            connection: connection
          }
        });
        ```
      </Tab>
    </Tabs>
  </Tab>
</Tabs>

<Tip>
  [Learn more](/wallets/using-wallets/ethereum/send-a-transaction) about sending transactions with
  the embedded wallet. Privy enables you to take many actions on the embedded wallet, including
  [sign a message](/wallets/using-wallets/ethereum/sign-a-message), [sign typed
  data](/wallets/using-wallets/ethereum/sign-typed-data), and [sign a
  transaction](/wallets/using-wallets/ethereum/sign-a-transaction).
</Tip>

Congratulations, you have successfully been able to integrate Privy authentication and wallet into your React Native application!
\n