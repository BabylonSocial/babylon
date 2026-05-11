> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Transaction management

> Understanding how gas-sponsored transactions work and tracking their status

## Solana

When sending a gas-sponsored Solana transaction, the API returns immediately with the final transaction signature in the `hash` field.

Use webhooks to receive status updates as the transaction confirms on-chain.

## EVM

When sending a gas-sponsored EVM transaction, the API returns immediately after broadcast with `transaction_id` and `user_operation_hash`. The final transaction hash is not available until the transaction confirms on-chain and is delivered via webhook.

<Note>
  **Client SDK behavior**: When sending transactions from web or mobile SDK clients, the SDK waits
  for on-chain confirmation before returning. The backend API returns immediately after broadcast.
</Note>

Use [webhooks](/wallets/gas-and-asset-management/assets/transaction-event-webhooks) to receive the transaction hash and status updates as the transaction processes.

***

## How EVM transactions work

When sending a gas-sponsored EVM transaction, the API returns immediately after broadcast with the following response:

```json  theme={"system"}
{
  "transaction_id": "tx-xyz789",
  "user_operation_hash": "0x...",
  "hash": ""
}
```

**Key fields:**

* `transaction_id` — Privy's internal transaction identifier for tracking
* `user_operation_hash` — Unique identifier for the broadcasted transaction
* `hash` — Empty string until the transaction is confirmed on-chain

The final transaction hash becomes available once the transaction is confirmed and is delivered via webhook as `transaction_hash`.

### Transaction lifecycle

<Steps>
  <Step title="Transaction broadcast">
    The API validates and broadcasts the transaction to the network, then immediately returns with a
    `user_operation_hash`.
  </Step>

  <Step title="Pending state">
    The transaction is pending on-chain. Applications should display a loading or pending state to
    users.
  </Step>

  <Step title="Confirmation">
    Once confirmed on-chain, Privy sends a webhook with the final `transaction_hash` and status.
  </Step>
</Steps>

## Tracking transaction status

Track transaction status using either webhooks for real-time notifications or the API for on-demand queries.

### Querying status

Query transaction status at any time using the `transaction_id`. The response includes the current status and transaction hash once available.

<Tabs>
  <Tab title="Node SDK">
    ```typescript  theme={"system"}
    import {PrivyClient} from '@privy-io/node';

    const privy = new PrivyClient({
      appId: 'your-app-id',
      appSecret: 'your-app-secret'
    });

    const transaction = await privy.transactions().get(transaction_id);

    console.log(transaction.status); // "pending", "confirmed", "reverted", etc.
    console.log(transaction.transaction_hash); // Available once confirmed
    ```
  </Tab>

  <Tab title="REST API">
    ```bash  theme={"system"}
    curl --request GET \
      https://api.privy.io/v1/transactions/<transaction_id> \
      -u "<your-privy-app-id>:<your-privy-app-secret>" \
      -H "privy-app-id: <your-privy-app-id>"
    ```

    **Response:**

    ```json  theme={"system"}
    {
      "id": "tx-xyz789",
      "wallet_id": "wallet-abc123",
      "status": "confirmed",
      "transaction_hash": "0x...",
      "caip2": "eip155:1"
    }
    ```
  </Tab>

  <Tab title="Rust SDK">
    ```rust  theme={"system"}
    use privy_rs::PrivyClient;

    let client = PrivyClient::new(app_id, app_secret)?;

    let transaction = client.transactions().get(transaction_id).await?;

    println!("Status: {:?}", transaction.status);
    println!("Hash: {:?}", transaction.transaction_hash);
    ```
  </Tab>
</Tabs>

Learn more in the [API reference](/api-reference/transactions/get).

### Notified via webhooks

Webhooks provide real-time notifications as transaction status changes. Configure a webhook endpoint to receive automatic updates.

**Setting up webhooks:**

1. Navigate to the [Webhooks tab](https://dashboard.privy.io/apps?page=webhooks) in the Privy Dashboard
2. Add a webhook endpoint URL
3. Subscribe to transaction events
4. Implement webhook handlers in your application

**Transaction webhook events:**

| Event                            | Description                                     |
| -------------------------------- | ----------------------------------------------- |
| `transaction.broadcasted`        | Transaction was submitted to the network        |
| `transaction.confirmed`          | Transaction was confirmed on-chain              |
| `transaction.execution_reverted` | Transaction was reverted by the network         |
| `transaction.failed`             | Transaction failed to be included               |
| `transaction.replaced`           | Transaction was replaced by another transaction |

**Webhook payloads:**

**`transaction.broadcasted`** — Sent immediately after broadcast:

```json  theme={"system"}
{
  "type": "transaction.broadcasted",
  "data": {
    "wallet_id": "wallet-abc123",
    "transaction_id": "tx-xyz789",
    "caip2": "eip155:1",
    "user_operation_hash": "0x..."
  }
}
```

**`transaction.confirmed`** — Sent when confirmed on-chain:

```json  theme={"system"}
{
  "type": "transaction.confirmed",
  "data": {
    "wallet_id": "wallet-abc123",
    "transaction_id": "tx-xyz789",
    "caip2": "eip155:1",
    "transaction_hash": "0x...",
    "user_operation_hash": "0x..."
  }
}
```

**`transaction.execution_reverted`** — Sent when the transaction reverts:

```json  theme={"system"}
{
  "type": "transaction.execution_reverted",
  "data": {
    "wallet_id": "wallet-abc123",
    "transaction_id": "tx-xyz789",
    "caip2": "eip155:1",
    "transaction_hash": "0x...",
    "user_operation_hash": "0x..."
  }
}
```

## Common questions

<AccordionGroup>
  <Accordion title="Why does the API return immediately instead of waiting for confirmation?">
    The backend API returns immediately after broadcast to enable better performance and prevent timeout issues during network congestion. This design allows applications to handle high transaction volumes and provide better user experiences with real-time status updates via webhooks. Web and mobile SDK clients wait for on-chain confirmation before returning to provide a simpler developer experience.
  </Accordion>

  <Accordion title="How long does confirmation typically take?">
    Confirmation times vary by network:

    * **Ethereum mainnet**: 12-60 seconds
    * **Layer 2s** (Base, Optimism, Arbitrum): 1-10 seconds
    * **Solana**: 1-5 seconds

    During network congestion, confirmation may take longer. Applications should implement appropriate timeout handling.
  </Accordion>

  <Accordion title="What if the webhook fails to deliver?">
    Privy retries webhook delivery with exponential backoff. Applications should also implement their
    own polling mechanism using the `transaction_id` to fetch transaction status from Privy's API as a
    fallback.
  </Accordion>

  <Accordion title="Can I get the transaction hash immediately?">
    No. The `transaction_hash` is only available after the transaction is included in a block on-chain. Applications must use webhooks or polling to retrieve the final hash.
  </Accordion>
</AccordionGroup>

<Info>
  Learn more about transaction webhooks in the [webhook events
  reference](/wallets/gas-and-asset-management/assets/transaction-event-webhooks).
</Info>
\n