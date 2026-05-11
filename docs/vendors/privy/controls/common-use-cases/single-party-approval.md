> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Single-party approvals

If your business needs a single party to be able to unilaterally approve actions applied to or taken by wallets, the most common setup is to assign an [authorization key](/controls/authorization-keys/keys/create/key) or a [user](/controls/authorization-keys/keys/create/user/overview) in your authentication system as the [owner](/controls/authorization-keys/owners/overview) of the wallet.

<img src="https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/owner-setups/single-party.png?fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=133864e53664a3e7bb126c69ee8dc72c" alt="single party approval" data-og-width="5529" width="5529" data-og-height="3949" height="3949" data-path="images/owner-setups/single-party.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/owner-setups/single-party.png?w=280&fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=d0c835e04093cd7b3cbd928ca90b3ea2 280w, https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/owner-setups/single-party.png?w=560&fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=407355bcc4e9af12d60b6f0d797a26a9 560w, https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/owner-setups/single-party.png?w=840&fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=bf7fe7a0d10ed42d5486397670f9bada 840w, https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/owner-setups/single-party.png?w=1100&fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=7a5194e50702f279aed07c453aaa3469 1100w, https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/owner-setups/single-party.png?w=1650&fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=cdd47eaad3493c4bec84946052d76158 1650w, https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/owner-setups/single-party.png?w=2500&fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=cabb5ab02cdb8f199846bc41c6cc8f38 2500w" />

Privy's TEE infrastructure enforces that all requests to update a wallet (e.g. assign policies or delegate permissions to signers) or take actions with the wallet (e.g. sign messages or send transactions) must be **signed** by the authorization key or a time-bound key associated with your user. If no valid signature is provided on requests, Privy will not execute the action.

Learn more about setting up user-owned wallets below.

<Card title="Configure user-owned wallets" icon="user" href="/controls/authorization-keys/owners/configuration/user/overview">
  Learn how to set up self-custodial wallets owned by users in your authentication system.
</Card>
\n