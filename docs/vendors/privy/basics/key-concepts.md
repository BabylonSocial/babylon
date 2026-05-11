> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Key concepts

Privy builds user onboarding and wallet infrastructure to enable better products built on crypto rails by embedding asset control directly into your product. This guide explains Privy's core concepts and how they work together.

## How Privy works

Privy provides three interconnected layers that work together to create secure, flexible onchain applications.

**1. Authentication**

Authentication verifies who your users are and manages their access to your application. Privy supports multiple authentication methods including email, social logins, passkeys, and wallet-based authentication. You can use Privy's built-in authentication system or integrate Privy wallets with your existing authentication provider.

**2. Wallets**

Wallets enable users and applications to interact with blockchains for signing transactions, managing assets, and participating in onchain protocols. Privy supports both embedded wallets (created and managed by Privy's infrastructure) and external wallets (third-party wallets like MetaMask or Phantom that users bring to your application).

**3. Controls**

Controls determine who can take actions with wallets and what they're allowed to do. Every embedded wallet has an owner with full control, and can have additional signers with scoped permissions. Policies define rules that constrain what actions each party can perform.

## Authentication

You can use Privy's authentication system or integrate Privy wallets with your existing authentication provider.

### Privy authentication

Privy's built-in authentication supports multiple login methods (listed below). [Learn more.](/authentication/overview)

* **Email and phone** - Email, SMS, and WhatsApp
* **Social** - Google, Discord, Twitter, and more
* **Crypto-native** - MetaMask, Phantom, Farcaster, and Telegram
* **Biometric** - Passkeys and biometric authentication
* **Additional security** - MFA and hCaptcha

**Best for**: Most applications. Full-featured, easy to integrate, and maintained by Privy

### JWT-based authentication

You can integrate Privy wallets with your existing JWT-based authentication system. [Learn more.](/authentication/user-authentication/jwt-based-auth/overview)

**Best for**: Applications with established authentication that want to add wallet functionality

## Wallets

Privy enables users and applications to interact with blockchains through wallets for signing transactions, managing assets, and participating in onchain protocols.

### Embedded wallets

Embedded wallets are created and managed by Privy's infrastructure. [Learn more.](/wallets/overview)

**Key features**:

* Created automatically or on-demand
* Secured by Privy's key management system
* Users can export keys for self-custody
* Work across 50+ blockchains

**Best for**: Consumer apps, onboarding new users, seamless UX

### External wallets

External wallets are managed by third-party providers like MetaMask, Phantom, or Rainbow that users bring to your application. [Learn more.](/wallets/connectors/overview)

**Key features**:

* Users bring existing wallets
* Users control keys directly
* Familiar to crypto-native users
* Can be linked to Privy accounts

**Best for**: Leveraging balances in existing wallets, power users

## Controls

Controls define who can take actions with wallets and what actions they're allowed to perform. Embedded wallets always have an owner and can have additional signers. These roles are distinct and have different permissions.

### Owners

Owners are an entity that has ultimate control over a resource, including the ability to update policies or modify ownership configurations. Owners can be users, authorization keys, or key quorums. [Learn more.](/controls/authorization-keys/owners/overview)

### Signers

Signers are an additional party that can perform actions with a wallet, subject to the policies and permissions applied to them. Signers can sign transactions but cannot modify policies, change ownership, or export keys. Common use cases include server automation for limit orders, portfolio rebalancing, and delegated access. [Learn more.](/controls/authorization-keys/owners/overview#signers)

### Policies

Policies are rules that constrain what actions owners and signers can perform. These are key-level enforceable guardrails that prevent unauthorized or unintended actions. Policies can control transaction amounts, recipient addresses, smart contract interactions, time windows, and asset types. Policies are evaluated at request time and can be different for wallet owners vs signers. [Learn more.](/controls/policies/overview)

### Wallet control models

Wallets are typically set up using one of four models, each suited for different use cases and security requirements:

**Model 1: User-owned**

* User has full control
* Keys only accessible to user
* Use case: Self-custodial consumer wallets

**Model 2: User-owned with server access**

* User retains ownership
* Server has scoped permissions
* Use case: Automated trading, limit orders

**Model 3: Application-owned**

* Application has full control
* Managed via authorization keys
* Use case: Treasury, trading bots, agent wallets

**Model 4: Custodial wallets**

* Third-party licensed custodian operates the wallet on behalf of the beneficiary
* All transactions must be approved by the custodian
* Use case: account model more similar to FBO (For Benefit Of) banking models

Privy embedded wallets leverage trusted execution environments and key splitting to ensure only authorized parties can access wallet keys. [Learn more.](/security/overview)

## Building with Privy

Developers use Privy to build consumer apps, trading apps, fintech apps, deploy agents, and manage their own treasuries. Check out the following recipes for building apps with Privy.

<CardGroup cols={3}>
  <Card title="Trading apps" icon="chart-line" href="/recipes/trading-apps-homepage">
    Build trading experiences with embedded wallets, server-side automation, and policy controls.
  </Card>

  <Card title="Agentic wallets" icon="robot" href="/recipes/agent-integrations/agentic-wallets">
    Create wallets for AI agents and autonomous systems with strict policy controls.
  </Card>

  <Card title="Treasury wallets" icon="vault" href="/recipes/wallets/treasury-wallets">
    Manage treasuries with multi-sig wallets and key quorum approvals.
  </Card>
</CardGroup>
\n