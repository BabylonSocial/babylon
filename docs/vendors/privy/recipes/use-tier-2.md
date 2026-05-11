> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Using chains with Tier 2 support

> Build an integration with Privy wallets on chains such as Tron, Sui, etc.

<Info>
  This guide covers integration with chains that have Tier 2 support. For a complete list of
  supported chains, refer to the [chains overview](/wallets/overview/chains).
</Info>

To integrate Privy with chains that have Tier 2 support (e.g., Sui, Tron), follow these steps:

1. [Create a wallet](/wallets/wallets/create/create-a-wallet) with the appropriate chain type specified.
2. Utilize Privy's ["raw sign"](/wallets/using-wallets/other-chains) functionality to sign transaction hashes or message hashes.

# Full example

Below is a complete example of how to create a wallet, build a transaction, sign it with Privy's `rawSign` and broadcast it onchain. We use **Aptos** here, but the pattern is the same for all Tier 2 chains.

<Steps>
  <Step title="Create a wallet">
    ```typescript  theme={"system"}
    import {PrivyClient} from '@privy-io/node';

    const privy = new PrivyClient({
      appId: process.env.PRIVY_APP_ID,
      appSecret: process.env.PRIVY_APP_SECRET
    });

    // Create an Aptos wallet for a user
    const wallet = await privy.wallets().create({
      user_id: 'your-user-id',
      chain_type: 'aptos'
    });

    console.log('Wallet ID:', wallet.id);
    console.log('Wallet Address:', wallet.address);
    console.log('Public Key:', wallet.public_key);
    ```
  </Step>

  <Step title="Build the transaction">
    ```typescript  theme={"system"}
    import {
      Aptos,
      AptosConfig,
      Network,
      AccountAddress,
      generateSigningMessageForTransaction
    } from '@aptos-labs/ts-sdk';

    // Connect to Aptos network
    const aptos = new Aptos(
      new AptosConfig({
        network: Network.MAINNET
      })
    );

    const address = AccountAddress.from(wallet.address);

    // Build a transaction (e.g., transfer APT tokens)
    const transaction = await aptos.transaction.build.simple({
      sender: address,
      data: {
        function: '0x1::coin::transfer',
        typeArguments: ['0x1::aptos_coin::AptosCoin'],
        functionArguments: [
          '0xRecipientAddress...', // recipient
          100000000 // amount in Octas (0.1 APT)
        ]
      }
    });

    // Generate the message that needs to be signed
    const message = generateSigningMessageForTransaction(transaction);
    ```
  </Step>

  <Step title="Sign with Privy">
    ```typescript  theme={"system"}
    import {toHex} from 'viem';

    // Sign the transaction using Privy's raw sign endpoint
    const signatureResponse = await privy.wallets().rawSign(wallet.id, {
      params: {
        hash: toHex(message)
      }
    });

    const signature = signatureResponse as unknown as string;
    console.log('Signature:', signature);
    ```
  </Step>

  <Step title="Broadcast the transaction">
    ```typescript  theme={"system"}
    import {
      AccountAuthenticatorEd25519,
      Ed25519PublicKey,
      Ed25519Signature
    } from '@aptos-labs/ts-sdk';

    // Create the authenticator with public key and signature
    const authenticator = new AccountAuthenticatorEd25519(
      new Ed25519PublicKey(wallet.public_key),
      new Ed25519Signature(signature.slice(2))
    );

    // Submit the transaction
    const pendingTransaction = await aptos.transaction.submit.simple({
      transaction,
      senderAuthenticator: authenticator
    });

    // Wait for confirmation
    const executedTransaction = await aptos.waitForTransaction({
      transactionHash: pendingTransaction.hash
    });

    console.log('Transaction hash:', executedTransaction.hash);
    console.log('Transaction status:', executedTransaction.success);
    ```
  </Step>
</Steps>

# Chain specific implementation examples

Note that the "raw sign" functionality signs the provided hash directly without any additional byte manipulation. Ensure that your hash includes any required prefixes or suffixes before signing.

