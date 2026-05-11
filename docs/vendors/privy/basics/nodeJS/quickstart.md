> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Quickstart

> Learn how to create users, embedded wallets, and send transactions in your NodeJS app

<Info>
  This guide is for the **`@privy-io/node`** library. If you are looking for the deprecated
  **`@privy-io/server-auth`** library, please see the
  [NodeJS](/basics/nodeJS-server-auth/quickstart) guide.
</Info>

## 0. Prerequisites

This guide assumes that you have completed the [Setup](/basics/nodeJS-server-auth/setup) guide,
to get a Privy client instance, `privy`.

## 1. Creating a wallet

First, we will create a wallet.
You will use this wallet's `id` in future calls to sign messages and send transactions.

<Tabs>
  <Tab title="Ethereum">
    ```ts  theme={"system"}
    import { APIError, PrivyAPIError } from '@privy-io/node';

    try {
      const createdWallet = await privy.wallets().create({chain_type: 'ethereum'});
      const walletId = createdWallet.id;
    } catch (error) {
      if (error instanceof APIError) {
        // When the library is unable to connect to the API,
        // or if the API returns a non-success status code (i.e., 4xx or 5xx response),
        // a subclass of `APIError` will be thrown:
        console.log(error.status); // 400
        console.log(error.name); // BadRequestError
      } else if (error instanceof PrivyAPIError) {
        // Other errors from the Privy SDK all subclass `PrivyAPIError`.
        console.log(error.message);
      } else {
        // This error is not related to the Privy SDK.
        throw error;
      }
    }
    ```
  </Tab>

  <Tab title="Solana">
    ```ts  theme={"system"}
    import { APIError, PrivyAPIError } from '@privy-io/node';

    try {
      const createdWallet = privy.wallets().create({chain_type: 'solana'});
      const walletId = createdWallet.id;
    } catch (error) {
      if (error instanceof APIError) {
        // When the library is unable to connect to the API,
        // or if the API returns a non-success status code (i.e., 4xx or 5xx response),
        // a subclass of `APIError` will be thrown:
        console.log(error.status); // 400
        console.log(error.name); // BadRequestError
      } else if (error instanceof PrivyAPIError) {
        // Other errors from the Privy SDK all subclass `PrivyAPIError`.
        console.log(error.message);
      } else {
        // This error is not related to the Privy SDK.
        throw error;
      }
    }
    ```
  </Tab>
</Tabs>

<Tip>[Learn more](/wallets/wallets/create/create-a-wallet) about creating wallets.</Tip>

<Note>
  When using the `PrivyClient` to work with the API, all errors thrown will be instances of
  `APIError` or `PrivyAPIError`. You should catch these errors and handle them accordingly, using
  the error's `status`, `name` and `message`.
</Note>

### User wallets

You can create a self-custodial user wallet using the SDK. First, create a user, then provision a wallet for that user.

<Tabs>
  <Tab title="Ethereum">
    ```ts  theme={"system"}
    try {
      const user = await privy.users().create({
        linked_accounts: [{type: 'email', address: 'batman@privy.io'}],
      });

      const {id, address, chain_type} = await privy.wallets().create({
        chain_type: 'ethereum',
        owner: {user_id: user.id}
      });

    } catch (error) {
      console.error(error);
    }
    ```
  </Tab>

  <Tab title="Solana">
    ```ts  theme={"system"}
    try {
      const user = await privy.users().create({
        linked_accounts: [{type: 'email', address: 'batman@privy.io'}],
      });

     const {id, address, chain_type} = await privy.wallets().create({
        chain_type: 'solana',
        owner: {user_id: user.id}
      });

    } catch (error) {
      console.error(error);
    }
    ```
  </Tab>
</Tabs>

<Info>
  If you are creating a user wallet, you must specify the user ID as the owner of the wallet. You can obtain a user ID by first [creating a user](/user-management/migrating-users-to-privy/create-or-import-a-user) before creating the wallet.

  Or, you can [create a user and wallet at the same time](/user-management/migrating-users-to-privy/create-or-import-a-user).
</Info>

## 2. Signing a message

Next, we'll sign a plaintext message with the wallet using the `signMessage` method.
Make sure to specify your wallet ID (not address) from creation in the input.

<Tabs>
  <Tab title="Ethereum">
    ```ts  theme={"system"}
    try {
      const message = "Hello, Privy!";

      const response = await privy.wallets().ethereum().signMessage(walletId, { message });
      // Signature is hex-encoded for Ethereum
      const signature = response.signature;
    } catch (error) {
      if (error instanceof APIError) {
        console.log(error.status, error.name);
      } else if (error instanceof PrivyAPIError) {
        console.log(error.message);
      } else {
        throw error;
      }
    }
    ```
  </Tab>

  <Tab title="Solana">
    ```ts  theme={"system"}
    try {
      const message = "Hello, Privy!";
      // Solana requires the message to be base64 encoded
      const base64Message = Buffer.from(message, 'utf8').toString('base64')

      const response = await privy.wallets().solana().signMessage(walletId, { message: base64Message });
      // Signature is base64-encoded for Solana
      const signature = response.signature;
    } catch (error) {
      if (error instanceof APIError) {
        console.log(error.status, error.name);
      } else if (error instanceof PrivyAPIError) {
        console.log(error.message);
      } else {
        throw error;
      }
    }
    ```
  </Tab>
