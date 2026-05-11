> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Fetch transaction via API

<Warning>
  The following functionality exists for [wallets reconstituted
  server-side](/wallets/wallets/create/create-a-wallet). More on [Privy architecture
  here](/security/wallet-infrastructure/architecture)
</Warning>

<Note>
  In August 2025 we migrated transactions to a new data store. As part of this migration, we changed
  the format of transaction IDs from CUID2 to UUIDv4. You may continue using the CUID2 for your
  existing transactions, but we encourage migration to the new UUID, as it will avoid a very slight
  latency increase due to an extra lookup for mapping from the legacy ID to the new ID.
</Note>

<View title="NodeJS" icon="node-js">
  To get a transaction's details using the NodeJS SDK, use the `get` method on the `transactions()` interface of the Privy client:

  ### Usage

  ```typescript  theme={"system"}
  import {PrivyClient} from '@privy-io/node';

  const privy = new PrivyClient({
    appId: 'insert-your-app-id',
    appSecret: 'insert-your-app-secret'
  });

  const transaction = await privy.transactions().get('insert-transaction-id');
  console.log(transaction);
  ```

  ### Parameters and Returns

  Check out the [API reference](/api-reference/transactions/get) for more details.
</View>

<View title="NodeJS (server-auth)" icon="node-js">
  <Warning>
    The `@privy-io/server-auth` library is deprecated. We recommend integrating `@privy-io/node` for
    the latest features and support.
  </Warning>

  To get a transaction's details using the NodeJS SDK, use the `getTransaction` method from the Privy client:

  ```typescript {skip-check} theme={"system"}
  getTransaction: (input: {id: string}) => Promise<WalletApiTransactionResponseType>;
  ```

  ### Usage

  ```typescript  theme={"system"}
  import {PrivyClient} from '@privy-io/server-auth';

  const privy = new PrivyClient('insert-your-app-id', 'insert-your-app-secret');

  const transaction = await privy.walletApi.getTransaction({
    id: 'insert-transaction-id'
  });
  console.log(transaction);
  ```

  ### Parameters

  <ParamField path="id" type="string" required>
    ID of the transaction to fetch details for.
  </ParamField>

  ### Returns

  <ResponseField name="transaction" type="WalletApiTransactionResponseType">
    <Expandable title="WalletApiTransactionResponseType" defaultOpen="true">
      <ResponseField name="id" type="string">
        ID for the transaction.
      </ResponseField>

      <ResponseField name="walletId" type="string">
        ID for the wallet that sent the transaction.
      </ResponseField>

      <ResponseField name="caip2" type="string">
        CAIP-2 chain ID for the network the transaction was broadcasted on.
      </ResponseField>

      <ResponseField name="transactionHash" type="string">
        Hash for the transaction.
      </ResponseField>

      <ResponseField name="status" type="'broadcasted' | 'confirmed' | 'execution_reverted' | 'failed' | 'replaced' | 'pending' | 'provider_error'">
        Current status of the transaction. - `'broadcasted'` refers to when a transaction has been
        submitted to the network but has not yet been included in a block - `'confirmed'` refers to when a
        transaction has been included in a block that has been confirmed on the network. -
        `'execution_reverted'` refers to when a transaction has reverted in execution. - `'failed'` refers
        to when a transaction has been pending for too long, signaling that it will not be included
        on-chain. This can happen when the gas fee is too low given the current activity on the blockchain
        and is only triggered for chains that have a defined pending time limit (e.g. Base, Solana,
        Flow.). - `'replaced'` refers to when a transaction has been replaced by another transaction with
        the same nonce. This is only applicable to EVM chains. - `'pending'` irefers to when a custodial
        wallet transaction has been initiated with the custodian and is undergoing processing. -
        `'provider_error'` refers to when a custodial wallet transaction request has been rejected by the
        custodian or encountered an error. This can happen when you attempt to spend funds that haven't
        been fully screened by the custodian yet, or when a transaction does not meet the custodian's
        compliance requirements.
      </ResponseField>
    </Expandable>
  </ResponseField>
</View>

