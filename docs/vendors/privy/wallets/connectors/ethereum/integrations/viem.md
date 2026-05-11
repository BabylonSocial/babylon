> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Integrating with viem

Viem represents connected wallets as a [**wallet client**](https://viem.sh/docs/clients/wallet.html) object, which you can use to get information about the current wallet or the request signatures and transactions.

To get a viem wallet client for a user's connected wallet, first import your desired network from the **`viem/chains`** package and import the **`createWalletClient`** method and **`custom`** transport from **`viem`**:

```tsx  theme={"system"}
import {createWalletClient, custom} from 'viem';
// Replace `sepolia` with your desired network
import {sepolia} from 'viem/chains';
```

Then, find your desired wallet from the **`wallets`** array and switch its network to the chain you imported, using the wallet's **`switchChain`** method:

```tsx  theme={"system"}
const {wallets} = useWallets();
const wallet = wallets[0]; // Replace this with your desired wallet
await wallet.switchChain(sepolia.id);
```

Lastly, get the wallet's EIP1193 provider using the wallet's **`getEthereumProvider`** method and pass it to viem's **`createWalletClient`** method like so:

```tsx  theme={"system"}
const provider = await wallet.getEthereumProvider();
const walletClient = createWalletClient({
    account: wallet.address as Hex,
    chain: sepolia,
    transport: custom(provider),
});
```

You can then use the [**wallet client**](https://viem.sh/docs/clients/wallet) to get information about the wallet or request signatures and transactions.
\n