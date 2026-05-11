> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# createLightningInvoice

> Creates a Lightning invoice for the given wallet, allowing funds to be received via the Lightning Network.

<RequestExample>
  ```sh  theme={"system"}
  curl --request POST \
    --url https://api.privy.io/v1/wallets/{wallet_id}/rpc \
    --header 'Authorization: Basic <encoded-value>' \
    --header 'Content-Type: application/json' \
    --header 'privy-app-id: <privy-app-id>' \
    --data '{
    "method": "createLightningInvoice",
    "network": "MAINNET",
    "params": {
      "amount_sats": 20
    }
  }'
  ```
</RequestExample>

<ResponseExample>
  ```json 200 theme={"system"}
  {
    "method": "createLightningInvoice",
    "data": {
      "id": "SparkLightningReceiveRequest:019842c4-c50f-cd96-0000-612d71a61547",
      "created_at": "2025-07-25T18:07:28.527107+00:00",
      "updated_at": "2025-07-25T18:07:28.527107+00:00",
      "network": "MAINNET",
      "invoice": {
        "encodedInvoice": "lnbc...",
        "bitcoinNetwork": "MAINNET",
        "paymentHash": "f59c86aaafa9920f410d1567d9ee38bf526c932691c23c7bac6d8519682a6d76",
        "amount": {
          "originalValue": 20000,
          "originalUnit": "MILLISATOSHI",
          "preferredCurrencyUnit": "USD",
          "preferredCurrencyValueRounded": 2,
          "preferredCurrencyValueApprox": 2.3228803716608595
        },
        "createdAt": "2025-07-25T18:07:28.484042+00:00",
        "expiresAt": "2025-08-24T18:07:28.484042+00:00",
        "memo": null
      },
      "status": "INVOICE_CREATED",
      "typename": "LightningReceiveRequest",
      "payment_preimage": null,
      "receiver_identity_public_key": null
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

<ParamField body="method" type="string" defaultValue="createLightningInvoice" required>
  Available options: `createLightningInvoice`
</ParamField>

<ParamField body="network" type="string" required>
  Available options: `MAINNET`, `REGTEST`
</ParamField>

<ParamField body="params" type="object" required>
  Parameters for the invoice to be created.

  <Expandable title="child attributes" defaultOpen="true">
    <ParamField body="amount_sats" type="number" required>
      The amount of sats to be received.
    </ParamField>
  </Expandable>
</ParamField>

### Returns

<ResponseField name="method" type="enum<string>" required>
  Always `"createLightningInvoice"`
</ResponseField>

<ResponseField name="data" type="object" required>
  Details about the created Lightning invoice.

  <Expandable title="child attributes" defaultOpen="true">
    <ResponseField name="id" type="string" required>
      Unique ID of the Lightning receive request.
    </ResponseField>

    <ResponseField name="created_at" type="string" required>
      Timestamp of invoice creation.
    </ResponseField>

    <ResponseField name="updated_at" type="string" required>
      Timestamp of last update.
    </ResponseField>

    <ResponseField name="network" type="string" required>
      The Bitcoin network this invoice is valid for.
    </ResponseField>

    <ResponseField name="invoice" type="object" required>
      Encoded invoice details.

      <Expandable title="child attributes" defaultOpen="true">
        <ResponseField name="encodedInvoice" type="string" required>
          Bolt11-encoded Lightning invoice string.
        </ResponseField>

        <ResponseField name="bitcoinNetwork" type="string" required>
          The Bitcoin network.
        </ResponseField>

        <ResponseField name="paymentHash" type="string" required>
          The hash of the preimage for this payment request.
        </ResponseField>

        <ResponseField name="amount" type="object" required>
          Amount details.

          <Expandable title="child attributes" defaultOpen="true">
            <ResponseField name="originalValue" type="number" required />

            <ResponseField name="originalUnit" type="string" required />

            <ResponseField name="preferredCurrencyUnit" type="string" required />

            <ResponseField name="preferredCurrencyValueRounded" type="number" required />

            <ResponseField name="preferredCurrencyValueApprox" type="number" required />
          </Expandable>
        </ResponseField>

        <ResponseField name="createdAt" type="string" required>
          Timestamp of invoice creation.
        </ResponseField>

        <ResponseField name="expiresAt" type="string" required>
          Timestamp of invoice expiration.
        </ResponseField>

        <ResponseField name="memo" type="string" nullable>
          Optional memo included with the invoice.
        </ResponseField>
      </Expandable>
    </ResponseField>

    <ResponseField name="status" type="string" required>
      Current status of the invoice. Possible value: `"INVOICE_CREATED"`.
    </ResponseField>

    <ResponseField name="typename" type="string" required />

    <ResponseField name="payment_preimage" type="string" nullable />

    <ResponseField name="receiver_identity_public_key" type="string">
      Public key of the receiving node.
    </ResponseField>
  </Expandable>
</ResponseField>
\n