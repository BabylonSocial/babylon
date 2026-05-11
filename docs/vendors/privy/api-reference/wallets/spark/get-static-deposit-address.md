> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# getStaticDepositAddress

> Returns a static deposit address that can be used to deposit tokens from BTC into Spark.

<RequestExample>
  ```sh  theme={"system"}
  curl --request POST \
    --url https://api.privy.io/v1/wallets/{wallet_id}/rpc \
    --header 'Authorization: Basic <encoded-value>' \
    --header 'Content-Type: application/json' \
    --header 'privy-app-id: <privy-app-id>' \
    --data '{
    "method": "getStaticDepositAddress",
    "network": "MAINNET"
  }'
  ```
</RequestExample>

<ResponseExample>
  ```json 200 theme={"system"}
  {
    "method": "getStaticDepositAddress",
    "data": {
      "address": "bcrt1ppvq36yzcycqfcgcl34samllm75zkqjgdkfsqj8hkgdh9pnse5czqj0zh9r"
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

<ParamField body="method" type="string" defaultValue="getStaticDepositAddress" required>
  Available options: `getStaticDepositAddress`
</ParamField>

<ParamField body="network" type="string" required>
  Available options: `MAINNET`, `REGTEST`
</ParamField>

### Returns

<ResponseField name="method" type="enum<string>" required>
  Always `"getStaticDepositAddress"`
</ResponseField>

<ResponseField name="data" type="object" required>
  The static deposit address for the wallet.

  <Expandable title="child attributes" defaultOpen="true">
    <ResponseField name="address" type="string" required>
      A BTC address for depositing native tokens.
    </ResponseField>
  </Expandable>
</ResponseField>
\n