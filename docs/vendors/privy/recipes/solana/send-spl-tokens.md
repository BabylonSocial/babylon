> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Sending SPL tokens

Sending SPL tokens is a common transaction on the Solana blockchain. This recipe walks you through creating and sending SPL token transfer transactions using `@solana/spl-token` and `@solana/web3.js` with Privy wallets. In this example, we'll use USDC as the SPL token, but you can adapt it for any SPL token by changing the mint address and decimals.

<Info>
  Before following this recipe, make sure you have [configured Privy for
  Solana](/recipes/solana/getting-started-with-privy-and-solana) in your app.
</Info>

## Overview

This recipe demonstrates how to:

* Create an SPL token transfer transaction using `@solana/spl-token`
* Handle token accounts and decimals properly
* Sign and send the transaction using Privy wallets

## Prerequisites

Install the required dependencies:

<Tabs>
  <Tab title="TypeScript">`bash npm install @solana/web3.js @solana/spl-token `</Tab>
  <Tab title="Python">`bash pip install solders solana spl-token `</Tab>
</Tabs>

## 1. Create the SPL token transfer transaction

Create an SPL token transfer transaction using your preferred language:

<View title="TypeScript" icon="terminal">
  ```typescript  theme={"system"}
  import {Connection, PublicKey, Transaction} from '@solana/web3.js';
  import {getAssociatedTokenAddress, createTransferInstruction} from '@solana/spl-token';

  const createSPLTransferTransaction = async (
    fromAddress: string,
    toAddress: string,
    tokenMintAddress: string,
    amount: number,
    decimals: number = 6 // Default for USDC, adjust for your token
  ) => {
    // Set up connection to Solana network
    const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');

    // Create public key objects
    const fromPubkey = new PublicKey(fromAddress);
    const toPubkey = new PublicKey(toAddress);
    const mintPubkey = new PublicKey(tokenMintAddress);

    // Get associated token accounts
    const fromTokenAccount = await getAssociatedTokenAddress(mintPubkey, fromPubkey);

    const toTokenAccount = await getAssociatedTokenAddress(mintPubkey, toPubkey);

    // Convert amount to token units (considering decimals)
    const tokenAmount = amount * Math.pow(10, decimals);

    // Create transfer instruction
    const transferInstruction = createTransferInstruction(
      fromTokenAccount,
      toTokenAccount,
      fromPubkey,
      tokenAmount
    );

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
  from solders.transaction import Transaction
  from solders.hash import Hash
  from spl.token.constants import TOKEN_PROGRAM_ID
  from spl.token.instructions import transfer, TransferParams
  from spl.token.client import get_associated_token_address

  def create_spl_transfer_transaction(
      from_address: str,
      to_address: str,
      token_mint_address: str,
      amount: float,
      decimals: int,
      rpc_url: str = "https://api.mainnet-beta.solana.com",
  ) -> dict:
      from_pubkey = Pubkey.from_string(from_address)
      to_pubkey = Pubkey.from_string(to_address)
      mint_pubkey = Pubkey.from_string(token_mint_address)

      client = Client(rpc_url)

      from_token_account = get_associated_token_address(from_pubkey, mint_pubkey)
      to_token_account = get_associated_token_address(to_pubkey, mint_pubkey)

      token_amount = int(amount * (10**decimals))

      transfer_instruction = transfer(
          TransferParams(
              program_id=TOKEN_PROGRAM_ID,
              source=from_token_account,
              dest=to_token_account,
              owner=from_pubkey,
              amount=token_amount,
              signers=[],
          )
      )

      blockhash_resp = client.get_latest_blockhash()
      recent_blockhash = blockhash_resp.value.blockhash

      transaction = Transaction(
          instructions=[transfer_instruction],
          recent_blockhash=recent_blockhash,
          fee_payer=from_pubkey,
      )

      # Serialize transaction to base64
      serialized_tx = base64.b64encode(transaction.serialize()).decode("utf-8")

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

  const {transaction, connection} = await createSPLTransferTransaction(
    wallets[0].address,
    'recipient-wallet-address', // Replace with recipient's token account address
    'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC mint address
    10 // Amount to send
  );

  // Assuming you have a transaction created from the previous step
  const signature = await sendTransaction({
    transaction.serialize(), // from createSPLTransferTransaction
    wallet: wallets[0],
  });
  ```
