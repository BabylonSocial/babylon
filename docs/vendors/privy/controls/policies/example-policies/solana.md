> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Solana examples

## Allowlist specific Solana Programs

```ts {skip-check} theme={"system"}
{
    version: '1.0',
    name: 'Allowlisted programs',
    chain_type: 'solana',
    rules: [{
        name: 'Allowlist the Compute Budget Program and System Program',
        method: 'signAndSendTransaction',
        conditions: [
            {
                // This field_source is used only to allowlist Solana Programs.
                field_source: 'solana_program_instruction',
                field: 'programId',
                operator: 'in',
                value: ['ComputeBudget111111111111111111111111111111', '11111111111111111111111111111111']
            }
        ],
        action: 'ALLOW'
    }]
}
```

## Allow a SOL Transfer instruction with a max value

```ts {skip-check} theme={"system"}
{
    version: '1.0',
    name: 'SOL transfer maximums',
    chain_type: 'solana',
    rules: [{
        name: 'Restrict SOL transfers to a maximum value',
        method: 'signAndSendTransaction',
        conditions: [
            {
                // This field_source is used for all System Program instructions.
                field_source: 'solana_system_program_instruction',
                field: 'Transfer.lamports',
                operator: 'lte',
                value: '1000000000' // 1 SOL
            },
        ],
        action: 'ALLOW'
    }]
}
```

## Allow sending Solana transactions within a time window

```ts {skip-check} theme={"system"}
{
    version: '1.0',
    name: 'Time-bound Solana transactions policy',
    chain_type: 'solana',
    rules: [{
        name: 'Allow Solana transactions only during the month of September 2025',
        method: 'signAndSendTransaction',
        conditions: [{
            field_source: 'system',
            field: 'current_unix_timestamp',
            operator: 'gte',
            value: '1756699200' // 2025-09-01 00:00:00 UTC in seconds since epoch
        }, {
            field_source: 'system',
            field: 'current_unix_timestamp',
            operator: 'lt',
            value: '1759291200' // 2025-10-01 00:00:00 UTC in seconds since epoch
        }],
        action: 'ALLOW'
    }]
}
```

### Allow a SOL Transfer instruction with a max value to allowlisted recipients

```ts {skip-check} theme={"system"}
{
    version: '1.0',
    name: 'Restrict SOL transfers to a specific recipient',
    chain_type: 'solana',
    rules: [{
        name: 'Restrict SOL transfers to a maximum value to a specific recipient',
        method: 'signAndSendTransaction',
        conditions: [
            {
                // This condition restricts the value of all SOL transfers to <= 1 SOL.
                // This field_source is used for all System Program instructions.
                field_source: 'solana_system_program_instruction',
                field: 'Transfer.lamports',
                operator: 'lte',
                value: '1000000000' // 1 SOL
            },
            {
                // This additional condition restricts Transfer recipients to a list of allowed addresses.
                // This field_source is used for all System Program instructions.
                field_source: 'solana_system_program_instruction',
                field: 'Transfer.to',
                operator: 'in',
                value: ['4tFqt2qzaNsnZqcpjPiyqYw9LdRzxaZdX2ewPncYEWLA', '4tFqt2qzaNsnZqcpjPiyqYw9LdRzxaZdX2ewPncYEWLA']
            }
        ],
        action: 'ALLOW'
    }]
}
```

### Allow a Solana Transaction that has a Create and Transfer instruction, while limiting Transfers to 1 SOL

```ts {skip-check} theme={"system"}
{
    version: '1.0',
    name: 'SOL transfer maximums',
    chain_type: 'solana',
    rules: [
        {
            // This rule restricts the value of all SOL transfer instructions to <= 1 SOL.
            name: 'Restrict SOL transfers to a maximum value',
            method: 'signAndSendTransaction',
            conditions: [{
                // This field_source is used for all System Program instructions.
                field_source: 'solana_system_program_instruction',
                field: 'Transfer.lamports',
                operator: 'lte',
                value: '1000000000' // 1 SOL
            }],
            action: 'ALLOW'
        },
        {
            // This rule allows the Create instruction to be present in the transaction.
            name: 'Allow the Create instruction',
            method: 'signAndSendTransaction',
            conditions: [
                {
                    // This field_source is used for all System Program instructions.
                    field_source: 'solana_system_program_instruction',
                    field: 'instructionName',
                    operator: 'eq',
                    value: 'Create'
                }
            ],
            action: 'ALLOW'
        }
    ]
}
```

## Allow a TransferChecked instruction with a max value of a USDC token

```ts {skip-check} theme={"system"}
{
    version: '1.0',
    name: 'Restrict USDC transfers to a maximum value',
    chain_type: 'solana',
    rules: [{
        name: 'Restrict transfers to be less than or equal to 5 USDC',
        method: 'signAndSendTransaction',
        conditions: [
            {
                // This field_source is used for all Token Program instructions.
                field_source: 'solana_token_program_instruction',
                field: 'TransferChecked.mint',
                operator: 'eq',
                // This is the USDC mint address on the Solana mainnet.
                value: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
            },
            {
                // This field_source is used for all Token Program instructions.
                field_source: 'solana_token_program_instruction',
                field: 'TransferChecked.amount',
                operator: 'lte',
                value: '5000000' // 5 USDC assuming 6 decimals
            },
        ],
        action: 'ALLOW'
    }]
}
```

