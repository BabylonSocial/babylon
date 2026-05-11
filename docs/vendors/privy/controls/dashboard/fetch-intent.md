> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Fetch intent

Your app can fetch an intent from the Privy API to check its current status, view approval progress, and retrieve execution results.

## Usage

<Tabs>
  <Tab title="REST API">
    To fetch an intent, make a `GET` request to:

    ```sh  theme={"system"}
    GET https://api.privy.io/v1/intents/{intent_id}
    ```

    <CodeGroup>
      ```sh Request theme={"system"}
      curl https://api.privy.io/v1/intents/{intent_id} \
        -H "Authorization: Basic <encoded-credentials>" \
        -H "privy-app-id: <your-app-id>"
      ```

      ```json Response theme={"system"}
      {
        "intent_id": "clpq1234567890abcdefghij",
        "intent_type": "RPC",
        "created_by_display_name": "developer@example.com",
        "created_by_id": "did:privy:clabcd123",
        "created_at": 1741834854578,
        "resource_id": "xs76o3pi0v5syd62ui1wmijw",
        "authorization_details": [
          {
            "members": [
              {
                "type": "user",
                "user_id": "did:privy:clabcd123",
                "display_name": "admin@example.com",
                "signed_at": null
              }
            ],
            "threshold": 1,
            "display_name": "Admin Key Quorum"
          }
        ],
        "status": "pending",
        "expires_at": 1741921254578,
        "request_details": {
          "method": "POST",
          "url": "https://api.privy.io/v1/wallets/xs76o3pi0v5syd62ui1wmijw/rpc",
          "body": {
            "method": "eth_sendTransaction",
            "caip2": "eip155:8453",
            "chain_type": "ethereum",
            "params": {
              "transaction": {
                "to": "0x0000000000000000000000000000000000000000",
                "value": 1
              }
            }
          }
        }
      }
      ```
    </CodeGroup>
  </Tab>
</Tabs>

## Response fields

<ParamField path="intent_id" type="string">
  Unique identifier for the intent.
</ParamField>

<ParamField path="intent_type" type="'RPC' | 'WALLET' | 'POLICY' | 'RULE' | 'KEY_QUORUM'">
  The type of action the intent proposes.
</ParamField>

<ParamField path="created_by_display_name" type="string | null">
  Email address of the team member who proposed the intent. May be `null` for intents proposed via
  the API.
</ParamField>

<ParamField path="created_by_id" type="string">
  The Privy DID of the team member who proposed the intent.
</ParamField>

<ParamField path="created_at" type="number">
  UNIX timestamp (ms) for when the intent was created.
</ParamField>

<ParamField path="resource_id" type="string">
  ID of the resource the intent targets (e.g., a wallet ID or policy ID).
</ParamField>

<ParamField path="authorization_details" type="array">
  List of key quorums assigned to the intent.

  <Expandable title="authorization_details properties">
    <ParamField path="authorization_details[].display_name" type="string">
      Name of the key quorum.
    </ParamField>

    <ParamField path="authorization_details[].threshold" type="number">
      Number of approvals required from this quorum.
    </ParamField>

    <ParamField path="authorization_details[].members" type="array">
      Members of the quorum.

      <Expandable title="member properties">
        <ParamField path="members[].type" type="string">
          The member type (e.g., `'user'`).
        </ParamField>

        <ParamField path="members[].user_id" type="string">
          The Privy DID of the member.
        </ParamField>

        <ParamField path="members[].display_name" type="string">
          Email address of the member.
        </ParamField>

        <ParamField path="members[].signed_at" type="number | null">
          Timestamp of when this member signed. Null if they have yet to sign.
        </ParamField>
      </Expandable>
    </ParamField>
  </Expandable>
</ParamField>

<ParamField path="status" type="'pending' | 'granted' | 'executed' | 'rejected' | 'expired' | 'dismissed'">
  Current status of the intent. See [intent lifecycle](/controls/dashboard/intent-status) for
  details on each status.
</ParamField>

<ParamField path="expires_at" type="number">
  UNIX timestamp (ms) for when the intent expires.
</ParamField>

<ParamField path="request_details" type="object">
  The full request for the proposed action, including HTTP method, URL, and body.
</ParamField>

<ParamField path="action_result" type="object | null">
  Response body from execution, if the intent has completed. For transaction intents, this contains
  the transaction hash.
</ParamField>

<Tip>
  For transaction intents, your app can read the transaction hash from `action_result` to track the
  transaction on-chain.
</Tip>

## API reference

<Card title="Get intent" icon="arrow-right" horizontal href="/api-reference/intents/get">
  View the full API reference for fetching an intent.
</Card>
\n