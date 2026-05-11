> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# null

<Tip>
  To rely on Privy's API to fill in the recentBlockhash field of the Solana transaction, pass in the
  dummy value `11111111111111111111111111111111` for the recentBlockhash field.
</Tip>

<Info>
  When using Privy's server-side SDKs to send transactions, you can use the authorization context to
  automatically sign requests. Learn more about [signing on the
  server](/controls/authorization-keys/using-owners/sign/signing-on-the-server).
</Info>

<View title="React" icon="react">
  To send a transaction from a wallet using the React SDK, use the `signAndSendTransaction` method from the `useSignAndSendTransaction` hook:

  ```javascript  theme={"system"}
  signAndSendTransaction: (input: {
    transaction: Uint8Array;
    wallet: ConnectedStandardSolanaWallet;
    chain?: SolanaChain;
    options?: SolanaSignAndSendTransactionOptions & {
      uiOptions?: SendTransactionModalUIOptions;
      sponsor?: boolean;
    };
  }) => Promise<{ signature: Uint8Array }>
  ```

  ### Usage

  ```javascript  theme={"system"}
  import {useSignAndSendTransaction, useWallets} from '@privy-io/react-auth/solana';
  import {
    pipe,
    createSolanaRpc,
    getTransactionEncoder,
    createTransactionMessage,
    setTransactionMessageFeePayer,
    setTransactionMessageLifetimeUsingBlockhash,
    appendTransactionMessageInstructions,
    compileTransaction,
    address,
    createNoopSigner
  } from '@solana/kit';
  import {getTransferSolInstruction} from '@solana-program/system';

  // Inside your component
  const {signAndSendTransaction} = useSignAndSendTransaction();
  const {wallets} = useWallets();

  const selectedWallet = wallets[0];

  const amount = 1;

  const transferInstruction = getTransferSolInstruction({
    amount: BigInt(parseFloat(amount) * 1_000_000_000), // Convert SOL to lamports
    destination: address('RecipientAddressHere'),
    source: createNoopSigner(address(selectedWallet.address))
  });

  // Configure your RPC connection to point to the correct Solana network
  const {getLatestBlockhash} = createSolanaRpc('https://api.mainnet-beta.solana.com'); // Replace with your Solana RPC endpoint
  const {value: latestBlockhash} = await getLatestBlockhash().send();

  // Create a transaction using @solana/kit
  const transaction = pipe(
    createTransactionMessage({version: 0}),
    (tx) => setTransactionMessageFeePayer(address(selectedWallet.address), tx), // Set the message fee payer
    (tx) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx), // Set recent blockhash
    (tx) => appendTransactionMessageInstructions([transferInstruction], tx), // Add your instructions to the transaction
    (tx) => compileTransaction(tx), // Compile the transaction
    (tx) => new Uint8Array(getTransactionEncoder().encode(tx)) // Finally encode the transaction
  );

  // Send the transaction
  const result = await signAndSendTransaction({
    transaction: transaction,
    wallet: selectedWallet
  });

  console.log('Transaction sent with signature:', result.signature);
  ```

  ### Parameters

  <Expandable title="parameters" defaultOpen="true">
    <ParamField path="transaction" type="Uint8Array" required>
      The encoded transaction to be sent.
    </ParamField>

    <ParamField path="wallet" type="ConnectedStandardSolanaWallet" required>
      The Solana wallet to use for sending the transaction.
    </ParamField>

    <ParamField path="chain" type="SolanaChain">
      Type of all Solana chains supported by Privy.
    </ParamField>

    <ParamField path="options" type="SolanaSignAndSendTransactionOptions & {uiOptions?: SendTransactionModalUIOptions; sponsor?: boolean}">
      Additional options for sending the transaction.

      <Expandable title="child attributes">
        <ParamField path="sponsor" type="boolean">
          Optional parameter to enable gas sponsorship for this transaction. [Learn
          more.](/wallets/gas-and-asset-management/gas/overview)
        </ParamField>

        <ParamField path="uiOptions" type="SendTransactionModalUIOptions">
          UI options to customize the transaction request modal.

          <Tip>
            To hide confirmation modals, set `options.uiOptions.showWalletUIs` to `false`. Learn more
            about configuring modal prompts [here](/recipes/react/manage-wallet-UIs).
          </Tip>
        </ParamField>
      </Expandable>
    </ParamField>
  </Expandable>

  ### Returns

  <ResponseField name="signature" type="Uint8Array">
    The signature of the transaction.
  </ResponseField>

  ## Sign and send all transactions

  To sign and send multiple transactions in a single call, use the `signAndSendTransaction` method with multiple inputs:

  ```tsx  theme={"system"}
  signAndSendTransaction(...inputs: SignAndSendTransactionInput[]): Promise<SignAndSendTransactionOutput[]>
  ```

  ### Usage

  ```typescript  theme={"system"}
  import {useSignAndSendTransaction, useWallets} from '@privy-io/react-auth/solana';
  import {
    pipe,
    createSolanaRpc,
    getTransactionEncoder,
    createTransactionMessage,
    setTransactionMessageFeePayer,
    setTransactionMessageLifetimeUsingBlockhash,
    appendTransactionMessageInstructions,
    compileTransaction,
    address,
    createNoopSigner
  } from '@solana/kit';
  import {getTransferSolInstruction} from '@solana-program/system';

  // Inside your component
  const {signAndSendTransaction} = useSignAndSendTransaction();
  const {wallets} = useWallets();

  const selectedWallet = wallets[0];

  const amount = 1; // Amount of SOL to send

  const transferInstruction = getTransferSolInstruction({
    amount: BigInt(amount * 1_000_000_000), // Convert SOL to lamports
    destination: address('RecipientAddressHere'),
    source: createNoopSigner(address(selectedWallet.address))
  });

  // Configure your RPC connection to point to the correct Solana network
  const {getLatestBlockhash} = createSolanaRpc('https://api.mainnet-beta.solana.com'); // Replace with your Solana RPC endpoint
  const {value: latestBlockhash} = await getLatestBlockhash().send();

  // Create transactions using @solana/kit
  const transactions = [
    pipe(
      createTransactionMessage({version: 0}),
      (tx) => setTransactionMessageFeePayer(address(selectedWallet.address), tx), // Set the message fee payer
      (tx) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx), // Set recent blockhash
      (tx) => appendTransactionMessageInstructions([transferInstruction], tx), // Add your instructions to the transaction
      (tx) => compileTransaction(tx), // Compile the transaction
      (tx) => new Uint8Array(getTransactionEncoder().encode(tx)) // Finally encode the transaction
    ),
    pipe(
      createTransactionMessage({version: 0}),
      (tx) => setTransactionMessageFeePayer(address(selectedWallet.address), tx),
      (tx) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
      (tx) => appendTransactionMessageInstructions([transferInstruction], tx),
      (tx) => compileTransaction(tx),
      (tx) => new Uint8Array(getTransactionEncoder().encode(tx))
    )
  ];

  // Send multiple transactions
  const results = await signAndSendTransaction(
    {
      transaction: transactions[0],
      wallet: selectedWallet
    },
    {
      transaction: transactions[1],
      wallet: selectedWallet
    }
  );

  console.log(
    'Transactions sent with signatures:',
    results.map((result) => result.signature.toString()).join(',')
  );
  ```

  ### Parameters

  <Expandable title="parameters" defaultOpen="true">
    <ParamField path="inputs" type="SignAndSendTransactionInput[]" required>
      <ParamField path="transaction" type="Uint8Array" required>
        The encoded transaction to be sent.
      </ParamField>

      <ParamField path="wallet" type="ConnectedStandardSolanaWallet" required>
        The Solana wallet to use for sending the transaction.
      </ParamField>

      <ParamField path="chain" type="SolanaChain">
        Type of all Solana chains supported by Privy.
      </ParamField>

      <ParamField path="options" type="SolanaSignAndSendTransactionOptions & {uiOptions?: SendTransactionModalUIOptions; sponsor?: boolean}">
        Additional options for sending the transaction.

        <Expandable title="child attributes">
          <ParamField path="sponsor" type="boolean">
            Optional parameter to enable gas sponsorship for this transaction. [Learn
            more.](/wallets/gas-and-asset-management/gas/overview)
          </ParamField>

          <ParamField path="uiOptions" type="SendTransactionModalUIOptions">
            UI options to customize the transaction request modal.
          </ParamField>
        </Expandable>
      </ParamField>
    </ParamField>
  </Expandable>
