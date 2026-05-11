> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Delegating permissions

Privy wallets' powerful [**owners and signers**](/controls/authorization-keys/owners/overview) abstraction allow your application to configure granular permissions around the actions that various parties can take on wallets. Namely, **owners** have full control over wallets and can delegate permissions to **signers** to execute transactions from the wallet within the scope of a specific [**policy**](/controls/policies/overview).

<img src="https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/owner-setups/delegating-permissions.png?fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=0988be2d2e851395f0acd27e6d4c2d7b" alt="delegate" data-og-width="5529" width="5529" data-og-height="3949" height="3949" data-path="images/owner-setups/delegating-permissions.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/owner-setups/delegating-permissions.png?w=280&fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=449fbf348b133af7629d0efddf737cf9 280w, https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/owner-setups/delegating-permissions.png?w=560&fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=ef493489d5c0893d3e0358b841861d00 560w, https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/owner-setups/delegating-permissions.png?w=840&fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=d8ca3e6a65dad6783306addf88248b3e 840w, https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/owner-setups/delegating-permissions.png?w=1100&fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=c80e3244ffdc98100421fe9bd338652b 1100w, https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/owner-setups/delegating-permissions.png?w=1650&fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=736f309e98bb6cf697c357acef46674a 1650w, https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/owner-setups/delegating-permissions.png?w=2500&fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=a1a472517a474e5409d00d88be294aca 2500w" />

A good rule of thumb is:

* If you need **third-parties to take actions on behalf of your business**, configure your business as the wallet's owner and each of the third-parties as a signer.
* If you need **your business to take actions on behalf of a third-party or a user**, configure the third-party as the wallet's owner and your business as a signer.

Owners and signers can be configured flexibly, including support for unilateral or quorum approvals.

Learn more about delegating permissions with signers below.

<Card title="Owners & signers" href="/controls/authorization-keys/owners/overview" icon="lock">
  Use owners and signers to enforce granular permissions and control models in your application.
</Card>
\n