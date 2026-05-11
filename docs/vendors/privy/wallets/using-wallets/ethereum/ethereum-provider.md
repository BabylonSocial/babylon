> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# null

## Getting an EIP-1193 provider

All of Privy's **`ConnectedWallet`** objects export a standard [EIP-1193 provider](https://eips.ethereum.org/EIPS/eip-1193) object. This allows your app to request signatures and transactions from the wallet, using familiar JSON-RPC requests like `personal_sign` or `eth_sendTransaction`.

<Info>
  [EIP-1193](https://eips.ethereum.org/EIPS/eip-1193), also known as the Ethereum JavaScript API, is
  a standardized interface for how applications can request information, signatures, and
  transactions from a connected wallet.
</Info>

To request signatures or transactions from a connected wallet, you can either:

* use the wallet's EIP-1193 provider to send JSON-RPC requests to the wallet directly
* pass the wallet to a library like `viem`, `ethers`, or `wagmi`
* for the embedded wallet specifically, use Privy's native **`signMessage`** and **`sendTransaction`** methods to customize the signature and transaction prompts for users

To get a wallet's EIP-1193 provider, use the **`ConnectedWallet`** object's **`getEthereumProvider`** method:

```tsx  theme={"system"}
const provider = await wallet.getEthereumProvider();
```

When requesting signatures and transactions from the wallet, you can either choose to interface with the EIP1193 provider directly, or to pass it to a library like `wagmi` or `viem`.
\n