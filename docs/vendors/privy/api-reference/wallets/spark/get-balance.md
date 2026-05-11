> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# getBalance

> Retrieve the balance and token holdings of a Spark wallet. Claims any pending transfers.

<RequestExample>
  ```sh  theme={"system"}
  curl --request POST \
    --url https://api.privy.io/v1/wallets/{wallet_id}/rpc \
    --header 'Authorization: Basic <encoded-value>' \
    --header 'Content-Type: application/json' \
    --header 'privy-app-id: <privy-app-id>' \
    --data '{
    "method": "getBalance",
    "network": "MAINNET"
  }'
  ```
</RequestExample>

<ResponseExample>
  ```json 200 theme={"system"}
  {
    "method": "getBalance",
    "data": {
      "balance": "239170",
      "token_balances": {
        "btknrt1x9helfvakyz8y53lzwt2wjen7d30ft6skpu69eydvndqt5uxsr4q0zvugn": {
          "balance": "999999910",
          "token_metadata": {
            "raw_token_identifier": "316f9fa59db10472523f1396a74b33f362f4af50b079a2e48d64da05d38680ea",
            "token_public_key": "025bd027cd332a40e21f16cb6e9c6aee9ac11e3dff9508081b64fa8b27658b18b6",
            "token_name": "Merica",
            "token_ticker": "USA",
            "decimals": 6,
            "max_supply": "21000000000000"
          }
        }
      },
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

<Info>
  These wallet methods are modeled after the [Spark Wallet
  SDK](https://github.com/buildonspark/spark/tree/main/sdks/js/packages/spark-sdk). For more
  information about this wallet method, check out the [Spark Wallet
  documentation](https://docs.spark.money/wallet/introduction).
</Info>

### Body

<ParamField body="method" type="string" defaultValue="getBalance" required>
  Available options: `getBalance`
</ParamField>

<ParamField body="network" type="string" required>
  Available options: `MAINNET`, `REGTEST`
</ParamField>

### Returns

<ResponseField name="method" type="enum<string>" required>
  Available options: `getBalance`
</ResponseField>

<ResponseField name="data" type="object" required>
  The balance and token holdings of the wallet.

  <Expandable title="child attributes" defaultOpen="true">
    <ResponseField name="balance" type="string" required>
      Native Spark balance in satoshis.
    </ResponseField>

    <ResponseField name="token_balances" type="object" required>
      A mapping of token Spark addresses to token data.

      <Expandable title="child attributes" defaultOpen="true">
        <ResponseField name="[token_spark_address]" type="object" required>
          <Expandable title="child attributes" defaultOpen="true">
            <ResponseField name="balance" type="string" required />

            <ResponseField name="token_metadata" type="object" required>
              <Expandable title="child attributes" defaultOpen="true">
                <ResponseField name="raw_token_identifier" type="string" required />

                <ResponseField name="token_public_key" type="string" required />

                <ResponseField name="token_name" type="string" required />

                <ResponseField name="token_ticker" type="string" required />

                <ResponseField name="decimals" type="number" required />

                <ResponseField name="max_supply" type="string" required />
              </Expandable>
            </ResponseField>
          </Expandable>
        </ResponseField>
      </Expandable>
    </ResponseField>

    <ResponseField name="encoding" type="string" required />
  </Expandable>
</ResponseField>

```
```
\n