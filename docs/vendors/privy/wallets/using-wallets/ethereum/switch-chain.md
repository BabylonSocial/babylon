> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Switch chains

<View title="React" icon="react">
  To switch the network of a connected wallet, first [find the corresponding **`ConnectedWallet`** object](/wallets/wallets/get-a-wallet) from the **`wallets`** array.

  ```tsx  theme={"system"}
  const {wallets} = useWallets();
  const wallet = wallets[0]; // Replace this with your desired wallet
  ```

  Then, call the wallet's **`switchChain`** method. As a parameter to the method, pass the chain ID for your desired network as a `number` or hexadecimal `string`:

  ```tsx  theme={"system"}
  await wallet.switchChain(7777777);
  ```

  For embedded wallets, **`switchChain`** will update the network of the embedded wallet behind the scenes. For external wallets, **`switchChain`** will prompt the user to switch to the target network within the external wallet's client (e.g. their browser extension or mobile app).

  **`switchChain`** returns a Promise that resolves to `void` once the wallet has successfully been switched to the target network. The Promise will reject with an error if:

  * The target chain has [not been configured](/basics/react/advanced/configuring-evm-networks).
  * The user declines the request to switch their network, if using an external wallet.
</View>

<View title="React Native" icon="react">
  By default, embedded wallets will be connected to the first network specified in your **`supportedChains`** array, and to Ethereum mainnet if no **`supportedChains`** are specified.

  To switch the embedded wallet to a different network, **send a [`wallet_switchEthereumChain`](https://docs.metamask.io/wallet/reference/wallet_switchethereumchain/) JSON-RPC request to the wallet's EIP-1193 provider.** In the request's **`params`**, specify your target **`chainId`** as a hexadecimal string.

  ```ts  theme={"system"}
  import {useEmbeddedEthereumWallet} from '@privy-io/expo';

  const {wallets} = useEmbeddedEthereumWallet();
  const wallet = wallets[0]; // Replace this with your desired wallet

  const provider = await wallet.getProvider();
  await provider.request({
    method: 'wallet_switchEthereumChain',
    // Replace '0x5' with the chainId of your target network
    params: [{chainId: '0x5'}]
  });
  ```

  You can also use the **`eth_chainId`** request (with no **`params`**) to get the current network of the embedded wallet.
</View>
\n