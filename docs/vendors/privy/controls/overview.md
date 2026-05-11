> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Policies & controls

Privy’s wallet system provides a layered control model that defines who can authorize actions and how wallets behave. These controls are built into the architecture of Privy wallets and help teams design secure, predictable flows without adding friction for users.

## Security without compromise

Privy wallets are designed with [security](/security/overview) at their core. Our approach uses a combination of key splitting (Shamir's secret sharing) and private key reconstitution in [secure execution environments](/security/wallet-infrastructure/secure-enclaves) to ensure that only authorized parties can access their wallets. Wallets remain fully non-custodial and users ultimately have full control over their assets.

## Flexible owner configurations

Privy’s control model allows you to specify exactly who can approve different types of actions. Quorums can include users, authorization keys, or both, enabling patterns such as:

* **User-controlled wallets**: The user approves everything.
* **Delegated permissions**: Users grant limited, scoped authorization to the application.
* **Application-managed control**: Services approve operational actions under strict policies.
* **Shared control**: Multiple parties must sign off on sensitive operations.

These configurations allow you to align wallet ownership with your product's risk and UX requirements.

## Programmable policies

Policies define the actions a wallet is allowed to take. They operate as key-level enforceable guardrails, ensuring wallets behave only as your application intends.

By default, the trusted execution environment (secure enclave) enforces policies when processing wallet actions, such as signature requests, transactions, and key export. The enclave evaluates policy rules in a tamper-proof environment before any operations proceed. Privy enforces some policies at the API level. For example, limiting transfer sizes requires transaction simulation which runs outside the enclave today.

* **Transaction limits**: Set maximum amounts that can be transferred.
* **Approved destinations**: Specify recipients where funds can be sent.
* **Contract interactions**: Control which smart contracts can be used.
* **Action parameters**: Define what specific operations are permitted.

Policies help protect users and applications by preventing unauthorized or unintended actions, making them essential for features like payment subscriptions, trading limits, or scheduled transactions.

<img src="https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/Policies.png?fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=1b18efd9275a116faa8528c2f71c8053" alt="images/Policies.png" data-og-width="1843" width="1843" data-og-height="1317" height="1317" data-path="images/Policies.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/Policies.png?w=280&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=da3c4ecb0eaf50dedabc51bbeb65f0db 280w, https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/Policies.png?w=560&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=016ba7fcbf190bdcc0af2695c8b71fc7 560w, https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/Policies.png?w=840&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=0f443e1eb1d86d47f2bfe81709560135 840w, https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/Policies.png?w=1100&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=2492f54d29bc68b3350bd2b71fc9fdae 1100w, https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/Policies.png?w=1650&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=2198e2cc51916cef64ae09e87b778a77 1650w, https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/Policies.png?w=2500&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=aa21bb868b92bdef945cc9d35b004f16 2500w" />

## Enhanced security options

For sensitive wallet operations, Privy supports multi-factor authentication, biometric verification, and hardware security keys. Learn more about [configuring MFA](/authentication/user-authentication/mfa/overview).

## Getting started

To learn more about implementing specific controls and policies for your application, explore our detailed documentation on wallet [policies](/controls/policies/overview) and [controls](/controls/authorization-keys/owners/overview).
\n