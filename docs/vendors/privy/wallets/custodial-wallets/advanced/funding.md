> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Funding

Just like for non-custodial wallets, you can fund custodial wallets through a number of [different methods](/wallets/funding/overview). Most commonly, you would use Bridge to onramp and offramp funds from your Bridge-custodied wallets. Below is our recommended setup for using Privy custodial wallets with Bridge orchestration:

## Types of conversions

### Fiat to stablecoin

To onramp funds from a bank account to your Privy custodial wallet, you can use either of the following methods:

* [Virtual account](https://apidocs.bridge.xyz/platform/orchestration/virtual_accounts/virtual-account): Permanent, reusable fiat deposit addresses that convert incoming fiat into stablecoins, directly deposited into the Privy custodial wallet.
* [Transfers](https://apidocs.bridge.xyz/platform/orchestration/transfers/transfer): Generate deposit instructions for the sender. Once the sender completes the deposit, the stablecoins are deposited into the Privy custodial wallet.

### Stablecoin to stablecoin

When funding from another wallet via a different chain or asset, you can use [liquidation addresses](https://apidocs.bridge.xyz/platform/orchestration/liquidation_address/liquidation_address) to convert the funds into the desired stablecoin and deposit them into the Privy custodial wallet.

### Stablecoin to fiat

To offramp funds from your Privy custodial wallet to a bank account, use the Bridge [transfers API](https://apidocs.bridge.xyz/platform/orchestration/transfers/transfer) to generate onchain deposit instructions for the Privy custodial wallet. Once funds have been sent from the wallet, the funds will land in the bank account provided.

## Payout flow

When sending funds out of the Privy custodial wallet using Bridge orchestration to either an onchain destination or bank account, the flow uses both the Bridge API and Privy API:

1. Call the Bridge [transfers API](https://apidocs.bridge.xyz/platform/orchestration/transfers/transfer) to generate the `source_deposit_instructions` for the Privy custodial wallet.
2. Use Privy to [send the funds](/wallets/custodial-wallets/sending-funds) from the Privy custodial wallet to `source_deposit_instructions.address`.
3. Wait until funds have been converted to the desired destination asset and location (e.g. onchain or bank account).

<Tip>
  If an offramp is unsuccessful, the funds will be returned onchain. You can listen to deposit
  webhooks to know whether a deposit is because of an offramp refund by checking the
  `bridge_metadata` field. See the [webhooks
  documentation](/wallets/custodial-wallets/advanced/webhooks) for more details.
</Tip>

## Next steps

<CardGroup>
  <Card title="Webhooks" icon="webhook" href="/wallets/custodial-wallets/advanced/webhooks">
    Monitor wallet events and transaction status
  </Card>

  <Card title="Send funds" icon="paper-plane" href="/wallets/custodial-wallets/sending-funds">
    Execute transactions from custodial wallets
  </Card>
</CardGroup>
\n