> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# null

<Info>
  This interface is for raw signing over a hash, which primarily applies to Coinbase Smart Wallet
  integrations, EIP-7702 authorizations and other scenarios requiring basic curve-level signing. For
  most use cases, such as authenticating to a website or proving ownership, we recommend [signing a
  message](/wallets/using-wallets/ethereum/sign-a-message).
</Info>

<Info>
  When using Privy's server-side SDKs to sign raw hashes, you can use the authorization context to
  automatically sign requests. Learn more about [signing on the
  server](/controls/authorization-keys/using-owners/sign/signing-on-the-server).
</Info>

<View title="React" icon="react">
  To sign a raw hash from a wallet using the React SDK use the `request` method from the wallets EIP1193 provider:

  ```javascript  theme={"system"}
   request: (request: { method: 'secp256k1_sign', params: [hash: Hex] }) => Promise<HexString>
  ```

  ### Usage

  ```javascript  theme={"system"}
  import {useWallets} from '@privy-io/react-auth';

  const {wallets} = useWallets();
  const wallet = wallets[0];

  const provider = await wallet.getEthereumProvider();

  // Sign raw hash
  const response = await provider.request({
    method: 'secp256k1_sign',
    params: ['0xTheRawHash']
  });
  ```

  ### Parameters

  <ParamField path="request.method" type="'secp256k1_sign'" required>
    The RPC method executed with the wallet.
  </ParamField>

  <ParamField path="request.params" type="[hash: Hex]" required>
    The raw hash to sign over.
  </ParamField>

  ### Returns

  <ResponseField name="response" type="string">
    The signature produced by the wallet.
  </ResponseField>
</View>

<View title="Go" icon="golang">
  Use the `SignSecp256k1` method on the Ethereum service to sign a raw hash with an Ethereum wallet.

  ### Usage

  ```go  theme={"system"}
  hash := "0x6503b027a625549f7be691646404f275f149d17a119a6804b855bac3030037aa"

  response, err := client.Wallets.Ethereum.SignSecp256k1(
      context.Background(),
      "wallet-id",
      privy.EthereumSecp256k1SignRpcInputParams{
          Hash: hash,
      },
  )
  if err != nil {
      log.Fatalf("failed to sign hash: %v", err)
  }

  fmt.Println("Signature:", response.Signature)
  ```

  ### Parameters and Returns

  See the [API reference](/api-reference/wallets/ethereum/secp256k1-sign) for more details.
</View>

<View title="React Native" icon="react">
  Request a message signature on the wallets Ethereum provider.

  ### Usage

  ```tsx  theme={"system"}
  import {useEmbeddedEthereumWallet} from '@privy-io/expo';

  const {wallets} = useEmbeddedEthereumWallet();
  const wallet = wallets[0];

  // Get an EIP-1193 Provider
  const provider = await wallet.getProvider();

  // Sign raw hash
  const signature = await provider.request({
    method: 'secp256k1_sign',
    params: ['0xTheRawHash']
  });
  ```

  ### Parameters

  <ParamField path="request" type="Object" required>
    <Expandable title="properties" defaultOpen="true">
      <ParamField path="method" type="'secp256k1_sign'" required>
        The method for the wallet request. For signing a raw hash, this is `'secp256k1_sign'`.
      </ParamField>

      <ParamField path="params" type="[string]" required>
        The raw hash to sign over, as the first and only element of the array.
      </ParamField>
    </Expandable>
  </ParamField>

  ### Returns

  <ResponseField name="signature" type="string">
    The signature produced by the wallet.
  </ResponseField>
</View>

