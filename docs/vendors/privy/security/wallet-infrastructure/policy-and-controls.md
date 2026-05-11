> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Wallet policies and controls

Privy's wallet API is secured with tamper-proof cryptographic authorization and a powerful, intuitive policy engine. This means that the trusted execution environment (secure enclave) will only act on requests issued by authorized parties, and only specific permitted actions may be processed.

<Tip>
  Privy wallets are non-custodial and have a fully programmable control model. Privy's flexible
  configuration enables the full custody spectrum from user-custodial wallets to powerful
  service-controlled accounts.
</Tip>

## Authentication and authorization

### Authorization keys

Requests to Privy [wallet API](/security/wallet-infrastructure/architecture) endpoints are protected by **authorization keys**. This requires the secure enclave to verify a signature from the required authorization key before executing any requests. [Learn more](/controls/authorization-keys/overview)

Privy uses [P-256](https://neuromancer.sk/std/nist/P-256) (also known as secp256r1) asymmetric keys for authorization keys. When you register a key:

* The private key is generated on your device, and is only ever known to your app. **Neither Privy nor the enclave ever sees the P-256 private key, and cannot sign payloads with it.**
* The public key is registered with the enclave, and is used to verify signatures produced by your servers.

The authorization signature is a signature generated over the body and all critical parameters of each request. This authorization signature guarantees the enclave only processes verified requests. The enclave verifies the signature against the corresponding authorization public key registered for the wallet before executing any wallet actions.

### Powerful, flexible controls

Authorization keys enable a fully configurable control model for wallets. This includes the full spectrum from user-custodial wallets to powerful service-controlled accounts.

When you create a wallet, you specify its **owner**, which is the key (or key quorum) that controls the wallet. By default, this key is also required to authorize wallet actions, such as generating signatures or transacting funds.

This wallet ownership model is extremely flexible. It enables you to configure, e.g:

* **Fully user self-custodial wallets**, using an [authorization key tied to the user's authentication method](/security/authentication/authenticated-signers) as the authorization key
* **Fully user self-custodial wallets**, using the user's passkey as the authorization key
* **Service-controlled wallets**, using an authorization key that is held by your service
* **Multi-sig wallets**, using a quorum of authorization keys held by different parties

### Key quorums

Privy enables your app to require quorum approvals on wallet actions, so that signatures from m-of-n authorization keys are required in order to take action using the wallet. Key quorums are defined by a list of authorization public keys and a threshold required for approval. [Learn more](/controls/quorum-approvals/overview)

### Multi-factor authentication

Privy enables native multi-factor authentication for wallet actions. This means your app can require additional verification for sensitive wallet operations using:

* Authenticator apps (TOTP)
* Biometric verification (passkeys)
* SMS confirmation
* Hardware security keys

Multi-factor authentication is enforced via [authenticated signers](/security/authentication/authenticated-signers). Learn more about configuring multi-factor authentication for your app [here](/authentication/user-authentication/mfa).

## Policies

Privy's policy engine allow your application to **restrict the actions that can be taken with wallets**. This is important for features such as payment subscriptions, stop and limit orders, or scheduled transactions.

Policies allows you to configure transfer limits, allowlists and denylists of transfer recipients, allowlists and denylists of smart contracts and programs, and even constraints around calldata that can be passed to smart contracts.

By default, the trusted execution environment (secure enclave) enforces policies when processing wallet actions, such as signature requests, transactions, and key export. The enclave evaluates policy rules in a tamper-proof environment before any operations proceed. Privy enforces some policies at the API level. For example, limiting transfer sizes requires transaction simulation which runs outside the enclave today.

This ensures that wallets can only ever be used to take actions your application intends to take.

Learn more about configuring policies [here](/controls/policies/overview).

<img src="https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/policy-splash.png?fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=989f6a61de268b5e232a8b8401d77737" alt="Managing policies in the Privy Dashboard" data-og-width="1192" width="1192" data-og-height="852" height="852" data-path="images/policy-splash.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/policy-splash.png?w=280&fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=7bf0ceb9a0d4646bb7f0478f6788e68c 280w, https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/policy-splash.png?w=560&fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=7de15091f47ede52324d91ffe9ae796e 560w, https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/policy-splash.png?w=840&fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=771e517bf3b5814336a0b8917bdbe51d 840w, https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/policy-splash.png?w=1100&fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=94d10f809f89f639e2258aec613aca7f 1100w, https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/policy-splash.png?w=1650&fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=be5ff30c16cc8eed4860351d903e81d1 1650w, https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/policy-splash.png?w=2500&fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=57d63fe2e9f470ca977ecb1a0634488b 2500w" />
\n