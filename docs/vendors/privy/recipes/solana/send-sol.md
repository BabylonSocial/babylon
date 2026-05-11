> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Sending a SOL transaction

Sending SOL is the most common transaction on the Solana blockchain. This recipe walks you through creating and sending SOL transfer transactions using `@solana/web3.js` with Privy wallets.

<Info>
  Before following this recipe, make sure you have [configured Privy for
  Solana](/recipes/solana/getting-started-with-privy-and-solana) in your app.
</Info>

## Overview

This recipe demonstrates how to:

* Create a SOL transfer transaction using `@solana/web3.js`
* Sign and send the transaction using Privy wallets

## Prerequisites

Install the required dependencies:

<Tabs>
  <Tab title="TypeScript">`bash npm install @solana/web3.js `</Tab>
  <Tab title="Python">`bash pip install solders solana `</Tab>
</Tabs>

## 1. Create the SOL transfer transaction

Create a SOL transfer transaction using your preferred language:

<View title="TypeScript" icon="terminal">
  ```typescript  theme={"system"}
  import {Connection, PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL} from '@solana/web3.js';

  const createSOLTransferTransaction = async (
    fromAddress: string,
    toAddress: string,
    amount: number // Amount in SOL
  ) => {
    // Set up connection to Solana network
    const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

    // Create public key objects
    const fromPubkey = new PublicKey(fromAddress);
    const toPubkey = new PublicKey(toAddress);

    // Convert SOL to lamports (1 SOL = 1,000,000,000 lamports)
    const lamports = amount * LAMPORTS_PER_SOL;

    // Create transfer instruction
    const transferInstruction = SystemProgram.transfer({
      fromPubkey,
      toPubkey,
      lamports
    });

    // Create transaction and add instruction
    const transaction = new Transaction().add(transferInstruction);

    // Get recent blockhash
    const {blockhash} = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = fromPubkey;

    return {transaction, connection};
  };
  ```
</View>

<View title="Python" icon="python">
  ```python  theme={"system"}
  import base64
  from solana.rpc.api import Client
  from solders.pubkey import Pubkey
  from solders.system_program import TransferParams, transfer
  from solders.transaction import Transaction

  def create_sol_transfer_transaction(
      from_address: str,
      to_address: str,
      amount: float,  # Amount in SOL
      rpc_url: str = "https://api.devnet.solana.com",
  ) -> dict:
      from_pubkey = Pubkey.from_string(from_address)
      to_pubkey = Pubkey.from_string(to_address)

      client = Client(rpc_url)

      lamports = int(amount * 1_000_000_000)

      transfer_instruction = transfer(
          TransferParams(
              from_pubkey=from_pubkey, to_pubkey=to_pubkey, lamports=lamports
          )
      )

      blockhash_resp = client.get_latest_blockhash()
      recent_blockhash = blockhash_resp.value.blockhash

      transaction = Transaction(
          instructions=[transfer_instruction],
          recent_blockhash=recent_blockhash,
          fee_payer=from_pubkey,
      )

      # Serialize and encode the transaction to base64
      serialized_tx = base64.b64encode(transaction.serialize()).decode('utf-8')

      return {"transaction": serialized_tx}
  ```
</View>

## 2. Send the transaction

You can send the transaction using Privy's different SDKs. Below are examples for React, React Native, NodeJS, and Python:

<View title="React" icon="react">
  ```typescript {skip-check} theme={"system"}
  import {useSignAndSendTransaction, useWallets} from '@privy-io/react-auth/solana';

  const {wallets} = useWallets();
  const {signAndSendTransaction} = useSignAndSendTransaction();

  const {transaction, connection} = await createSOLTransferTransaction(
    wallets[0].address, // fromAddress
    'recipient-wallet-address', // toAddress
    0.01 // amount in SOL
  );

  // Assuming you have a transaction created from the previous step
  const signature = await signAndSendTransaction({
    transaction.serialize(), // from createSOLTransferTransaction
    wallet: wallets[0]
  });
  ```
</View>

<View title="React Native" icon="react">
  ```typescript {skip-check} theme={"system"}
  import {useEmbeddedSolanaWallet} from '@privy-io/expo';

  const {wallets} = useEmbeddedSolanaWallet();
  const wallet = wallets[0];
  const provider = await wallet.getProvider();

  const {transaction, connection} = await createSOLTransferTransaction(
    wallet.address, // fromAddress
    'recipient-wallet-address', // toAddress
    0.01 // amount in SOL
  );

  // Send transaction using the provider's request method
  const {signature} = await provider.request({
    method: 'signAndSendTransaction',
    params: {
      transaction: transaction, // from createSOLTransferTransaction
      connection: connection // from createSOLTransferTransaction
    }
  });
  ```
</View>

<View title="NodeJS" icon="node-js">
  ```typescript {skip-check} theme={"system"}
  import {PrivyClient} from '@privy-io/node';

  const privy = new PrivyClient({
    appId: process.env.PRIVY_APP_ID!,
    appSecret: process.env.PRIVY_APP_SECRET!
  });

  const {transaction} = await createSOLTransferTransaction(
    'insert-wallet-address', // fromAddress
    'recipient-wallet-address', // toAddress
    0.01 // amount in SOL
  );

  // Send transaction using Privy API
  const response = await privy
    .wallets()
    .solana()
    .signAndSendTransaction('insert-wallet-id', {
      // Devnet's caip2
      caip2: 'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1',
      // from createSOLTransferTransaction
      transaction: Buffer.from(transaction.serialize()).toString('base64')
    });
  ```
</View>

<View title="NodeJS (server-auth)" icon="node-js">
  <Warning>
    The `@privy-io/server-auth` library is deprecated. We recommend integrating `@privy-io/node` for
    the latest features and support.
  </Warning>

  ```typescript {skip-check} theme={"system"}
  import {PrivyClient} from '@privy-io/server-auth';

  const privy = new PrivyClient(process.env.PRIVY_APP_ID!, process.env.PRIVY_APP_SECRET!);

  const {transaction} = await createSOLTransferTransaction(
    'insert-wallet-address', // fromAddress
    'recipient-wallet-address', // toAddress
    0.01 // amount in SOL
  );

  // Send transaction using Privy API
  const response = await privy.walletApi.solana.signAndSendTransaction({
    walletId: 'insert-wallet-id',
    address: 'insert-wallet-address',
    caip2: 'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1', // Devnet's caip2
    transaction: transaction // from createSOLTransferTransaction
  });
  ```
</View>

<View title="Python" icon="python">
  ```python  theme={"system"}
  from privy import PrivyClient

  client = PrivyClient(
      app_id="your-app-id",
      app_secret="your-app-secret"
  )

  base_64_encoded_transaction = create_sol_transfer_transaction(
      from_address="insert-wallet-address",  # fromAddress
      to_address="recipient-wallet-address",  # toAddress
      amount=0.01  # amount in SOL
  )["transaction"]

  # Send transaction using Privy API
  tx_response = client.wallets.rpc(
      wallet_id="insert-wallet-id",
      method="signAndSendTransaction",
      params={
          "transaction": "insert-base-64-encoded-serialized-transaction",
          "encoding": "base64",
      }
  )
  ```
</View>

You've successfully sent SOL!

## Next steps

Now that you can send SOL, you might want to explore:

* [Sending SPL tokens](/recipes/solana/send-spl-tokens) - Learn how to send other tokens on Solana
* [Web3 integrations](/wallets/using-wallets/solana/web3-integrations) - Advanced integration patterns with Solana libraries
\n