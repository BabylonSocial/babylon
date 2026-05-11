> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Create fiat account

> Sets up external bank account object for the user through the configured default provider. Requires the user to already be KYC'ed.



## OpenAPI

````yaml post /v1/users/{user_id}/fiat/accounts
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
    post:
      tags:
        - Fiat
      summary: Create a fiat account
      description: >-
        Sets up external bank account object for the user through the configured
        default provider. Requires the user to already be KYC'ed.
      parameters:
        - schema:
            type: string
            description: The ID of the user to create the fiat account for
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
                account_owner_name:
                  type: string
                  minLength: 3
                  maxLength: 256
                bank_name:
                  type: string
                  minLength: 3
                  maxLength: 256
                currency:
                  type: string
                  enum:
                    - usd
                    - eur
                iban:
                  type: object
                  properties:
                    account_number:
                      type: string
                      minLength: 1
                    bic:
                      type: string
                      minLength: 1
                    country:
                      type: string
                      minLength: 3
                      maxLength: 3
                  required:
                    - account_number
                    - bic
                    - country
                account:
                  type: object
                  properties:
                    account_number:
                      type: string
                      minLength: 1
                    routing_number:
                      type: string
                      minLength: 9
                      maxLength: 9
                    checking_or_savings:
                      type: string
                      enum:
                        - checking
                        - savings
                  required:
                    - account_number
                    - routing_number
                swift:
                  type: object
                  properties:
                    address:
                      type: object
                      properties:
                        street_line_1:
                          type: string
                          minLength: 1
                        street_line_2:
                          type: string
                          minLength: 1
                        city:
                          type: string
                          minLength: 1
                        postal_code:
                          type: string
                          minLength: 1
                        country:
                          type: string
                          minLength: 3
                          maxLength: 3
                        state:
                          type: string
                          minLength: 1
                          maxLength: 3
                      required:
                        - street_line_1
                        - city
                        - country
                    category:
                      type: string
                      enum:
                        - client
                        - parent_company
                        - subsidiary
                        - supplier
                    purpose_of_funds:
                      type: array
                      items:
                        type: string
                        enum:
                          - intra_group_transfer
                          - invoice_for_goods_and_services
                      minItems: 1
                    short_business_description:
                      type: string
                      minLength: 1
                    account:
                      type: object
                      properties:
                        account_number:
                          type: string
                          minLength: 1
                        bic:
                          type: string
                          minLength: 1
                        country:
                          type: string
                          minLength: 3
                          maxLength: 3
                      required:
                        - account_number
                        - bic
                        - country
                  required:
                    - address
                    - category
                    - purpose_of_funds
                    - short_business_description
                    - account
                address:
                  type: object
                  properties:
                    street_line_1:
                      type: string
                      minLength: 1
                    street_line_2:
                      type: string
                      minLength: 1
                    city:
                      type: string
                      minLength: 1
                    postal_code:
                      type: string
                      minLength: 1
                    country:
                      type: string
                      minLength: 3
                      maxLength: 3
                    state:
                      type: string
                      minLength: 1
                      maxLength: 3
                  required:
                    - street_line_1
                    - city
                    - country
                first_name:
                  type: string
                  minLength: 1
                  maxLength: 1024
                last_name:
                  type: string
                  minLength: 1
                  maxLength: 1024
              required:
                - provider
                - account_owner_name
                - currency
              example:
                provider: bridge-sandbox
                account_owner_name: John Doe
                currency: usd
                bank_name: Chase
                account:
                  account_number: '1234567899'
                  routing_number: '121212121'
                  checking_or_savings: checking
                address:
                  street_line_1: 123 Washington St
                  street_line_2: Apt 2F
                  city: New York
                  state: NY
                  postal_code: '10001'
                  country: USA
                first_name: John
                last_name: Doe
            example:
              provider: bridge-sandbox
              account_owner_name: John Doe
              currency: usd
              bank_name: Chase
              account:
                account_number: '1234567899'
                routing_number: '121212121'
                checking_or_savings: checking
              address:
                street_line_1: 123 Washington St
                street_line_2: Apt 2F
                city: New York
                state: NY
                postal_code: '10001'
                country: USA
              first_name: John
              last_name: Doe
      responses:
        '200':
          description: Created fiat account details
          content:
            application/json:
              schema:
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
                example:
                  id: a068d2dd-743a-4011-9b62-8ad33cc7a7be
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