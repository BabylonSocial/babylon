> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Using Privy and Due for on/off ramping

Due is an API platform for moving money between crypto and fiat. It lets you send, receive, and convert funds using stablecoins and bank accounts. You use Due to automate on/off ramping and track transfers programmatically. If you want to bridge crypto and traditional finance, Due makes it simple.

## Table of Contents

* Prerequisites
* Initial setup (required for all transfers)
* Off ramping crypto to fiat
  * Option A: Signature-based transfer (via transfer intent)
  * Option B: Direct transfer (via funding address)
* On ramping fiat to crypto
* Virtual accounts (fiat on-ramp) Dedicated banking details for automatic fiat-to-crypto conversion.
* Tracking transfer status

## Prerequisites

You will need an **[API key](https://www.opendue.com/api)** for the Due Network APIs.

## Initial setup (required for all transfers)

Before executing any transfers, you must create and link accounts for your user.

### 1. Create a customer account in Due

Create an account for your user in Due. Save the returned `id` as `ACCOUNT_ID`.

```bash  theme={"system"}
curl --request POST \
  --url https://api.due.network/v1/accounts \
  --header 'Authorization: Bearer <YOUR_API_KEY>' \
  --header 'Content-Type: application/json' \
  --data '{
    "type": "individual",
    "email": "user@example.com",
    "details": {
      "firstName": "John",
      "lastName": "Doe"
    }
  }'
```

### 2. Create or get a Privy wallet

Create an embedded wallet for the user via the [Privy API](/api-reference/wallets/create). Save the `id` as `wallet_id` and the wallet's `address`.

```bash  theme={"system"}
curl --request POST \
  --url https://api.privy.io/v1/wallets \
  -u "<your-privy-app-id>:<your-privy-app-secret>" \
  --header 'privy-app-id: <your-privy-app-id>' \
  --header 'Content-Type: application/json' \
  --data '{
    "owner": {
      "user_id": "did:privy:clxduz8al00kql00fva24ggty"
    },
    "chain_type": "ethereum"
  }'
```

### 3. Link Privy wallet to Due account

Link the Privy wallet address to the user's Due account.

```bash  theme={"system"}
curl --request POST \
  --url https://api.due.network/v1/wallets \
  --header 'Authorization: Bearer <YOUR_API_KEY>' \
  --header 'Content-Type: application/json' \
  --header 'Due-Account-Id: <ACCOUNT_ID>' \
  --data '{
    "address": "0xcF5AaaBe14Ba42d9D765C8f2b9099c3b69a25321"
  }'
```

***

## Off ramping crypto to fiat

This flow moves cryptocurrency from a user's Privy wallet to an external bank account. You can choose between two methods:

* Signature based transfer: via Transfer Intent, more secure, requires signatures.
* Direct transfer via funding address: simpler, no signatures needed.

### Option A: Signature-based transfer (via transfer intent)

This method involves the user signing transaction data with their Privy wallet.

#### Step 1: Create a recipient

Define the destination bank account.

```bash  theme={"system"}
curl --request POST \
  --url https://api.due.network/v1/recipients \
  --header 'Authorization: Bearer <YOUR_API_KEY>' \
  --header 'Due-Account-Id: <ACCOUNT_ID>' \
  --data '{
    "name": "Marie Dubois",
    "details": {
      "schema": "bank_sepa",
      "accountType": "individual",
      "firstName": "Marie",
      "lastName": "Dubois",
      "IBAN": "FR1420041010050500013M02606"
    }
  }'
```

#### Step 2: Get a quote

Get a quote for the transfer.

**Note:** Quotes are short-lived (2 mins), so get it right before creating the transfer.

```bash  theme={"system"}
curl --request POST \
  --url https://api.due.network/v1/transfers/quote \
  --header 'Authorization: Bearer <YOUR_API_KEY>' \
  --header 'Due-Account-Id: <ACCOUNT_ID>' \
  --data '{
    "source": {"rail": "base", "currency": "USDC"},
    "destination": {"rail": "sepa", "currency": "EUR", "amount": "1000"}
  }'
```

<Accordion title="Example quote">
  ```json  theme={"system"}
  {
      "token": "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9...",
      "source": {
          "rail": "base",
          "currency": "USDC",
          "amount": "1177.171875",
          "fee": "5.296875"
      },
      "destination": {
          "rail": "sepa",
          "currency": "EUR",
          "amount": "1000",
          "fee": "4.52"
      },
      "fxRate": 1.1718750000000002,
      "fxMarkup": 5,
      "expiresAt": "2025-10-02T16:40:31.951762984Z"
  }
  ```
</Accordion>

<Note>
  Be sure to take note of the `token` field in the response, as you'll need it to create the
  transfer.
</Note>

#### Step 3: Create a transfer

Use the token returned by the quote to create the transfer.

```bash  theme={"system"}
curl --request POST \
  --url https://api.due.network/v1/transfers \
  --header 'Authorization: Bearer <YOUR_API_KEY>' \
  --header 'Due-Account-Id: <ACCOUNT_ID>' \
  --data '{
    "quote": "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9...",
    "sender": "wlt_e3lLDBYiPMHxCv1Q",
    "recipient": "rcp_fRlKXtbmyzvRwmY9",
    "memo": "Invoice#1"
  }'
```

#### Step 4: Create & sign the transfer intent

1. **Create the Intent:** Request a transfer intent from Due for the transfer ID (`tf_...`) created above.

   ```bash  theme={"system"}
   curl --request POST \
     --url https://api.due.network/v1/transfers/<TRANSFER_ID>/transfer_intent \
     --header 'Authorization: Bearer <YOUR_API_KEY>' \
     --header 'Due-Account-Id: <ACCOUNT_ID>'
   ```

   The response contains a `signables` array, typically with two objects to sign (`Permit` and `PayoutIntent`).

2. **Sign with Privy:** For *each object* in the `signables` array, call the [Privy API](/api-reference/wallets/ethereum/eth-signtypeddata-v4) to get a signature or send the signables to the client side for [signing](/wallets/using-wallets/ethereum/sign-typed-data#sign-typed-data). Use the `eth_signTypedData_v4` method with the `value` object from each signable.

<CodeGroup>
  ```bash REST API theme={"system"}
  curl --request POST \
    --url https://api.privy.io/v1/wallets/<wallet_id>/rpc \
    -u "<your-privy-app-id>:<your-privy-app-secret>" \
    --data '{
      "method": "eth_signTypedData_v4",
      "params": {
        "typed_data": {
          // ... Paste the `value` object from a signable here ...
        }
      }
    }'
  ```

  ```tsx React theme={"system"}
  import {useSignTypedData} from '@privy-io/react-auth';

  const signables = [/* ... signables array from Due ... */];
  const {signTypedData} = useSignTypedData();

  const signatures = await Promise.all(
  signables.map(async (signable) => {
  const signature = await signTypedData({
  typedData: signable.value,
  });
  return {
  id: signable.id,
  signature,
  };
  })
  );

  ```
</CodeGroup>

#### Step 5: Submit the signed intent

Submit the original transfer intent object back to Due, now including the `signature` for each object in the `signables` array.

```bash  theme={"system"}
curl --request POST \
--url https://api.due.network/v1/transfer_intents/submit \
--header 'Authorization: Bearer <YOUR_API_KEY>' \
--header 'Due-Account-Id: <ACCOUNT_ID>' \
--data '{
  "id": "ti_24QbulYAT9nfjU",
  // ... entire transfer intent object from the previous step ...
  "signables": [
    {
      // ... first signable object ...
      "signature": "0xd99802ab7a14b535ad0bf9c69a7cfd86..."
    },
    {
      // ... second signable object ...
      "signature": "0xa1b2c3d4e5f678901234567890abcdef..."
    }
  ]
  // ... rest of transfer intent object ...
}'
```

### Option B: Direct transfer (via funding address)

This simpler method provides a temporary address to send funds to, avoiding the signature flow.

1. **Create Funding Address:** After creating a transfer (Steps 1-3 above), request a funding address for it.

   ```bash  theme={"system"}
   curl --request POST \
     --url https://api.due.network/v1/transfers/<TRANSFER_ID>/funding_address \
     --header 'Authorization: Bearer <YOUR_API_KEY>' \
     --header 'Due-Account-Id: <ACCOUNT_ID>'
   ```

2. **Send funds from the wallet:** Use the Privy API to sign and submit the onchain transfer for the *exact* amount to the funding `address` received. The transfer will process automatically once funds are received.

***

## On ramping fiat to crypto

This flow lets users convert fiat currency from a bank account into cryptocurrency through Due, which deposits crypto into the user wallet. It involves obtaining a transfer quote, creating the transfer, and providing the user with banking details to complete the transaction. Due handles the fiat-to-crypto conversion and settlement, requiring no additional signatures or manual intervention.

1. **Get a quote:**

   ```bash  theme={"system"}
   curl --request POST \
     --url https://api.due.network/v1/transfers/quote \
     --header 'Authorization: Bearer <YOUR_API_KEY>' \
     --header 'Due-Account-Id: <ACCOUNT_ID>' \
     --data '{
       "source": {"rail": "ach", "currency": "USD", "amount": "100"},
       "destination": {"rail": "base", "currency": "USDC"}
     }'
   ```

2. **Create a transfer:** Use the quote token and specify your linked Due wallet ID as the `recipient`.

   ```bash  theme={"system"}
   curl --request POST \
     --url https://api.due.network/v1/transfers \
     --header 'Authorization: Bearer <YOUR_API_KEY>' \
     --header 'Due-Account-Id: <ACCOUNT_ID>' \
     --data '{
       "quote": "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9...",
       "recipient": "wlt_e3lLDBYiPMHxCv1Q"
     }'
   ```

3. **Provide banking details to the user:** The API response will include `bankingDetails` (account number, routing number, etc.). Share these details with the user so they can initiate the fiat transfer from their bank account. Due handles the conversion and deposits the cryptocurrency into the recipient wallet automatically. No additional signatures are required.

***

## Virtual accounts (fiat on-ramp)

Virtual accounts provide dedicated banking details (e.g., an IBAN) that automatically convert incoming fiat deposits to a specified stablecoin and send them to your wallet.

### Example: Create a EUR → EURC virtual account

```bash  theme={"system"}
curl --request POST \
  --url https://api.due.network/v1/virtual_accounts \
  --header 'Authorization: Bearer <YOUR_API_KEY>' \
  --header 'Due-Account-Id: <ACCOUNT_ID>' \
  --data '{
    "destination": "wlt_e3lLDBYiPMHxCv1Q",
    "schemaIn": "bank_sepa",
    "currencyIn": "EUR",
    "railOut": "base",
    "currencyOut": "EURC",
    "reference": "customer_x_eur_onramp"
  }'
```

The response provides an IBAN. Any EUR sent to this IBAN will be automatically converted to EURC and deposited into the destination wallet.

***

## Tracking transfer status

Check the status of any transfer using its ID.

```bash  theme={"system"}
curl --request GET \
  --url https://api.due.network/v1/transfers/<TRANSFER_ID> \
  --header 'Authorization: Bearer <YOUR_API_KEY>' \
  --header 'Due-Account-Id: <ACCOUNT_ID>'
```

**That's it! Your app can now move value between fiat bank accounts and stablecoins using Privy embedded wallets and the Due Network API, with Due handling conversion and settlement.**

Here are some additional resources to help expand your integration:

* [Privy API references](/api-reference/introduction)
* [Due Network API documentation](https://due.readme.io/docs/privy-due#using-privy-x-due-to-move-between-fiat-and-stablecoins)
\n