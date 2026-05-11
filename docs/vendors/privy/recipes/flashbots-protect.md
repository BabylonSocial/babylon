> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Integrating Flashbots Protect

[Flashbots Protect](https://docs.flashbots.net/flashbots-protect/overview) is an RPC service that helps protect your users' Ethereum transactions from dangerous frontrunning attacks by submitting transactions to a private mempool that remains hidden from bots. You can also use the service to earn MEV refunds on any MEV realized through backrunning.

To integrate Flashbots Protect with Privy, first configure the [Flashbots RPC URL](https://docs.flashbots.net/flashbots-protect/quick-start) for the chain your app needs:

<Tabs>
  <Tab title="Mainnet">
    ```tsx  theme={"system"}
    import {mainnet} from 'viem/chains';

    import {addRpcUrlOverrideToChain} from '@privy-io/react-auth';

    // Configure the Flashbots RPC URL for mainnet
    const mainnetWithFlashbotsProtect = addRpcUrlOverrideToChain(
      mainnet,
      'https://rpc.flashbots.net/fast'
    );
    ```
  </Tab>

  <Tab title="Sepolia">
    ```tsx  theme={"system"}
    import {sepolia} from 'viem/chains';

    import {addRpcUrlOverrideToChain} from '@privy-io/react-auth';

    // Configure the Flashbots RPC URL for sepolia
    const sepoliaWithFlashbotsProtect = addRpcUrlOverrideToChain(
      sepolia,
      'https://rpc-sepolia.flashbots.net/'
    );
    ```
  </Tab>

  <Tab title="Holesky">
    ```tsx  theme={"system"}
    import {holesky} from 'viem/chains';

    import {addRpcUrlOverrideToChain} from '@privy-io/react-auth';

    // Configure the Flashbots RPC URL for holesky
    const holeskyWithFlashbotsProtect = addRpcUrlOverrideToChain(
      holesky,
      'https://rpc-holesky.flashbots.net/'
    );
    ```
  </Tab>
</Tabs>

Next, pass the chain configured with the Flashbots RPC URL to the `config.supportedChains` property of the `PrivyProvider`:

<Tabs>
  <Tab title="Mainnet">
    ```tsx  theme={"system"}
    <PrivyProvider
      appId="your-privy-app-id"
      config={{
        ...theRestOfYourConfig,
        supportedChains: [mainnetWithFlashbotsProtect, ...otherChains]
      }}
    >
      {/* your app's content */}
    </PrivyProvider>
    ```
  </Tab>

  <Tab title="Sepolia">
    ```tsx  theme={"system"}
    <PrivyProvider
      appId="your-privy-app-id"
      config={{
        ...theRestOfYourConfig,
        supportedChains: [sepoliaWithFlashbotsProtect, ...otherChains]
      }}
    >
      {/* your app's content */}
    </PrivyProvider>
    ```
  </Tab>

  <Tab title="Holesky">
    ```tsx  theme={"system"}
    <PrivyProvider
      appId="your-privy-app-id"
      config={{
        ...theRestOfYourConfig,
        supportedChains: [holeskyWithFlashbotsProtect, ...otherChains]
      }}
    >
      {/* your app's content */}
    </PrivyProvider>
    ```
  </Tab>
</Tabs>

**That's it!** Once you've configured Flashbots Protect as the RPC URL for your desired chain, Privy will route your users' transactions through the private Flashbots mempool.

<Info>
  Flashbots Protect currently only supports Ethereum mainnet, the Ethereum Sepolia testnet, and the
  Ethereum Holesky testnet. The team is actively building support for other networks, including L2s,
  as well.
</Info>
\n