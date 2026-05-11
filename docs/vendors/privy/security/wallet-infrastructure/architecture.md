> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Security architecture

Privy's security architecture combines trusted execution environments (TEEs) with distributed key sharding to protect your users' assets. Simply put:

* Keys are only stored as **encrypted shares distributed across separate security boundaries.**
* Keys are only **temporarily reconstructed within trusted execution environments** when needed for specific operations, under the wallet owner's control.

## Concepts

### Trusted execution environments

Trusted execution environments (TEEs), also known as secure enclaves, are highly restricted, isolated compute environments that allow for secure code execution and cryptographic verification (attestation) of the code being executed. In particular, Privy uses [AWS Nitro Enclaves](https://docs.aws.amazon.com/enclaves/latest/user/nitro-enclave.html).

Privy uses TEEs to support private key reconstruction for the following processor-level guarantees:

* Enclaves have no persistent storage, no interactive access, and no network connectivity, and so provide a secure, isolated compute environment for sensitive data. Private keys for wallets are only accessible within the enclave, and can only be used to produce signatures compliant with the policies attached to the wallet.
* Attestations are cryptographic verifications of the computation run on a TEE. They are signed hashes of code on an enclave that can be verified with the corresponding public key, and can be used to verify actions run within the TEE.

### Key shares

Privy's security model is based on distributed key sharding. This means critical key entropy is split into encrypted shares stored across separate security boundaries.

Key sharding enables future-proof flexibility, strict security isolation, and built-in redundancy. In particular, key sharding enables separate authentication and encryption of each distributed share, enforcing control by wallet owners.

Key sharding and assembly only ever occur within the trusted execution environment. Private keys are split into encrypted shares using a reliable, battle-tested, and fast cryptographic algorithm called [Shamir's secret sharing (SSS)](https://en.wikipedia.org/wiki/Shamir%27s_secret_sharing). No share in isolation provides any information or access to the wallet.

<Info>
  Privy's [`shamir-secret-sharing`](https://github.com/privy-io/shamir-secret-sharing) cryptography
  library is open-source, heavily audited, and used to secure millions of wallets. It is the most
  widely used open-source Typescript library for Shamir's secret sharing.
</Info>

When a wallet is created, it is split into two shares, protected by different security boundaries:

1. **Enclave share**, also referred to as the TEE share, which is secured directly by the trusted execution environment and encrypted with the TEE's cryptographic key. The enclave share can only be decrypted within the TEE.
2. **Auth share**, which is encrypted and stored by Privy. This share is accessible only with valid authentication credentials, e.g. a bearer token or secret, and is sent to the enclave whenever an action is requested from the wallet.

<Frame>
  <img src="https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/security/tee-shares.png?fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=43055667284e4eec7a3bd04d45507280" alt="Trusted execution environment key shares" data-og-width="3686" width="3686" data-og-height="2633" height="2633" data-path="images/security/tee-shares.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/security/tee-shares.png?w=280&fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=34ca61525ed5eca0696df230e35606ac 280w, https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/security/tee-shares.png?w=560&fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=ca9ee03018481aa379e4ce4861e570a7 560w, https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/security/tee-shares.png?w=840&fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=7a769e4bd9ade9386c8c7728c01cf8ff 840w, https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/security/tee-shares.png?w=1100&fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=0ffb6acf152cd9081e852ffb354c4ed7 1100w, https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/security/tee-shares.png?w=1650&fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=abf25a90870d2357a884b3f50e5bb49c 1650w, https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/security/tee-shares.png?w=2500&fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=79aa2d9671518e63c90e1cc141218d64 2500w" />
</Frame>

This is a **2-of-2** share set, which means that *both* shares are required in order to generate signatures. Neither the auth share nor the enclave share in isolation provide any information or access to the wallet.

<Tip>
  Only the TEE can decrypt the enclave share and combine it with the auth share to temporarily
  reconstitute the wallet and execute actions.
</Tip>

## Key management operations

### Wallet creation

When a wallet is created, the trusted execution environment generates strong entropy (128 bits) from a cryptographically secure random number generator (CSPRNG). This is converted to a mnemonic using BIP-39, from which Privy derives the wallet's public key and private key. All Privy wallets are [hierarchical deterministic (HD) wallets](https://help.myetherwallet.com/en/articles/5867305-hd-wallets-and-derivation-paths).

Immediately after creation, the wallet entropy is sharded into key shares, and the key shares are encrypted and distributed across separate security boundaries. This ensures that wallets can never be accessed outside of the TEE.

<Info>
  Private keys only exist in complete form temporarily within the trusted execution environment
  during signing operations. At all other times, they remain split into encrypted shares stored
  across separate security boundaries.
</Info>

### Wallet transaction

When a wallet transaction is requested, the wallet private key is reconstituted temporarily in-memory within the trusted execution environment. Two shares must be present to reconstruct the private key, the **enclave share** and **auth share**. The private key does not persist beyond usage for the wallet operation.

This process ensures:

* Keys exist only as encrypted shares stored across separate security boundaries
* Shares are only combined temporarily within the secure environment for specific operations
* Network access is strictly controlled
* Every operation requires proper authentication

In more detail, when signing a transaction:

1. Your app or service makes a `POST` request to the Privy API with the appropriate API credential (bearer token or app secret) and an authorization key signature.
2. The Privy API authenticates the API credential. If the request is valid, the request is forwarded to the TEE, along with the auth share.
3. The TEE verifies authorization and policies. The authorization signature from the request is verified against the authorization public key.
4. The TEE decrypts the encrypted device share and combines it with the auth share to reconstruct the wallet's private key.
5. The key is used temporarily in-memory for cryptographic signing.
6. The transaction signature is returned to the caller.

Privy also supports broadcasting the signed transaction to the blockchain, directly from the API.

<Frame>
  <img src="https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/security/enclave-flow.png?fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=219506b83f251a70b0e8a0e5dd1d5409" alt="Transaction flow" data-og-width="3686" width="3686" data-og-height="2633" height="2633" data-path="images/security/enclave-flow.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/security/enclave-flow.png?w=280&fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=1b5dc0c16263cf1fba2b11f823ac7e0b 280w, https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/security/enclave-flow.png?w=560&fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=7ed2189f3c6cfd4f0a1b690955564fbc 560w, https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/security/enclave-flow.png?w=840&fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=e3bbdd42399349c3374117589b39ac8a 840w, https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/security/enclave-flow.png?w=1100&fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=86ee1aa2d9a19144b595823e4f552dca 1100w, https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/security/enclave-flow.png?w=1650&fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=bd32b6adf5f3d406c49cc8b9b6cfd9ae 1650w, https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/security/enclave-flow.png?w=2500&fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=a1c6b2afb3147bebb01cc739b8f9f620 2500w" />
</Frame>

## Protecting code deployments to the trusted execution environment

Privy enforces strict controls of the code deployments within the trusted execution environment. Code deployed to the TEE undergoes extensive review and security controls, including strict multi-party approvals and hardware security key requirements.

All code changes require review from multiple designated owners, must pass automated security testing, and go through staged deployments with additional approvals. The Privy CI/CD pipeline ensures build artifacts are deployed directly from protected source code, with branch protection rules, security scanning, and signing requirements. This process is regularly audited and monitored to prevent unauthorized modifications.
\n