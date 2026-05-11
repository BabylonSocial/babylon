> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Overview

**Privy enables users to set up multi-factor authentication (MFA) for embedded wallets on both EVM networks and Solana.** MFA helps secure the embedded wallet by requiring additional verification of a user's identity when the wallet is used.

<img src="https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/MFA.png?fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=2ad6a50823b29bacbabd08067f025e0b" alt="images/MFA.png" data-og-width="1843" width="1843" data-og-height="1317" height="1317" data-path="images/MFA.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/MFA.png?w=280&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=9a8d1f6020125a076482d74e95d8ea2b 280w, https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/MFA.png?w=560&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=5a7c136cc852f732d138ee205001bc6e 560w, https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/MFA.png?w=840&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=48b0c6df688ff0e5ec3ab71bb797d659 840w, https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/MFA.png?w=1100&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=14ba64d7a86446fdd19d9869eb901c33 1100w, https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/MFA.png?w=1650&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=16ab2c892a1d9cee061253917c9cb4e5 1650w, https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/MFA.png?w=2500&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=13d8d546414fbf6ae64d23d14f50ed34 2500w" />

Once a user enrolls in wallet MFA, **any action that requires use of the embedded wallet's private key will require the user to complete MFA verification.**
This includes signing messages, sending transactions, exporting the embedded wallet, and recovering the embedded wallet for use on new devices.

<Info>
  If a user has multiple embedded wallets (e.g. on different blockchains, or multiple HD addresses),
  enrolling in MFA will require MFA for signatures and transactions from **any** of them.
</Info>

**Privy currently supports three methods of wallet MFA:**

* **SMS**, where users verify with a 6-digit MFA code sent to their phone number
* **Time-based one-time password (TOTP)**, where users verify with a 6-digit MFA code from an authentication app, like Authy or Google Authenticator
* **Passkeys**, where users verify with a previously registered passkey, generally through biometric authentication on their device

<Warning>
  Setting up MFA on one active session will affect and limit signing in other active sessions. If a
  user has multiple active sessions (e.g. mobile and web), enabling MFA in one will cause them to be
  challenged on the other session.
</Warning>

## Policy-based MFA with Policies

By default, once a user enrolls in MFA, **all** wallet actions require MFA verification. However, you can implement **policy-based MFA** to require MFA only for specific actions while allowing routine transactions to proceed without additional verification.

For example, you can:

* Require MFA only for transactions above a certain amount (e.g., transfers over 1000 USDC)
* Require MFA for withdrawals while allowing deposits without MFA
* Apply MFA requirements based on specific tokens, contracts, or actions

This is achieved by combining MFA with [wallet policies](/controls/policies/create-a-policy) and authorization keys, giving you fine-grained control over when MFA is required.

<Info>
  Learn how to implement policy-based MFA in our [policy-based MFA
  recipe](/recipes/policy-based-mfa).
</Info>
\n