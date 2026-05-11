> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# transfer

> Transfer satoshis from a Spark wallet to another Spark address.

<RequestExample>
  ```sh curl --request POST \ theme={"system"}
    --url https://api.privy.io/v1/wallets/{wallet_id}/rpc \
    --header 'Authorization: Basic <encoded-value>' \
    --header 'Content-Type: application/json' \
    --header 'privy-app-id: <privy-app-id>' \
    --data '{
    "method": "transfer",
    "network": "MAINNET",
    "params": {
      "receiver_spark_address": "spark1pgss8z35rpycv4duqdk5u3sclhjnztjunv5yajlwk69tyv5fsvwwe9mgwmxfkx",
      "amount_sats": 16
    }
  }'
  ```
</RequestExample>

<ResponseExample>
  ```json 200 theme={"system"}
  {
    "method": "transfer",
    "data": {
      "id": "01983eb7-4008-7b73-b269-c0bd86955a1b",
      "sender_identity_public_key": "027bca218b2853d5ff2e9b174370f58107a23df98a759e968c523253c1702dd485",
      "receiver_identity_public_key": "038a3418498655bc036d4e4618fde5312e5c9b284ecbeeb68ab23289831cec9768",
      "status": "TRANSFER_STATUS_SENDER_KEY_TWEAKED",
      "total_value": 16,
      "expiry_time": "1970-01-01T00:00:00.000Z",
      "leaves": [
        {
          "leaf": {
            "id": "01983e38-b2f8-7649-a910-b2be1424de1d",
            "tree_id": "01983e36-e645-7a34-ab95-a6faec210992",
            "value": 16,
            "parent_node_id": "01983e38-b2e2-7edd-9b6b-a784545aa28c",
            "node_tx": "<hex-encoded-tx>",
            "refund_tx": "<hex-encoded-refund>",
            "vout": 0,
            "verifying_public_key": "<pubkey>",
            "owner_identity_public_key": "<pubkey>",
            "signing_keyshare": {
              "owner_identifiers": ["...", "..."],
              "threshold": 2,
              "public_key": "<pubkey>",
              "public_shares": {
                "...": "<pubkey>",
                "...": "<pubkey>"
              },
              "updated_time": "2025-07-24T23:14:14.598Z"
            },
            "status": "TRANSFER_LOCKED",
            "network": "MAINNET"
          },
          "secret_cipher": "<ciphertext>",
          "signature": "<hex>",
          "intermediate_refund_tx": "<hex>"
        }
      ],
      "created_time": "2025-07-24T23:14:14.276Z",
      "updated_time": "2025-07-24T23:14:14.618Z",
      "type": "TRANSFER",
      "transfer_direction": "OUTGOING",
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

<ParamField body="method" type="string" defaultValue="transfer" required>
  Available options: `transfer`
</ParamField>

<ParamField body="network" type="string" required>
  Available options: `MAINNET`, `REGTEST`
</ParamField>

<ParamField body="params" type="object" required>
  <Expandable title="child attributes" defaultOpen="true">
    <ParamField body="receiver_spark_address" type="string" required>
      The Spark address of the recipient.
    </ParamField>

    <ParamField body="amount_sats" type="number" required>
      The amount to send in satoshis.
    </ParamField>
  </Expandable>
</ParamField>

### Returns

<ResponseField name="method" type="enum<string>" required>
  Available options: `transfer`
</ResponseField>

<ResponseField name="data" type="object" required>
  The returned Transfer object

  <Expandable title="child attributes" defaultOpen="true">
    <ResponseField name="id" type="string" required />

    <ResponseField name="sender_identity_public_key" type="string" required />

    <ResponseField name="receiver_identity_public_key" type="string" required />

    <ResponseField name="status" type="string" required />

    <ResponseField name="total_value" type="number" required />

    <ResponseField name="expiry_time" type="string" />

    <ResponseField name="leaves" type="array<object>" required>
      Each item contains transfer metadata and encrypted leaf information.

      <Expandable title="child attributes" defaultOpen="true">
        <ResponseField name="leaf" type="object" required>
          <Expandable title="child attributes" defaultOpen="true">
            <ResponseField name="id" type="string" required />

            <ResponseField name="tree_id" type="string" required />

            <ResponseField name="value" type="number" required />

            <ResponseField name="parent_node_id" type="string" required />

            <ResponseField name="node_tx" type="string" required />

            <ResponseField name="refund_tx" type="string" required />

            <ResponseField name="vout" type="number" required />

            <ResponseField name="verifying_public_key" type="string" required />

            <ResponseField name="owner_identity_public_key" type="string" required />

            <ResponseField name="signing_keyshare" type="object" required>
              <Expandable title="child attributes" defaultOpen="true">
                <ResponseField name="owner_identifiers" type="array<string>" required />

                <ResponseField name="threshold" type="number" required />

                <ResponseField name="public_key" type="string" required />

                <ResponseField name="public_shares" type="object" required>
                  A mapping from signer identifier to public share
                </ResponseField>

                <ResponseField name="updated_time" type="string" required />
              </Expandable>
            </ResponseField>

            <ResponseField name="status" type="string" required />

            <ResponseField name="network" type="string" required />
          </Expandable>
        </ResponseField>

        <ResponseField name="secret_cipher" type="string" required />

        <ResponseField name="signature" type="string" required />

        <ResponseField name="intermediate_refund_tx" type="string" required />
      </Expandable>
    </ResponseField>

    <ResponseField name="created_time" type="string" />

    <ResponseField name="updated_time" type="string" />

    <ResponseField name="type" type="string" />

    <ResponseField name="transfer_direction" type="string" />

    <ResponseField name="encoding" type="string" />
  </Expandable>
</ResponseField>
\n