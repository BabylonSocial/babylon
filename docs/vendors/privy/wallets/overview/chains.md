> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Chain support

Privy offers support for multiple blockchain ecosystems, organized into three distinct tiers that provide different levels of functionality. By default, Privy supports all blockchains based on Ed25519 and secp256k1 cryptographic curves, and more blockchains are added regularly.

## Supported chains

### Tier 3: Full functionality

<CardGroup cols={2}>
  <Card title="Ethereum" href="/wallets/using-wallets/ethereum/send-a-transaction">
    Includes all EVM-compatible networks
  </Card>

  <Card title="Solana" href="/wallets/using-wallets/solana/send-a-transaction">
    Includes all SVM-compatible networks
  </Card>
</CardGroup>

### Tier 2: Wallet abstractions

<CardGroup cols={3}>
  <Card title="Bitcoin" href="/wallets/using-wallets/bitcoin/sign-transaction-inputs" />

  <Card title="Cosmos" href="/recipes/use-tier-2#cosmos" />

  <Card title="Stellar" href="/recipes/use-tier-2#stellar" />

  <Card title="Spark" href="/recipes/use-tier-2#spark" />

  <Card title="Sui" href="/recipes/use-tier-2#sui" />

  <Card title="Tron" href="/recipes/use-tier-2#tron" />

  <Card title="Near" href="/recipes/use-tier-2#near" />

  <Card title="Ton" href="/recipes/use-tier-2#ton" />

  <Card title="Starknet" href="/recipes/use-tier-2#starknet" />

  <Card title="Aptos" href="/recipes/use-tier-2#aptos" />

  <Card title="Movement" href="/recipes/use-tier-2#movement" />
</CardGroup>

### Tier 1: Cryptographic signing

<CardGroup cols={2}>
  <Card title="Bitcoin L2s" />

  <Card title="All other Ed25519 and secp256k1 chains" />
</CardGroup>

## Support tier definitions

### Tier 3: Full functionality

Chains with Tier 3 support receive comprehensive capabilities, including:

* Complete client-level support end-to-end
* Full wallet functionality
* Transaction building and submission
* Native gas sponsorship
* Advanced features like webhooks and policies

### Tier 2: Wallet abstractions

Tier 2 support focuses on core wallet functionality:

* Curve-level cryptographic signatures that can be used for transaction signing
* Basic wallet functionality
* Integration with chain-specific libraries
* Chain address derivation
* 0-index HD wallet creation and key derivation
* Embedded wallets
* Private key export

### Tier 1: Cryptographic signing

Tier 1 provides fundamental cryptographic capabilities:

* Raw cryptographic signatures
* Basic key management

### Smart wallets, policies and more

Beyond this, Privy has advanced support for smart contract parsing as part of policies, native smart-contract wallet support and more.

Please reach out if you need this for the chain your product leverages.

<Info>
  Our roadmap prioritizes both expanding to new chains and enhancing support for existing chains by
  moving them to higher tiers.
</Info>

## Choosing the right integration

When building your application with Privy, consider the tier of support available for your target blockchain:

* **Tier 3 chains** offer the most seamless experience with full native functionality
* **Tier 2 chains** provide core transaction capabilities but may require chain-specific code
* **Tier 1 chains** support basic signing operations and require more custom implementation

For questions about specific chain support or to request prioritization of particular chains, please contact the Privy team.

<Warning>
  While all tiers allow for blockchain integration, lower tiers may require additional development
  effort to handle chain-specific operations.
</Warning>

<Tip>
  Learn more about configuring your application for different
  [EVM](/basics/react/advanced/configuring-evm-networks) and
  [Solana](/basics/react/advanced/configuring-evm-networks) networks
</Tip>
\n