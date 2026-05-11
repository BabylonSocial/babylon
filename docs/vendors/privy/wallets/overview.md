> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Overview

Privy builds wallet infrastructure that empowers users and applications to transact on hundreds of blockchains, including Ethereum, Solana, Base, [and more](/wallets/overview/chains).

These wallets can be embedded within your application to have users interact with them directly, or they can be controlled by your servers via Privy's API. Use Privy to instantly spin up self-custodial wallets for your users or create a wallet fleet of your own.

Privy embedded wallets are built on globally distributed infrastructure to ensure high uptime and low latency. They leverage secure hardware (TEEs) to ensure only the rightful owner can control their wallet or access its keys.

Privy also supports users connecting external wallets (like Metamask or Phantom) to your app so they can bring their assets and online identity with them to your product if they already have a wallet.

Regardless of what wallet you integrate (embedded or external wallets), you can easily request signatures and transactions from your users to interact with tokenized assets and onchain infrastructure. The logic for making these requests is similar across wallet types.

<img src="https://mintcdn.com/privy-c2af3412/Ih_Fo3QYM486gzWq/images/walletoverview.png?fit=max&auto=format&n=Ih_Fo3QYM486gzWq&q=85&s=6e373d3d51f224c076fccac9766c472a" alt="images/walletoverview.png" data-og-width="3687" width="3687" data-og-height="1680" height="1680" data-path="images/walletoverview.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/privy-c2af3412/Ih_Fo3QYM486gzWq/images/walletoverview.png?w=280&fit=max&auto=format&n=Ih_Fo3QYM486gzWq&q=85&s=fa18006abd094bda3ef8caf692f71742 280w, https://mintcdn.com/privy-c2af3412/Ih_Fo3QYM486gzWq/images/walletoverview.png?w=560&fit=max&auto=format&n=Ih_Fo3QYM486gzWq&q=85&s=fcf5539560248bf740c75fdaa60c0427 560w, https://mintcdn.com/privy-c2af3412/Ih_Fo3QYM486gzWq/images/walletoverview.png?w=840&fit=max&auto=format&n=Ih_Fo3QYM486gzWq&q=85&s=fcc4a97b2d0f4ef06349a51b72b32d2d 840w, https://mintcdn.com/privy-c2af3412/Ih_Fo3QYM486gzWq/images/walletoverview.png?w=1100&fit=max&auto=format&n=Ih_Fo3QYM486gzWq&q=85&s=7755bb80ce152ae7f0c7d1f02440c38f 1100w, https://mintcdn.com/privy-c2af3412/Ih_Fo3QYM486gzWq/images/walletoverview.png?w=1650&fit=max&auto=format&n=Ih_Fo3QYM486gzWq&q=85&s=51d038ac704584fa0e34a7cdb99268ff 1650w, https://mintcdn.com/privy-c2af3412/Ih_Fo3QYM486gzWq/images/walletoverview.png?w=2500&fit=max&auto=format&n=Ih_Fo3QYM486gzWq&q=85&s=6eb3240d51087db3cb55f70bdb074f30 2500w" />

## Embedded wallets

Privy's embedded wallet system lets you build wallets directly into your app whether you're building self-custodial wallets for your users or a wallet fleet you control.

Privy's wallet infrastructure ensures only the appropriate party controls the wallet. This means you can set up wallets for any user, customer, or agent under a range of custody options.

Privy surfaces both user-centric abstractions enabling you to authenticate users and generate wallets for them, as well as wallet-centric abstractions whereby you can create wallets with assigned authorization keys to control them.

### Common usage

#### User wallets

You can generate self-custodial wallets for your users for a wallet experience that is directly embedded in your application—no separate wallet client, like a browser extension or a mobile app, required.

This means users have full custody of their wallets without needing to manage secret keys. Neither Privy nor your application ever sees the user's keys; secrets are only ever reconstituted in a secure environment under the user's control so they can sign messages or transactions.

Users can manage their embedded wallet seamlessly with their account; they never need to handle any unnecessary technical complexity. Your application can even [pregenerate wallets](/recipes/pregenerate-wallets) for an account, like an email address or phone number, before the user logs in. Users can also [export the key](/wallets/wallets/export) for their embedded wallet, providing an escape hatch to leave Privy at any time.

Your application can easily guide users to use their wallet with simple abstractions to prompt users to fund, transact, and sign with their wallet.

#### Programmatic controls

Set up a fleet of wallets to enable secure treasury management across use cases. Leverage wallets programmatically and safely via quorums of pre-approved signers and policies to move funds and manage complex flows.

Register webhooks to automate events based on onchain actions, assign specific policies to wallet signers to manage risk, and more.

Wallets leverage secure enclaves and key splitting to ensure secure key reconstitution and appropriate custody for all use cases.

### Features

Privy's wallet infrastructure gives you the flexibility to manage key signing directly or integrate onchain infrastructure like smart accounts out of the box. Wallets ship with:

* **Cross-chain usage**: Create and manage wallets on all EVM- and SVM-compatible blockchains, including Ethereum, Base, Arbitrum, HyperEVM, Solana, and Eclipse. Privy also supports [many other chains](/wallets/overview/chains), such as Bitcoin, Spark, TRON, Stellar, and more.
* **Robust transaction controls**: Execute arbitrary transactions with wallets, such as transferring funds and interactions with smart contracts. Make transactions idempotent to ensure that they are only submitted once in case of a retry.
* **Onchain indexing**: Broadcast transactions onchain and register event listeners (via [webhooks](/wallets/gas-and-asset-management/assets/transaction-event-webhooks)) on transaction status, deposits, and withdrawals.
* **Powerful policy engine**: Enforce granular policies what actions a wallet can take, set allowlisted contracts or recipients, maximum amounts to be transferred, restrictions on smart contract calldata, and more. Enforce MFA on transactions, require approval signatures from a quorum of parties, and more. [Learn more](/controls/overview)
* **Authorization controls**: Cryptographically enforce a chain of required approvals on wallets from `m-of-n` parties to execute certain wallet actions.
* **Automated gas sponsorship**: Never worry about topping up a wallet. Keep wallets loaded to pay for transactions at all times. [Learn more](/wallets/gas-and-asset-management/overview)
* **Rich onchain integrations**: Leverage features like Privy's wallet UI components, RainbowKit connector, transaction and balance webhooks, or automated gas management to streamline your integration with the blockchain.

## External wallets

External wallets are managed by a third-party client, such as MetaMask, Phantom, or Rainbow. All browser extension wallets, hardware wallets, and mobile app wallets fall into this category.

If they choose, users may use multiple external wallets within your app and may link these wallets to their account. You can request signatures and transactions from an external wallet directly, or by integrating Privy alongside a library like `wagmi`, `viem`, or `@solana/web3.js`. [Learn more](/wallets/connectors/overview)

## Get started

<CardGroup>
  <Card title="Create a wallet" icon="rocket" href="/wallets/wallets/create/create-a-wallet">
    Create a wallet
  </Card>

  <Card title="Connect external wallets" icon="screwdriver-wrench" href="/wallets/connectors/usage/connecting-external-wallets">
    Connect external wallets to your app like MetaMask or Phantom
  </Card>

  <Card title="Provision signers" icon="code" href="/wallets/using-wallets/signers/overview">
    Take actions on behalf of your users by adding signers
  </Card>
</CardGroup>
\n