> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Using Flashblocks with Privy

[Flashblocks](https://docs.base.org/base-chain/flashblocks/apps) are a new development on the Base L2 that allow for faster transaction confirmation times, with most pre-confirmations happening close to 200ms.

**Privy offers Flashblocks support on Base and Base Sepolia by default.** There is nothing you need to do to enable Flashblocks support – your application automatically leverages Flashblocks pre-confirmations for faster transaction experiences.

If you'd like to integrate your **own** Flashblocks provider instead of using Privy's default offering, you can do so following the guide below.

### 0. Set up Privy in your app

To start, if you haven't yet set up Privy, get your application on service [set up with Privy's basic functionality](/basics/get-started/platforms). Follow the linked quickstarts depending on your

If using Privy's React or Expo SDKs, install the `@privy-io/chains` package as well:

### 1. Get your Flashblocks RPC URL

Next, get your custom Flashblocks RPC URL from your own RPC provider. Most RPC providers like Quicknode, Alchemy, and Infura offer Flashblocks RPCs for Base.

### 2. Use your custom RPC URL for Base and/or Base Sepolia

Next, configure Privy with your custom Flashblocks RPC URL.

<View title="React, Expo" icon="react">
  In addition to Privy's React or Expo SDKs, install the `@privy-io/chains` and `viem` packages:

  ```sh  theme={"system"}
  npm i @privy-io/chains viem
  ```

  Next, use the `addRpcUrlOverride` method from `@privy-io/chains` to set your RPC URL in a `viem/chains` object:

  ```tsx  theme={"system"}
  import {base, baseSepolia} from 'viem/chains';
  import {addRpcUrlOverride} from '@privy-io/chains';

  const baseWithFlashblocks = addRpcUrlOverride(base, 'insert-flashblocks-rpc-url-for-base');
  const baseSepoliaWithFlashblocks = addRpcUrlOverride(
      baseSepolia,
      'insert-flashblocks-rpc-url-for-base-sepolia'
  );
  ```

  Then, pass the chain representations with your custom Flashblocks RPC URLs to the `PrivyProvider`'s `defaultChain` and `supportedChains` property:

  ```tsx  theme={"system"}
  <PrivyProvider
      appId='your-privy-app-id'
      config={{
          ...theRestOfYourConfig,
          // Replace this with your desired default chain
          defaultChain: baseWithFlashblocks
          supportedChains: [baseWithFlashblocks, baseSepoliaWithFlashblocks, ...otherChains]
      }}
  >
      {/* your app's content */}
  </PrivyProvider>
  ```
</View>

<View title="NodeJS" icon="node-js">
  Use the NodeJS SDK's [`signTransaction`](/wallets/using-wallets/ethereum/sign-a-transaction) method to request a signature over your desired transaction on Base or Base Sepolia:

  <CodeGroup>
    ```ts @privy-io/node theme={"system"}
    const {signedTransaction} = await privy.wallets().ethereum().signTransaction('insert-wallet-id', {
        params: {
            // Replace with your desired transaction
            transaction: {
                to: '0xE3070d3e4309afA3bC9a6b057685743CF42da77C',
                value: '0x2386F26FC10000',
                chainId: 8453,
            }
        }
    });
    ```

    ```ts @privy-io/server-auth theme={"system"}
    const {signedTransaction} = await privy.walletApi.ethereum.signTransaction({
        walletId: 'insert-wallet-id',
        // Replace with your desired transaction
        transaction: {
                to: '0xE3070d3e4309afA3bC9a6b057685743CF42da77C',
                value: '0x2386F26FC10000',
                chainId: 8453,
            }
        }
    });
    ```
  </CodeGroup>

  Next, create a viem public client, setting the `transport` to an HTTP transport with your custom Flashblocks URL:

  ```ts  theme={"system"}
  import {createPublicClient, http} from 'viem';
  import {base} from 'viem/chains';

  const publicClient = createPublicClient({
      chain: base,
      transport: http('insert-custom-flashblocks-RPC-URL')
  });
  ```

  Lastly, broadcast the `signedTransaction` using the public client's [`sendRawTransaction`](https://viem.sh/docs/actions/wallet/sendRawTransaction#sendrawtransaction) method. You can then wait for the transaction to be confirmed using the client's `waitForTransactionReceipt` method:

  ```ts  theme={"system"}
  const hash = await publicClient.sendRawTransaction({serializedTransaction: signedTransaction});
  const receipt = await publicClient.waitForTransactionReceipt({hash});
  ```
</View>

<View title="REST API" icon="terminal">
  Use the REST API's [`POST /v1/wallets/[wallet_id]/rpc`](/wallets/using-wallets/ethereum/sign-a-transaction) method with the `eth_signTransaction` RPC to request a signature over your desired transaction:

  ```sh  theme={"system"}
  $ curl --request POST https://api.privy.io/v1/wallets/<wallet_id>/rpc \
  -u "<your-privy-app-id>:<your-privy-app-secret>" \
  -H "privy-app-id: <your-privy-app-id>" \
  -H "privy-authorization-signature: <authorization-signature-for-request>" \
  -H 'Content-Type: application/json' \
  -d '{
      "method": "eth_signTransaction",
      "params": {
          # Replace with your desired transaction
          "transaction": {
              "to": "0xE3070d3e4309afA3bC9a6b057685743CF42da77C",
              "value": "0x2386F26FC10000",
              "chain_id": 8453,
              "type": 2,
              "gas_limit": "0x5208",
              "nonce": 1,
              "max_fee_per_gas": "0x14bf7dadac",
              "max_priority_fee_per_gas": "0xf4240"
          }
      }
  }'
  ```

  Next, using the `signed_transaction` from the response, broadcast the `signed_transaction` to your custom Flashblocks RPC URL using the `eth_sendRawTransaction` RPC method, like so:

  <Info>
    Make sure to update the cURL below with any authentication or headers required by your RPC provider.
  </Info>

  ```sh  theme={"system"}
  curl -X POST <insert-custom-flashblocks-RPC-url> \
  -H "Content-Type: application/json" \
  -d '{
      "jsonrpc": "2.0",
      "method": "eth_sendRawTransaction",
      "params": ["insert-signed-transaction"],
      "id": 1
  }'
  ```
</View>

### 3. Send transactions

**That's it!** Privy will now route transactions on Base and/or Base Sepolia through the Flashblocks RPC URL you configured. Transactions should execute with near-200ms pre-confirmation times.
\n