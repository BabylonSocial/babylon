> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# signMessageWithIdentityKey

> Sign a message using the Spark wallet's identity key.

<RequestExample>
  ```sh curl --request POST \ theme={"system"}
    --url https://api.privy.io/v1/wallets/{wallet_id}/rpc \
    --header 'Authorization: Basic <encoded-value>' \
    --header 'Content-Type: application/json' \
    --header 'privy-app-id: <privy-app-id>' \
    --data '{
    "method": "signMessageWithIdentityKey",
    "network": "MAINNET",
    "params": {
      "message": "Hello, Spark!",
      "compact": true
    }
  }'
  ```
</RequestExample>

<ResponseExample>
  ```json 200 theme={"system"}
  {
    "method": "signMessageWithIdentityKey",
    "data": {
      "signature": "304402201a2b3c4d5e6f708192a3b4c5d6e7f8091a2b3c4d5e6f708192a3b4c5d6e7f80902201a2b3c4d5e6f708192a3b4c5d6e7f8091a2b3c4d5e6f708192a3b4c5d6e7f809"
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

<Info>
  These wallet methods are modeled after the [Spark Wallet
  SDK](https://github.com/buildonspark/spark/tree/main/sdks/js/packages/spark-sdk). For more
  information about this wallet method, check out the [Spark Wallet
  documentation](https://docs.spark.money/wallet/introduction).
</Info>

### Body

<ParamField body="method" type="string" defaultValue="signMessageWithIdentityKey" required>
  Available options: `signMessageWithIdentityKey`
</ParamField>

<ParamField body="network" type="string" required>
  Available options: `MAINNET`, `REGTEST`
</ParamField>

<ParamField body="params" type="object" required>
  <Expandable title="child attributes" defaultOpen="true">
    <ParamField body="message" type="string" required>
      The message to sign with the identity key.
    </ParamField>

    <ParamField body="compact" type="boolean">
      Whether to use compact signature format. Defaults to false.
    </ParamField>
  </Expandable>
</ParamField>

### Returns

<ResponseField name="method" type="enum<string>" required>
  Available options: `signMessageWithIdentityKey`
</ResponseField>

<ResponseField name="data" type="object" required>
  The signature response object

  <Expandable title="child attributes" defaultOpen="true">
    <ResponseField name="signature" type="string" required>
      The signature of the message from the wallet's identity key.
    </ResponseField>
  </Expandable>
</ResponseField>
\n