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
  To send a transaction from a wallet using the React SDK, use the `signTransaction` method from the `useSignTransaction` hook:

  ```javascript  theme={"system"}
  signTransaction: (input: UnsignedTransactionRequest, options?: SendTransactionOptions) => Promise<{ signature: HexString }>
  ```

  ### Usage

  ```javascript  theme={"system"}
  import {useSignTransaction, useWallets} from '@privy-io/react-auth';

  const {signTransaction} = useSignTransaction();
  const {wallets} = useWallets();

  signTransaction(
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
    The details of the transaction to sign.
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
    The address of the wallet to use for signing the transaction. **Recommended when working with
    external wallets** to ensure reliable functionality. If not provided, the first wallet will be
    used.
  </ParamField>

  ### Returns

  <ResponseField name="signature" type="HexString">
    The signed transaction hash.
  </ResponseField>
</View>

<View title="React Native" icon="react">
  To sign a transaction from a wallet using the React Native SDK use the `request` method from the wallets EIP1193 provider:

  ```javascript  theme={"system"}
  request: (request: { method: 'eth_signTransaction', params: [SignTransactionParams] }) => Promise<HexString>
  ```

  <Note>
    The Expo SDK does not support built-in UIs for sending transactions.
    The `eth_signTransaction` method gives you complete control over the experience and UI.
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

  // Sign transaction (will be signed and populated)
  const response = await provider.request({
      method: 'eth_signTransaction',
      params: [
          {
              from: accounts[0],
              to: '0x0000000000000000000000000000000000000000',
              value: '1',
          },
      ],
  });
  ```

  ### Parameters

  <ParamField path="request.method" type="'eth_signTransaction'" required>
    The RPC method executed with the wallet.
  </ParamField>

  <ParamField path="request.params" type="SignTransactionParams" required>
    The details of the transaction to sign.
  </ParamField>

  ### Returns

  <ResponseField name="response" type="HexString">
    The hash for the broadcasted transaction.
  </ResponseField>
</View>

<View title="Swift" icon="swift">
  Use the `request` method on the Ethereum provider to sign a transaction with an Ethereum wallet.

  ```swift  theme={"system"}
  func request(_ request: EthereumRpcRequest) async throws -> String
  ```

  ### Usage

  ```swift  theme={"system"}
  let provider = wallet.provider

  let transaction = EthereumRpcRequest.UnsignedEthTransaction(
      from: wallet.address,
      to: "0xE3070d3e4309afA3bC9a6b057685743CF42da77C",
      value: .int(100000),
      chainId: .hexadecimal("0x2105"), // Base, in hex
  )

  let transactionSignature = try await provider.request(.ethSignTransaction(transaction: transaction))
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

  <ResponseField name="transactionSignature" type="string">
    The signature of the transaction.
  </ResponseField>
</View>

<View title="Android" icon="android">
  Use the `request` method on the Ethereum wallet provider to sign a transaction with an Ethereum wallet.

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
      request = EthereumRpcRequest.ethSignTransaction(transaction),
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

  <ParamField path="method" type="'eth_signTransaction'" required>
    The RPC method to execute with the wallet.
  </ParamField>

  <ParamField path="params" type="List<String>" required>
    Array containing the transaction JSON as a single string element.

    <Expandable title="child attributes" defaultOpen="true">
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
        The RPC method that was executed (eth\_signTransaction).
      </ResponseField>

      <ResponseField name="data" type="string">
        The transaction hash for the broadcasted transaction.
      </ResponseField>
    </Expandable>
  </ResponseField>
</View>

<View title="Unity" icon="unity">
  Use the `Request` method on the wallet's RPC provider to sign a transaction with an Ethereum wallet.

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
      Method = "eth_signTransaction",
      Params = new string[] { transactionJson }
  };

  // Sign transaction
  RpcResponse transactionResponse = await embeddedWallet.RpcProvider.Request(rpcRequest);

  // Transaction hash is in the response data
  string transactionHash = transactionResponse.Data;
  ```

  ### Parameters

  <ParamField path="Method" type="'eth_signTransaction'" required>
    The RPC method to execute with the wallet.
  </ParamField>

  <ParamField path="Params" type="string[]" required>
    Array containing the transaction JSON as a single string element.

    <Expandable title="child attributes" defaultOpen="true">
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
        The RPC method that was executed (eth\_signTransaction).
      </ResponseField>

      <ResponseField name="data" type="string">
        The transaction hash for the broadcasted transaction.
      </ResponseField>
    </Expandable>
  </ResponseField>