<View title="Swift" icon="swift">
  To sign a raw hash from a wallet using the Swift SDK use the wallet's Ethereum provider.

  ### Usage

  ```swift  theme={"system"}
  import PrivySDK

  guard let user = privy.user else {
      // If user is null, user is not authenticated
      return
  }

  // Retrieve list of user's embedded Ethereum wallets
  let ethereumWallets = user.embeddedEthereumWallets

  // Grab the desired wallet. Here, we retrieve the first wallet
  guard let wallet = ethereumWallets.first else {
      // No ETH wallets
      return
  }

  let signature = try await wallet.provider.request(.secp256k1Sign(hash: "0xTheRawHash"))

  print("Result signature: \(signature)")
  ```

  ### Parameters

  <ParamField path="request" type="Object" required>
    <Expandable title="properties" defaultOpen="true">
      <ParamField path="method" type="'secp256k1_sign'" required>
        The method for the wallet request. For signing a raw hash, this is `'secp256k1_sign'`.
      </ParamField>

      <ParamField path="params" type="[string]" required>
        The raw hash to sign over, as the first and only element of the array.
      </ParamField>
    </Expandable>
  </ParamField>

  ### Returns

  <ResponseField name="signature" type="string">
    The signature produced by the wallet.
  </ResponseField>
</View>

<View title="Android" icon="android">
  To sign a raw hash from a wallet using the Android SDK use the wallet's Ethereum provider.

  ### Usage

  ```kotlin  theme={"system"}
  // Get Privy user
  val user = privy.getUser()

  // Check if user is authenticated
  if (user != null) {
      // Retrieve list of user's embedded Ethereum wallets
      val ethereumWallets = user.embeddedEthereumWallets

      if (ethereumWallets.isNotEmpty()) {
          // Grab the desired wallet. Here, we retrieve the first wallet
          val ethereumWallet = ethereumWallets.first()

          // Sign raw hash
          val result = ethereumWallet.provider.request(
              request = EthereumRpcRequest.secp256k1Sign("0xTheRawHash")
          )

          when (result) {
              is Result.Success -> {
                  val signature = result.data.data
                  println("Signature: $signature")
              }
              is Result.Failure -> {
                  // Handle error
              }
          }
      }
  }
  ```

  ### Parameters

  <ParamField path="request" type="Object" required>
    <Expandable title="properties" defaultOpen="true">
      <ParamField path="method" type="'secp256k1_sign'" required>
        The method for the wallet request. For signing a raw hash, this is `'secp256k1_sign'`.
      </ParamField>

      <ParamField path="params" type="[string]" required>
        The raw hash to sign over, as the first and only element of the array.
      </ParamField>
    </Expandable>
  </ParamField>

  ### Returns

  <ResponseField name="result" type="Result<EthereumRpcResponse>">
    A Result that, when successful, contains the EthereumRpcResponse with:

    <Expandable title="child attributes" defaultOpen="true">
      <ResponseField name="method" type="string">
        The RPC method that was executed (secp256k1\_sign).
      </ResponseField>

      <ResponseField name="data" type="string">
        The signature produced by the wallet.
      </ResponseField>
    </Expandable>
  </ResponseField>
</View>

<View title="Unity" icon="unity">
  ### Usage

  ```csharp  theme={"system"}
  var privyUser = await PrivyManager.Instance.GetUser();
  if (privyUser == null)
  {
      // If user is null, user is not authenticated
      return;
  }

  // Grab the desired wallet. Here, we retrieve the first wallet
  var wallet = privyUser.EmbeddedWallets[0];
  if (wallet == null)
  {
      // User has no ETH wallets
      return;
  }

  try
  {
      var rpcRequest = new RpcRequest
      {
          Method = "secp256k1_sign",
          Params = new string[] { "0xTheRawHash" }
      };
      var rpcResponse = await wallet.RpcProvider.Request(rpcRequest);
      var signature = rpcResponse.Data;
      Debug.Log(signature);
  }
  catch (PrivyException.EmbeddedWalletException ex)
  {
      Debug.LogError($"Could not sign message due to error: {ex.Error} {ex.Message}");
  }
  catch (Exception ex)
  {
      Debug.LogError($"Could not sign hash exception {ex.Message}");
  }
  ```

  ### Parameters

  <ParamField path="method" type="'secp256k1_sign'" required>
    The method for the wallet request. For signing a raw hash, this is `'secp256k1_sign'`.
  </ParamField>

  <ParamField path="params" type="Object" required>
    <Expandable title="properties" defaultOpen="true">
      <ParamField path="hash" type="string" required>
        The hash to sign with the wallet. Must start with '0x'.
      </ParamField>
    </Expandable>
  </ParamField>

  ### Returns

  <ResponseField name="signature" type="string">
    The signature produced by the wallet.
  </ResponseField>
