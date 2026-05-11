> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Quickstart

> Learn how to create users, embedded wallets, and send transactions in your Java app

## 0. Prerequisites

This guide assumes that you have completed the [Setup](/basics/java/setup) guide.

## 1. Creating a wallet

First, we will create a wallet.
You will use this wallet's `id` in future calls to sign messages and send transactions.

<Tabs>
  <Tab title="Ethereum">
    ```java  theme={"system"}
    try {
        WalletCreateRequestBody walletRequest = WalletCreateRequestBody.builder()
            .chainType(WalletChainType.ETHEREUM)
            .build();

        WalletCreateResponse response = privyClient.wallets().create(walletRequest)
        if (response.wallet().isPresent()) {
            Wallet createdWallet = response.wallet().get();
        }
    } catch (APIException e) {
        String errorBody = e.bodyAsString();
        System.err.println(errorBody);
    } catch (Exception e) {
        System.err.println(e.getMessage());
    }
    ```
  </Tab>

  <Tab title="Solana">
    ```java  theme={"system"}
    try {
        WalletCreateRequestBody walletRequest = WalletCreateRequestBody.builder()
            .chainType(WalletChainType.SOLANA)
            .build();

        WalletCreateResponse response = privyClient.wallets().create(walletRequest)
        if (response.wallet().isPresent()) {
            Wallet createdWallet = response.wallet().get();
        }
    } catch (APIException e) {
        String errorBody = e.bodyAsString();
        System.err.println(errorBody);
    } catch (Exception e) {
        System.err.println(e.getMessage());
    }
    ```
  </Tab>
</Tabs>

<Tip>[Learn more](/wallets/wallets/create/create-a-wallet) about creating wallets.</Tip>

## 2. Signing a message

Next, we'll sign a plaintext message with the wallet using the `signMessage` method.
Make sure to specify your wallet ID (not address) from creation in the input.

<Tabs>
  <Tab title="Ethereum">
    ```java  theme={"system"}
    try {
        String message = "Hello, Privy!";

        EthereumPersonalSignRpcResponseData response = privyClient
            .wallets()
            .ethereum()
            .signMessage(
                walletId,
                message.getBytes(StandardCharsets.UTF_8),
                AuthorizationContext.builder().build()
            );

        String signature = response.signature();
    } catch (APIException e) {
        String errorBody = e.bodyAsString();
        System.err.println(errorBody);
    } catch (Exception e) {
        System.err.println(e.getMessage());
    }
    ```
  </Tab>

  <Tab title="Solana">
    ```java  theme={"system"}
    try {
        String message = "Hello, Privy!";

        EthereumPersonalSignRpcResponseData response = privyClient
            .wallets()
            .solana()
            .signMessage(
                walletId,
                message.getBytes(StandardCharsets.UTF_8),
                AuthorizationContext.builder().build()
            );

        String signature = response.signature();
    } catch (APIException e) {
        String errorBody = e.bodyAsString();
        System.err.println(errorBody);
    } catch (Exception e) {
        System.err.println(e.getMessage());
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
the `caip2` chain ID and `chainId` values for the network you want to transact on.
Also, input your recipient or smart contract address in the `to` field.

<Tabs>
  <Tab title="Ethereum">
    ```java  theme={"system"}
    try {
        String caip2 = "eip155:11155111"; // Sepolia testnet

        EthereumSendTransactionRpcInputTransaction txn = EthereumSendTransactionRpcInputTransaction.builder()
            .to(recipientAddress)
            .value(EthereumSendTransactionRpcInputValue.of("0x1")) // 1 wei
            .chainId(EthereumSendTransactionRpcInputChainId.of(11_155_111)) // Sepolia testnet
            .build();

        EthereumSendTransactionRpcResponseData response = privyClient
            .wallets()
            .ethereum()
            .sendTransaction(
                senderWalletId,
                caip2,
                txn,
                AuthorizationContext.builder().build()
            );

        String transactionHash = response.hash();
    } catch (APIException e) {
        String errorBody = e.bodyAsString();
        System.err.println(errorBody);
    } catch (Exception e) {
        System.err.println(e.getMessage());
    }
    ```
  </Tab>

  <Tab title="Solana">
    ```java  theme={"system"}
    try {
        String caip2 = "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp"; // Solana Mainnet

        // A base64 encoded serialized transaction to sign
        String transaction = "insert-base-64-encoded-serialized-transaction";

        SolanaSignAndSendTransactionRpcResponseData response = privyClient.wallets().solana()
            .signAndSendTransaction(
                senderWalletId,
                caip2,
                transaction,
                AuthorizationContext.builder().build()
            );

        String transactionHash = response.hash();
    } catch (APIException e) {
        String errorBody = e.bodyAsString();
        System.err.println(errorBody);
    } catch (Exception e) {
        System.err.println(e.getMessage());
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

```java  theme={"system"}
try {
    // Linked accounts to be created for user
    List<LinkedAccountInput> createUserLinkedAccounts = List.of(
        LinkedAccountInput.customAuth(subjectId),
        LinkedAccountInput.email(email)
    );

    // Build request body
    UserCreateRequestBody requestBody = UserCreateRequestBody
        .builder()
        .linkedAccounts(createUserLinkedAccounts)
        .build();

    // Send request to create user
    UserCreateResponse response = privyClient.users().create(requestBody);
    if (response.user().isPresent()) {
        User user = response.user().get();
        String userId = user.id();
    }
} catch (APIException e) {
    String errorBody = e.bodyAsString();
    System.err.println(errorBody);
} catch (Exception e) {
    System.err.println(e.getMessage());
}
```

<Tip>
  [Learn more](/user-management/migrating-users-to-privy/create-or-import-a-user) about creating
  users, and look at our [pregenerating wallets](/recipes/pregenerate-wallets) guide for linking
  wallets to your users before they even sign in.
</Tip>

## Next steps & advanced topics

* For an additional layer of security, you can choose to sign your requests with [authorization keys](/controls/authorization-keys/overview).
* To restrict what wallets can do, you can set up [policies](/controls/policies/overview).
* To prevent double sending the same transaction, take a look at our support for [idempotency](/api-reference/idempotency-keys) keys.
* If you want to require multiple parties to sign off before sending a transaction for a wallet, you can accomplish this through the use of [quorum approvals](/controls/quorum-approvals/overview).
\n