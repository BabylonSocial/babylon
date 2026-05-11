> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# null

<Info>
  When using Privy's server-side SDKs to sign transactions, you can use the authorization context to
  automatically sign requests. Learn more about [signing on the
  server](/controls/authorization-keys/using-owners/sign/signing-on-the-server).
</Info>

<View title="React" icon="react">
  To send a transaction from a wallet using the React SDK, use the `sendTransaction` method from the `useSendTransaction` hook:

  ```javascript  theme={"system"}
  sendTransaction: (input: UnsignedTransactionRequest, options?: {
    sponsor?: boolean;
    uiOptions?: SendTransactionModalUIOptions;
    fundWalletConfig?: FundWalletConfig;
    address?: string;
  }) => Promise<{ hash: HexString }>
  ```

  ### Usage

  ```javascript  theme={"system"}
  import {useSendTransaction, useWallets} from '@privy-io/react-auth';

  const {sendTransaction} = useSendTransaction();
  const {wallets} = useWallets();

  sendTransaction(
    {
      to: '0xE3070d3e4309afA3bC9a6b057685743CF42da77C',
      value: 100000
    },
    {
      address: wallets[0].address // Optional: Specify the wallet to use for signing. If not provided, the first wallet will be used.
    }
  );
  ```

  ### Parameters

  <ParamField path="input" type="UnsignedTransactionRequest" required>
    The details of the transaction to send on the chain.
  </ParamField>

  <ParamField path="options.sponsor" type="boolean">
    Optional parameter to enable gas sponsorship for this transaction. [Learn
    more.](/wallets/gas-and-asset-management/gas/overview)
  </ParamField>

  <ParamField path="options.uiOptions" type="SendTransactionModalUIOptions">
    The options for the UI of the send transaction modal. [Learn
    more](/wallets/using-wallets/ui-components).

    <Tip>
      To hide confirmation modals, set `options.uiOptions.showWalletUIs` to `false`. Learn more about
      configuring modal prompts [here](/recipes/react/manage-wallet-UIs).
    </Tip>
  </ParamField>

  <ParamField path="options.fundWalletConfig" type="FundWalletConfig">
    The configuration for funding the wallet.
  </ParamField>

  <ParamField path="options.address" type="string">
    The address of the wallet to use for sending the transaction. **Recommended when working with
    external wallets** to ensure reliable functionality. If not provided, the first wallet will be
    used.
  </ParamField>

  ### Returns

  <ResponseField name="hash" type="HexString">
    The hash for the broadcasted transaction.
  </ResponseField>
</View>

<View title="React Native" icon="react">
  To send a transaction from a wallet using the React Native SDK use the `request` method from the wallets EIP1193 provider:

  ```javascript  theme={"system"}
  request: (request: { method: 'eth_sendTransaction', params: [SendTransactionParams] }) => Promise<HexString>
  ```

  <Note>
    The Expo SDK does not support built-in UIs for sending transactions.
    The `eth_sendTransaction` method gives you complete control over the experience and UI.
  </Note>

  ### Usage

  ```javascript  theme={"system"}
  import {useEmbeddedEthereumWallet} from '@privy-io/expo';

  const {wallets} = useEmbeddedEthereumWallet();
  const wallet = wallets[0];

  const provider = await wallet.getProvider();
  const accounts = await provider.request({
      method: 'eth_requestAccounts',
  });

  // Send transaction (will be signed and populated)
  const response = await provider.request({
      method: 'eth_sendTransaction',
      params: [
          {
              from: accounts[0],
              to: '0x0000000000000000000000000000000000000000',
              value: '0x2386F26FC10000',
          },
      ],
  });
  ```

  ### Parameters

  <ParamField path="request.method" type="'eth_sendTransaction'" required>
    The RPC method executed with the wallet.
  </ParamField>

  <ParamField path="request.params" type="SendTransactionParams" required>
    The details of the transaction to send on the chain.
  </ParamField>

  ### Returns

  <ResponseField name="response" type="HexString">
    The hash for the broadcasted transaction.
  </ResponseField>
