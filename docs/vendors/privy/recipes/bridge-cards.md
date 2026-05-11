> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Issuing debit cards with Bridge

> How to issue debit cards that spend stablecoins from non-custodial wallets using Bridge Cards

Bridge Cards lets your app issue debit cards that spend stablecoins directly from a non-custodial wallet. When a cardholder makes a purchase, Bridge pulls funds from the linked wallet via an onchain approval.

Before starting, set up a Bridge account and create Bridge customers by following the [Bridge onramp and offramp recipe](/recipes/bridge-onramp).

This recipe covers:

1. Provisioning a card account
2. Setting up a token approval
3. Handling card transaction webhooks

<CardGroup cols={2}>
  <Card title="Setting up a Bridge account with Privy" icon="book" href="/recipes/bridge-onramp" arrow>
    Set up Bridge onramp and offramp flows with Privy.
  </Card>

  <Card title="Bridge Cards documentation" icon="arrow-up-right-from-square" href="https://apidocs.bridge.xyz/platform/cards/overview/noncustodial" arrow>
    Official Bridge documentation for non-custodial card issuance.
  </Card>
</CardGroup>

## Supported chains

Bridge supports the following chains for non-custodial card funding:

| Chain       | Contract address                                                                                                                                     |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Solana      | [`cardWArqhdV5jeRXXjUti7cHAa4mj41Nj3Apc6RPZH2`](https://solscan.io/account/cardWArqhdV5jeRXXjUti7cHAa4mj41Nj3Apc6RPZH2?instruction=92e77d98f81fb8b1) |
| World Chain | [`0x6B0D105999491a48d5793FB6Cb54f5cE079E0da9`](https://worldscan.org/address/0x6b0d105999491a48d5793fb6cb54f5ce079e0da9)                             |

# Provision a card account

Your app provisions a card account by sending a `POST` request to [`/customers/{customerID}/card_accounts`](https://apidocs.bridge.xyz/api-reference/cards/provision-a-card-account#body-crypto-account-address). Specify the wallet address, stablecoin, and set `crypto_account` type to `standard` for a non-custodial wallet.

Include an `Api-Key` header for authentication and an `Idempotency-Key` header.

<Warning>
  A wallet can only be tied to one card account. Bridge does not support issuing multiple cards that
  spend from the same wallet.
</Warning>

<Tabs>
  <Tab title="Solana">
    <Warning>
      For Solana, do not specify the [associated token account](https://solana.com/docs/tokens/basics/create-token-account)
      address. Bridge automatically derives it from the owner address and currency. For example, if the
      account owner address is `BDkZQv1DqS7RJG5MZjVEP8FbN9Xvpf5b67kpi3765rQb`, Bridge derives the
      USDC token account `GXaRe925ejuzX3KZdtLPJ8fpnudzhdk9eXDxNSEdro49` automatically.
    </Warning>

    ```bash  theme={"system"}
    curl -X POST https://api.bridge.xyz/v0/customers/{customerID}/card_accounts \
      -H "Api-Key: <API_KEY>" \
      -H "Idempotency-Key: <UNIQUE_KEY>" \
      -H "Content-Type: application/json" \
      -d '{
        "chain": "solana",
        "currency": "usdc",
        "crypto_account": {
          "type": "standard",
          "address": "BDkZQv1DqS7RJG5MZjVEP8FbN9Xvpf5b67kpi3765rQb"
        }
      }'
    ```
  </Tab>

  <Tab title="EVM">
    ```bash  theme={"system"}
    curl -X POST https://api.bridge.xyz/v0/customers/{customerID}/card_accounts \
      -H "Api-Key: <API_KEY>" \
      -H "Idempotency-Key: <UNIQUE_KEY>" \
      -H "Content-Type: application/json" \
      -d '{
        "chain": "world_chain",
        "currency": "usdc",
        "crypto_account": {
          "type": "standard",
          "address": "0xC37e5d75F3D212D22e943D8DD93849a17F79dc79"
        }
      }'
    ```
  </Tab>
</Tabs>

On Solana, Bridge submits an onchain transaction to register the program delegate address for the specified `crypto_account` address after creating the card account.

<Info>
  Provision the card account before setting up the token approval. This ensures Bridge ties the
  address to the customer before your app submits any approvals onchain.
</Info>

# Set up token approval

After provisioning the card account, the wallet must approve Bridge's smart contract to pull funds during card transactions. Bridge provides a consolidated version of the Solana delegate approval logic in a [GitHub Gist](https://gist.github.com/lvn/dd41a7233f63f1c45b4ec25c220ecff6).

<Tabs>
  <Tab title="Solana">
    ## Set up the connection and transaction

    Initialize a connection and a new transaction to contain the approval instructions.

    ```typescript  theme={"system"}
    import {Connection, Transaction, PublicKey, clusterApiUrl} from '@solana/web3.js';
    import {
      getAssociatedTokenAddressSync,
      getAccount,
      createAssociatedTokenAccountInstruction,
      createApproveInstruction,
      TOKEN_PROGRAM_ID
    } from '@solana/spl-token';

    const connection = new Connection(clusterApiUrl('mainnet-beta'), 'confirmed');
    const transaction = new Transaction();

    const walletAddress = new PublicKey('BDkZQv1DqS7RJG5MZjVEP8FbN9Xvpf5b67kpi3765rQb');
    ```

    ## Set up the ATA

    Check whether the associated token account (ATA) exists for the wallet. If it does not,
    add an instruction to the transaction to create it.

    ```typescript  theme={"system"}
    const MINT_PUBKEY = new PublicKey(
      'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' // USDC on Solana
    );

    const userAta = getAssociatedTokenAddressSync(
      MINT_PUBKEY,
      walletAddress,
      false,
      TOKEN_PROGRAM_ID // use TOKEN_2022_PROGRAM_ID if the currency requires it
    );

    try {
      await getAccount(connection, userAta, undefined, TOKEN_PROGRAM_ID);
    } catch {
      transaction.add(
        createAssociatedTokenAccountInstruction(
          walletAddress,
          userAta,
          walletAddress,
          MINT_PUBKEY,
          TOKEN_PROGRAM_ID
        )
      );
    }
    ```

    ## Set up the delegate approval

    Add an instruction that approves Bridge's card program to spend from the ATA. Bridge
    assigns the `MERCHANT_ID` to your developer account during onboarding.

    ```typescript  theme={"system"}
    const PROGRAM_ID = new PublicKey('cardWArqhdV5jeRXXjUti7cHAa4mj41Nj3Apc6RPZH2');
    const MINT_DECIMALS = 6;
    const APPROVAL_AMOUNT = BigInt(100 * 10 ** MINT_DECIMALS); // Approve $100

    const bridgeSdk = new BridgeSDK(PROGRAM_ID);
    const [delegatePda] = bridgeSdk.findUserDelegatePDA(MERCHANT_ID, MINT_PUBKEY, userAta);

    transaction.add(
      createApproveInstruction(userAta, delegatePda, walletAddress, APPROVAL_AMOUNT, [], TOKEN_PROGRAM_ID)
    );
    ```

    ## Send the transaction

    Submit the transaction using Privy. Pass `sponsor: true` to enable
    [Solana gas sponsorship](/wallets/gas-and-asset-management/gas/solana), which handles the fee
    payer and recent blockhash automatically.

    <View title="React" icon="react">
      Use the [`useSignAndSendTransaction`](/wallets/using-wallets/solana/send-a-transaction) hook
      to sign and broadcast the transaction from the user's embedded wallet:

      ```tsx  theme={"system"}
      import {useWallets, useSignAndSendTransaction} from '@privy-io/react-auth/solana';

      function ApproveButton() {
        const {wallets} = useWallets();
        const {signAndSendTransaction} = useSignAndSendTransaction();

        async function handleApprove() {
          const wallet = wallets[0];

          const {signature} = await signAndSendTransaction({
            transaction: transaction.serialize({requireAllSignatures: false}),
            wallet,
            options: {
              sponsor: true,
            },
          });

          console.log('Approval tx:', Buffer.from(signature).toString('base64'));
        }

        return <button onClick={handleApprove}>Approve card spending</button>;
      }
      ```
    </View>

    <View title="NodeJS" icon="node-js">
      Use the [Wallet API](/wallets/using-wallets/solana/send-a-transaction) to sign and send the
      transaction server-side:

      ```typescript  theme={"system"}
      import {PrivyClient} from '@privy-io/node';

      const client = new PrivyClient({
        appId: PRIVY_APP_ID,
        appSecret: PRIVY_APP_SECRET,
      });

      const {hash} = await client.wallets().solana.signAndSendTransaction('WALLET_ID', {
        transaction: transaction.serialize({requireAllSignatures: false}),
        caip2: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp', // Solana mainnet
        sponsor: true,
      });

      console.log('Approval tx:', hash);
      ```
    </View>

    The result is a delegate approval resembling [this transaction](https://solscan.io/tx/5o1aAuCFpmB9sEt1djX9PDENGmkNEitUYoqg93a9JLdvQ1pZbFX5ChkVFULq38aArBCg9sQTREQt9fTFr1puPJ1H).
  </Tab>

  <Tab title="EVM">
    Submit a standard ERC-20 `approve` call to allow the Bridge issuer contract to spend from the
    wallet.

    <Warning>
      The card issuer contract address is specific to your developer account and differs from the main
      contract listed in the chain table above. Bridge provides this address during onboarding.
    </Warning>

    ## Build the approval transaction

    Encode the ERC-20 `approve` calldata for the Bridge issuer contract:

    ```typescript  theme={"system"}
    import {encodeFunctionData, parseUnits} from 'viem';

    const TOKEN_ADDRESS = '0x...'; // ERC-20 stablecoin address (e.g., USDC)
    const ISSUER_ADDRESS = '0x...'; // Developer-specific contract from Bridge

    const approveData = encodeFunctionData({
      abi: [{name: 'approve', type: 'function', inputs: [{name: 'spender', type: 'address'}, {name: 'amount', type: 'uint256'}], outputs: [{type: 'bool'}]}],
      functionName: 'approve',
      args: [ISSUER_ADDRESS, parseUnits('100', 6)], // Approve $100 USDC
    });
    ```

    ## Send the transaction

    <View title="React" icon="react">
      Use the [`useSendTransaction`](/wallets/using-wallets/ethereum/send-a-transaction) hook to
      send the approval from the user's embedded wallet:

      ```tsx  theme={"system"}
      import {useSendTransaction} from '@privy-io/react-auth';
      import {worldchain} from 'viem/chains';

      function ApproveButton() {
        const {sendTransaction} = useSendTransaction();

        async function handleApprove() {
          const {hash} = await sendTransaction({
            to: TOKEN_ADDRESS,
            data: approveData,
            chainId: worldchain.id,
          });

          console.log('Approval tx:', hash);
        }

        return <button onClick={handleApprove}>Approve card spending</button>;
      }
      ```
    </View>

    <View title="NodeJS" icon="node-js">
      Use the [Wallet API](/wallets/using-wallets/ethereum/send-a-transaction) to send the
      transaction server-side:

      ```typescript  theme={"system"}
      import {PrivyClient} from '@privy-io/node';

      const client = new PrivyClient({
        appId: PRIVY_APP_ID,
        appSecret: PRIVY_APP_SECRET,
      });

      const {hash} = await client.wallets().ethereum.sendTransaction('WALLET_ID', {
        caip2: 'eip155:480', // World Chain
        transaction: {
          to: TOKEN_ADDRESS,
          data: approveData,
        },
      });

      console.log('Approval tx:', hash);
      ```
    </View>

    The result is a transaction resembling [this transaction](https://worldscan.org/tx/0xd5a24c25cefd7fa414f109dae95e544c9f18697fba603c45b758e5c51fdb7b33).
  </Tab>
</Tabs>

# Handle card transaction webhooks

The card is now ready to use. When a cardholder makes a purchase, Bridge publishes webhook events for both the card network authorization and the onchain transaction.

Bridge submits transactions onchain at the time of card authorization, but they complete asynchronously. This results in two webhook events:

### `card_transaction.created`

Bridge publishes this event when the card authorization occurs. It contains the authorization details but not yet the onchain transaction:

<Tabs>
  <Tab title="Solana">
    ```json  theme={"system"}
    {
      "event_type": "card_transaction.created",
      "event_object_status": "approved",
      "event_object": {
        "id": "86d30f38-5ea0-402d-ad48-48003d3b3f29",
        "amount": "-10.0",
        "status": "approved",
        "category": "purchase",
        "currency": "usd",
        "customer_id": "2c21ddbb-cf34-4170-b9b2-076a3ed55de9",
        "merchant_name": "BRIDGE CAFE, SAN FRANCISCO, CA",
        "card_account_id": "3d698985-fbd4-4889-999a-4fa7bd578452",
        "authorization_infos": [
          {
            "amount": "-10.0",
            "network": "visa",
            "approval_status": "approved"
          }
        ]
      }
    }
    ```
  </Tab>

  <Tab title="EVM">
    ```json  theme={"system"}
    {
      "event_type": "card_transaction.created",
      "event_object_status": "approved",
      "event_object": {
        "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "amount": "-10.0",
        "status": "approved",
        "category": "purchase",
        "currency": "usd",
        "customer_id": "2c21ddbb-cf34-4170-b9b2-076a3ed55de9",
        "merchant_name": "BRIDGE CAFE, SAN FRANCISCO, CA",
        "card_account_id": "4e789012-abc3-4567-890d-ef1234567890",
        "authorization_infos": [
          {
            "amount": "-10.0",
            "network": "visa",
            "approval_status": "approved"
          }
        ]
      }
    }
    ```
  </Tab>
</Tabs>

### `card_transaction.updated`

Bridge publishes this event seconds later when the onchain transaction confirms. It includes `crypto_details` with the chain, amount, and transaction hash:

<Tabs>
  <Tab title="Solana">
    ```json  theme={"system"}
    {
      "event_type": "card_transaction.updated",
      "event_object": {
        "id": "86d30f38-5ea0-402d-ad48-48003d3b3f29",
        "amount": "-10.0",
        "status": "approved",
        "authorization_infos": [
          {
            "amount": "-10.0",
            "crypto_details": {
              "chain": "solana",
              "amount": "10.0",
              "tx_hash": "618p4RWZ4UPe6uCeFo0BaRb2H4gSQJjLayDihFD7fERAnfyoxyMJQZc4WmKkPkLu7QHnXgpWp6pPUMqc2HzGqH3",
              "currency": "usdc"
            },
            "approval_status": "approved"
          }
        ]
      }
    }
    ```
  </Tab>

  <Tab title="EVM">
    ```json  theme={"system"}
    {
      "event_type": "card_transaction.updated",
      "event_object": {
        "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "amount": "-10.0",
        "status": "approved",
        "authorization_infos": [
          {
            "amount": "-10.0",
            "crypto_details": {
              "chain": "world_chain",
              "amount": "10.0",
              "tx_hash": "0x3a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef12345678",
              "currency": "usdc"
            },
            "approval_status": "approved"
          }
        ]
      }
    }
    ```
  </Tab>
</Tabs>

<Info>
  Bridge rejects an authorization if the onchain approval is inactive, the approved amount is
  insufficient, or the wallet lacks funds. Incremental authorizations trigger additional onchain
  transactions to cover the extra charge.
</Info>

For the full list of webhook scenarios, see the [Bridge card transaction webhooks documentation](https://apidocs.bridge.xyz/platform/cards/overview/webhooks#card-transaction-webhooks).
\n