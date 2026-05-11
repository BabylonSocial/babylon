> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Off-ramping with Privy

Privy provides integrations with third-party off-ramp providers so users can convert crypto to fiat through those providers. Providers handle payouts and fiat movement. Whether your app uses a seamless widget experience or a pure API solution, Privy's flexible integration options ensure users can convert crypto to cash with minimal friction.

These integrations allow users to complete provider off-ramp flows without leaving your app.

## Off-ramping with Privy

<Steps>
  <Step title="User has assets in their wallet">
    Assets are stored in the user's Privy wallet and are ready for off-ramp
  </Step>

  <Step title="Integration and setup">
    Add your chosen off-ramp provider's SDK to your application, configure it with your API keys,
    and allow users to trigger withdrawals via the provider's interface
  </Step>

  <Step title="User verification">
    User completes the provider's KYC process (only required once) and connects their bank account
    through the provider's secure interface
  </Step>

  <Step title="Transaction and payout">
    Your app uses Privy SDKs to request a signed onchain transfer to the provider address. The
    provider processes the transfer and sends fiat to the user's bank account
  </Step>
</Steps>

Privy supports off-ramp integrations with several third-party providers. Select which provider to use and follow the instructions to integrate.

| Provider     | Off-Ramp Documentation                                                                               |
| ------------ | ---------------------------------------------------------------------------------------------------- |
| Coinflow     | [Coinflow off-ramp docs](https://docs.coinflow.cash/docs/how-withdraws-work)                         |
| MoonPay      | [MoonPay off-ramp docs](https://dev.moonpay.com/v1.0/docs/off-ramp-overview)                         |
| Ramp Network | [Ramp Network off-ramp docs](https://docs.ramp.network/off-ramp)                                     |
| Coinbase     | [Coinbase off-ramp docs](https://docs.cdp.coinbase.com/onramp/docs/api-offramp-overview)             |
| Hifi         | [Hifi off-ramp docs](https://docs.hifibridge.com/docs/api-offramp)                                   |
| Bridge       | [Bridge off-ramp docs](https://apidocs.bridge.xyz/get-started/guides/move-money/offramp_liquidation) |

## Sending assets from a Privy wallet

Assets can be sent to an off-ramp provider using Privy SDKs to sign and submit a transaction on Ethereum or Solana. Learn more about sending transactions with Privy below:

* [Ethereum](https://docs.privy.io/wallets/using-wallets/ethereum/send-a-transaction)
* [Solana](https://docs.privy.io/wallets/using-wallets/solana/send-a-transaction)
\n