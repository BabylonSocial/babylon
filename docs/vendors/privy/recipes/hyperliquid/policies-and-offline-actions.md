> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Policies

Learn how to implement secure trading policies using Privy's signers and policies to control Hyperliquid operations with multi-signature authorization.

## Overview

Privy's [signers](/wallets/using-wallets/signers/overview) enable you to add additional signers to wallets, allowing you to. Combined with [policies](/controls/policies/overview), you can define granular controls over which Hyperliquid actions are allowed or denied.

## High-Level Steps

1. **Create policies** - Define which Hyperliquid actions are allowed or denied for your authorization keys
2. **Create authorization keys** - Generate signers that will be used to sign transactions on behalf of wallets
3. **Update wallet** - Attach the authorization key as a signer with your policies applied

Once configured, your authorization keys can execute Hyperliquid operations within the boundaries defined by your policies.

## How It Works

Policies enforce security controls on wallet operations by evaluating each transaction against a set of conditions. When a transaction is attempted with an authorization key:

1. The transaction is analyzed against all policies attached to that signer
2. If any DENY policy matches, the transaction is rejected
3. If an ALLOW policy matches and no DENY policies match, the transaction proceeds
4. Operations that don't match any policies follow the default behavior

## User Signed Actions vs L1 Actions

Hyperliquid operations are divided into two categories:

### User Signed Actions

These are sensitive operations that require the master account's signature. Policies can be applied to control any User Signed Action, including:

* **Withdrawals** - Transferring funds out of Hyperliquid to external addresses
* **Approving Agents** - Registering or managing agent wallets
* **Account Transfers** - Moving funds between master account and subaccounts using `sendAsset`
* **Approving Builder Fees** - Authorizing builder code fee arrangements

These actions require explicit authorization and are ideal candidates for policy controls to protect user funds and account security.

### L1 Actions

Other operations are L1 Actions that can be performed by any registered agent wallet without requiring master account approval. These include:

* Placing orders
* Canceling orders
* Modifying orders
* Setting leverage
* Other trading operations

This separation allows you to enable automated trading through agent wallets while maintaining strict control over sensitive account operations.

## Prerequisites

Before implementing policies for Hyperliquid operations, you'll need to set up signers and create policies:

<CardGroup cols={2}>
  <Card title="Signers" icon="key" href="/wallets/using-wallets/signers/overview">
    Learn how to create additional signers for your wallets
  </Card>

  <Card title="Policies" icon="shield-check" href="/controls/policies/overview">
    Learn how to define and create policies for wallet operations
  </Card>
</CardGroup>

## Creating Policies

Policies determine which Hyperliquid operations are allowed or denied. Here are common policy examples for controlling User Signed Actions:

### DENY Withdrawal Attempts

Only the master account for a Hyperliquid account can initiate withdrawal attempts. You can setup policies to DENY the additional signer on the master account from being able to withdraw funds without user consent.

This is critical for protecting user funds - even if an authorization key is compromised, withdrawals cannot be executed without explicit user approval.

```json  theme={"system"}
{
  "name": "DENY Withdrawal from account",
  "method": "eth_signTypedData_v4",
  "action": "DENY",
  "conditions": [
    {
      "field_source": "ethereum_typed_data_message",
      "field": "hyperliquidChain",
      "typed_data": {
        "types": {
          "EIP712Domain": [
            {
              "name": "name",
              "type": "string"
            },
            {
              "name": "version",
              "type": "string"
            },
            {
              "name": "chainId",
              "type": "uint256"
            },
            {
              "name": "verifyingContract",
              "type": "address"
            }
          ],
          "HyperliquidTransaction:Withdraw": [
            {
              "name": "hyperliquidChain",
              "type": "string"
            },
            {
              "name": "destination",
              "type": "string"
            },
            {
              "name": "amount",
              "type": "string"
            },
            {
              "name": "time",
              "type": "uint64"
            }
          ]
        },
        "primary_type": "HyperliquidTransaction:Withdraw"
      },
      "operator": "in",
      "value": ["Testnet", "Mainnet"]
    }
  ]
}
```

### DENY Account Transfers

The master account can transfer funds between subaccounts using the `sendAsset` action. You can setup policies to DENY the additional signer on the master account from transferring funds between subaccounts without user authorization.

This ensures that subaccount balances remain isolated and protected - an important security measure when managing multiple trading strategies or client accounts.

```json  theme={"system"}
{
  "name": "DENY Account Transfers",
  "method": "eth_signTypedData_v4",
  "action": "DENY",
  "conditions": [
    {
      "field_source": "ethereum_typed_data_message",
      "field": "hyperliquidChain",
      "typed_data": {
        "types": {
          "EIP712Domain": [
            {
              "name": "name",
              "type": "string"
            },
            {
              "name": "version",
              "type": "string"
            },
            {
              "name": "chainId",
              "type": "uint256"
            },
            {
              "name": "verifyingContract",
              "type": "address"
            }
          ],
          "HyperliquidTransaction:SendAsset": [
            {
              "name": "hyperliquidChain",
              "type": "string"
            },
            {
              "name": "destination",
              "type": "string"
            },
            {
              "name": "sourceDex",
              "type": "string"
            },
            {
              "name": "destinationDex",
              "type": "string"
            },
            {
              "name": "token",
              "type": "string"
            },
            {
              "name": "amount",
              "type": "string"
            },
            {
              "name": "fromSubAccount",
              "type": "string"
            },
            {
              "name": "nonce",
              "type": "uint64"
            }
          ]
        },
        "primary_type": "HyperliquidTransaction:SendAsset"
      },
      "operator": "in",
      "value": ["Testnet", "Mainnet"]
    }
  ]
}
```

