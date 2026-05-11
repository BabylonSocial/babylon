> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Quickstart

> Learn how to authenticate users, create embedded wallets, and send transactions in your Python app

## 0. Prerequisites

This guide assumes that you have completed the [Setup](/basics/python/setup) guide.

## 1. Creating a wallet

First, we will create a wallet. You will use this wallet's `id` in future calls to sign messages and send transactions.

<Tabs>
  <Tab title="Ethereum">`python wallet = client.wallets.create( chain_type="ethereum", ) `</Tab>
  <Tab title="Solana">`python wallet = client.wallets.create( chain_type="solana", ) `</Tab>
</Tabs>

<Tip>[Learn more](/wallets/wallets/create/create-a-wallet) about creating wallets.</Tip>

## 2. Signing a message

Next, we'll sign a plaintext message with the wallet using the `signMessage` method. Make sure to specify your wallet ID (not address) from creation in the input.

<Tabs>
  <Tab title="Ethereum">
    ```python  theme={"system"}
    message = "Hello Privy!"
    tx = client.wallets.rpc(
        wallet_id=wallet.id,
        method="personal_sign",
        caip2="eip155:1",
        params={
            "message": message,
            "encoding": "utf-8"
        },
    )
    ```
  </Tab>

  <Tab title="Solana">
    ```python  theme={"system"}
    tx = client.wallets.rpc(
        wallet_id=wallet.id,
        chain_type="solana",
        method="signMessage",
        params={
            "message": "SGVsbG8hIEkgYW0gdGhlIGJhc2U2NCBlbmNvZGVkIG1lc3NhZ2UgdG8gYmUgc2lnbmVkLg",
            "encoding": "base64"
        },
    )
    ```
  </Tab>
</Tabs>

<Tip>[Learn more](/wallets/using-wallets/ethereum/sign-a-message) about signing messages.</Tip>

## 3. Sending transactions

<Info>
  In order to send a transaction, your wallet must have some funds to pay for gas. You can use a
  testnet [faucet](https://console.optimism.io/faucet) to test transacting on a testnet (e.g. Base
  Sepolia) or send funds to the wallet on the network of your choice.
</Info>

To send a transaction from your wallet, use the `sendTransaction` method. It will populate missing network-related values (gas limit, gas fee values, nonce, type), sign your transaction, broadcast it to the network, and return the transaction hash to you.

In the request, make sure to specify your wallet `id` from your wallet creation above, as well as the `caip2` chain ID and `chainId` values for the network you want to transact on. Also, input your recipient or smart contract address in the `to` field.

<Tabs>
  <Tab title="Ethereum">
    ```python  theme={"system"}
    tx = client.wallets.rpc(
        wallet_id=wallet.id,
        method="eth_sendTransaction",
        caip2="eip155:1",
        params={
            "transaction": {
                "to": "0xE3070d3e4309afA3bC9a6b057685743CF42da77C",
                "value": "0x186a0",
            },
        },
    )
    ```
  </Tab>

  <Tab title="Solana">
    ````python  theme={"system"}
    tx = client.wallets.rpc(
        wallet_id=wallet.id,
        caip2="solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1",
        method="signAndSendTransaction",
        params={
            "transaction": "insert-base-64-encoded-serialized-transaction",
            "encoding": "base64"
        }
    )
    </Tab>
    </Tabs>

    To send USDC specifically, you can use the `send_usdc` helper:

    <Tabs>
    <Tab title="Ethereum">
    ```python from privy.lib.stablecoins.usdc import send_usdc tx = send_usdc( wallet_id=wallet.id,
    recipient_address="0xE3070d3e4309afA3bC9a6b057685743CF42da77C", amount_in_usdc=100, chain_id=1 )
    ````
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

## Next steps & advanced topics

* For an additional layer of security, you can choose to sign your requests with [authorization keys](/controls/authorization-keys/overview).
* To restrict what wallets can do, you can set up [policies](/controls/policies/overview).
* To prevent double sending the same transaction, take a look at our support for [idempotency](/api-reference/idempotency-keys) keys.
* If you want to require multiple parties to sign off before sending a transaction for a wallet, you can accomplish this through the use of [quorum approvals](/controls/quorum-approvals/overview).
\n