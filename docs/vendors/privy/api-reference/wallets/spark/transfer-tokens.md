> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# transferTokens

> Transfer a specified amount of Spark tokens to another Spark address.

<RequestExample>
  ```sh  theme={"system"}
  curl --request POST \
    --url https://api.privy.io/v1/wallets/{wallet_id}/rpc \
    --header 'Authorization: Basic <encoded-value>' \
    --header 'Content-Type: application/json' \
    --header 'privy-app-id: <privy-app-id>' \
    --data '{
    "method": "transferTokens",
    "network": "MAINNET",
    "params": {
      "token_identifier": "btknrt1x9helfvakyz8y53lzwt2wjen7d30ft6skpu69eydvndqt5uxsr4q0zvugn",
      "token_amount": 10,
      "receiver_spark_address": "spark1pgss8z35rpycv4duqdk5u3sclhjnztjunv5yajlwk69tyv5fsvwwe9mgwmxfkx"
    }
  }'
  ```
</RequestExample>

<ResponseExample>
  ```json 200 theme={"system"}
  {
    "method": "transferTokens",
    "data": {
      "id": "22c469d0a956b188f7dc058e43515a2c4e675d75edc302b75805d9c5dccaeb6b",
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

<ParamField body="method" type="string" defaultValue="transferTokens" required>
  Available options: `transferTokens`
</ParamField>

<ParamField body="network" type="string" required>
  Available options: `MAINNET`, `REGTEST`
</ParamField>

<ParamField body="params" type="object" required>
  Parameters for the token transfer.

  <Expandable title="child attributes" defaultOpen="true">
    <ParamField body="token_identifier" type="string" required>
      Spark token address (starts with `btkn`).
    </ParamField>

    <ParamField body="token_amount" type="number" required>
      Number of tokens to send
    </ParamField>

    <ParamField body="receiver_spark_address" type="string" required>
      Spark address to send the tokens to.
    </ParamField>
  </Expandable>
</ParamField>

### Returns

<ResponseField name="method" type="enum<string>" required>
  Always `"transferTokens"`
</ResponseField>

<ResponseField name="data" type="object" required>
  The result of the token transfer.

  <Expandable title="child attributes" defaultOpen="true">
    <ResponseField name="id" type="string" required>
      Transaction hash of the token transfer.
    </ResponseField>
  </Expandable>
</ResponseField>

```
```
\n