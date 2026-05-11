> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Quickstart

> Learn how to create users, embedded wallets, and send transactions in a Go app

## 0. Prerequisites

This guide assumes the [setup](/basics/go/setup) guide is complete and a Privy client instance is available.

## 1. Creating a wallet

First, create a wallet. The wallet's `id` is used in future calls to sign messages and send transactions.

<Tabs>
  <Tab title="Ethereum">
    ```go  theme={"system"}
    wallet, err := client.Wallets.New(context.Background(), privy.WalletNewParams{
        ChainType: privy.WalletChainTypeEthereum,
    })
    if err != nil {
        log.Fatalf("failed to create wallet: %v", err)
    }

    walletID := wallet.ID
    ```
  </Tab>

  <Tab title="Solana">
    ```go  theme={"system"}
    wallet, err := client.Wallets.New(context.Background(), privy.WalletNewParams{
        ChainType: privy.WalletChainTypeSolana,
    })
    if err != nil {
        log.Fatalf("failed to create wallet: %v", err)
    }

    walletID := wallet.ID
    ```
  </Tab>
</Tabs>

<Tip>[Learn more](/wallets/wallets/create/create-a-wallet) about creating wallets.</Tip>

## 2. Signing a message

Next, sign a plaintext message with the wallet using chain-specific signing methods.
Specify the wallet ID (not address) from creation in the input.

<Tabs>
  <Tab title="Ethereum">
    ```go  theme={"system"}
    message := "Hello, Privy!"
    response, err := client.Wallets.Ethereum.SignMessage(
        context.Background(),
        walletID,
        message,
    )
    if err != nil {
        log.Fatalf("failed to sign message: %v", err)
    }

    signature := response.Signature
    ```
  </Tab>

  <Tab title="Solana">
    ```go  theme={"system"}
    message := "Hello, Privy!"
    response, err := client.Wallets.Solana.SignMessage(
        context.Background(),
        walletID,
        message,
    )
    if err != nil {
        log.Fatalf("failed to sign message: %v", err)
    }

    signature := response.Signature
    ```
  </Tab>
</Tabs>

<Tip>[Learn more](/wallets/using-wallets/ethereum/sign-a-message) about signing messages.</Tip>

## 3. Sending transactions

<Info>
  The wallet must have funds to send a transaction. Use a testnet
  [faucet](https://console.optimism.io/faucet) to test transacting on a testnet (e.g. Base Sepolia)
  or send funds to the wallet on the network of choice.
</Info>

To send a transaction from a wallet, use chain-specific transaction methods. The SDK
populates missing network-related values, signs the transaction, broadcasts it to the network, and
returns the transaction hash.

In the request, specify the wallet `id` from wallet creation above, as well as
the `caip2` chain ID for the target network.

<Tabs>
  <Tab title="Ethereum">
    ```go  theme={"system"}
    caip2 := "eip155:11155111" // Sepolia testnet

    response, err := client.Wallets.Ethereum.SendTransaction(
        context.Background(),
        walletID,
        caip2,
        privy.EthereumSendTransactionRpcInputParams{
            Transaction: privy.EthereumSendTransactionRpcInputParamsTransaction{
                To:    param.NewOpt(recipientAddress),
                Value: privy.EthereumSendTransactionRpcInputParamsTransactionValueUnion{
                    OfString: param.NewOpt("0x1"), // 1 wei
                },
                ChainID: privy.EthereumSendTransactionRpcInputParamsTransactionChainIDUnion{
                    OfInt: privy.Int(11155111), // Sepolia testnet
                },
            },
        },
    )
    if err != nil {
        log.Fatalf("failed to send transaction: %v", err)
    }

    transactionHash := response.Hash
    ```
  </Tab>

  <Tab title="Solana">
    ```go  theme={"system"}
    caip2 := "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp" // Solana Mainnet

    // A base64 encoded serialized transaction
    transaction := "insert-base-64-encoded-serialized-transaction"

    response, err := client.Wallets.Solana.SignAndSendTransaction(
        context.Background(),
        walletID,
        caip2,
        privy.SolanaSignAndSendTransactionRpcInputParams{
            Encoding:    "base64",
            Transaction: transaction,
        },
    )
    if err != nil {
        log.Fatalf("failed to send transaction: %v", err)
    }

    transactionHash := response.Hash
    ```
  </Tab>
</Tabs>

<Tip>
  [Learn more](/wallets/using-wallets/ethereum/send-a-transaction) about sending transactions.
</Tip>

<Tip>
  For more control, prepare and broadcast the transaction independently, and use raw signing methods
  to sign the transaction with a wallet.
</Tip>

## 4. Creating a user

To create a user for an application, use the `New` method. Pass in linked accounts, custom
metadata, and wallets to associate with the user.

```go  theme={"system"}
user, err := client.Users.New(context.Background(), privy.UserNewParams{
    LinkedAccounts: []privy.LinkedAccountInputUnion{
        {
            OfCustomAuth: &privy.LinkedAccountCustomAuthInput{
                Type:         privy.LinkedAccountCustomAuthInputTypeCustomAuth,
                CustomUserID: "your-subject-id",
            },
        },
        {
            OfEmail: &privy.LinkedAccountEmailInput{
                Type:    privy.LinkedAccountEmailInputTypeEmail,
                Address: "user@example.com",
            },
        },
    },
})
if err != nil {
    log.Fatalf("failed to create user: %v", err)
}

userID := user.ID
```

<Tip>
  [Learn more](/user-management/migrating-users-to-privy/create-or-import-a-user) about creating
  users, and see the [pregenerating wallets](/recipes/pregenerate-wallets) guide for linking wallets
  to users before they sign in.
</Tip>

## Next steps

<CardGroup cols={2}>
  <Card title="Authorization keys" icon="key" href="/controls/authorization-keys/overview">
    Add an extra layer of security by signing requests with authorization keys.
  </Card>

  <Card title="Policies" icon="shield-check" href="/controls/policies/overview">
    Restrict what wallets can do with configurable policies.
  </Card>

  <Card title="Idempotency keys" icon="fingerprint" href="/api-reference/idempotency-keys">
    Prevent duplicate transactions with idempotency key support.
  </Card>

  <Card title="Quorum approvals" icon="users" href="/controls/quorum-approvals/overview">
    Require multiple parties to approve before sending a transaction.
  </Card>
</CardGroup>
\n