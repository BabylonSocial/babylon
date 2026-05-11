> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# payLightningInvoice

> Pay a Lightning Network invoice from a Spark wallet.

<RequestExample>
  ```sh curl --request POST \ theme={"system"}
    --url https://api.privy.io/v1/wallets/{wallet_id}/rpc \
    --header 'Authorization: Basic <encoded-value>' \
    --header 'Content-Type: application/json' \
    --header 'privy-app-id: <privy-app-id>' \
    --data '{
    "method": "payLightningInvoice",
    "network": "MAINNET",
    "params": {
      "invoice": "lnbc1230n1p...",
      "max_fee_sats": 5,
      "prefer_spark": true,
      "amount_sats_to_send": 5000
    }
  }'
  ```
</RequestExample>

<ResponseExample>
  ```json 200 theme={"system"}
  {
    "method": "payLightningInvoice",
    "data": {
      "id": "2fb0b49e-0aef-4726-a348-2dd0a9432c12",
      "created_at": "2025-07-24T16:43:12.509Z",
      "updated_at": "2025-07-24T16:43:12.509Z",
      "network": "MAINNET",
      "encoded_invoice": "lnbc1230n1p...",
      "fee": {
        "original_value": 3,
        "original_unit": "SATOSHI"
      },
      "status": "SUCCESS",
      "typename": "LightningSendRequest"
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

<ParamField body="method" type="string" defaultValue="payLightningInvoice" required>
  Available options: `payLightningInvoice`
</ParamField>

<ParamField body="network" type="string" required>
  Available options: `MAINNET`, `REGTEST`
</ParamField>

<ParamField body="params" type="object" required>
  <Expandable title="child attributes" defaultOpen="true">
    <ParamField body="invoice" type="string" required>
      The BOLT11 Lightning invoice to pay.
    </ParamField>

    <ParamField body="max_fee_sats" type="number" required>
      Maximum fee (in sats) the payer is willing to pay.
    </ParamField>

    <ParamField body="prefer_spark" type="boolean">
      Whether to prefer paying on Spark. If true, will return a Transfer object. Defaults to false.
    </ParamField>

    <ParamField body="amount_sats_to_send" type="number">
      Amount to pay in sats. Required only for zero-amount invoices.
    </ParamField>
  </Expandable>
</ParamField>

### Returns

<ResponseField name="method" type="enum<string>" required>
  Available options: `payLightningInvoice`
</ResponseField>

<ResponseField name="data" type="object" required>
  If `prefer_spark` is false, a `LightningSendRequest` object with the following fields:

  <Expandable title="child attributes" defaultOpen="true">
    <ResponseField name="id" type="string" required />

    <ResponseField name="created_at" type="string" required />

    <ResponseField name="updated_at" type="string" required />

    <ResponseField name="network" type="string" required />

    <ResponseField name="encoded_invoice" type="string" required />

    <ResponseField name="fee" type="object" required>
      <Expandable title="child attributes" defaultOpen="true">
        <ResponseField name="original_value" type="number" />

        <ResponseField name="original_unit" type="string" />
      </Expandable>
    </ResponseField>

    <ResponseField name="status" type="string" required />

    <ResponseField name="typename" type="string" required />
  </Expandable>

  If `prefer_spark` is true, the response will be a `Transfer` object with the following fields:

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