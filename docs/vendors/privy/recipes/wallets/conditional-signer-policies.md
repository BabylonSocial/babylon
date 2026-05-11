> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Conditional policies per signer

Some applications need different transaction policies depending on which party authorizes a transaction. For example, a restricted signer should only be allowed to send small transfers, while a full-access signer can send transactions of any size.

Privy supports this through **additional signers with override policies**. Each signer added to a wallet can have its own policy, so the constraints applied to a transaction depend on which signer authorizes it.

## How it works

* Each wallet can have multiple **additional signers** (authorization keys or key quorums)
* Each signer can have an **override policy** that defines what policies that signer is subject to
* When a signer submits a transaction, Privy evaluates only that signer's override policy — not the policies of other signers
* If the transaction satisfies the signer's policy, Privy signs it. Otherwise, Privy denies the request

This gives the same wallet different levels of access depending on which signer acts, without needing separate wallets.

## Setup

At a high level:

<Steps>
  <Step title="Create policies">
    Define a policy for each access level (e.g., a restrictive policy and a permissive policy).
  </Step>

  <Step title="Create authorization keys">
    Create an authorization key (or key quorum) for each signer that needs access to the wallet.
  </Step>

  <Step title="Add signers with override policies">
    Add each signer to the wallet with its corresponding policy.
  </Step>

  <Step title="Route transactions through the appropriate signer">
    Your server selects which authorization key to sign with based on the context of the request.
  </Step>
</Steps>

## 1. Create policies

Define a policy for each signer. In this example, the restricted signer can only send small USDC transfers, while the full-access signer can send transactions to any address.

<View title="NodeJS" icon="node-js">
  ```ts  theme={"system"}
  import {PrivyClient} from '@privy-io/node';
  import {erc20Abi, parseUnits} from 'viem';

  const privy = new PrivyClient({
    appId: 'insert-your-app-id',
    appSecret: 'insert-your-app-secret'
  });

  const USDC_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';

  // Restrictive policy: only USDC transfers under 1,000
  const restrictivePolicy = await privy.policies().create({
    name: 'Small USDC transfers only',
    version: '1.0',
    chain_type: 'ethereum',
    rules: [
      {
        name: 'Allow small USDC transfers',
        method: 'eth_sendTransaction',
        action: 'ALLOW',
        conditions: [
          {
            field_source: 'ethereum_transaction',
            field: 'to',
            operator: 'eq',
            value: USDC_ADDRESS
          },
          {
            field_source: 'ethereum_calldata',
            field: 'transfer.amount',
            abi: erc20Abi,
            operator: 'lte',
            value: parseUnits('1000', 6).toString()
          }
        ]
      }
    ]
  });

  // Permissive policy: allow any eth_sendTransaction
  const permissivePolicy = await privy.policies().create({
    name: 'Allow all transactions',
    version: '1.0',
    chain_type: 'ethereum',
    rules: [
      {
        name: 'Allow all sends',
        method: 'eth_sendTransaction',
        action: 'ALLOW',
        conditions: []
      }
    ]
  });
  ```
</View>

<View title="REST API" icon="terminal">
  Make `POST` requests to:

  ```sh  theme={"system"}
  https://api.privy.io/v1/policies
  ```

  **Restrictive policy** (small USDC transfers only):

  ```json  theme={"system"}
  {
    "name": "Small USDC transfers only",
    "version": "1.0",
    "chain_type": "ethereum",
    "rules": [
      {
        "name": "Allow small USDC transfers",
        "method": "eth_sendTransaction",
        "action": "ALLOW",
        "conditions": [
          {
            "field_source": "ethereum_transaction",
            "field": "to",
            "operator": "eq",
            "value": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
          },
          {
            "field_source": "ethereum_calldata",
            "field": "transfer.amount",
            "abi": "<erc20-abi-json>",
            "operator": "lte",
            "value": "1000000000"
          }
        ]
      }
    ]
  }
  ```

  **Permissive policy** (allow all transactions):

  ```json  theme={"system"}
  {
    "name": "Allow all transactions",
    "version": "1.0",
    "chain_type": "ethereum",
    "rules": [
      {
        "name": "Allow all sends",
        "method": "eth_sendTransaction",
        "action": "ALLOW",
        "conditions": []
      }
    ]
  }
  ```
</View>

Save the `id` from each policy response. These are needed when adding signers to the wallet.

<CardGroup cols={2}>
  <Card title="Create a policy" href="/controls/policies/create-a-policy">
    Learn more about defining policies with rules and conditions.
  </Card>
</CardGroup>

## 2. Create authorization keys

Create a separate authorization key for each signer. Each key corresponds to a different party or service that needs wallet access.

