> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Quorum approvals

If your business needs multiple parties to be able to approve updates to or actions taken by wallets, the most common setup is to set up a [key quorum](/controls/key-quorum/overview) consisting of a set of multiple [authorization keys](/controls/authorization-keys/keys/create/key) or [users](/controls/authorization-keys/keys/create/user/overview) in your authentication system.

<img src="https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/owner-setups/quorum.png?fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=a65b82a9df67965ebc6219a84979ad37" alt="quorum approval" data-og-width="5529" width="5529" data-og-height="3949" height="3949" data-path="images/owner-setups/quorum.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/owner-setups/quorum.png?w=280&fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=29fb8d11469bdea77f6ab33a04e15401 280w, https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/owner-setups/quorum.png?w=560&fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=e4f6faedb48d53702a49926f5d85afc1 560w, https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/owner-setups/quorum.png?w=840&fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=1c9407844b34cfa16030f8ba94798764 840w, https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/owner-setups/quorum.png?w=1100&fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=11e9302738bde727a4021422bc1e6ee9 1100w, https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/owner-setups/quorum.png?w=1650&fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=82a4a1dfcf568aacef2b1cbfd927bab3 1650w, https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/owner-setups/quorum.png?w=2500&fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=1f91df9fa159b0549c47985b18e29f93 2500w" />

You can define the quorum such that a certain number of members of the quorum must approve actions to wallets. This is known as the quorum's **authorization threshold**. Privy's TEE infrastructure enforces that at least that many members of the quorum must sign the request to take an action with a wallet. To allow multiple parties to unilaterally approve wallet actions, you can set this threshold to 1.

Quorum approvals allow your app to create setups where multiple parties must sign-off on actions taken by wallets, enhancing security for sensitive operations.

Key quorums can also include other key quorums as members (one level deep). This enables hierarchical approval structures. For example, a "Security Team" quorum can nest inside a broader "Org Admins" quorum. Once the nested quorum meets its own authorization threshold, it counts as one approval toward the parent quorum's threshold.

Learn more about configuring quorum approvals below.

<Card title="Key quorums" href="/controls/key-quorum/overview" icon="diagram-project">
  Use key quorums to configure quorum approvals on wallet actions.
</Card>
\n