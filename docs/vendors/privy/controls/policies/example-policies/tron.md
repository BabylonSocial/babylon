> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Tron examples

The decision to use a `TransferContract` or a `TriggerSmartContract` on Tron depends on the asset you are moving and whether you are interacting with a smart contract.

Use a `TransferContract` when you are performing a simple, direct transfer of native TRX between two standard accounts.

Use a `TriggerSmartContract` when you are interacting with any smart contract, which is necessary for transferring TRC-20 tokens and calling any function on a smart contract.

## Allowlist a specific TransferContract to\_address

```ts {skip-check} theme={"system"}
{
    "version": "1.0",
    "name": "TransferContract to_address",
    "chain_type": "tron",
    "rules": [
        {
            "name": "Allow specific TransferContract to_address",
            "method": "signTransactionBytes",
            "conditions": [
                {
                    "field_source": "tron_transaction",
                    "field": "TransferContract.to_address",
                    "operator": "eq",
                    "value": "TBia4uHnb3oSSZm5isP284cA7Np1v15Vhi"
                }
            ],
            "action": "ALLOW"
        }
    ]
}
```

## Configure a max TransferContract amount (TRX)

```ts {skip-check} theme={"system"}
{
    "version": "1.0",
    "name": "TransferContract amount",
    "chain_type": "tron",
    "rules": [
        {
            "name": "TransferContract amount maximum",
            "method": "signTransactionBytes",
            "conditions": [
                {
                    "field_source": "tron_transaction",
                    "field": "TransferContract.amount",
                    "operator": "lt",
                    "value": "10000000"
                }
            ],
            "action": "ALLOW"
        }
    ]
}
```

## Configure a max TriggerSmartContract call\_value (TRX)

```ts {skip-check} theme={"system"}
{
    "version": "1.0",
    "name": "TriggerSmartContract contract address",
    "chain_type": "tron",
    "rules": [
        {
            "name": "TriggerSmartContract call_value",
            "method": "signTransactionBytes",
            "conditions": [
                {
                    "field_source": "tron_transaction",
                    "field": "TriggerSmartContract.call_value",
                    "operator": "lt",
                    "value": "10000000"
                }
            ],
            "action": "ALLOW"
        }
    ]
}
```

## Disallow a certain TriggerSmartContract token\_id (TRC-10)

```ts {skip-check} theme={"system"}
{
    "version": "1.0",
    "name": "TriggerSmartContract token id",
    "chain_type": "tron",
    "rules": [
        {
            "name": "TriggerSmartContract token_id",
            "method": "signTransactionBytes",
            "conditions": [
                {
                    "field_source": "tron_transaction",
                    "field": "TriggerSmartContract.token_id",
                    "operator": "eq",
                    "value": "1000100"
                }
            ],
            "action": "DENY"
        }
    ]
}
```

## Configure a max TriggerSmartContract call\_token\_value (TRC-10)

```ts {skip-check} theme={"system"}
{
    "version": "1.0",
    "name": "TriggerSmartContract call_token_value",
    "chain_type": "tron",
    "rules": [
        {
            "name": "TriggerSmartContract call_token_value",
            "method": "signTransactionBytes",
            "conditions": [
                {
                    "field_source": "tron_transaction",
                    "field": "TriggerSmartContract.call_token_value",
                    "operator": "lt",
                    "value": "10000000"
                }
            ],
            "action": "ALLOW"
        }
    ]
}
```

## Allow a certain owner address to transfer TRC20 token

