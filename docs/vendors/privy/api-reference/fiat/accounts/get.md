> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Get fiat accounts

> Returns the IDs of all external fiat accounts (used for offramping) for the user



## OpenAPI

````yaml get /v1/users/{user_id}/fiat/accounts
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
  /v1/users/{user_id}/fiat/accounts:
    get:
      tags:
        - Fiat
      summary: Get user's fiat accounts
      description: >-
        Returns the IDs of all external fiat accounts (used for offramping) for
        the user
      parameters:
        - schema:
            type: string
            description: The ID of the user to get fiat accounts for
          required: true
          name: user_id
          in: path
        - schema:
            $ref: '#/components/schemas/OnrampProvider'
          required: true
          name: provider
          in: query
        - schema:
            type: string
            description: ID of your Privy app.
          required: true
          name: privy-app-id
          in: header
      responses:
        '200':
          description: List of fiat accounts
          content:
            application/json:
              schema:
                type: object
                properties:
                  accounts:
                    type: array
                    items:
                      type: object
                      properties:
                        id:
                          type: string
                        bank_name:
                          type: string
                        currency:
                          type: string
                        account_type:
                          type: string
                        last_4:
                          type: string
                      required:
                        - id
                        - currency
                        - account_type
                required:
                  - accounts
                example:
                  accounts:
                    - id: a068d2dd-743a-4011-9b62-8ad33cc7a7be
                      bank_name: Chase
                      currency: usd
                      account_type: us
                      last_4: '7899'
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