</View>

<View title="React Native" icon="react">
  To send a transaction from a wallet using the React Native SDK, use the `request` method from the wallet's provider:

  ```javascript  theme={"system"}
  request: (request: {
    method: 'signAndSendTransaction',
    params: {
      transaction: Transaction | VersionedTransaction,
      connection: Connection
    }
  }) => Promise<{ signature: string }>
  ```

  <Note>
    The Expo SDK does not support built-in UIs for sending transactions.
    The `signAndSendTransaction` method gives you complete control over the experience and UI.
  </Note>

  ### Usage

  ```javascript  theme={"system"}
  import {Connection} from '@solana/web3.js';
  import {useEmbeddedSolanaWallet} from '@privy-io/expo';

  const { wallets } = useEmbeddedSolanaWallet();
  const wallet = wallets[0];

  // Get the provider
  const provider = await wallet.getProvider();

  // Create a connection to the Solana network
  const connection = new Connection('insert-your-rpc-url-here');

  // Create your transaction (either legacy Transaction or VersionedTransaction)
  // transaction = ...

  // Send the transaction
  const { signature } = await provider.request({
    method: 'signAndSendTransaction',
    params: {
      transaction: transaction,
      connection: connection,
    },
  });

  console.log("Transaction sent with signature:", signature);
  ```

  ### Parameters

  <ParamField path="method" type="'signAndSendTransaction'" required>
    The RPC method executed with the wallet.
  </ParamField>

  <ParamField path="params" type="Object" required>
    Parameters for the transaction.

    <Expandable title="child attributes" defaultOpen="true">
      <ParamField path="transaction" type="Transaction | VersionedTransaction" required>
        The transaction to sign and send. This can be either a legacy Transaction or a VersionedTransaction object from [@solana/web3.js](https://solana-foundation.github.io/solana-web3.js/classes/Transaction.html).
      </ParamField>

      <ParamField path="connection" type="Connection" required>
        Connection to an SVM (Solana) network.
      </ParamField>
    </Expandable>
  </ParamField>

  ### Returns

  <ResponseField name="signature" type="string">
    The signature of the transaction.
  </ResponseField>
</View>

<View title="Swift" icon="swift">
  Sending a Solana transaction will sign it using the embedded wallet and then submit it to the network.

  ```swift  theme={"system"}
  public protocol EmbeddedSolanaWalletProvider {
      func signAndSendTransaction(transaction: Data, cluster: SolanaCluster, options: SolanaSendOptions?) async throws -> String
  }
  ```

  ### A note on Solana clusters

  When sending a transaction you must specify which cluster the transaction is being sent on.
  For it, the Privy SDK provides the `SolanaCluster` struct, with the following options:

  * `SolanaCluster.mainnet` for the Solana mainnet-beta.
  * `SolanaCluster.devnet` for the Solana devnet.
  * `SolanaCluster.testnet` for the Solana testnet.
  * `SolanaCluster.mainnet.with(rpcUrl: String)` for using the Solana mainnet cluster but broadcasting to a different RPC URL than the default one.
  * `SolanaCluster(caip2: String, rpcUrl: String)` for a fully custom Solana cluster.

  ### Usage

  In this example, we're using the `SolanaSwift` SDK to build the transaction, to be sent on the mainnet cluster.
  You can use whichever method you prefer for building and serializing the transaction before handing off to Privy.

  ```swift  theme={"system"}
  import SolanaSwift

  // Get the provider for wallet (assumes wallet is already obtained)
  let provider = wallet.provider
  let cluster = SolanaCluster.mainnet

  // Create a Solana RPC client
  let solana = JSONRPCAPIClient(endpoint: URL(string: cluster.rpcUrl)!)

  // Build the transaction using your preferred method
  let latestBlockhash = try await solana.getLatestBlockhash()
  // If your application is set to TEE execution, you can allow Privy to set the recent blockhash for
  // you by passing in `11111111111111111111111111111111` as the blockhash.
  // let latestBlockhash = "11111111111111111111111111111111"
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

  // Sign and broadcast the transaction using the Privy Embedded Wallet
  let txHash = try await provider.signAndSendTransaction(transaction: tx.serialize(), cluster: cluster)

  print("Transaction sent with hash: \(txHash)")
  ```

  ### Parameters

  <ParamField path="transaction" type="Data" required>
    The serialized transaction to sign and send.
  </ParamField>

  <ParamField path="cluster" type="SolanaCluster" required>
    The cluster the transaction is being sent on.
    This determines both the CAIP-2 formatted ID for the cluster, and the RPC URL to use for broadcasting the transaction.

    Note that the RPC URL set here is only used for applications running in on device execution mode.
  </ParamField>

  <ParamField path="options" type="SolanaSendOptions?">
    Additional options for the RPC broadcast.

    <Expandable title="child attributes" defaultOpen="true">
      <ParamField path="skipPreflight" type="Bool?" required>
        Disable the transaction verification step.
      </ParamField>

      <ParamField path="preflightCommitment" type="Commitment?" required>
        The preflight commitment level.
      </ParamField>

      <ParamField path="maxRetries" type="Int?" required>
        The maximum number of times for the RPC node to retry sending the transaction to the leader.
      </ParamField>

      <ParamField path="minContextSlot" type="Int?" required>
        The minimum slot that the request can be evaluated at.
      </ParamField>
    </Expandable>
  </ParamField>

  ### Returns

  <ResponseField name="txHash" type="String">
    The hash of the broadcasted transaction.
  </ResponseField>
</View>

<View title="Android" icon="android">
  Use the `signAndSendTransaction` method to sign and submit a Solana transaction in a single call.

  ```kotlin  theme={"system"}
  public suspend fun signAndSendTransaction(
      transaction: ByteArray,
      cluster: SolanaCluster = SolanaCluster.MainNet,
      rpcUrl: String? = null,
      sendOptions: SendOptions? = null
  ): Result<String>
  ```

  ### Usage

  ```kotlin  theme={"system"}
  val solanaWallet = user.embeddedSolanaWallets.first()

  // Fetch latest blockhash from network
  val blockhash = fetchLatestBlockhash(SolanaCluster.DevNet).getOrThrow()
  // For apps with TEE execution: use "11111111111111111111111111111111" instead - Privy auto-populates it

  // Build the transaction
  val fromPubkey = SolanaPublicKey.from(solanaWallet.address)
  val instruction = SystemProgram.transfer(
      fromPubkey = fromPubkey,
      toPubkey = SolanaPublicKey.from(recipientAddress),
      lamports = 1000000
  )

  val txMessage = Message.Builder()
      .addInstruction(instruction)
      .setRecentBlockhash(blockhash)
      .build()

  val transaction = Transaction(txMessage).serialize()

  // Sign and send
  val result = solanaWallet.provider.signAndSendTransaction(
      transaction = transaction,
      cluster = SolanaCluster.DevNet
  )

  result.fold(
      onSuccess = { signature ->
          println("Success: https://explorer.solana.com/tx/$signature?cluster=devnet")
      },
      onFailure = { error ->
          println("Failed: ${error.message}")
      }
  )
  ```

  ### With SendOptions

  ```kotlin  theme={"system"}
  val result = solanaWallet.provider.signAndSendTransaction(
      transaction = transaction,
      cluster = SolanaCluster.DevNet,
      sendOptions = SendOptions(
          preflightCommitment = "confirmed",
          maxRetries = 5
      )
  )
  ```

  ### Parameters

  <ParamField path="transaction" type="ByteArray" required>
    The serialized transaction bytes to sign and send.
  </ParamField>

  <ParamField path="cluster" type="SolanaCluster">
    The Solana network cluster. Defaults to `SolanaCluster.MainNet`.
  </ParamField>

  <ParamField path="rpcUrl" type="String?">
    Optional custom RPC URL. If not provided, uses the default RPC for the specified cluster.
  </ParamField>

  <ParamField path="sendOptions" type="SendOptions?">
    Optional configuration for transaction submission.

    <Expandable title="child attributes">
      <ParamField path="skipPreflight" type="Boolean?">
        Whether to skip preflight transaction checks. Defaults to `false`.
      </ParamField>

      <ParamField path="preflightCommitment" type="String?">
        Commitment level for preflight checks (e.g., `"confirmed"`, `"finalized"`).
      </ParamField>

      <ParamField path="maxRetries" type="Int?">
        Maximum number of retry attempts for sending the transaction.
      </ParamField>

      <ParamField path="minContextSlot" type="Long?">
        Minimum slot number at which the transaction can be evaluated.
      </ParamField>
    </Expandable>
  </ParamField>

  <Note>
    The `cluster`, `rpcUrl`, and `sendOptions` parameters are only valid for apps using [on-device execution](/security/wallet-infrastructure/advanced/user-device).
  </Note>

  ### Returns

  <ResponseField name="result" type="Result<String>">
    A Result that, when successful, contains the transaction signature.
  </ResponseField>
</View>

<View title="Flutter" icon="flutter">
  Use the `signAndSendTransaction` method on the Solana wallet provider to sign a transaction and submit it to the network in a single call.

  ```dart  theme={"system"}
  Future<Result<String>> signAndSendTransaction({
    required Uint8List transaction,
    SolanaCluster? cluster,
    String? rpcUrl,
    SendOptions? sendOptions,
  });
  ```

  ### Usage

  ```dart  theme={"system"}
  import 'dart:convert';
  import 'package:solana/solana.dart';

  // Retrieve the user's Solana wallet (assumes wallet is already obtained)
  final solanaWallet = user.embeddedSolanaWallets.first;

  // Create a Solana RPC client
  final rpcClient = RpcClient('https://api.mainnet-beta.solana.com');

  // Build the transaction
  final walletPublicKey = Ed25519HDPublicKey.fromBase58(solanaWallet.address);
  final recipientPublicKey = Ed25519HDPublicKey.fromBase58(recipientAddress);

  final instruction = SystemInstruction.transfer(
      fundingAccount: walletPublicKey,
      recipientAccount: recipientPublicKey,
      lamports: amount,
  );

  // Get recent blockhash
  final recentBlockhash = await rpcClient.getLatestBlockhash();
  // For apps with TEE execution: use "11111111111111111111111111111111" instead - Privy auto-populates it

  // Create transaction
  final transaction = Transaction.v0(
      payer: walletPublicKey,
      recentBlockhash: recentBlockhash.value.blockhash,
      instructions: [instruction],
  );

  // Serialize transaction message
  final serializedTransaction = transaction.serializeMessage();

  // Sign and send the transaction
  final result = await solanaWallet.provider.signAndSendTransaction(
      transaction: serializedTransaction
  );

  // Handle the result
  result.when(
      success: (txHash) {
          print('Transaction sent with hash: $txHash');
      },
      failure: (error) {
          print('Failed to sign and send transaction: $error');
      },
  );
  ```

  ### With SendOptions

  ```dart  theme={"system"}
  final result = await solanaWallet.provider.signAndSendTransaction(
      transaction: serializedTransaction,
      cluster: SolanaCluster.devNet,
      sendOptions: SendOptions(
          preflightCommitment: 'confirmed',
          maxRetries: 5,
      ),
  );
  ```

  ### Parameters

  <ParamField path="transaction" type="Uint8List" required>
    The serialized transaction message bytes to sign and send.
  </ParamField>

  <ParamField path="cluster" type="SolanaCluster?">
    The Solana network cluster. Defaults to `SolanaCluster.MainNet`.
  </ParamField>

  <ParamField path="rpcUrl" type="String?">
    Optional custom RPC URL. If not provided, uses the default RPC for the specified cluster.
  </ParamField>

  <ParamField path="sendOptions" type="SendOptions?">
    Optional configuration for transaction submission.

    <Expandable title="child attributes">
      <ParamField path="skipPreflight" type="bool?">
        Whether to skip preflight transaction checks. Defaults to `false`.
      </ParamField>

      <ParamField path="preflightCommitment" type="String?">
        Commitment level for preflight checks (e.g., `"confirmed"`, `"finalized"`).
      </ParamField>

      <ParamField path="maxRetries" type="int?">
        Maximum number of retry attempts for sending the transaction.
      </ParamField>

      <ParamField path="minContextSlot" type="int?">
        Minimum slot number at which the transaction can be evaluated.
      </ParamField>
    </Expandable>
  </ParamField>

  <Note>
    The `cluster`, `rpcUrl`, and `sendOptions` parameters are only valid for apps using [on-device execution](/security/wallet-infrastructure/advanced/user-device).
  </Note>

  ### Returns

  <ResponseField name="result" type="Result<String>">
    A Result that, when successful, contains the transaction hash.
  </ResponseField>
</View>

<View title="NodeJS" icon="node-js">
  Use the `signAndSendTransaction` method on the Solana interface to send a transaction with a Solana wallet.

  ### Usage

  ```js  theme={"system"}
  import {
    PublicKey,
    SystemProgram,
    VersionedTransaction,
    TransactionMessage,
  } from '@solana/web3.js';

  const walletPublicKey = new PublicKey(wallet.address);
  const instruction = SystemProgram.transfer({
    fromPubkey: walletPublicKey,
    toPubkey: new PublicKey(recipientAddress),
    lamports: amount,
  });

  const message = new TransactionMessage({
    payerKey: walletPublicKey,
    instructions: [instruction],
    recentBlockhash,
  });

  const transaction = new VersionedTransaction(message.compileToV0Message());

  const {hash} = await privy.wallets().solana().signAndSendTransaction('insert-wallet-id', {
    caip2: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp', // Mainnet
    transaction: Buffer.from(transaction.serialize()).toString('base64'),
    sponsor: true,
  });
  ```

  ### Parameters and Returns

  Check out the [API reference](/api-reference/wallets/solana/sign-and-send-transaction) for more details.
</View>

<View title="NodeJS (server-auth)" icon="node-js">
  <Warning>
    The `@privy-io/server-auth` library is deprecated. We recommend integrating `@privy-io/node` for
    the latest features and support.
  </Warning>

  Use the `signAndSendTransaction` method on the Solana client to send a transaction with a Solana wallet.

  ```js  theme={"system"}
  signAndSendTransaction: (input: SolanaSignAndSendTransactionInputType) => Promise<SolanaSignAndSendTransactionResponseType>
  ```

  ### Usage

  ```js  theme={"system"}
  import {
    PublicKey,
    SystemProgram,
    VersionedTransaction,
    TransactionMessage,
  } from '@solana/web3.js';

  const walletPublicKey = new PublicKey(wallet.address);
  const instruction = SystemProgram.transfer({
    fromPubkey: walletPublicKey,
    toPubkey: new PublicKey(recipientAddress),
    lamports: amount,
  });

  const message = new TransactionMessage({
    payerKey: walletPublicKey,
    instructions: [instruction],
    recentBlockhash,
  });

  const transaction = new VersionedTransaction(message.compileToV0Message());

  const {hash} = await privy.walletApi.solana.signAndSendTransaction({
    walletId: 'insert-wallet-id',
    caip2: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp', // Mainnet
    transaction: transaction,
    sponsor: true,
  });
  ```

  ### Parameters

  <ParamField path="walletId" type="string" required>
    The ID of the wallet to send the transaction from.
  </ParamField>

  <ParamField path="caip2" type="string" required>
    The CAIP2 chain ID of the chain the transaction is being sent on.
  </ParamField>

  <ParamField path="transaction" type="Transaction | VersionedTransaction" required>
    The transaction to sign and send. This can be either a legacy Transaction or a VersionedTransaction object from [@solana/web3.js](https://solana-foundation.github.io/solana-web3.js/classes/Transaction.html).
  </ParamField>

  <ParamField path="sponsor" type="boolean">
    Optional parameter to enable gas sponsorship for this transaction. [Learn more.](/wallets/gas-and-asset-management/gas/overview)
  </ParamField>

  ### Returns

  <ResponseField name="hash" type="string">
    The hash for the broadcasted transaction.
  </ResponseField>

  <ResponseField name="caip2" type="string">
    The CAIP2 chain ID of the chain the transaction was sent on.
  </ResponseField>
</View>

<View title="Java" icon="java">
  To send a transaction from your wallet, use the `signAndSendTransaction` method.
  It will sign your transaction, broadcast it to the network, and return the transaction hash to you.

  ### Usage

  ```java  theme={"system"}
  try {
      String caip2 = "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp"; // Solana Mainnet

      // A base64 encoded serialized transaction to sign
      String transaction = "insert-base-64-encoded-serialized-transaction";

      // Example: If wallet's owner is an authorization private key
      AuthorizationContext authorizationContext = AuthorizationContext.builder()
          .addAuthorizationPrivateKey("authorization-key")
          .build();

      SolanaSignAndSendTransactionRpcResponseData response = privyClient.wallets().solana()
          .signAndSendTransaction(
              walletId,
              caip2,
              transaction,
              authorizationContext,
              true // sponsor
          );

      String transactionHash = response.hash();
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

  <ParamField type="String" body="caip2">
    The CAIP2 chain ID of the chain the transaction is being sent on.
  </ParamField>

  <ParamField type="Boolean" body="sponsor">
    Optional parameter to enable gas sponsorship for this transaction. [Learn more.](/wallets/gas-and-asset-management/gas/overview)
  </ParamField>

  ### Returns

  The `SolanaSignAndSendTransactionRpcResponseData` object contains the following fields:

  <ResponseField name="hash()" type="String">
    The hash of the broadcasted transaction.
  </ResponseField>

  <ResponseField name="caip2()" type="String">
    The CAIP2 chain ID of the chain the transaction was sent on.
  </ResponseField>

  <ResponseField name="transactionId()" type="Optional<String>">
    The transaction ID of the broadcasted transaction.
  </ResponseField>
</View>

<View title="REST API" icon="terminal">
  To send a transaction make a POST request to

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
      "method": "signAndSendTransaction",
      "caip2": "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1",
      "sponsor": true,
      "params": {
          "transaction": "insert-base-64-encoded-serialized-transaction",
          "encoding": "base64"
      }
  }'
  ```

  A successful response will look like the following:

  ```json  theme={"system"}
  {
      "method": "signAndSendTransaction",
      "data": {
          "hash": "insert-transaction-hash",
          "caip2": "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1"
      }
  }
  ```

  ### Parameters

  <ParamField path="method" type="'signAndSendTransaction'" required>
    The RPC method executed with the wallet.
  </ParamField>

  <ParamField path="caip2" type="string" required>
    The CAIP2 chain ID to broadcast the transaction on.
  </ParamField>

  <ParamField path="params" type="Object" required>
    Parameters for the RPC method to execute with the wallet.

    <Expandable title="child attributes" defaultOpen="true">
      <ParamField path="transaction" type="string" required>
        An encoded string serializing the transaction to be signed with the wallet.
      </ParamField>

      <ParamField path="encoding" type="'base64'" required>
        The encoding format for `params.transaction`. Currently, only `'base64'` is supported.
      </ParamField>
    </Expandable>
  </ParamField>

  <ParamField path="sponsor" type="boolean">
    Optional parameter to enable gas sponsorship for this transaction. [Learn more.](/wallets/gas-and-asset-management/gas/overview)
  </ParamField>

  ### Returns

  <ResponseField name="method" type="'signAndSendTransaction'">
    The RPC method executed with the wallet.
  </ResponseField>

  <ResponseField name="data.hash" type="string">
    The hash for the broadcasted transaction.
  </ResponseField>

  <ResponseField name="data.caip2" type="string">
    The CAIP2 chain ID the transaction was submitted on.
  </ResponseField>
</View>

<View title="Rust" icon="rust">
  Use the `sign_and_send_transaction` method on the Solana service to sign and broadcast a transaction. Use the [`solana_sdk`](https://docs.rs/solana-sdk/) crate to construct your transactions.

  ### Usage

  ```rust  theme={"system"}
  use privy_rs::{AuthorizationContext, PrivyClient};
  use solana_sdk::{pubkey::Pubkey, transaction::Transaction};
  use base64::{engine::general_purpose::STANDARD, Engine};
  use std::str::FromStr;

  let client = PrivyClient::new("app_id".to_string(), "app_secret".to_string())?;
  let solana_service = client.wallets().solana();
  let auth_ctx = AuthorizationContext::new();

  // Build transaction using solana_sdk and solana_system_interface
  let from_pubkey = Pubkey::from_str("DTeASnDsQ1z9Le77MjuiPH4MyqLDWa9vB6R3ZZKRd8d3")?;
  let to_pubkey = Pubkey::from_str("9NvE68JVWHHHGLp5NNELtM5fiBw6SXHrzqQJjUqaykC1")?;
  let lamports = 1000000; // 0.001 SOL

  let transaction = Transaction::new_with_payer(
      &[solana_system_interface::instruction::transfer(
          &from_pubkey,
          &to_pubkey,
          lamports,
      )],
      Some(&from_pubkey),
  );

  // Serialize and encode transaction as base64
  let serialized_transaction = STANDARD.encode(bincode::serialize(&transaction)?);

  let result = solana_service.sign_and_send_transaction(
      &wallet_id,
      "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1", // Solana devnet
      &serialized_transaction,
      &auth_ctx,
      Some(true) // sponsor
  ).await?;

  println!("Transaction sent successfully");
  ```

  For transaction construction, use the [`solana_sdk`](https://docs.rs/solana-sdk/) crate for core transaction types and the [`solana_system_interface`](https://docs.rs/solana-system-interface/) crate for system instructions like transfers.

  ### Parameters and Returns

  See the Rust SDK documentation for detailed parameter and return types, including embedded examples:

  * [SolanaService::sign\_and\_send\_transaction](https://docs.rs/privy-rs/latest/privy_rs/solana/struct.SolanaService.html#method.sign_and_send_transaction)
  * [solana\_sdk crate documentation](https://docs.rs/solana-sdk/)
  * [solana\_system\_interface crate documentation](https://docs.rs/solana-system-interface/)

  For REST API details, see the [API reference](/api-reference/wallets/solana/sign-and-send-transaction).
</View>

<View title="Go" icon="golang">
  Use the `SignAndSendTransaction` method on the Solana service to sign and broadcast a transaction.

  ### Usage

  ```go  theme={"system"}
  caip2 := "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp" // Solana Mainnet

  response, err := client.Wallets.Solana.SignAndSendTransaction(
      context.Background(),
      "wallet-id",
      caip2,
      privy.SolanaSignAndSendTransactionRpcInputParams{
          Encoding:    "base64",
          Transaction: "base64-encoded-serialized-transaction",
      },
  )
  if err != nil {
      log.Fatalf("failed to send transaction: %v", err)
  }

  fmt.Println("Transaction hash:", response.Hash)
  ```

  ### Parameters and Returns

  See the [API reference](/api-reference/wallets/solana/sign-and-send-transaction) for more details.
</View>

<Note>
  For complete examples of sending SOL and SPL tokens using Privy's SDKs, check out the [sending a
  SOL transaction recipe](/recipes/solana/send-sol) and the [sending SPL tokens
  recipe](/recipes/solana/send-spl-tokens).
</Note>
\n