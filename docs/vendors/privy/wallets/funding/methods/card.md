> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Funding via card, Apple Pay, and Google Pay

export const CardOnrampMainnetOnly = () => <Warning>
    Card and fiat on-ramp purchases are supported on mainnets only. On testnets (e.g. Polygon Amoy,
    Sepolia), on-ramps cannot purchase testnet tokens, so this flow will not be shown or will fail.
  </Warning>;

<Note>
  Users must be authenticated through Privy to make use of card funding methods. In other words a
  valid access token is required for the user to proceed with card funding.
</Note>

The **pay with card** funding option enables users to purchase assets with a debit card, including with browser payment rails like **Apple Pay** and **Google Pay**. This is particularly useful for users that may not hold crypto outside of your application and are purchasing crypto for the first time.

Privy surfaces card purchase flows from onramp providers like MoonPay or [Coinbase Onramp](https://www.coinbase.com/developer-platform/products/onramp) within your app. These providers process payments and deliver crypto to user wallets. Privy selects a default provider based on payment method, location, and asset. If a purchase fails, users can choose another provider.

Please note that these purchases are not immediate, and depending on the payment method selected by your users, it may take a few days for funds to arrive in your user's wallet. Generally, **paying with debit card over credit card has the highest approval rates** for cryptocurrency purchases. Debit cards can be used with Apple and Google Pay.

<CardOnrampMainnetOnly />

<Info>
  With MoonPay and Coinbase Onramp, users can purchase a variety of assets across different EVM
  networks and Solana. Please view
  [MoonPay's](https://support.moonpay.com/customers/docs/list-of-supported-cryptocurrencies) and
  [Coinbase's](https://docs.cdp.coinbase.com/onramp/docs/api-configurations#fiat-currencies-and-crypto-assets-supported)
  list of supported assets for more information.
</Info>

Please refer to our [recipe](/recipes/card-based-funding) for a step-by-step guide on how to enable card funding in your app.

<Info>
  Due to known issues with Coinbase's native on-ramp configuration, Apple Pay may not always be
  surfaced after selecting "Confirm and Purchase" through the Coinbase on-ramp for Pay with Card.
  Please contact Coinbase for further assistance.
</Info>
\n