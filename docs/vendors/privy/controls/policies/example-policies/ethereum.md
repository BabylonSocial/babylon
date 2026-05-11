> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Ethereum examples

## Allowlist a specific smart contract

```ts {skip-check} theme={"system"}
{
    version: '1.0',
    name: 'Allowlisted contracts',
    chain_type: 'ethereum',
    rules: [
        {
            name: 'Allowlist the USDC address',
            method: 'eth_sendTransaction',
            action: 'ALLOW',
            conditions: [
                {
                    field_source: 'ethereum_transaction',
                    field: 'to',
                    operator: 'eq',
                    value: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'
                },
            ]
        },
        {
            name: 'Allowlist for Base specifically',
            method: 'eth_signTypedData_v4',
            action: 'ALLOW',
            conditions: [
                {
                    field_source: 'ethereum_typed_data_domain',
                    field: 'chainId',
                    operator: 'eq',
                    value: '8453'
                }
            ]
        }
    ],
}
```

## Configure a max transfer value of ETH

```ts {skip-check} theme={"system"}
{
    version: '1.0',
    name: 'Native token transfer maximums',
    chain_type: 'ethereum',
    rules: [{
        name: 'Restrict ETH transfers to a maximum value',
        method: 'eth_sendTransaction',
        conditions: [
            {
                field_source: 'ethereum_transaction',
                field: 'value',
                operator: 'lte',
                value: '0x2386F26FC10000',
            },
        ],
        action: 'ALLOW'
    }]
}
```

## Restrict transactions to specific chains

Use the `chain_id` field to ensure transactions can only be executed on specific chains.

<Tabs>
  <Tab title="Single chain">
    ```ts {skip-check} theme={"system"}
    {
        version: '1.0',
        name: 'Base chain only',
        chain_type: 'ethereum',
        rules: [{
            name: 'Only allow transactions on Base',
            method: 'eth_sendTransaction',
            conditions: [
                {
                    field_source: 'ethereum_transaction',
                    field: 'chain_id',
                    operator: 'eq',
                    value: '8453' // Base mainnet chain ID
                },
            ],
            action: 'ALLOW'
        }]
    }
    ```
  </Tab>

  <Tab title="Multiple chains">
    ```ts {skip-check} theme={"system"}
    {
        version: '1.0',
        name: 'Mainnet and Base only',
        chain_type: 'ethereum',
        rules: [{
            name: 'Allow transactions on only Ethereum mainnet or Base',
            method: 'eth_sendTransaction',
            conditions: [
                {
                    field_source: 'ethereum_transaction',
                    field: 'chain_id',
                    operator: 'in',
                    value: ['1', '8453'] // Ethereum mainnet and Base
                },
            ],
            action: 'ALLOW'
        }]
    }
    ```
  </Tab>
</Tabs>

## Configure a max transfer value of an ERC20 token

```ts {skip-check} theme={"system"}
{
    version: '1.0',
    name: 'ERC20 maximums',
    chain_type: 'ethereum',
    rules: [
        {
            name: 'Restrict USDC transfers to be less than or equal to some value',
            method: 'eth_sendTransaction',
            conditions: [
                {
                    field_source: 'ethereum_transaction',
                    field: 'to',
                    operator: 'eq',
                    value: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' // USDC address on Base
                },
                {
                    field_source: 'ethereum_calldata',
                    // 'transfer' must match the function name, 'amount' must match an input name.
                    field: 'transfer.amount',
                    abi: [{
                        "inputs": [
                            {
                                "internalType": "address",
                                "name": "recipient",
                                "type": "address"
                            },
                            {
                                "internalType": "uint256",
                                "name": "amount",
                                "type": "uint256"
                            }
                        ],
                        "name": "transfer",
                        "outputs": [
                            {
                                "internalType": "bool",
                                "name": "",
                                "type": "bool"
                            }
                        ],
                        "stateMutability": "nonpayable",
                        "type": "function"
                    }],
                    operator: 'lte',
                    value: '0x2386F26FC10000',
                }
            ],
            action: 'ALLOW'
        }
    ]
}
```

## Allow specific smart contract function calls

Use `field: "function_name"` to match specific functions being called, regardless of their parameters. This is useful for:

* Functions with no parameters (like `deposit()` or `withdraw()`)
* Functions where you want to allow any parameter values

