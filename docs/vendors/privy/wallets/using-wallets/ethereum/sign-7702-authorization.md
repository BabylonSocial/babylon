> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Sign EIP-7702 authorization

[EIP-7702](https://eips.ethereum.org/EIPS/eip-7702) enables externally owned accounts (EOAs) to delegate their execution to smart contract code. This allows EOA wallets to gain account abstraction capabilities such as transaction bundling, gas sponsorship, and custom permissions.

Privy provides methods to sign EIP-7702 authorizations, which allows your embedded wallets to be upgraded into any smart contract. Learn more about [EIP-7702](/recipes/react/eip-7702) and how to use it with various account abstraction providers.

<Info>EIP-7702 authorization signing is supported in the React SDK, REST API, and Node SDK.</Info>

<Info>
  When using Privy's server-side SDKs to sign EIP-7702 authorizations, you can use the authorization
  context to automatically sign requests. Learn more about [signing on the
  server](/controls/authorization-keys/using-owners/sign/signing-on-the-server).
</Info>

<View title="React" icon="react">
  Use the `useSign7702Authorization` hook to sign an EIP-7702 authorization with your user's wallet.

  ```tsx  theme={"system"}
  import {useSign7702Authorization} from '@privy-io/react-auth';

  const {signAuthorization} = useSign7702Authorization();
  ```

  ### Usage

  ```tsx  theme={"system"}
  import {useSign7702Authorization, useWallets} from '@privy-io/react-auth';

  function Sign7702Button() {
      const {signAuthorization} = useSign7702Authorization();
      const {wallets} = useWallets();

      const handleSign = async () => {
          try {
              const authorization = await signAuthorization({
                  contractAddress: '0x1234567890abcdef1234567890abcdef12345678',
                  chainId: 1, // Ethereum mainnet
                  nonce: 0 // Optional, defaults to current nonce
              }, {
                  address: wallets[0].address // Optional: Specify the wallet to use for signing. If not provided, the first wallet will be used.
              });

              console.log('Signed authorization:', authorization);
              // Use the authorization with your AA provider
          } catch (error) {
              console.error('Failed to sign authorization:', error);
          }
      };

      return (
          <button onClick={handleSign}>
              Sign EIP-7702 Authorization
          </button>
      );
  }
  ```

  ### Parameters

  <ParamField path="contractAddress" type="string" required>
    The address of the smart contract whose code the EOA will delegate to. This is typically an account implementation contract from your AA provider.
  </ParamField>

  <ParamField path="chainId" type="number" required>
    The chain ID where the authorization will be used.
  </ParamField>

  <ParamField path="nonce" type="number">
    The nonce for the authorization. If not provided, the current transaction count for the wallet will be used.
  </ParamField>

  <ParamField path="options.address" type="string">
    The address of the wallet to use for signing the authorization. **Recommended when working with external wallets** to ensure reliable functionality. If not provided, the first wallet will be used.
  </ParamField>

  ### Returns

  <ResponseField name="authorization" type="Authorization">
    The signed EIP-7702 authorization object containing:

    <Expandable title="properties">
      <ResponseField name="contractAddress" type="string">
        The smart contract address the EOA is delegating to.
      </ResponseField>

      <ResponseField name="chainId" type="number">
        The chain ID for the authorization.
      </ResponseField>

      <ResponseField name="nonce" type="number">
        The nonce used in the authorization.
      </ResponseField>

      <ResponseField name="r" type="string">
        The r value of the ECDSA signature.
      </ResponseField>

      <ResponseField name="s" type="string">
        The s value of the ECDSA signature.
      </ResponseField>

      <ResponseField name="yParity" type="number">
        The yParity value of the ECDSA signature.
      </ResponseField>
    </Expandable>
  </ResponseField>
</View>

<View title="React Native" icon="react">
  Sign an EIP-7702 authorization using viem and the `@privy-io/expo` SDK.

  ### Usage

  ```ts  theme={"system"}
  import {useEmbeddedEthereumWallet} from '@privy-io/expo';
  import {createWalletClient, custom} from 'viem;
  import {hashAuthorization} from 'viem/utils';
  import {mainnet} from 'viem/chains';

  const {wallets} = useEmbeddedEthereumWallet();
  const wallet = wallets[0]
  const provider = await wallet.getProvider()

  const client = createWalletClient({
    account: wallet.address as `0x${string}`,
    chain: mainnet,
    transport: custom(provider) // or another provider
  });

  const authorizationPayload = await walletClient.prepareAuthorization({
    account: selectedWallet.address as `0x${string}`,
    contract: '0x1234567890abcdef1234567890abcdef12345678',
    chainId: 1,
  });

  const hashedAuthorization = hashAuthorization(authorizationPayload);

  const authorization = provider.request({
    method: 'secp256k1_sign',
    params: [hashedAuthorization]
  });
  ```

  ### Parameters and Returns

  Check out the [sign raw hash doc](/wallets/using-wallets/ethereum/sign-a-raw-hash#react-native) for more details.
</View>

<View title="REST API" icon="terminal">
  Sign an EIP-7702 authorization by making a `POST` request to:

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
      "method": "eth_sign7702Authorization",
      "params": {
          "contract": "0x1234567890abcdef1234567890abcdef12345678",
          "chain_id": 1,
          "nonce": 0
      }
  }'
  ```

  A successful response will look like:

  ```json  theme={"system"}
  {
    "method": "eth_sign7702Authorization",
    "data": {
      "authorization": {
        "address": "0x1234567890abcdef1234567890abcdef12345678",
        "chain_id": 1,
        "nonce": 0,
        "r": "0x...",
        "s": "0x...",
        "y_parity": "0"
      }
    }
  }
  ```

  ### Parameters

  <ParamField path="method" type="'eth_sign7702Authorization'" required>
    The RPC method to execute.
  </ParamField>

  <ParamField path="params" type="Object" required>
    <ParamField path="contract" type="string" required>
      The address of the smart contract whose code the EOA will delegate to.
    </ParamField>

    <ParamField path="chain_id" type="number" required>
      The chain ID where the authorization will be used.
    </ParamField>

    <ParamField path="nonce" type="number">
      The nonce for the authorization. If not provided, the current transaction count will be used.
    </ParamField>
  </ParamField>

  ### Returns

  <ResponseField name="method" type="'eth_sign7702Authorization'">
    The RPC method that was executed.
  </ResponseField>

  <ResponseField name="data.authorization" type="Object">
    The signed EIP-7702 authorization containing:

    <Expandable title="properties">
      <ResponseField name="contract" type="Hex">
        The smart contract address the EOA is delegating to.
      </ResponseField>

      <ResponseField name="chain_id" type="number">
        The chain ID for the authorization.
      </ResponseField>

      <ResponseField name="nonce" type="number">
        The nonce used in the authorization.
      </ResponseField>

      <ResponseField name="r" type="Hex">
        The r value of the ECDSA signature.
      </ResponseField>

      <ResponseField name="s" type="Hex">
        The s value of the ECDSA signature.
      </ResponseField>

      <ResponseField name="y_parity" type="number">
        The yParity value of the ECDSA signature.
      </ResponseField>
    </Expandable>
  </ResponseField>
</View>

<View title="NodeJS" icon="node-js">
  Use the `sign7702Authorization` method on the Ethereum interface to sign an EIP-7702 authorization with an Ethereum wallet.

  ### Usage

  ```tsx  theme={"system"}
  const authorization = await privy.wallets().ethereum().sign7702Authorization('insert-wallet-id', {
    params: {
      contract: '0x1234567890abcdef1234567890abcdef12345678',
      chainId: 1,
      nonce: 0 // Optional
    }
  });
  ```

  ### Parameters and Returns

  Check out the [API reference](/api-reference/wallets/ethereum/eth-sign-7702-authorization) for more details.
</View>

<View title="NodeJS (server-auth)" icon="node-js">
  <Warning>
    The `@privy-io/server-auth` library is deprecated. We recommend integrating `@privy-io/node` for
    the latest features and support.
  </Warning>

  Use the `sign7702Authorization` method on the Ethereum client to sign an EIP-7702 authorization with an Ethereum wallet.

  ```javascript  theme={"system"}
  sign7702Authorization: async ({walletId: string, contract: string, chainId: number, nonce?: number, idempotencyKey?: string}) => Promise<{chainId, contract, nonce, yParity, r, s}>
  ```

  ### Usage

  ```tsx  theme={"system"}
  const authorization = await privy.walletApi.ethereum.sign7702Authorization({
      walletId: 'insert-wallet-id',
      contract: '0x1234567890abcdef1234567890abcdef12345678',
      chainId: 1,
      nonce: 0 // Optional
  });
  ```

  ### Parameters

  <ParamField path="walletId" type="string" required>
    Unique ID of the wallet to take actions with.
  </ParamField>

  <ParamField path="contract" type="Hex" required>
    The address of the smart contract whose code the EOA will delegate to.
  </ParamField>

  <ParamField path="chainId" type="number" required>
    The chain ID where the authorization will be used.
  </ParamField>

  <ParamField path="nonce" type="number">
    The nonce for the authorization. If not provided, the current transaction count will be used.
  </ParamField>

  <ParamField path="idempotencyKey" type="string">
    [Idempotency key](/api-reference/idempotency-keys) to identify a unique request.
  </ParamField>

  ### Returns

  <ResponseField name="chainId" type="number">
    The chain ID for the authorization.
  </ResponseField>

  <ResponseField name="contract" type="Hex">
    The smart contract address the EOA is delegating to.
  </ResponseField>

  <ResponseField name="nonce" type="number">
    The nonce used in the authorization.
  </ResponseField>

  <ResponseField name="yParity" type="number">
    The yParity value of the ECDSA signature.
  </ResponseField>

  <ResponseField name="r" type="Hex">
    The r value of the ECDSA signature.
  </ResponseField>

  <ResponseField name="s" type="Hex">
    The s value of the ECDSA signature.
  </ResponseField>
</View>

<View title="Java" icon="java">
  To sign an EIP-7702 authorization from your wallet, use the `sign7702Authorization` method.

  ### Usage

  ```java  theme={"system"}
  try {
      EthereumSign7702AuthorizationRpcInputParams authorization = EthereumSign7702AuthorizationRpcInputParams.builder()
          .contract("0x1234567890123456789012345678901234567890")
          .chainId(EthereumSign7702AuthorizationRpcInputChainId.of(1))
          .nonce(EthereumSign7702AuthorizationRpcInputNonce.of(1))
          .build();

      // Example: If wallet's owner is an authorization private key
      AuthorizationContext authorizationContext = AuthorizationContext.builder()
          .addAuthorizationPrivateKey("authorization-key")
          .build();

      EthereumSign7702AuthorizationRpcResponseData response = privyClient
          .wallets()
          .ethereum()
          .sign7702Authorization(
              walletId,
              authorization,
              authorizationContext
          );

      Authorization authorization = response.authorization();
  } catch (APIException e) {
      String errorBody = e.bodyAsString();
      System.err.println(errorBody);
  } catch (Exception e) {
      System.err.println(e.getMessage());
  }
  ```

  ### Parameters

  When defining an EIP-7702 authorization, you may specify the following values on the
  `EthereumSign7702AuthorizationRpcInputParams` builder:

  <ParamField type="String" body="contract">
    The address of the smart contract whose code the EOA will delegate to.
  </ParamField>

  <ParamField type="EthereumSign7702AuthorizationRpcInputChainId" body="chainId">
    The chain ID where the authorization will be used.
  </ParamField>

  <ParamField type="EthereumSign7702AuthorizationRpcInputNonce" body="nonce">
    The nonce for the authorization.
  </ParamField>

  ### Returns

  The `EthereumSign7702AuthorizationRpcResponseData` object contains a `authorization()` field

  <ResponseField name="authorization()" type="Authorization">
    The signed EIP-7702 authorization.

    <Expandable defaultOpen="true">
      <ResponseField name="contract" type="String">
        The smart contract address the EOA is delegating to.
      </ResponseField>

      <ResponseField name="chainId" type="EthereumSign7702AuthorizationRpcInputChainId">
        The chain ID for the authorization.
      </ResponseField>

      <ResponseField name="nonce" type="EthereumSign7702AuthorizationRpcInputNonce">
        The nonce used in the authorization.
      </ResponseField>

      <ResponseField name="r" type="String">
        The r value of the ECDSA signature.
      </ResponseField>

      <ResponseField name="s" type="String">
        The s value of the ECDSA signature.
      </ResponseField>

      <ResponseField name="yParity" type="double">
        The yParity value of the ECDSA signature.
      </ResponseField>
    </Expandable>
  </ResponseField>
</View>

<View title="Rust" icon="rust">
  Use the `sign_7702_authorization` method on the Ethereum service to sign an EIP-7702 authorization.

  ### Usage

  ```rust  theme={"system"}
  use privy_rs::{AuthorizationContext, PrivyClient};

  let client = PrivyClient::new("app_id".to_string(), "app_secret".to_string())?;
  let ethereum_service = client.wallets().ethereum();
  let auth_ctx = AuthorizationContext::new();

  let params = EthereumSign7702AuthorizationRpcInputParams {
      chain_id: EthereumSign7702AuthorizationRpcInputParamsChainId::Integer(1),
      contract: "0x1234567890abcdef1234567890abcdef12345678".to_string(),
      nonce: None,
  };

  let authorization = ethereum_service
      .sign_7702_authorization(&wallet_id, params, &auth_ctx, None)
      .await?;

  println!("7702 authorization signed successfully");
  ```

  ### Parameters and Returns

  See the Rust SDK documentation for detailed parameter and return types, including embedded examples:

  * [EthereumService::sign\_7702\_authorization](https://docs.rs/privy-rs/latest/privy_rs/ethereum/struct.EthereumService.html#method.sign_7702_authorization)

  For REST API details, see the [API reference](/api-reference/wallets/ethereum/eth-sign-7702-authorization).
</View>

<View title="Go" icon="golang">
  Use the `Sign7702Authorization` method on the Ethereum service to sign an EIP-7702 authorization with an Ethereum wallet.

  ### Usage

  ```go  theme={"system"}
  response, err := client.Wallets.Ethereum.Sign7702Authorization(
      context.Background(),
      "wallet-id",
      privy.EthereumSign7702AuthorizationRpcInputParams{
          ChainID: privy.EthereumSign7702AuthorizationRpcInputParamsChainIDUnion{
              OfString: privy.String("eip155:11155111"),
          },
          Contract: "0xcontract-address",
      },
  )
  if err != nil {
      log.Fatalf("failed to sign 7702 authorization: %v", err)
  }

  fmt.Println("Authorization:", response)
  ```

  ### Parameters and Returns

  See the [API reference](/api-reference/wallets/ethereum/eth-sign-7702-authorization) for more details.
</View>
\n