</View>

<View title="Swift" icon="swift">
  Use the `request` method on the Ethereum provider to send a transaction with an Ethereum wallet.

  ```swift  theme={"system"}
  func request(_ request: EthereumRpcRequest) async throws -> String
  ```

  ### Usage

  ```swift  theme={"system"}
  let provider = wallet.provider

  let transaction = EthereumRpcRequest.UnsignedEthTransaction(
      from: wallet.address,
      to: "0xE3070d3e4309afA3bC9a6b057685743CF42da77C",
      value: .int(10000),
      chainId: .hexadecimal("0x2105") // Base, in hex
  )

  let transactionHash = try await provider.request(.ethSendTransaction(transaction: transaction)
  ```

  ### Parameters

  <ParamField path="transaction" type="EthereumRpcRequest.UnsignedEthTransaction" required>
    The transaction to send.

    <Expandable title="child attributes" defaultOpen="true">
      <ParamField path="from" type="string">
        The address sending the transaction (the user's wallet address).
      </ParamField>

      <ParamField path="to" type="string" required>
        The address to send the transaction to.
      </ParamField>

      <ParamField path="value" type="Quantity">
        The amount of wei to send, as an integer or hexadecimal string.
      </ParamField>

      <ParamField path="chainId" type="Quantity">
        The chain ID as an integer or hexadecimal string. Defaults to mainnet (0x1) if omitted.
      </ParamField>

      <ParamField path="data" type="string">
        The data to include with the transaction, as a hexadecimal string.
      </ParamField>

      <ParamField path="gasLimit" type="string">
        The gas limit for the transaction, as a hexadecimal string.
      </ParamField>
    </Expandable>
  </ParamField>

  ### Returns

  <ResponseField name="transactionHash" type="string">
    The hash of the broadcasted transaction.
  </ResponseField>
</View>

<View title="Android" icon="android">
  Use the `request` method on the Ethereum wallet provider to send a transaction with an Ethereum wallet.

  ```kotlin  theme={"system"}
  public suspend fun request(request: EthereumRpcRequest): Result<EthereumRpcResponse>
  ```

  ### Usage

  ```kotlin  theme={"system"}
  val transaction = JSONObject().apply {
      put("to", "0xE3070d3e4309afA3bC9a6b057685743CF42da77C")
      put("value", "0x186a0") // 100000 in hex
      put("chainId", "0x2105") // 8453 (Base) in hex
      put("from", ethereumWallet.address)
  }.toString()

  val result = ethereumWallet.provider.request(
      request = EthereumRpcRequest.ethSendTransaction(transaction),
  )

  when (result) {
      is Result.Success -> {
          val transactionHash = result.data.data
          // Handle successful transaction
      }
      is Result.Failure -> {
          // Handle error
      }
  }
  ```

  ### Parameters

  <ParamField path="method" type="'eth_sendTransaction'" required>
    The RPC method to execute with the wallet.
  </ParamField>

  <ParamField path="params" type="List<String>" required>
    Array containing the transaction JSON as a single string element.

    <Expandable title="child attributes" defaultOpen="true" defaultOpen="true">
      <ParamField path="to" type="string" required>
        The address to send the transaction to.
      </ParamField>

      <ParamField path="value" type="string">
        The amount of wei to send, as a hexadecimal string.
      </ParamField>

      <ParamField path="chainId" type="string">
        The chain ID as a hexadecimal string. Defaults to mainnet (0x1) if omitted.
      </ParamField>

      <ParamField path="from" type="string">
        The address sending the transaction (the user's wallet address).
      </ParamField>

      <ParamField path="data" type="string">
        The data to include with the transaction, as a hexadecimal string.
      </ParamField>

      <ParamField path="gasLimit" type="string">
        The gas limit for the transaction, as a hexadecimal string.
      </ParamField>
    </Expandable>
  </ParamField>

  ### Returns

  <ResponseField name="result" type="Result<EthereumRpcResponse>">
    A Result that, when successful, contains the EthereumRpcResponse with:

    <Expandable title="child attributes" defaultOpen="true">
      <ResponseField name="method" type="string">
        The RPC method that was executed (eth\_sendTransaction).
      </ResponseField>

      <ResponseField name="data" type="string">
        The transaction hash for the broadcasted transaction.
      </ResponseField>
    </Expandable>
  </ResponseField>
</View>

<View title="Unity" icon="unity">
  Use the `Request` method on the wallet's RPC provider to send a transaction with an Ethereum wallet.

  ```csharp  theme={"system"}
  public Task<RpcResponse> Request(RpcRequest request);
  ```

  ### Usage

  ```csharp  theme={"system"}
  // Create transaction JSON
  string transactionJson = JsonUtility.ToJson(new {
      to = "0xE3070d3e4309afA3bC9a6b057685743CF42da77C",
      value = "0x186a0", // 100000 in hex
      chainId = "0x2105", // 8453 (Base) in hex
      from = embeddedWallet.Address
  });

  // Create RPC request
  var rpcRequest = new RpcRequest
  {
      Method = "eth_sendTransaction",
      Params = new string[] { transactionJson }
  };

  // Send transaction
  RpcResponse transactionResponse = await embeddedWallet.RpcProvider.Request(rpcRequest);

  // Transaction hash is in the response data
  string transactionHash = transactionResponse.Data;
  ```

  ### Parameters

  <ParamField path="Method" type="'eth_sendTransaction'" required>
    The RPC method to execute with the wallet.
  </ParamField>

  <ParamField path="Params" type="string[]" required>
    Array containing the transaction JSON as a single string element.

    <Expandable title="child attributes" defaultOpen="true" defaultOpen="true">
      <ParamField path="to" type="string" required>
        The address to send the transaction to.
      </ParamField>

      <ParamField path="value" type="string">
        The amount of wei to send, as a hexadecimal string.
      </ParamField>

      <ParamField path="chainId" type="string">
        The chain ID as a hexadecimal string. Defaults to mainnet (0x1) if omitted.
      </ParamField>

      <ParamField path="from" type="string">
        The address sending the transaction (the user's wallet address).
      </ParamField>

      <ParamField path="data" type="string">
        The data to include with the transaction, as a hexadecimal string.
      </ParamField>

      <ParamField path="gasLimit" type="string">
        The gas limit for the transaction, as a hexadecimal string.
      </ParamField>
    </Expandable>
  </ParamField>

  ### Returns

  <ResponseField name="RpcResponse" type="RpcResponse">
    An RPC response object with:

    <Expandable title="child attributes" defaultOpen="true">
      <ResponseField name="method" type="string">
        The RPC method that was executed (eth\_sendTransaction).
      </ResponseField>

      <ResponseField name="data" type="string">
        The transaction hash for the broadcasted transaction.
      </ResponseField>
    </Expandable>
  </ResponseField>
</View>

<View title="Flutter" icon="flutter">
  Use the `request` method on the Ethereum wallet provider to send a transaction with an Ethereum wallet.

  ```dart  theme={"system"}
  Future<Result<EthereumRpcResponse>> request(EthereumRpcRequest request);
  ```

  ### Usage

  ```dart  theme={"system"}
  // Create transaction parameters as a Map
  final transactionMap = {
      'to': '0xE3070d3e4309afA3bC9a6b057685743CF42da77C',
      'value': '0x186a0', // 100000 in hex
      'chainId': '0x2105', // 8453 (Base) in hex
      'from': ethereumWallet.address
  };

  // Convert Map to JSON string
  final transactionJson = jsonEncode(transactionMap);

  // Create the RPC request
  final rpcRequest = EthereumRpcRequest(
      method: 'eth_sendTransaction',
      params: [transactionJson],
  );

  // Send the transaction
  final result = await ethereumWallet.provider.request(rpcRequest);

  // Handle the result
  result.when(
      success: (response) {
          final transactionHash = response.data;
          print('Transaction sent with hash: $transactionHash');
      },
      failure: (error) {
          print('Failed to send transaction: $error');
      },
  );
  ```

  ### Parameters

  <ParamField path="method" type="'eth_sendTransaction'" required>
    The RPC method to execute with the wallet.
  </ParamField>

  <ParamField path="params" type="List<dynamic>" required>
    List containing the transaction JSON as a single string element.

    <Expandable title="child attributes" defaultOpen="true" defaultOpen="true">
      <ParamField path="to" type="string" required>
        The address to send the transaction to.
      </ParamField>

      <ParamField path="value" type="string">
        The amount of wei to send, as a hexadecimal string.
      </ParamField>

      <ParamField path="chainId" type="string">
        The chain ID as a hexadecimal string. Defaults to mainnet (0x1) if omitted.
      </ParamField>

      <ParamField path="from" type="string">
        The address sending the transaction (the user's wallet address).
      </ParamField>

      <ParamField path="data" type="string">
        The data to include with the transaction, as a hexadecimal string.
      </ParamField>

      <ParamField path="gasLimit" type="string">
        The gas limit for the transaction, as a hexadecimal string.
      </ParamField>
    </Expandable>
  </ParamField>

  ### Returns

  <ResponseField name="result" type="Result<EthereumRpcResponse>">
    A Result that, when successful, contains the EthereumRpcResponse with:

    <Expandable title="child attributes" defaultOpen="true">
      <ResponseField name="method" type="string">
        The RPC method that was executed (eth\_sendTransaction).
      </ResponseField>

      <ResponseField name="data" type="string">
        The transaction hash for the broadcasted transaction.
      </ResponseField>
    </Expandable>
  </ResponseField>
</View>

<View title="NodeJS" icon="node-js">
  <Tip>
    Privy is fully compatible with popular web3 libraries for interfacing wallets, including [`viem`](https://viem.sh/), learn more [here](/wallets/using-wallets/ethereum/web3-integrations#node-js).
  </Tip>

  Use the `sendTransaction` method on the Ethereum interface to send a transaction with an Ethereum wallet.

  ### Usage

  ```js  theme={"system"}
  const {hash, caip2} = await privy.wallets().ethereum().sendTransaction('insert-wallet-id', {
      caip2: 'eip155:8453',
      params: {
          transaction: {
              to: '0xE3070d3e4309afA3bC9a6b057685743CF42da77C',
              value: '0x2386F26FC10000',
              chain_id: 8453,
          },
      },
      sponsor: true,
  });
  ```

  ### Parameters and Returns

  Check out the [API reference](/api-reference/wallets/ethereum/eth-send-transaction) for more details.

  <Warning>
    A successful response indicates that the transaction has been broadcasted to the network.
    Transactions may get broadcasted but still fail to be confirmed by the network. To handle these
    scenarios, see our guide on [speeding up transactions](/recipes/speeding-up-transactions).
  </Warning>
</View>

<View title="NodeJS (server-auth)" icon="node-js">
  <Warning>
    The `@privy-io/server-auth` library is deprecated. We recommend integrating `@privy-io/node` for
    the latest features and support.
  </Warning>

  <Tip>
    Privy is fully compatible with popular web3 libraries for interfacing wallets, including [`viem`](https://viem.sh/), learn more [here](/wallets/using-wallets/ethereum/web3-integrations#node-js).
  </Tip>

  Use the `sendTransaction` method on the Ethereum client to send a transaction with an Ethereum wallet.

  ```js  theme={"system"}
  sendTransaction: (input: EthereumSendTransactionInputType) => Promise<EthereumSendTransactionResponseType>
  ```

  ### Usage

  ```js  theme={"system"}
  const {hash, caip2} = await privy.walletApi.ethereum.sendTransaction({
      walletId: 'insert-wallet-id',
      caip2: 'eip155:8453',
      transaction: {
          to: '0xE3070d3e4309afA3bC9a6b057685743CF42da77C',
          value: '0x2386F26FC10000',
          chainId: 8453,
      },
      sponsor: true,
  });
  ```

  ### Parameters

  <ParamField path="walletId" type="string" required>
    The ID of the wallet to send the transaction from.
  </ParamField>

  <ParamField path="caip2" type="`eip155:${number}`" required>
    The CAIP2 chain ID of the chain the transaction is being sent on.
  </ParamField>

  <ParamField path="transaction" type="EthereumTransactionType" required>
    The transaction to send.
  </ParamField>

  <ParamField path="sponsor" type="boolean">
    Optional parameter to enable gas sponsorship for this transaction. [Learn more.](/wallets/gas-and-asset-management/gas/overview)
  </ParamField>

  ### Returns

  <ResponseField name="hash" type="string">
    The hash for the broadcasted transaction.
  </ResponseField>

  <ResponseField name="caip2" type="`eip155:${number}`">
    The CAIP2 chain ID of the chain the transaction was sent on.
  </ResponseField>

  <Warning>
    A successful response indicates that the transaction has been broadcasted to the network.
    Transactions may get broadcasted but still fail to be confirmed by the network. To handle these
    scenarios, see our guide on [speeding up transactions](/recipes/speeding-up-transactions).
  </Warning>
</View>

<View title="REST API" icon="terminal">
  To send a transaction, make a `POST` request to

  ```bash  theme={"system"}
  https://api.privy.io/v1/wallets/<wallet_id>/rpc
  ```

  <Info>
    Wallets with `owner_id` present must provide an [authorization signature](/api-reference/authorization-signatures) as a request header.

    If you are transacting with a user wallet, you must provide the user's [authorization signature](/api-reference/authorization-signatures#get-an-authorization-key).
  </Info>

  ### Usage

  ```bash  theme={"system"}
  $ curl --request POST https://api.privy.io/v1/wallets/<wallet_id>/rpc \
  -u "<your-privy-app-id>:<your-privy-app-secret>" \
  -H "privy-app-id: <your-privy-app-id>" \
  -H "privy-authorization-signature: <authorization-signature-for-request>" \
  -H 'Content-Type: application/json' \
  -d '{
      "method": "eth_sendTransaction",
      "caip2": "eip155:1",
      "params": {
          "transaction": {
              "to": "0xE3070d3e4309afA3bC9a6b057685743CF42da77C",
              "value": "0x2386F26FC10000",
          }
      },
      "sponsor": true
  }'
  ```

  A successful response will look like the following:

  ```json  theme={"system"}
  {
      "method": "eth_sendTransaction",
      "data": {
          "hash": "<transaction-hash>",
          "caip2": "eip155:1"
      }
  }
  ```

  ### Parameters

  <ParamField path="method" type="'eth_sendTransaction'" required>
    The RPC method executed with the wallet.
  </ParamField>

  <ParamField path="caip2" type="`eip155:${number}`" required>
    The CAIP2 chain ID of the chain the transaction is being sent on.
  </ParamField>

  <ParamField path="params.transaction" type="EthereumTransactionType" required>
    The details of the transaction to send on the chain.
  </ParamField>

  <ParamField path="sponsor" type="boolean">
    Optional parameter to enable gas sponsorship for this transaction. [Learn more.](/wallets/gas-and-asset-management/gas/overview)
  </ParamField>

  ### Returns

  <ResponseField name="method" type="'eth_sendTransaction'">
    The RPC method executed with the wallet.
  </ResponseField>

  <ResponseField name="data.hash" type="string">
    The hash for the broadcasted transaction.
  </ResponseField>

  <ResponseField name="data.caip2" type="`eip155:${number}`">
    The CAIP2 chain ID of the chain the transaction was sent on.
  </ResponseField>

  <Warning>
    A successful response indicates that the transaction has been broadcasted to the network.
    Transactions may get broadcasted but still fail to be confirmed by the network. To handle these
    scenarios, see our guide on [speeding up transactions](/recipes/speeding-up-transactions).
  </Warning>
</View>

<View title="Python" icon="python">
  ```python  theme={"system"}
  from .internal_client import generate_client
  client = generate_client()

  tx = client.wallets.rpc(
      wallet_id=user.wallet_id,
      method="eth_sendTransaction",
      caip2="eip155:1",
      params={
          "transaction": {
              "to": "0xE3070d3e4309afA3bC9a6b057685743CF42da77C",
              "value": 100000,
          },
      },
  )
  return {"data": tx.data}
  ```
</View>

<View title="Java" icon="java">
  To send a transaction from your wallet, use the `sendTransaction` method.
  It will populate missing network-related values (gas limit, gas fee values, nonce, type),
  sign your transaction, broadcast it to the network, and return the transaction hash to you.

  ### Usage

  ```java  theme={"system"}
  try {
      String caip2 = "eip155:11155111"; // Sepolia testnet

      EthereumSendTransactionRpcInputTransaction txn = EthereumSendTransactionRpcInputTransaction.builder()
          .to(recipientAddress)
          .value(EthereumSendTransactionRpcInputValue.of("0x1")) // 1 wei
          .chainId(EthereumSendTransactionRpcInputChainId.of(11_155_111)) // Sepolia testnet
          .build();

      // Example: If wallet's owner is an authorization private key
      AuthorizationContext authorizationContext = AuthorizationContext.builder()
          .addAuthorizationPrivateKey("authorization-key")
          .build();

      EthereumSendTransactionRpcResponseData response = privyClient
          .wallets()
          .ethereum()
          .sendTransaction(
              walletId,
              caip2,
              txn,
              authorizationContext
          );

      String transactionHash = response.hash();
  } catch (APIException e) {
      String errorBody = e.bodyAsString();
      System.err.println(errorBody);
  } catch (Exception e) {
      System.err.println(e.getMessage());
  }
  ```

  ### Parameters

  When defining a transaction, you may specify the following values on the `EthereumSendTransactionRpcInputTransaction` builder:

  <ParamField type="String" body="from">
    The address sending the transaction (the user's wallet address).
  </ParamField>

  <ParamField type="String" body="to">
    The address to send the transaction to.
  </ParamField>

  <ParamField type="EthereumSendTransactionRpcInputChainId" body="chainId">
    The ID of the chain the transaction is being sent on.
  </ParamField>

  <ParamField type="EthereumSendTransactionRpcInputNonce" body="nonce">
    The nonce for the transaction.
  </ParamField>

  <ParamField type="String" body="data">
    The data to include with the transaction, as a hexadecimal string.
  </ParamField>

  <ParamField type="EthereumSendTransactionRpcInputValue" body="value">
    The amount of wei to send, as an integer or hexadecimal string.
  </ParamField>

  <ParamField type="Object" body="type">
    The type of transaction to send.
  </ParamField>

  <ParamField type="EthereumSendTransactionRpcInputGasLimit" body="gasLimit">
    The gas limit for the transaction, as a hexadecimal string.
  </ParamField>

  <ParamField type="EthereumSendTransactionRpcInputGasPrice" body="gasPrice">
    The gas price for the transaction, as a hexadecimal string.
  </ParamField>

  <ParamField type="EthereumSendTransactionRpcInputMaxFeePerGas" body="maxFeePerGas">
    The maximum fee per gas for the transaction, as a hexadecimal string.
  </ParamField>

  <ParamField type="EthereumSendTransactionRpcInputMaxPriorityFeePerGas" body="maxPriorityFeePerGas">
    The maximum priority fee per gas for the transaction, as a hexadecimal string.
  </ParamField>

  ### Returns

  The `EthereumSendTransactionRpcResponseData` object contains a `hash()` field

  <ResponseField name="hash()" type="String">
    The hash of the broadcasted transaction.
  </ResponseField>
</View>

<View title="Rust" icon="rust">
  Use the `send_transaction` method on the Ethereum service to sign and broadcast a transaction.

  ### Usage

  ```rust  theme={"system"}
  use privy_rs::{AuthorizationContext, PrivyClient};

  let client = PrivyClient::new("app_id".to_string(), "app_secret".to_string())?;
  let ethereum_service = client.wallets().ethereum();
  let auth_ctx = AuthorizationContext::new();

  let transaction = EthereumSendTransactionRpcInputParamsTransaction {
      to: Some("0x742d35Cc6635C0532925a3b8c17d6d1E9C2F7ca".to_string()),
      value: None,
      gas_limit: None,
      max_fee_per_gas: None,
      max_priority_fee_per_gas: None,
      data: None,
      chain_id: None,
      from: None,
      gas_price: None,
      nonce: None,
      type_: None,
  };

  let result = ethereum_service
      .send_transaction(
          &wallet_id,
          "eip155:1",
          transaction,
          &auth_ctx,
          None,
      )
      .await?;

  println!("Transaction sent successfully");
  ```

  ### Parameters and Returns

  See the Rust SDK documentation for detailed parameter and return types, including embedded examples:

  * [EthereumService::send\_transaction](https://docs.rs/privy-rs/latest/privy_rs/ethereum/struct.EthereumService.html#method.send_transaction)

  For REST API details, see the [API reference](/api-reference/wallets/ethereum/eth-send-transaction).

  <Warning>
    A successful response indicates that the transaction has been broadcasted to the network.
    Transactions may get broadcasted but still fail to be confirmed by the network. To handle these
    scenarios, see our guide on [speeding up transactions](/recipes/speeding-up-transactions).
  </Warning>
</View>

<View title="Go" icon="golang">
  Use the `SendTransaction` method on the Ethereum service to sign and broadcast a transaction.

  ### Usage

  ```go  theme={"system"}
  caip2 := "eip155:11155111" // Sepolia testnet

  response, err := client.Wallets.Ethereum.SendTransaction(
      context.Background(),
      "wallet-id",
      caip2,
      privy.EthereumSendTransactionRpcInputParams{
          Transaction: privy.EthereumSendTransactionRpcInputParamsTransaction{
              To:    privy.String("0xE3070d3e4309afA3bC9a6b057685743CF42da77C"),
              Value: privy.EthereumSendTransactionRpcInputParamsTransactionValueUnion{
                  OfString: privy.String("0x2386F26FC10000"),
              },
              ChainID: privy.EthereumSendTransactionRpcInputParamsTransactionChainIDUnion{
                  OfInt: privy.Int(11155111),
              },
          },
      },
  )
  if err != nil {
      log.Fatalf("failed to send transaction: %v", err)
  }

  fmt.Println("Transaction hash:", response.Hash)
  ```

  ### Parameters and Returns

  See the [API reference](/api-reference/wallets/ethereum/eth-send-transaction) for more details.

  <Warning>
    A successful response indicates that the transaction has been broadcasted to the network.
    Transactions may get broadcasted but still fail to be confirmed by the network. To handle these
    scenarios, see our guide on [speeding up transactions](/recipes/speeding-up-transactions).
  </Warning>
</View>

<Note>
  For a complete example of sending USDC with Privy's SDKs, see our [Sending USDC
  recipe](/recipes/send-usdc).
</Note>
\n