</View>

<View title="React Native" icon="react">
  ```typescript {skip-check} theme={"system"}
  import {useEmbeddedSolanaWallet} from '@privy-io/expo';

  const {wallets} = useEmbeddedSolanaWallet();
  const wallet = wallets[0];
  const provider = await wallet.getProvider();

  const {transaction, connection} = await createSPLTransferTransaction(
    wallet.address,
    'recipient-wallet-address', // Replace with recipient's token account address
    'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC mint address
    10 // Amount to send
  );

  // Send transaction using the provider's request method
  const {signature} = await provider.request({
    method: 'signAndSendTransaction',
    params: {
      transaction: transaction,
      connection: connection // from createSPLTransferTransaction
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

  const {transaction} = await createSPLTransferTransaction(
    'insert-wallet-address',
    'recipient-wallet-address', // Replace with recipient's token account address
    'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC mint address
    10 // Amount to send
  );

  // Send transaction using Privy API
  const response = await privy
    .wallets()
    .solana()
    .signAndSendTransaction('insert-wallet-id', {
      // Mainnet's caip2
      caip2: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
      // from createSPLTransferTransaction
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

  const {transaction} = await createSPLTransferTransaction(
    'insert-wallet-address',
    'recipient-wallet-address', // Replace with recipient's token account address
    'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC mint address
    10 // Amount to send
  );

  // Send transaction using Privy API
  const response = await privy.walletApi.solana.signAndSendTransaction({
    walletId: 'insert-wallet-id',
    address: 'insert-wallet-address',
    caip2: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp', // Mainnet's caip2
    transaction: transaction
  });
  ```
</View>

<View title="Python" icon="python">
  ```python  theme={"system"}
  from privy import PrivyAPI

  client = PrivyAPI(
      app_id="insert-your-app-id",
      app_secret="insert-your-app-secret"
  )

  base_64_encoded_transaction = create_spl_transfer_transaction(
      "insert-wallet-address",
      "recipient-wallet-address",  # Replace with recipient's token account address
      "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",  # USDC mint address
      10  # Amount to send
  )["transaction"]

  # Send transaction using Privy API
  tx_response = client.wallets.rpc(
      wallet_id="insert-wallet-id",
      method="signAndSendTransaction",
      params={
          "transaction": base_64_encoded_transaction,
          "encoding": "base64",
      }
  )
  ```
</View>

You've successfully sent SPL tokens!

## Token account considerations

<Warning>
  Before sending SPL tokens, ensure that the recipient has a token account for the specific token
  mint.
</Warning>

### Getting token account information

You can check if token accounts exist and get their addresses:

```typescript  theme={"system"}
import {Connection, PublicKey} from '@solana/web3.js';
import {getAssociatedTokenAddress} from '@solana/spl-token';

const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');

// Check if token account exists
const tokenAccountAddress = await getAssociatedTokenAddress(
  new PublicKey('tokenMintAddress'),
  new PublicKey('walletAddress')
);

const accountInfo = await connection.getAccountInfo(tokenAccountAddress);
const accountExists = accountInfo !== null;
```

Token mint addresses are different on each network, so make sure you're using the correct addresses for your target environment.

## Next steps

Now that you can send SPL tokens, you might want to explore:

* [Sending SOL](/recipes/solana/send-sol) - Learn how to send native SOL tokens
* [Web3 integrations](/wallets/using-wallets/solana/web3-integrations) - Advanced integration patterns with Solana libraries
\n