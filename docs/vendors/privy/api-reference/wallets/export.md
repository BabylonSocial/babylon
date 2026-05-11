> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Export wallet

> Export a wallet's private key.

### SDK methods

Learn more about exporting wallets using our SDKs [here](/wallets/wallets/export).

***

This endpoint exports a wallet's private key using Hybrid Public Key Encryption (HPKE). The following HPKE configuration is supported:

* KEM (Key Encapsulation Mechanism): DHKEM\_P256\_HKDF\_SHA256
* KDF (Key Derivation Function): HKDF\_SHA256
* AEAD (Authenticated Encryption with Associated Data): CHACHA20\_POLY1305
* Mode: BASE

<RequestExample>
  ```sh cURL theme={"system"}
  curl --request POST \
    --url https://api.privy.io/v1/wallets/{wallet_id}/export \
    --header 'Authorization: Basic <encoded-value>' \
    --header 'Content-Type: application/json' \
    --header 'privy-app-id: <privy-app-id>' \
    --data '{
    "encryption_type": "HPKE",
    "recipient_public_key": "<base64-encoded-recipient-public-key>"
  }'
  ```
</RequestExample>

<ResponseExample>
  ```json 200 theme={"system"}
  {
    "encryption_type": "HPKE",
    "ciphertext": "N3rWFx85foeomDu8054VcwNBIwPkVNt4i5m2av1sXsXeWrIicVGwutFist12MmnI",
    "encapsulated_key": "BECqbgIAcs3TpP5GadS6F8mXkSktR2DR8WNtd3e0Qcy7PpoRHEygpzjFWttntS+SEM3VSr4Thewh18ZP9chseLE="
  }
  ```
</ResponseExample>

### Headers

<ParamField header="privy-app-id" type="string" required>
  ID of your Privy app.
</ParamField>

<ParamField header="privy-authorization-signature" type="string">
  Request authorization signature. If multiple signatures are required, they should be comma
  separated.
</ParamField>

### Path Parameters

<ParamField path="wallet_id" type="string" required>
  ID of the wallet to export.
</ParamField>

### Body

<ParamField body="encryption_type" type="string" defaultValue="HPKE" required>
  Currently only supports `HPKE` (Hybrid Public Key Encryption).
</ParamField>

<ParamField body="recipient_public_key" type="string" required>
  Base64-encoded public key of the recipient who will decrypt the private key. This key must be
  generated securely and kept confidential. The public key sent should be in base64-encoded DER
  format.
</ParamField>

### Response

<ResponseField name="encryption_type" type="string" required>
  Will be `HPKE` to indicate Hybrid Public Key Encryption was used.
</ResponseField>

<ResponseField name="ciphertext" type="string" required>
  Base64-encoded encrypted private key. The private key format depends on the wallet type: base58
  for Solana wallets, hex for EVM wallets.
</ResponseField>

<ResponseField name="encapsulated_key" type="string" required>
  Base64-encoded ephemeral public key used in the HPKE encryption process. Required for decryption.
</ResponseField>
\n