```ts {skip-check} theme={"system"}
{
    "version": "1.0",
    "name": "TriggerSmartContract with ABI",
    "chain_type": "tron",
    "rules": [
        {
            "name": "TriggerSmartContract transferFrom._from",
            "method": "signTransactionBytes",
            "conditions": [
                {
                    "field_source": "tron_trigger_smart_contract_data",
                    "field": "transferFrom._from",
                    "operator": "eq",
                    "value": "THscQ8SwfcD7tdts9cnMxTnH2hwvpX3ujy",
                    "abi": [
                        {
                            "type": "function",
                            "name": "transferFrom",
                            "inputs": [
                                {
                                    "name": "_from",
                                    "type": "address"
                                },
                                {
                                    "name": "_to",
                                    "type": "address"
                                },
                                {
                                    "name": "_value",
                                    "type": "uint256"
                                }
                            ],
                            "outputs": [
                                {
                                    "type": "bool"
                                }
                            ],
                            "stateMutability": "nonpayable"
                        }
                    ]
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
    "chain_type": "tron",
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

## Allow transfers to a specific address after a certain timestamp

<Note>
  This is an example of mixing TransferContract and System configurations.
</Note>

```ts {skip-check} theme={"system"}
{
    "version": "1.0",
    "name": "Allow specific address after a certain timestamp",
    "chain_type": "tron",
    "rules": [
        {
            "name": "Allow specific address after a certain timestamp",
            "method": "signTransactionBytes",
            "conditions": [
                {
                    "field_source": "tron_transaction",
                    "field": "TransferContract.to_address",
                    "operator": "eq",
                    "value": "TG3XXyExBkPp9nzdajDZsozEu4BkaSJozs",
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

## Allow transfers to a specific address with a specific contract address

<Note>
  This is an example of mixing TriggerSmartContract and ABI configurations.
</Note>

```ts {skip-check} theme={"system"}
{
    "version": "1.0",
    "name": "Allow a specific address with a specific contract",
    "chain_type": "tron",
    "rules": [
        {
            "name": "Allow a specific address with a specific contract",
            "method": "signTransactionBytes",
            "conditions": [
                {
                    "field_source": "tron_transaction",
                    "field": "TriggerSmartContract.contract_address",
                    "operator": "eq",
                    "value": "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
                },
                {
                    "field_source": "tron_trigger_smart_contract_data",
                    "field": "transfer.to",
                    "operator": "eq",
                    "value": "TG3XXyExBkPp9nzdajDZsozEu4BkaSJozs",
                    "abi": [
                        {
                            "name": "transfer",
                            "type": "function",
                            "inputs": [{"name": "to", "type": "address"}],
                        },
                    ],
                }
            ],
            "action": "ALLOW"
        }
    ]
}
```

## Allow transfers to a specific address with ABI after a certain timestamp

<Note>
  This is an example of mixing TriggerSmartContract with ABI and System configurations.
</Note>

```ts {skip-check} theme={"system"}
{
    "version": "1.0",
    "name": "Allow specific address with ABI after a timestamp",
    "chain_type": "tron",
    "rules": [
        {
            "name": "Allow specific address with ABI after a timestamp",
            "method": "signTransactionBytes",
            "conditions": [
                {
                    "field_source": "tron_trigger_smart_contract_data",
                    "field": "transfer.to",
                    "operator": "eq",
                    "value": "TG3XXyExBkPp9nzdajDZsozEu4BkaSJozs",
                    "abi": [
                        {
                            "name": "transfer",
                            "type": "function",
                            "inputs": [{"name": "to", "type": "address"}],
                        },
                    ],
                },
                {
                    "field_source": "system",
                    "field": "current_unix_timestamp",
                    "operator": "gt",
                    "value": "1757304000", // 2025-09-08 00:00:00 UTC in seconds since epoch
                },
            ],
            "action": "ALLOW"
        }
    ]
}
```

## Denylist recipients of a TransferContract with condition sets

```ts {skip-check} theme={"system"}
{
    "version": "1.0",
    "name": "Denylist TransferContract to_address",
    "chain_type": "tron",
    "rules": [
        {
            "name": "Denylist TransferContract to_address",
            "method": "signTransactionBytes",
            "conditions": [
                {
                    "field_source": "tron_transaction",
                    "field": "TransferContract.to_address",
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