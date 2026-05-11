> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# eth_signUserOperation

> Sign a user operation using the eth_signUserOperation method.

<Info>
  This method is currently only supported for the Alchemy smart contract address
  `0x69007702764179f14F51cdce752f4f775d74E139` and Kernel contract address
  `0xd6CEDDe84be40893d153Be9d467CD6aD37875b28`.
</Info>

<RequestExample>
  ```sh cURL theme={"system"}
  curl --request POST \
    --url https://api.privy.io/v1/wallets/{wallet_id}/rpc \
    --header 'Authorization: Basic <encoded-value>' \
    --header 'Content-Type: application/json' \
    --header 'privy-app-id: <privy-app-id>' \
    --data '{
    "method": "eth_signUserOperation",
    "params": {
      "contract": "0x69007702764179f14F51cdce752f4f775d74E139",
      "user_operation": {
        "sender": "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
        "nonce": "0x0",
        "call_data": "0x",
        "call_gas_limit": "0x30d40",
        "verification_gas_limit": "0x30d40",
        "pre_verification_gas": "0x5208",
        "max_fee_per_gas": "0xf4240",
        "max_priority_fee_per_gas": "0xf4240",
        "paymaster": "0x0000000000000000000000000000000000000000",
        "paymaster_data": "0x",
        "paymaster_verification_gas_limit": "0x0",
        "paymaster_post_op_gas_limit": "0x0"
      },
      "chain_id": "11155111"
    }
  }'
  ```
</RequestExample>

<ResponseExample>
  ```json 200 theme={"system"}
  {
    "method": "eth_signUserOperation",
    "data": {
      "signature": "0x1754782aea15e96189c3a85a7b7ac2f6339f6f4f3b29b1d3200a4c9907ef53e4776a84387583896b0a074cbc6de1a1c2a1eb53aba199da6ada8c99b0266171c41b",
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

### Body

<ParamField body="method" type="string" defaultValue="eth_signUserOperation" required>
  Available options: `eth_signUserOperation`
</ParamField>

<ParamField body="params" type="object" required>
  <Expandable title="child attributes" defaultOpen="true">
    <ParamField body="contract" type="string" required>
      The smart contract address for the user operation. Currently supports the Alchemy smart
      contract: `0x69007702764179f14F51cdce752f4f775d74E139` and Kernel smart contract:
      `0xd6CEDDe84be40893d153Be9d467CD6aD37875b28`.
    </ParamField>

    <ParamField body="user_operation" type="object" required>
      <Expandable title="child attributes" defaultOpen="true">
        <ParamField body="sender" type="string" required>
          The account making the operation.
        </ParamField>

        <ParamField body="nonce" type="string" required>
          Anti-replay parameter; also used as the salt for first-time account creation.
        </ParamField>

        <ParamField body="call_data" type="string" required>
          The data to pass to the sender during the main execution call.
        </ParamField>

        <ParamField body="call_gas_limit" type="string" required>
          The amount of gas to allocate the main execution call.
        </ParamField>

        <ParamField body="verification_gas_limit" type="string" required>
          The amount of gas to allocate for the verification step.
        </ParamField>

        <ParamField body="pre_verification_gas" type="string" required>
          Extra gas to pay the bundler.
        </ParamField>

        <ParamField body="max_fee_per_gas" type="string" required>
          Maximum fee per gas (similar to EIP-1559 max\_fee\_per\_gas).
        </ParamField>

        <ParamField body="max_priority_fee_per_gas" type="string" required>
          Maximum priority fee per gas (similar to EIP-1559 max\_priority\_fee\_per\_gas).
        </ParamField>

        <ParamField body="paymaster" type="string" required>
          Address of paymaster sponsoring the transaction, zero for self-sponsored.
        </ParamField>

        <ParamField body="paymaster_data" type="string" required>
          Extra data to send to the paymaster.
        </ParamField>

        <ParamField body="paymaster_verification_gas_limit" type="string" required>
          The amount of gas to allocate for the paymaster validation code.
        </ParamField>

        <ParamField body="paymaster_post_op_gas_limit" type="string" required>
          The amount of gas to allocate for the paymaster post-operation code.
        </ParamField>
      </Expandable>
    </ParamField>

    <ParamField body="chain_id" type="string" required>
      The chain ID for the user operation.
    </ParamField>
  </Expandable>
</ParamField>

### Response

<ResponseField name="method" type="enum<string>" required>
  Available options: `eth_signUserOperation`
</ResponseField>

<ResponseField name="data" type="object" required>
  <Expandable title="child properties" defaultOpen="true">
    <ResponseField name="signature" type="string" required>
      The hex-encoded signature of the user operation.
    </ResponseField>

    <ResponseField name="encoding" type="enum<string>">
      Available options: `hex`
    </ResponseField>
  </Expandable>
</ResponseField>
\n