```ts {skip-check} theme={"system"}
{
    version: '1.0',
    name: 'Allow WETH deposit',
    chain_type: 'ethereum',
    rules: [
        {
            name: 'Allow deposit to WETH contract',
            method: 'eth_sendTransaction',
            action: 'ALLOW',
            conditions: [
                {
                    field_source: 'ethereum_transaction',
                    field: 'to',
                    operator: 'eq',
                    value: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'
                },
                {
                    field_source: 'ethereum_calldata',
                    field: 'function_name',
                    abi: [{
                        "name": "deposit",
                        "type": "function",
                        "stateMutability": "payable",
                        "inputs": [],
                        "outputs": []
                    }],
                    operator: 'eq',
                    value: 'deposit'
                }
            ]
        }
    ]
}
```

## Only allow transfers after a certain start date

```ts {skip-check} theme={"system"}
{
    version: '1.0',
    name: 'Only allow transfers after a certain start date',
    chain_type: 'ethereum',
    rules: [{
        name: 'Only allow transfers after a certain start date',
        method: 'eth_sendTransaction',
        conditions: [{
            field_source: 'system',
            field: 'current_unix_timestamp',
            operator: 'gte',
            value: '1757304000' // 2025-09-08 00:00:00 UTC in seconds since epoch
        }],
        action: 'ALLOW'
    }]
}
```

## Denylist recipients of a transaction

```ts {skip-check} theme={"system"}
{
    version: '1.0',
    name: 'Denylisted addresses',
    chain_type: 'ethereum',
    rules: [{
        name: 'Deny interactions with the USDC contract',
        method: 'eth_sendTransaction',
        conditions: [
            {
                field_source: 'ethereum_transaction',
                field: 'to',
                operator: 'eq',
                value: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'
            },
        ],
        action: 'DENY'
    }]
}
```

## Denylist recipients of a transaction with condition sets

```ts {skip-check} theme={"system"}
{
    version: '1.0',
    name: 'Denylisted addresses with condition set',
    chain_type: 'ethereum',
    rules: [{
        name: 'Deny interactions with the USDC contract',
        method: 'eth_sendTransaction',
        conditions: [
            {
                field_source: 'ethereum_transaction',
                field: 'to',
                operator: 'in_condition_set',
                value: 'a2p4etpcbj2dltbjfigybi8j'
            },
        ],
        action: 'DENY' // Note: setting the action to 'ALLOW' makes this an allowlist
    }]
}
```

## Enforce policies across multiple RPC methods

```ts {skip-check} theme={"system"}
{
    version: '1.0',
    name: 'Example policy with multiple RPC methods',
    chain_type: 'ethereum',
    rules: [{
        name: 'Deny interactions with the USDC contract',
        method: 'eth_sendTransaction',
        conditions: [
            {
                field_source: 'ethereum_transaction',
                field: 'to',
                operator: 'eq',
                value: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'
            },
        ],
        action: 'DENY'
    }, {
        name: 'Only allow certain messages to be signed',
        method: 'personal_sign',
        conditions: [
            {
                field_source: 'ethereum_message',
                field: 'value',
                operator: 'eq',
                value: 'Hello world'
            },
        ],
        action: 'ALLOW'
    }]
}
```

## Deny all requests

```ts {skip-check} theme={"system"}
{
    version: '1.0',
    name: 'Example policy to deny all requests',
    chain_type: 'ethereum',
    rules: [{
        name: 'Deny all requests',
        method: '*',
        conditions: [],
        action: 'DENY'
    }]
}
```

## Restrict typed data domains to a specific chain ID and verifying contract

```ts {skip-check} theme={"system"}
{
    version: '1.0',
    name: 'Example policy to allow a specific signing domain',
    chain_type: 'ethereum',
    rules: [{
        name: 'Allow specific domain to sign messages',
        method: 'eth_signTypedData_v4',
        conditions: [
            {
                field_source: 'ethereum_typed_data_domain',
                field: 'chainId',
                operator: 'eq',
                value: '8453'
            },
            {
                field_source: 'ethereum_typed_data_domain',
                field: 'verifyingContract',
                operator: 'eq',
                value: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'
            }
        ],
        action: 'ALLOW'
    }],
}
```

## Restrict parameters of a typed data message

