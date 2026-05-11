> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Using Spark BTC with Privy wallets

Spark is a Bitcoin scaling solution that enables instant, low-cost transfers while maintaining Bitcoin's security. Privy offers BTC support. This guide walks through creating a Spark wallet, signing and submitting BTC transfers, and claiming pending transfers using Privy's API.

Privy's Spark integration utilizes the [Spark Wallet SDK](https://github.com/buildonspark/spark/blob/63c51c9b15d8ce8498365f9f471c57eae5608007/sdks/js/packages/spark-sdk/src/spark-wallet/spark-wallet.ts). For more information on the Spark wallet methods, check out the [Spark docs](https://docs.spark.money/wallet/introduction).

## 1. Create a Spark wallet

Create a Spark wallet by calling the [wallet creation endpoint](/api-reference/wallets/create) with `chain_type: 'spark'`. Learn more about creating wallets [here](/wallets/wallets/create/create-a-wallet).

<View title="React" icon="react">
  ```tsx  theme={"system"}
  import {useCreateWallet} from '@privy-io/react-auth/extended-chains';

  const {createWallet} = useCreateWallet();

  const {user, wallet} = await createWallet({chainType: 'spark'});
  ```
</View>

<View title="React Native" icon="react">
  ```tsx  theme={"system"}
  import {useCreateWallet} from '@privy-io/expo/extended-chains';

  const {createWallet} = useCreateWallet();

  const {user, wallet} = await createWallet({chainType: 'spark'});
  ```
</View>

<View title="REST API" icon="terminal">
  ```bash  theme={"system"}
  curl --request POST https://api.privy.io/v1/wallets \
      -u "<your-privy-app-id>:<your-privy-app-secret>" \
      -H "privy-app-id: <your-privy-app-id>" \
      -H 'Content-Type: application/json' \
      -d '{
      "owner": {
          "user_id": "did:privy:xxxxxx"
      },
      "chain_type": "spark"
      }'
  ```
</View>

The response will include your new Spark wallet with a unique Spark address format (e.g., `spark1pgss...`).

