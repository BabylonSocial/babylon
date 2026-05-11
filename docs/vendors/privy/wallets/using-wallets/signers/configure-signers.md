> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Configure signers

Follow the guide below to configure signers your app can use to transact on user's embedded wallets.

## 1. Create a key quorum

Fundamentally, a signer is a [key quorum](/controls/authorization-keys/overview) that is authorized to submit transaction request for signature from a user's wallet.

You can create key quorums in the [Privy Dashboard](https://dashboard.privy.io//apps?page=authorization-keys) or via an [API request](/api-reference/key-quorums/create),

To generate a key quorum in the [Dashboard](https://dashboard.privy.io//apps?page=authorization-keys), navigate to the **Wallet infrastructure > Authorization keys** page and click on the **Create new key** button. The modal will show the key quorum ID and the private key used for signing.

Save both these values in a secure location. **Privy never sees this private key and cannot help you recover it.** The private key will be used to sign transaction requests on the wallet.

<Info>
  The **authorization key** is the private key of a P-256 keypair. Privy never sees the private key,
  and verifies signatures on your requests against the corresponding public key to ensure your
  server authorizes the action to take with a user's delegated wallet.
</Info>

## 2. Create policies to configure permissions \[optional]

Signers can also have policies that any transaction must satisfy to be signed by the wallet. To configure permissions to control what kinds of actions your app can take with users wallets, set up [policies](/controls/policies/overview) in your Privy dashboard under **Wallet infrastructure > Policies**.

## 3. Add the signer to the wallet

To use signers, the owner of a wallet must first grant consent for your app to take certain actions on their behalf. To have owners grant consent, follow the guides below depending on the SDK(s) you integrate.
\n