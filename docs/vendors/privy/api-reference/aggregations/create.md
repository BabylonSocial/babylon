> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Create aggregation

> Create a new aggregation to track and measure metrics over a time window.

### SDK methods

Learn more about creating aggregations and using them in policies [here](/controls/policies/stateful-policies).


## OpenAPI

````yaml post /v1/aggregations
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
  /v1/aggregations:
    post:
      tags:
        - Aggregations
      summary: Create aggregation
      description: >-
        Create a new aggregation to track and measure metrics over a time
        window.
      operationId: createAggregation
      parameters:
        - schema:
            type: string
            description: ID of your Privy app.
          required: true
          name: privy-app-id
          in: header
        - schema:
            type: string
            description: >-
              Idempotency keys ensure API requests are executed only once within
              a 24-hour window.
          required: false
          name: privy-idempotency-key
          in: header
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/AggregationInput'
            example:
              name: Daily ETH transfer limit on Base
              method: eth_signTransaction
              metric:
                field: value
                field_source: ethereum_transaction
                function: sum
              window:
                type: rolling
                seconds: 86400
              conditions:
                - field_source: ethereum_transaction
                  field: chain_id
                  operator: eq
                  value: '84532'
              group_by:
                - field: to
                  field_source: ethereum_transaction
      responses:
        '200':
          description: Created aggregation object.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Aggregation'
      security:
        - appSecretAuth: []
