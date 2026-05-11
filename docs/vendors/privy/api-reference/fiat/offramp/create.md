> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Initiate offramp

> Triggers the offramp flow and gets the on-chain address to send funds to



## OpenAPI

````yaml post /v1/users/{user_id}/fiat/offramp
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
  /v1/users/{user_id}/fiat/offramp:
    post:
      tags:
        - Fiat
      summary: Initiate an offramp transaction
      description: Triggers the offramp flow and gets the on-chain address to send funds to
      parameters:
        - schema:
            type: string
            description: The ID of the user initiating the offramp
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
                    from_address:
                      type: string
                  required:
                    - currency
                    - chain
                    - from_address
                destination:
                  type: object
                  properties:
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
                    external_account_id:
                      type: string
                      format: uuid
                  required:
                    - currency
                    - payment_rail
                    - external_account_id
              required:
                - amount
                - provider
                - source
                - destination
              example:
                provider: bridge-sandbox
                amount: '100.00'
                source:
                  currency: usdc
                  chain: base
                  from_address: '0xc24272abc794b973b896715db40a72714a030323'
                destination:
                  currency: usd
                  payment_rail: ach_push
                  external_account_id: a068d2dd-743a-4011-9b62-8ad33cc7a7be
      responses:
        '200':
          description: Deposit instructions for the offramp
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
                  - id
                  - status
                  - deposit_instructions
                example:
                  id: d220bcf7-4ad5-4687-8a61-e51c5875225e
                  status: awaiting_funds
                  deposit_instructions:
                    amount: '100.0'
                    currency: usdc
                    to_address: 0xdeadbeef2usdcbase
                    from_address: '0xc24272abc794b973b896715db40a72714a030323'
                    chain: base
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