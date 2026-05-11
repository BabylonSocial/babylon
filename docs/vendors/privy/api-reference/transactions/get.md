> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Get transaction

> Get a transaction by transaction ID.

### SDK methods

Learn more about fetching transactions using our SDKs [here](/wallets/gas-and-asset-management/assets/fetch-a-transaction).

<Note>
  In August 2025 we migrated transactions to a new data store. As part of this migration, we changed
  the format of transaction IDs from CUID2 to UUIDv4. You may continue using the CUID2 for your
  existing transactions, but we encourage migration to the new UUID, as it will avoid a very slight
  latency increase due to an extra lookup for mapping from the legacy ID to the new ID.
</Note>


## OpenAPI

````yaml get /v1/transactions/{transaction_id}
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
  /v1/transactions/{transaction_id}:
    get:
      tags:
        - Transactions
      summary: Get Transaction
      description: Get a transaction by transaction ID.
      parameters:
        - schema:
            type: string
            description: ID of the transaction.
          required: true
          name: transaction_id
          in: path
        - schema:
            type: string
            description: ID of your Privy app.
          required: true
          name: privy-app-id
          in: header
      responses:
        '200':
          description: Object with transaction data.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Transaction'
      security:
        - appSecretAuth: []
components:
  schemas:
    Transaction:
      type: object
      properties:
        caip2:
          type: string
        transaction_hash:
          type:
            - string
            - 'null'
        status:
          type: string
          enum:
            - broadcasted
            - confirmed
            - execution_reverted
            - failed
            - replaced
            - finalized
            - provider_error
            - pending
        created_at:
          type: number
        sponsored:
          type: boolean
        id:
          type: string
        wallet_id:
          type: string
      required:
        - caip2
        - transaction_hash
        - status
        - created_at
        - id
        - wallet_id
      example:
        id: cm7oxq1el000e11o8iwp7d0d0
        wallet_id: fmfdj6yqly31huorjqzq38zc
        status: confirmed
        transaction_hash: '0x2446f1fd773fbb9f080e674b60c6a033c7ed7427b8b9413cf28a2a4a6da9b56c'
        caip2: eip155:8453
        created_at: 1631573050000
  securitySchemes:
    appSecretAuth:
      type: http
      scheme: basic
      description: >-
        Basic Auth header with your app ID as the username and your app secret
        as the password.

````\n