<Info>
  Spark supports both mainnet and testnet environments:

  * `MAINNET`: Production Bitcoin network
  * `REGTEST`: Test network for development

  When you create a wallet, the `MAINNET` address is automatically returned. To get the `REGTEST` address, you can use the returned public key and the [`encodeSparkAddress`](https://github.com/buildonspark/spark/blob/63c51c9b15d8ce8498365f9f471c57eae5608007/sdks/js/packages/spark-sdk/src/utils/address.ts#L44) method from the Spark SDK.

  On subsequent wallet requests, your request will need to include the network you want to take the operation on.
</Info>

## 2. Transfer BTC

Transfer Bitcoin to another Spark address using the [`transfer`](/api-reference/wallets/spark/transfer) endpoint. The amount is specified in satoshis.

<Info>
  Most Spark wallet operations (transferring BTC and checking balances) require authorization
  signatures using user keys. Only wallet creation can be done without authorization signatures.
  Learn more about [signing requests with user
  keys](/controls/authorization-keys/using-owners/sign#react%2C-expo).
</Info>

<View title="React" icon="react">
  ```typescript  theme={"system"}
  import {useAuthorizationSignature} from '@privy-io/react-auth';

  const {generateAuthorizationSignature} = useAuthorizationSignature();

  // Build the request input for authorization signature
  const input = {
    version: 1,
    url: `https://api.privy.io/v1/wallets/${'$WALLET_ID'}/rpc`,
    method: 'POST',
    headers: {
      'privy-app-id': 'your-app-id'
    },
    body: {
      method: 'transfer',
      network: 'MAINNET',
      params: {
        receiver_spark_address:
          'spark1pgss8z35rpycv4duqdk5u3sclhjnztjunv5yajlwk69tyv5fsvwwe9mgwmxfkx',
        amount_sats: 16
      }
    }
  } as const;

  // Generate authorization signature
  const {signature: authorizationSignature} = await generateAuthorizationSignature(input);

  // Make the transfer request
  const transferResponse = await fetch(input.url, {
    method: input.method,
    headers: {
      ...input.headers,
      Authorization: `Bearer ${'$ACCESS_TOKEN'}`,
      'Content-Type': 'application/json',
      'privy-authorization-signature': authorizationSignature
    },
    body: JSON.stringify(input.body)
  });

  const transfer = await transferResponse.json();
  ```
</View>

<View title="React Native" icon="react">
  ```typescript  theme={"system"}
  import {useAuthorizationSignature} from '@privy-io/expo';

  const {generateAuthorizationSignature} = useAuthorizationSignature();

  // Build the request input for authorization signature
  const input = {
    version: 1,
    url: `https://api.privy.io/v1/wallets/${'$WALLET_ID'}/rpc`,
    method: 'POST',
    headers: {
      'privy-app-id': 'your-app-id'
    },
    body: {
      method: 'transfer',
      network: 'MAINNET',
      params: {
        receiver_spark_address:
          'spark1pgss8z35rpycv4duqdk5u3sclhjnztjunv5yajlwk69tyv5fsvwwe9mgwmxfkx',
        amount_sats: 16
      }
    }
  } as const;

  // Generate authorization signature
  const {signature: authorizationSignature} = await generateAuthorizationSignature(input);

  // Make the transfer request
  const transferResponse = await fetch(input.url, {
    method: input.method,
    headers: {
      ...input.headers,
      Authorization: `Bearer ${'$ACCESS_TOKEN'}`,
      'Content-Type': 'application/json',
      'privy-authorization-signature': authorizationSignature
    },
    body: JSON.stringify(input.body)
  });

  const transfer = await transferResponse.json();
  ```
</View>

The transfer response includes the transfer ID, status, and detailed transaction information.

## 3. Check balance and claim transfers

Use the [`getBalance`](/api-reference/wallets/spark/get-balance) endpoint to retrieve your wallet balance and automatically claim any pending transfers.

<View title="React" icon="react">
  ```typescript  theme={"system"}
  import {useAuthorizationSignature} from '@privy-io/react-auth';

  const {generateAuthorizationSignature} = useAuthorizationSignature();

  // Build the request input for authorization signature
  const input = {
    version: 1,
    url: `https://api.privy.io/v1/wallets/${'$WALLET_ID'}/rpc`,
    method: 'POST',
    headers: {
      'privy-app-id': 'your-app-id'
    },
    body: {
      method: 'getBalance',
      network: 'MAINNET'
    }
  } as const;

  // Generate authorization signature
  const {signature: authorizationSignature} = await generateAuthorizationSignature(input);

  // Make the balance request
  const balanceResponse = await fetch(input.url, {
    method: input.method,
    headers: {
      ...input.headers,
      Authorization: `Bearer ${'$ACCESS_TOKEN'}`,
      'Content-Type': 'application/json',
      'privy-authorization-signature': authorizationSignature
    },
    body: JSON.stringify(input.body)
  });

  const balance = await balanceResponse.json();
  console.log(`Balance: ${balance.data.balance} satoshis`);
  ```
</View>

<View title="React Native" icon="react">
  ```typescript  theme={"system"}
  import {useAuthorizationSignature} from '@privy-io/expo';

  const {generateAuthorizationSignature} = useAuthorizationSignature();

  // Build the request input for authorization signature
  const input = {
    version: 1,
    url: `https://api.privy.io/v1/wallets/${'$WALLET_ID'}/rpc`,
    method: 'POST',
    headers: {
      'privy-app-id': 'your-app-id'
    },
    body: {
      method: 'getBalance',
      network: 'MAINNET'
    }
  } as const;

  // Generate authorization signature
  const {signature: authorizationSignature} = await generateAuthorizationSignature(input);

  // Make the balance request
  const balanceResponse = await fetch(input.url, {
    method: input.method,
    headers: {
      ...input.headers,
      Authorization: `Bearer ${'$ACCESS_TOKEN'}`,
      'Content-Type': 'application/json',
      'privy-authorization-signature': authorizationSignature
    },
    body: JSON.stringify(input.body)
  });

  const balance = await balanceResponse.json();
  console.log(`Balance: ${balance.data.balance} satoshis`);
  ```
</View>

The balance response includes:

* Your native Spark balance in satoshis
* Any token balances with metadata
* Automatically claims pending incoming transfers

## 4. Execute more wallet requests

This guide demonstrates how to use `transfer` and `getBalance`, but Privy supports many Spark wallet methods including:

* [`transfer`](/api-reference/wallets/spark/transfer) - Transfer satoshis from a Spark wallet to another Spark address
* [`getBalance`](/api-reference/wallets/spark/get-balance) - Retrieve wallet balance and token holdings, automatically claims pending transfers
* [`transferTokens`](/api-reference/wallets/spark/transfer-tokens) - Transfer Spark tokens to another Spark address
* [`createLightningInvoice`](/api-reference/wallets/spark/create-lightning-invoice) - Create a Lightning invoice to receive funds via Lightning Network
* [`payLightningInvoice`](/api-reference/wallets/spark/pay-lightning-invoice) - Pay a Lightning Network invoice
* [`getStaticDepositAddress`](/api-reference/wallets/spark/get-static-deposit-address) - Get a static Bitcoin address for deposits
* [`getClaimStaticDepositQuote`](/api-reference/wallets/spark/get-static-deposit-quote) - Get a quote for claiming a static deposit
* [`claimStaticDeposit`](/api-reference/wallets/spark/claim-static-deposit) - Claim funds from a static Bitcoin deposit
* [`signMessageWithIdentityKey`](/api-reference/wallets/spark/sign-message-with-identity-key) - Sign a message using the wallet's identity key

All methods (except wallet creation) require authorization signatures using the same pattern shown in the examples above.

For additional Spark functionality and advanced features, see the [Spark developer documentation](https://docs.spark.money/wallet/developer-guide/send-receive-spark).
\n