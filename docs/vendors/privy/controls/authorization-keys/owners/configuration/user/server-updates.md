> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Updating wallets from your server

Many apps want the server to be able to update a wallet. For example, an app might want to update the policies or signers on a wallet, even with the user offline.

For server-side wallet updates, Privy generally recommends:

<Steps>
  <Step title="Create a wallet with a 1-of-k key quorum">
    Create your wallet with a *1-of-k* key quorum, whose members include at least a **user** and an
    **authorization key** controlled by your server. You can do this via Privy's [REST
    API](/wallets/wallets/create/create-a-wallet).
  </Step>

  <Step title="Update the wallet with your authorization key">
    As a satisfying member of the key quorum that owns the wallet, **your server's authorization key
    can unilaterally update the policies and additional signers assigned to the wallet**. This
    enables your app to update wallet configurations, even when users are offline.
  </Step>
</Steps>
\n