> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Using smart wallets

<View title="React" icon="react">
  <Tip>
    Follow the [smart wallets setup guide](/wallets/using-wallets/evm-smart-wallets/setup/configuring-dashboard) to configure smart wallets for your application.
  </Tip>

  ## Get the smart wallet address

  Once a smart wallet has been created for a user, you can get the address for the smart wallet by finding the account of `type: 'smart_wallet'` from the user's `linkedAccounts` array.

  ```jsx  theme={"system"}
  const {user} = usePrivy();
  const smartWallet = user.linkedAccounts.find((account) => account.type === 'smart_wallet');
  console.log(smartWallet.address);
  // Logs the smart wallet's address
  console.log(smartWallet.type);
  // Logs the smart wallet type (e.g. 'safe', 'kernel', 'light_account', 'biconomy', 'thirdweb', 'coinbase_smart_wallet')
  ```

  ## Sign a message

  Use the `signMessage` function from the `client` returned by `useSmartWallets` hook in your React component to sign a message using the user's smart wallet.

  ```jsx  theme={"system"}
  signMessage: (input: {message: SignableMessage}, opts?: {uiOptions?: SignMessageModalUIOptions}) => Promise<Hex>
  ```

  ### Usage

  ```jsx  theme={"system"}
  import {useSmartWallets} from '@privy-io/react-auth/smart-wallets';
  const {client} = useSmartWallets();
  const uiOptions = {
      title: 'Sample title text',
      description: 'Sample description text',
      buttonText: 'Sample button text'
  };
  client.signMessage({message: 'Hello, world!'}, {uiOptions}).then((signature) => {
      console.log(signature);
  });
  ```

  ### Parameters

  The `signMessage` method accepts the following parameters:

  <ParamField path="input.message" type="string | {raw: Hex | ByteArray}" required>
    The message to sign by the smart account.
  </ParamField>

  <ParamField path="opts.uiOptions" type="SignMessageModalUIOptions">
    Optional UI customization options for the signature prompt.
  </ParamField>

  ### Returns

  <ResponseField name="signature" type="Hex">
    The signed message by the smart wallet.
  </ResponseField>

  ## Sign typed data

  Use the `signTypedData` function from the `client` returned by `useSmartWallets` hook in your React component to sign structured data using the user's smart wallet.

  ```jsx  theme={"system"}
  signTypedData: (input: SignTypedDataParameters, opts?: {uiOptions?: SignMessageModalUIOptions}) => Promise<Hex>
  ```

  ### Usage

  ```jsx  theme={"system"}
  import {useSmartWallets} from '@privy-io/react-auth/smart-wallets';
  const {client} = useSmartWallets();
  const uiOptions = {
      title: 'Sample title text',
      description: 'Sample description text',
      buttonText: 'Sample button text'
  };
  client.signTypedData(typedDataRequestParams, {uiOptions}).then((signature) => {
      console.log(signature);
  });
  ```

  ### Parameters

  The `signTypedData` method accepts the following parameters:

  <ParamField path="input" type="SignTypedDataParameters" required>
    The typed data to sign by the smart account.
  </ParamField>

  <ParamField path="opts.uiOptions" type="SignMessageModalUIOptions">
    Optional UI customization options for the signature prompt.
  </ParamField>

  ### Returns

  <ResponseField name="signature" type="Hex">
    The signed message by the smart wallet.
  </ResponseField>

  ## Send a transaction

  Use the `sendTransaction` function from the `client` returned by `useSmartWallets` hook in your React component to send a transaction using the user's smart wallet.

  ```jsx  theme={"system"}
  sendTransaction: (input: SendTransactionParameters, opts?: {uiOptions?: SendTransactionModalUIOptions}) => Promise<Hex>
  ```

  ### Usage

  ```jsx  theme={"system"}
  import {useSmartWallets} from '@privy-io/react-auth/smart-wallets';
  const {client} = useSmartWallets();
  const uiOptions = {
      title: 'Sample title text',
      description: 'Sample description text',
      buttonText: 'Sample button text'
  };
  client.sendTransaction({
      chain: base,
      to: 'insert-recipient-address',
      value: 0.1
  }, {uiOptions}).then((txHash) => {
      console.log(txHash);
  });
  ```

  ### Parameters

  The `sendTransaction` method accepts the following parameters:

  <ParamField path="input" type="SendTransactionParameters" required>
    The transaction to send by the smart account.
  </ParamField>

  <ParamField path="opts.uiOptions" type="SendTransactionModalUIOptions">
    Optional UI customization options for the transaction prompt.
  </ParamField>

  ### Returns

  <ResponseField name="txHash" type="Hex">
    The transaction hash of the sent transaction.
  </ResponseField>

  ## Batch transactions

  Smart wallets support sending a batch of transactions in a single, atomic submission to the network.

  ```jsx  theme={"system"}
  sendTransaction: (input: {calls: Array<{to: string, value?: bigint, data?: string}>}, opts?: {uiOptions?: SendTransactionModalUIOptions}) => Promise<Hex>
  ```

  ### Usage

  ```jsx  theme={"system"}
  import {useSmartWallets} from '@privy-io/react-auth/smart-wallets';
  const {client} = useSmartWallets();
  client.sendTransaction({
      calls: [
          // Approve transaction
          {
              to: USDC_ADDRESS,
              data: encodeFunctionData({
                  abi: USDC_ABI,
                  functionName: 'approve',
                  args: ['insert-spender-address', BigInt(1e6)]
              })
          },
          // Transfer transaction
          {
              to: USDC_ADDRESS,
              data: encodeFunctionData({
                  abi: USDC_ABI,
                  functionName: 'transfer',
                  args: ['insert-recipient-address', BigInt(1e6)]
              })
          }
      ]
  }).then((txHash) => {
      console.log(txHash);
  });
  ```

  ### Parameters

  The `sendTransaction` method for batching accepts the following parameters:

  <ParamField path="input.calls" type="Array<{to: string, value?: bigint, data?: string}>" required>
    Array of transactions to batch together.
  </ParamField>

  <ParamField path="opts.uiOptions" type="SendTransactionModalUIOptions">
    Optional UI customization options for the transaction prompt.
  </ParamField>

  ### Returns

  <ResponseField name="txHash" type="Hex">
    The transaction hash of the batched transaction.
  </ResponseField>

  ## Switch chains

  Use the `getClientForChain` method to create a new smart wallet client for a specific chain.

  ```jsx  theme={"system"}
  getClientForChain: ({id: number}) => Promise<SmartWalletClient>
  ```

  ### Usage

  ```jsx  theme={"system"}
  import {base} from 'viem/chains';
  const {getClientForChain} = useSmartWallets();
  const baseClient = await getClientForChain({
      id: base.id,
  });
  // Client will send transaction on Base
  baseClient.sendTransaction({
      ...
  });
  ```

  ### Parameters

  The `getClientForChain` method accepts the following parameters:

  <ParamField path="id" type="number" required>
    The chain ID to create a client for.
  </ParamField>

  ### Returns

  <ResponseField name="client" type="SmartWalletClient">
    A new smart wallet client configured for the specified chain.
  </ResponseField>

  <Tip>
    If configured `defaultChain` does not have a smart wallet network configuration, the smart wallet client will default to using the first configured chain that has a smart wallet network configuration.
  </Tip>