</View>

<View title="Flutter" icon="flutter">
  Use the `request` method on the Ethereum wallet provider to sign a transaction with an Ethereum wallet.

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
      method: 'eth_signTransaction',
      params: [transactionJson],
  );

  // Sign the transaction
  final result = await ethereumWallet.provider.request(rpcRequest);

  // Handle the result
  result.when(
      success: (response) {
          final transactionHash = response.data;
          print('Transaction sent with hash: $transactionHash');
      },
      failure: (error) {
          print('Failed to sign transaction: $error');
      },
  );
  ```

  ### Parameters

  <ParamField path="method" type="'eth_signTransaction'" required>
    The RPC method to execute with the wallet.
  </ParamField>

  <ParamField path="params" type="List<dynamic>" required>
    List containing the transaction JSON as a single string element.

    <Expandable title="child attributes" defaultOpen="true">
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
        The RPC method that was executed (eth\_signTransaction).
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

  Use the `signTransaction` method on the Ethereum interface to sign a transaction with an Ethereum wallet.

  ### Usage

  ```js  theme={"system"}
  const {signed_transaction, encoding} = await privy.wallets().ethereum().signTransaction('insert-wallet-id', {
      params: {
          transaction: {
              to: '0xE3070d3e4309afA3bC9a6b057685743CF42da77C',
              value: '0x2386F26FC10000',
              chain_id: 8453,
          },
      }
  });
  ```

  ### Parameters and Returns

  Check out the [API reference](/api-reference/wallets/ethereum/eth-sign-transaction) for more details.
</View>

<View title="NodeJS (server-auth)" icon="node-js">
  <Warning>
    The `@privy-io/server-auth` library is deprecated. We recommend integrating `@privy-io/node` for
    the latest features and support.
  </Warning>

  <Tip>
    Privy is fully compatible with popular web3 libraries for interfacing wallets, including [`viem`](https://viem.sh/), learn more [here](/wallets/using-wallets/ethereum/web3-integrations#node-js).
  </Tip>

  Use the `signTransaction` method on the Ethereum client to sign a transaction with an Ethereum wallet.

  ```js  theme={"system"}
  signTransaction: (input: EthereumSignTransactionInputType) => Promise<EthereumSignTransactionResponseType>
  ```

  ### Usage

  ```js  theme={"system"}
  const {signedTransaction, encoding} = await privy.walletApi.ethereum.signTransaction({
      walletId: 'insert-wallet-id',
      transaction: {
          to: '0xE3070d3e4309afA3bC9a6b057685743CF42da77C',
          value: '0x2386F26FC10000',
          chainId: 8453,
      },
  });
  ```

  ### Parameters

  <ParamField path="walletId" type="string" required>
    The ID of the wallet to sign the transaction with.
  </ParamField>

  <ParamField path="transaction" type="EthereumTransactionType" required>
    The transaction to sign.
  </ParamField>

  ### Returns

  <ResponseField name="signedTransaction" type="string">
    The signed transaction.
  </ResponseField>

  <ResponseField name="encoding" type="'rlp'">
    The encoding format for the returned `signedTransaction`. Currently, only `'rlp'` is supported for Ethereum.
  </ResponseField>
</View>

<View title="Java" icon="java">
  To sign a transaction from your wallet, use the `signTransaction` method.
  It will sign your transaction, and return the signed transaction to you.

  ### Usage

  ```java  theme={"system"}
  try {
      EthereumSignTransactionRpcInputTransaction txn = EthereumSignTransactionRpcInputTransaction.builder()
          .to(recipientAddress)
          .value(EthereumSignTransactionRpcInputValue.of("0x1")) // 1 wei
          .chainId(EthereumSignTransactionRpcInputChainId.of(11_155_111)) // Sepolia testnet
          .build();

      // Example: If wallet's owner is an authorization private key
      AuthorizationContext authorizationContext = AuthorizationContext.builder()
          .addAuthorizationPrivateKey("authorization-key")
          .build();

      EthereumSignTransactionRpcResponseData response = privyClient
          .wallets()
          .ethereum()
          .signTransaction(
              walletId,
              txn,
              authorizationContext
      );

      String signedTransaction = response.signedTransaction();
  } catch (APIException e) {
      String errorBody = e.bodyAsString();
      System.err.println(errorBody);
  } catch (Exception e) {
      System.err.println(e.getMessage());
  }
  ```

  ### Parameters

  When defining a transaction, you may specify the following values on the `EthereumSignTransactionRpcInputTransaction` builder:

  <ParamField type="String" body="from">
    The address sending the transaction (the user's wallet address).
  </ParamField>

  <ParamField type="String" body="to">
    The address to send the transaction to.
  </ParamField>

  <ParamField type="EthereumSignTransactionRpcInputChainId" body="chainId">
    The ID of the chain the transaction is being sent on.
  </ParamField>

  <ParamField type="EthereumSignTransactionRpcInputNonce" body="nonce">
    The nonce for the transaction.
  </ParamField>

  <ParamField type="String" body="data">
    The data to include with the transaction, as a hexadecimal string.
  </ParamField>

  <ParamField type="EthereumSignTransactionRpcInputValue" body="value">
    The amount of wei to send, as an integer or hexadecimal string.
  </ParamField>

  <ParamField type="Object" body="type">
    The type of transaction to send.
  </ParamField>

  <ParamField type="EthereumSignTransactionRpcInputGasLimit" body="gasLimit">
    The gas limit for the transaction, as a hexadecimal string.
  </ParamField>

  <ParamField type="EthereumSignTransactionRpcInputGasPrice" body="gasPrice">
    The gas price for the transaction, as a hexadecimal string.
  </ParamField>

  <ParamField type="EthereumSignTransactionRpcInputMaxFeePerGas" body="maxFeePerGas">
    The maximum fee per gas for the transaction, as a hexadecimal string.
  </ParamField>

  <ParamField type="EthereumSignTransactionRpcInputMaxPriorityFeePerGas" body="maxPriorityFeePerGas">
    The maximum priority fee per gas for the transaction, as a hexadecimal string.
  </ParamField>

  ### Returns

  The `EthereumSignTransactionRpcResponseData` object contains a `signedTransaction()` field

  <ResponseField name="signedTransaction()" type="String">
    The signed transaction.
  </ResponseField>
</View>

<View title="Rust" icon="rust">
  <Tip>
    Privy is fully compatible with popular libraries for interfacing wallets, including [`alloy`](https://crates.io/crates/alloy), learn more [here](/wallets/using-wallets/ethereum/web3-integrations#rust).
  </Tip>

  Use the `sign_transaction` method on the Ethereum service to sign a transaction with an Ethereum wallet.

  ### Usage

  ```rust  theme={"system"}
  use privy_rs::{AuthorizationContext, PrivyClient};

  let client = PrivyClient::new("app_id".to_string(), "app_secret".to_string())?;
  let ethereum_service = client.wallets().ethereum();
  let auth_ctx = AuthorizationContext::new();

  let transaction = EthereumSignTransactionRpcInputParamsTransaction {
      to: Some("0x742d35Cc6635C0532925a3b8c17d6d1E9C2F7ca".to_string()),
      value: None,
      gas_limit: None,
      gas_price: None,
      nonce: None,
      chain_id: None,
      data: None,
      from: None,
      max_fee_per_gas: None,
      max_priority_fee_per_gas: None,
      type_: None,
  };

  let signed_tx = ethereum_service
      .sign_transaction(&wallet_id, transaction, &auth_ctx, None)
      .await?;

  println!("Transaction signed successfully");
  ```

  ### Parameters and Returns

  See the Rust SDK documentation for detailed parameter and return types, including embedded examples:

  * [EthereumService::sign\_transaction](https://docs.rs/privy-rs/latest/privy_rs/ethereum/struct.EthereumService.html#method.sign_transaction)

  For REST API details, see the [API reference](/api-reference/wallets/ethereum/eth-sign-transaction).
</View>

<View title="Go" icon="golang">
  Use the `SignTransaction` method on the Ethereum service to sign a transaction with an Ethereum wallet.

  ### Usage

  ```go  theme={"system"}
  response, err := client.Wallets.Ethereum.SignTransaction(
      context.Background(),
      "wallet-id",
      privy.EthereumSignTransactionRpcInputParams{
          Transaction: privy.EthereumSignTransactionRpcInputParamsTransaction{
              To:    privy.String("0xE3070d3e4309afA3bC9a6b057685743CF42da77C"),
              Value: privy.EthereumSignTransactionRpcInputParamsTransactionValueUnion{
                  OfString: privy.String("0x2386F26FC10000"),
              },
              ChainID: privy.EthereumSignTransactionRpcInputParamsTransactionChainIDUnion{
                  OfInt: privy.Int(11155111), // Sepolia
              },
          },
      },
  )
  if err != nil {
      log.Fatalf("failed to sign transaction: %v", err)
  }

  fmt.Println("Signed transaction:", response.SignedTransaction)
  ```

  ### Parameters and Returns

  See the [API reference](/api-reference/wallets/ethereum/eth-sign-transaction) for more details.
</View>

<View title="REST API" icon="terminal">
  To sign a transaction make a `POST` request to

  ```bash  theme={"system"}
  https://api.privy.io/v1/wallets/<wallet_id>/rpc
  ```

  ### Usage

  ```bash  theme={"system"}
  $ curl --request POST https://api.privy.io/v1/wallets/<wallet_id>/rpc \
  -u "<your-privy-app-id>:<your-privy-app-secret>" \
  -H "privy-app-id: <your-privy-app-id>" \
  -H "privy-authorization-signature: <authorization-signature-for-request>" \
  -H 'Content-Type: application/json' \
  -d '{
      "method": "eth_signTransaction",
      "params": {
          "transaction": {
            "to": "0xE3070d3e4309afA3bC9a6b057685743CF42da77C",
            "value": "0x2386F26FC10000",
            "chain_id": 1,
            "type": 2,
            "gas_limit": "0x5208",
            "nonce": 1,
            "max_fee_per_gas": "0x14bf7dadac",
            "max_priority_fee_per_gas": "0xf4240"
          }
      }
  }'
  ```

  A successful response will look like the following:

  ```json  theme={"system"}
  {
    "method": "eth_signTransaction",
    "data": {
      "signed_transaction": "0x28eac519bf4051a624d4246a5788667baf84dcd7d2a439b314b339013b5cdb4c",
      "encoding": "rlp"
    }
  }
  ```

  ### Parameters

  <ParamField path="method" type="'eth_signTransaction'" required>
    The RPC method executed with the wallet.
  </ParamField>

  <ParamField path="params" type="Object" required>
    <ParamField path="transaction" type="EthereumTransactionType" required>
      The details of the transaction to send on the chain.
    </ParamField>
  </ParamField>

  ### Returns

  <ResponseField name="method" type="'eth_signTransaction'">
    The RPC method executed with the wallet.
  </ResponseField>

  <ResponseField name="data.signed_transaction" type="string">
    The signed transaction.
  </ResponseField>

  <ResponseField name="data.encoding" type="'rlp'">
    The encoding format for the signed transaction. Currently, only `'rlp'` is supported for Ethereum.
  </ResponseField>
</View>
\n