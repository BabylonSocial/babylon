> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Integrating Kamino with Privy

Kamino Earn vaults enable users to generate yield on their Solana assets. This guide walks through setting up backend developer-owned wallets using [NodeJS](/basics/nodeJS/quickstart) and building and sending a Solana transaction that deposits funds into a Kamino Earn vault.

## Deposit flow

<Steps>
  <Step title="1. Import dependencies, configure Privy, and initialize clients">
    Import the required packages for Privy client, Solana RPC communication, and Kamino SDK operations. Set up your Privy credentials and initialize the Privy client and RPC connection.

    ```typescript  theme={"system"}
    import {PrivyClient} from '@privy-io/node';
    import {
      createSolanaRpc,
      address,
      pipe,
      createTransactionMessage,
      setTransactionMessageFeePayerSigner,
      setTransactionMessageLifetimeUsingBlockhash,
      appendTransactionMessageInstructions,
      createNoopSigner,
      getBase64EncodedWireTransaction,
      compileTransaction
    } from '@solana/kit';
    import {KaminoVault} from '@kamino-finance/klend-sdk';
    import {Decimal} from 'decimal.js';

    const PRIVY_APP_ID = 'put-your-privy-app-id-here';
    const PRIVY_APP_SECRET = 'put-your-privy-app-secret-here';
    const RPC_ENDPOINT = 'https://api.mainnet-beta.solana.com';
    const VAULT_ADDRESS = 'put-your-vault-address-here';
    const AUTH_KEY_ID = 'put-your-auth-key-id-here';
    const AUTH_KEY_PRIVATE = 'put-your-auth-key-private-here';
    const USER_EMAIL = 'put-your-email-here';

    const privy = new PrivyClient({
      appId: PRIVY_APP_ID,
      appSecret: PRIVY_APP_SECRET
    });

    const rpc = createSolanaRpc(RPC_ENDPOINT);
    ```
  </Step>

  <Step title="2. Create a Privy user and Solana wallet">
    Create a Privy user, generate a Solana wallet linked to the user, and set your authorization key as the wallet owner. We recommend funding the wallet with SOL and the tokens you will lend (likely USDC) so that your wallet can submit transactions successfully.

    ```typescript {skip-check} theme={"system"}
    await privy.users().create({
      linked_accounts: [{type: 'email', address: USER_EMAIL}]
    });

    const {id: walletId, address: walletAddress} = await privy.wallets().create({
      chain_type: 'solana',
      owner_id: AUTH_KEY_ID
    });
    ```
  </Step>

  <Step title="3. Build Kamino Earn deposit instructions and transaction message">
    Initialize the vault and generate deposit instructions using a noop signer. A noop signer is used to build instructions without requiring the actual private key. Privy will handle signing later. Additionally fetch the latest blockhash and construct the transaction message.

    ```typescript {skip-check} theme={"system"}
    const vault = new KaminoVault(rpc, address(VAULT_ADDRESS));
    await vault.getState();

    const noopSigner = createNoopSigner(address(walletAddress));
    const bundle = await vault.depositIxs(noopSigner, new Decimal(1.0));
    const instructions = [...(bundle.depositIxs || [])];

    if (!instructions.length) throw new Error('No instructions returned');

    const {value: latestBlockhash} = await rpc.getLatestBlockhash().send();

    const depositTransactionMessage = pipe(
      createTransactionMessage({version: 0}),
      (tx) => setTransactionMessageFeePayerSigner(noopSigner, tx),
      (tx) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
      (tx) => appendTransactionMessageInstructions(instructions, tx)
    );
    ```
  </Step>

  <Step title="4. Sign the transaction with Privy">
    Compile the transaction, serialize it, and sign using Privy’s wallet API. Privy handles the signing securely using the embedded wallet. The private key never leaves Privy’s infrastructure.

    ```typescript {skip-check} theme={"system"}
    const compiledTransaction = compileTransaction(depositTransactionMessage);
    const serializedTx = getBase64EncodedWireTransaction(compiledTransaction);

    const signResponse = await privy
      .wallets()
      .solana()
      .signTransaction(walletId, {
        transaction: serializedTx,
        authorization_context: {
          authorization_private_keys: [AUTH_KEY_PRIVATE]
        }
      });
    ```
  </Step>

  <Step title="5. Send the transaction">
    Submit the signed transaction to the Solana network.

    ```typescript {skip-check} theme={"system"}
    const signature = await rpc
      .sendTransaction(signResponse.signed_transaction as any, {
        encoding: 'base64',
        skipPreflight: true
      })
      .send();

    console.log('Deposit successful! Signature:', signature);
    ```

    <Check>
      Your deposit is complete! The user’s funds are now deposited in the Kamino Earn vault using their
      Privy embedded wallet.
    </Check>
  </Step>
</Steps>

## Additional resources

<CardGroup cols={2}>
  <Card title="Kamino Developer Docs" icon="arrow-up-right-from-square" href="https://docs.kamino.finance/" arrow>
    Official documentation for Kamino protocol.
  </Card>

  <Card title="Privy Solana wallets" icon="wallet" href="/wallets/wallets/create/create-a-wallet#solana" arrow>
    Configure embedded Solana wallets for users.
  </Card>
</CardGroup>
\n