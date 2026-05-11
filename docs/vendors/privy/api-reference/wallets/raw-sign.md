> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Raw sign

> Sign a raw hash along the blockchain's cryptographic curve using the wallet's private key.

### SDK methods

Learn more about signing with other chains using our SDKs [here](/wallets/using-wallets/other-chains).

<Info>
  To see how to use raw sign for chains with Tier 2 support, see [this recipe](/recipes/use-tier-2).
</Info>


## OpenAPI

````yaml post /v1/wallets/{wallet_id}/raw_sign
openapi: 3.1.0
info:
  version: 0.0.1
  title: Privy API
  contact:
    email: support@privy.io
servers:
  - url: https://api.privy.io
security: []
tags:
  - name: Wallets
    description: Operations related to wallets
  - name: Policies
    description: Operations related to policies
  - name: Condition Sets
    description: Operations related to condition sets
  - name: Transactions
    description: Operations related to transactions
  - name: Key quorums
    description: Operations related to key quorums
  - name: Aggregations
    description: Operations related to aggregations for tracking and measuring metrics
  - name: Users
    description: Operations related to users
  - name: User signers
    description: Operations related to user signers
  - name: Fiat
    description: Operations related to fiat onramping and offramping
  - name: Kraken Embed
    description: >-
      Operations for Kraken Embed integration, including quotes, trades, user
      management, and portfolio operations
  - name: Webhooks
    description: >-
      Webhook events that Privy sends to your configured endpoint when specific
      actions occur in your app
  - name: Yield
    description: >-
      Operations for depositing and withdrawing funds from ERC-4626 yield vaults
      (Morpho, Aave)
  - name: Apps
    description: Operations related to app settings and allowlist management
  - name: Accounts
    description: Operations related to asset accounts
paths:
  /v1/wallets/{wallet_id}/raw_sign:
    post:
      tags:
        - Wallets
      summary: Raw sign
      description: Sign a message with a wallet by wallet ID.
      parameters:
        - schema:
            type: string
            description: ID of the wallet.
          required: true
          name: wallet_id
          in: path
        - schema:
            type: string
            description: ID of your Privy app.
          required: true
          name: privy-app-id
          in: header
        - schema:
            type: string
            description: >-
              Request authorization signature. If multiple signatures are
              required, they should be comma separated.
          required: false
          name: privy-authorization-signature
          in: header
        - schema:
            type: string
            description: >-
              Idempotency keys ensure API requests are executed only once within
              a 24-hour window.
          required: false
          name: privy-idempotency-key
          in: header
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                params:
                  oneOf:
                    - type: object
                      title: Hash
                      description: Sign a pre-computed hash
                      properties:
                        hash:
                          type: string
                          description: The hash to sign. Must start with `0x`.
                      required:
                        - hash
                      additionalProperties: false
                    - type: object
                      title: Bytes
                      description: >-
                        Hash and sign bytes using the specified encoding and
                        hash function.
                      properties:
                        bytes:
                          type: string
                          description: The bytes to hash and sign.
                        encoding:
                          type: string
                          enum:
                            - utf-8
                            - hex
                            - base64
                          description: The encoding scheme for the bytes.
                        hash_function:
                          type: string
                          enum:
                            - keccak256
                            - sha256
                            - blake2b256
                          description: The hash function to hash the bytes.
                      required:
                        - bytes
                        - encoding
                        - hash_function
                      additionalProperties: false
              required:
                - params
              additionalProperties: false
              description: >-
                Provide either `hash` (to sign a pre-computed hash) OR `bytes`,
                `encoding`, and `hash_function` (to hash and then sign). These
                options are mutually exclusive.
              title: raw_sign
            examples:
              with-hash:
                summary: Sign a pre-computed hash
                value:
                  params:
                    hash: >-
                      0x0775aeed9c9ce6e0fbc4db25c5e4e6368029651c905c286f813126a09025a21e
              with-bytes:
                summary: Hash and sign bytes
                value:
                  params:
                    bytes: >-
                      0a0234ea220809701d7a17a77e04408093e981a6335a66080112620a2d747970652e676f6f676c65617069732e636f6d2f70726f746f636f6c2e5472616e73666572436f6e747261637412310a15417009bf59e27d2031a23a61e1590289fc3d21b3cd121541132b98ed6fb80a2d45f177cdef091ae2d9dc115418e80770a0bee581a633
                    encoding: hex
                    hash_function: sha256
      responses:
        '200':
          description: Signature and encoding.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/RawSignResponse'
      security:
        - appSecretAuth: []
components:
  schemas:
    RawSignResponse:
      type: object
      properties:
        method:
          type: string
          enum:
            - raw_sign
        data:
          type: object
          properties:
            signature:
              type: string
            encoding:
              type: string
              enum:
                - hex
          required:
            - signature
            - encoding
      required:
        - method
        - data
      additionalProperties: false
  securitySchemes:
    appSecretAuth:
      type: http
      scheme: basic
      description: >-
        Basic Auth header with your app ID as the username and your app secret
        as the password.

````\n