> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Sending USDC (or other ERC-20s)

Sending USDC, or other ERC-20 tokens, is one of the most common actions taken by wallet users on Ethereum-based chains. This guide will walk you through how to format the transaction input data for these tokens, using USDC as an example.

## 1. Get the USDC contract address

To send USDC, you'll need the contract address for USDC. The address is different for each network, so make sure you get the correct address for the network you're targeting.
You can go to Circle's website to look up the USDC address on both [main networks](https://developers.circle.com/stablecoins/usdc-on-main-networks) and [test networks](https://developers.circle.com/stablecoins/usdc-on-test-networks).

## 2. Format the transaction send input data

USDC, and other ERC-20 tokens, are smart contracts. In order to send these tokens, your transaction needs to call the `transfer` function on the contract, which takes in two parameters:

* `to`: The address of the recipient
* `value`: The amount of tokens to send

When formatting the transaction input data, you must define the expected interface of the function you're calling by providing an ABI. You can use helper packages like `viem` to provide the ABI and encode the function parameters.

Additionally, each ERC-20 token defines a `decimals` value, which is the number of decimal places for the token. For USDC, the `decimals` value is usually 6, but for most other ERC-20 tokens, it's 18.

<View title="Typescript" icon="terminal">
  First, install the `viem` package if it is not installed yet.

  ```bash  theme={"system"}
  npm install viem
  ```

  Then, build the transaction input data.

  ```typescript  theme={"system"}
  import {encodeFunctionData, erc20Abi} from 'viem';

  const recipientAddress = '0x...';
  const amountToSend = 1; // Sender wants to send 1 USDC
  const decimals = 6; // USDC has 6 decimals

  const encodedData = encodeFunctionData({
    abi: erc20Abi,
    functionName: 'transfer',
    args: [recipientAddress, BigInt(amountToSend * 10 ** decimals)]
  });
  ```
</View>

<View title="Python" icon="python">
  First, install the `eth-abi` package.

  ```bash  theme={"system"}
  pip install eth-abi
  ```

  Then, build the transaction input data.

  ```python  theme={"system"}
  from eth_abi.abi import encode
  from eth_utils import function_signature_to_4byte_selector

  usdc_address = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" # address on base
  # Simplified ABI for the transfer function only
  function_signature = "transfer(address,uint256)"
  function_selector = function_signature_to_4byte_selector(function_signature)
  decimals = 6
  encoded_params = encode(
      ["address", "uint256"],
      [recipient_address, amount_to_send * 10**decimals],
  )
  data = "0x" + (function_selector + encoded_params).hex()

  ```
</View>

## 3. Send the transaction

You can send the transaction using the Privy API. Below are examples for React, React Native, and NodeJS; you can find other SDKs' send transaction examples in the [Send a transaction](/wallets/using-wallets/ethereum/send-a-transaction) guide.

<View title="React" icon="react">
  ```typescript  theme={"system"}
  import {useSendTransaction} from '@privy-io/react-auth';
  const {sendTransaction} = useSendTransaction();

  const {hash} = await sendTransaction({
    to: '$USDC_CONTRACT_ADDRESS',
    data: '0x', // from the previous step
    chainId: 8453 // Base's chainId
  });
  ```
</View>

<View title="React Native" icon="react">
  ```typescript  theme={"system"}
  import {useEmbeddedEthereumWallet} from '@privy-io/expo';

  const {wallets} = useEmbeddedEthereumWallet();
  const wallet = wallets[0];

  const provider = await wallet.getProvider();
  const accounts = await provider.request({
    method: 'eth_requestAccounts'
  });

  // Send transaction (will be signed and populated)
  const response = await provider.request({
    method: 'eth_sendTransaction',
    params: [
      {
        from: accounts[0],
        to: '$USDC_CONTRACT_ADDRESS',
        data: '0x' // from the previous step
      }
    ]
  });
  ```
</View>

<View title="NodeJS" icon="node-js">
  ```typescript {skip-check} theme={"system"}
  import {PrivyClient} from '@privy-io/node';

  const privy = new PrivyClient({
    appId: 'insert-your-app-id',
    appSecret: 'insert-your-app-secret'
  });

  const usdcContractAddress = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'; // on Base

  const {hash} = await privy
    .wallets()
    .ethereum()
    .sendTransaction('insert-wallet-id', {
      caip2: 'eip155:8453', // Base's caip2
      params: {
        transaction: {
          to: usdcContractAddress,
          data: encodedData, // from the previous step
          chain_id: 8453 // Base's chainId
        }
      }
    });
  ```
</View>

<View title="NodeJS (server-auth)" icon="node-js">
  <Warning>
    The `@privy-io/server-auth` library is deprecated. We recommend integrating `@privy-io/node` for
    the latest features and support.
  </Warning>

  ```typescript  theme={"system"}
  import {PrivyClient} from '@privy-io/server-auth';

  const privy = new PrivyClient(process.env.PRIVY_APP_ID!, process.env.PRIVY_APP_SECRET!);

  const usdcContractAddress = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'; // on Base

  const {hash} = await privy.walletApi.ethereum.sendTransaction({
    walletId: 'insert-wallet-id',
    caip2: 'eip155:8453', // Base's caip2
    transaction: {
      to: usdcContractAddress,
      data: '0x...', // from the previous step
      chainId: 8453 // Base's chainId
    }
  });
  ```
</View>

<View title="Python" icon="python">
  ```python  theme={"system"}
  tx = client.wallets.rpc(
      wallet_id=user.wallet_id,
      method="eth_sendTransaction",
      caip2="eip155:8453", # Base's caip2
      params={
          "transaction": {
              "to": usdc_address,
              "data": data,
          },
      },
  )
  return {"response": tx.data}

  ```
</View>

You've successfully sent USDC!
\n