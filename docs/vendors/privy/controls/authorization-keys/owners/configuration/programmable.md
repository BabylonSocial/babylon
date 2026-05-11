> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Programmable controls

Privy supports creating **wallets** that can be associated with your app, a third-party, or your own notion of a user. Common configurations of wallets are listed below.

### Single party can unilaterally approve actions

If you'd like a single party to be able to unilaterally approve all actions, such as updating a wallet's owner or executing transactions with the wallet, simply **create the wallet with an authorization key controlled by the party as the owner**.

The party can use this authorization key to update the wallet it controls and execute actions with it.

### Multiple parties can unilaterally approve actions

If you'd like one of many parties to be able to unilaterally approve actions, such as updating a wallet's owner or policies, or executing transactions with the wallet, simply **create the wallet with a *1-of-k* key quorum**, whose elements are authorization keys associated with your different parties.

Each party can use its associated authorization key to unilaterally update the wallet and execute actions with it.

### Multiple parties must collectively approve actions

If you'd like authorization from multiple parties to update or take actions with a wallet, **create the wallet with an *m-of-k* key quorum**, where:

* the key quorum is composed of authorization keys, associated with each party that can approve actions
* *m* is defined such that your desired threshold of parties must approve the action

Then, *m* of the *k* parties can use their associated authorization keys to sign requests to update the wallet and execute actions with it. Privy will only execute requests if *m* valid signatures are provided in the request.

### Scoping wallet policies to specific parties

If you'd like multiple parties to be subject to different policies when taking action with a wallet, create the wallet with an "administrator" party as the owner and an additional signers array consisting of each of the parties. For each entry in the additional signer array,

* Set the signer to the party that the policies should be subject to.
* Set the signer's override policies to the policies that should apply to the signer.

Each signer is then subject to the policies associated with them in the additional signers field of the wallet.

### Giving permissions to third parties

If you'd like to give certain signature and transaction permissions to a third-party, create the wallet with:

* an authorization key associated with the primary party as the **owner**
* authorization keys associated with each of the third parties as additional **signers** with any necessary policies

This ensures that the primary party is the only entity that can update the wallet, execute all actions with it, and export private keys, while third-parties can execute actions with the wallet within the scope of their associated policy.
\n