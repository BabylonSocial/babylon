> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Security checklist

Privy is a powerful library that enables you to provision powerful non-custodial embedded wallets in order to create delightful user experiences. Privy protects your users' accounts and wallets via secure account verification, session management, and key sharding cryptography. See the [architecture security documentation](/security/wallet-infrastructure/architecture) for more information.

Before deploying Privy in production, there are several important security configurations to consider. Beyond this, security is a comprehensive topic that touches every part of your stack.

## Secure your client environment

Because your application client provides the context in which users access their accounts, it is an essential environment to keep secure. Follow client-side security best practices, including limiting what is able to inject Javascript into your site. **You should make sure only the code you intend runs in your app.**

### Web integrations

If you use Privy in your web application, including mobile web, we recommend configuring the following security settings.

#### Restrict allowed domains

Configure your allowed domains to prevent unauthorized access to your Privy integration.

* Add your production domain in the [Configuration > App settings page](https://dashboard.privy.io/apps?setting=domains\&page=settings) of the Privy Dashboard. [Learn more](/recipes/dashboard/allowed-domains)
* Remove any test or development domains

<Info>
  Using domains not configured in your allowed domains list will cause your integration to fail.
  This is an important security measure that protects your users.
</Info>

#### Configure HttpOnly cookies

To enable HttpOnly cookies for enhanced security, you can verify your domain ownership through a simple setup process in the Privy dashboard. [Learn more](/recipes/dashboard/allowed-domains)

#### Security headers

Configure proper security headers:

* Implement a strict [Content Security Policy](/security/implementation-guide/content-security-policy)
* Configure appropriate CORS settings
* Set secure cookie attributes when using HttpOnly cookies

### Mobile integrations

If you use Privy in your native mobile application, we recommend configuring the following security settings.

#### Restrict allowed native app IDs

Set your mobile project's bundle identifier as the required native app identifier.

## Set up authentication

If you have integrated user authentication with Privy wallet infrastructure, we recommend the following authentication settings. **Authentication security starts with choosing appropriate methods for your application.** Consider your users' needs and security requirements when configuring these settings. Read more about our [authentication architecture](/security/authentication/user-authentication).

### **Login methods**

For high-value applications, we recommend that you:

* Disable SMS-based authentication to prevent SIM-swapping attacks
* Enable strong [MFA](/authentication/user-authentication/mfa#mfa) options like authenticator apps or passkeys
* Configure appropriate session duration. The default is 30 days. You can do this using [app clients](/basics/get-started/dashboard/app-clients)

<Info>
  These security settings can be configured in your Privy dashboard. The defaults are chosen to
  balance security and user experience, but you may want to adjust them based on your specific
  needs.
</Info>

### **OAuth configuration**

If using social login, ensure proper configuration:

* Set up [allowed OAuth redirect URLs](/recipes/react/allowed-oauth-redirects)
* Review OAuth scopes and permissions
* Enable only necessary social providers
* Monitor OAuth token security

## Protect your wallets

Wallet security requires careful consideration of your specific use case and threat model. Learn more about our [wallet security architecture](/security/wallet-infrastructure/architecture).

### Embedded wallets

For wallets that users interact with directly through your application, we recommend enabling increasingly strict security settings as account value increases.

#### **High-value assets**

When protecting significant value, implement multiple security layers:

* Require [MFA](/authentication/user-authentication/mfa#mfa) for all sensitive operations
* Enable user-managed [recovery](/wallets/advanced-topics/new-devices/provision-new-devices) through password or cloud backup
* Set up emergency contacts and procedures

#### **Standard use cases**

For typical wallet usage:

* Enable users to optionally configure [MFA](/authentication/user-authentication/mfa#mfa)
* Configure automatic recovery with appropriate login methods
* Implement user education about security best practices

### Secure server-controlled wallets

#### Authorization keys

Set an owner on the wallet to add an additional layer of security for transaction signing. This means your transaction requests must be authorized with two factors: 1) your Privy app secret and 2) a signature from an [authorization key](/controls/authorization-keys/overview), which is a cryptographic key that only your service has access to.
Once this is set up, implement key management controls:

* Use a hardware-backed KMS (key management system) such as AWS KMS to secure authorization keys. Hardware-backed KMS systems disallow any export of keys.
* We recommend rotating authorization keys regularly, by updating the owner on wallets to a new key on a regular basis (every 90-180 days).
* You can further segregate wallets by setting different keys as the owner on different wallets. This means a given authorization key may only transact on one or a subset of wallets.
* You can require additional authorization for transactions, by requiring a quorum of authorization keys to approve a transaction. For example, you may set a 2-of-2 key quorum as the owner of a wallet: one key held in a KMS, and one key held by your service.
* We strongly recommend backing up authorization keys for redundancy. Privy does not have access to authorization keys and cannot recover your authorization key if you lose it.

#### Least privilege access

**Recommended Security Practice**: A powerful security control your application can implement is to separate the keys used for transaction signing from the keys used for [policy management](/controls/policies/overview). This ensures that even if your backend is compromised and transaction signing keys are exposed, the attacker cannot modify or remove the policies that constrain the wallet's behavior.

To implement this separation:

1. Create two different signing keys: one for **managing wallets and policies** and one for **transaction signing**
   * The management key should be used rarely and only be accessed in a very restricted environment
   * The transaction signing key will be used frequently and will accessed by your core application

2. When creating a wallet or policy, set the management key as the `owner`, which will make its signature required for any updates

3. On your wallet, set your transaction signing key and the policy it is subject to as an [`additional_signer`](/api-reference/wallets/create#body-additional-signers)

This creates a robust security boundary where:

* Transaction signing keys can only operate within policy constraints
* Policy management keys are rarely used and can be stored with higher security
* A compromise of transaction signing infrastructure cannot escalate to policy modification

<Info>
  The keys above can be quorums (e.g., 2-of-3 keys), providing additional security through
  multi-party authorization requirements.
</Info>

Learn more about implementing policies in our [policy overview documentation](/controls/policies/overview).

#### Other security recommendations

In addition to securing your server-controlled wallets with authorization keys, we also recommend the following:

* Set a [policy](https://docs.privy.io/controls/policies/overview) on the wallet to limit the types of transactions that may be processed.
* Monitor API usage and implement rate limiting
* Set up alerts for unusual activity
* Use separate development and production credentials
* Implement proper logging and audit trails

### Secret scanning

We recommend using a secret scanning tool to detect accidental disclosure of sensitive credentials in from your project.

Privy authorization private keys generated since January 2025 match the regex `wallet-auth:[A-Za-z0-9+/]{16,}`. Older private keys may have a prefix of `wallet-api:` or no prefix.

Privy app secrets generated since mid December 2025 match `privy_app_secret_[A-Za-z0-9]{16,}`. Older app secrets have no prefix.
\n