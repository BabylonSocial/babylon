> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Enabling server-side access to user wallets

Privy's [control abstractions](/controls/overview) allow you to interact with wallets from your app's server, even without the user in the loop. These interactions can be restricted by policies that configure the scope of actions that can be taken without user authorization.

This supports several use cases, such as:

* executing transactions when a user is offline, e.g for limit orders, agentic trading, portfolio rebalancing, etc.
* updating wallets when a user is offline, such as updating policies or assigning specific permissions to third-parties
* requiring both users and servers to approve user transactions

and more.

Learn more about how to configure wallets for server-side access in the **Policies & controls** section of the docs.

<Card title="Enabling server-side access" href="/wallets/using-wallets/signers/overview" icon="server">
  Enable server-side access to user wallets to support offline transactions, offline updates, custom
  approval configurations, and more.
</Card>
\n