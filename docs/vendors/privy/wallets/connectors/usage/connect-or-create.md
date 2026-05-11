> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Connect or create a wallet

<View title="React" icon="react">
  You can also use Privy to connect a user's external wallet if they have one, or to create an embedded wallet for them if they do not. This ensures users always have a connected wallet they can use with your application, and allows them to choose to use their external wallet if preferred.

  To do so, use the **`connectOrCreateWallet`** method of the **`usePrivy`** hook:

  ```tsx  theme={"system"}
  const {connectOrCreateWallet} = usePrivy();
  ```

  This method will prompt the user to connect an external wallet, or log in with email, SMS, or socials, depending on your configured `loginMethods`, to create an embedded wallet.

  <Info>
    Privy's `connectOrCreate` interface currently only supports external and embedded wallets on EVM
    networks.
  </Info>

  For example, you might have a "Connect" button in your app that prompts users to connect their wallet, like so:

  ```tsx  theme={"system"}
  import {useConnectOrCreateWallet} from '@privy-io/react-auth';

  export default function ConnectWalletButton() {
    const {connectOrCreateWallet} = useConnectOrCreateWallet();
    // Prompt user to connect a wallet with Privy modal
    return <button onClick={connectOrCreateWallet}>Connect wallet</button>;
  }
  ```

  <Tip>
    This method functions exactly the same as Privy's `login` method, except when users connect their
    external wallet, they will not automatically be prompted to authenticate that wallet by signing a
    message
  </Tip>

  ### Callbacks

  You can optionally pass callbacks to the `useConnectOrCreateWallet` hook to run custom logic after connecting a wallet or to handle errors.

  #### `onSuccess`

  ```tsx  theme={"system"}
  onSuccess: (args: {wallet: ConnectedWallet}) => Promise<void>;
  ```

  ##### Parameters

  <ParamField path="wallet" type="ConnectedWallet">
    The most recently connected wallet.
  </ParamField>

  #### `onError`

  ```tsx  theme={"system"}
  onError: (error: Error) => Promise<void>;
  ```

  ##### Parameters

  <ParamField path="error" type="Error">
    The error that occurred during the this flow.
  </ParamField>
</View>
\n