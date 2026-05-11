> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Get an item from a condition set

> Get an item from a condition set by condition set ID and item ID.



## OpenAPI

````yaml get /v1/condition_sets/{condition_set_id}/condition_set_items/{condition_set_item_id}
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
  /v1/condition_sets/{condition_set_id}/condition_set_items/{condition_set_item_id}:
    get:
      tags:
        - Condition sets
      summary: Get Condition Set Item
      description: Get an item from a condition set by condition set ID and item ID.
      operationId: getItem
      parameters:
        - schema:
            type: string
            minLength: 24
            maxLength: 24
          required: true
          name: condition_set_id
          in: path
        - schema:
            type: string
            minLength: 24
            maxLength: 24
          required: true
          name: condition_set_item_id
          in: path
        - schema:
            type: string
            description: ID of your Privy app.
          required: true
          name: privy-app-id
          in: header
      responses:
        '200':
          description: Success response.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ConditionSetItem'
      security:
        - appSecretAuth: []
components:
  schemas:
    ConditionSetItem:
      type: object
      properties:
        id:
          type: string
          minLength: 24
          maxLength: 24
          description: Unique ID of the created condition set item.
        condition_set_id:
          type: string
          minLength: 24
          maxLength: 24
          description: Unique ID of the condition set this item belongs to.
        value:
          type: string
          description: The value stored in this condition set item.
        created_at:
          type: number
          description: >-
            Unix timestamp of when the condition set item was created in
            milliseconds.
      required:
        - id
        - condition_set_id
        - value
        - created_at
      example:
        id: abc123xyz456def789ghi012
        condition_set_id: qvah5m2hmp9abqlxdmfiht95
        value: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb'
        created_at: 1761271537642
  securitySchemes:
    appSecretAuth:
      type: http
      scheme: basic
      description: >-
        Basic Auth header with your app ID as the username and your app secret
        as the password.

````\n