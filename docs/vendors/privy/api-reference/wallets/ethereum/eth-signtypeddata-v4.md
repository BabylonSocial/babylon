> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# eth_signTypedData_v4

> Sign a message using the eth_signTypedData_v4 method.

### SDK methods

Learn more about signing typed data using our SDKs [here](/wallets/using-wallets/ethereum/sign-typed-data).

<RequestExample>
  ```sh cURL theme={"system"}
  curl --request POST \
    --url https://api.privy.io/v1/wallets/{wallet_id}/rpc \
    --header 'Authorization: Basic <encoded-value>' \
    --header 'Content-Type: application/json' \
    --header 'privy-app-id: <privy-app-id>' \
    --data '{
    "method": "eth_signTypedData_v4",
    "params": {
      "typed_data": {
        "types": {
          "EIP712Domain": [
            { "name": "name", "type": "string" },
            { "name": "version", "type": "string" },
            { "name": "chainId", "type": "uint160" },
            { "name": "verifyingContract", "type": "address" }
          ],
          "Person": [
            { "name": "name", "type": "string" },
            { "name": "wallet", "type": "address" }
          ],
          "Mail": [
            { "name": "from", "type": "Person" },
            { "name": "to", "type": "Person" },
            { "name": "contents", "type": "string" }
          ]
        },
        "message": {
          "from": {
            "name": "Alice",
            "wallet": "0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826"
          },
          "to": {
            "name": "Bob",
            "wallet": "0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB"
          },
          "contents": "Hello, Bob!"
        },
        "primary_type": "Mail",
        "domain": {
          "name": "DApp Mail",
          "version": "1",
          "chainId": "0x3e8",
          "verifyingContract": "0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC"
        }
      }
    }
  }'
  ```
</RequestExample>

<ResponseExample>
  ```json 200 theme={"system"}
  {
    "method": "eth_signTypedData_v4",
    "data": {
      "signature": "0x1754782aea15e96189c3a85a7b7ac2f6339f6f4f3b29b1d3200a4c9907ef53e4776a84387583896b0a074cbc6de1a1c2a1eb53aba199da6ada8c99b0266171c41b",
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

<ParamField body="method" type="string" defaultValue="eth_signTypedData_v4" required>
  Available options: `eth_signTypedData_v4`
</ParamField>

<ParamField body="params" type="object" required>
  <Expandable title="child attributes" defaultOpen="true">
    <ParamField body="typed_data" type="object" required>
      <Expandable title="child attributes" defaultOpen="true">
        <ParamField body="domain" type="object" required />

        <ParamField body="types" type="object" required />

        <ParamField body="message" type="object" required />

        <ParamField body="primary_type" type="string" required />
      </Expandable>
    </ParamField>
  </Expandable>
</ParamField>

### Response

<ResponseField name="method" type="enum<string>" required>
  Available options: `eth_signTypedData_v4`
</ResponseField>

<ResponseField name="data" type="object" required>
  <Expandable title="child attributes" defaultOpen="true">
    <ResponseField name="signature" type="string" required />

    <ResponseField name="encoding" type="enum<string>">
      Available options: `utf-8`, `hex`
    </ResponseField>
  </Expandable>
</ResponseField>
\n