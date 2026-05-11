> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# null

This recipe assumes you have already [created an app](https://docs.privy.io/basics/get-started/dashboard/create-new-app) on the Privy Dashboard and configured your Privy Provider. Refer to our [React SDK Setup](/basics/react/setup) or [React Native SDK Setup](/basics/react-native/setup) documentation to get started.

<Steps>
  <Step title="Enable Abstract integration">
    From the Privy dashboard, navigate to [**Global Wallet > Integrations**](https://dashboard.privy.io/apps?page=ecosystem\&tab=integrations).

    Scroll down to find Abstract and toggle the switch to enable the integration.

    Note the provider app id, you will need it in the next step.
  </Step>

  <Step title="Login users with their Abstract Global Wallet">
    <View title="React" icon="react">
      To prompt users to log into your app with their Abstract Global Wallet, use the `loginWithCrossAppAccount` method from the `useCrossAppAccounts` hook:

      ```tsx  theme={"system"}
      import {usePrivy, useCrossAppAccounts} from '@privy-io/react-auth';

      function LoginButton() {
        const {ready, authenticated} = usePrivy();
        const {loginWithCrossAppAccount} = useCrossAppAccounts();

        return (
          <button
            onClick={() => loginWithCrossAppAccount({appId: 'insert-abstract-provider-app-id'})}
            disabled={!ready || !authenticated}
          >
            Log in with Abstract Global Wallet
          </button>
        );
      }
      ```
    </View>

    <View title="React Native" icon="react">
      To prompt users to log into your app with an account from a provider app, use the `loginWithCrossApp` method from the `useLoginWithCrossApp` hook:

      ```tsx  theme={"system"}
      import {usePrivy, useLoginWithCrossApp} from '@privy-io/expo';

      function LoginButton() {
        const {ready, user} = usePrivy();
        const {loginWithCrossApp} = useLoginWithCrossApp();

        return (
          <Button
            onPress={() => loginWithCrossApp({appId: 'insert-provider-app-id'})}
            disabled={!ready || !!user}
          >
            Log in with Abstract Global Wallet
          </Button>
        );
      }
      ```
    </View>
  </Step>

  <Step title="Sign a message with the user's Abstract Global Wallet">
    <View title="React" icon="react">
      To prompt users to sign a message with their Abstract Global Wallet, use the `signMessage` method from the `useCrossAppAccounts` hook:

      ```tsx  theme={"system"}
      import {usePrivy, useCrossAppAccounts} from '@privy-io/react-auth';

      function SignMessageButton() {
        const {user} = usePrivy();
        const {signMessage} = useCrossAppAccounts();
        const crossAppAccount = user.linkedAccounts.find((account) => account.type === 'cross_app');
        const address = crossAppAccount.embeddedWallets[0].address;

        return (
          <button onClick={() => signMessage('Hello world', {address: address})} disabled={!address}>
            Sign a message with your Abstract Global Wallet
          </button>
        );
      }
      ```

      Refer to [Using Global Wallets](/wallets/global-wallets/integrate-a-global-wallet/using-global-wallets) for more details.
    </View>

    <View title="React Native" icon="react">
      To prompt users to sign a message with their Abstract Global Wallet, use the `signMessage` method from the `useSignMessageWithCrossApp` hook:

      ```tsx  theme={"system"}
      import {usePrivy, useSignMessageWithCrossApp} from '@privy-io/expo';

      function SignMessageButton() {
        const {user} = usePrivy();
        const {signMessage} = useSignMessageWithCrossApp();
        const crossAppAccount = user.linked_accounts.find((account) => account.type === 'cross_app');
        const address = crossAppAccount.embedded_wallets[0].address;

        return (
          <button onClick={() => signMessage({address, message: 'Hello world'})} disabled={!address}>
            Sign a message with your cross-app wallet
          </button>
        );
      }
      ```

      Refer to [Using Global Wallets](/wallets/global-wallets/integrate-a-global-wallet/using-global-wallets) for more details.
    </View>
  </Step>
</Steps>
\n