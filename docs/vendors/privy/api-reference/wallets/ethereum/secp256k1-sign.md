> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# secp256k1_sign

> Sign a hash using the secp256k1 method.

### SDK methods

Learn more about signing raw hashes using our SDKs [here](/wallets/using-wallets/ethereum/sign-a-raw-hash).

<RequestExample>
  ```sh cURL theme={"system"}
  curl --request POST \
    --url https://api.privy.io/v1/wallets/{wallet_id}/rpc \
    --header 'Authorization: Basic <encoded-value>' \
    --header 'Content-Type: application/json' \
    --header 'privy-app-id: <privy-app-id>' \
    --data '{
    "method": "secp256k1_sign",
    "params": {
      "hash": "0x12345678",
    }
  }'
  ```
</RequestExample>

<ResponseExample>
  ```json 200 theme={"system"}
  {
    "method": "secp256k1_sign",
    "data": {
      "signature": "0x0db9c7bd881045cbba28c347de6cc32a653e15d7f6f2f1cec21d645f402a64196e877eb45d3041f8d2ab1a76f57f408b63894cfc6f339d8f584bd26efceae3081c",
      "encoding": "hex"
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

<ParamField body="method" type="string" defaultValue="secp256k1_sign" required>
  Available options: `secp256k1_sign`
</ParamField>

<ParamField body="params" type="object" required>
  <Expandable title="child properties" defaultOpen="true">
    <ParamField body="hash" type="string" />
  </Expandable>
</ParamField>

### Response

<ResponseField name="method" type="enum<string>" required>
  Available options: `secp256k1_sign`
</ResponseField>

<ResponseField name="data" type="object" required>
  <Expandable title="child properties" defaultOpen="true">
    <ResponseField name="signature" type="string" required />

    <ResponseField name="encoding" type="enum<string>">
      Available options: `hex`
    </ResponseField>
  </Expandable>
</ResponseField>
\n