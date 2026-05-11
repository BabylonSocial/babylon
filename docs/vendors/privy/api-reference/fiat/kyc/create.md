> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Start KYC process

> Initiates KYC verification process for a user with the configured provider



## OpenAPI

````yaml post /v1/users/{user_id}/fiat/kyc
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
  /v1/users/{user_id}/fiat/kyc:
    post:
      tags:
        - Fiat
      summary: Initiate KYC verification for a user
      description: >-
        Initiates KYC verification process for a user with the configured
        provider
      parameters:
        - schema:
            type: string
            description: The ID of the user to initiate KYC for
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
              oneOf:
                - type: object
                  properties:
                    provider:
                      type: string
                      enum:
                        - bridge
                    data:
                      type: object
                      properties:
                        type:
                          type: string
                          enum:
                            - individual
                        first_name:
                          type: string
                          minLength: 1
                          maxLength: 1024
                        last_name:
                          type: string
                          minLength: 1
                          maxLength: 1024
                        email:
                          type: string
                          minLength: 1
                          maxLength: 1024
                          format: email
                        residential_address:
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
                            subdivision:
                              type: string
                              minLength: 1
                              maxLength: 3
                            postal_code:
                              type: string
                              minLength: 1
                            country:
                              type: string
                              minLength: 3
                              maxLength: 3
                          required:
                            - street_line_1
                            - city
                            - subdivision
                            - country
                        birth_date:
                          type: string
                          minLength: 10
                          maxLength: 10
                        identifying_information:
                          type: array
                          items:
                            type: object
                            properties:
                              type:
                                type: string
                              issuing_country:
                                type: string
                                minLength: 3
                                maxLength: 3
                              number:
                                type: string
                              description:
                                type: string
                              expiration:
                                type: string
                              image_front:
                                type: string
                              image_back:
                                type: string
                            required:
                              - type
                              - issuing_country
                          minItems: 1
                        ofac_screen:
                          type: object
                          properties:
                            screened_at:
                              type: string
                              pattern: ^\d{4}-\d{2}-\d{2}$
                            result:
                              type: string
                              enum:
                                - passed
                          required:
                            - screened_at
                            - result
                        kyc_screen:
                          type: object
                          properties:
                            screened_at:
                              type: string
                              pattern: ^\d{4}-\d{2}-\d{2}$
                            result:
                              type: string
                              enum:
                                - passed
                          required:
                            - screened_at
                            - result
                        signed_agreement_id:
                          type: string
                          minLength: 1
                          maxLength: 1024
                        middle_name:
                          type: string
                          minLength: 1
                          maxLength: 1024
                        transliterated_first_name:
                          type: string
                          minLength: 1
                          maxLength: 256
                        transliterated_middle_name:
                          type: string
                          minLength: 1
                          maxLength: 256
                        transliterated_last_name:
                          type: string
                          minLength: 1
                          maxLength: 256
                        phone:
                          type: string
                          minLength: 2
                          maxLength: 18
                        transliterated_residential_address:
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
                            subdivision:
                              type: string
                              minLength: 1
                              maxLength: 3
                            postal_code:
                              type: string
                              minLength: 1
                            country:
                              type: string
                              minLength: 3
                              maxLength: 3
                          required:
                            - street_line_1
                            - city
                            - subdivision
                            - country
                        endorsements:
                          type: array
                          items:
                            type: string
                        account_purpose:
                          type: string
                        account_purpose_other:
                          type: string
                        employment_status:
                          type: string
                        expected_monthly_payments_usd:
                          type: string
                        acting_as_intermediary:
                          type: string
                        most_recent_occupation:
                          type: string
                        source_of_funds:
                          type: string
                        nationality:
                          type: string
                          minLength: 3
                          maxLength: 3
                        verified_selfie_at:
                          type: string
                        completed_customer_safety_check_at:
                          type: string
                        documents:
                          type: array
                          items:
                            type: object
                            properties:
                              purposes:
                                type: array
                                items:
                                  type: string
                                  minLength: 1
                                minItems: 1
                              file:
                                type: string
                                minLength: 1
                              description:
                                type: string
                                minLength: 1
                            required:
                              - purposes
                              - file
                        has_signed_terms_of_service:
                          type: boolean
                        has_accepted_terms_of_service:
                          type: boolean
                      required:
                        - type
                        - first_name
                        - last_name
                        - email
                        - residential_address
                        - birth_date
                        - identifying_information
                  required:
                    - provider
                    - data
                - type: object
                  properties:
                    provider:
                      type: string
                      enum:
                        - bridge-sandbox
                    data:
                      type: object
                      properties:
                        type:
                          type: string
                          enum:
                            - individual
                        first_name:
                          type: string
                          minLength: 1
                          maxLength: 1024
                        last_name:
                          type: string
                          minLength: 1
                          maxLength: 1024
                        email:
                          type: string
                          minLength: 1
                          maxLength: 1024
                          format: email
                        residential_address:
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
                            subdivision:
                              type: string
                              minLength: 1
                              maxLength: 3
                            postal_code:
                              type: string
                              minLength: 1
                            country:
                              type: string
                              minLength: 3
                              maxLength: 3
                          required:
                            - street_line_1
                            - city
                            - subdivision
                            - country
                        birth_date:
                          type: string
                          minLength: 10
                          maxLength: 10
                        identifying_information:
                          type: array
                          items:
                            type: object
                            properties:
                              type:
                                type: string
                              issuing_country:
                                type: string
                                minLength: 3
                                maxLength: 3
                              number:
                                type: string
                              description:
                                type: string
                              expiration:
                                type: string
                              image_front:
                                type: string
                              image_back:
                                type: string
                            required:
                              - type
                              - issuing_country
                          minItems: 1
                        ofac_screen:
                          type: object
                          properties:
                            screened_at:
                              type: string
                              pattern: ^\d{4}-\d{2}-\d{2}$
                            result:
                              type: string
                              enum:
                                - passed
                          required:
                            - screened_at
                            - result
                        kyc_screen:
                          type: object
                          properties:
                            screened_at:
                              type: string
                              pattern: ^\d{4}-\d{2}-\d{2}$
                            result:
                              type: string
                              enum:
                                - passed
                          required:
                            - screened_at
                            - result
                        signed_agreement_id:
                          type: string
                          minLength: 1
                          maxLength: 1024
                        middle_name:
                          type: string
                          minLength: 1
                          maxLength: 1024
                        transliterated_first_name:
                          type: string
                          minLength: 1
                          maxLength: 256
                        transliterated_middle_name:
                          type: string
                          minLength: 1
                          maxLength: 256
                        transliterated_last_name:
                          type: string
                          minLength: 1
                          maxLength: 256
                        phone:
                          type: string
                          minLength: 2
                          maxLength: 18
                        transliterated_residential_address:
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
                            subdivision:
                              type: string
                              minLength: 1
                              maxLength: 3
                            postal_code:
                              type: string
                              minLength: 1
                            country:
                              type: string
                              minLength: 3
                              maxLength: 3
                          required:
                            - street_line_1
                            - city
                            - subdivision
                            - country
                        endorsements:
                          type: array
                          items:
                            type: string
                        account_purpose:
                          type: string
                        account_purpose_other:
                          type: string
                        employment_status:
                          type: string
                        expected_monthly_payments_usd:
                          type: string
                        acting_as_intermediary:
                          type: string
                        most_recent_occupation:
                          type: string
                        source_of_funds:
                          type: string
                        nationality:
                          type: string
                          minLength: 3
                          maxLength: 3
                        verified_selfie_at:
                          type: string
                        completed_customer_safety_check_at:
                          type: string
                        documents:
                          type: array
                          items:
                            type: object
                            properties:
                              purposes:
                                type: array
                                items:
                                  type: string
                                  minLength: 1
                                minItems: 1
                              file:
                                type: string
                                minLength: 1
                              description:
                                type: string
                                minLength: 1
                            required:
                              - purposes
                              - file
                        has_signed_terms_of_service:
                          type: boolean
                        has_accepted_terms_of_service:
                          type: boolean
                      required:
                        - type
                        - first_name
                        - last_name
                        - email
                        - residential_address
                        - birth_date
                        - identifying_information
                  required:
                    - provider
                    - data
              example:
                provider: bridge-sandbox
                data:
                  type: individual
                  first_name: John
                  last_name: Doe
                  email: john@doe.com
                  phone: '+59898222122'
                  residential_address:
                    street_line_1: 1234 Lombard Street
                    street_line_2: Apt 2F
                    city: San Francisco
                    subdivision: CA
                    postal_code: '94109'
                    country: USA
                  signed_agreement_id: '123'
                  birth_date: '1989-09-09'
                  identifying_information:
                    - type: ssn
                      number: 111-11-1111
                      issuing_country: USA
                      image_front: data:image/jpeg;base64,/9j/4AAQSkZJRg...
                      image_back: data:image/jpeg;base64,/9j/4AAQSkZJRg...
            example:
              provider: bridge-sandbox
              data:
                type: individual
                first_name: John
                last_name: Doe
                email: john@doe.com
                phone: '+59898222122'
                residential_address:
                  street_line_1: 1234 Lombard Street
                  street_line_2: Apt 2F
                  city: San Francisco
                  subdivision: CA
                  postal_code: '94109'
                  country: USA
                signed_agreement_id: '123'
                birth_date: '1989-09-09'
                identifying_information:
                  - type: ssn
                    number: 111-11-1111
                    issuing_country: USA
                    image_front: data:image/jpeg;base64,/9j/4AAQSkZJRg...
                    image_back: data:image/jpeg;base64,/9j/4AAQSkZJRg...
      responses:
        '200':
          description: KYC verification status
          content:
            application/json:
              schema:
                type: object
                properties:
                  user_id:
                    type: string
                  provider_user_id:
                    type: string
                  status:
                    type: string
                    enum:
                      - not_found
                      - active
                      - awaiting_questionnaire
                      - awaiting_ubo
                      - incomplete
                      - not_started
                      - offboarded
                      - paused
                      - rejected
                      - under_review
                required:
                  - user_id
                  - status
                example:
                  user_id: cmaftdj280001ww1ihwhy57s3
                  provider_user_id: 303912cc-74fa-4f7a-9c51-2945b40ac09a
                  status: under_review
      security:
        - appSecretAuth: []
components:
  securitySchemes:
    appSecretAuth:
      type: http
      scheme: basic
      description: >-
        Basic Auth header with your app ID as the username and your app secret
        as the password.

````\n