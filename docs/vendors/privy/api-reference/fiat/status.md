> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Get transactions

> Returns a list of fiat transactions and their statuses



## OpenAPI

````yaml post /v1/users/{user_id}/fiat/status
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
  /v1/users/{user_id}/fiat/status:
    post:
      tags:
        - Fiat
      summary: Get a list of fiat transactions and their statuses
      description: Returns a list of fiat transactions and their statuses
      parameters:
        - schema:
            type: string
            description: The ID of the user
          required: true
          name: user_id
          in: path
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
              type: object
              properties:
                provider:
                  $ref: '#/components/schemas/OnrampProvider'
                tx_hash:
                  type: string
                  pattern: ^0x[0-9a-fA-F]+$
              required:
                - provider
      responses:
        '200':
          description: Bank deposit instructions for the onramp
          content:
            application/json:
              schema:
                type: object
                properties:
                  transactions:
                    type: array
                    items:
                      oneOf:
                        - type: object
                          properties:
                            type:
                              type: string
                              enum:
                                - onramp
                            created_at:
                              type: string
                            destination:
                              type: object
                              properties:
                                chain:
                                  type: string
                                currency:
                                  type: string
                                address:
                                  type: string
                                privy_user_id:
                                  type: string
                              required:
                                - chain
                                - currency
                                - address
                            receipt:
                              type: object
                              properties:
                                final_amount:
                                  type: string
                                transaction_hash:
                                  type: string
                              required:
                                - final_amount
                            is_sandbox:
                              type: boolean
                            id:
                              type: string
                            status:
                              type: string
                              enum:
                                - awaiting_funds
                                - in_review
                                - funds_received
                                - payment_submitted
                                - payment_processed
                                - canceled
                                - error
                                - undeliverable
                                - returned
                                - refunded
                            deposit_instructions:
                              type: object
                              properties:
                                amount:
                                  type: string
                                currency:
                                  type: string
                                  enum:
                                    - usd
                                    - eur
                                payment_rail:
                                  type: string
                                  enum:
                                    - sepa
                                    - ach_push
                                    - wire
                                deposit_message:
                                  type: string
                                bank_name:
                                  type: string
                                bank_account_number:
                                  type: string
                                bank_routing_number:
                                  type: string
                                bank_beneficiary_name:
                                  type: string
                                bank_beneficiary_address:
                                  type: string
                                bank_address:
                                  type: string
                                iban:
                                  type: string
                                bic:
                                  type: string
                                account_holder_name:
                                  type: string
                              required:
                                - amount
                                - currency
                                - payment_rail
                          required:
                            - type
                            - created_at
                            - destination
                            - is_sandbox
                            - id
                            - status
                            - deposit_instructions
                        - type: object
                          properties:
                            type:
                              type: string
                              enum:
                                - offramp
                            created_at:
                              type: string
                            destination:
                              type: object
                              properties:
                                payment_rail:
                                  type: string
                                currency:
                                  type: string
                                external_account_id:
                                  type: string
                              required:
                                - payment_rail
                                - currency
                                - external_account_id
                            receipt:
                              type: object
                              properties:
                                final_amount:
                                  type: string
                                transaction_hash:
                                  type: string
                              required:
                                - final_amount
                            is_sandbox:
                              type: boolean
                            id:
                              type: string
                            status:
                              type: string
                              enum:
                                - awaiting_funds
                                - in_review
                                - funds_received
                                - payment_submitted
                                - payment_processed
                                - canceled
                                - error
                                - undeliverable
                                - returned
                                - refunded
                            deposit_instructions:
                              type: object
                              properties:
                                amount:
                                  type: string
                                currency:
                                  type: string
                                  enum:
                                    - usdc
                                chain:
                                  type: string
                                  enum:
                                    - ethereum
                                    - base
                                    - arbitrum
                                    - polygon
                                    - optimism
                                to_address:
                                  type: string
                                from_address:
                                  type: string
                              required:
                                - amount
                                - currency
                                - chain
                                - to_address
                                - from_address
                          required:
                            - type
                            - created_at
                            - destination
                            - is_sandbox
                            - id
                            - status
                            - deposit_instructions
                required:
                  - transactions
      security:
        - appSecretAuth: []
components:
  schemas:
    OnrampProvider:
      type: string
      enum:
        - bridge
        - bridge-sandbox
      description: Valid set of onramp providers
      title: OnrampProvider
      example: bridge
      x-stainless-model: client_auth.onramp_provider
  securitySchemes:
    appSecretAuth:
      type: http
      scheme: basic
      description: >-
        Basic Auth header with your app ID as the username and your app secret
        as the password.

````\n