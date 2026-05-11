> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Fetch transaction via webhook

**Privy emits webhooks whenever the status of a transaction sent by a wallet changes.** This helps your application track the status of the transaction after it has been broadcasted to the network, and be notified when the transaction is confirmed or reverts.

<Info>
  Webhooks can be tested at no cost in development environments. To enable webhooks in production,
  upgrade to the Enterprise plan in the Privy Dashboard.
</Info>

To set up transaction webhooks, follow the guide below.

## Setup

Go through our [webhooks setup guide](/api-reference/webhooks/overview#registering-an-endpoint)
first, and make sure you enable the transaction events you want.

Privy will emit a signed webhook to this URL whenever your wallets
sends/receives a transaction for a registered asset, and will retry delivery if
the endpoint does not successfully respond to the original webhook.
Go through the [webhooks reference](/api-reference/webhooks/overview#webhook-delivery)
for details on how delivery, idempotency, and retries work.

## Events reference

<Info>
  Failures are uncommon overall, but more likely to occur on Base and Polygon than other chains
  (\<1% of transactions). To ensure transactions get confirmed, follow our guide on [transaction
  replacement](/recipes/speeding-up-transactions) to speed up stalled transactions.
</Info>

* [Transaction broadcasted](/api-reference/webhooks/transaction/broadcasted) refers to when a transaction has been submitted to the network but has not yet been included in a block.
* [Transaction still pending](/api-reference/webhooks/transaction/still_pending) refers to when a transaction has been submitted to the network but is taking longer than expected to be confirmed. To ensure that the transaction gets included, listen to this webhook to trigger [transaction speed-ups](/recipes/speeding-up-transactions).
* [Transaction confirmed](/api-reference/webhooks/transaction/confirmed) refers to when a transaction has been included in at least one block that has been confirmed on the network.
* [Transaction execution reverted](/api-reference/webhooks/transaction/execution_reverted) refers to when a transaction has reverted in execution.
* [Transaction replaced](/api-reference/webhooks/transaction/replaced) refers to when a transaction has been replaced by another transaction with the same nonce. This is only applicable to EVM chains.
* [Transaction failed](/api-reference/webhooks/transaction/failed) refers to when a transaction has been pending for too long, signaling that it will not be included on-chain. This can happen when the gas fee is too low given the current activity on the blockchain and is only triggered for chains that have a defined pending time limit (e.g. Base, Solana, Flow).
* [Transaction provider error](/api-reference/webhooks/transaction/provider_error) refers to when a custodial wallet transaction request has been rejected by the custodian or encountered an error. This can happen when attempting to spend funds that haven't been fully screened by the custodian yet, or when a transaction does not meet the custodian's compliance requirements.
\n