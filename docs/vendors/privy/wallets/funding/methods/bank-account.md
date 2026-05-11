> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Funding via bank account

<Info>Funding via bank account is currently available server-side in your app.</Info>

The **withdraw from bank account** funding option lets users convert fiat funds from a bank account into crypto through an onramp provider. Users make a bank transfer (ACH, wire, SEPA) to the provider, and the provider converts the funds into crypto and deposits it into the user's wallet.

### Process overview

1. The user **submits KYC information** to the onramp provider through the provider flow surfaced in the app.
2. The user **initiates an onramp transaction** and **makes a bank transfer** to the onramp provider.
3. Once fiat funds are received, the provider **converts the funds into crypto and deposits** it into the user's wallet.

### Providers

Below are the providers that currently support bank transfer funding via Privy, with links to a respective step-by-step integration guide and the regions supported. More support and providers coming soon!

* **Bridge** [(integration guide)](/recipes/bridge-onramp): supports ACH, wire, and SEPA funding in the US and Europe.
\n