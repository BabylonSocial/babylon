> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Funding via exchange

The **transfer from exchange** funding option lets users purchase or transfer assets from an existing Coinbase exchange account through [Coinbase Onramp](https://www.coinbase.com/developer-platform/products/onramp) embedded within your app. Coinbase processes the purchase or transfer and delivers crypto to the user's wallet. If users have already completed KYC and identity verification with Coinbase for their Coinbase account, they will not need to do so again, streamlining their asset purchase/transfer experience.

If a user chooses Coinbase Onramp, Privy opens a Coinbase pop-up with the [amount](/wallets/funding/configuration#set-a-default-chain-and-amount) configured in the Dashboard. Coinbase processes the purchase or transfer. The window closes after completion and users can continue in your app.

Please note that these purchases are not immediate and it may take a few minutes for funds to arrive in your user's wallet.

<Warning>
  Transfers and purchases via exchange on-ramps (e.g. Coinbase Onramp) are only supported on
  mainnets. On testnets (e.g. Polygon Amoy, Sepolia), on-ramps cannot purchase testnet tokens, so
  this flow will not be shown or will fail.
</Warning>

<Info>
  When transferring from an exchange, users can fund their accounts with a network's native currency (e.g. ETH, SOL) or USDC on Coinbase Onramp's [supported networks](https://docs.cdp.coinbase.com/get-started/supported-networks).

  Note that not all payment methods are available in all regions due to local regulations. See [this guide](https://docs.cdp.coinbase.com/onramp/docs/payment-methods/) for more information on which payment methods are supported in which regions.
</Info>
\n