</View>

<View title="Flutter" icon="flutter">
  To sign a raw hash from a wallet using the Flutter SDK use the wallet's Ethereum provider.

  ### Usage

  ```dart  theme={"system"}
  // Get the Privy User
  final user = await privy.getUser();
  // Get an EIP-1193 Provider
  final ethereumWallet = user.embeddedEthereumWallets.first;
  final provider = ethereumWallet.provider;

  // Sign raw hash
  final request = EthereumRpcRequest(
    method: 'secp256k1_sign',
    params: ['0xTheRawHash'],
  );

  final result = await provider.request(request);

  result.fold(
    onSuccess: (response) {
      final signature = response.data;
      print('Signature: $signature');
    },
    onFailure: (error) {
      print('Error signing hash: ${error.message}');
    },
  );
  ```

  ### Parameters

  <ParamField path="request" type="Object" required>
    <Expandable title="properties" defaultOpen="true">
      <ParamField path="method" type="'secp256k1_sign'" required>
        The method for the wallet request. For signing a raw hash, this is `'secp256k1_sign'`.
      </ParamField>

      <ParamField path="params" type="[string]" required>
        The raw hash to sign over, as the first and only element of the array.
      </ParamField>
    </Expandable>
  </ParamField>

  ### Returns

  <ResponseField name="result" type="Result<EthereumRpcResponse>">
    A Result that, when successful, contains the EthereumRpcResponse with:

    <Expandable title="child attributes" defaultOpen="true">
      <ResponseField name="method" type="string">
        The RPC method that was executed (secp256k1\_sign).
      </ResponseField>

      <ResponseField name="data" type="string">
        The signature produced by the wallet.
      </ResponseField>
    </Expandable>
  </ResponseField>
</View>

<View title="NodeJS" icon="node-js">
  Use the `secp256k1Sign` method on the Ethereum interface to sign a raw hash along the secp256k1 curve.

  ### Usage

  ```tsx  theme={"system"}
  const {signature, encoding} = await privy
    .wallets()
    .ethereum()
    .secp256k1Sign('insert-wallet-id', {
      params: {
        hash: '0x6503b027a625549f7be691646404f275f149d17a119a6804b855bac3030037aa'
      }
    });
  ```

  ### Parameters and Returns

  Check out the [API reference](/api-reference/wallets/ethereum/secp256k1-sign) for more details.
</View>

<View title="NodeJS (server-auth)" icon="node-js">
  <Warning>
    The `@privy-io/server-auth` library is deprecated. We recommend integrating `@privy-io/node` for
    the latest features and support.
  </Warning>

  Use the `secp256k1Sign` method on the Ethereum client to sign a raw hash along the secp256k1 curve.

  ```javascript  theme={"system"}
  secp256k1Sign: async ({walletId: string, hash: string}) => Promise<{signature: string, encoding: 'hex'}>
  ```

  ### Usage

  ```tsx  theme={"system"}
  const {signature, encoding} = await privy.walletApi.ethereum.secp256k1Sign({
    walletId: 'insert-wallet-id',
    hash: '0x6503b027a625549f7be691646404f275f149d17a119a6804b855bac3030037aa'
  });
  ```

  ### Parameters

  <ParamField path="walletId" type="string" required>
    Unique ID of the wallet to take actions with.
  </ParamField>

  <ParamField path="hash" type="hash" required>
    The hash to sign. Must start with '0x'.
  </ParamField>

  ### Returns

  <ResponseField name="signature" type="string">
    An encoded string serializing the signature produced by the user's wallet.
  </ResponseField>

  <ResponseField name="encoding" type="'hex'">
    The encoding format for the returned `signature`. Currently, only `'hex'` is supported for
    Ethereum.
  </ResponseField>
</View>