</View>

<View title="React Native" icon="react">
  <Tip>
    Follow the [React Native setup guide](/wallets/using-wallets/evm-smart-wallets/setup/configuring-dashboard) to configure smart wallets for your React Native application.
  </Tip>

  ## Get the smart wallet address

  Once a smart wallet has been created for a user, you can get the address for the smart wallet by finding the account of `type: 'smart_wallet'` from the user's `linked_accounts` array.

  ```jsx  theme={"system"}
  const {user} = usePrivy();
  const smartWallet = user.linked_accounts.find((account) => account.type === 'smart_wallet');
  console.log(smartWallet.address);
  // Logs the smart wallet's address
  console.log(smartWallet.type);
  // Logs the smart wallet type (e.g. 'safe', 'kernel', 'light_account', 'biconomy', 'thirdweb', 'coinbase_smart_wallet')
  ```

  ## Sign a message

  Use the `signMessage` function from the `client` returned by `useSmartWallets` hook in your React Native component to sign a message using the user's smart wallet.

  ```jsx  theme={"system"}
  signMessage: ({message: SignableMessage}) => Promise<Hex>
  ```

  ### Usage

  ```jsx  theme={"system"}
  import {useSmartWallets} from '@privy-io/expo/smart-wallets';
  const {client} = useSmartWallets();
  client.signMessage({message: 'Hello, world!'}).then((signature) => {
      console.log(signature);
  });
  ```

  ### Parameters

  The `signMessage` method accepts the following parameters:

  <ParamField path="input.message" type="string | {raw: Hex | ByteArray}" required>
    The message to sign by the smart account.
  </ParamField>

  ### Returns

  <ResponseField name="signature" type="Hex">
    The signed message by the smart wallet.
  </ResponseField>

  ## Sign typed data

  Use the `signTypedData` function from the `client` returned by `useSmartWallets` hook in your React Native component to sign structured data using the user's smart wallet.

  ```jsx  theme={"system"}
  signTypedData: (input: SignTypedDataParameters) => Promise<Hex>
  ```

  ### Usage

  ```jsx  theme={"system"}
  import {useSmartWallets} from '@privy-io/expo/smart-wallets';
  const {client} = useSmartWallets();
  client.signTypedData(...).then((signature) => {
      console.log(signature);
  });
  ```

  ### Parameters

  The `signTypedData` method accepts the following parameters:

  <ParamField path="input" type="SignTypedDataParameters" required>
    The typed data to sign by the smart account.
  </ParamField>

  ### Returns

  <ResponseField name="signature" type="Hex">
    The signed message by the smart wallet.
  </ResponseField>

  ## Send a transaction

  Use the `sendTransaction` function from the `client` returned by `useSmartWallets` hook in your React Native component to send a transaction using the user's smart wallet.

  ```jsx  theme={"system"}
  sendTransaction: (input: SendTransactionParameters) => Promise<Hex>
  ```

  ### Usage

  ```jsx  theme={"system"}
  import {useSmartWallets} from '@privy-io/expo/smart-wallets';
  const {client} = useSmartWallets();
  client.sendTransaction({
      account: client.account,
      chain: base,
      to: 'insert-recipient-address',
      value: 0.1
  }).then((txHash) => {
      console.log(txHash);
  });
  ```

  ### Parameters

  The `sendTransaction` method accepts the following parameters:

  <ParamField path="input" type="SendTransactionParameters" required>
    The transaction to send by the smart account.
  </ParamField>

  ### Returns

  <ResponseField name="txHash" type="Hex">
    The transaction hash of the sent transaction.
  </ResponseField>

  ## Batch transactions

  Smart wallets support sending a batch of transactions in a single, atomic submission to the network.

  ```jsx  theme={"system"}
  sendTransaction: (input: {calls: Array<{to: string, value?: bigint, data?: string}>}) => Promise<Hex>
  ```

  ### Usage

  ```jsx  theme={"system"}
  import {useSmartWallets} from '@privy-io/expo/smart-wallets';
  const {client} = useSmartWallets();
  client.sendTransaction({
      account: client.account,
      calls: [
          // Approve transaction
          {
              to: USDC_ADDRESS,
              data: encodeFunctionData({
                  abi: USDC_ABI,
                  functionName: 'approve',
                  args: ['insert-spender-address', BigInt(1e6)]
              })
          },
          // Transfer transaction
          {
              to: USDC_ADDRESS,
              data: encodeFunctionData({
                  abi: USDC_ABI,
                  functionName: 'transfer',
                  args: ['insert-recipient-address', BigInt(1e6)]
              })
          }
      ]
  }).then((txHash) => {
      console.log(txHash);
  });
  ```

  ### Parameters

  The `sendTransaction` method for batching accepts the following parameters:

  <ParamField path="input.calls" type="Array<{to: string, value?: bigint, data?: string}>" required>
    Array of transactions to batch together.
  </ParamField>

  ### Returns

  <ResponseField name="txHash" type="Hex">
    The transaction hash of the batched transaction.
  </ResponseField>

  ## Switch chains

  Use the `getClientForChain` method to create a new smart wallet client for a specific chain.

  ```jsx  theme={"system"}
  getClientForChain: ({chainId: number}) => Promise<SmartWalletClient>
  ```

  ### Usage

  ```jsx  theme={"system"}
  import {base} from 'viem/chains';
  const {getClientForChain} = useSmartWallets();
  const baseClient = await getClientForChain({
      chainId: base.id,
  });
  // Client will send transaction on Base
  baseClient.sendTransaction({
      account: baseClient.account,
      ...
  });
  ```

  ### Parameters

  The `getClientForChain` method accepts the following parameters:

  <ParamField path="chainId" type="number" required>
    The chain ID to create a client for.
  </ParamField>

  ### Returns

  <ResponseField name="client" type="SmartWalletClient">
    A new smart wallet client configured for the specified chain.
  </ResponseField>

  <Tip>
    The smart wallet client will default to using the first configured chain that has a smart wallet network configuration.
  </Tip>
</View>
\n