## Stellar

Stellar implements the EdDSA signing algorithm using the Ed25519 curve. The following example demonstrates hash signing for Stellar transactions:

<Expandable title="Code example">
  ```typescript  theme={"system"}
  import {Keypair} from '@stellar/stellar-sdk';

  // Initialize with the wallet's Stellar address
  const address = "<the wallet's stellar address>";
  const keypair = Keypair.fromPublicKey(address);

  // Prepare the hash for signing
  const hash = '0x6503b027a625549f7be691646404f275f149d17a119a6804b855bac3030037aa';

  // Obtain the raw signature from Privy's raw_sign endpoint
  const rawSignature = '...'; // call privy raw_sign on `hash`

  // Verify the signature
  const hashBytes = Buffer.from(hash.slice(2), 'hex');
  const signatureBytes = Buffer.from(rawSignature.slice(2), 'hex');
  const verified = keypair.verify(hashBytes, signatureBytes);
  console.log(verified); // true
  ```
</Expandable>

## Cosmos

Cosmos utilizes the ECDSA signing algorithm with the secp256k1 curve. Below is an implementation example for signing hashes on Cosmos:

<Expandable title="Code example">
  ```typescript  theme={"system"}
  import {Secp256k1, Secp256k1Signature} from '@cosmjs/crypto';

  // Prepare the hash for signing
  const hash = '0x6503b027a625549f7be691646404f275f149d17a119a6804b855bac3030037aa';

  // Obtain the raw signature from Privy's raw_sign endpoint
  const rawSignature = '...'; // call privy raw_sign on `hash`

  // Retrieve the wallet's public key from Privy
  const publicKey = '...'; // the wallet's public key from Privy

  // Verify the signature
  const signatureBytes = Secp256k1Signature.fromFixedLength(
    Buffer.from(rawSignature.slice(2), 'hex')
  );

  const verified = await Secp256k1.verifySignature(
    signatureBytes,
    Buffer.from(hash.slice(2), 'hex'),
    Buffer.from(publicKey, 'hex')
  );
  console.log('Signature valid?', verified); // true
  ```
</Expandable>

## Sui

