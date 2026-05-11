> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Connect an external wallet

<View title="React" icon="react">
  <Tip>
    To determine if Privy has fully processed all external and embedded wallet connections, use the **`ready`** boolean returned by the **`useWallets`** hooks.
  </Tip>

  To prompt a user to connect an external wallet (on EVM networks or Solana) to your app, use the `connectWallet` method from the `useConnectWallet` hook.

  ```tsx  theme={"system"}
  connectWallet: async ({ description?: string, walletList?: WalletListEntry[], walletChainType?: 'ethereum' | 'solana' }) => void
  ```

  ### Usage

  <Info>
    To connect external wallets on Solana, your application must first explicitly configure Solana connectors for Privy. [Learn more](/recipes/react/configuring-external-connectors#connecting-external-wallets-on-solana)
  </Info>

  ```tsx  theme={"system"}
  import {useConnectWallet} from '@privy-io/react-auth';
  const {connectWallet} = useConnectWallet();

  connectWallet();
  ```

  ### Parameters

  <ParamField path="description" type="string">
    A description for the wallet connection prompt, which will be displayed in
    Privy's UI.
  </ParamField>

  <ParamField path="walletList" type="WalletListEntry[]">
    {/* TODO add walletList link */}A list of \[wallet option] that you would like
    Privy to display in the connection prompt.

    {/* TODO: Add list of wallets that can be supported here, as an expandable */}
  </ParamField>

  <ParamField path="walletChainType" type="'solana-only' | 'ethereum-only' | 'ethereum-and-solana'">
    Filter the login wallet options to only show wallets that support the specified
    chain type.
  </ParamField>

  ### Callbacks

  You can optionally register an onSuccess or onError callback on the useConnectWallet hook.

  ```tsx  theme={"system"}
  const {connectWallet} = useConnectWallet({
      onSuccess: ({wallet}) => {
          console.log(wallet);
      },
      onError: (error) => {
          console.log(error);
      },
  });
  ```

  <ParamField path="onSuccess" type="({wallet: Wallet}) => void">
    An optional callback function that is called when a user successfully connects their wallet.
  </ParamField>

  <ParamField path="onError" type="({error: string}) => void">
    An optional callback function that is called when a user exits the connection flow or there is an error.
  </ParamField>
</View>
\n