> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Condition sets

# Overview

Condition sets provide a flexible way to define reusable lists of values that can be referenced in policy conditions.
Instead of hardcoding values directly in policy rules, you can create a named condition set (e.g., "Approved Recipients") and reference it using the `in_condition_set` operator.

Together, condition sets make it easy to express complex constraints cleanly and keep policies maintainable as your application grows.

This approach offers several benefits:

* **Maintainability**: Update the list of values in one place without modifying policy rules
* **Reusability**: Reference the same condition set across multiple policies and rules
* **Scalability**: Manage large lists of values efficiently
* **Dynamic Updates**: Add or remove values without redeploying policies

## Concepts

Condition sets are defined by three core primitives: condition sets, condition set items, and policy conditions. At a high-level:

* Condition sets are lists of values that can be referenced in policy conditions.
* Condition set items are individual items that belong to a condition set, whose values are directly evaluated against.
* Policy conditions are boolean statements that the policy engine can evaluate RPC requests against (see [Conditions section](/controls/policies/overview#conditions))

## The `in_condition_set` Operator

The `in_condition_set` operator allows you to check if the value of a transaction field exists in a condition set.
This is particularly useful for maintaining allowlists or denylists of addresses, contracts, or other string values.

The `in_condition_set` operator can be configured with a variety of fields and field sources, including `ethereum_transaction.to`, `solana_system_program_instruction.Transfer.to`, etc.

## Create condition sets and items

Refer to the [API reference](/api-reference/condition-sets/create) for creating condition sets and items.

<Tip>
  * Creating a condition set requires an [owner](/controls/authorization-keys/using-owners/overview).
  * Updating condition sets or condition set items with the following endpoints requires
    [authorization signature](/api-reference/authorization-signatures#usage).
    * [`PATCH /v1/condition_sets/{condition_set_id}`](/api-reference/condition-sets/update)
    * [`DELETE /v1/condition_sets/{condition_set_id}`](/api-reference/condition-sets/delete)
    * [`POST /v1/condition_sets/{condition_set_id}/condition_set_items`](/api-reference/condition-sets/condition-set-items/create)
    * [`PUT /v1/condition_sets/{condition_set_id}/condition_set_items`](/api-reference/condition-sets/condition-set-items/update)
    * [`DELETE /v1/condition_sets/{condition_set_id}/condition_set_items/{condition_set_item_id}`](/api-reference/condition-sets/condition-set-items/delete)
  * Deleting a condition set will delete all condition set items that have the same condition set id.
</Tip>

## Condition sets evaluation

When the rules that are associated with the requested RPC method is evaluated:

1. The policy engine extracts the value of the corresponding field from the transaction.
2. If a `ConditionSetItem` item is found with `conditionSetId` and the `value` (the value from the previous step), the condition evaluates to `true`.
3. If all conditions in the rule pass, the rule evaluates to `ALLOW` action.

<Tip>
  The policy engine evaluates the raw value from the transaction directly against values of
  condition set items without any conversion. All `ConditionSetItem`s must be *exactly* the value of
  the field, and is case sensitive.
</Tip>

<Warning>
  If a condition set is deleted, all conditions that evaluate against that condition set will
  evaluate to `false`.
</Warning>

## Example: Allowlist of recipient addresses

This example demonstrates how to create a policy that only allows transactions to approved recipient addresses using a condition set.

### Step 1: Create a condition set

```json  theme={"system"}
POST /v1/condition_sets
{
  "name": "Approved Recipients",
  "owner_id": "asgkan0r7gi0wdbvf9cw8qio"
}
```

Response:

```json  theme={"system"}
{
  "id": "qvah5m2hmp9abqlxdmfiht95",
  "name": "Approved Recipients",
  "owner_id": "asgkan0r7gi0wdbvf9cw8qio",
  "created_at": 1761271537642
}
```

### Step 2: Add approved addresses to the condition set

```json  theme={"system"}
POST /v1/condition_sets/qvah5m2hmp9abqlxdmfiht95/condition_set_items
[
  { "value": "0x5B8b13e8f3E6Ec888e88C77cf039EB6281F21D93" },
  { "value": "0xB00F0759DbeeF5E543Cc3E3B07A6442F5f3928a2" }
]
```

### Step 3: Create a policy rule using the condition set

```json  theme={"system"}
{
  "version": "1.0",
  "name": "example of in_condition_set operator",
  "chain_type": "ethereum",
  "rules": [
    {
      "name": "allow if recipient is in allow_list",
      "action": "ALLOW",
      "method": "eth_sendTransaction",
      "conditions": [
        {
          "field_source": "ethereum_transaction",
          "field": "to",
          "operator": "in_condition_set",
          "value": "qvah5m2hmp9abqlxdmfiht95"
        }
      ]
    }
  ]
}
```

The following transaction is allowed because `0x5B8b13e8f3E6Ec888e88C77cf039EB6281F21D93` is in the condition set.

```json  theme={"system"}
{
  "method": "eth_sendTransaction",
  "params": {
    "transaction": {
      "to": "0x5B8b13e8f3E6Ec888e88C77cf039EB6281F21D93",
      "value": "0x1000000000000000"
    }
  }
}
```

The following transaction denied because `0x0000000000000000000000000000000000000000` is not in the condition set.

```json  theme={"system"}
{
  "method": "eth_sendTransaction",
  "params": {
    "transaction": {
      "to": "0x0000000000000000000000000000000000000000",
      "value": "0x1000000000000000"
    }
  }
}
```

## Example: Denylist of recipient addresses

The example `Allowlist of recipient addresses` functions as a denylist of recipient addresses if the `action` is set to to `DENY` at [step 3](#step-3%3A-create-a-policy-rule-using-the-condition-set).
\n