<View title="Java" icon="java">
  To get a transaction by ID, use the `getTransaction` method.

  ```java  theme={"system"}
  try {
      TransactionRetrieveResponse response = privyClient
          .transactions()
          .retrieve('insert-transaction-id');

      if (response.transaction().isPresent()) {
          Transaction transaction = response.transaction().get();
      }
  } catch (APIException e) {
      String errorBody = e.bodyAsString();
      System.err.println(errorBody);
  } catch (Exception e) {
      System.err.println(e.getMessage());
  }
  ```

  ### Parameters

  <ParamField body="transactionId" type="String" required>
    The ID of the transaction to retrieve
  </ParamField>

  ### Returns

  The `TransactionRetrieveResponse` object contains an optional `transaction()` field, present if the
  transaction was retrieved successfully.

  <ResponseField name="transaction()" type="Optional<Transaction>">
    The retrieved `Transaction` object.

    <Expandable defaultOpen="true">
      <ResponseField type="String" name="id">
        Unique ID of the transaction.
      </ResponseField>

      <ResponseField type="String" name="walletId">
        ID for the wallet that sent the transaction.
      </ResponseField>

      <ResponseField type="String" name="caip2">
        CAIP-2 chain ID for the network the transaction was broadcasted on.
      </ResponseField>

      <ResponseField type="String" name="transactionHash">
        Hash for the transaction.
      </ResponseField>

      <ResponseField type="Status" name="status">
        Current status of the transaction.
      </ResponseField>

      <ResponseField type="double" name="createdAt">
        The creation date of the wallet, in milliseconds since midnight, January 1, 1970 UTC.
      </ResponseField>
    </Expandable>
  </ResponseField>
</View>

<View title="REST API" icon="terminal">
  Privy supports fetching transaction status by the transaction ID.

  To do so, make a `GET` request to

  ```bash  theme={"system"}
  https://api.privy.io/v1/transactions/<transaction_id>
  ```

  replacing `<transaction_id>` with the ID of your desired transaction.

  ## Response

  <ResponseField name="id" type="string">
    ID for the transaction.
  </ResponseField>

  <ResponseField name="wallet_id" type="string">
    ID for the wallet that sent the transaction.
  </ResponseField>

  <ResponseField name="status" type="'broadcasted' | 'confirmed' | 'execution_reverted' | 'failed' | 'replaced' | 'pending' | 'provider_error'">
    Current status of the transaction. - `'broadcasted'` refers to when a transaction has been
    submitted to the network but has not yet been included in a block - `'confirmed'` refers to when a
    transaction has been included in a block that has been confirmed on the network. -
    `'execution_reverted'` refers to when a transaction has reverted in execution. - `'failed'` refers
    to when a transaction has been pending for too long, signaling that it will not be included
    on-chain. This can happen when the gas fee is too low given the current activity on the blockchain
    and is only triggered for chains that have a defined pending time limit (e.g. Base, Solana,
    Flow.). - `'replaced'` refers to when a transaction has been replaced by another transaction with
    the same nonce. This is only applicable to EVM chains. - `'pending'` irefers to when a custodial
    wallet transaction has been initiated with the custodian and is undergoing processing. -
    `'provider_error'` refers to when a custodial wallet transaction request has been rejected by the
    custodian or encountered an error. This can happen when you attempt to spend funds that haven't
    been fully screened by the custodian yet, or when a transaction does not meet the custodian's
    compliance requirements.
  </ResponseField>

  <ResponseField name="transaction_hash" type="string">
    Hash for the transaction.
  </ResponseField>

  <ResponseField name="caip2" type="string">
    CAIP-2 chain ID for the network the transaction was broadcasted on.
  </ResponseField>

  ## Example

  For example, you might fetch a transactions status using transaction ID using the `cURL` request below.

  ```bash  theme={"system"}
  $ curl --request GET https://api.privy.io/v1/transactions/<transaction_id> \
  -u "<your-privy-app-id>:<your-privy-app-secret>" \
  -H "privy-app-id: <your-privy-app-id>" \
  -H 'Content-Type: application/json' \
  ```

  The response might look like

  ```json  theme={"system"}
  {
    "id": "<transaction_id>",
    "wallet_id": "fmfdj6yqly31huorjqzq38zc",
    "status": "confirmed",
    "transaction_hash": "0x2446f1fd773fbb9f080e674b60c6a033c7ed7427b8b9413cf28a2a4a6da9b56c",
    "caip2": "eip155:8453"
  }
  ```
</View>

<View title="Rust" icon="rust">
  To get a transaction's details using the Rust SDK, use the `get` method on the `transactions()` interface of the Privy client:

  ### Usage

  ```rust  theme={"system"}
  use privy_rs::PrivyClient;

  let client = PrivyClient::new(app_id, app_secret)?;

  let transaction = client.transactions().get("insert-transaction-id").await?;
  println!("Transaction: {:?}", transaction);
  ```

  ### Parameters and Returns

  See the Rust SDK documentation for detailed parameter and return types, including embedded examples:

  * [TransactionsClient::get](https://docs.rs/privy-rs/latest/privy_rs/subclients/struct.TransactionsClient.html#method.get)
  * [Transaction](https://docs.rs/privy-rs/latest/privy_rs/generated/types/struct.Transaction.html)

  For REST API details, see the [API reference](/api-reference/transactions/get).
</View>
\n