> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Create a terms of service agreement

> Creates a terms of service agreement for a user



## OpenAPI

````yaml post /v1/users/{user_id}/fiat/tos
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
  /v1/users/{user_id}/fiat/tos:
    post:
      tags:
        - Fiat
      summary: Create a terms of service agreement for a user
      description: Creates a terms of service agreement for a user
      parameters:
        - schema:
            type: string
            description: The ID of the user to create a terms of service agreement for
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
              required:
                - provider
              example:
                provider: bridge-sandbox
      responses:
        '200':
          description: >-
            Success message if the terms of service agreement was created
            successfully
          content:
            application/json:
              schema:
                anyOf:
                  - type: object
                    properties:
                      status:
                        type: string
                        enum:
                          - completed
                    required:
                      - status
                  - type: object
                    properties:
                      status:
                        type: string
                        enum:
                          - incomplete
                      url:
                        type: string
                    required:
                      - status
                      - url
                example:
                  status: incomplete
                  url: >-
                    https://dashboard.bridge.xyz/accept-terms-of-service?session_token=a53cd290-0ef6-4ab6-99d2-cd82192e7914
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