### ALLOW Approve Agent

Permit the master account to register new agent wallets. This allows the additional signer to approve agent registrations on behalf of the user.

By explicitly allowing agent approval, you can enable operational flexibility while still denying other sensitive operations like withdrawals and account transfers.

```json  theme={"system"}
{
  "name": "ALLOW Approve Agent",
  "method": "eth_signTypedData_v4",
  "action": "ALLOW",
  "conditions": [
    {
      "field_source": "ethereum_typed_data_message",
      "field": "hyperliquidChain",
      "typed_data": {
        "types": {
          "EIP712Domain": [
            {
              "name": "name",
              "type": "string"
            },
            {
              "name": "version",
              "type": "string"
            },
            {
              "name": "chainId",
              "type": "uint256"
            },
            {
              "name": "verifyingContract",
              "type": "address"
            }
          ],
          "HyperliquidTransaction:ApproveAgent": [
            {
              "name": "hyperliquidChain",
              "type": "string"
            },
            {
              "name": "agentAddress",
              "type": "string"
            },
            {
              "name": "agentName",
              "type": "string"
            },
            {
              "name": "nonce",
              "type": "uint64"
            }
          ]
        },
        "primary_type": "HyperliquidTransaction:ApproveAgent"
      },
      "operator": "in",
      "value": ["Testnet", "Mainnet"]
    }
  ]
}
```

## Creating Authorization Keys

Authorization keys are signers that allow you to execute actions on wallets within the constraints defined by your policies. These keys can be controlled by your server, stored securely, and used to sign transactions on behalf of wallets.

To create an authorization key, you can use either the Privy Dashboard or the REST API. The process generates a keypair where:

* The **private key** is generated on your device and only known to you (Privy never sees it)
* The **public key** is registered with Privy's secure enclave to verify signatures

<Note>
  Save your authorization private key securely - Privy does not store it and cannot help you recover
  it later. You'll need this key to sign transactions with your policies applied.
</Note>

For detailed instructions on creating authorization keys, see the [Authorization Keys documentation](https://docs.privy.io/controls/authorization-keys/keys/create/key).

## Applying Policies to Wallets

Once you've created policies, you can apply them to wallets by adding additional signers with policy overrides:

```javascript  theme={"system"}
// Update a wallet to add additional signers with specific policies
const wallet = await privy.wallets().update('WALLET_ID', {
  policy_ids: [], // Global policies (empty in this case)
  additional_signers: [
    {
      signer_id: 'SIGNER_ID', // Authorization key ID
      override_policy_ids: ['POLICY_ID'] // Policies for this signer
    }
  ]
});
```

Once you've applied policies to a wallet, you can use the authorization private key to sign transactions on behalf of the wallet:

```javascript  theme={"system"}
import { createViemAccount } from '@privy-io/node/viem';

// Create a viem account with authorization context
const account = createViemAccount(privy, {
  walletId: wallet.id,
  address: wallet.address as `0x${string}`,
  authorizationContext: {
    authorization_private_keys: [
      "AUTHORIZATION_PRIVATE_KEY"
    ]
  }
});

// Use the account with Hyperliquid
const client = new hl.ExchangeClient({
  transport,
  wallet: account,
});
```

<Note>
  The authorization private key (`wallet-auth:...`) allows the additional signer to sign
  transactions. Any operations attempted will be evaluated against the policies you've defined. If a
  policy denies an action (like withdrawal), the transaction will fail before execution.
</Note>

## Best Practices

<AccordionGroup>
  <Accordion title="Use separate keys for different functions">
    Create dedicated authorization keys for trading operations vs. administrative functions.
  </Accordion>

  <Accordion title="Start with restrictive policies">
    Begin with strict policies and gradually relax them as needed, rather than starting permissive.
  </Accordion>

  <Accordion title="Test policies in testnet">
    Always validate your policy configuration on Hyperliquid testnet before deploying to production.
  </Accordion>

  <Accordion title="Regular policy reviews">
    Periodically review and update policies to match current risk management needs.
  </Accordion>
</AccordionGroup>

## Next Steps

<CardGroup cols={3}>
  <Card title="Agent wallets" icon="users" href="/recipes/hyperliquid/agents-and-subaccounts">
    Learn about managing multiple accounts
  </Card>

  <Card title="Builder Codes" icon="dollar-sign" href="/recipes/hyperliquid/builder-codes">
    Earn fees with builder codes on Hyperliquid orders
  </Card>

  <Card title="HyperEVM" icon="code" href="/recipes/hyperliquid/hyperevm">
    Develop smart contracts on HyperEVM
  </Card>
</CardGroup>
\n