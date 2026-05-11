> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Funding via wallet

The **transfer from wallets** funding option lets users transfer or bridge assets from an external wallet (e.g. MetaMask, Phantom) to an embedded wallet in your app.

If a user chooses an external wallet, Privy prompts the user to connect the external wallet and queries balances on the [chain](/wallets/funding/configuration) configured in the Dashboard.

<Info>
  With external wallets, users can fund their accounts on EVM networks with the network's native
  asset (e.g. ETH, POL), USDC, or ERC20 tokens, and accounts on Solana with SOL.
</Info>

<Expandable title="how to enable funding with Solana Wallets">
  To enable funding from Solana wallets, ensure your `PrivyProvider` is configured with:

  ```tsx  theme={"system"}
  <PrivyProvider
    appId="your-app-id"
    config={{
      appearance: {
        walletChainType: "ethereum-and-solana"
      },
      externalWallets: {
        solana: {
          connectors: toSolanaWalletConnectors()
        }
      },
      solana: {
        rpcs: {
          'solana:mainnet': {
            rpc: createSolanaRpc('https://api.mainnet-beta.solana.com'),
            rpcSubscriptions: createSolanaRpcSubscriptions('wss://api.mainnet-beta.solana.com')
          },
        }
      }
    }}
    ...
  >
    {/* your app */}
  </PrivyProvider>
  ```
</Expandable>

#### Transferring funds on the configured chain

If the external wallet has sufficient funds on the configured chain, Privy prompts the user to initiate a **transfer** from the external wallet on that chain. The transfer is executed in the external wallet.

If users prefer not to connect an external wallet, Privy provides the embedded wallet address and QR code for a manual transfer.

#### Bridging funds to the configured chain

If the external wallet does not have sufficient funds on the configured chain, but has funds on other networks, Privy prompts the user to **bridge** assets to the configured chain. Privy will query balances on the networks listed [here](/basics/react/advanced/configuring-evm-networks#default-configuration) and any additional [`supportedChains`](/basics/react/advanced/configuring-evm-networks#supported-chains) configured to determine possible source chains for bridging.

If the user only has enough funds on one chain, Privy will automatically prompt the user to bridge from that chain. If the user has enough funds on multiple source chains, Privy will allow the user to select from where to bridge funds.

Users can also bridge funds from Solana to EVM networks and vice versa.

Bridge flows are powered by [Reservoir Relay](https://relay.link/), which executes the cross-chain transfer. Relay supports the networks listed [here](https://docs.relay.link/references/api/api_resources/supported-chains#supported-chains).
\n