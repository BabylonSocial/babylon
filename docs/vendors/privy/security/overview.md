> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Security

**The security of your users' data and digital assets is our top priority at Privy.** We secure over 50 million users' wallets and enable billions of dollars in transaction value through our secure, flexible infrastructure.

<Tip>
  Privy wallets are non-custodial and have a fully programmable control model. Privy's flexible
  configuration enables the full custody spectrum from user-custodial wallets to powerful
  service-controlled accounts.
</Tip>

## Our security approach

At Privy, we've built our security foundation on unwavering principles. Our systems are non-custodial by design, ensuring that only authorized users can access their keys through sophisticated key splitting and secure execution environments. We implement defense in depth, with multiple independent security boundaries protecting your users' assets—from cryptographic guarantees to hardware-level isolation.

<Info>
  We believe security requires constant vigilance. We maintain continuous validation through regular
  third-party audits, an active bug bounty program, and 24/7 security monitoring to ensure our
  systems remain secure as threats evolve.
</Info>

## Core architecture

The strength of Privy's security comes from our battle-tested approach to protecting sensitive operations and data:

**Trusted execution environments (secure enclaves)**

Sensitive wallet operations take place within Trusted Execution Environments (TEEs), also known as secure enclaves. TEEs are highly restricted compute environments that offer deep system isolation guaranteed by the processor itself. In particular, Privy uses [AWS Nitro Enclaves](https://docs.aws.amazon.com/enclaves/latest/user/nitro-enclave.html).

**Key sharding and cryptography**

We use robust, scalable cryptographic techniques to shard private keys across separate security boundaries, ensuring they are never stored in complete form and can only be accessed by authorized parties.

<Tip>
  Privy's cryptosystem design ensures sensitive operations remain protected even if the surrounding
  system is compromised.
</Tip>

## Security validation

We regularly validate our security through comprehensive assessments:

* Multiple independent security audits from firms including Cure53, Zellic, and Doyensec
* SOC2 Type I and Type II certified
* Active bug bounty program on HackerOne
* 24/7 incident response with rapid response SLAs

<Info>
  Our commitment to security extends to transparency—our cryptographic implementations are
  open-source and have undergone dedicated third-party audits, available on our [GitHub
  repository](https://github.com/privy-io/shamir-secret-sharing).
</Info>

## Getting started

Our documentation will guide you through implementing Privy securely in your application. We recommend starting with our [security checklist](/security/implementation-guide/security-checklist) for a complete overview of security best practices, or diving into our [architecture details](/security/wallet-infrastructure/architecture) to learn more about our security model.

<Tip>
  Security researchers can learn more about our vulnerability disclosure program at
  [privy.io/vulnerability-disclosure](https://www.privy.io/vulnerability-disclosure) or reach out to
  [security@privy.io](mailto:security@privy.io).
</Tip>
\n