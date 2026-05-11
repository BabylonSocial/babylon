> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Secure enclaves

**Privy’s wallet infrastructure is designed so that the only place a full private key ever exists is inside a secure enclave.** We rely on hardened trusted execution environments to wrap the most sensitive parts of the system: key generation, policy enforcement, and signing with hardware-backed isolation.

## Why secure enclaves matter

* **Hardware isolation:** Our secure enclave runtime provides a CPU-level sandbox with no persistent storage, no interactive access, and memory that is encrypted while in use. Even if another component is compromised, keys remain protected inside the enclave.
* **Defense in depth:** Every wallet uses Shamir secret sharing to produce split, encrypted key shares, along with authorization signatures and policy checks. The two shares live on separate pieces of infrastructure: one protected by the enclave, the other by the API. Compromising a single provider is not enough to recover a key. The enclave is a critical layer, but it works in tandem with upstream controls to make attacks impractical.
* **Measured boot:** Each enclave boots from a signed image. We verify attestation reports before provisioning secrets so only approved code can handle wallet operations, and those secrets are sealed so they can only be unwrapped by that approved image.

## How requests are processed

1. Your service calls the Privy API from infrastructure you control.
2. The API, running on isolated infrastructure outside the enclave, retrieves the encrypted share that corresponds to its shard of the wallet.
3. Only the enclave can combine that incoming shard with its own encrypted shard. Reconstruction happens in-memory just long enough to execute the requested action.
4. [Authorization signatures](/security/authentication/authenticated-signers) and [policies](/security/wallet-infrastructure/policy-and-controls) are verified inside the enclave before any signing can occur. Only after every control passes does the enclave produce the minimal response (for example, a transaction signature) and discard the reconstituted key material.

Because the API and the enclave sit in different trust boundaries, compromising one provider is not enough to access private keys. Both encrypted shares and policy validation must succeed within the enclave for any action to complete.

## What enclave attestation gives you

* **Sealed secrets:** Sensitive configuration and the enclave’s key shard are encrypted to the enclave image. They only decrypt after the image identity is verified through the attestation flow.
* **Independent validation:** Our build pipeline and enclave attestation are issued by separate hardened systems. Images are signed in one environment, and attestation materials are generated and verified in another, creating an extra layer of assurance that only approved code can boot.
* **Operational transparency:** Coming soon: customers will be able to access enclave attestation documents and measurements to verify that their workloads are running on the expected image.

## Frequently asked questions

**Do Privy engineers have access to user keys?**\
No. Key shares are intentionally separated. Privy team members cannot reconstruct keys or bypass policy checks, and the enclave never exposes its shard.

**What if a cloud provider is compromised?**\
Both shares are encrypted end to end. One stays sealed inside the trusted execution environment; the other is stored on separate infrastructure and only released to an attested enclave. A breach in one environment is insufficient to assemble a key.

**Can anyone update the wallet database outside the enclave?**\
No. All sensitive state transitions are signed inside the enclave. The trusted execution environment is the only component that can authorize or sign changes before they reach persistent storage.

**How are updates handled?**\
Enclave images undergo multi-party review, automated testing, and attestation validation before deployment. Updates roll out gradually, with builds signed in one hardened system and attestation issued in a separate environment before the enclave can accept traffic.

**How does disaster recovery work?**\
Enclaves are stateless. If an enclave is replaced, it rehydrates from sealed secrets only after attestation. Key shards remain encrypted and are never stored together.

Looking for more detail on how wallets are constrained once inside the enclave? Review our [policy and controls documentation](/security/wallet-infrastructure/policy-and-controls) and the guide to [authenticated signers](/security/authentication/authenticated-signers).

Still have questions? Reach out to [security@privy.io](mailto:security@privy.io) and our security team will be happy to help.
\n