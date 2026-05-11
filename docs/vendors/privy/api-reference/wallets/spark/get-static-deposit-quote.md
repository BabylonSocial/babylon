> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# getClaimStaticDepositQuote

> Retrieve the quote needed to claim BTC sent to a static deposit address.

<RequestExample>
  ```sh  theme={"system"}
  curl --request POST \
    --url https://api.privy.io/v1/wallets/{wallet_id}/rpc \
    --header 'Authorization: Basic <encoded-value>' \
    --header 'Content-Type: application/json' \
    --header 'privy-app-id: <privy-app-id>' \
    --data '{
    "method": "getClaimStaticDepositQuote",
    "network": "REGTEST",
    "params": {
      "transaction_id": "448f305caf15ec10b2a8286fde6c31ebe2eb30e2018b22a8f7630d3fa2753e49"
    }
  }'
  ```
</RequestExample>

<ResponseExample>
  ```json 200 theme={"system"}
  {
    "method": "getClaimStaticDepositQuote",
    "data": {
      "credit_amount_sats": 9901,
      "signature": "304402206e61d688bc498b8cd95f798c82c6f087c71d56ef822b04bc268240dba7be8705022077609ae2349b5233455821cd8db7dc36ac9e123b62f983bd1da371034e786dfd",
      "transaction_id": "448f305caf15ec10b2a8286fde6c31ebe2eb30e2018b22a8f7630d3fa2753e49",
      "output_index": 1,
      "network": "REGTEST"
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

<ParamField body="method" type="string" defaultValue="getClaimStaticDepositQuote" required>
  Must be set to getClaimStaticDepositQuote.
</ParamField>

<ParamField body="network" type="string" required>
  Blockchain network to use. Options: `MAINNET`, `REGTEST`.
</ParamField>

<ParamField body="params" type="object" required>
  <Expandable title="child attributes" defaultOpen="true">
    <ParamField body="transaction_id" type="string" required>
      The transaction hash of the BTC sent to the static deposit address.
    </ParamField>
  </Expandable>
</ParamField>

### Returns

<ResponseField name="method" type="enum<string>" defaultValue="getClaimStaticDepositQuote" required />

<ResponseField name="data" type="object" required>
  Contains the BTC claim quote.

  <Expandable title="child attributes" defaultOpen="true">
    <ResponseField name="credit_amount_sats" type="number" required>
      The amount of sats credited to the wallet after claiming.
    </ResponseField>

    <ResponseField name="signature" type="string" required />

    <ResponseField name="transaction_id" type="string" required>
      The hash of the Bitcoin transaction containing the deposit.
    </ResponseField>

    <ResponseField name="output_index" type="number" required>
      The index of the output within the transaction that is being claimed.
    </ResponseField>

    <ResponseField name="network" type="string" required>
      The network used (e.g. `REGTEST` or `MAINNET`).
    </ResponseField>
  </Expandable>
</ResponseField>
\n