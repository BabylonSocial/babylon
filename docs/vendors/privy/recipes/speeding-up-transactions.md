> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Speeding up transactions on EVM chains

> Learn how to use webhooks to trigger replacement transactions to speed up transaction confirmation.

# Overview

When you send a transaction using Privy, we broadcast it to the specified blockchain. However, in periods of high network congestion, the transaction may take longer than expected to be confirmed, or occasionally even never make it to confirmation.
This is due to transaction fee ("gas") estimates becoming outdated as high blockchain activity puts upward pressure on fees. In order to increase the likelihood of your transaction being confirmed, you can send a transaction that replaces the original one and sets higher gas fees.

**This guide will show you how to use the webhooks feature to know when a transaction is taking longer than expected, and trigger a replacement transaction to speed up confirmation.**

## Prerequisites

* A Privy EVM wallet
* Webhooks enabled for your app

## Step 1: Set up webhooks for `transaction.still_pending`

To start, follow the setup instructions for [Webhooks](/wallets/gas-and-asset-management/assets/transaction-event-webhooks) From the dropdown menu, select the `transaction.still_pending` event.

## Step 2: Implement the webhook handler

When a transaction is taking longer than expected, Privy will emit a webhook to the destination URL you provided. Here is an example of the webhook payload:

```json  theme={"system"}
{
  "caip2": "eip155:8453",
  "transaction_hash": "0x28f0ae628c08b7a341cd49ea40225d54ddd5acfe5f7ccfb44ee0be154d17bab0",
  "transaction_id": "b2ua14lrsfj2kq8r8mlm9z07",
  "transaction_request": {
    "chain_id": 8453,
    "gas_limit": "0x5208",
    "max_fee_per_gas": "0xadc0e",
    "max_priority_fee_per_gas": "0xf4240",
    "data": "0x....",
    "nonce": 0,
    "to": "0x38Bc05d7b69F63D05337829fA5Dc4896F179B5fA",
    "type": 2,
    "value": "0x0"
  },
  "type": "transaction.still_pending",
  "wallet_id": "<wallet-id-from-payload>"
}
```

## Step 3: Trigger a replacement transaction

Once you receive the webhook, you can trigger a replacement transaction by submitting a new transaction with the same nonce as the still pending transaction. If you leave out the gas fields, Privy will automatically set them based on the current network conditions.
Below is an example of sending a replacement transaction using Privy's Node SDK. For other ways to send a transaction, see the [guide](/wallets/using-wallets/ethereum/send-a-transaction).

<Info>
  Although you are sending a new transaction, there is **no risk of both transactions getting
  executed** (unintentionally) if the nonce is set to be the same in each. On EVM chains, the nonce
  is an internal counter that is incremented for each transaction sent by a wallet to avoid replay
  and other attack vectors.
</Info>

<CodeGroup>
  ```ts @privy-io/node {skip-check} theme={"system"}
  // payload is from the webhook

  const {hash, transactionId, caip2} = await privy
    .wallets()
    .ethereum()
    .sendTransaction(payload.wallet_id, {
      caip2: payload.caip2,
      params: {
        transaction: {
          to: payload.transaction_request.to,
          value: payload.transaction_request.value,
          data: payload.transaction_request.data,
          nonce: payload.transaction_request.nonce
        }
      }
    });
  ```

  ```ts @privy-io/server-auth {skip-check} theme={"system"}
  // payload is from the webhook

  const {hash, transactionId, caip2} = await privy.walletApi.ethereum.sendTransaction({
    walletId: payload.wallet_id,
    caip2: payload.caip2,
    transaction: {
      to: payload.transaction_request.to,
      value: payload.transaction_request.value,
      data: payload.transaction_request.data,
      nonce: payload.transaction_request.nonce
    }
  });
  ```
</CodeGroup>

This transaction will replace the original transaction and return a new transaction hash and transaction id.

Optionally, to increase the likelihood of the replacement transaction being confirmed, you can set the `max_priority_fee_per_gas` to be a higher value than the original transaction.

## \[Optional] Step 4: Monitor the status of the replacement via webhooks

Subscribe to `transaction.replaced`, `transaction.failed`, and `transaction.confirmed` webhooks to get notified on the success of the speedup.

Once the replacement succeeds, the following webhooks will trigger:

* `transaction.replaced` for the original transaction ID
* `transaction.confirmed` for the speedup transaction

If the replacement failed, a `transaction.failed` webhook would trigger.
For more information on transaction webhooks, see the [correspondent docs](/wallets/gas-and-asset-management/assets/transaction-event-webhooks).
\n