<CardGroup cols={2}>
  <Card title="Create authorization keys" href="/controls/authorization-keys/keys/create/key">
    Generate keypairs and register them in the Privy Dashboard or via the SDK.
  </Card>
</CardGroup>

Store each private key securely (e.g., in a secrets manager). In the examples below, these are referenced as `restrictedSignerPrivateKey` and `fullAccessSignerPrivateKey`.

## 3. Add signers with override policies

Add each authorization key as a signer on the wallet, attaching the appropriate override policy. The override policy scopes what that specific signer can authorize.

<View title="React" icon="react">
  ```tsx  theme={"system"}
  import {useSigners} from '@privy-io/react-auth';

  const {addSigners} = useSigners();

  await addSigners({
    address: walletAddress,
    signers: [
      {
        signerId: '<restricted-signer-authorization-key-id>',
        policyIds: ['<restrictive-policy-id>']
      },
      {
        signerId: '<full-access-signer-authorization-key-id>',
        policyIds: ['<permissive-policy-id>']
      }
    ]
  });
  ```
</View>

<View title="NodeJS" icon="node-js">
  Update the wallet with the desired `additional_signers`. The wallet owner must [sign](/controls/authorization-keys/using-owners/sign) the request.

  ```ts  theme={"system"}
  const wallet = await privy.wallets().update(walletId, {
    additional_signers: [
      {
        signer_id: '<restricted-signer-authorization-key-id>',
        override_policy_ids: ['<restrictive-policy-id>']
      },
      {
        signer_id: '<full-access-signer-authorization-key-id>',
        override_policy_ids: ['<permissive-policy-id>']
      }
    ]
  });
  ```
</View>

<View title="REST API" icon="terminal">
  Make a `PATCH` request to:

  ```sh  theme={"system"}
  https://api.privy.io/v1/wallets/<wallet-id>
  ```

  with the body:

  ```json  theme={"system"}
  {
    "additional_signers": [
      {
        "signer_id": "<restricted-signer-authorization-key-id>",
        "override_policy_ids": ["<restrictive-policy-id>"]
      },
      {
        "signer_id": "<full-access-signer-authorization-key-id>",
        "override_policy_ids": ["<permissive-policy-id>"]
      }
    ]
  }
  ```
</View>

## 4. Route transactions through the appropriate signer

Your server selects which authorization key to use based on the request context. For example, an automated service signs with the restricted signer, while an admin endpoint signs with the full-access signer.

<View title="NodeJS" icon="node-js">
  ```ts  theme={"system"}
  async function sendTransaction(walletId: string, transaction: object, signerPrivateKey: string) {
    const result = await privy
      .wallets()
      .ethereum()
      .sendTransaction(walletId, {
        caip2: 'eip155:1',
        params: {transaction},
        authorization_context: {
          authorization_private_keys: [signerPrivateKey]
        }
      });

    return result;
  }

  // Automated bot uses the restricted signer
  await sendTransaction(walletId, botTransaction, restrictedSignerPrivateKey);

  // Admin uses the full-access signer
  await sendTransaction(walletId, adminTransaction, fullAccessSignerPrivateKey);
  ```
</View>

<View title="REST API" icon="terminal">
  Include the appropriate signer's authorization signature in the `privy-authorization-signature` header. The enclave evaluates the override policy attached to whichever signer produced the signature.

  ```bash  theme={"system"}
  # Restricted signer request (restrictive policy applies)
  curl --request POST https://api.privy.io/v1/wallets/<wallet-id>/rpc \
    -u "<your-privy-app-id>:<your-privy-app-secret>" \
    -H "privy-app-id: <your-privy-app-id>" \
    -H "privy-authorization-signature: <restricted-signer-signature>" \
    -H "Content-Type: application/json" \
    -d '{
      "caip2": "eip155:1",
      "method": "eth_sendTransaction",
      "chain_type": "ethereum",
      "params": {
        "transaction": {
          "to": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
          "data": "0xa9059cbb..."
        }
      }
    }'
  ```
</View>

If the transaction violates the signer's override policy, Privy denies the request. Transactions do not fall back to another signer's policy — Privy evaluates each signer independently.

## Learn more

<CardGroup cols={3}>
  <Card title="Additional signers" href="/wallets/using-wallets/signers/overview">
    Add signers to wallets and manage their permissions.
  </Card>

  <Card title="Policies" href="/controls/policies/overview">
    Define rules that constrain which transactions are allowed.
  </Card>

  <Card title="Authorization keys" href="/controls/authorization-keys/keys/create/key">
    Create and manage server-controlled authorization keys.
  </Card>
</CardGroup>
\n