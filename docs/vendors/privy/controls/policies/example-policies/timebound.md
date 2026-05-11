> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Time-bound examples

## Enable a signer to take any wallet action until a certain date

```ts {skip-check} theme={"system"}
{
    version: '1.0',
    name: 'Time-bound signer policy', // to be set as override_policy for the signer
    chain_type: 'ethereum',
    rules: [{
        name: 'Allow all actions before 9/8/2026',
        method: '*',
        conditions: [{
            field_source: 'system',
            field: 'current_unix_timestamp',
            operator: 'lt',
            value: '1788840000' // 2026-09-08 00:00:00 UTC in seconds since epoch
        }],
        action: 'ALLOW'
    }]
}
```

## Only permit private key exports within a time window

```ts {skip-check} theme={"system"}
{
    version: '1.0',
    name: 'Only allow private key exports within a time window',
    chain_type: 'solana',
    rules: [
        {
            name: 'Allow private key exports between 9/8/2025 and 10/8/2025',
            method: 'exportPrivateKey',
            conditions: [
                {
                    field_source: 'system',
                    field: 'current_unix_timestamp',
                    operator: 'gte',
                    value: '1757304000' // 2025-09-08 00:00:00 UTC in seconds since epoch
                },
                {
                    field_source: 'system',
                    field: 'current_unix_timestamp',
                    operator: 'lte',
                    value: '1759896000' // 2025-10-08 00:00:00 UTC in seconds since epoch
                }
            ],
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
\n