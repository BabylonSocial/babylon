> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Idempotency keys

> Making Privy API requests idempotent with idempotency keys

Idempotency keys ensure your API requests to Privy aren't executed multiple times, preventing duplicated transactions. When provided, Privy guarantees that a request with the same idempotency key will only be processed once within a 24-hour window.

## Required headers

When using idempotency keys with the REST API, include the following header with your request:

<ParamField header="privy-idempotency-key" type="string" required>
  A unique identifier for the request, up to 256 characters. We recommend using a V4 UUID.
</ParamField>

## When are they necessary?

Idempotency keys are recommended for:

* Any `POST` request that triggers state changes or transactions
* Scenarios where network issues might cause request retries
* Critical operations where duplicate execution would be problematic

While optional, idempotency keys are strongly recommended for all non-idempotent operations in production environments to prevent double-spends and duplicate transactions.

## How idempotency works

<Steps>
  <Step title="First Request">
    When Privy receives a request with a new idempotency key, it processes the request normally and
    stores both the request details and response for 24 hours.
  </Step>

  <Step title="Subsequent Requests">
    If the same idempotency key is used again within 24 hours:

    * If the request body matches the original request: Privy returns the stored response without re-executing the operation
    * If the request body differs: Privy returns a 400 error indicating invalid use of the key
  </Step>

  <Step title="Key Expiration">
    After 24 hours, idempotency keys expire. Using an expired key will result in normal request
    processing.
  </Step>
</Steps>

<Warning>
  Changing any part of the request body while reusing an idempotency key will result in an error.
  Each unique operation should have its own idempotency key.
</Warning>

## Generating idempotency keys

Generate a unique, random string for each distinct operation. V4 UUIDs are recommended for their uniqueness properties.

<CodeGroup>
  ```ts JavaScript/TypeScript theme={"system"}
  import {v4 as uuidv4} from 'uuid';

  // Generate a unique idempotency key
  const idempotencyKey = uuidv4();
  ```

  ```python Python theme={"system"}
  import uuid

  # Generate a unique idempotency key
  idempotency_key = str(uuid.uuid4())
  ```
</CodeGroup>

## Examples

<CodeGroup>
  ```ts @privy-io/node theme={"system"}
  import {PrivyClient} from '@privy-io/node';
  import {v4 as uuidv4} from 'uuid';

  const client = new PrivyClient({appId: '$PRIVY_APP_ID', appSecret: '$PRIVY_APP_SECRET'});

  // Generate a unique idempotency key
  const idempotencyKey = uuidv4();

  const res = await client
    .wallets()
    .ethereum()
    .sendTransaction('$WALLET_ID', {
      idempotency_key: idempotencyKey, // Pass the idempotency key to prevent duplicate transactions
      caip2: 'eip155:8453',
      params: {
        transaction: {
          to: '0xE3070d3e4309afA3bC9a6b057685743CF42da77C',
          value: '0x2386F26FC10000',
          chain_id: 8453
        }
      }
    });
  ```

  ```ts @privy-io/server-auth theme={"system"}
  import {PrivyClient} from '@privy-io/server-auth';
  import {v4 as uuidv4} from 'uuid';

  const client = new PrivyClient('$PRIVY_APP_ID', '$PRIVY_APP_SECRET');

  // Generate a unique idempotency key
  const idempotencyKey = uuidv4();

  const res = await client.walletApi.ethereum.sendTransaction({
    walletId: '$WALLET_ID',
    idempotencyKey, // Pass the idempotency key to prevent duplicate transactions
    caip2: 'eip155:8453',
    transaction: {
      to: '0xE3070d3e4309afA3bC9a6b057685743CF42da77C',
      value: '0x2386F26FC10000',
      chainId: 8453
    }
  });
  ```

  ```ts TypeScript/JavaScript theme={"system"}
  import axios from 'axios';
  import {v4 as uuidv4} from 'uuid';

  // Generate a unique idempotency key
  const idempotencyKey = uuidv4();

  const response = await axios.post(
    'https://api.privy.io/api/v1/wallets/y5ofctvacjiv53u4hmnqi0e5/rpc',
    {
      caip2: 'eip155:8453',
      method: 'eth_sendTransaction',
      params: {
        transaction: {
          to: '0xE3070d3e4309afA3bC9a6b057685743CF42da77C',
          value: '0x2386F26FC10000',
          chainId: 8453
        }
      }
    },
    {
      headers: {
        'privy-app-id': 'insert-your-app-id',
        'privy-idempotency-key': idempotencyKey,
        Authorization: 'Bearer insert-your-api-key'
      }
    }
  );
  ```
</CodeGroup>

<Tip>
  For critical operations, store the idempotency key alongside your transaction records. This allows
  you to safely retry failed operations with the same key.
</Tip>
\n