> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Overview

Common flows to create self-custodial user wallets include:

* **Creating wallets with a user owner.** This configures wallets such that users are the only entity that can update policies, add additional signers, export the wallet, or change the wallet's owner. If you create wallets via one of Privy's client-side SDKs, your app's wallets are automatically created with user owners.
* **Creating wallets with a *1-of-n* key quorum, where one member of the key quorum is the user**. This gives users full permissions over their wallet, while enabling other parties to easily update wallets (e.g. policies and signers) and take actions with them.

You can extend self-custodial user wallets to support various use cases, as outlined below.

<CardGroup cols={3}>
  <Card title="Offline actions" icon="signal" href="/controls/authorization-keys/owners/configuration/user/offline">
    Take actions with wallets while users are offline, such as limit orders, agentic trading, and
    portfolio rebalancing.
  </Card>

  <Card title="Multi-party approvals" icon="lock" href="/controls/authorization-keys/owners/configuration/user/dual-approval">
    Require that both users and servers sign transaction requests.
  </Card>

  <Card title="Send transactions from your server" icon="money-bill-1" href="/controls/authorization-keys/owners/configuration/user/server-transactions">
    Send transactions from your server for increased control over transaction flows.
  </Card>

  <Card title="Update wallets from your server" icon="wallet" href="/controls/authorization-keys/owners/configuration/user/server-updates">
    Update the policies and signers assigned to wallets from your server, even when users are
    offline.
  </Card>

  <Card title="Export wallets from your server" icon="key" href="/controls/authorization-keys/owners/configuration/user/server-export">
    Export wallets from your server to enable users to recover their account outside of your core
    application.
  </Card>
</CardGroup>
\n