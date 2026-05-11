> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Overview

Privy enables developers to provision custodial wallets operated with a licensed custodian of their choice.

Custodial wallets are built on Privy’s [secure key management](/wallets/overview) and [authorization framework](/controls/authorization-keys/overview). Only appropriate parties can take actions with a given wallet, which are governed by cryptographically enforced authorization keys and configurable [policies](/controls/policies/overview), with support for [multi-party key quorums](/wallets/using-wallets/signers/overview) and fine-grained controls. Developers can define who must initiate wallet actions — whether that’s a single user key, a service key, or a combination of signers in an m-of-n configuration.

Custodial wallets offer the same core powerful features as any Privy wallet but are backed by a licensed custodian. Privy's architecture can work with any custodian; today, we work with [Bridge (a Stripe company)](https://bridge.xyz).

<Tip>
  You can see a full list of supported regions
  [here](https://apidocs.bridge.xyz/platform/customers/compliance/supported-countries-list). If
  you’d like to enable custodial wallets with another custodian, please reach out at
  [support@privy.io](mailto:support@privy.io). We’d love to hear from you.
</Tip>

## Features

Privy custodial wallets support the following features:

* Simple wallet creation for custodied accounts
* Transaction screening and deposit addresses
* Stablecoin transfers
* Fiat / stablecoin orchestration through providers

Beyond this, custodial wallets support the same range of features as other embedded wallets such as:

* **Transaction fee sponsorship**: Automatically sponsor gas fees for user transactions.
* **Policies and authorization controls**: Enforce granular policies on wallet actions and require multi-party approvals.
* **Balance webhooks**: Receive real-time notifications about wallet balance changes.
* **Transaction webhooks**: Monitor transaction status and lifecycle events, including custodial provider-specific events.

### Differences between custodial wallets and other embedded wallets

There are some differences in features and behaviors between custodial wallets and other embedded wallets, including:

* [Transaction lifecycle](/wallets/custodial-wallets/transaction-lifecycle)
* [Meaning of a wallet owner](/wallets/custodial-wallets/advanced/authorization-controls#meaning-of-owner-for-custodial-wallets)
* Custodial wallets can only send [certain assets on certain chains](/wallets/custodial-wallets/sending-funds)

## Get started

<CardGroup cols={3}>
  <Card title="Setup" icon="gear" href="/wallets/custodial-wallets/setup">
    Get started with flexible custody
  </Card>

  <Card title="Create a custodial wallet" icon="wallet" href="/wallets/custodial-wallets/create-custodial-wallet">
    Learn how to create and provision custodial wallets
  </Card>

  <Card title="Send funds" icon="paper-plane" href="/wallets/custodial-wallets/sending-funds">
    Execute transactions and send funds from custodial wallets
  </Card>
</CardGroup>

<script src="https://js.hsforms.net/forms/embed/21610498.js" defer />

<div style={{marginTop: '2rem'}}>
  <div className="hs-form-frame" data-region="na1" data-form-id="d7959d6c-5499-4825-8aaa-2c87ace53e87" data-portal-id="21610498" />
</div>
\n