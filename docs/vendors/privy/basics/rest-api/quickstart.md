> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Quickstart

> Creating a wallet and sending a transaction with Privy's REST API

## 0. Prerequisites

API credentials are required for this guide. If you have not already gone through the [API setup guide](/basics/rest-api/setup), go through those steps now.

## 1. Create a wallet

Let's create a simple Ethereum wallet:

<CodeGroup>
  ```bash cURL theme={"system"}
  curl --request POST \
    --url https://api.privy.io/v1/wallets \
    --header 'Authorization: Basic <encoded-value>' \
    --header 'Content-Type: application/json' \
    --header 'privy-app-id: <privy-app-id>' \
    --data '{
    "chain_type": "ethereum"
  }'
  ```
</CodeGroup>

<Note>
  [Authorization signatures](/api-reference/authorization-signatures) are an optional security
  improvement that requires all requests to be authorized by you.
</Note>

The response will include the wallet ID and public address:

```json  theme={"system"}
{
  "id": "jf4mev19seymsqulciv8on0c",
  "address": "0x7Ef5363308127128969618240eDcB9F8f61e90F6",
  "chain_type": "ethereum",
  "policy_ids": [],
  "created_at": 1741362961254
}
```

## 1b. User wallets

If you want the wallet to be owned by a user, you can first create a user and then create a wallet for that user, or create the user and wallet in the same API call as shown below.

<CodeGroup>
  ```bash cURL theme={"system"}
  curl --request POST \
    --url https://api.privy.io/v1/users \
    --header 'Authorization: Basic <encoded-value>' \
    --header 'Content-Type: application/json' \
    --header 'privy-app-id: <privy-app-id>' \
    --data '{
    "linked_accounts": [
      {"type": "email", "address": "batman@privy.io"}
    ],
    "wallets": [
      {"chain_type": "ethereum"}
    ]
  }'
  ```
</CodeGroup>

<Info>
  If your server initiates actions on user wallets, you may need to sign requests with an
  authorization key and include the `privy-authorization-signature` header. See [authorization
  signatures](/api-reference/authorization-signatures) and [using authorization
  keys](/controls/authorization-keys/using-owners/sign).
</Info>

<Note>
  To prevent duplicate operations in case of retries, include an [idempotency
  key](/api-reference/idempotency-keys).
</Note>

## 2. Sign a message

Now let's sign a message with our new wallet:

<CodeGroup>
  ```bash cURL theme={"system"}
  curl --request POST \
    --url https://api.privy.io/v1/wallets/{wallet_id}/rpc \
    --header 'Authorization: Basic <encoded-value>' \
    --header 'Content-Type: application/json' \
    --header 'privy-app-id: <privy-app-id>' \
    --data '{
    "method": "personal_sign",
    "params": {
      "message": "Hello from Privy!",
      "encoding": "utf-8"
    }
  }'
  ```
</CodeGroup>

The response will contain the signed message:

```json  theme={"system"}
{
  "method": "personal_sign",
  "data": {
    "signature": "0x292d67e9c5178447f1c5344b3122997dfba8f00e43102d0b746301e9b4afbbf67d952bf870878d92b8eb066da205840458c0a5fb3f53253dbe1adf9c143678311c",
    "encoding": "hex"
  }
}
```

## 3. Send a transaction

Finally, let's send a transaction on Ethereum's testnet, [Sepolia](https://sepolia.etherscan.io/):

<CodeGroup>
  ```bash cURL theme={"system"}
  curl --request POST \
    --url https://api.privy.io/v1/wallets/{wallet_id}/rpc \
    --header 'Authorization: Basic <encoded-value>' \
    --header 'Content-Type: application/json' \
    --header 'privy-app-id: <privy-app-id>' \
    --data '{
    "method": "eth_sendTransaction",
    "caip2": "eip155:11155111",
    "chain_type": "ethereum",
    "params": {
      "transaction": {
        "to": "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
        "value": 1000000000000000
      }
    }
  }'
  ```
</CodeGroup>

<Warning>
  You will need to fund your wallet with Sepolia ETH for this step. Use a [Sepolia
  faucet](https://cloud.google.com/application/web3/faucet/ethereum/sepolia) and send it to the
  public address.
</Warning>

The response will contain the transaction hash and a Privy transaction ID:

```json  theme={"system"}
{
  "method": "eth_sendTransaction",
  "data": {
    "hash": "0x7c91ba85d67ef92cc15f3e9c8d8c5788e982cf83fabe9bfcc66a747aa0bd3701",
    "caip2": "eip155:11155111",
    "transaction_id": "d2obiyxnblv7jzp73b8scqa8"
  }
}
```

## Next steps

Now that you've created a wallet and made your first transaction, you can explore:

1. Creating [policies](/controls/policies/overview) to control wallet spending and contract interaction
2. Setting up [webhooks](/wallets/gas-and-asset-management/assets/transaction-event-webhooks) for real-time transaction notifications
3. Using [idempotency keys](/api-reference/idempotency-keys) to prevent duplicate transactions
4. Setting up [quorum authorizations](/controls/quorum-approvals/overview#using-quorum-approvals) for sensitive wallets
\n