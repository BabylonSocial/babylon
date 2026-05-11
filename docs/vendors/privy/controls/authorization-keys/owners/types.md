> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Types of owners & signers

There are three types of owners & signers: [**users**](/controls/authorization-keys/owners/types#users), [**authorization keys**](/controls/authorization-keys/owners/types#authorization-key), and [**key quorums**](/controls/authorization-keys/owners/types#key-quorum)

### Users

**Users** of your application can own and take actions with wallets and are represented by the Privy user ID. Users can be assigned to resources or can take actions with wallets by including their user ID in the API request.

<Tip>
  You can create user self-custodial wallets by setting a user as the owner of the wallet, whether
  you use your own existing authentication provider or Privy as your authentication provider.
</Tip>

### Authorization keys

**Authorization keys** are P256 cryptographic keys that allow any party that controls the key to take actions with associated wallets. You can assign authorization keys to a resource or execute actions with authorization keys by signing the request with the respective private key.

Common examples of authorization keys include:

* app keys, which are controlled by your app's server, allowing your app to execute requests
* a biometric key or passkey, following the [WebAuthn](https://webauthn.io/) standard, which allow users to easily sign and execute requests with a P256 key

### Key quorums

Owners and signers can also be composed of a mix of users and authorization keys. This is known as a **key quorum**.

Key quorums have an authorization threshold that defines how members of the quorum must sign a request for the aggregated signature to be valid. You can use key quorums to implement use cases such as:

* Allowing users *or* apps to sign requests from user wallets
* Requiring both users *and* apps to sign requests from user wallets
* Requiring a distributed set of authorization keys to sign requests from a wallet

<Tip>
  Key quorums are an advanced integration. To determine if key quorums are right for your use case,
  please [reach out](https://privy.io/slack).
</Tip>
\n