components:
  schemas:
    AggregationInput:
      type: object
      properties:
        name:
          type: string
          minLength: 1
          maxLength: 255
          description: The name of the aggregation.
        method:
          $ref: '#/components/schemas/AggregationMethod'
        metric:
          $ref: '#/components/schemas/AggregationMetric'
        window:
          $ref: '#/components/schemas/AggregationWindow'
        conditions:
          type: array
          items:
            oneOf:
              - type: object
                properties:
                  field_source:
                    type: string
                    enum:
                      - ethereum_transaction
                  field:
                    anyOf:
                      - type: string
                        enum:
                          - to
                      - type: string
                        enum:
                          - value
                      - type: string
                        enum:
                          - chain_id
                  operator:
                    anyOf:
                      - type: string
                        enum:
                          - eq
                      - type: string
                        enum:
                          - gt
                      - type: string
                        enum:
                          - gte
                      - type: string
                        enum:
                          - lt
                      - type: string
                        enum:
                          - lte
                      - type: string
                        enum:
                          - in
                      - type: string
                        enum:
                          - in_condition_set
                  value:
                    anyOf:
                      - type: string
                      - type: array
                        items:
                          type: string
                required:
                  - field_source
                  - field
                  - operator
                  - value
              - type: object
                properties:
                  field_source:
                    type: string
                    enum:
                      - ethereum_calldata
                  field:
                    type: string
                  abi:
                    type: array
                    items:
                      type: object
                      properties:
                        type:
                          type: string
                          enum:
                            - function
                            - constructor
                            - event
                            - fallback
                            - receive
                        name:
                          type: string
                        inputs:
                          type: array
                          items:
                            type: object
                            properties:
                              name:
                                type: string
                              type:
                                type: string
                              components:
                                type: array
                                items:
                                  type: object
                                  description: >-
                                    Nested recursive array of AbiParameter
                                    objects.
                              indexed:
                                type: boolean
                              internalType:
                                type: string
                            required:
                              - type
                        outputs:
                          type: array
                          items:
                            type: object
                            properties:
                              name:
                                type: string
                              type:
                                type: string
                              components:
                                type: array
                                items:
                                  type: object
                                  description: >-
                                    Nested recursive array of AbiParameter
                                    objects.
                              indexed:
                                type: boolean
                              internalType:
                                type: string
                            required:
                              - type
                        stateMutability:
                          type: string
                          enum:
                            - pure
                            - view
                            - nonpayable
                            - payable
                        anonymous:
                          type: boolean
                      required:
                        - type
                    maxItems: 200
                  operator:
                    anyOf:
                      - type: string
                        enum:
                          - eq
                      - type: string
                        enum:
                          - gt
                      - type: string
                        enum:
                          - gte
                      - type: string
                        enum:
                          - lt
                      - type: string
                        enum:
                          - lte
                      - type: string
                        enum:
                          - in
                      - type: string
                        enum:
                          - in_condition_set
                  value:
                    anyOf:
                      - type: string
                      - type: array
                        items:
                          type: string
                required:
                  - field_source
                  - field
                  - abi
                  - operator
                  - value
              - type: object
                properties:
                  field_source:
                    type: string
                    enum:
                      - ethereum_typed_data_domain
                  field:
                    anyOf:
                      - type: string
                        enum:
                          - chainId
                      - type: string
                        enum:
                          - verifyingContract
                      - type: string
                        enum:
                          - chain_id
                      - type: string
                        enum:
                          - verifying_contract
                  operator:
                    anyOf:
                      - type: string
                        enum:
                          - eq
                      - type: string
                        enum:
                          - gt
                      - type: string
                        enum:
                          - gte
                      - type: string
                        enum:
                          - lt
                      - type: string
                        enum:
                          - lte
                      - type: string
                        enum:
                          - in
                      - type: string
                        enum:
                          - in_condition_set
                  value:
                    anyOf:
                      - type: string
                      - type: array
                        items:
                          type: string
                required:
                  - field_source
                  - field
                  - operator
                  - value
              - type: object
                properties:
                  field_source:
                    type: string
                    enum:
                      - ethereum_typed_data_message
                  field:
                    type: string
                  typed_data:
                    type: object
                    properties:
                      types:
                        type: object
                        additionalProperties:
                          type: array
                          items:
                            type: object
                            properties:
                              name:
                                type: string
                              type:
                                type: string
                            required:
                              - name
                              - type
                      primary_type:
                        type: string
                    required:
                      - types
                      - primary_type
                  operator:
                    anyOf:
                      - type: string
                        enum:
                          - eq
                      - type: string
                        enum:
                          - gt
                      - type: string
                        enum:
                          - gte
                      - type: string
                        enum:
                          - lt
                      - type: string
                        enum:
                          - lte
                      - type: string
                        enum:
                          - in
                      - type: string
                        enum:
                          - in_condition_set
                  value:
                    anyOf:
                      - type: string
                      - type: array
                        items:
                          type: string
                required:
                  - field_source
                  - field
                  - typed_data
                  - operator
                  - value
              - type: object
                properties:
                  field_source:
                    type: string
                    enum:
                      - ethereum_7702_authorization
                  field:
                    type: string
                    enum:
                      - contract
                  operator:
                    anyOf:
                      - type: string
                        enum:
                          - eq
                      - type: string
                        enum:
                          - gt
                      - type: string
                        enum:
                          - gte
                      - type: string
                        enum:
                          - lt
                      - type: string
                        enum:
                          - lte
                      - type: string
                        enum:
                          - in
                      - type: string
                        enum:
                          - in_condition_set
                  value:
                    anyOf:
                      - type: string
                      - type: array
                        items:
                          type: string
                required:
                  - field_source
                  - field
                  - operator
                  - value
              - type: object
                properties:
                  field_source:
                    type: string
                    enum:
                      - solana_program_instruction
                  field:
                    type: string
                    enum:
                      - programId
                  operator:
                    anyOf:
                      - type: string
                        enum:
                          - eq
                      - type: string
                        enum:
                          - gt
                      - type: string
                        enum:
                          - gte
                      - type: string
                        enum:
                          - lt
                      - type: string
                        enum:
                          - lte
                      - type: string
                        enum:
                          - in
                      - type: string
                        enum:
                          - in_condition_set
                  value:
                    anyOf:
                      - type: string
                      - type: array
                        items:
                          type: string
                required:
                  - field_source
                  - field
                  - operator
                  - value
              - type: object
                properties:
                  field_source:
                    type: string
                    enum:
                      - solana_system_program_instruction
                  field:
                    anyOf:
                      - type: string
                        enum:
                          - instructionName
                      - type: string
                        enum:
                          - Transfer.from
                      - type: string
                        enum:
                          - Transfer.to
                      - type: string
                        enum:
                          - Transfer.lamports
                  operator:
                    anyOf:
                      - type: string
                        enum:
                          - eq
                      - type: string
                        enum:
                          - gt
                      - type: string
                        enum:
                          - gte
                      - type: string
                        enum:
                          - lt
                      - type: string
                        enum:
                          - lte
                      - type: string
                        enum:
                          - in
                      - type: string
                        enum:
                          - in_condition_set
                  value:
                    anyOf:
                      - type: string
                      - type: array
                        items:
                          type: string
                required:
                  - field_source
                  - field
                  - operator
                  - value
              - type: object
                properties:
                  field_source:
                    type: string
                    enum:
                      - solana_token_program_instruction
                  field:
                    anyOf:
                      - type: string
                        enum:
                          - instructionName
                      - type: string
                        enum:
                          - Transfer.source
                      - type: string
                        enum:
                          - Transfer.destination
                      - type: string
                        enum:
                          - Transfer.authority
                      - type: string
                        enum:
                          - Transfer.amount
                      - type: string
                        enum:
                          - TransferChecked.source
                      - type: string
                        enum:
                          - TransferChecked.destination
                      - type: string
                        enum:
                          - TransferChecked.authority
                      - type: string
                        enum:
                          - TransferChecked.amount
                      - type: string
                        enum:
                          - TransferChecked.mint
                      - type: string
                        enum:
                          - Burn.account
                      - type: string
                        enum:
                          - Burn.mint
                      - type: string
                        enum:
                          - Burn.authority
                      - type: string
                        enum:
                          - Burn.amount
                      - type: string
                        enum:
                          - MintTo.mint
                      - type: string
                        enum:
                          - MintTo.account
                      - type: string
                        enum:
                          - MintTo.authority
                      - type: string
                        enum:
                          - MintTo.amount
                      - type: string
                        enum:
                          - CloseAccount.account
                      - type: string
                        enum:
                          - CloseAccount.destination
                      - type: string
                        enum:
                          - CloseAccount.authority
                      - type: string
                        enum:
                          - InitializeAccount3.account
                      - type: string
                        enum:
                          - InitializeAccount3.mint
                      - type: string
                        enum:
                          - InitializeAccount3.owner
                  operator:
                    anyOf:
                      - type: string
                        enum:
                          - eq
                      - type: string
                        enum:
                          - gt
                      - type: string
                        enum:
                          - gte
                      - type: string
                        enum:
                          - lt
                      - type: string
                        enum:
                          - lte
                      - type: string
                        enum:
                          - in
                      - type: string
                        enum:
                          - in_condition_set
                  value:
                    anyOf:
                      - type: string
                      - type: array
                        items:
                          type: string
                required:
                  - field_source
                  - field
                  - operator
                  - value
              - type: object
                properties:
                  field_source:
                    type: string
                    enum:
                      - tron_transaction
                  field:
                    anyOf:
                      - type: string
                        enum:
                          - TransferContract.to_address
                      - type: string
                        enum:
                          - TransferContract.amount
                      - type: string
                        enum:
                          - TriggerSmartContract.contract_address
                      - type: string
                        enum:
                          - TriggerSmartContract.call_value
                      - type: string
                        enum:
                          - TriggerSmartContract.token_id
                      - type: string
                        enum:
                          - TriggerSmartContract.call_token_value
                  operator:
                    anyOf:
                      - type: string
                        enum:
                          - eq
                      - type: string
                        enum:
                          - gt
                      - type: string
                        enum:
                          - gte
                      - type: string
                        enum:
                          - lt
                      - type: string
                        enum:
                          - lte
                      - type: string
                        enum:
                          - in
                      - type: string
                        enum:
                          - in_condition_set
                  value:
                    anyOf:
                      - type: string
                      - type: array
                        items:
                          type: string
                required:
                  - field_source
                  - field
                  - operator
                  - value
              - type: object
                properties:
                  field_source:
                    type: string
                    enum:
                      - system
                  field:
                    type: string
                    enum:
                      - current_unix_timestamp
                  operator:
                    anyOf:
                      - type: string
                        enum:
                          - eq
                      - type: string
                        enum:
                          - gt
                      - type: string
                        enum:
                          - gte
                      - type: string
                        enum:
                          - lt
                      - type: string
                        enum:
                          - lte
                      - type: string
                        enum:
                          - in
                      - type: string
                        enum:
                          - in_condition_set
                  value:
                    anyOf:
                      - type: string
                      - type: array
                        items:
                          type: string
                required:
                  - field_source
                  - field
                  - operator
                  - value
              - type: object
                properties:
                  field_source:
                    type: string
                    enum:
                      - reference
                  field:
                    type: string
                    pattern: ^aggregation\.
                  operator:
                    anyOf:
                      - type: string
                        enum:
                          - eq
                      - type: string
                        enum:
                          - gt
                      - type: string
                        enum:
                          - gte
                      - type: string
                        enum:
                          - lt
                      - type: string
                        enum:
                          - lte
                      - type: string
                        enum:
                          - in
                      - type: string
                        enum:
                          - in_condition_set
                  value:
                    anyOf:
                      - type: string
                      - type: array
                        items:
                          type: string
                required:
                  - field_source
                  - field
                  - operator
                  - value
              - type: object
                properties:
                  field_source:
                    type: string
                    enum:
                      - tron_trigger_smart_contract_data
                  field:
                    type: string
                  abi:
                    type: array
                    items:
                      type: object
                      properties:
                        type:
                          type: string
                          enum:
                            - function
                            - constructor
                            - event
                            - fallback
                            - receive
                        name:
                          type: string
                        inputs:
                          type: array
                          items:
                            type: object
                            properties:
                              name:
                                type: string
                              type:
                                type: string
                              components:
                                type: array
                                items:
                                  type: object
                                  description: >-
                                    Nested recursive array of AbiParameter
                                    objects.
                              indexed:
                                type: boolean
                              internalType:
                                type: string
                            required:
                              - type
                        outputs:
                          type: array
                          items:
                            type: object
                            properties:
                              name:
                                type: string
                              type:
                                type: string
                              components:
                                type: array
                                items:
                                  type: object
                                  description: >-
                                    Nested recursive array of AbiParameter
                                    objects.
                              indexed:
                                type: boolean
                              internalType:
                                type: string
                            required:
                              - type
                        stateMutability:
                          type: string
                          enum:
                            - pure
                            - view
                            - nonpayable
                            - payable
                        anonymous:
                          type: boolean
                      required:
                        - type
                    maxItems: 200
                  operator:
                    anyOf:
                      - type: string
                        enum:
                          - eq
                      - type: string
                        enum:
                          - gt
                      - type: string
                        enum:
                          - gte
                      - type: string
                        enum:
                          - lt
                      - type: string
                        enum:
                          - lte
                      - type: string
                        enum:
                          - in
                      - type: string
                        enum:
                          - in_condition_set
                  value:
                    anyOf:
                      - type: string
                      - type: array
                        items:
                          type: string
                required:
                  - field_source
                  - field
                  - abi
                  - operator
                  - value
              - type: object
                properties:
                  field_source:
                    type: string
                    enum:
                      - sui_transaction_command
                  field:
                    type: string
                    enum:
                      - commandName
                  operator:
                    anyOf:
                      - type: string
                        enum:
                          - eq
                      - type: string
                        enum:
                          - in
                  value:
                    anyOf:
                      - $ref: '#/components/schemas/SuiCommandName'
                      - type: array
                        items:
                          $ref: '#/components/schemas/SuiCommandName'
                required:
                  - field_source
                  - field
                  - operator
                  - value
                additionalProperties: false
              - type: object
                properties:
                  field_source:
                    type: string
                    enum:
                      - sui_transfer_objects_command
                  field:
                    anyOf:
                      - type: string
                        enum:
                          - recipient
                      - type: string
                        enum:
                          - amount
                  operator:
                    anyOf:
                      - type: string
                        enum:
                          - eq
                      - type: string
                        enum:
                          - gt
                      - type: string
                        enum:
                          - gte
                      - type: string
                        enum:
                          - lt
                      - type: string
                        enum:
                          - lte
                      - type: string
                        enum:
                          - in
                      - type: string
                        enum:
                          - in_condition_set
                  value:
                    anyOf:
                      - type: string
                      - type: array
                        items:
                          type: string
                required:
                  - field_source
                  - field
                  - operator
                  - value
          maxItems: 100
          default: []
          description: Optional conditions to filter events before aggregation.
        group_by:
          type: array
          items:
            $ref: '#/components/schemas/AggregationGroupBy'
          maxItems: 2
          default: []
          description: Optional grouping configuration for bucketing metrics.
        owner:
          $ref: '#/components/schemas/OwnerInput'
        owner_id:
          allOf:
            - $ref: '#/components/schemas/OwnerIdInput'
            - type:
                - string
                - 'null'
      required:
        - name
        - method
        - metric
        - window
      additionalProperties: false
      description: Input for creating an aggregation.
      title: AggregationInput
      x-stainless-model: aggregations.aggregation_input
    Aggregation:
      type: object
      properties:
        name:
          type: string
          minLength: 1
          maxLength: 255
          description: The name of the aggregation.
        method:
          $ref: '#/components/schemas/AggregationMethod'
        metric:
          $ref: '#/components/schemas/AggregationMetric'
        window:
          $ref: '#/components/schemas/AggregationWindow'
        conditions:
          type: array
          items:
            oneOf:
              - type: object
                properties:
                  field_source:
                    type: string
                    enum:
                      - ethereum_transaction
                  field:
                    anyOf:
                      - type: string
                        enum:
                          - to
                      - type: string
                        enum:
                          - value
                      - type: string
                        enum:
                          - chain_id
                  operator:
                    anyOf:
                      - type: string
                        enum:
                          - eq
                      - type: string
                        enum:
                          - gt
                      - type: string
                        enum:
                          - gte
                      - type: string
                        enum:
                          - lt
                      - type: string
                        enum:
                          - lte
                      - type: string
                        enum:
                          - in
                      - type: string
                        enum:
                          - in_condition_set
                  value:
                    anyOf:
                      - type: string
                      - type: array
                        items:
                          type: string
                required:
                  - field_source
                  - field
                  - operator
                  - value
              - type: object
                properties:
                  field_source:
                    type: string
                    enum:
                      - ethereum_calldata
                  field:
                    type: string
                  abi:
                    type: array
                    items:
                      type: object
                      properties:
                        type:
                          type: string
                          enum:
                            - function
                            - constructor
                            - event
                            - fallback
                            - receive
                        name:
                          type: string
                        inputs:
                          type: array
                          items:
                            type: object
                            properties:
                              name:
                                type: string
                              type:
                                type: string
                              components:
                                type: array
                                items:
                                  type: object
                                  description: >-
                                    Nested recursive array of AbiParameter
                                    objects.
                              indexed:
                                type: boolean
                              internalType:
                                type: string
                            required:
                              - type
                        outputs:
                          type: array
                          items:
                            type: object
                            properties:
                              name:
                                type: string
                              type:
                                type: string
                              components:
                                type: array
                                items:
                                  type: object
                                  description: >-
                                    Nested recursive array of AbiParameter
                                    objects.
                              indexed:
                                type: boolean
                              internalType:
                                type: string
                            required:
                              - type
                        stateMutability:
                          type: string
                          enum:
                            - pure
                            - view
                            - nonpayable
                            - payable
                        anonymous:
                          type: boolean
                      required:
                        - type
                    maxItems: 200
                  operator:
                    anyOf:
                      - type: string
                        enum:
                          - eq
                      - type: string
                        enum:
                          - gt
                      - type: string
                        enum:
                          - gte
                      - type: string
                        enum:
                          - lt
                      - type: string
                        enum:
                          - lte
                      - type: string
                        enum:
                          - in
                      - type: string
                        enum:
                          - in_condition_set
                  value:
                    anyOf:
                      - type: string
                      - type: array
                        items:
                          type: string
                required:
                  - field_source
                  - field
                  - abi
                  - operator
                  - value
              - type: object
                properties:
                  field_source:
                    type: string
                    enum:
                      - ethereum_typed_data_domain
                  field:
                    anyOf:
                      - type: string
                        enum:
                          - chainId
                      - type: string
                        enum:
                          - verifyingContract
                      - type: string
                        enum:
                          - chain_id
                      - type: string
                        enum:
                          - verifying_contract
                  operator:
                    anyOf:
                      - type: string
                        enum:
                          - eq
                      - type: string
                        enum:
                          - gt
                      - type: string
                        enum:
                          - gte
                      - type: string
                        enum:
                          - lt
                      - type: string
                        enum:
                          - lte
                      - type: string
                        enum:
                          - in
                      - type: string
                        enum:
                          - in_condition_set
                  value:
                    anyOf:
                      - type: string
                      - type: array
                        items:
                          type: string
                required:
                  - field_source
                  - field
                  - operator
                  - value
              - type: object
                properties:
                  field_source:
                    type: string
                    enum:
                      - ethereum_typed_data_message
                  field:
                    type: string
                  typed_data:
                    type: object
                    properties:
                      types:
                        type: object
                        additionalProperties:
                          type: array
                          items:
                            type: object
                            properties:
                              name:
                                type: string
                              type:
                                type: string
                            required:
                              - name
                              - type
                      primary_type:
                        type: string
                    required:
                      - types
                      - primary_type
                  operator:
                    anyOf:
                      - type: string
                        enum:
                          - eq
                      - type: string
                        enum:
                          - gt
                      - type: string
                        enum:
                          - gte
                      - type: string
                        enum:
                          - lt
                      - type: string
                        enum:
                          - lte
                      - type: string
                        enum:
                          - in
                      - type: string
                        enum:
                          - in_condition_set
                  value:
                    anyOf:
                      - type: string
                      - type: array
                        items:
                          type: string
                required:
                  - field_source
                  - field
                  - typed_data
                  - operator
                  - value
              - type: object
                properties:
                  field_source:
                    type: string
                    enum:
                      - ethereum_7702_authorization
                  field:
                    type: string
                    enum:
                      - contract
                  operator:
                    anyOf:
                      - type: string
                        enum:
                          - eq
                      - type: string
                        enum:
                          - gt
                      - type: string
                        enum:
                          - gte
                      - type: string
                        enum:
                          - lt
                      - type: string
                        enum:
                          - lte
                      - type: string
                        enum:
                          - in
                      - type: string
                        enum:
                          - in_condition_set
                  value:
                    anyOf:
                      - type: string
                      - type: array
                        items:
                          type: string
                required:
                  - field_source
                  - field
                  - operator
                  - value
              - type: object
                properties:
                  field_source:
                    type: string
                    enum:
                      - solana_program_instruction
                  field:
                    type: string
                    enum:
                      - programId
                  operator:
                    anyOf:
                      - type: string
                        enum:
                          - eq
                      - type: string
                        enum:
                          - gt
                      - type: string
                        enum:
                          - gte
                      - type: string
                        enum:
                          - lt
                      - type: string
                        enum:
                          - lte
                      - type: string
                        enum:
                          - in
                      - type: string
                        enum:
                          - in_condition_set
                  value:
                    anyOf:
                      - type: string
                      - type: array
                        items:
                          type: string
                required:
                  - field_source
                  - field
                  - operator
                  - value
              - type: object
                properties:
                  field_source:
                    type: string
                    enum:
                      - solana_system_program_instruction
                  field:
                    anyOf:
                      - type: string
                        enum:
                          - instructionName
                      - type: string
                        enum:
                          - Transfer.from
                      - type: string
                        enum:
                          - Transfer.to
                      - type: string
                        enum:
                          - Transfer.lamports
                  operator:
                    anyOf:
                      - type: string
                        enum:
                          - eq
                      - type: string
                        enum:
                          - gt
                      - type: string
                        enum:
                          - gte
                      - type: string
                        enum:
                          - lt
                      - type: string
                        enum:
                          - lte
                      - type: string
                        enum:
                          - in
                      - type: string
                        enum:
                          - in_condition_set
                  value:
                    anyOf:
                      - type: string
                      - type: array
                        items:
                          type: string
                required:
                  - field_source
                  - field
                  - operator
                  - value
              - type: object
                properties:
                  field_source:
                    type: string
                    enum:
                      - solana_token_program_instruction
                  field:
                    anyOf:
                      - type: string
                        enum:
                          - instructionName
                      - type: string
                        enum:
                          - Transfer.source
                      - type: string
                        enum:
                          - Transfer.destination
                      - type: string
                        enum:
                          - Transfer.authority
                      - type: string
                        enum:
                          - Transfer.amount
                      - type: string
                        enum:
                          - TransferChecked.source
                      - type: string
                        enum:
                          - TransferChecked.destination
                      - type: string
                        enum:
                          - TransferChecked.authority
                      - type: string
                        enum:
                          - TransferChecked.amount
                      - type: string
                        enum:
                          - TransferChecked.mint
                      - type: string
                        enum:
                          - Burn.account
                      - type: string
                        enum:
                          - Burn.mint
                      - type: string
                        enum:
                          - Burn.authority
                      - type: string
                        enum:
                          - Burn.amount
                      - type: string
                        enum:
                          - MintTo.mint
                      - type: string
                        enum:
                          - MintTo.account
                      - type: string
                        enum:
                          - MintTo.authority
                      - type: string
                        enum:
                          - MintTo.amount
                      - type: string
                        enum:
                          - CloseAccount.account
                      - type: string
                        enum:
                          - CloseAccount.destination
                      - type: string
                        enum:
                          - CloseAccount.authority
                      - type: string
                        enum:
                          - InitializeAccount3.account
                      - type: string
                        enum:
                          - InitializeAccount3.mint
                      - type: string
                        enum:
                          - InitializeAccount3.owner
                  operator:
                    anyOf:
                      - type: string
                        enum:
                          - eq
                      - type: string
                        enum:
                          - gt
                      - type: string
                        enum:
                          - gte
                      - type: string
                        enum:
                          - lt
                      - type: string
                        enum:
                          - lte
                      - type: string
                        enum:
                          - in
                      - type: string
                        enum:
                          - in_condition_set
                  value:
                    anyOf:
                      - type: string
                      - type: array
                        items:
                          type: string
                required:
                  - field_source
                  - field
                  - operator
                  - value
              - type: object
                properties:
                  field_source:
                    type: string
                    enum:
                      - tron_transaction
                  field:
                    anyOf:
                      - type: string
                        enum:
                          - TransferContract.to_address
                      - type: string
                        enum:
                          - TransferContract.amount
                      - type: string
                        enum:
                          - TriggerSmartContract.contract_address
                      - type: string
                        enum:
                          - TriggerSmartContract.call_value
                      - type: string
                        enum:
                          - TriggerSmartContract.token_id
                      - type: string
                        enum:
                          - TriggerSmartContract.call_token_value
                  operator:
                    anyOf:
                      - type: string
                        enum:
                          - eq
                      - type: string
                        enum:
                          - gt
                      - type: string
                        enum:
                          - gte
                      - type: string
                        enum:
                          - lt
                      - type: string
                        enum:
                          - lte
                      - type: string
                        enum:
                          - in
                      - type: string
                        enum:
                          - in_condition_set
                  value:
                    anyOf:
                      - type: string
                      - type: array
                        items:
                          type: string
                required:
                  - field_source
                  - field
                  - operator
                  - value
              - type: object
                properties:
                  field_source:
                    type: string
                    enum:
                      - system
                  field:
                    type: string
                    enum:
                      - current_unix_timestamp
                  operator:
                    anyOf:
                      - type: string
                        enum:
                          - eq
                      - type: string
                        enum:
                          - gt
                      - type: string
                        enum:
                          - gte
                      - type: string
                        enum:
                          - lt
                      - type: string
                        enum:
                          - lte
                      - type: string
                        enum:
                          - in
                      - type: string
                        enum:
                          - in_condition_set
                  value:
                    anyOf:
                      - type: string
                      - type: array
                        items:
                          type: string
                required:
                  - field_source
                  - field
                  - operator
                  - value
              - type: object
                properties:
                  field_source:
                    type: string
                    enum:
                      - reference
                  field:
                    type: string
                    pattern: ^aggregation\.
                  operator:
                    anyOf:
                      - type: string
                        enum:
                          - eq
                      - type: string
                        enum:
                          - gt
                      - type: string
                        enum:
                          - gte
                      - type: string
                        enum:
                          - lt
                      - type: string
                        enum:
                          - lte
                      - type: string
                        enum:
                          - in
                      - type: string
                        enum:
                          - in_condition_set
                  value:
                    anyOf:
                      - type: string
                      - type: array
                        items:
                          type: string
                required:
                  - field_source
                  - field
                  - operator
                  - value
              - type: object
                properties:
                  field_source:
                    type: string
                    enum:
                      - tron_trigger_smart_contract_data
                  field:
                    type: string
                  abi:
                    type: array
                    items:
                      type: object
                      properties:
                        type:
                          type: string
                          enum:
                            - function
                            - constructor
                            - event
                            - fallback
                            - receive
                        name:
                          type: string
                        inputs:
                          type: array
                          items:
                            type: object
                            properties:
                              name:
                                type: string
                              type:
                                type: string
                              components:
                                type: array
                                items:
                                  type: object
                                  description: >-
                                    Nested recursive array of AbiParameter
                                    objects.
                              indexed:
                                type: boolean
                              internalType:
                                type: string
                            required:
                              - type
                        outputs:
                          type: array
                          items:
                            type: object
                            properties:
                              name:
                                type: string
                              type:
                                type: string
                              components:
                                type: array
                                items:
                                  type: object
                                  description: >-
                                    Nested recursive array of AbiParameter
                                    objects.
                              indexed:
                                type: boolean
                              internalType:
                                type: string
                            required:
                              - type
                        stateMutability:
                          type: string
                          enum:
                            - pure
                            - view
                            - nonpayable
                            - payable
                        anonymous:
                          type: boolean
                      required:
                        - type
                    maxItems: 200
                  operator:
                    anyOf:
                      - type: string
                        enum:
                          - eq
                      - type: string
                        enum:
                          - gt
                      - type: string
                        enum:
                          - gte
                      - type: string
                        enum:
                          - lt
                      - type: string
                        enum:
                          - lte
                      - type: string
                        enum:
                          - in
                      - type: string
                        enum:
                          - in_condition_set
                  value:
                    anyOf:
                      - type: string
                      - type: array
                        items:
                          type: string
                required:
                  - field_source
                  - field
                  - abi
                  - operator
                  - value
              - type: object
                properties:
                  field_source:
                    type: string
                    enum:
                      - sui_transaction_command
                  field:
                    type: string
                    enum:
                      - commandName
                  operator:
                    anyOf:
                      - type: string
                        enum:
                          - eq
                      - type: string
                        enum:
                          - in
                  value:
                    anyOf:
                      - $ref: '#/components/schemas/SuiCommandName'
                      - type: array
                        items:
                          $ref: '#/components/schemas/SuiCommandName'
                required:
                  - field_source
                  - field
                  - operator
                  - value
                additionalProperties: false
              - type: object
                properties:
                  field_source:
                    type: string
                    enum:
                      - sui_transfer_objects_command
                  field:
                    anyOf:
                      - type: string
                        enum:
                          - recipient
                      - type: string
                        enum:
                          - amount
                  operator:
                    anyOf:
                      - type: string
                        enum:
                          - eq
                      - type: string
                        enum:
                          - gt
                      - type: string
                        enum:
                          - gte
                      - type: string
                        enum:
                          - lt
                      - type: string
                        enum:
                          - lte
                      - type: string
                        enum:
                          - in
                      - type: string
                        enum:
                          - in_condition_set
                  value:
                    anyOf:
                      - type: string
                      - type: array
                        items:
                          type: string
                required:
                  - field_source
                  - field
                  - operator
                  - value
          maxItems: 100
          default: []
          description: Optional conditions to filter events before aggregation.
        group_by:
          type: array
          items:
            $ref: '#/components/schemas/AggregationGroupBy'
          maxItems: 2
          default: []
          description: Optional grouping configuration for bucketing metrics.
        id:
          type: string
          description: Unique ID of the aggregation.
        created_at:
          type: number
          description: Unix timestamp of when the aggregation was created in milliseconds.
        owner_id:
          type:
            - string
            - 'null'
          description: The key quorum ID of the owner of the aggregation.
      required:
        - name
        - method
        - metric
        - window
        - id
        - created_at
        - owner_id
      additionalProperties: false
      description: An aggregation that measures and tracks metrics over a period of time.
      title: Aggregation
      x-stainless-model: aggregations.aggregation
    AggregationMethod:
      type: string
      enum:
        - eth_signTransaction
        - eth_signUserOperation
      description: The RPC method this aggregation applies to.
      title: AggregationMethod
      x-stainless-model: aggregations.aggregation_method
    AggregationMetric:
      type: object
      properties:
        field:
          type: string
        field_source:
          type: string
        abi:
          type: array
          items:
            type: object
            properties:
              type:
                type: string
                enum:
                  - function
                  - constructor
                  - event
                  - fallback
                  - receive
              name:
                type: string
              inputs:
                type: array
                items:
                  type: object
                  properties:
                    name:
                      type: string
                    type:
                      type: string
                    components:
                      type: array
                      items:
                        type: object
                        description: Nested recursive array of AbiParameter objects.
                    indexed:
                      type: boolean
                    internalType:
                      type: string
                  required:
                    - type
              outputs:
                type: array
                items:
                  type: object
                  properties:
                    name:
                      type: string
                    type:
                      type: string
                    components:
                      type: array
                      items:
                        type: object
                        description: Nested recursive array of AbiParameter objects.
                    indexed:
                      type: boolean
                    internalType:
                      type: string
                  required:
                    - type
              stateMutability:
                type: string
                enum:
                  - pure
                  - view
                  - nonpayable
                  - payable
              anonymous:
                type: boolean
            required:
              - type
          maxItems: 200
        function:
          type: string
          enum:
            - sum
          description: The aggregation function to apply.
      required:
        - field
        - field_source
        - function
      additionalProperties: false
      description: >-
        The metric configuration for an aggregation, defining what
        field/field_source to measure and the aggregation function to apply.
      title: AggregationMetric
      x-stainless-model: aggregations.aggregation_metric
    AggregationWindow:
      oneOf:
        - type: object
          properties:
            type:
              type: string
              enum:
                - rolling
            seconds:
              type: integer
              minimum: 3600
              maximum: 259200
              description: Duration of the rolling window in seconds (1-72 hours).
          required:
            - type
            - seconds
          additionalProperties: false
      description: The time window configuration for an aggregation.
      title: AggregationWindow
      x-stainless-model: aggregations.aggregation_window
    SuiCommandName:
      type: string
      enum:
        - TransferObjects
        - SplitCoins
        - MergeCoins
      description: >-
        SUI transaction commands allowlist for raw_sign endpoint policy
        evaluation
      title: SuiCommandName
      x-stainless-model: wallets.sui_command_name
    AggregationGroupBy:
      type: object
      properties:
        field:
          type: string
        field_source:
          type: string
        abi:
          type: array
          items:
            type: object
            properties:
              type:
                type: string
                enum:
                  - function
                  - constructor
                  - event
                  - fallback
                  - receive
              name:
                type: string
              inputs:
                type: array
                items:
                  type: object
                  properties:
                    name:
                      type: string
                    type:
                      type: string
                    components:
                      type: array
                      items:
                        type: object
                        description: Nested recursive array of AbiParameter objects.
                    indexed:
                      type: boolean
                    internalType:
                      type: string
                  required:
                    - type
              outputs:
                type: array
                items:
                  type: object
                  properties:
                    name:
                      type: string
                    type:
                      type: string
                    components:
                      type: array
                      items:
                        type: object
                        description: Nested recursive array of AbiParameter objects.
                    indexed:
                      type: boolean
                    internalType:
                      type: string
                  required:
                    - type
              stateMutability:
                type: string
                enum:
                  - pure
                  - view
                  - nonpayable
                  - payable
              anonymous:
                type: boolean
            required:
              - type
          maxItems: 200
      required:
        - field
        - field_source
      additionalProperties: false
      description: >-
        A grouping configuration for an aggregation. Maximum of 2 group_by
        fields allowed.
      title: AggregationGroupBy
      x-stainless-model: aggregations.aggregation_group_by
    OwnerInput:
      anyOf:
        - type: object
          properties:
            public_key:
              type: string
          required:
            - public_key
          description: >-
            The P-256 public key of the owner of the resource, in base64-encoded
            DER format. If you provide this, do not specify an owner_id as it
            will be generated automatically.
          title: Public key owner
        - type: object
          properties:
            user_id:
              type: string
          required:
            - user_id
          description: >-
            The user ID of the owner of the resource. The user must already
            exist, and this value must start with "did:privy:". If you provide
            this, do not specify an owner_id as it will be generated
            automatically.
          title: User owner
        - type: 'null'
      description: >-
        The owner of the resource. If you provide this, do not specify an
        owner_id as it will be generated automatically. When updating a wallet,
        you can set the owner to null to remove the owner.
    OwnerIdInput:
      type: string
      description: >-
        The key quorum ID to set as the owner of the resource. If you provide
        this, do not specify an owner.
  securitySchemes:
    appSecretAuth:
      type: http
      scheme: basic
      description: >-
        Basic Auth header with your app ID as the username and your app secret
        as the password.

````\n