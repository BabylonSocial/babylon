> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Overview

Privy's powerful **gas sponsorship** engine allows you to easily sponsor transaction fees across all of your wallets.
This feature allows you to seamlessly abstract away gas fees for your users, treasury or application,
creating a frictionless experience without the complexity of managing gas yourself.

<Info>
  Looking to get started quickly? Check out our [setup
  guide](/wallets/gas-and-asset-management/gas/setup).
</Info>

## Supported networks

<AccordionGroup>
  <Accordion title="Ethereum networks">
    **Mainnets:**

    * Ethereum
    * Base
    * Optimism
    * Polygon
    * Arbitrum
    * BNB Smart Chain
    * Unichain
    * Gnosis
    * Plasma
    * Berachain
    * Warden
    * Flow
    * Edge
    * Monad
    * World Chain
    * Story
    * Tempo
    * Ronin
    * MegaETH
    * Ink

    **Testnets:**

    * Sepolia
    * Base Sepolia
    * OP Sepolia
    * Polygon Amoy
    * Arbitrum Sepolia
    * Unichain Sepolia
    * MegaETH Testnet
    * Ronin Saigon
    * Monad Testnet
    * Tempo Testnet
    * Ink Sepolia
  </Accordion>

  <Accordion title="Solana networks">
    **Mainnets:**

    * Solana

    **Testnets:**

    * Solana Devnet
  </Accordion>
</AccordionGroup>

Want support for more networks? [Reach out to us!](mailto:sales@privy.io)

## How it works

Privy provides gas sponsorship through different mechanisms optimized for each chain:

### Ethereum and EVM chains

Privy leverages [EIP-7702](https://eip7702.io/) with **paymasters** to sponsor gas fees:

* Your users receive embedded wallets that are upgraded to [Kernel smart contracts](https://github.com/zerodevapp/kernel)
* Paymasters partnered with Privy cover gas costs automatically
* Users can transact immediately without needing to hold ETH or native tokens
* All sponsorship happens seamlessly in the background

<Info>
  **Native gas sponsorship vs smart wallets**

  Our [smart contract wallets offering](/wallets/using-wallets/evm-smart-wallets/overview) allows for easy setup of 4337-compatible contract
  accounts, where the embedded wallet is the signer for a smart contract.

  Our native gas sponsorship allows you to:

  * sponsor gas for user wallets without creating a separate contract account
  * easily get setup without having to work with extra bundler/paymaster providers
  * offers an easier developer experience - just pass in the `sponsor` param!

  *If you already have users with funds in their smart contract wallets,
  we recommend continuing to use smart contract wallets.*
</Info>

### Solana and SVM chains

Privy uses a **fee payer wallet** system to cover transaction costs:

* A fee payer wallet funded with SOL covers fees
* Users send transactions to the Privy API
* The fee payer wallet updates the transaction's `feePayer` address and latest blockhash
* The fee payer prefunds any account that needs to pay rent
* Users transact without needing to hold SOL

## Calculating gas fees

Privy automatically handles gas fee calculation and optimization to deliver the best experience while maintaining cost efficiency.
The platform balances transaction speed with cost optimization across our entire customer base, and queries for the best prices.

Gas sponsorship includes the actual network gas costs plus a convenience fee for the managed service. Privy maintains discretion over gas price strategies to ensure optimal performance and reliability.

<Info>
  Looking for more granular control over gas pricing? Consider exploring [custom
  setup](/wallets/gas-and-asset-management/gas/ethereum) options that provide additional
  configuration flexibility.
</Info>
\n