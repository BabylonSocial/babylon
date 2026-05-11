> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# About Privy

Privy builds authentication and wallet infrastructure to enable better products built on
crypto rails. Get started in minutes to onboard users with wallets, spin up self-custodial wallets for users,
and securely sign transactions through your app.

Broadly, Privy enables:

**User onboarding** — Privy helps developers onboard users regardless of their experience with crypto-based systems. This means libraries to authenticate them, help them connect their existing wallets and provision self-custodial embedded wallets for them if they don't already have one.

**Wallet infrastructure** — Developers can spin up user-centric wallets from the client or general-purpose wallets from their backend directly to provision and manage cross-chain wallets for any use case.

Privy surfaces both user-centric abstractions enabling you to authenticate users and generate wallets for them, as well as wallet-centric abstractions whereby you can create wallets with assigned authorization keys to control them.

## Engineering principles

At Privy, we believe technical decisions are moral decisions. Below are the principles that guide our engineering decisions.

### Secure

Nothing is more important than your user's security. Privy’s key management system uses distributed key sharding to ensure Privy can never access your user's keys — only their rightful owner can. Keys are only ever reconstituted in a secure execution environment at the point of signing a message or sending a transaction.

Privy regularly undergoes rigorous audits to ensure your users control and privacy over their wallets.

### Flexible

Privy gives your application low level access to users and their wallets to support a fully customized product experience. Your application can access Privy's functionality all the way down to the API level, supporting unique wallet flows including provisioning multiple wallets per user.

### Easy to use

Privy has out of the box UIs so your app can support authentication and wallet flows in minutes. These UIs are highly customizable and can even be fully whitelabeled. This means access to out of the box funding methods, smart wallet creation pipelines, and more.

### Portable

Privy is compatible with any chain your application operates on. Your application can provision embedded wallets (or link external wallets to a Privy account) on Solana, Ethereum, and all EVM/SVM compatible chains. Privy is at the bleeding edge of distributed systems so when you want to build on a new chain, that chain is already supported.

With layers of customizability, Privy supports a wide range of product experiences.

<img src="https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/Customization.png?fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=efcb8c7656d6bd33f886240a7583c52f" alt="images/Customization.png" data-og-width="5529" width="5529" data-og-height="3949" height="3949" data-path="images/Customization.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/Customization.png?w=280&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=bdeb87d0a7beb0447b9e5e7737f459b0 280w, https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/Customization.png?w=560&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=cb260579ff196b91d8a35b3065f75308 560w, https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/Customization.png?w=840&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=e9b5bf191d635505cc5ee08efec601de 840w, https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/Customization.png?w=1100&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=672ec82fe3a4fb36d9029a09c840a022 1100w, https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/Customization.png?w=1650&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=1cbf9749a26fa36466143aaf6b78304b 1650w, https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/Customization.png?w=2500&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=b7ac9e8bebce7ee86fd66e00a5f49ae6 2500w" />
\n