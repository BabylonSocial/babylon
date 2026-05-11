> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Whitelabel

Privy’s frontend SDKs let you fully customize embedded wallet experiences. Match wallet flows to your app’s look and feel.

* Use your own components and branding to customize wallet creation, signing, and transaction flows.
* Create seamless, one-click signature and transaction experiences by disabling modals entirely.

<View title="React" icon="react">
  Privy enables developers to whitelabel embedded wallet functionality. You can abstract away wallet UIs entirely or selectively use Privy's default UI for specific flows.

  To whitelabel embedded wallets, you can configure this globally across your app in the `PrivyProvider` config, or selectively for specific flows at runtime.

  <Accordion title="Provider config (globally)">
    In your `PrivyProvider` config you can control the default wallet UI for all flows in your app.

    ```tsx {5} theme={"system"}
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || ''}
      config={{
        embeddedWallets: {
          showWalletUIs: false,
          priceDisplay: {primary: 'native-token', secondary: null}
        }
      }}
    >
      <YourApp />
    </PrivyProvider>
    ```

    For more granular control, you can also control wallet UIs for specific flows in the sections below.
  </Accordion>

  <Accordion title="Create a wallet" defaultOpen>
    Privy supports whitelabeling wallet creation for Ethereum, Solana, and other chains.

    <Tabs>
      <Tab title="Ethereum">
        ```tsx  theme={"system"}
        import {useCreateWallet} from '@privy-io/react-auth';
        ```

        ```tsx  theme={"system"}
        const {createWallet} = useCreateWallet();
        createWallet();
        ```
      </Tab>

      <Tab title="Solana">
        ```tsx  theme={"system"}
        import {useWallets} from '@privy-io/react-auth/solana';
        ```

        ```tsx  theme={"system"}
        const {createWallet} = useWallets();
        createWallet();
        ```
      </Tab>

      <Tab title="Other chains">
        ```tsx  theme={"system"}
        import {useCreateWallet} from '@privy-io/react-auth/extended-chains';
        ```

        ```tsx  theme={"system"}
        const {createWallet} = useCreateWallet();
        const {user, wallet} = await createWallet({chainType: 'cosmos'}); // or 'stellar', 'sui', etc.
        ```
      </Tab>
    </Tabs>
  </Accordion>

  <Accordion title="Signing a message">
    To whitelabel Privy's message signing functionality, use the `useSignMessage` hook and call `signMessage` with your desired message.

    <Tabs>
      <Tab title="Ethereum">
        ```tsx  theme={"system"}
        import {useSignMessage} from '@privy-io/react-auth';
        ```

        ```tsx  theme={"system"}
        const {signMessage} = useSignMessage();
        const signature = await signMessage(
          {message: 'Hello, world!'},
          {uiOptions: {showWalletUIs: false}}
        );
        ```
      </Tab>

      <Tab title="Solana">
        ```tsx  theme={"system"}
        import {useSignMessage} from '@privy-io/react-auth/solana';
        ```

        ```tsx  theme={"system"}
        const {signMessage} = useSignMessage();
        signMessage({
          message: 'messageinUint8Array',
          options: {uiOptions: {showWalletUIs: false}}
        });
        ```
      </Tab>

      <Tab title="Other chains">
        ```tsx  theme={"system"}
        import {useSignRawHash} from '@privy-io/react-auth/extended-chains';
        ```

        ```tsx  theme={"system"}
        const {signature} = await signRawHash({
          address: 'insert-wallet-address',
          chainType: 'cosmos', // or 'stellar', 'sui', etc.
          hash: '0x1acab030f479bda7829de07e9db4138cec5d38574df17d65af1617b7268541c0'
        });
        ```
      </Tab>
    </Tabs>
  </Accordion>

  <Accordion title="Sending a transaction">
    To whitelabel Privy's transaction sending functionality, use the `useSendTransaction` hook and call `sendTransaction` with your desired transaction.

    <Tabs>
      <Tab title="Ethereum">
        ```tsx  theme={"system"}
        import {useSendTransaction} from '@privy-io/react-auth';
        ```

        ```tsx  theme={"system"}
        const {sendTransaction} = useSendTransaction();
        sendTransaction(
          {
            to: '0xE3070d3e4309afA3bC9a6b057685743CF42da77C',
            value: 100000
          },
          {
            uiOptions: {showWalletUIs: false}
          }
        );
        ```
      </Tab>

      <Tab title="Solana">
        ```tsx  theme={"system"}
        import {useSendTransaction} from '@privy-io/react-auth/solana';
        ```

        ```tsx  theme={"system"}
        const {sendTransaction} = useSendTransaction();
        sendTransaction({
          transaction: 'insert-solana-transaction',
          uiOptions: {showWalletUIs: false}
        });
        ```
      </Tab>
    </Tabs>
  </Accordion>
</View>

<View title="React Native" icon="react">
  Privy’s React Native SDK is whitelabel by default, enabling apps to implement custom authentication UI and flows using the SDK’s functions. Get started with `sendTransaction` [here](/wallets/using-wallets/ethereum/send-a-transaction#react-native).
</View>

<View title="Swift" icon="swift">
  Privy’s Swift SDK is whitelabel by default, enabling apps to implement custom wallet UI and flows using the SDK’s functions. Get started with sending a transaction [here](/wallets/using-wallets/ethereum/send-a-transaction#swift).
</View>

<View title="Android" icon="android">
  Privy’s Android SDK is whitelabel by default, enabling apps to implement custom wallet UI and
  flows using the SDK’s functions. Get started with sending a transaction
  [here](/wallets/using-wallets/ethereum/send-a-transaction#android).
</View>

<View title="Flutter" icon="flutter">
  Privy’s Flutter SDK is whitelabel by default, enabling apps to implement custom wallet UI and
  flows using the SDK’s functions. Get started with sending a transaction
  [here](/wallets/using-wallets/ethereum/send-a-transaction#flutter).
</View>

<View title="Unity" icon="unity">
  Privy’s Unity SDK is whitelabel by default, enabling apps to implement custom wallet UI and flows
  using the SDK’s functions. Get started with sending a transaction
  [here](/wallets/using-wallets/ethereum/send-a-transaction#unity).
</View>
\n