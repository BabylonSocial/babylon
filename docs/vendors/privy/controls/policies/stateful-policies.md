> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Stateful policies

# Overview

Aggregations enable tracking and persistence of metric data from RPC requests over time. They allow policy rules to evaluate wallet activity against historical data, enabling more sophisticated controls like rate limiting and spending caps.

Together with policies, aggregations make it possible to express constraints that depend on cumulative behavior rather than just the current request.

This approach offers several benefits:

* **Rate limiting**: Enforce transaction volume limits over time windows
* **Spending caps**: Limit total value transferred within a period
* **Activity monitoring**: Track transaction patterns across chain IDs or contract addresses
* **Dynamic policies**: Create rules that adapt based on historical wallet behavior

## Concepts

Aggregations are defined by four core primitives: aggregations, metrics, windows, and group-by fields. At a high-level:

* **Aggregations** define what data to track from RPC requests and how to aggregate it over time
* **Metrics** specify which field to extract from requests and how to aggregate values (e.g., sum transaction values)
* **Windows** define the time period over which to aggregate data (e.g., rolling 1-hour windows)
* **Conditions** define pre-filters that determine which requests should be included in the aggregation (e.g., only transactions to a specific contract)
* **Group-by fields** optionally partition aggregations by specific attributes (e.g., by chain ID or recipient)

Once created, aggregations can be referenced in policy conditions using the `reference` field source. When a condition uses `field_source: 'reference'` and `aggregation.{aggregation_id}` as the `field`, the policy engine evaluates the current aggregated value against the specified threshold.

## Create aggregations

Refer to the [API reference](/api-reference/aggregations/create) for creating aggregations.

<Tip>
  Aggregations are associated with the app that creates them. Each aggregation tracks data for RPC
  requests made through that app's wallets.
</Tip>

<Info>
  Each app can have a maximum of **10 aggregations**. Plan your aggregation strategy carefully to
  stay within this limit.
</Info>

## How aggregations are applied

When a wallet receives an RPC request, aggregations are processed in two phases: **data collection** and **policy evaluation**.

### Data collection

When a request is made, **all aggregations** referenced in the wallet's policies are updated. Multiple policies can reference the same aggregation, which is useful for sharing limits across different policy types (e.g., multiple signer override policies can reference the same aggregation to limit total transfer value out of a wallet in a rolling time window).

This includes aggregations from:

* The wallet's directly assigned policy
* Owner policies (if the wallet has an owner)
* Signer override policies (if the request includes a signer with an override policy)

For each aggregation:

1. The aggregation's `conditions` are evaluated against the request. If all conditions pass, the aggregation proceeds to value extraction.
2. The metric value is extracted from the request based on the aggregation's `metric` configuration.
3. If the value **cannot be extracted** (e.g., the field doesn't exist or the calldata doesn't match the ABI), the value defaults to **0**. Be careful when defining metrics: if you want the limit to apply to multiple operations (e.g., both `approve()` and `transfer()` calls against a contract ABI), you must configure separate aggregations or conditions for each operation.
4. The extracted value is added to the aggregation's running total for the current time bucket.

<Info>
  Aggregation data is collected for all matching aggregations, regardless of whether the policy
  ultimately allows or denies the request. This ensures accurate tracking even when requests are
  denied for other reasons.
</Info>

<Warning>
  Aggregation values are updated **after** a request is successfully signed, not before. This means
  multiple concurrent requests may all pass policy evaluation before any of their values are
  recorded. Stateful policies are designed for **disaster prevention** (e.g., catching runaway
  scripts or limiting blast radius) rather than strict real-time enforcement. To mitigate
  concurrency risks, combine aggregation-based limits with lower per-transaction thresholds and rate
  limit your application's request throughput.
</Warning>

### Policy evaluation

When evaluating a policy condition that references an aggregation:

1. The policy engine retrieves the current aggregated value for the time window.
2. If group-by fields are configured, the engine uses the group key derived from the current request.
3. If the metric value **cannot be extracted** from the current request, the policy engine uses the **existing aggregated value** (without including the current request).
4. If the metric value **can be extracted**, the policy engine uses the aggregated value **plus the current request's value**.
5. The total is compared against the condition's threshold using the specified operator.

