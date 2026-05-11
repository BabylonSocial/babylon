> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Webhooks

Privy emits webhooks for custodial wallet events, enabling your app to stay synchronized with wallet state and transaction lifecycle. Custodial wallets support both balance and transaction webhooks.

<Info>
  Webhooks can be tested at no cost in development environments. To enable webhooks in production,
  upgrade to the Enterprise plan in the Privy Dashboard.
</Info>

### Transaction events

You can subscribe to transaction status updates via webhooks. For complete details on transaction webhook events, payloads, and setup, see the [transaction event webhooks documentation](/wallets/gas-and-asset-management/assets/transaction-event-webhooks).

### Balance events

You can subscribe to balance change events when funds are deposited or withdrawn via webhooks. For complete details on balance webhook events, payloads, and setup, see the [balance event webhooks documentation](/wallets/gas-and-asset-management/assets/balance-event-webhooks).

<Info>
  If the deposit is an outcome of orchestration via a known provider (e.g. onramp, a refund from a
  failed offramp attempt, or indirect deposit from another crypto wallet), the
  `wallet.funds_deposited` [webhook
  payload](/wallets/gas-and-asset-management/assets/balance-event-webhooks#payload) would include an
  additional `bridge_metadata` field with orchestration details:
</Info>

<Expandable title="bridge_metadata attributes" defaultOpen="true">
  <ResponseField name="method" type="'virtual_account' | 'liquidation_address' | 'transfer'" required>
    Method used to orchestrate the deposit.
  </ResponseField>

  <ResponseField name="type" type="'fiat_deposit' | 'crypto_deposit' | 'refund'" required>
    Type of the orchestration. `fiat_deposit` for onramp from fiat, `crypto_deposit` for deposit
    from crypto, and `refund` for a refund from a failed offramp attempt.
  </ResponseField>

  <ResponseField name="activity_id" type="string">
    ID of the activity that caused the deposit. Only applicable when `method` is `virtual_account`.
  </ResponseField>

  <ResponseField name="transfer_id" type="string">
    ID of the transfer that caused the deposit. Only applicable when `method` is `transfer`.
  </ResponseField>

  <ResponseField name="liquidation_address_id" type="string">
    ID of the liquidation address that caused the deposit. Only applicable when `method` is
    `liquidation_address`.
  </ResponseField>

  <ResponseField name="drain_id" type="string">
    ID of the drain event of the deposit. Only applicable when `method` is `liquidation_address`.
  </ResponseField>

  <ResponseField name="source_wallet_address" type="string">
    Address of the source wallet that initiated the deposit. Only applicable when `method` is
    `transfer` or `liquidation_address`.
  </ResponseField>

  <ResponseField name="original_transaction_hash" type="string">
    Hash of the original transaction that caused the offramp attempt. Only applicable when `type` is
    `refund`.
  </ResponseField>

  <ResponseField name="virtual_account_id" type="string">
    ID of the virtual account that caused the deposit. Only applicable when `method` is
    `virtual_account`.
  </ResponseField>
</Expandable>

<Accordion title="Example: Onramp from fiat deposit via virtual account">
  ```json  theme={"system"}
  {
    "event": "wallet.funds_deposited",
    "data": {
      "amount": "2340000",
      "asset": {
        "address": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
        "type": "erc20"
      },
      "bridge_metadata": {
        "activity_id": "dbd8b3ce-b7cc-4bc9-8e99-adf8defbb25d",
        "method": "virtual_account",
        "type": "fiat_deposit",
        "virtual_account_id": "bf187db1-1bd5-4716-81d3-e51b01e3637d"
      }
    }
    ...
  }
  ```
</Accordion>

## Next steps

<CardGroup>
  <Card title="Transaction event webhooks" icon="webhook" href="/wallets/gas-and-asset-management/assets/transaction-event-webhooks">
    Complete guide to transaction lifecycle webhooks
  </Card>

  <Card title="Funding" icon="money" href="/wallets/custodial-wallets/advanced/funding">
    Complete guide to using Bridge to onramp and offramp funds from your Privy custodial wallets
  </Card>

  <Card title="Balance event webhooks" icon="scale-balanced" href="/wallets/gas-and-asset-management/assets/balance-event-webhooks">
    Complete guide to balance change webhooks
  </Card>
</CardGroup>
\n