</Tabs>

<Tip>[Learn more](/wallets/using-wallets/ethereum/sign-a-message) about signing messages.</Tip>

## 3. Sending transactions

<Info>
  Your wallet must have some funds in order to send a transaction. You can use a testnet
  [faucet](https://console.optimism.io/faucet) to test transacting on a testnet (e.g. Base Sepolia)
  or send funds to the wallet on the network of your choice.
</Info>

To send a transaction from your wallet, use the `sendTransaction` method.
It will populate missing network-related values (gas limit, gas fee values, nonce, type), sign your
transaction, broadcast it to the network, and return the transaction hash to you.

In the request, make sure to specify your wallet `id` from your wallet creation above, as well as
the `caip2` chain ID and `chain_id` values for the network you want to transact on.
Also, input your recipient or smart contract address in the `to` field.

<Tabs>
  <Tab title="Ethereum">
    ```ts  theme={"system"}
    try {
        const caip2 = "eip155:11155111"; // Sepolia testnet

        const response = await privy.wallets().ethereum().sendTransaction(walletId, {
          caip2,
          params: {
            transaction: {
              to: recipientAddress,
              value: "0x1", // 1 wei
              chain_id: 11_155_111, // Sepolia testnet
            },
          },
        });
        const transactionHash = response.hash;
    } catch (error) {
      if (error instanceof APIError) {
        console.log(error.status, error.name);
      } else if (error instanceof PrivyAPIError) {
        console.log(error.message);
      } else {
        throw error;
      }
    }
    ```
  </Tab>

  <Tab title="Solana">
    ```ts  theme={"system"}
    try {
        const caip2 = "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp"; // Solana Mainnet

        // A base64 encoded serialized transaction to sign
        const transaction = "insert-base-64-encoded-serialized-transaction";

        const response = await privy.wallets().solana().signAndSendTransaction(walletId, {
          caip2,
          transaction,
        });
        const transactionHash = response.hash;
    } catch (error) {
      if (error instanceof APIError) {
        console.log(error.status, error.name);
      } else if (error instanceof PrivyAPIError) {
        console.log(error.message);
      } else {
        throw error;
      }
    }
    ```
  </Tab>
</Tabs>

<Tip>
  [Learn more](/wallets/using-wallets/ethereum/send-a-transaction) about sending transactions.
</Tip>

<Tip>
  If you’re interested in more control, you can prepare and broadcast the transaction yourself, and
  simply use `eth_signTransaction` ([EVM](/wallets/using-wallets/ethereum/sign-a-transaction)) and
  `signTransaction` ([Solana](/wallets/using-wallets/solana/sign-a-transaction)) RPCs to sign the
  transaction with a wallet.
</Tip>

## 4. Creating a user

To create a user for your application, you can use the `create` method, passing in
a `UserCreateRequestBody` object, which allows you to specify the linked accounts, custom metadata,
and wallets that should be associated with said user.

```ts  theme={"system"}
import {APIError, PrivyAPIError, PrivyClient} from '@privy-io/node';

const privy = new PrivyClient({appId: 'insert-your-app-id', appSecret: 'insert-your-app-secret'});

try {
  const user = await privy.users().create({
    linked_accounts: [
      {type: 'custom_auth', custom_user_id: '$SUBJECT_ID'},
      {type: 'email', address: '$EMAIL'}
    ]
  });

  const userId = user.id;
} catch (error) {
  if (error instanceof APIError) {
    console.log(error.status, error.name);
  } else if (error instanceof PrivyAPIError) {
    console.log(error.message);
  } else {
    throw error;
  }
}
```

<Tip>
  [Learn more](/user-management/migrating-users-to-privy/create-or-import-a-user) about creating
  users, and look at our [pregenerating wallets](/recipes/pregenerate-wallets) guide for linking
  wallets to your users before they even sign in.
</Tip>

## Next steps & advanced topics

* For an additional layer of security, you can choose to sign your requests with [authorization keys](/controls/authorization-keys/using-owners/overview).
* To restrict what wallets can do, you can set up [policies](/controls/policies/overview).
* To prevent double sending the same transaction, take a look at our support for [idempotency](/api-reference/idempotency-keys) keys.
* If you want to require multiple parties to sign off before sending a transaction for a wallet, you can accomplish this through the use of [quorum approvals](/controls/quorum-approvals/overview).
\n