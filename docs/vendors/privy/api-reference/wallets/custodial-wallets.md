> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Create custodial wallets

> Create a new wallet custodied by a third-party provider.



## OpenAPI

````yaml post /v1/custodial_wallets
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
  /v1/custodial_wallets:
    post:
      tags:
        - Wallets
      summary: Create custodial wallet
      description: Create a new wallet custodied by a third-party provider.
      parameters:
        - schema:
            type: string
            description: ID of your Privy app.
          required: true
          name: privy-app-id
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
              $ref: '#/components/schemas/CustodialWalletCreateInput'
      responses:
        '200':
          description: Newly created custodial wallet.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/CustodialWallet'
      security:
        - appSecretAuth: []
components:
  schemas:
    CustodialWalletCreateInput:
      type: object
      properties:
        chain_type:
          $ref: '#/components/schemas/CustodialWalletChainType'
        provider_user_id:
          type: string
          minLength: 1
          description: >-
            The resource ID of the beneficiary of the custodial wallet, given by
            the licensing provider.
        provider:
          $ref: '#/components/schemas/CustodialWalletProvider'
        owner:
          anyOf:
            - type: object
              properties:
                user_id:
                  type: string
              required:
                - user_id
              additionalProperties: false
            - type: object
              properties:
                public_key:
                  type: string
              required:
                - public_key
              additionalProperties: false
            - type: 'null'
            - type: 'null'
        additional_signers:
          type: array
          items:
            type: object
            properties:
              signer_id:
                type: string
                format: cuid2
              override_policy_ids:
                type: array
                items:
                  type: string
                  format: cuid2
                maxItems: 1
            required:
              - signer_id
            additionalProperties: false
        policy_ids:
          type: array
          items:
            type: string
            format: cuid2
          maxItems: 1
      required:
        - chain_type
        - provider_user_id
        - provider
      additionalProperties: false
      description: The input for creating a custodial wallet.
      title: CustodialWalletCreateInput
      example:
        chain_type: ethereum
        provider: bridge
        provider_user_id: '1234567890'
      x-stainless-model: wallets.custodial_wallet_create_input
    CustodialWallet:
      type: object
      properties:
        id:
          type: string
        address:
          type: string
        chain_type:
          $ref: '#/components/schemas/CustodialWalletChainType'
        custody:
          $ref: '#/components/schemas/WalletCustodian'
        policy_ids:
          type: array
          items:
            type: string
            minLength: 24
            maxLength: 24
        additional_signers:
          type: array
          items:
            type: object
            properties:
              signer_id:
                type: string
                format: cuid2
              override_policy_ids:
                type: array
                items:
                  type: string
                  format: cuid2
                maxItems: 1
            required:
              - signer_id
            additionalProperties: false
        owner_id:
          type:
            - string
            - 'null'
          format: cuid2
      required:
        - id
        - address
        - chain_type
        - custody
        - owner_id
      description: Information about a custodial wallet.
      title: CustodialWallet
      example:
        id: id2tptkqrxd39qo9j423etij
        address: '0xB00F0759DbeeF5E543Cc3E3B07A6442F5f3928a2'
        chain_type: ethereum
        custody:
          provider: bridge
          provider_user_id: '1234567890'
        policy_ids: []
        additional_signers: []
        owner_id: null
      x-stainless-model: wallets.custodial_wallet
    CustodialWalletChainType:
      type: string
      enum:
        - ethereum
      description: The chain type of the custodial wallet.
      title: CustodialWalletChainType
      x-stainless-model: wallets.custodial_wallet_chain_type
    CustodialWalletProvider:
      type: string
      enum:
        - bridge
      description: The provider of the custodial wallet.
      title: CustodialWalletProvider
      x-stainless-model: wallets.custodial_wallet_provider
    WalletCustodian:
      type: object
      properties:
        provider:
          type: string
          description: The custodian responsible for the wallet.
        provider_user_id:
          type: string
          description: The resource ID of the beneficiary of the custodial wallet.
      required:
        - provider
        - provider_user_id
      description: Information about the custodian managing this wallet.
      title: WalletCustodian
      x-stainless-model: wallets.wallet_custodian
  securitySchemes:
    appSecretAuth:
      type: http
      scheme: basic
      description: >-
        Basic Auth header with your app ID as the username and your app secret
        as the password.

````\n