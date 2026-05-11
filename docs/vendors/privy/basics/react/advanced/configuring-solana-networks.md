> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Configuring Solana networks

Privy supports [Solana clusters](https://solana.com/docs/core/clusters) such as Mainnet Beta, Devnet, and Testnet.

To configure RPC endpoints for Solana when using the Privy embedded wallet UIs (UI `signTransaction` and `signAndSendTransaction`), set RPC clients under the `config.solana.rpcs` prop of the `PrivyProvider`:

```tsx  theme={"system"}
<PrivyProvider
  appId="your-privy-app-id"
  config={{
    ...theRestOfYourConfig,
    solana: {
      rpcs: {
        'solana:mainnet': {
          rpc: createSolanaRpc('https://api.mainnet-beta.solana.com'),
          rpcSubscriptions: createSolanaRpcSubscriptions('wss://api.mainnet-beta.solana.com')
        },
        'solana:devnet': {
          rpc: createSolanaRpc('https://api.devnet.solana.com'),
          rpcSubscriptions: createSolanaRpcSubscriptions('wss://api.devnet.solana.com')
        }
      }
    }
  }}
>
  {/* your app's content */}
</PrivyProvider>
```

<Info>
  The `config.solana.rpcs` configuration is only required for Privy's embedded wallet UIs. If you
  are using external Solana wallets (e.g., Phantom, Solflare) without embedded wallet UIs, you do
  not need to set `config.solana.rpcs`.
</Info>

# Custom Solana Virtual Machine (SVM) networks

In addition to supporting transactions on Solana mainnet, devnet, and testnet, Privy also supports sending transactions on any blockchain that implements the [Solana Virtual Machine (SVM)](https://squads.so/blog/solana-svm-sealevel-virtual-machine).

You can send a transaction on a custom SVM by initializing the `Connection` instance for your transaction with the RPC URL for the SVM, like so:

```tsx  theme={"system"}
// Initialize connection instance with custom SVM RPC URL
let connection = new Connection('insert-custom-SVM-rpc-url');

// Build out the transaction object for your desired program
// https://solana-foundation.github.io/solana-web3.js/classes/Transaction.html
let transaction = new Transaction();

// Send transaction on custom SVM
console.log(await wallet.sendTransaction!(transaction, connection));
```
\n