> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Sponsoring transactions on Solana

With embedded wallets, your app can sponsor gas fees for transactions on Solana, allowing users to transact without a SOL balance.
This is done by configuring the `feePayer` property of the sponsored transaction to be a fee payer wallet that your app manages to pay users' gas fees.

## Overview

Sponsoring transactions on Solana involves the following steps:

<Steps>
  <Step title="Set up a fee payer wallet">
    Create a fee payer wallet in your backend to pay for users' gas fees.
  </Step>

  <Step title="Prepare and sign the transaction">
    Prepare a transaction with a custom fee payer, sign it with the user's wallet, and send it to your
    backend.
  </Step>

  <Step title="Verify and complete the transaction">
    Verify the transaction, sign it with the fee payer wallet, and broadcast it
    to the network.
  </Step>
</Steps>

<Note>
  To prepare transactions with a fee payer, we recommend using the
  [@solana/web3.js](https://solana-foundation.github.io/solana-web3.js/) library.
</Note>

## Setting up a fee payer wallet

To start, create a fee payer wallet in your backend to sponsor transactions sent by users. You can either:

1. Generate a new keypair directly:

```javascript  theme={"system"}
import {Keypair} from '@solana/web3.js';
import bs58 from 'bs58';

// Generate a new keypair
const feePayerWallet = new Keypair();
const feePayerAddress = feePayerWallet.publicKey.toBase58();
const feePayerPrivateKey = bs58.encode(feePayerWallet.secretKey);

// Make sure to store the private key securely; it should never leave your server
console.log('Fee Payer Address:', feePayerAddress);
console.log('Fee Payer Private Key:', feePayerPrivateKey);
```

2. Or [create a Solana wallet](/wallets/wallets/create/create-a-wallet) to act as your fee payer for better security and key management.

Ensure you fund this wallet with SOL to pay for transaction fees.

## Implementing Sponsored Transactions

<View title="React" icon="react">
  With the React SDK, follow these steps to prepare and send a sponsored transaction:

  ```javascript  theme={"system"}
  import {useWallets} from '@privy-io/react-auth/solana';
  import {
    TransactionMessage,
    PublicKey,
    VersionedTransaction,
    Connection
  } from '@solana/web3.js';

  // This function prepares and signs a sponsored transaction
  async function prepareSponsoredTransaction(instructions, feePayerAddress) {
    // Find the user's embedded wallet
    const { wallets } = useWallets();
    const embeddedWallet = wallets.find(wallet => wallet.standardWallet.name === 'Privy');

    if (!embeddedWallet) {
      throw new Error('No embedded wallet found');
    }

    // Create a connection to Solana
    const connection = new Connection('https://api.mainnet-beta.solana.com');
    const { blockhash } = await connection.getLatestBlockhash();

    // Create the transaction message with fee payer set to the backend wallet
    const message = new TransactionMessage({
      payerKey: new PublicKey(feePayerAddress),
      recentBlockhash: blockhash,
      instructions
    }).compileToV0Message();

    // Create transaction
    const transaction = new VersionedTransaction(message);

    // Serialize message for signing
    const serializedMessage = Buffer.from(transaction.message.serialize()).toString('base64');

    // Get provider and sign
    const {signature: serializedUserSignature} = await embeddedWallet.signMessage({message: serializedMessage})

    // Add user signature to transaction
    const userSignature = Buffer.from(serializedUserSignature, 'base64');
    transaction.addSignature(new PublicKey(embeddedWallet.address), userSignature);

    // Serialize the transaction to send to backend
    const serializedTransaction = Buffer.from(transaction.serialize()).toString('base64');

    // Send to your backend
    const response = await fetch('your-backend-endpoint', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ transaction: serializedTransaction })
    });

    const { transactionHash } = await response.json();
    return transactionHash;
  }
  ```
</View>

<View title="React Native" icon="react">
  With the React Native SDK, follow these steps to prepare and send a sponsored transaction:

  ```javascript  theme={"system"}
  import {useEmbeddedSolanaWallet} from '@privy-io/expo';
  import {
    TransactionMessage,
    PublicKey,
    VersionedTransaction,
    Connection
  } from '@solana/web3.js';

  // This function prepares and signs a sponsored transaction
  async function prepareSponsoredTransaction(instructions, feePayerAddress) {
    // Get the embedded wallet
    const wallet = useEmbeddedSolanaWallet();
    const embeddedWallet = wallet.wallets[0];

    if (!embeddedWallet) {
      throw new Error('No embedded wallet found');
    }

    // Create a connection to Solana
    const connection = new Connection('https://api.mainnet-beta.solana.com');
    const { blockhash } = await connection.getLatestBlockhash();

    // Create the transaction message with fee payer set to the backend wallet
    const message = new TransactionMessage({
      payerKey: new PublicKey(feePayerAddress),
      recentBlockhash: blockhash,
      instructions
    }).compileToV0Message();

    // Create transaction
    const transaction = new VersionedTransaction(message);

    // Serialize message for signing
    const serializedMessage = Buffer.from(transaction.message.serialize()).toString('base64');

    // Get provider and sign
    const provider = await embeddedWallet.getProvider();
    const { signature: serializedUserSignature } = await provider.request({
      method: 'signMessage',
      params: {
        message: serializedMessage
      }
    });

    // Add user signature to transaction
    const userSignature = Buffer.from(serializedUserSignature, 'base64');
    transaction.addSignature(new PublicKey(embeddedWallet.address), userSignature);

    // Serialize the transaction to send to backend
    const serializedTransaction = Buffer.from(transaction.serialize()).toString('base64');

    // Send to your backend
    const response = await fetch('your-backend-endpoint', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ transaction: serializedTransaction })
    });

    const { transactionHash } = await response.json();
    return transactionHash;
  }
  ```
</View>

<View title="Swift" icon="swift">
  With the Swift SDK, follow these steps to prepare and send a sponsored transaction:

  ```swift  theme={"system"}
  import Foundation
  import SolanaSwift
  import PrivySDK

  // This function prepares and signs a sponsored transaction
  func prepareSponsoredTransaction(
      wallet: EmbeddedSolanaWallet,
      instructions: [TransactionInstruction],
      feePayerAddress: String,
      rpcUrl: String
  ) async throws -> String {
      // Create a Solana RPC client
      let solana = JSONRPCAPIClient(endpoint: URL(string: rpcUrl)!)

      // Get the latest blockhash
      let latestBlockhash = try await solana.getLatestBlockhash()

      // Create public keys
      let walletPK = try PublicKey(string: wallet.address)
      let feePayerPK = try PublicKey(string: feePayerAddress)

      // Create transaction
      var tx = Transaction()

      // Add instructions
      for instruction in instructions {
          tx.instructions.append(instruction)
      }

      // Set the fee payer and blockhash
      tx.recentBlockhash = latestBlockhash
      tx.feePayer = feePayerPK

      // Serialize the transaction message to base64
      let message = try tx.compileMessage().serialize().base64EncodedString()

      // Get the provider for wallet
      let provider = wallet.provider

      // Sign using the embedded wallet
      let userSignature = try await provider.signMessage(message: message)

      // Add the signature to the transaction
      try tx.addSignature(signature: Data(base64Encoded: userSignature)!, publicKey: walletPK)

      // Serialize the transaction for transmission to backend
      let serializedTransaction = tx.serialize().base64EncodedString()

      // Send to backend
      let url = URL(string: "your-backend-endpoint")!
      var request = URLRequest(url: url)
      request.httpMethod = "POST"
      request.addValue("application/json", forHTTPHeaderField: "Content-Type")

      let requestBody: [String: Any] = ["transaction": serializedTransaction]
      request.httpBody = try JSONSerialization.data(withJSONObject: requestBody)

      let (data, response) = try await URLSession.shared.data(for: request)

      guard let httpResponse = response as? HTTPURLResponse,
            (200...299).contains(httpResponse.statusCode) else {
          throw NSError(domain: "HTTP Error", code: (response as? HTTPURLResponse)?.statusCode ?? 0)
      }

      let jsonResponse = try JSONSerialization.jsonObject(with: data) as? [String: Any]
      guard let transactionHash = jsonResponse?["transactionHash"] as? String else {
          throw NSError(domain: "Response Error", code: 0, userInfo: [NSLocalizedDescriptionKey: "Invalid response"])
      }

      return transactionHash
  }
  ```
</View>

<View title="Android" icon="android">
  With the Android SDK, follow these steps to prepare and send a sponsored transaction:

  ```kotlin  theme={"system"}
  import android.util.Base64
  import kotlinx.coroutines.Dispatchers
  import kotlinx.coroutines.withContext
  import org.json.JSONObject
  import java.net.HttpURLConnection
  import java.net.URL

  // This function prepares and signs a sponsored transaction
  suspend fun prepareSponsoredTransaction(
      solanaWallet: EmbeddedSolanaWallet,
      instructions: List<Instruction>,
      feePayerAddress: String,
      rpcUrl: String
  ): Result<String> {
      return try {
          // Create connection to Solana
          val connection = Connection(rpcUrl)

          // Get recent blockhash
          val recentBlockhash = connection.getLatestBlockhash()

          // Create wallet public key
          val walletPublicKey = PublicKey(solanaWallet.address)
          val feePayerPublicKey = PublicKey(feePayerAddress)

          // Build transaction
          val transaction = Transaction()

          // Add instructions to transaction
          instructions.forEach { instruction ->
              transaction.add(instruction)
          }

          // Set blockhash and fee payer
          transaction.recentBlockhash = recentBlockhash
          transaction.feePayer = feePayerPublicKey

          // Serialize transaction message to base64
          val serializedMessage = transaction.serializeMessage().base64()

          // Sign the message with user's wallet
          val signatureResult = solanaWallet.provider.signMessage(serializedMessage)

          when (signatureResult) {
              is Result.Success -> {
                  // Get the signature
                  val userSignature = signatureResult.data

                  // Add signature to transaction
                  transaction.addSignature(
                      walletPublicKey,
                      Base64.decode(userSignature, Base64.DEFAULT)
                  )

                  // Serialize transaction for sending to backend
                  val serializedTransaction = Base64.encodeToString(
                      transaction.serialize(),
                      Base64.NO_WRAP
                  )

                  // Send to backend
                  val url = URL("your-backend-endpoint")
                  val connection = url.openConnection() as HttpURLConnection
                  connection.requestMethod = "POST"
                  connection.setRequestProperty("Content-Type", "application/json")
                  connection.doOutput = true

                  // Create request body
                  val requestBody = JSONObject().apply {
                      put("transaction", serializedTransaction)
                  }.toString()

                  // Send request
                  connection.outputStream.use { os ->
                      os.write(requestBody.toByteArray())
                  }

                  // Read response
                  val responseCode = connection.responseCode
                  if (responseCode in 200..299) {
                      val response = connection.inputStream.bufferedReader().use { it.readText() }
                      val jsonResponse = JSONObject(response)
                      val transactionHash = jsonResponse.getString("transactionHash")
                      Result.Success(transactionHash)
                  } else {
                      val error = connection.errorStream?.bufferedReader()?.use { it.readText() } ?: "Unknown error"
                      Result.Failure(Exception("HTTP Error: $responseCode - $error"))
                  }
              }
              is Result.Failure -> {
                  Result.Failure(signatureResult.error)
              }
          }
      } catch (e: Exception) {
          Result.Failure(e)
      }
  }
  ```
</View>

<View title="Flutter" icon="flutter">
  With the Flutter SDK, follow these steps to prepare and send a sponsored transaction:

  ```dart  theme={"system"}
  import 'dart:convert';
  import 'package:http/http.dart' as http;
  import 'package:solana/solana.dart';

  // This function prepares and signs a sponsored transaction
  Future<Result<String>> prepareSponsoredTransaction({
    required EmbeddedSolanaWallet solanaWallet,
    required List<Instruction> instructions,
    required String feePayerAddress,
    required String rpcUrl,
    required String backendUrl,
  }) async {
    try {
      // Create connection to Solana
      final connection = Connection(rpcUrl);

      // Get recent blockhash
      final recentBlockhash = await connection.getLatestBlockhash();

      // Create wallet public key
      final walletPublicKey = PublicKey(solanaWallet.address);
      final feePayerPublicKey = PublicKey(feePayerAddress);

      // Build transaction
      final transaction = Transaction();

      // Add instructions to transaction
      for (final instruction in instructions) {
        transaction.add(instruction);
      }

      // Set blockhash and fee payer
      transaction.recentBlockhash = recentBlockhash;
      transaction.feePayer = feePayerPublicKey;

      // Serialize transaction message to base64
      final serializedMessage = base64Encode(transaction.serializeMessage());

      // Sign the message with user's wallet
      final signatureResult = await solanaWallet.provider.signMessage(serializedMessage);

      return signatureResult.when(
        success: (userSignature) async {
          // Add signature to transaction
          transaction.addSignature(
            walletPublicKey,
            base64Decode(userSignature)
          );

          // Serialize transaction for sending to backend
          final serializedTransaction = base64Encode(transaction.serialize());

          // Send to backend
          final response = await http.post(
            Uri.parse(backendUrl),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({'transaction': serializedTransaction}),
          );

          if (response.statusCode >= 200 && response.statusCode < 300) {
            final jsonResponse = jsonDecode(response.body);
            final transactionHash = jsonResponse['transactionHash'] as String;
            return Success(transactionHash);
          } else {
            return Failure(
              Exception('HTTP Error: ${response.statusCode} - ${response.body}')
            );
          }
        },
        failure: (error) {
          return Failure(Exception('Failed to sign transaction: $error'));
        },
      );
    } catch (e) {
      return Failure(Exception('Error preparing transaction: $e'));
    }
  }
  ```
</View>

## Backend Implementation

Here's how to implement the server-side portion that receives the partially signed transaction, adds the fee payer signature, and broadcasts it:

```javascript  theme={"system"}
// Backend implementation (Node.js with Express)
import express from 'express';
import {Keypair, VersionedTransaction, Connection, clusterApiUrl, PublicKey} from '@solana/web3.js';
import bs58 from 'bs58';

const app = express();
app.use(express.json());

// Your fee payer wallet's private key (Keep this secure!)
const FEE_PAYER_PRIVATE_KEY = 'your-base58-encoded-private-key';
const FEE_PAYER_ADDRESS = 'your-fee-payer-address';

// Initialize fee payer keypair
const feePayerWallet = Keypair.fromSecretKey(bs58.decode(FEE_PAYER_PRIVATE_KEY));

// Connect to Solana
const connection = new Connection(clusterApiUrl('mainnet-beta'));

// Endpoint to handle sponsored transactions
app.post('/sponsor-transaction', async (req, res) => {
  try {
    // Get the partially signed transaction from the request
    const {transaction: serializedTransaction} = req.body;

    if (!serializedTransaction) {
      return res.status(400).json({error: 'Missing transaction data'});
    }

    // Deserialize the transaction
    const transactionBuffer = Buffer.from(serializedTransaction, 'base64');
    const transaction = VersionedTransaction.deserialize(transactionBuffer);

    // Verify the transaction
    // 1. Check that it's using the correct fee payer
    const message = transaction.message;
    const accountKeys = message.getAccountKeys();
    const feePayerIndex = 0; // Fee payer is always the first account
    const feePayer = accountKeys.get(feePayerIndex);

    if (!feePayer || feePayer.toBase58() !== FEE_PAYER_ADDRESS) {
      return res.status(403).json({
        error: 'Invalid fee payer in transaction'
      });
    }

    // 2. Check for any unauthorized fund transfers
    for (const instruction of message.compiledInstructions) {
      const programId = accountKeys.get(instruction.programIndex);

      // Check if instruction is for System Program (transfers)
      if (programId && programId.toBase58() === '11111111111111111111111111111111') {
        // Check if it's a transfer (command 2)
        if (instruction.data[0] === 2) {
          const senderIndex = instruction.accountKeyIndexes[0];
          const senderAddress = accountKeys.get(senderIndex);

          // Don't allow transactions that transfer tokens from fee payer
          if (senderAddress && senderAddress.toBase58() === FEE_PAYER_ADDRESS) {
            return res.status(403).json({
              error: 'Transaction attempts to transfer funds from fee payer'
            });
          }
        }
      }
    }

    // 3. Sign with fee payer
    transaction.sign([feePayerWallet]);

    // 4. Send transaction
    const signature = await connection.sendTransaction(transaction);

    // Return the transaction hash
    return res.status(200).json({
      transactionHash: signature,
      message: 'Transaction sent successfully'
    });
  } catch (error) {
    console.error('Error processing transaction:', error);
    return res.status(500).json({
      error: 'Failed to process transaction',
      details: error.message
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

## Security Considerations

When implementing transaction sponsorship, be mindful of these security considerations:

<CardGroup cols={2}>
  <Card title="Verify Transaction Contents" icon="shield-check">
    Always verify the transaction contents in your backend before signing with the fee payer. Ensure
    there are no unauthorized fund transfers.
  </Card>

  <Card title="Rate Limiting" icon="gauge-high">
    Implement rate limiting to prevent abuse of your sponsorship service. Consider limits per user,
    per session, or per wallet.
  </Card>

  <Card title="Amount Validation" icon="money-bill">
    Validate the transaction amount if applicable. Consider setting maximum sponsorship amounts to
    prevent excessive spending.
  </Card>

  <Card title="Program ID Whitelisting" icon="list-check">
    Only sponsor transactions for specific whitelisted program IDs that your app interacts with to
    prevent abuse.
  </Card>
</CardGroup>

<Note>
  Be extremely careful with your fee payer wallet's private key. Never expose it in client-side code
  or store it in unsecured environments. Consider using environment variables, secret management
  services, or HSMs to securely store private keys in production.
</Note>
\n