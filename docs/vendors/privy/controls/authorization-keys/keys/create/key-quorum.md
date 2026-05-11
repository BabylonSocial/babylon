> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Key quorums

An owner or a signer is known as a key quorum. It can be composed of a mix of [users](/controls/authorization-keys/keys/create/user/overview), [authorization keys](/controls/authorization-keys/keys/create/key), and other key quorums (one level deep).

Key quorums have an authorization threshold that defines how many keys in the quorum must sign a request for the aggregated signature to be valid. You can use key quorums to implement use cases such as:

* Allowing users *or* apps to sign requests from user wallets
* Requiring both users *and* apps to sign requests from user wallets
* Requiring a distributed set of authorization keys to sign requests from a wallet
* Hierarchical approval structures with nested quorums

Learn more about key quorums in the [**Key quorums**](/controls/key-quorum/overview) section.

<Tip>
  Key quorums are an advanced integration. To determine if key quorums are right for your use case,
  please [reach out](https://privy.io/slack).
</Tip>
\n