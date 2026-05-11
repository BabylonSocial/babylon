> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Using owners

Owners control resources in the Privy API, allowing them to modify or take actions with resources, such as updating a policy or sending a transaction with a wallet. Signers have the ability to send transactions from a given wallet within the scope of certain policies.

Learn more about using owners and signers below.

### Owners

To assign an owner to a resource, pass the owner's identifier (authorization key, user ID, or key quorum ID) in the `owner` field of the resource. If the resource is a wallet, set the wallet's `policy_ids` to set the policy that the `owner` should be subject to.

Once an owner is set on a resource:

* The owner must sign all updates or deletions of the resource.
* If the resource is a wallet, the owner must sign signature or transaction requests to the Privy API and is subject to the policies set on the wallet.

### Signers

Signers enable setting different permissions that different parties can take with a given wallet. To attach a signer to a resource, add a new entry in the `additional_signers` array with the key quorum ID of your signer. You can then set `override_policy_ids` that apply to this specific signer. This enables you to set specific policies for certain key quorums over the same wallet.
\n