<Tip>
  This means policy evaluation is "forward-looking" — it considers what the aggregated value would
  be **after** the current request is processed, not just the historical total.
</Tip>

<Warning>
  If an aggregation is deleted, any policy conditions that reference it will evaluate to `false`,
  which may result in requests being denied.
</Warning>

## Supported RPC methods

Aggregations can be configured for the following RPC methods:

| Method                  | Chain    | Description                           |
| ----------------------- | -------- | ------------------------------------- |
| `eth_signTransaction`   | Ethereum | Standard Ethereum transaction signing |
| `eth_signUserOperation` | Ethereum | ERC-4337 user operation signing       |

## Metric configuration

The `metric` object defines what value to extract from requests:

<Expandable title="metric attributes" defaultOpen="true">
  <ResponseField name="field" type="string" required>
    The field to extract from the request. For example, `'value'` for transaction value.
  </ResponseField>

  <ResponseField name="field_source" type="'ethereum_transaction' | 'ethereum_calldata'" required>
    The data source from which to derive the field. Must correspond to the aggregation's `method`.
  </ResponseField>

  <ResponseField name="function" type="'sum'" required>
    The aggregation function to apply. Currently, only `'sum'` is supported.
  </ResponseField>

  <ResponseField name="abi" type="JSON">
    Contract ABI to decode calldata against. Required when `field_source` is `'ethereum_calldata'`.
  </ResponseField>
</Expandable>

### Supported field sources

| Field source             | Description                            | Example fields                                  |
| ------------------------ | -------------------------------------- | ----------------------------------------------- |
| `'ethereum_transaction'` | Direct transaction fields              | `value`, `chain_id`                             |
| `'ethereum_calldata'`    | Decoded calldata fields (requires ABI) | `function_name._amount`, `function_name._value` |

## Window configuration

The `window` object defines the time bucketing strategy:

<Expandable title="window attributes" defaultOpen="true">
  <ResponseField name="type" type="'rolling'" required>
    The bucketing type. Currently, only `'rolling'` windows are supported.
  </ResponseField>

  <ResponseField name="seconds" type="number" required>
    The duration of the time window in seconds. Minimum value is `3600` (1 hour), and maximum is `259200` (72 hours).
  </ResponseField>
</Expandable>

## Conditions configuration

The optional `conditions` array defines pre-filters that determine which requests should be included in the aggregation. Only requests that match all conditions will have their metric values aggregated.

<Expandable title="condition attributes" defaultOpen="true">
  <ResponseField name="field_source" type="'ethereum_transaction' | 'ethereum_calldata'" required>
    The data source from which to derive the field for the condition.
  </ResponseField>

  <ResponseField name="field" type="string" required>
    The field to evaluate. For example, `'to'` for the transaction recipient or `'chain_id'` for the
    chain ID.
  </ResponseField>

  <ResponseField name="operator" type="'eq' | 'neq' | 'lt' | 'lte' | 'gt' | 'gte' | 'in' | 'in_condition_set'" required>
    The comparison operator to use. The `in_condition_set` operator is supported for aggregation
    conditions.
  </ResponseField>

  <ResponseField name="value" type="string | number | string[]" required>
    The value to compare against. Use an array for the `'in'` operator.
  </ResponseField>

  <ResponseField name="abi" type="JSON">
    Contract ABI to decode calldata against. Required when `field_source` is `'ethereum_calldata'`.
  </ResponseField>
</Expandable>

<Tip>
  Use conditions to scope aggregations to specific contracts, chains, or transaction types. For
  example, you can track ERC-20 transfers to a specific token contract by adding a condition that
  checks the `to` field.
</Tip>

## Group-by configuration

The optional `group_by` array partitions aggregations by specific fields:

<Expandable title="group_by attributes" defaultOpen="true">
  <ResponseField name="field" type="string" required>
    The field to group by. For example, `'chain_id'`.
  </ResponseField>

  <ResponseField name="field_source" type="string" required>
    The data source from which to derive the grouping field.
  </ResponseField>
</Expandable>

When group-by fields are configured, separate aggregation buckets are maintained for each unique combination of group-by values.
\n