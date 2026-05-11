> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# null

Privy enables your app to add **signers** to wallets that can take actions within the scope of certain permissions. You can use signers to enable various use cases, like:

* **Offline actions**: execute limit orders or agentic trades even while a user is offline in your app.
* **Recurring actions**: implement subscriptions, portfolio rebalancing, and more.
* **Scoping wallet policies to specific parties**: set specific policies on wallets that apply to specific signers (authorization keys, users, or key quorums)
* **Delegating access to third-parties**: allow third-parties to execute certain actions on behalf of a wallet.

Signers can be added to wallets owned by [users, authorization keys, or key quorums](/controls/authorization-keys/owners/overview).

Privy’s architecture guarantees that a **signer** will never see the wallet's private key. All signing takes place in a secure enclave that only your application can make authorized requests to.

Follow the guides below to provision signers for your users' wallets and enable your app to securely interact with these wallets from your servers.

## Get started

<CardGroup>
  <Card title="Add a signer" icon="stamp" href="/wallets/using-wallets/signers/add-signers">
    Add a signer to a user's wallet and start interacting with the wallet from your servers.
  </Card>

  <Card title="Send transactions from your server" icon="gear" href="/wallets/using-wallets/signers/use-signers">
    Send transactions on behalf of your users from a server environment.
  </Card>
</CardGroup>
\n