Sui supports multiple cryptographic schemes, with Privy's implementation utilizing the Ed25519 curve and EdDSA signing algorithm. The following example demonstrates transaction signing for Sui,
please note that the transaction bytes should be the full [intentMessage](https://docs.sui.io/concepts/transactions/transaction-auth/intent-signing):

<Expandable title="Code example">
  ```typescript  theme={"system"}
  import {messageWithIntent, toSerializedSignature, PublicKey} from '@mysten/sui/cryptography';
  import {Transaction} from '@mysten/sui/transactions';
  import {verifyTransactionSignature, publicKeyFromRawBytes} from '@mysten/sui/verify';
  import {toHex} from '@mysten/sui/utils';
  import {getFullnodeUrl, SuiClient} from '@mysten/sui/client';
  import {base58} from '@scure/base';

  // see Network Interactions with SuiClient for more info on creating clients
  const client = new SuiClient({url: getFullnodeUrl('testnet')});
  const tx = new Transaction();
  // ... add some transactions...
  const rawBytes = await tx.build({client});

  const intentMessage = messageWithIntent('TransactionData', rawBytes);
  const bytes = Buffer.from(intentMessage).toString('hex');

  const address = '';
  // get public key from privy wallet and decode to Uint8Array
  const publicKey = publicKeyFromRawBytes('ED25519', base58.decode('<public key string>'));

  // Obtain the raw signature from Privy's raw_sign endpoint
  // call privy raw_sign on `bytes`, `encoding` (`hex` or `base64`) and `hash_function` (`blake2b256`) and decode as Uint8Array
  const rawSignature = new Uint8Array();

  // Create and verify the transaction signature
  const txSignature = toSerializedSignature({
    signature: rawSignature,
    signatureScheme: 'ED25519',
    publicKey
  });
  const signer = await verifyTransactionSignature(rawBytes, txSignature, {address});
  console.log(signer.toSuiAddress() === address); // true
  ```
</Expandable>

Privy's ["raw sign"](/wallets/using-wallets/other-chains) endpoint supports policy evaluation for `field_source` of `sui_transaction_command` and `sui_transfer_objects_command` with `bytes`, `encoding` and `hash_function`.
See [example of Sui policies](/controls/policies/example-policies/sui).

<Note>
  When an `amount` condition is configured on the `sui_transfer_objects_command` field\_source,
  always configure the `sui_transaction_command` to allow `MergeCoins`, `SplitCoins` and
  `TransferObjects` only. Transactions containing commands like `MakeMoveVec`, `MoveCall`,
  `Publish`, or `Upgrade` are not supported for now.
</Note>

## Tron

Tron implements the ECDSA signing algorithm using the secp256k1 curve. Privy's implementation returns 64-byte ECDSA signatures (r || s), while Tron requires 65-byte signatures that include a recovery ID (v) as the final byte.

The recovery ID is essential because a 64-byte signature could correspond to two different addresses/private keys. The 65th byte, which can be either 0x1b or 0x1c (derived from 0 or 1 plus 27, following Ethereum standards), resolves this ambiguity.

The following example demonstrates message signing and verification for Tron:

<Expandable title="code example of message signing and verification">
  ```typescript  theme={"system"}
  import {TronWeb} from 'tronweb';
  import {hashMessage} from 'tronweb/utils';

  // Initialize with the wallet's Tron address
  const address = "<the wallet's tron address>";

  // Determine the recovery ID for signature verification
  const getRecoveryId = async ({message, rawSignature}: {message: string; rawSignature: string}) => {
    return (await tronWeb.trx.verifyMessageV2(message, rawSignature + '1b')) === address
      ? '1b'
      : '1c';
  };

  // Initialize TronWeb
  const tronWeb = new TronWeb({
    fullHost: 'xxx'
  });

  // Prepare and sign the message
  const message = 'Hello world';
  const hash = hashMessage(message);

  // Obtain the raw signature from Privy's raw_sign endpoint
  const rawSignature = '...'; // call privy raw_sign on `hash`

  // Verify the signature with the recovery ID
  const signerAddress = await tronWeb.trx.verifyMessageV2(
    message,
    rawSignature + (await getRecoveryId({message, rawSignature}))
  );
  console.log(signerAddress === address); // true
  ```
</Expandable>

<Expandable title="code example of sending and signing a transaction">
  ```typescript  theme={"system"}
  import {TronWeb, Types} from 'tronweb';

  const tronWeb = new TronWeb({
    fullHost: 'https://api.shasta.trongrid.io'
  });

  const walletId = "<wallet's wallet ID>";

  const from = "<wallet's tron address>";
  const to = "<recipient's tron address>";
  const amount = 1;

  const tx = (await tronWeb.transactionBuilder.sendTrx(
    to,
    amount,
    from
  )) as Types.SignedTransaction<Types.TransferContract>;

  const rawTxBytes = tronWeb.utils.code.hexStr2byteArray(tx.txID);
  const rawTxHex = '0x' + tronWeb.utils.code.byteArray2hexStr(rawTxBytes);

  const signature = '...'; // call Privy's raw sign function with rawTxHex, returns '0x...'
  (tx as Types.SignedTransaction<Types.TransferContract>).signature = [signature + '1b'];
  if (tronWeb.trx.ecRecover(tx) !== from) {
    (tx as Types.SignedTransaction<Types.TransferContract>).signature = [signature + '1c'];
  }

  const result = await tronWeb.trx.sendRawTransaction(tx);
  console.log('result', result);
  ```
</Expandable>

Privy's ["raw sign"](/wallets/using-wallets/other-chains) endpoint supports policy evaluation for `TransferContract` and `TriggerSmartContract` type of transactions with `bytes`, `encoding` and `hash_function`.
See [example of Tron policies](/controls/policies/example-policies/tron).

## Bitcoin (segwit)

Bitcoin (segwit) supports the ECDSA signing algorithm using the secp256k1 curve. Use Privy's raw sign functionality to sign each input utxo for your Bitcoin segwit transaction. Note that segwit support is separate from Bitcoin taproot or legacy transactions.

<Expandable title="Code example">
  ```typescript  theme={"system"}
  import {p2wpkh, OutScript, getInputType, Transaction} from '@scure/btc-signer';
  import {getPrevOut} from '@scure/btc-signer/transaction.js';
  import {concatBytes} from '@scure/btc-signer/utils.js';
  import secp256k1 from 'secp256k1';

  const publicKey = "<the wallet's public key>";

  const publicKeyBuffer = Buffer.from(publicKey, 'hex');
  const tx = new Transaction({version: 1, allowLegacyWitnessUtxo: true});

  // add as many outputs as needed, in this example there is only one
  // note that the relay fee is sum(input amounts) - sum(output amounts)
  const outputAddress = '';
  const outputAmount = 0n;
  tx.addOutputAddress(outputAddress, outputAmount);

  const inputAmount = 0n;
  tx.addInput({
    txid: '', // buffer of utxo txid
    index: 0, // index of the output in the tx
    witnessUtxo: {
      amount: inputAmount, // this must match the amount of the input exactly
      script: p2wpkh(publicKeyBuffer).script
    }
  });

  for (let i = 0; i < tx.inputsLength; i++) {
    const input = tx.getInput(i);
    const inputType = getInputType(input, tx.opts.allowLegacyWitnessUtxo);
    const prevOut = getPrevOut(input);
    let script = inputType.lastScript;
    // P2WPKH sighash uses the "pkh" script for signing
    if (inputType.last.type === 'wpkh') {
      script = OutScript.encode({type: 'pkh', hash: inputType.last.hash});
    }
    const hash = tx.preimageWitnessV0(i, script, inputType.sighash, prevOut.amount);
    const signature = ''; // call Privy's raw sign function with bytesToHex(hash), returns '0x...'
    const signatureBuffer = Buffer.from(signature.slice(2), 'hex');
    // convert to DER format
    const derSig = secp256k1.signatureExport(signatureBuffer);
    tx.updateInput(
      i,
      {
        partialSig: [[publicKeyBuffer, concatBytes(derSig, new Uint8Array([inputType.sighash]))]]
      },
      true
    );
  }

  tx.finalize();
  // return tx
  ```
</Expandable>

## Near

With Privy, you can create [Near-implicit accounts](https://docs.near.org/protocol/account-model) and sign over arbitrary data. Below is an example of how to create, sign, and send a Near transaction using Privy. (Note that Near requires accounts to be funded sending transactions.)

<Expandable title="code example of creating, signing, and sending a transaction">
  ```typescript  theme={"system"}
  import {
    JsonRpcProvider,
    baseDecode,
    PublicKey,
    parseNearAmount,
    actions,
    createTransaction,
    SignedTransaction,
    Signature
  } from 'near-api-js';
  import {sha256} from '@noble/hashes/sha256';
  import {base58} from '@scure/base';
  import {toHex} from 'viem';

  const nodeUrl = 'https://rpc.mainnet.near.org';
  const provider = new JsonRpcProvider({url: nodeUrl});
  const receiverId = 'receiver.near';
  const amount = '1.5';
  const nonce = 0; // If this is not the wallet's first transaction, set as current nonce

  const {
    header: {hash}
  } = await provider.viewBlock({finality: 'final'});
  const blockHash = baseDecode(hash);

  const accountId = "<wallet's near-implicit address / account ID>";

  const base58PublicKey = base58.encode(Buffer.from(accountId, 'hex'));
  const publicKey = PublicKey.fromString(`ed25519:${base58PublicKey}`);

  const amountYocto = parseNearAmount(Number(amount));
  const transferActions = [actions.transfer(BigInt(amountYocto ?? 0))];
  const tx = createTransaction(accountId, publicKey, receiverId, nonce, transferActions, blockHash);

  const serializedTx = tx.encode();

  const txHash = toHex(sha256(serializedTx));

  const signature = '...'; // call Privy's raw sign function with txHash, returns '0x...'

  const signedTx = new SignedTransaction({
    transaction: tx,
    signature: new Signature({
      keyType: tx.publicKey.keyType,
      data: Uint8Array.from(Buffer.from(signature.slice(2), 'hex'))
    })
  });

  const signedSerializedTx = signedTx.encode();
  const result = await provider.sendJsonRpc('broadcast_tx_commit', [
    Buffer.from(signedSerializedTx).toString('base64')
  ]);
  ```
</Expandable>

## Ton

All wallets on Ton are smart contract accounts, and Ed25519 keypairs are used to sign transactions on behalf of the smart contracts. When creating a wallet via Privy, Privy will generate the Ed25519 keypair and predetermine the address of the wallet contract, assuming that the wallet uses `WalletContractV4` with a `workchain` of `0`. Privy will *not* deploy the contract itself; that is the responsibility of the developer.
If you'd like to deploy a different wallet contract with the same keypair, the address will be different, but the request to Privy's API will remain the same.

<Expandable title="code example of creating and signing a transfer">
  ```typescript  theme={"system"}
  import {Cell, TonClient, WalletContractV4, internal} from '@ton/ton';
  import {toHex} from 'viem';

  // Create Client
  const client = new TonClient({
    endpoint: 'https://toncenter.com/api/v2/jsonRPC'
  });

  const walletId = "<wallet's wallet ID>";
  const publicKey = "<wallet's public key>";

  const trimmedPublicKey = Buffer.from(publicKey.slice(2), 'hex');
  // Create wallet contract
  let workchain = 0; // Usually you need a workchain 0
  let wallet = WalletContractV4.create({
    workchain,
    publicKey: trimmedPublicKey
  });
  let contract = client.open(wallet);

  // Create a transfer
  let seqno: number = await contract.getSeqno();
  const transfer = await contract.createTransfer({
    seqno,
    messages: [
      internal({
        value: '1',
        to: 'to_address',
        body: 'Hello world'
      })
    ],
    signer: async (msg: Cell) => {
      let hash = msg.hash();
      let signature = '...'; // call Privy's raw sign function with toHex(hash), returns '0x...'
      return Buffer.from(signature.slice(2), 'hex');
    }
  });
  ```
</Expandable>

## Spark

Checkout this [recipe](/recipes/spark-btc-guide) to get started with Spark wallets.

## Starknet

On Starknet, all wallets are smart contract accounts. The wallet address is the contract address, and therefore is derived from account-specific data--namely, the account class hash, the constructor data, and the public key returned from the Privy API.
The address returned from the Privy API assumes the use of [Ready's v0.5.0 account](https://github.com/argentlabs/argent-contracts-starknet/blob/6243bcf39fac0df25cff183056a9bc8f1e15ef28/deployments/account.txt#L1) class hash and the constructor call data, as shown below in the example.
After creating a starknet wallet with Privy, STRK tokens must be sent to the address for the wallet. Then, the developer must deploy the account.

If you wish to use a different account contract than Ready 0.5.0, we suggest maintaining the address-to-Privy-wallet mapping yourself at this time and ignoring the address returned from the Privy API.

<Expandable title="code example of deploying your Starknet account and sending a transfer">
  ```typescript  theme={"system"}
  import {
    RpcProvider,
    SignerInterface,
    hash,
    CallData,
    CairoOption,
    CairoOptionVariant,
    CairoCustomEnum,
    Account,
    cairo,
    TypedData,
    Signature,
    Call,
    InvocationsSignerDetails,
    DeployAccountSignerDetails,
    DeclareSignerDetails
  } from 'starknet';

  // connect RPC 0.8 provider
  const provider = new RpcProvider({
    nodeUrl: 'https://starknet-sepolia.public.blastapi.io/rpc/v0_8'
  });

  //new Argent X account v0.5.0
  const ARGENT_X_ACCOUNT_CLASS_HASH_V0_5_0 =
    '0x073414441639dcd11d1846f287650a00c60c416b9d3ba45d31c651672125b2c2';

  const publicKey = 'your public key';

  // Calculate future address of the ArgentX account
  const axSigner = new CairoCustomEnum({Starknet: {pubkey: publicKey}});
  const axGuardian = new CairoOption<unknown>(CairoOptionVariant.None);
  const AXConstructorCallData = CallData.compile({
    owner: axSigner,
    guardian: axGuardian
  });
  const AXcontractAddress = hash.calculateContractAddressFromHash(
    publicKey,
    ARGENT_X_ACCOUNT_CLASS_HASH_V0_5_0,
    AXConstructorCallData,
    0
  );

  // Use a RawSigner wrapper class around Signer. Example: https://github.com/argentlabs/argent-contracts-starknet/blob/6243bcf39fac0df25cff183056a9bc8f1e15ef28/lib/signers/signers.ts#L38
  export abstract class RawSigner extends SignerInterface {
    abstract signRaw(messageHash: string): Promise<string[]>;

    public async getPubKey(): Promise<string> {
      throw new Error('Example');
    }

    public async signMessage(
      typedDataArgument: TypedData,
      accountAddress: string
    ): Promise<Signature> {
      throw new Error('Example');
    }

    public async signTransaction(
      transactions: Call[],
      details: InvocationsSignerDetails
    ): Promise<Signature> {
      throw new Error('Example');
    }

    public async signDeployAccountTransaction(
      details: DeployAccountSignerDetails
    ): Promise<Signature> {
      throw new Error('Example');
    }

    public async signDeclareTransaction(details: DeclareSignerDetails): Promise<Signature> {
      throw new Error('Example');
    }
  }

  const account = new Account(
    provider,
    AXcontractAddress,
    new (class extends RawSigner {
      public async signRaw(messageHash: string): Promise<string[]> {
        console.log('messageHash=', messageHash);
        // Get the signature using the privy raw sign method
        const sig = '..';
        const sigWithout0x = sig.slice(2);
        const r = `0x${sigWithout0x.slice(0, 64)}`;
        const s = `0x${sigWithout0x.slice(64)}`;
        return [r, s];
      }
    })()
  );

  // The account address must hold STRK tokens to deploy the account.

  const accountDeployResult = await account.deployAccount({
    classHash: ARGENT_X_ACCOUNT_CLASS_HASH_V0_5_0,
    contractAddress: AXcontractAddress,
    constructorCalldata: AXConstructorCallData,
    addressSalt: publicKey
  });

  console.log('accountDeployResult=', accountDeployResult);

  // Transfer 1 STRK unit to your recipient address
  const STRK_TOKEN_ADDRESS = '0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d';

  const amount = cairo.uint256(1);

  // Simple transfer call using account.execute
  const transferCall = {
    contractAddress: STRK_TOKEN_ADDRESS,
    entrypoint: 'transfer',
    calldata: CallData.compile({
      recipient: 'your recipient address',
      amount: amount
    })
  };

  const result = await account.execute(transferCall);
  await provider.waitForTransaction(result.transaction_hash);
  ```
</Expandable>

## Aptos

Aptos is a Move VM chain which uses ed25519 keypairs for signing transactions. Below is an example of how to sign and send a transaction using Privy. See more developer docs [here](https://aptos.dev/build/sdks/ts-sdk/building-transactions).

<Expandable title="code example of signing and sending a transaction">
  ```typescript  theme={"system"}
  import {
    Aptos,
    AptosConfig,
    Network,
    AccountAddress,
    AccountAuthenticatorEd25519,
    Ed25519PublicKey,
    Ed25519Signature,
    generateSigningMessageForTransaction
  } from '@aptos-labs/ts-sdk';
  import {toHex} from 'viem';

  // 1) Wire up the client for the chain
  const aptos = new Aptos(
    new AptosConfig({
      network: Network.MAINNET
    })
  );
  const walletId = '<wallet ID from Privy>';
  const publicKey = '<public key of wallet>'; // 32-byte ed25519 public key hex
  const address = AccountAddress.from('<wallet address>');

  // 2) Build the raw transaction (SDK fills in seq#, chainId, gas if you let it)
  const rawTxn = await aptos.transaction.build.simple({
    sender: address,
    data: {
      function: '0x1::coin::transfer',
      typeArguments: ['0x1::aptos_coin::AptosCoin'],
      functionArguments: ['<recipient address>', 1] // amount in Octas
    }
  });

  const message = generateSigningMessageForTransaction(rawTxn);

  const signature = '...'; // call Privy's raw sign function with txHash, returns '0x...'

  // 5) Wrap pk + signature in an authenticator and submit
  const senderAuthenticator = new AccountAuthenticatorEd25519(
    new Ed25519PublicKey(publicKey),
    new Ed25519Signature(signature.slice(2))
  );

  const pending = await aptos.transaction.submit.simple({
    transaction: rawTxn,
    senderAuthenticator
  });

  const executed = await aptos.waitForTransaction({
    transactionHash: pending.hash
  });
  console.log('Executed:', executed.hash);
  ```
</Expandable>

## Movement

Movement is a Move VM chain that uses the Aptos chain standards. Below is an example of how to sign and send a transaction using Privy. See more developer docs [here](https://docs.movementnetwork.xyz/devs/interactonchain/wallet-adapter/aptos_wallet_standard#13-supporting-multiple-accounts-the-advanced-route).

<Expandable title="code example of signing and sending a transaction">
  ```typescript  theme={"system"}
  import {
    Aptos,
    AptosConfig,
    Network,
    AccountAddress,
    AccountAuthenticatorEd25519,
    Ed25519PublicKey,
    Ed25519Signature,
    generateSigningMessageForTransaction
  } from '@aptos-labs/ts-sdk';
  import {toHex} from 'viem';
  import {PrivyClient} from '@privy-io/node';

  // Initialize your Privy client
  const privy = new PrivyClient({
    appId: 'your-privy-app-id',
    appSecret: 'your-privy-app-secret'
  });

  // 1) Wire up the client for the Movement chain
  const aptos = new Aptos(
    new AptosConfig({
      network: Network.TESTNET,
      fullnode: 'https://full.testnet.movementinfra.xyz/v1'
    })
  );
  const walletId = '<wallet ID from Privy>';
  const publicKey = '<public key of wallet>'; // 32-byte ed25519 public key hex
  const address = AccountAddress.from('<wallet address>');

  // 2) Build the raw transaction (SDK fills in seq#, chainId, gas if you let it)
  const rawTxn = await aptos.transaction.build.simple({
    sender: address,
    data: {
      function: '0x1::coin::transfer',
      typeArguments: ['0x1::aptos_coin::AptosCoin'],
      functionArguments: ['<recipient address>', 1] // amount in Octas
    }
  });

  const message = generateSigningMessageForTransaction(rawTxn);
  const signatureResponse = await privy.wallets().rawSign(walletId, {params: {hash: toHex(message)}});
  const signature = signatureResponse as unknown as string;

  // 5) Wrap pk + signature in an authenticator and submit
  const senderAuthenticator = new AccountAuthenticatorEd25519(
    new Ed25519PublicKey(publicKey),
    new Ed25519Signature(signature.slice(2))
  );

  const pending = await aptos.transaction.submit.simple({
    transaction: rawTxn,
    senderAuthenticator
  });

  const executed = await aptos.waitForTransaction({
    transactionHash: pending.hash
  });
  console.log('Executed:', executed.hash);
  ```
</Expandable>
\n