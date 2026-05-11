> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# claimStaticDeposit

> Claims funds sent to the static BTC deposit address.

<RequestExample>
  ```sh  theme={"system"}
  curl --request POST \
    --url https://api.privy.io/v1/wallets/{wallet_id}/rpc \
    --header 'Authorization: Basic <encoded-value>' \
    --header 'Content-Type: application/json' \
    --header 'privy-app-id: <privy-app-id>' \
    --data '{
    "method": "claimStaticDeposit",
    "network": "MAINNET",
    "params": {
      "credit_amount_sats": 9901,
      "signature": "3045022100c4b5c728cdaf2ca0d9ffa2a5689eefa51d286bf32fbfb678071735a44e83132f0220173e59115579e705689dd0d3e819b87255e86ed4629637c85f761c0960869c7a",
      "transaction_id": "cff576f1ebebda2ddf812f06f656a6668f08f13d56290b4468327607f4d68acb",
      "output_index": 0
    }
  }'
  ```
</RequestExample>

<ResponseExample>
  ```json 200 theme={"system"}
  {
    "method": "claimStaticDeposit",
    "data": {
      "transfer_id": "22a62e0b-6eae-4d84-8f15-2a69a6440b74"
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

<ParamField body="method" type="string" defaultValue="claimStaticDeposit" required>
  Available options: `claimStaticDeposit`
</ParamField>

<ParamField body="network" type="string" required>
  Available options: `MAINNET`, `REGTEST`
</ParamField>

<ParamField body="params" type="object" required>
  Required parameters to claim the deposit.

  <Expandable title="child attributes" defaultOpen="true">
    <ParamField body="credit_amount_sats" type="number" required>
      Amount of native tokens (in satoshis) being claimed from the UTXO.
    </ParamField>

    <ParamField body="signature" type="string" required>
      A signature authorizing the claim, signed by the address that received the deposit.
    </ParamField>

    <ParamField body="transaction_id" type="string" required>
      The transaction ID (hash) of the deposit transaction containing the UTXO.
    </ParamField>

    <ParamField body="output_index" type="number" required>
      The index of the UTXO output in the transaction.
    </ParamField>
  </Expandable>
</ParamField>

### Returns

<ResponseField name="method" type="enum<string>" required>
  Always `"claimStaticDeposit"`
</ResponseField>

<ResponseField name="data" type="object" required>
  Information about the claimed deposit.

  <Expandable title="child attributes" defaultOpen="true">
    <ResponseField name="transfer_id" type="string" required>
      A unique identifier representing the successful internal transfer of claimed funds to the
      wallet.
    </ResponseField>
  </Expandable>
</ResponseField>
\n