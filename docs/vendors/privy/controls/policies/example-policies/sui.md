> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Sui examples

A Sui transaction consists of one or multiple inputs and commands. Common Sui commands to transfer stablecoins include:

* `SplitCoins`, which splits off one or more coins from a single coin.
* `MergeCoins`, which merges one or more coins of the same type into a single coin.
* `TransferObjects` is used to transfer objects to a specified destination address.

## Allowlist specific Sui transaction commands

```ts {skip-check} theme={"system"}
{
    "version": "1.0",
    "name": "Allow TransferObjects, SplitCoins and MergeCoins",
    "chain_type": "sui",
    "rules": [
        {
            "name": "Allow TransferObjects, SplitCoins and MergeCoins commands",
            "method": "signTransactionBytes",
            "conditions": [
                {
                    "field_source": "sui_transaction_command",
                    "field": "commandName",
                    "operator": "in",
                    "value": ["TransferObjects", "SplitCoins", "MergeCoins"]
                }
            ],
            "action": "ALLOW"
        }
    ]
}
```

## Configure a max amount on the TransferObjects command (summed amount per command, assuming coins are of the same type)

```ts {skip-check} theme={"system"}
{
    "version": "1.0",
    "name": "TransferObjects summed maximum amount",
    "chain_type": "sui",
    "rules": [
        {
            "name": "TransferObjects amount summed maximum",
            "method": "signTransactionBytes",
            "conditions": [
                {
                    "field_source": "sui_transfer_objects_command",
                    "field": "amount",
                    "operator": "lt",
                    "value": "10000000"
                }
            ],
            "action": "ALLOW"
        }
    ]
}
```

## Allowlist a specific Sui transaction recipient

```ts {skip-check} theme={"system"}
{
    "version": "1.0",
    "name": "Allow specific recipient",
    "chain_type": "sui",
    "rules": [
        {
            "name": "Allow specific recipient",
            "method": "signTransactionBytes",
            "conditions": [
                {
                    "field_source": "sui_transfer_objects_command",
                    "field": "recipient",
                    "operator": "eq",
                    "value": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
                }
            ],
            "action": "ALLOW"
        }
    ]
}
```

## Allowlist specific Sui transaction recipients with condition set

```ts {skip-check} theme={"system"}
{
    "version": "1.0",
    "name": "Allow specific recipients with condition set",
    "chain_type": "sui",
    "rules": [
        {
            "name": "Allow specific recipients with condition set",
            "method": "signTransactionBytes",
            "conditions": [
                {
                    "field_source": "sui_transfer_objects_command",
                    "field": "recipient",
                    "operator": "in_condition_set",
                    "value": "a2p4etpcbj2dltbjfigybi8j"
                }
            ],
            "action": "ALLOW"
        }
    ]
}
```

## Only allow transactions after a certain start date

```ts {skip-check} theme={"system"}
{
    "version": "1.0",
    "name": "Only allow transactions after a certain start date",
    "chain_type": "sui",
    "rules": [
        {
            "name": "Only allow transactions after a certain start date",
            "method": "signTransactionBytes",
            "conditions": [
                {
                    "field_source": "system",
                    "field": "current_unix_timestamp",
                    "operator": "gt",
                    "value": "1757304000"  // 2025-09-08 00:00:00 UTC in seconds since epoch
                }
            ],
            "action": "ALLOW"
        }
    ]
}
```

## Allow transfers to a specific recipients after a certain timestamp

<Note>
  This is an example of mixing TransferObjects and System configurations.
</Note>

```ts {skip-check} theme={"system"}
{
    "version": "1.0",
    "name": "Allow specific recipients after a certain timestamp",
    "chain_type": "sui",
    "rules": [
        {
            "name": "Allow specific recipients after a certain timestamp",
            "method": "signTransactionBytes",
            "conditions": [
                {
                    "field_source": "sui_transfer_objects_command",
                    "field": "recipient",
                    "operator": "in_condition_set",
                    "value": "a2p4etpcbj2dltbjfigybi8j",
                },
                {
                    "field_source": "system",
                    "field": "current_unix_timestamp",
                    "operator": "gt",
                    "value": "1757304000", // 2025-09-08 00:00:00 UTC in seconds since epoch
                }
            ],
            "action": "ALLOW"
        }
    ]
}
```

## Denylist recipients of a TransferObjects with condition sets

```ts {skip-check} theme={"system"}
{
    "version": "1.0",
    "name": "Denylist TransferObjects recipients with condition set",
    "chain_type": "sui",
    "rules": [
        {
            "name": "Denylist TransferObjects recipients with condition set",
            "method": "signTransactionBytes",
            "conditions": [
                {
                    "field_source": "sui_transfer_objects_command",
                    "field": "recipient",
                    "operator": "in_condition_set",
                    "value": "a2p4etpcbj2dltbjfigybi8j"
                }
            ],
            "action": "DENY", // Note: setting the action to 'ALLOW' makes this an allowlist
        }
    ]
}
```
\n