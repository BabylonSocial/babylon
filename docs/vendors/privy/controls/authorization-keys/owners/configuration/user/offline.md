> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Enabling offline actions

Many apps require taking specified actions with a user's wallets, even when the user is offline. This includes use cases like **limit orders, agentic trading on behalf of users (e.g. with a Telegram bot), or portfolio rebalancing.**

For offline actions, Privy generally recommends:

<Steps>
  <Step title="Create a wallet with a user owner">
    To ensure the wallet can only be updated by the user, create the wallet with a user owner. If
    you use one of Privy's client-side SDKs to create wallets, wallets are created with a user owner
    by default.
  </Step>

  <Step title="Add an authorization key as an additional signer">
    Next, add an authorization key controlled by your server as an additional signer on the wallet.
    You can also configure the additional signer to have a specific set of policies associated with
    it, restricting the actions it can take. You can do this via one of Privy's [client-side
    SDKs](/wallets/using-wallets/signers/overview) or [REST
    API](/wallets/wallets/create/create-a-wallet)
  </Step>

  <Step title="Execute scoped transactions with your additional signer">
    Your additional signer can now execute actions, such as signing messages or sending
    transactions, subject to its policies. These actions can occur while the user is offline.
  </Step>
</Steps>
\n