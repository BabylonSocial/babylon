> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Intent webhooks

Privy emits webhooks when the status of an intent changes, enabling your application to react to approval events in real time. Use these webhooks to notify reviewers, trigger automations, or keep external systems in sync with the approval flow.

<Info>
  Webhooks can be tested at no cost in development environments. To enable webhooks in production,
  upgrade to the Enterprise plan in the Privy Dashboard.
</Info>

## Setup

Follow the [webhooks setup guide](/api-reference/webhooks/overview#registering-an-endpoint) to register an endpoint, then enable the intent events your app needs.

Privy will emit a signed webhook to your endpoint whenever an intent is created or authorized, and will retry delivery if the endpoint does not successfully respond. See the [webhooks reference](/api-reference/webhooks/overview#webhook-delivery) for details on delivery, idempotency, and retries.

## Events

### `intent.created`

Fired when an intent is proposed, either via the Privy Dashboard or the REST API. The payload includes the list of **authorizers** eligible to approve the request and an `expires_at` timestamp indicating when the intent will expire if the required approvals are not satisfied.

Use this event to notify reviewers that a new intent is awaiting their approval.

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

<ParamField path="expires_at" type="number">
  UNIX timestamp after which the intent expires and can no longer be executed.
</ParamField>

<Tip>
  Intents expire 72 hours after creation by default. Build alerting around the `expires_at` field to
  remind reviewers before the window closes.
</Tip>

### `intent.authorized`

Fired when a team member approves an intent. This event indicates that one reviewer has submitted their authorization. *It does not guarantee the intent has been executed.*

If the approval meets the authorization threshold, the intent executes automatically. If more approvals are still required, the intent remains in the **Pending** state until the threshold is reached or the intent expires.

Use this event to track approval progress or trigger follow-up actions once a specific reviewer has signed off.

<Warning>
  Receiving an `intent.authorized` event does not mean the underlying action has completed. To
  confirm execution, listen for the `intent.executed` webhook or [fetch the
  intent](/controls/dashboard/fetch-intent) and check its status.
</Warning>

<ParamField path="member" type="object">
  The team member who authorized the intent.

  <Expandable title="member properties">
    <ParamField path="member.type" type="string">
      The member type (e.g., `'user'`).
    </ParamField>

    <ParamField path="member.user_id" type="string">
      The Privy DID of the member.
    </ParamField>

    <ParamField path="member.display_name" type="string">
      Email address of the member.
    </ParamField>

    <ParamField path="member.signed_at" type="number | null">
      Timestamp of when this member signed.
    </ParamField>
  </Expandable>
</ParamField>

<ParamField path="authorized_at" type="number">
  UNIX timestamp when the team member signed the intent.
</ParamField>

## Events reference

<CardGroup cols={2}>
  <Card title="intent.created" icon="plus" href="/api-reference/webhooks/intents/created">
    Full payload reference for the intent created event.
  </Card>

  <Card title="intent.authorized" icon="check" href="/api-reference/webhooks/intents/authorized">
    Full payload reference for the intent authorized event.
  </Card>
</CardGroup>
\n