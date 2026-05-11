> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Initiate onramp

> Triggers an onramp to the specified recipient blockchain address, returns the bank deposit instructions



## OpenAPI

````yaml post /v1/users/{user_id}/fiat/onramp
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
  /v1/users/{user_id}/fiat/onramp:
    post:
      tags:
        - Fiat
      summary: Initiate an onramp transaction
      description: >-
        Triggers an onramp to the specified recipient blockchain address,
        returns the bank deposit instructions
      parameters:
        - schema:
            type: string
            description: The ID of the user initiating the onramp
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
                amount:
                  type: string
                  minLength: 1
                provider:
                  $ref: '#/components/schemas/OnrampProvider'
                source:
                  type: object
                  properties:
                    payment_rail:
                      type: string
                      enum:
                        - sepa
                        - ach_push
                        - wire
                    currency:
                      type: string
                      enum:
                        - usd
                        - eur
                  required:
                    - payment_rail
                    - currency
                destination:
                  type: object
                  properties:
                    chain:
                      type: string
                      enum:
                        - ethereum
                        - base
                        - arbitrum
                        - polygon
                        - optimism
                    currency:
                      type: string
                      enum:
                        - usdc
                    to_address:
                      type: string
                  required:
                    - chain
                    - currency
                    - to_address
              required:
                - amount
                - provider
                - source
                - destination
              example:
                amount: '100.00'
                provider: bridge-sandbox
                source:
                  currency: usd
                  payment_rail: ach_push
                destination:
                  currency: usdc
                  chain: base
                  to_address: '0x38Bc05d7b69F63D05337829fA5Dc4896F179B5fA'
      responses:
        '200':
          description: Bank deposit instructions for the onramp
          content:
            application/json:
              schema:
                type: object
                properties:
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
                  - id
                  - status
                  - deposit_instructions
                example:
                  id: 3a61a69a-1f20-4113-85f5-997078166729
                  status: awaiting_funds
                  deposit_instructions:
                    payment_rail: ach_push
                    currency: usd
                    amount: '100.0'
                    deposit_message: BRGFU2Z9TJPJXCS7ZZK2
                    bank_account_number: '11223344556677'
                    bank_routing_number: '123456789'
                    bank_beneficiary_name: Bridge Ventures Inc
                    bank_beneficiary_address: 1234 Elm St, Springfield, IL 12345
                    bank_name: Bank of Nowhere
                    bank_address: 1800 North Pole St., Orlando, FL 32801
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