> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# eth_sign7702Authorization

> Signs an EIP-7702 authorization struct using the wallet's private key.

### SDK methods

Learn more about signing EIP-7702 authorizations using our SDKs [here](/wallets/using-wallets/ethereum/sign-7702-authorization).

<RequestExample>
  ```sh cURL theme={"system"}
  curl --request POST \
    --url https://api.privy.io/v1/wallets/{wallet_id}/rpc \
    --header 'Authorization: Basic <encoded-value>' \
    --header 'Content-Type: application/json' \
    --header 'privy-app-id: <privy-app-id>' \
    --data '{
      "method": "eth_sign7702Authorization",
      "params": {
        "contract": "0x1234567890abcdef1234567890abcdef12345678",
        "chain_id": 1,
        "nonce": 0
      }
  }'
  ```
</RequestExample>

<ResponseExample>
  ```json 200 theme={"system"}
  {
    "method": "eth_sign7702Authorization",
    "data": {
      "authorization": {
        "contract": "0x1234567890abcdef1234567890abcdef12345678",
        "chain_id": 1,
        "nonce": 0,
        "r": "0x0db9c7bd881045cbba28c347de6cc32a653e15d7f6f2f1cec21d645f402a6419",
        "s": "0x6e877eb45d3041f8d2ab1a76f57f408b63894cfc6f339d8f584bd26efceae308",
        "y_parity": 1
      }
    }
  }
  ```
</ResponseExample>

### Headers

<ParamField header="privy-app-id" type="string" required>
  ID of your Privy app.
</ParamField>

<ParamField header="privy-authorization-signature" type="string">
  Request authorization signature. If multiple signatures are required, they should be comma
  separated.
</ParamField>

### Path Parameters

<ParamField path="wallet_id" type="string" required>
  ID of the wallet to get.
</ParamField>

### Body

<ParamField body="method" type="string" defaultValue="eth_sign7702Authorization" required>
  The RPC method to execute. Must be `eth_sign7702Authorization`.
</ParamField>

<ParamField body="params" type="object" required>
  The parameters for signing the EIP-7702 authorization.

  <Expandable title="child properties" defaultOpen="true">
    <ParamField body="contract" type="string" required>
      The address of the smart contract that the EOA will delegate to. Must be a valid Ethereum
      address in hex format.
    </ParamField>

    <ParamField body="chain_id" type="number" required>
      The chain ID where this authorization will be valid.
    </ParamField>

    <ParamField body="nonce" type="number">
      The nonce for the authorization. If not provided, we will fetch the current nonce for the
      wallet.
    </ParamField>
  </Expandable>
</ParamField>

### Response

<ResponseField name="method" type="string" required>
  The RPC method that was executed. Will be `eth_sign7702Authorization`.
</ResponseField>

<ResponseField name="data" type="object" required>
  The response data containing the signed authorization.

  <Expandable title="child properties" defaultOpen="true">
    <ResponseField name="authorization" type="object" required>
      The signed EIP-7702 authorization object.

      <Expandable title="authorization properties">
        <ResponseField name="contract" type="string" required>
          The address of the smart contract that the EOA delegates to.
        </ResponseField>

        <ResponseField name="chain_id" type="number" required>
          The chain ID where this authorization is valid.
        </ResponseField>

        <ResponseField name="nonce" type="number" required>
          The nonce for the authorization.
        </ResponseField>

        <ResponseField name="r" type="string" required>
          The r component of the ECDSA signature.
        </ResponseField>

        <ResponseField name="s" type="string" required>
          The s component of the ECDSA signature.
        </ResponseField>

        <ResponseField name="y_parity" type="number" required>
          The recovery parameter (0 or 1) for the signature.
        </ResponseField>
      </Expandable>
    </ResponseField>
  </Expandable>
</ResponseField>
\n