<View title="Java" icon="java">
  To sign a raw hash from your wallet, use the `signSecp256k1` method.
  It will sign your hash, and return the signature to you.

  ### Usage

  ```java  theme={"system"}
  try {
      String hash = "0x6503b027a625549f7be691646404f275f149d17a119a6804b855bac3030037aa";

      // Example: If wallet's owner is an authorization private key
      AuthorizationContext authorizationContext = AuthorizationContext.builder()
          .addAuthorizationPrivateKey("authorization-key")
          .build();

      EthereumSecp256k1SignRpcResponseData response = privyClient
          .wallets()
          .ethereum()
          .signSecp256k1(
              walletId,
              hash,
              authorizationContext
          );

      String signature = response.signature();
  } catch (APIException e) {
      String errorBody = e.bodyAsString();
      System.err.println(errorBody);
  } catch (Exception e) {
      System.err.println(e.getMessage());
  }
  ```

  ### Parameters

  <ParamField type="String" body="hash">
    The hash to sign. Must start with '0x'.
  </ParamField>

  ### Returns

  The `EthereumSecp256k1SignRpcResponseData` object contains a `signature()` field

  <ResponseField name="signature()" type="String">
    The signature produced by the wallet.
  </ResponseField>
</View>

<View title="Rust" icon="rust">
  Use the `sign_secp256k1` method on the Ethereum service to sign a raw hash with an Ethereum wallet.

  ### Usage

  ```rust  theme={"system"}
  use privy_rs::{AuthorizationContext, PrivyClient};

  let client = PrivyClient::new("app_id".to_string(), "app_secret".to_string())?;
  let ethereum_service = client.wallets().ethereum();
  let auth_ctx = AuthorizationContext::new();

  // Pre-computed keccak256 hash
  let hash = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
  let signature = ethereum_service
      .sign_secp256k1(&wallet_id, hash, &auth_ctx, None)
      .await?;

  println!("Hash signed with secp256k1");
  ```

  ### Parameters and Returns

  See the Rust SDK documentation for detailed parameter and return types, including embedded examples:

  * [EthereumService::sign\_secp256k1](https://docs.rs/privy-rs/latest/privy_rs/ethereum/struct.EthereumService.html#method.sign_secp256k1)

  For REST API details, see the [API reference](/api-reference/wallets/ethereum/secp256k1-sign).
</View>

<View title="REST API" icon="terminal">
  To sign a message make a POST request to

  ```bash  theme={"system"}
  https://api.privy.io/v1/wallets/<wallet_id>/rpc
  ```

  ### Parameters

  <ParamField path="method" type="'secp256k1_sign'" required>
    RPC method to execute with the wallet.
  </ParamField>

  <ParamField path="params" type="Object" required>
    Parameters for the RPC method to execute with the wallet.

    <Expandable title="properties" defaultOpen="true">
      <ParamField path="hash" type="string" required>
        The hash to sign with the wallet. Must start with '0x'.
      </ParamField>
    </Expandable>
  </ParamField>

  ### Returns

  <ResponseField name="method" type="'secp256k1_sign'">
    The RPC method executed with the wallet.
  </ResponseField>

  <ResponseField name="data" type="Object">
    Outputs for the RPC method executed with the wallet.

    <Expandable title="properties" defaultOpen="true">
      <ResponseField name="signature" type="string">
        An encoded string serializing the signature produced by the user's wallet.
      </ResponseField>

      <ResponseField name="encoding" type="'hex'">
        The encoding format for the returned `signature`. Currently, only `'hex'` is supported for Ethereum.
      </ResponseField>
    </Expandable>
  </ResponseField>

  ### Usage

  ```bash  theme={"system"}
  $ curl --request POST https://api.privy.io/v1/wallets/<wallet_id>/rpc \
  -u "<your-privy-app-id>:<your-privy-app-secret>" \
  -H "privy-app-id: <your-privy-app-id>" \
  -H "privy-authorization-signature: <authorization-signature-for-request>" \
  -H 'Content-Type: application/json' \
  -d '{
    "chain_type": "ethereum",
    "method": "secp256k1_sign",
    "params": {
      "hash": "0x6503b027a625549f7be691646404f275f149d17a119a6804b855bac3030037aa",
      "encoding": "hex"
    }
  }'
  ```
</View>
\n