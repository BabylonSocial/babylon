> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Threat models & security FAQ

Threat models are an essential part of building secure systems. Establishing a threat model means understanding the robustness of a system against a given attacker and context. At Privy, we work to communicate these threat models clearly so developers and users can protect themselves and their assets effectively. We break down some threat models below. Please reach out to us at [security@privy.io](mailto:security@privy.io) if you have any questions.

As a reminder, Privy works to secure user assets and data in three main ways:

* **Proactive security**: Privy systems are engineered and built with security in mind. This means resource isolation and [cryptographic architecture](/security/overview) layered with a defense-in-depth approach, designed to protect your wallets. This also means doing cryptographic and infrastructure audits on a quarterly basis, as well as running a Vulnerability Disclosure Program and active Bug Bounty Program.
* **Active monitoring**: Privy systems are instrumented for active monitoring. This means automated alerts triggered by unexpected or abnormal activity and an on-call engineering team on standby 24/7. As our customers deploy apps, we work to monitor activity across the threat landscape online and collaborate with service providers to take down malicious threats.
* **Defensive measures**: Privy is built with failsafes to enable developers and their users to cut off access to key material in the event of an emergency. We work on pre-approved procedures for such instances with our enterprise customers and are always at the ready to protect user assets in the case of attack.

If you're a researcher interested in participating in our Bug Bounty or you believe you've detected a malicious threat relevant to Privy's work, please reach out to [security@privy.io](mailto:security@privy.io).

## Security philosophy

Security is continuous work, not a one-time achievement. We recognize that [wallets are not one size fits all](https://www.privy.io/blog/metrocards-and-bank-vaults), and we build highly configurable, flexible wallet infrastructure so you can configure the system appropriate for your use-case. Moreover, security needs evolve as asset value grows.

We give developers flexibility to build appropriate experiences while guiding them toward security best practices. We support the full spectrum from email-based embedded wallets to hardware-secured cold storage, recognizing the [inherent tradeoffs](https://www.privy.io/blog/embedded-wallet-architecture-breakdown) in any cryptosystem.

## Understanding threat models

The below summarizes some key questions but is not exhaustive. Please reach out for a deeper discussion on threat modeling or other attack strategies.

### Cross-application security

#### Q: Can unauthorized applications access the Privy iframe?

No. The iframe enforces that all frame ancestors must be an [allowed origin](/recipes/dashboard/allowed-domains) set by an application admin within the Privy dashboard. This is enforced by both frame ancestor CSP checks and in-code origin validation.

#### Q: Can unauthorized applications send messages to the Privy iframe?

No. The Privy iframe only accepts messages from its parent frame. The iframe message handler checks the origin of messages received and confirms they are from an approved parent origin. Additionally, the Privy iframe requires a valid access token to authenticate messages received from its parent frame.

#### Q: Can a Privy customer's application interfere with another customer's iframe?

No. Browser controls and authentication controls enforce isolation between applications. Iframe contexts run in separate processes and does not share memory.

### User security

#### Q: Can an unauthorized user access another user's wallet?

No. A valid access token is required to access a wallet. Specifically, the user's access token is required to retrieve the auth share needed to reconstruct the wallet. Access tokens are only granted to authenticated users and are stored as either localStorage or [HttpOnly cookies](/recipes/dashboard/allowed-domains#httponly-cookies) depending on configuration.

#### Q: How are users protected if their browser is compromised?

We implement multiple protections:

* Keys never are persisted in complete form
* MFA can be required for wallet operations
* Transaction approval requires the auth share which is not stored on device
* Emergency controls can immediately disable key reconstruction
* Recovery shares can be secured by user-managed methods

### Browser security

#### Q: Can bookmarklets and browser extensions inject malicious Javascript into the iframe?

In certain cases, yes. There is a CSP nonce on the embedded wallet iframe and the embedded wallet key export page. This means browsers are able to verify the iframe code via a server-set nonce, and additionally reject unauthorized code. We block extensions with CSPs that violate the unsafe eval directive.

However, it's important to understand that bookmarklets and extensions have elevated permissions and may have access to things such as browser requests and responses. According to the W3C CSP standard, browser implementations should allow user-agent features to override policies. Browsers enable bookmarklets and extensions to bypass CSP settings and inject Javascript code onto pages. We recommend educating users to not install untrusted bookmarkets and browser extensions. Furthermore, we recommend enabling wallet MFA which requires the user to MFA to approve transactions.

#### Q: What happens if browser security is compromised?

We maintain multiple layers of protection:

* Emergency kill switches for immediate response
* Access token revocation capabilities
* Geographic access restrictions
* Rapid incident response procedures
* Regular security updates

### Infrastructure security

#### Q: Can a compromised Privy team member access user keys?

No. Keys exist only as encrypted shares distributed across security boundaries. Wallet actions are only accessible within secure execution environments.

#### Q: Can a compromised engineer deploy unauthorized code?

No. Privy maintains a robust deployment security system with multiple independent controls. Code deployed to secure execution environments undergo extensive review and security controls, including strict multi-party approvals.

All code changes require review from multiple designated owners, must pass automated security testing, and go through staged deployments with additional approvals. The Privy CI/CD pipeline ensures build artifacts are deployed directly from protected source code, with branch protection rules and signing requirements. This process is regularly audited and monitored to prevent unauthorized modifications.

<Tip>
  For security questions not covered here or to report a security concern, contact us at
  [security@privy.io](mailto:security@privy.io). If you're a security researcher interested in our
  Bug Bounty Program, please reach out to the same address.
</Tip>
\n