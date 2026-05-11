> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Transaction management

Applications often need to manage the full lifecycle of transactions, including funding wallets, sponsoring gas, approving transactions, and monitoring wallet activity. Learn more about how Privy supports each step below.

## Webhooks

Privy sends real-time notifications for transaction status changes, deposits, and withdrawals. Your app can use webhooks to trigger downstream actions like updating balances, sending confirmations, or executing follow-up transactions.

Privy also provides REST APIs for querying transaction status and balances on demand.

<CardGroup cols={3}>
  <Card title="Deposit and withdraw webhooks" icon="wallet" href="/wallets/gas-and-asset-management/assets/balance-event-webhooks">
    Monitor deposits and withdrawals.
  </Card>

  <Card title="Transaction webhooks" icon="arrow-right-arrow-left" href="/wallets/gas-and-asset-management/assets/transaction-event-webhooks">
    Track transaction status changes.
  </Card>

  <Card title="REST API" icon="code" href="/wallets/gas-and-asset-management/assets/fetch-a-transaction">
    Query transactions and balances.
  </Card>
</CardGroup>

## Gas management

Gas sponsorship removes the need for wallets to hold native tokens for fees, creating a frictionless experience without the complexity of managing gas yourself.

Your app can combine gas sponsorship with [policies](/controls/policies/overview) to control which wallets can use sponsored gas and for what transaction types.

<CardGroup cols={2}>
  <Card title="Gas sponsorship overview" icon="gas-pump" href="/wallets/gas-and-asset-management/gas/overview">
    Learn how gas sponsorship works.
  </Card>

  <Card title="Setup guide" icon="gear" href="/wallets/gas-and-asset-management/gas/setup">
    Configure gas sponsorship for your app.
  </Card>
</CardGroup>

## Funding

Privy supports multiple ways for users to fund their wallets, including card payments, wallet transfers, exchange withdrawals, and bank transfers.

Your app can configure which methods are available and prompt users to fund directly in the interface.

<CardGroup cols={2}>
  <Card title="Funding overview" icon="money-bill" href="/wallets/funding/overview">
    Explore all funding methods.
  </Card>

  <Card title="Configuration" icon="sliders" href="/wallets/funding/configuration">
    Set up funding for your app.
  </Card>
</CardGroup>

## Manual approvals

Manual approvals adds a human review step before sensitive actions take effect. Team members in the Privy Dashboard can review, approve, or reject proposed changes to wallets, policies, signatures, and transactions.

<CardGroup cols={2}>
  <Card title="Manual approvals overview" icon="table-columns" href="/controls/dashboard/overview">
    Set up human-in-the-loop review for resource updates and transactions.
  </Card>

  <Card title="Propose intents" icon="file-signature" href="/controls/dashboard/intents">
    Propose intents for team review and approval.
  </Card>
</CardGroup>
\n