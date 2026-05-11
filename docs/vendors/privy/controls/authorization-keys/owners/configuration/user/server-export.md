> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Exporting wallets from your server

Many apps want the server to to have the ability to export the private key for a user's wallet. This can be used to self-host a recovery site where users can export their private key outside of your core application.

To enable this, Privy generally recommends:

<Steps>
  <Step title="Create a wallet with a 1-of-k key quorum">
    Create your wallet with a *1-of-k* key quorum, whose members include at least a **user** and an
    **authorization key** controlled by your server. You can do this via Privy's [REST
    API](/wallets/wallets/create/create-a-wallet).
  </Step>

  <Step title="Export the wallet from your server">
    As a satisfying member of the key quorum that owns the wallet, **your server's authorization key
    can unilaterally export the wallet**. Follow [this guide](/wallets/wallets/export) to export the
    private key for your user's wallet from the server.
  </Step>
</Steps>
\n