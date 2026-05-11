> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Overview

Privy resources, such as wallets and policies, are controlled or managed by a [**user**](/controls/authorization-keys/owners/types#users), an [**authorization key**](/controls/authorization-keys/owners/types#authorization-key), or a [**key quorum**](/controls/authorization-keys/owners/types#key-quorum). These are collectively referred to as **owners** and **signers**.

At a high-level:

* **Owners** define who has ultimate control over a resource, including the ability to update policies or modify ownership configurations.
* **Signers** are additional parties that can perform actions with a wallet, subject to the policies and permissions applied to them.

Privy’s model allows you to assign different levels of control to different parties and to update these configurations over time. Ownership changes require authorization from an existing owner, ensuring that control is maintained through the same key-level guarantees as any other sensitive action.

Learn more about the differences betweens [**owners**](/controls/authorization-keys/owners/overview#owners) and [**signers**](/controls/authorization-keys/owners/overview#signers) and the [**three types**](/controls/authorization-keys/owners/overview#types) of owners and signers.

## Owners

Generally, owners have full control over a resource in the Privy API. Once assigned to a resource, owners have the ability to **update that resource**. Owners can also **update the owner** for a resource they control, enabling transfer of control over resources.

With wallets, owners have the ability to:

* sign and transact with the wallet (within the scope of the wallet's policies)

* update the policies assigned to a wallet

* update the additional signers assigned to the wallet, and the policies assigned to each signer

* update the owner of the wallet

* export the wallet's private key

* delete the wallet

With policies, owners have the ability to:

* update the rules of the policy
* update the owner of the policy
* delete the policy

## Signers

**Signers**, or **additional signers**, are parties that are given scoped permissions to take actions with a wallet. Signers on a wallet enable use cases like:

* Scoping the permissions for a wallet by a signing authorization key, user, or key quorum
* Taking offline actions on behalf of a user, such as limit orders, agentic trading, and portfolio rebalancing
* Giving scoped permissions to a third-party to take actions on behalf of a wallet

A wallet's owner can add or remove signers on the wallet, and assign policies to each signer to restrict the actions they can take. Signers **cannot update a wallet's owner, signers, or policies** and **cannot export the wallet's private key**. They can only take actions (signatures and transactions) with the wallet subject to their policies.

## Types

Learn more about three types of owners and signers: [**users**](/controls/authorization-keys/owners/types#users), [**authorization keys**](/controls/authorization-keys/owners/types#authorization-key), and [**key quorums**](/controls/authorization-keys/owners/types#key-quorum).

## Permissions

Owners and signers have different permissions over wallets, as outlined below.

|                                 | Owners | Signers |
| ------------------------------- | ------ | ------- |
| Sign messages                   | ✅      | ✅       |
| Send transactions               | ✅      | ✅       |
| Update policies                 | ✅      | ❌       |
| Update owners                   | ✅      | ❌       |
| Update signers                  | ✅      | ❌       |
| Export wallet                   | ✅      | ❌       |
| Can be configured with policies | ✅      | ✅       |
\n