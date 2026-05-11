> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Initialize import

> Initialize a wallet import. Complete by submitting the import.

### SDK methods

Learn more about importing wallets using our SDKs [here](/wallets/wallets/import-a-wallet/private-key).


## OpenAPI

````yaml post /v1/wallets/import/init
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
  /v1/wallets/import/init:
    post:
      tags:
        - Wallets
      summary: Initialize import
      description: Initialize a wallet import. Complete by submitting the import.
      parameters:
        - schema:
            type: string
            description: ID of your Privy app.
          required: true
          name: privy-app-id
          in: header
      requestBody:
        required: true
        content:
          application/json:
            schema:
              oneOf:
                - $ref: '#/components/schemas/HDInitInput'
                - $ref: '#/components/schemas/PrivateKeyInitInput'
              discriminator:
                propertyName: entropy_type
                mapping:
                  hd:
                    $ref: '#/components/schemas/HDInitInput'
                  private-key:
                    $ref: '#/components/schemas/PrivateKeyInitInput'
              example:
                address: '0xF1DBff66C993EE895C8cb176c30b07A559d76496'
                chain_type: ethereum
                entropy_type: private-key
                encryption_type: HPKE
      responses:
        '200':
          description: The encryption public key to encrypt the wallet entropy with.
          content:
            application/json:
              schema:
                type: object
                properties:
                  encryption_type:
                    $ref: '#/components/schemas/HPKEEncryption'
                  encryption_public_key:
                    type: string
                    description: >-
                      The base64-encoded encryption public key to encrypt the
                      wallet entropy with.
                required:
                  - encryption_type
                  - encryption_public_key
                title: Wallet import initialization response
                example:
                  encryption_type: HPKE
                  encryption_public_key: >-
                    BDAZLOIdTaPycEYkgG0MvCzbIKJLli/yWkAV5yCa9yOsZ4JsrLweA5MnP8YIiY4k/RRzC+APhhO+P+Hoz/rt7Go=
      security:
        - appSecretAuth: []
components:
  schemas:
    HDInitInput:
      type: object
      properties:
        address:
          type: string
          description: The address of the wallet to import.
        chain_type:
          $ref: '#/components/schemas/WalletImportSupportedChains'
        encryption_type:
          $ref: '#/components/schemas/HPKEEncryption'
        entropy_type:
          type: string
          enum:
            - hd
          description: The entropy type of the wallet to import.
        index:
          type: integer
          minimum: 0
          description: The index of the wallet to import.
      required:
        - address
        - chain_type
        - encryption_type
        - entropy_type
        - index
      description: The input for HD wallets.
      title: Entropy based wallet import
    PrivateKeyInitInput:
      type: object
      properties:
        address:
          type: string
          description: The address of the wallet to import.
        chain_type:
          $ref: '#/components/schemas/WalletImportSupportedChains'
        encryption_type:
          $ref: '#/components/schemas/HPKEEncryption'
        entropy_type:
          type: string
          enum:
            - private-key
      required:
        - address
        - chain_type
        - encryption_type
        - entropy_type
      description: The input for private key wallets.
      title: Private key based wallet import
    HPKEEncryption:
      type: string
      enum:
        - HPKE
      description: >-
        The encryption type of the wallet to import. Currently only supports
        `HPKE`.
    WalletImportSupportedChains:
      type: string
      enum:
        - ethereum
        - solana
      description: >-
        The chain type of the wallet to import. Currently supports `ethereum`
        and `solana`.
  securitySchemes:
    appSecretAuth:
      type: http
      scheme: basic
      description: >-
        Basic Auth header with your app ID as the username and your app secret
        as the password.

````\n