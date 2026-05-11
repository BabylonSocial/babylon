> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# On device execution environment

Privy's security architecture leverages secure execution environments to protect your users' assets. Wallet private keys are only temporarily reconstructed within these strictly isolated, secure execution environments when needed for specific operations, under the wallet owner's control.

Privy provides two types of secure execution environments: 1) via TEEs and 2) on the user's device. Each environment ensures that private keys are never stored in complete form and are only temporarily reconstructed when needed.

<Tip>
  By default, Privy uses [trusted execution environments
  (TEEs)](/security/wallet-infrastructure/architecture), also known as secure enclaves, for secure
  wallet operations. As an advanced setting, Privy also enables wallets to be reassembled **directly
  on user devices**.
</Tip>

On-device execution is an advanced configuration. Please [reach out](https://privy.io/slack) to enable this setting.

* On-device execution enables the fastest-possible signing speed (5 ms), but involves a more limited feature set.
* If you have on-device execution enabled, you will see "On-device" as the Wallet environment in your app's Wallet > Advanced settings page. Otherwise, your app uses TEE execution.
* You can [migrate from on-device to TEE execution](/recipes/tee-wallet-migration-guide). Apps may only operate in one environment.

## Browser-isolated execution environments on user devices

With on-device execution, Privy secures wallets directly on user devices using browser-enforced isolation via iframes. This relies on the same browser security boundaries that have been battle-tested for decades, securing billions of dollars in daily financial transactions across the modern internet.

The Privy iframe runs in a separate process with its own isolated memory space, completely separated from your application. This isolation is enforced by:

* Hardware-level memory protection
* Browser process separation
* Strict origin and frame ancestor validation
* Content Security Policy controls that strictly lock down network access

<Info>
  Browser security boundaries have been battle-tested for decades, securing billions of dollars in
  daily financial transactions across the modern internet.
</Info>

## Key shares

Privy's security model is based on distributed key sharding. This means critical key entropy is split into encrypted shares, protected by separate security boundaries.

With on-device execution, there are three share types:

* **Device share**, which is persisted on the user's device. In a browser environment, this is stored in the browser's domain-partitioned local storage via the iframe.
* **Auth share**, which is encrypted and stored by Privy. This share is accessible only with valid user authentication.
* **Recovery share** is used to provision the wallet on new user devices. This share is encrypted and secured either through user-managed methods (password or cloud backup) or Privy's recovery key management system.

**Two shares** must be present to reconstruct the private key, which only happens temporarily within the iframe on the user's device.

Typical operation involves sets of **2-of-2 shares**, where a device-specific share and an auth share are provisioned for each device on which a wallet is used. Similarly, a recovery share and recovery-specific auth share are provisioned to enable recovery on new devices.

<Frame>
  <img src="https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/security/on-device-shares.png?fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=889175c4a676e2af190b733ea6156fda" alt="Wallet key shares in on-device execution" data-og-width="3686" width="3686" data-og-height="2633" height="2633" data-path="images/security/on-device-shares.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/security/on-device-shares.png?w=280&fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=907cd4306f6a4f93363f3e857cc8e982 280w, https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/security/on-device-shares.png?w=560&fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=741ebf4f160d73a36c4c9b7f08c97deb 560w, https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/security/on-device-shares.png?w=840&fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=9307f56f1ed1d721740f2c9f8a956e3e 840w, https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/security/on-device-shares.png?w=1100&fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=3e7c2a2d154ea4434fe9a981516fc2c0 1100w, https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/security/on-device-shares.png?w=1650&fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=b8c52ca738d4d185720a9f5877797854 1650w, https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/security/on-device-shares.png?w=2500&fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=9012ceb1ad537822c91fead194cfe93d 2500w" />
</Frame>

### Securing the recovery share

Privy offers two approaches to securing the recovery share:

**Automatic recovery**

Privy's key management system secures the encrypted recovery share, allowing users to provision their wallet on new devices through normal authentication. Privy infrastructure ensures only the user can decrypt their recovery share on their device.

<Warning>
  When using automatic recovery, you are trusting Privy's infrastructure to secure the user's
  recovery share, and the user's authentication token as the sole root of trust for their wallet.
</Warning>

**User-managed recovery**

With user-managed recovery, the recovery share is encrypted via a recovery factor managed by the user. This takes two forms:

* **Passwords**: users can set a strong memorable password to secure the recovery share for their wallet. Privy has no knowledge of the user's password and cannot decrypt the recovery share.
* **Cloud-backup**: the recovery share is secured by a recovery decryption key that is backed up to the user's cloud storage account (e.g. Google Drive or iCloud). Privy cannot access this backup and cannot decrypt the recovery share.

## Key management operations

### Creating a wallet

When a user creates a wallet, the secure execution environment generates strong entropy (128 bits) from a cryptographically secure random number generator (CSPRNG). This is converted to a mnemonic using BIP-39, from which Privy derives the wallet's public key and private key. All Privy wallets are [hierarchical deterministic (HD) wallets](https://help.myetherwallet.com/en/articles/5867305-hd-wallets-and-derivation-paths).

Immediately after creation, the wallet entropy is sharded into key shares, and the key shares are encrypted and distributed across separate security boundaries. This ensures that wallets can never be accessed outside of the secure execution environment.

### Signing a transaction

Two shares must be present to reconstruct the private key. During regular operation, Privy reassembles the wallet using a **device share** and **auth share**. A device-specific share and an auth share are provisioned for each device on which a wallet is used.

In other words, when signing a transaction:

1. Your application passes the transaction data through the Privy SDK
2. The secure iframe validates authentication and retrieves necessary encrypted shares
3. Key reconstruction occurs only in the iframe's isolated memory
4. The key is used temporarily in-memory for cryptographic signing
5. Only the signature is returned to your application

Because Privy wallets are provisioned directly on user devices, cryptographic signing is extremely fast (5 ms).

<Frame>
  <img src="https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/security/on-device-signing.png?fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=aedbe71a00750ec3c627149f2f98a1f9" alt="Signing a transaction" data-og-width="3686" width="3686" data-og-height="2633" height="2633" data-path="images/security/on-device-signing.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/security/on-device-signing.png?w=280&fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=b7a67074a7fb7b10f756d84d64ea4b8e 280w, https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/security/on-device-signing.png?w=560&fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=7d314f652efcbf7dc2069b8045f983a4 560w, https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/security/on-device-signing.png?w=840&fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=a812fbcb07604833cd730d08e543f628 840w, https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/security/on-device-signing.png?w=1100&fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=5a459b16abaa861cfe8fb7ef85cfd040 1100w, https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/security/on-device-signing.png?w=1650&fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=3620e62f21d048196cd4c3357acbbe8f 1650w, https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/security/on-device-signing.png?w=2500&fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=b942601020f3bdc82fd6fd457380041c 2500w" />
</Frame>

### Provision new devices

Users provision their wallet on a new device using the **recovery share** and **auth share**. This set of recovery shares is created on initialization of a new wallet.

When a user accesses your app on a new device, the iframe will retrieve the **auth share** for your user during the login process. Then, depending on how you've configured recovery, the iframe will decrypt the **recovery share** for your user by:

* requesting the recovery decryption key using the user's auth token, if using **automatic** recovery
* having the user decrypt the key using their recovery factor (password or cloud account), if using **user-managed** recovery

With the **auth share** and the **recovery share**, the iframe provisions a new **device share** for the new device. This device share allows your user to continue using the wallet on that device.

Learn how to provision new devices in our [docs](/wallets/advanced-topics/new-devices/overview).

<img src="https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/security/recovery.png?fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=643b0669dfe159c6781a2cb80758dcfe" alt="Provision a new device" data-og-width="3686" width="3686" data-og-height="2633" height="2633" data-path="images/security/recovery.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/security/recovery.png?w=280&fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=43398d9e2c157ceb58fa907bc4ab83d6 280w, https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/security/recovery.png?w=560&fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=92f853e04663739cc0995b640035e8af 560w, https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/security/recovery.png?w=840&fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=5bd254d997dd70564bc1ae968444b1ec 840w, https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/security/recovery.png?w=1100&fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=090782e688da88cd2ba4fa790ecceed2 1100w, https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/security/recovery.png?w=1650&fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=894ffc5f41ca19237dff34cf4f92f4c1 1650w, https://mintcdn.com/privy-c2af3412/zlmLhiIqRR7ViKN0/images/security/recovery.png?w=2500&fit=max&auto=format&n=zlmLhiIqRR7ViKN0&q=85&s=59d3e297a01b378e29dc81e5f7d9bbcb 2500w" />

## External key recovery

With Privy's architecture, a user is able to recover their private key even if they lose their device or if they lose access to your app.

* If the user loses access to their device and is unable to retrieve their **device share**, they can combine their **auth share** and decrypt their **recovery share** to reconstitute the full private key.
* If the user loses access to your app and is unable to retrieve their **auth share**, Privy enables an external recovery service so that **users are always able to export their wallet**.

In all of these cases, Privy rotates keys to ensure compromised devices or authentication methods cannot be combined to maliciously reconstitute the private key.
\n