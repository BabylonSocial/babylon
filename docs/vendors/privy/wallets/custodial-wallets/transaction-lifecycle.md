> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Transaction lifecycle

After initiating a transaction from a custodial wallet, the custodian must first conduct transaction screening and other compliance checks before the transaction is executed and then finalized.
The transaction status goes through the following states:

| Status           | Description                                                                                                                                                     |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pending`        | The transaction request has been forwarded to the custodian and is undergoing processing.                                                                       |
| `broadcasted`    | The transaction has been approved by the custodian and broadcasted to the blockchain. The transaction `hash` gets populated at this point.                      |
| `confirmed`      | The transaction has been confirmed (terminal state). This state follows the `broadcasted` state.                                                                |
| `provider_error` | The transaction was rejected or encountered an error due to the custodian's restrictions (terminal state). This state would usually follow the `pending` state. |

To track the transaction status, use the `transaction_id` to query the [transaction status](/api-reference/transactions/get) or use [webhooks](/wallets/custodial-wallets/advanced/webhooks) to receive status updates.

## Next steps

<CardGroup>
  <Card title="Transaction webhooks" icon="webhook" href="/wallets/custodial-wallets/advanced/webhooks">
    Monitor transaction status and lifecycle events
  </Card>

  <Card title="Authorization controls" icon="shield-halved" href="/wallets/custodial-wallets/advanced/authorization-controls">
    Configure policies and multi-party approvals for custodial wallets
  </Card>
</CardGroup>
\n