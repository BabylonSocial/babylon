> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# null

<Info>
  When using Privy's server-side SDKs to sign transactions, you can use the authorization context to
  automatically sign requests. Learn more about [signing on the
  server](/controls/authorization-keys/using-owners/sign/signing-on-the-server).
</Info>

<View title="React" icon="react">
  Use the `signTransaction` method exported from the `useSignTransaction` hook to sign a transaction with a Solana wallet.

  ```tsx  theme={"system"}
  signTransaction: (input: {
    transaction: SupportedSolanaTransaction;
    wallet: ConnectedStandardSolanaWallet;
    options?: SolanaSignTransactionOptions & {uiOptions?: SendTransactionModalUIOptions};
  }) =>
    Promise<{
      signedTransaction: Uint8Array;
    }>;
  ```

  ### Usage

  ```tsx  theme={"system"}
  import {useSignTransaction, useWallets} from '@privy-io/react-auth/solana';
  import {pipe, createSolanaRpc, getTransactionEncoder, createTransactionMessage} from '@solana/kit';

  // Inside your component
  const {signTransaction} = useSignTransaction();
  const {wallets} = useWallets();

  const selectedWallet = wallets[0];

  // Configure your connection to point to the correct Solana network
  const {getLatestBlockhash} = createSolanaRpc('https://api.mainnet-beta.solana.com');

  // Get the latest blockhash
  const {value} = await getLatestBlockhash().send();

  // Create your transaction (either legacy Transaction or VersionedTransaction)
  const transaction = pipe(
    createTransactionMessage({version: 0}),
    // Set the message fee payer...
    // Set recent blockhash...
    // Add your instructions to the transaction...
    // Finally encode the transaction
    (tx) => new Uint8Array(getTransactionEncoder().encode(tx))
  );

  // Sign the transaction
  const signedTransaction = await signTransaction({
    transaction: transaction,
    wallet: selectedWallet
  });

  console.log('Transaction signed successfully');
  ```

  ### Parameters

  <ParamField path="transaction" type="Uint8Array" required>
    The encoded transaction to be signed.
  </ParamField>

  <ParamField path="wallet" type="ConnectedStandardSolanaWallet" required>
    The Solana wallet to use for signing the transaction.
  </ParamField>

  <ParamField path="chain" type="SolanaChain">
    Type of all Solana chains supported by Privy.
  </ParamField>

  <ParamField path="options" type="SolanaSignTransactionOptions & {uiOptions?: SendTransactionModalUIOptions}">
    Additional options for signing the transaction.

    <Expandable title="uiOptions">
      <ParamField path="uiOptions" type="SendTransactionModalUIOptions">
        UI options to customize the transaction request modal.

        <Tip>
          To hide confirmation modals, set `options.uiOptions.showWalletUIs` to `false`. Learn more
          about configuring modal prompts [here](/recipes/react/manage-wallet-UIs).
        </Tip>
      </ParamField>
    </Expandable>
  </ParamField>

  ### Response

  <ResponseField name="signedTransaction" type="Uint8Array">
    The signed transaction that can be sent to the network.
  </ResponseField>
</View>

