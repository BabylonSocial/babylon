> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# eth_signTransaction

> Sign a transaction using the eth_signTransaction method.

### SDK methods

Learn more about signing transactions using our SDKs [here](/wallets/using-wallets/ethereum/sign-a-transaction).

<RequestExample>
  ```sh cURL theme={"system"}
  curl --request POST \
    --url https://api.privy.io/v1/wallets/{wallet_id}/rpc \
    --header 'Authorization: Basic <encoded-value>' \
    --header 'Content-Type: application/json' \
    --header 'privy-app-id: <privy-app-id>' \
    --data '{
    "method": "eth_signTransaction",
    "params": {
      "transaction": {
        "to": "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
        "value": "0x2386F26FC10000",
        "chain_id": 11155111,
        "data": "0x",
        "gas_limit": 50000,
        "nonce": 0,
        "max_fee_per_gas": 1000308,
        "max_priority_fee_per_gas": "1000000"
      }
    }
  }'
  ```
</RequestExample>

<ResponseExample>
  ```json 200 theme={"system"}
  {
    "method": "eth_signTransaction",
    "data": {
      "signed_transaction": "0x02f870830138de80830f4240830f437480940b81418147df37155d643b5cb65ba6c8cb7aba76872000000000000480c080a05c11a2166ec56189d993dec477477d962ce0d4c466ab7ed8982110621ec87a57a003c796590c0c62eac30acd412f2aa0e8ad740c4ded86fb64d3326ee4c0ea804c",
      "encoding": "rlp"
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

<ParamField body="method" type="string" defaultValue="eth_signTransaction" required>
  Available options: `eth_signTransaction`
</ParamField>

<ParamField body="params" type="object" required>
  <Expandable title="child attributes" defaultOpen="true">
    <ParamField body="transaction" type="object" required>
      <Expandable title="child attributes" defaultOpen="true">
        <ParamField body="from" type="string" />

        <ParamField body="to" type="string" />

        <ParamField body="chain_id" type="string" />

        <ParamField body="nonce" type="string" />

        <ParamField body="data" type="string" />

        <ParamField body="value" type="string">
          The value to send in the transaction in wei as a hexadecimal string.
        </ParamField>

        <ParamField body="type" type="number">
          Available options: `0`, `1`, `2`, `4`
        </ParamField>

        <ParamField body="gas_limit" type="string" />

        <ParamField body="gas_price" type="string" />

        <ParamField body="authorization_list" type="object">
          <Expandable title="child attributes" defaultOpen="false">
            <ParamField body="contract" type="string">
              The delegated contract address
            </ParamField>

            <ParamField body="chain_id" type="string" />

            <ParamField body="nonce" type="string" />

            <ParamField body="r" type="string" />

            <ParamField body="s" type="string" />

            <ParamField body="y_parity" type="string" />
          </Expandable>
        </ParamField>
      </Expandable>
    </ParamField>
  </Expandable>
</ParamField>

### Response

<ResponseField name="method" type="enum<string>" required>
  Available options: `eth_signTransaction`
</ResponseField>

<ResponseField name="data" type="object" required>
  <Expandable title="child properties" defaultOpen="true">
    <ResponseField name="signed_transaction" type="string" required />

    <ResponseField name="encoding" type="enum<string>">
      Available options: `rlp`
    </ResponseField>
  </Expandable>
</ResponseField>
\n