## Denylist recipients of a transaction

```ts {skip-check} theme={"system"}
{
    version: '1.0',
    name: 'Denylist recipients of SOL transfer',
    chain_type: 'solana',
    rules: [{
        name: 'Deny SOL transfers to a list of addresses',
        method: 'signAndSendTransaction',
        conditions: [
            {
                // This field_source is used for all System Program instructions.
                field_source: 'solana_system_program_instruction',
                field: 'Transfer.to',
                operator: 'in',
                value: ['4tFqt2qzaNsnZqcpjPiyqYw9LdRzxaZdX2ewPncYEWLA', '4tFqt2qzaNsnZqcpjPiyqYw9LdRzxaZdX2ewPncYEWLA']
            },
        ],
        action: 'DENY'
    }]
}
```

## Allowlist some System Program instructions and some Token Program instructions

```ts {skip-check} theme={"system"}
{
    version: '1.0',
    name: 'Allowlist all System Program instructions and some Token Program instructions',
    chain_type: 'solana',
    rules: [
        {
            name: 'Allowlist System Program instructions',
            method: 'signAndSendTransaction',
            conditions: [
                {
                    // This field_source is used for all System Program instructions.
                    field_source: 'solana_system_program_instruction',
                    field: 'instructionName',
                    operator: 'in',
                    value: ['Create', 'Transfer']
                }
            ],
            action: 'ALLOW'
        },
        {
            name: 'Allowlist Token Program instructions',
            method: 'signAndSendTransaction',
            conditions: [
                {
                    // This field_source is used for all Token Program instructions.
                    field_source: 'solana_token_program_instruction',
                    field: 'instructionName',
                    operator: 'in',
                    value: ['TransferChecked', 'CloseAccount']
                }
            ],
            action: 'ALLOW'
        }
    ]
}
```

## Allowlist some Solana Programs and restrict SOL transfers

```ts {skip-check} theme={"system"}
{
    version: '1.0',
    name: 'Allowlist some Solana Programs and restrict SOL transfers',
    chain_type: 'solana',
    rules: [
        {
            name: 'Allowlist Programs',
            method: 'signAndSendTransaction',
            conditions: [
                {
                    field_source: 'solana_program_instruction',
                    field: 'programId',
                    operator: 'in',
                    value: [
                        'ComputeBudget111111111111111111111111111111', // Compute Budget Program
                        'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4' // Jupiter v6 Swap Program
                    ]
                }
            ],
            action: 'ALLOW'
        },
        {
            name: 'Restrict SOL transfers',
            method: 'signAndSendTransaction',
            conditions: [
                {
                    field_source: 'solana_system_program_instruction',
                    field: 'Transfer.lamports',
                    operator: 'lte',
                    value: '1000000000' // 1 SOL
                }
            ],
            action: 'ALLOW'
        }
    ]
}
```

## Prevent private key exports while allowing other actions

```ts {skip-check} theme={"system"}
{
    version: '1.0',
    name: 'Prevent private key exports',
    chain_type: 'solana',
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
    chain_type: 'solana',
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
    name: 'Allowlist the System Program Transfer instruction and restrict SOL transfers',
    chain_type: 'solana',
    rules: [
        {
            // This rule restricts the value of all SOL transfers.
            name: 'Restrict SOL transfers',
            method: 'signAndSendTransaction',
            conditions: [
                {
                    field_source: 'solana_system_program_instruction',
                    field: 'Transfer.lamports',
                    operator: 'lte',
                    value: '1000000000' // 1 SOL
                }
            ],
            action: 'ALLOW'
        },
        {
            name: 'Allowlist System Program Transfer instruction',
            method: 'signAndSendTransaction',
            conditions: [
                // This rule will override the previous rule by allowing all Transfer instructions via the System Program.
                {
                    field_source: 'solana_system_program_instruction',
                    field: 'instructionName',
                    operator: 'eq',
                    value: 'Transfer'
                }
            ],
            action: 'ALLOW'
        }
    ]
}
```

## Known Limitations

### Address Lookup Tables (ALTs)

<Warning>
  Solana policy evaluation does not support resolving addresses from [Address Lookup Tables
  (ALTs)](https://solana.com/docs/advanced/lookup-tables). If your policy has conditions that
  reference addresses stored in an ALT (e.g., recipient/sender allowlists), policy evaluation will
  fail and the transaction will be rejected.
</Warning>

**What this means for your application:**

* Transactions using ALTs **work normally** if your policy does not have address-based conditions, or if the addresses being evaluated are in the transaction's static account keys (not the ALT)
* Policy evaluation will **only fail** if a policy condition needs to inspect an address that is stored in the ALT (e.g., `Transfer.to`, `Transfer.from`, recipient allowlists where the address is in the ALT portion)
* Policies that only check `programId`, `instructionName`, transfer amounts, or time-based conditions work fine with ALT transactions

**Workaround:**

If you need address-based policy conditions (recipient/sender allowlists), ensure those addresses are included in the transaction's static account keys rather than resolved via ALT. Most simple transactions (SOL transfers, basic token transfers) do not require ALTs and will work with all policy types.

If ALT support for address-based policies is a requirement for your use case, please [reach out](https://privy.io/slack) to discuss your needs.
\n