<View title="React Native" icon="react">
  To sign a transaction from a wallet using the React Native SDK, use the `request` method from the wallet's provider:

  ```javascript  theme={"system"}
  request: (request: {
    method: 'signTransaction',
    params: {
      transaction: Transaction | VersionedTransaction,
    }
  }) => Promise<{ signedTransaction: Transaction }>
  ```

  <Note>
    The Expo SDK does not support built-in UIs for signing transactions.
    The `signTransaction` method gives you complete control over the experience and UI.
  </Note>

  ### Usage

  ```javascript  theme={"system"}
  import {useEmbeddedSolanaWallet} from '@privy-io/expo';

  const { wallets } = useEmbeddedSolanaWallet();
  const wallet = wallets[0];

  // Get the provider
  const provider = await wallet.getProvider();

  // Create your transaction (either legacy Transaction or VersionedTransaction)
  // transaction = ...

  // Sign the transaction
  const { signedTransaction } = await provider.request({
    method: 'signTransaction',
    params: {
      transaction: transaction,
    },
  });

  console.log("Transaction signed successfully", signedTransaction);
  ```

  ### Parameters

  <ParamField path="method" type="'signTransaction'" required>
    The RPC method executed with the wallet.
  </ParamField>

  <ParamField path="params" type="Object" required>
    Parameters for the transaction.

    <Expandable title="child attributes" defaultOpen="true">
      <ParamField path="transaction" type="Transaction | VersionedTransaction" required>
        The transaction to sign. This can be either a legacy Transaction or a VersionedTransaction object from [@solana/web3.js](https://solana-foundation.github.io/solana-web3.js/classes/Transaction.html).
      </ParamField>
    </Expandable>
  </ParamField>

  ### Returns

  <ResponseField name="signedTransaction" type="Transaction">
    The signature of the transaction.
  </ResponseField>
</View>

<View title="Swift" icon="swift">
  Sign a Solana transaction without submitting it to the network.

  ```swift  theme={"system"}
  public protocol EmbeddedSolanaWalletProvider {
      func signTransaction(transaction: Data) async throws -> String
  }
  ```

  ### Usage

  ```swift  theme={"system"}
  import SolanaSwift

  // Get the provider for wallet (assumes wallet is already obtained)
  let provider = wallet.provider

  // Create a Solana RPC client
  let solana = JSONRPCAPIClient(endpoint: URL(string: SolanaCluster.mainnet.rpcUrl)!)

  // Build the transaction using your preferred method
  // In this example, we're using the SolanaSwift SDK
  let latestBlockhash = try await solana.getLatestBlockhash()
  let walletPK = try PublicKey(string: wallet.address)
  var tx = Transaction()
  tx.instructions.append(
      SystemProgram.transferInstruction(
          from: walletPK,
          to: try PublicKey(string: "9NvE68JVWHHHGLp5NNELtM5fiBw6SXHrzqQJjUqaykC1"),
          lamports: 100000000000000
      )
  )
  tx.recentBlockhash = latestBlockhash
  tx.feePayer = walletPK

  // Sign using the Privy Embedded Wallet
  // Get back the signed transaction serialized as a base64-encoded string
  let signedTxBase64 = try await provider.signTransaction(transaction: tx.serialize())
  let signedTx = try Transaction.from(data: Data(base64Encoded: signedTxBase64)!)
  ```

  ### Parameters

  <ParamField path="transaction" type="Data" required>
    The serialized transaction to sign.
  </ParamField>

  ### Returns

  <ResponseField name="signedTransaction" type="String">
    The base64-encoded signed transaction.
  </ResponseField>
</View>

<View title="Android" icon="android">
  Use the `signTransaction` method on the Solana wallet provider to sign a transaction and then submit it to the network.

  ```kotlin  theme={"system"}
  public suspend fun signTransaction(
    transaction: ByteArray
  ): Result<String>
  ```

  ### Usage

  ```kotlin  theme={"system"}
  // Retrieve user's Solana wallet (assumes wallet is already obtained)
  val solanaWallet = user.embeddedSolanaWallets.first()

   // Create a Solana RPC client with cluster RPC URL
  val connection = Connection(SolanaCluster.MainNet.rpcUrl())

  // Build the transaction
  val walletPublicKey = PublicKey(solanaWallet.address)
  val instruction = SystemProgram.transfer(
      fromPubkey = walletPublicKey,
      toPubkey = PublicKey(recipientAddress),
      lamports = amount
  )

  // Get recent blockhash
  val recentBlockhash = connection.getLatestBlockhash()

  // Create transaction
  val transaction = Transaction()
  transaction.add(instruction)
  transaction.recentBlockhash = recentBlockhash
  transaction.feePayer = walletPublicKey

  // Serialize transaction to byte array
  val serializedTransaction = transaction.serialize()

  // Sign the transaction (returns base64-encoded signed transaction)
  val signResult = solanaWallet.provider.signTransaction(serializedTransaction)

  signResult.onSuccess { signedTransactionBase64 ->
      // Decode the signed transaction and submit to network
      println("Transaction signed with signature: $signature")
  }.onFailure { error ->
      println("Failed to sign transaction: ${error.message}")
  }
  ```

  ### Parameters

  <ParamField path="transaction" type="ByteArray" required>
    The serialized transaction to sign.
  </ParamField>

  ### Returns

  <ResponseField name="result" type="Result<String>">
    A Result that, when successful, contains the base64-encoded signed transaction.
  </ResponseField>
</View>

<View title="Flutter" icon="flutter">
  Use the `signTransaction` method on the Solana wallet provider to sign a transaction and then submit it to the network.

  ```dart  theme={"system"}
  Future<Result<String>> signTransaction(Uint8List transaction);
  ```

  ### Usage

  ```dart  theme={"system"}
  // Retrieve the user's Solana wallet (assumes wallet is already obtained)
  final solanaWallet = user.embeddedSolanaWallets.first;

  // Create a Solana RPC client
  final connection = Connection('https://api.mainnet-beta.solana.com');

  // Build the transaction
  final walletPublicKey = PublicKey(solanaWallet.address);
  final instruction = SystemProgram.transfer(
      fromPubkey: walletPublicKey,
      toPubkey: PublicKey(recipientAddress),
      lamports: amount
  );

  // Get recent blockhash
  final recentBlockhash = await connection.getLatestBlockhash();

  // Create transaction
  final transaction = Transaction();
  transaction.add(instruction);
  transaction.recentBlockhash = recentBlockhash;
  transaction.feePayer = walletPublicKey;

  // Serialize transaction to bytes
  final serializedTransaction = transaction.serializeMessage();

  // Sign the transaction
  final result = await solanaWallet.provider.signTransaction(serializedTransaction);
  ```

  ### Parameters

  <ParamField path="transaction" type="Uint8List" required>
    The serialized transaction message bytes to sign.
  </ParamField>

  ### Returns

  <ResponseField name="result" type="Result<String>">
    A Result that, when successful, contains the base64-encoded signature.
  </ResponseField>
</View>

<View title="NodeJS" icon="node-js">
  Use the `signTransaction` method on the Solana interface to sign a transaction with an Solana wallet.

  ### Usage

  ```js  theme={"system"}
  import {
    clusterApiUrl,
    Connection,
    LAMPORTS_PER_SOL,
    PublicKey,
    SystemProgram,
    Transaction,
    VersionedTransaction,
    TransactionMessage
  } from '@solana/web3.js';

  const walletPublicKey = new PublicKey(wallet.address);
  const connection = new Connection(clusterApiUrl('devnet'));
  const instruction = SystemProgram.transfer({
    fromPubkey: walletPublicKey,
    toPubkey: new PublicKey(address),
    lamports: value * LAMPORTS_PER_SOL
  });

  const {blockhash: recentBlockhash} = await connection.getLatestBlockhash();

  const message = new TransactionMessage({
    payerKey: walletPublicKey,
    // Replace with your desired instructions
    instructions: [instruction],
    recentBlockhash
  });

  const yourSolanaTransaction = new VersionedTransaction(message.compileToV0Message());

  // Get the signed transaction object from the response
  const {signedTransaction} = await privy.wallets().solana().signTransaction(wallet.id, {
    transaction: Buffer.from(yourSolanaTransaction.serialize()).toString('base64')
  });
  ```

  ### Parameters and Returns

  Check out the [API reference](/api-reference/wallets/solana/sign-transaction) for more details.
</View>

<View title="NodeJS (server-auth)" icon="node-js">
  <Warning>
    The `@privy-io/server-auth` library is deprecated. We recommend integrating `@privy-io/node` for
    the latest features and support.
  </Warning>

  Use the `signTransaction` method on the Solana client to sign a transaction with an Solana wallet.

  ```js  theme={"system"}
  signTransaction: (input: SolanaSignTransactionInputType) => Promise<SolanaSignTransactionResponseType>
  ```

  ### Usage

  ```js  theme={"system"}
  import {
    clusterApiUrl,
    Connection,
    LAMPORTS_PER_SOL,
    PublicKey,
    SystemProgram,
    Transaction,
    VersionedTransaction,
    TransactionMessage
  } from '@solana/web3.js';

  const walletPublicKey = new PublicKey(wallet.address);
  const connection = new Connection(clusterApiUrl('devnet'));
  const instruction = SystemProgram.transfer({
    fromPubkey: walletPublicKey,
    toPubkey: new PublicKey(address),
    lamports: value * LAMPORTS_PER_SOL
  });

  const {blockhash: recentBlockhash} = await connection.getLatestBlockhash();

  const message = new TransactionMessage({
    payerKey: walletPublicKey,
    // Replace with your desired instructions
    instructions: [instruction],
    recentBlockhash
  });

  const yourSolanaTransaction = new VersionedTransaction(message.compileToV0Message());

  // Get the signed transaction object from the response
  const {signedTransaction} = await privy.walletApi.solana.signTransaction({
    walletId: wallet.id,
    transaction: yourSolanaTransaction
  });
  ```

  ### Parameters

  <ParamField path="walletId" type="string" required>
    The ID of the wallet to send the transaction from.
  </ParamField>

  <ParamField path="transaction" type="Transaction | VersionedTransaction" required>
    The transaction to sign. This can be either a legacy Transaction or a VersionedTransaction object from [@solana/web3.js](https://solana-foundation.github.io/solana-web3.js/classes/Transaction.html).
  </ParamField>

  ### Returns

  <ResponseField name="signedTransaction" type="string">
    The signed transaction.
  </ResponseField>

  <ResponseField name="encoding" type="'base64'">
    The encoding format for the returned `signedTransaction`. Currently, only `'base64'` is supported for Solana.
  </ResponseField>
</View>

<View title="Java" icon="java">
  To sign a transaction from your wallet, use the `signTransaction` method.
  It will sign your transaction, and return the signed transaction to you.

  ### Usage

  ```java  theme={"system"}
  try {
      // A base64 encoded serialized transaction to sign
      String transaction = "insert-base-64-encoded-serialized-transaction";

      // Example: If wallet's owner is an authorization private key
      AuthorizationContext authorizationContext = AuthorizationContext.builder()
          .addAuthorizationPrivateKey("authorization-key")
          .build();

      SolanaSignTransactionRpcResponseData response = privyClient.wallets().solana()
          .signTransaction(
              transaction,
              authorizationContext
          );

      String signedTransaction = response.signedTransaction();
  } catch (APIException e) {
      String errorBody = e.bodyAsString();
      System.err.println(errorBody);
  } catch (Exception e) {
      System.err.println(e.getMessage());
  }
  ```

  ### Parameters

  <ParamField type="String" body="transaction">
    A base64 encoded serialized transaction to sign.
  </ParamField>

  ### Returns

  The `SolanaSignTransactionRpcResponseData` object contains the following fields:

  <ResponseField name="signedTransaction()" type="String">
    The signed transaction.
  </ResponseField>
</View>

<View title="Rust" icon="rust">
  Use the `sign_transaction` method on the Solana service to sign a transaction.

  ### Usage

  ```rust  theme={"system"}
  use privy_rs::{AuthorizationContext, PrivyClient};

  let client = PrivyClient::new("app_id".to_string(), "app_secret".to_string())?;
  let solana_service = client.wallets().solana();
  let auth_ctx = AuthorizationContext::new();

  // Base64-encoded Solana transaction (example)
  let transaction = "AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAEDArczbMia1tLmq7zz4DinMNN0pJ1JtLdqIJPUw3YrGCzYAMHBsgN27lcgB6H2WQvFgyZuJYHa46puOQo9yQ8CVQbd9uHXZaGT2cvhRs7reawctIXtX1s3kTqM9YV+/wCp20C7Wj2aiuk5TReAXo+VTVg8QTHjs0UjNMMKCvpzZ+ABAgEBARU=";

  let signed_tx = solana_service.sign_transaction(
      &wallet_id,
      transaction,
      &auth_ctx,
      None
  ).await?;

  println!("Transaction signed successfully");
  ```

  <Tip>
    For transaction construction, you'll typically use the
    [@solana/web3.js](https://solana-foundation.github.io/solana-web3.js/) library or
    [solana\_sdk](https://docs.rs/solana-sdk/) to create your transaction, serialize it to base64, and
    then sign it with Privy.
  </Tip>

  ### Parameters and Returns

  See the Rust SDK documentation for detailed parameter and return types, including embedded examples:

  * [SolanaService::sign\_transaction](https://docs.rs/privy-rs/latest/privy_rs/solana/struct.SolanaService.html#method.sign_transaction)

  For REST API details, see the [API reference](/api-reference/wallets/solana/sign-transaction).
</View>

<View title="Go" icon="golang">
  Use the `SignTransaction` method on the Solana service to sign a transaction with a Solana wallet.

  ### Usage

  ```go  theme={"system"}
  response, err := client.Wallets.Solana.SignTransaction(
      context.Background(),
      "wallet-id",
      privy.SolanaSignTransactionRpcInputParams{
          Encoding:    "base64",
          Transaction: "base64-encoded-serialized-transaction",
      },
  )
  if err != nil {
      log.Fatalf("failed to sign transaction: %v", err)
  }

  fmt.Println("Signed transaction:", response.SignedTransaction)
  ```

  ### Parameters and Returns

  See the [API reference](/api-reference/wallets/solana/sign-transaction) for more details.
</View>

<View title="REST API" icon="terminal">
  To sign a transaction make a `POST` request to

  ```bash  theme={"system"}
  https://api.privy.io/v1/wallets/<wallet_id>/rpc
  ```

  ### Usage

  ```bash  theme={"system"}
  $ curl --request POST https://api.privy.io/v1/wallets/<wallet_id>/rpc \
      -u "<your-privy-app-id>:<your-privy-app-secret>" \
      -H "privy-app-id: <your-privy-app-id>" \
      -H "privy-authorization-signature: <authorization-signature-for-request>" \
      -H 'Content-Type: application/json' \
      -d '{
          "method": "signTransaction",
          "params": {
          "transaction": "insert-base-64-encoded-serialized-transaction",
          "encoding": "base64"
          }
      }'
  ```

  A successful response will look like the following:

  ```json  theme={"system"}
  {
  "method": "signTransaction",
  "data": {
      "signed_transaction": "base64-encoded-serialized-signed-transaction",
      "encoding": "base64"
  }
  }
  ```

  ### Parameters

  <ParamField path="method" type="'signTransaction'" required>
    The RPC method executed with the wallet.
  </ParamField>

  <ParamField path="params" type="Object" required>
    <ParamField path="transaction" type="string" required>
      The transaction to sign with the wallet. If the transaction to sign is raw bytes,
      you must serialize the transaction as a base64 string.
    </ParamField>

    <ParamField path="encoding" type="'base64'" required>
      The encoding format for `transaction`. Currently, only `'base64'` is supported
      for Solana.
    </ParamField>
  </ParamField>

  ### Returns

  <ResponseField name="method" type="'signTransaction'">
    The RPC method executed with the wallet.
  </ResponseField>

  <ResponseField name="data.signed_transaction" type="string">
    The signed transaction.
  </ResponseField>

  <ResponseField name="data.encoding" type="'base64'">
    The encoding format for the signed transaction. Currently, only `'base64'` is supported for Ethereum.
  </ResponseField>
</View>
\n