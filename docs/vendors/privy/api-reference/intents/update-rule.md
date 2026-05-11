> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Update policy rule

> Create an intent to delete a rule from a policy. The intent must be authorized by the policy owner before it can be executed.



## OpenAPI

````yaml post /v1/intents/policies/{policy_id}/rules/{rule_id}
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
  /v1/intents/policies/{policy_id}/rules/{rule_id}:
    post:
      tags:
        - Intents
      summary: Create rule delete intent
      description: >-
        Create an intent to delete a rule from a policy. The intent must be
        authorized by the policy owner before it can be executed.
      operationId: deletePolicyRule
      parameters:
        - schema:
            type: string
            description: ID of the policy.
          required: true
          name: policy_id
          in: path
        - schema:
            type: string
            description: ID of the rule.
          required: true
          name: rule_id
          in: path
        - schema:
            type: string
            description: ID of your Privy app.
          required: true
          name: privy-app-id
          in: header
      responses:
        '200':
          description: Created rule delete intent.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/RuleIntentResponse'
      security:
        - appSecretAuth: []
components:
  schemas:
    RuleIntentResponse:
      type: object
      properties:
        intent_id:
          type: string
          description: Unique ID for the intent
        created_by_display_name:
          type: string
          description: Display name of the user who created the intent
        created_by_id:
          type: string
          description: >-
            ID of the user who created the intent. If undefined, the intent was
            created using the app secret
        created_at:
          type: number
          description: Unix timestamp when the intent was created
        resource_id:
          type: string
          description: ID of the resource being modified (wallet_id, policy_id, etc)
        authorization_details:
          type: array
          items:
            $ref: '#/components/schemas/IntentAuthorization'
          description: >-
            Detailed authorization information including key quorum members,
            thresholds, and signature status
        status:
          $ref: '#/components/schemas/IntentStatus'
        expires_at:
          type: number
          description: Unix timestamp when the intent expires
        rejected_at:
          type: number
          description: >-
            Unix timestamp when the intent was rejected, present when status is
            'rejected'
        dismissed_at:
          type: number
          description: >-
            Unix timestamp when the intent was dismissed, present when status is
            'dismissed'
        dismissal_reason:
          type: string
          description: >-
            Human-readable reason for dismissal, present when status is
            'dismissed'
        intent_type:
          type: string
          enum:
            - RULE
        request_details:
          $ref: '#/components/schemas/RuleIntentRequestDetails'
        current_resource_data:
          type: object
          properties:
            name:
              type: string
              minLength: 1
              maxLength: 50
            method:
              type: string
              enum:
                - eth_sendTransaction
                - eth_signTransaction
                - eth_signTypedData_v4
                - eth_signUserOperation
                - eth_sign7702Authorization
                - signTransaction
                - signAndSendTransaction
                - signTransactionBytes
                - exportPrivateKey
                - '*'
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
            action:
              type: string
              enum:
                - ALLOW
                - DENY
            id:
              type: string
          required:
            - name
            - method
            - conditions
            - action
            - id
          additionalProperties: false
          description: >-
            Current state of the rule before any changes. Undefined for create
            intents or if the rule was deleted
        policy:
          type: object
          properties:
            version:
              type: string
              enum:
                - '1.0'
            name:
              type: string
              minLength: 1
              maxLength: 50
            chain_type:
              $ref: '#/components/schemas/WalletChainType'
            rules:
              type: array
              items:
                type: object
                properties:
                  name:
                    type: string
                    minLength: 1
                    maxLength: 50
                  method:
                    type: string
                    enum:
                      - eth_sendTransaction
                      - eth_signTransaction
                      - eth_signTypedData_v4
                      - eth_signUserOperation
                      - eth_sign7702Authorization
                      - signTransaction
                      - signAndSendTransaction
                      - signTransactionBytes
                      - exportPrivateKey
                      - '*'
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
                  action:
                    type: string
                    enum:
                      - ALLOW
                      - DENY
                  id:
                    type: string
                required:
                  - name
                  - method
                  - conditions
                  - action
                  - id
                additionalProperties: false
            id:
              type: string
            created_at:
              type: number
            owner_id:
              type:
                - string
                - 'null'
              format: cuid2
          required:
            - version
            - name
            - chain_type
            - rules
            - id
            - created_at
            - owner_id
          additionalProperties: false
          description: >-
            Parent policy containing this rule, including sibling rules for
            contextual display
        action_result:
          allOf:
            - $ref: '#/components/schemas/BaseActionResult'
            - type: object
              properties:
                response_body:
                  type: object
                  properties:
                    name:
                      type: string
                      minLength: 1
                      maxLength: 50
                    method:
                      type: string
                      enum:
                        - eth_sendTransaction
                        - eth_signTransaction
                        - eth_signTypedData_v4
                        - eth_signUserOperation
                        - eth_sign7702Authorization
                        - signTransaction
                        - signAndSendTransaction
                        - signTransactionBytes
                        - exportPrivateKey
                        - '*'
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
                    action:
                      type: string
                      enum:
                        - ALLOW
                        - DENY
                    id:
                      type: string
                  required:
                    - name
                    - method
                    - conditions
                    - action
                    - id
                  additionalProperties: false
                prior_state:
                  type: object
                  properties:
                    name:
                      type: string
                      minLength: 1
                      maxLength: 50
                    method:
                      type: string
                      enum:
                        - eth_sendTransaction
                        - eth_signTransaction
                        - eth_signTypedData_v4
                        - eth_signUserOperation
                        - eth_sign7702Authorization
                        - signTransaction
                        - signAndSendTransaction
                        - signTransactionBytes
                        - exportPrivateKey
                        - '*'
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
                    action:
                      type: string
                      enum:
                        - ALLOW
                        - DENY
                    id:
                      type: string
                  required:
                    - name
                    - method
                    - conditions
                    - action
                    - id
                  additionalProperties: false
                  description: >-
                    State of the rule immediately before execution. Undefined
                    for create intents
          description: >-
            Result of rule execution (only present if status is 'executed' or
            'failed')
          title: BaseActionResult
          x-stainless-model: intents.base_action_result
      required:
        - intent_id
        - created_by_display_name
        - created_at
        - resource_id
        - authorization_details
        - status
        - expires_at
        - intent_type
        - request_details
      description: Response for a rule intent
      title: RuleIntentResponse
      x-stainless-model: intents.rule_intent_response
    IntentAuthorization:
      type: object
      properties:
        members:
          type: array
          items:
            $ref: '#/components/schemas/IntentAuthorizationMember'
          description: Members in this authorization quorum
        threshold:
          type: number
          description: Number of signatures required to satisfy this quorum
        display_name:
          type: string
          description: Display name of the key quorum
      required:
        - members
        - threshold
      description: Authorization quorum for an intent
      title: IntentAuthorization
      x-stainless-model: intents.intent_authorization
    IntentStatus:
      type: string
      enum:
        - pending
        - executed
        - failed
        - expired
        - rejected
        - dismissed
      description: Current status of an intent.
      title: IntentStatus
      x-stainless-model: intents.intent_status
    RuleIntentRequestDetails:
      oneOf:
        - type: object
          properties:
            method:
              type: string
              enum:
                - POST
            url:
              type: string
              pattern: >-
                (?:https:\/\/(?:[^/]+\.privy\.io|privy\.io|[^/]+\.privy-preview\.app|privy-preview\.app)(?:\/api)?|http:\/\/localhost(?::\d+)?(?:\/api)?)\/v1\/policies\/[0-9a-z]{24,32}\/rules$
            body:
              type: object
              properties:
                name:
                  type: string
                  minLength: 1
                  maxLength: 50
                method:
                  type: string
                  enum:
                    - eth_sendTransaction
                    - eth_signTransaction
                    - eth_signTypedData_v4
                    - eth_signUserOperation
                    - eth_sign7702Authorization
                    - signTransaction
                    - signAndSendTransaction
                    - signTransactionBytes
                    - exportPrivateKey
                    - '*'
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
                action:
                  type: string
                  enum:
                    - ALLOW
                    - DENY
              required:
                - name
                - method
                - conditions
                - action
              additionalProperties: false
          required:
            - method
            - url
            - body
          additionalProperties: false
        - type: object
          properties:
            method:
              type: string
              enum:
                - PATCH
            url:
              type: string
              pattern: >-
                (?:https:\/\/(?:[^/]+\.privy\.io|privy\.io|[^/]+\.privy-preview\.app|privy-preview\.app)(?:\/api)?|http:\/\/localhost(?::\d+)?(?:\/api)?)\/v1\/policies\/[0-9a-z]{24,32}\/rules\/[0-9a-z]{24,32}$
            body:
              type: object
              properties:
                name:
                  type: string
                  minLength: 1
                  maxLength: 50
                method:
                  type: string
                  enum:
                    - eth_sendTransaction
                    - eth_signTransaction
                    - eth_signTypedData_v4
                    - eth_signUserOperation
                    - eth_sign7702Authorization
                    - signTransaction
                    - signAndSendTransaction
                    - signTransactionBytes
                    - exportPrivateKey
                    - '*'
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
                action:
                  type: string
                  enum:
                    - ALLOW
                    - DENY
              required:
                - name
                - method
                - conditions
                - action
              additionalProperties: false
          required:
            - method
            - url
            - body
          additionalProperties: false
        - type: object
          properties:
            method:
              type: string
              enum:
                - DELETE
            url:
              type: string
              pattern: >-
                (?:https:\/\/(?:[^/]+\.privy\.io|privy\.io|[^/]+\.privy-preview\.app|privy-preview\.app)(?:\/api)?|http:\/\/localhost(?::\d+)?(?:\/api)?)\/v1\/policies\/[0-9a-z]{24,32}\/rules\/[0-9a-z]{24,32}$
            body:
              type: object
              properties: {}
              default: {}
          required:
            - method
            - url
          additionalProperties: false
      description: >-
        The original rule request. Method is POST (create), PATCH (update), or
        DELETE (delete)
      title: RuleIntentRequestDetails
      x-stainless-model: intents.rule_intent_request_details
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
    WalletChainType:
      type: string
      enum:
        - ethereum
        - solana
        - cosmos
        - stellar
        - sui
        - aptos
        - movement
        - tron
        - bitcoin-segwit
        - near
        - ton
        - starknet
        - spark
      description: The wallet chain types.
      title: WalletChainType
      x-stainless-model: wallets.wallet_chain_type
    BaseActionResult:
      type: object
      properties:
        status_code:
          type: number
          description: HTTP status code from the action execution
        executed_at:
          type: number
          description: Unix timestamp when the action was executed
        authorized_by_display_name:
          type: string
          description: Display name of the key quorum that authorized execution
        authorized_by_id:
          type: string
          description: ID of the key quorum that authorized execution
      required:
        - status_code
        - executed_at
      description: Common fields for intent action execution results.
      title: BaseActionResult
      x-stainless-model: intents.base_action_result
    IntentAuthorizationMember:
      oneOf:
        - type: object
          properties:
            type:
              type: string
              enum:
                - user
            user_id:
              type: string
              description: User ID of the key quorum member
            signed_at:
              type:
                - number
                - 'null'
              description: >-
                Unix timestamp when this member signed, or null if not yet
                signed.
          required:
            - type
            - user_id
            - signed_at
          title: User member
        - type: object
          properties:
            type:
              type: string
              enum:
                - key
            public_key:
              type: string
              description: Public key of the key quorum member
            signed_at:
              type:
                - number
                - 'null'
              description: >-
                Unix timestamp when this member signed, or null if not yet
                signed.
          required:
            - type
            - public_key
            - signed_at
          title: Key member
        - type: object
          properties:
            type:
              type: string
              enum:
                - key_quorum
            key_quorum_id:
              type: string
              description: ID of the child key quorum member
            display_name:
              type: string
              description: Display name for the child key quorum (if any)
            threshold_met:
              type: boolean
              description: Whether this child key quorum has met its signature threshold
            threshold:
              type: number
              description: Number of signatures required from this child quorum
            members:
              type: array
              items:
                $ref: '#/components/schemas/IntentAuthorizationKeyQuorumMember'
              description: Members of this child quorum
          required:
            - type
            - key_quorum_id
            - threshold_met
            - threshold
            - members
          title: Key quorum member
      description: >-
        A member of an intent authorization quorum. Can be a user, key, or
        nested key quorum.
      title: IntentAuthorizationMember
      x-stainless-model: intents.intent_authorization_member
    IntentAuthorizationKeyQuorumMember:
      oneOf:
        - type: object
          properties:
            type:
              type: string
              enum:
                - user
            user_id:
              type: string
              description: User ID of the key quorum member
            signed_at:
              type:
                - number
                - 'null'
              description: >-
                Unix timestamp when this member signed, or null if not yet
                signed.
          required:
            - type
            - user_id
            - signed_at
          title: User member
        - type: object
          properties:
            type:
              type: string
              enum:
                - key
            public_key:
              type: string
              description: Public key of the key quorum member
            signed_at:
              type:
                - number
                - 'null'
              description: >-
                Unix timestamp when this member signed, or null if not yet
                signed.
          required:
            - type
            - public_key
            - signed_at
          title: Key member
      description: >-
        A leaf member (user or key) of a nested key quorum in an intent
        authorization.
      title: IntentAuthorizationKeyQuorumMember
      x-stainless-model: intents.intent_authorization_key_quorum_member
  securitySchemes:
    appSecretAuth:
      type: http
      scheme: basic
      description: >-
        Basic Auth header with your app ID as the username and your app secret
        as the password.

````\n