```ts {skip-check} theme={"system"}
{
    version: '1.0',
    name: 'Allow ERC20 Permits for known owners, max value',
    chain_type: 'ethereum',
    rules: [{
        name: 'Allow specific owner addresses and a max value',
        method: 'eth_signTypedData_v4',
        conditions: [
            {
                field_source: 'ethereum_typed_data_message',
                typed_data: {
                    types: {
                        Person: [
                            {name: 'name', type: 'string'},
                            {name: 'wallet', type: 'address'},
                        ],
                        Permit: [
                            {name: 'owner', type: 'Person'},
                            {name: 'spender', type: 'Person'},
                            {name: 'value', type: 'uint256'},
                            {name: 'deadline', type: 'uint256'},
                            {name: 'v', type: 'uint8'},
                            {name: 'r', type: 'bytes32'},
                            {name: 's', type: 'bytes32'},
                        ],
                    },
                    primary_type: 'Permit',
                },
                field: 'owner.wallet', // dot-separated path to primitive 'address' type that 'value' will be compared against.
                operator: 'in',
                value: ['0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', '0x123589fCD6eDb6E08f4c7C32D4f71b54bdA02911'],
            },
            {
                field_source: 'ethereum_typed_data_message',
                typed_data: {
                    types: {
                        Person: [
                            {name: 'name', type: 'string'},
                            {name: 'wallet', type: 'address'},
                        ],
                        Permit: [
                            {name: 'owner', type: 'Person'},
                            {name: 'spender', type: 'Person'},
                            {name: 'value', type: 'uint256'},
                            {name: 'deadline', type: 'uint256'},
                            {name: 'v', type: 'uint8'},
                            {name: 'r', type: 'bytes32'},
                            {name: 's', type: 'bytes32'},
                        ],
                    },
                    primary_type: 'Permit',
                },
                field: 'value',
                operator: 'lte',
                value: '0x2386F26FC10000',
            },
        ],
        action: 'ALLOW'
    }],
}
```

## Restrict the delegation contract for EIP-7702

```ts {skip-check} theme={"system"}
{
    version: '1.0',
    name: 'Restrict EIP-7702 delegation contracts',
    chain_type: 'ethereum',
    rules: [{
        name: 'Allow only specific delegation contracts',
        method: 'eth_sign7702Authorization',
        conditions: [
            {
                field_source: 'ethereum_7702_authorization',
                field: 'contract',
                operator: 'in',
                value: ['0xf5De540DabE85ecA73D61C4004cF2c243bbf4a5B']
            }
        ],
        action: 'ALLOW'
    }]
}
```

## Prevent private key exports while allowing other actions

```ts {skip-check} theme={"system"}
{
    version: '1.0',
    name: 'Prevent private key exports',
    chain_type: 'ethereum',
    rules: [
        {
            name: 'Block private key exports',
            method: 'exportPrivateKey',
            conditions: [],
            action: 'DENY'
        },
        {
            name: 'Allow all other actions',
            method: '*',
            conditions: [],
            action: 'ALLOW'
        }
    ]
}
```

## Only permit private key exports

```ts {skip-check} theme={"system"}
{
    version: '1.0',
    name: 'Only allow private key exports',
    chain_type: 'ethereum',
    rules: [
        {
            name: 'Allow private key exports',
            method: 'exportPrivateKey',
            conditions: [],
            action: 'ALLOW'
        },
        {
            name: 'Block all other actions',
            method: '*',
            conditions: [],
            action: 'DENY'
        }
    ]
}
```

## Anti patterns

### Avoid adding rules that may override other rules

```ts {skip-check} theme={"system"}
{
    version: '1.0',
    name: 'Restrict the maximum value of ETH transfers',
    chain_type: 'ethereum',
    rules: [
        {
            // This rule restricts the value of ETH transfers.
            name: 'Restrict ETH transfers to 1',
            method: 'eth_sendTransaction',
            conditions: [
                {
                    field_source: 'ethereum_transaction',
                    field: 'value',
                    operator: 'lte',
                    value: '1'
                }
            ],
            action: 'ALLOW'
        },
        {
            name: 'Restrict ETH transfers to 5',
            method: 'eth_sendTransaction',
            conditions: [
                // This rule will override the previous rule by allowing a 5 ETH transfer.
                {
                    field_source: 'ethereum_transaction',
                    field: 'value',
                    operator: 'lte',
                    value: '5'
                }
            ],
            action: 'ALLOW'
        }
    ]
}
```
\n