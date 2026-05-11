> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# signAndSendTransaction

> Sign and send transaction with a Solana wallet using the signAndSendTransaction method.

### SDK methods

Learn more about sending transactions using our SDKs [here](/wallets/using-wallets/solana/send-a-transaction).

<RequestExample>
  ```sh cURL theme={"system"}
  curl --request POST \
    --url https://api.privy.io/v1/wallets/{wallet_id}/rpc \
    --header 'Authorization: Basic <encoded-value>' \
    --header 'Content-Type: application/json' \
    --header 'privy-app-id: <privy-app-id>' \
    --data '{
    "method": "signAndSendTransaction",
    "caip2": "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1",
    "sponsor": true,
    "params": {
      "transaction": "AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAEDRpb0mdmKftapwzzqUtlcDnuWbw8vwlyiyuWyyieQFKESezu52HWNss0SAcb60ftz7DSpgTwUmfUSl1CYHJ91GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAScgJ7J0AXFr1azCEvB1Y5zpiF4eXR+yTW0UB7am+E/MBAgIAAQwCAAAAQEIPAAAAAAA=",
      "encoding": "base64"
    }
  }
  '
  ```
</RequestExample>

<ResponseExample>
  ```json 200 theme={"system"}
  {
    "method": "signAndSendTransaction",
    "data": {
      "hash": "22VS6wqrbeaN21ku3pjEjfnrWgk1deiFBSB1kZzS8ivr2G8wYmpdnV3W7oxpjFPGkt5bhvZvK1QBzuCfUPUYYFQq",
      "caip2": "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1",
      "transaction_id": "nyorsf87s9d08jimesv3n8yq"
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

<ParamField body="method" type="string" defaultValue="signAndSendTransaction" required>
  Available options: `signAndSendTransaction`
</ParamField>

<ParamField body="caip2" type="string" initialValue="eip155:11155111" required>
  Available options: `solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp` (Solana Mainnet),
  `solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1` (Solana Devnet),
  `solana:4uhcVJyU9pJkvQyS88uRDiswHXSCkY3z` (Solana Testnet)
</ParamField>

<ParamField body="params" type="object" required>
  <Expandable title="child attributes" defaultOpen="true">
    <ParamField body="transaction" type="string">
      Base64 encoded serialized transaction to sign.
    </ParamField>

    <ParamField body="encoding" type="string">
      Available options: `base64`
    </ParamField>
  </Expandable>
</ParamField>

<ParamField body="sponsor" type="boolean">
  Optional parameter to enable gas sponsorship for this transaction. [Learn
  more.](/wallets/gas-and-asset-management/gas/overview)
</ParamField>

### Returns

<ResponseField name="method" type="enum<string>" required>
  Available options: `signAndSendTransaction`
</ResponseField>

<ResponseField name="data" type="object" required>
  <Expandable title="child attributes" defaultOpen="true">
    <ResponseField name="hash" type="string" required>
      Transaction hash of the signed and sent transaction.
    </ResponseField>

    <ResponseField name="caip2" type="string" required>
      CAIP-2 chain ID of the network where the transaction was sent.
    </ResponseField>

    <ResponseField name="transaction_id" type="string">
      Optional Privy-assigned transaction ID.
    </ResponseField>
  </Expandable>
</ResponseField>
\n