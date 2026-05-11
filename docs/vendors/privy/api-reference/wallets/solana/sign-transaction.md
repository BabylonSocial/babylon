> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# signTransaction

> Sign a transaction with a Solana wallet using the signTransaction method.

### SDK methods

Learn more about signing transactions using our SDKs [here](/wallets/using-wallets/solana/sign-a-transaction).

<RequestExample>
  ```sh cURL theme={"system"}
  curl --request POST \
    --url https://api.privy.io/v1/wallets/{wallet_id}/rpc \
    --header 'Authorization: Basic <encoded-value>' \
    --header 'Content-Type: application/json' \
    --header 'privy-app-id: <privy-app-id>' \
    --data '{
    "method": "signTransaction",
    "params": {
      "transaction": "AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAEDRpb0mdmKftapwzzqUtlcDnuWbw8vwlyiyuWyyieQFKESezu52HWNss0SAcb60ftz7DSpgTwUmfUSl1CYHJ91GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAScgJ7J0AXFr1azCEvB1Y5zpiF4eXR+yTW0UB7am+E/MBAgIAAQwCAAAAQEIPAAAAAAA=",
      "encoding": "base64"
    }
  }
  '
  ```
</RequestExample>

<ResponseExample>
  ```json 200 theme={"system"}
  {
    "method": "signTransaction",
    "data": {
      "signed_transaction": "AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAEDRpb0mdmKftapwzzqUtlcDnuWbw8vwlyiyuWyyieQFKESezu52HWNss0SAcb60ftz7DSpgTwUmfUSl1CYHJ91GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAScgJ7J0AXFr1azCEvB1Y5zpiF4eXR",
      "encoding": "base64"
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

<ParamField body="method" type="string" defaultValue="signTransaction" required>
  Available options: `signTransaction`
</ParamField>

<ParamField body="params" type="object" required>
  <Expandable title="child attributes" defaultOpen="true">
    <ParamField body="transaction" type="string">
      Base64 encoded serialized transaction to sign.
    </ParamField>

    <ParamField body="encoding" type="string">
      Available options: `base64`
    </ParamField>
  </Expandable>
</ParamField>

### Response

<ResponseField name="method" type="enum<string>" required>
  Available options: `signTransaction`
</ResponseField>

<ResponseField name="data" type="object" required>
  <Expandable title="child attributes" defaultOpen="true">
    <ResponseField name="signed_transaction" type="string" required />

    <ResponseField name="encoding" type="enum<string>">
      Available options: `base64`
    </ResponseField>
  </Expandable>
</ResponseField>
\n