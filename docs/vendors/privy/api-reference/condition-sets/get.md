> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Get condition set

> Get a condition set by condition set ID.



## OpenAPI

````yaml get /v1/condition_sets/{condition_set_id}
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
  /v1/condition_sets/{condition_set_id}:
    get:
      tags:
        - Condition sets
      summary: Get Condition Set
      description: Get a condition set by condition set ID.
      operationId: get
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
            description: ID of your Privy app.
          required: true
          name: privy-app-id
          in: header
      responses:
        '200':
          description: Requested condition set object.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ConditionSet'
      security:
        - appSecretAuth: []
components:
  schemas:
    ConditionSet:
      type: object
      properties:
        id:
          type: string
          minLength: 24
          maxLength: 24
          description: >-
            Unique ID of the created condition set. This will be the primary
            identifier when using the condition set in the future.
        name:
          type: string
          minLength: 1
          maxLength: 100
          description: Name of the condition set.
        owner_id:
          type: string
          format: cuid2
          description: The key quorum ID of the owner of the condition set.
        created_at:
          type: number
          description: >-
            Unix timestamp of when the condition set was created in
            milliseconds.
      required:
        - id
        - name
        - owner_id
        - created_at
      example:
        id: qvah5m2hmp9abqlxdmfiht95
        name: Approved Recipients
        owner_id: asgkan0r7gi0wdbvf9cw8qio
        created_at: 1761271537642
  securitySchemes:
    appSecretAuth:
      type: http
      scheme: basic
      description: >-
        Basic Auth header with your app ID as the username and your app secret
        as the password.

````\n