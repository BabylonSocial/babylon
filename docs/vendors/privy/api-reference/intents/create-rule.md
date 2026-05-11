> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Create rule

> Create an intent to add a rule to a policy. The intent must be authorized by the policy owner before it can be executed.



## OpenAPI

````yaml post /v1/intents/policies/{policy_id}/rules
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
  /v1/intents/policies/{policy_id}/rules:
    post:
      tags:
        - Intents
      summary: Create rule intent
      description: >-
        Create an intent to add a rule to a policy. The intent must be
        authorized by the policy owner before it can be executed.
      operationId: createPolicyRule
      parameters:
        - schema:
            type: string
            description: ID of the policy.
          required: true
          name: policy_id
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
              $ref: '#/components/schemas/PolicyRuleRequestBody'
      responses:
        '200':
          description: Created rule intent.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/RuleIntentResponse'
      security:
        - appSecretAuth: []
components:
  schemas:
    PolicyRuleRequestBody:
      type: object
      properties:
        name:
          type: string
          minLength: 1
          maxLength: 50
        method:
          $ref: '#/components/schemas/PolicyMethod'
        conditions:
          type: array
          items:
            $ref: '#/components/schemas/PolicyCondition'
        action:
          $ref: '#/components/schemas/PolicyAction'
      required:
        - name
        - method
        - conditions
        - action
      additionalProperties: false
      description: The rules that apply to each method the policy covers.
      title: PolicyRuleRequestBody
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
    PolicyMethod:
      type: string
      enum:
        - eth_sendTransaction
        - eth_signTransaction
        - eth_signUserOperation
        - eth_signTypedData_v4
        - eth_sign7702Authorization
        - signTransaction
        - signAndSendTransaction
        - exportPrivateKey
        - signTransactionBytes
        - '*'
      description: Method the rule applies to.
    PolicyCondition:
      oneOf:
        - $ref: '#/components/schemas/EthereumTransactionCondition'
        - $ref: '#/components/schemas/EthereumCalldataCondition'
        - $ref: '#/components/schemas/EthereumTypedDataDomainCondition'
        - $ref: '#/components/schemas/EthereumTypedDataMessageCondition'
        - $ref: '#/components/schemas/Ethereum7702AuthorizationCondition'
        - $ref: '#/components/schemas/SolanaProgramInstructionCondition'
        - $ref: '#/components/schemas/SolanaSystemProgramInstructionCondition'
        - $ref: '#/components/schemas/SolanaTokenProgramInstructionCondition'
        - $ref: '#/components/schemas/SystemCondition'
        - $ref: '#/components/schemas/TronTransactionCondition'
        - $ref: '#/components/schemas/SuiTransactionCommandCondition'
        - $ref: '#/components/schemas/SuiTransferObjectsCommandCondition'
      discriminator:
        propertyName: field_source
        mapping:
          ethereum_transaction:
            $ref: '#/components/schemas/EthereumTransactionCondition'
          ethereum_calldata:
            $ref: '#/components/schemas/EthereumCalldataCondition'
          ethereum_typed_data_domain:
            $ref: '#/components/schemas/EthereumTypedDataDomainCondition'
          ethereum_typed_data_message:
            $ref: '#/components/schemas/EthereumTypedDataMessageCondition'
          ethereum_7702_authorization:
            $ref: '#/components/schemas/Ethereum7702AuthorizationCondition'
          solana_program_instruction:
            $ref: '#/components/schemas/SolanaProgramInstructionCondition'
          solana_system_program_instruction:
            $ref: '#/components/schemas/SolanaSystemProgramInstructionCondition'
          solana_token_program_instruction:
            $ref: '#/components/schemas/SolanaTokenProgramInstructionCondition'
          system:
            $ref: '#/components/schemas/SystemCondition'
          tron_transaction:
            $ref: '#/components/schemas/TronTransactionCondition'
          sui_transaction_command:
            $ref: '#/components/schemas/SuiTransactionCommandCondition'
          sui_transfer_objects_command:
            $ref: '#/components/schemas/SuiTransferObjectsCommandCondition'
      description: A condition that must be true for the rule action to be applied.
      title: PolicyCondition
    PolicyAction:
      type: string
      enum:
        - ALLOW
        - DENY
      description: Action to take if the conditions are true.
      title: PolicyAction
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
    EthereumTransactionCondition:
      type: object
      properties:
        field_source:
          type: string
          enum:
            - ethereum_transaction
        field:
          type: string
          enum:
            - to
            - value
            - chain_id
          title: EthereumTransactionConditionField
        operator:
          $ref: '#/components/schemas/ConditionOperator'
        value:
          $ref: '#/components/schemas/ConditionValue'
      required:
        - field_source
        - field
        - operator
        - value
      description: >-
        The verbatim Ethereum transaction object in an eth_signTransaction or
        eth_sendTransaction request.
      title: ethereum_transaction
    EthereumCalldataCondition:
      type: object
      properties:
        field_source:
          type: string
          enum:
            - ethereum_calldata
        field:
          type: string
          title: EthereumCalldataConditionField
        abi:
          type: object
        operator:
          $ref: '#/components/schemas/ConditionOperator'
        value:
          $ref: '#/components/schemas/ConditionValue'
      required:
        - field_source
        - field
        - abi
        - operator
        - value
      description: >-
        The decoded calldata in a smart contract interaction as the smart
        contract method's parameters. Note that that 'ethereum_calldata'
        conditions must contain an abi parameter with the JSON ABI of the smart
        contract.
      title: ethereum_calldata
    EthereumTypedDataDomainCondition:
      type: object
      properties:
        field_source:
          type: string
          enum:
            - ethereum_typed_data_domain
        field:
          type: string
          enum:
            - chainId
            - verifyingContract
          title: EthereumTypedDataDomainConditionField
        operator:
          $ref: '#/components/schemas/ConditionOperator'
        value:
          $ref: '#/components/schemas/ConditionValue'
      required:
        - field_source
        - field
        - operator
        - value
      description: Attributes from the signing domain that will verify the signature.
      title: ethereum_typed_data_domain
    EthereumTypedDataMessageCondition:
      type: object
      properties:
        field_source:
          type: string
          enum:
            - ethereum_typed_data_message
        field:
          type: string
          title: EthereumTypedDataMessageConditionField
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
          $ref: '#/components/schemas/ConditionOperator'
        value:
          $ref: '#/components/schemas/ConditionValue'
      required:
        - field_source
        - field
        - typed_data
        - operator
        - value
      description: >-
        'types' and 'primary_type' attributes of the TypedData JSON object
        defined in EIP-712.
      title: ethereum_typed_data_message
    Ethereum7702AuthorizationCondition:
      type: object
      properties:
        field_source:
          type: string
          enum:
            - ethereum_7702_authorization
        field:
          type: string
          enum:
            - contract
          title: Ethereum7702AuthorizationConditionField
        operator:
          $ref: '#/components/schemas/ConditionOperator'
        value:
          $ref: '#/components/schemas/ConditionValue'
      required:
        - field_source
        - field
        - operator
        - value
      description: Allowed contract addresses for eth_sign7702Authorization requests.
      title: ethereum_7702_authorization
    SolanaProgramInstructionCondition:
      type: object
      properties:
        field_source:
          type: string
          enum:
            - solana_program_instruction
        field:
          type: string
          enum:
            - programId
          title: SolanaProgramInstructionConditionField
        operator:
          $ref: '#/components/schemas/ConditionOperator'
        value:
          $ref: '#/components/schemas/ConditionValue'
      required:
        - field_source
        - field
        - operator
        - value
      description: Solana Program attributes, enables allowlisting Solana Programs.
      title: solana_program_instruction
    SolanaSystemProgramInstructionCondition:
      type: object
      properties:
        field_source:
          type: string
          enum:
            - solana_system_program_instruction
        field:
          type: string
          enum:
            - instructionName
            - Transfer.from
            - Transfer.to
            - Transfer.lamports
          title: SolanaSystemProgramInstructionConditionField
        operator:
          $ref: '#/components/schemas/ConditionOperator'
        value:
          $ref: '#/components/schemas/ConditionValue'
      required:
        - field_source
        - field
        - operator
        - value
      description: >-
        Solana System Program attributes, including more granular Transfer
        instruction fields.
      title: solana_system_program_instruction
    SolanaTokenProgramInstructionCondition:
      type: object
      properties:
        field_source:
          type: string
          enum:
            - solana_token_program_instruction
        field:
          type: string
          enum:
            - instructionName
            - TransferChecked.source
            - TransferChecked.destination
            - TransferChecked.authority
            - TransferChecked.amount
            - TransferChecked.mint
          title: SolanaTokenProgramInstructionConditionField
        operator:
          $ref: '#/components/schemas/ConditionOperator'
        value:
          $ref: '#/components/schemas/ConditionValue'
      required:
        - field_source
        - field
        - operator
        - value
      description: >-
        Solana Token Program attributes, including more granular TransferChecked
        instruction fields.
      title: solana_token_program_instruction
    SystemCondition:
      type: object
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
          $ref: '#/components/schemas/ConditionOperator'
        value:
          $ref: '#/components/schemas/ConditionValue'
      required:
        - field_source
        - field
        - operator
        - value
      description: System attributes, including current unix timestamp (in seconds).
      title: system
    TronTransactionCondition:
      type: object
      properties:
        field_source:
          type: string
          enum:
            - tron_transaction
        field:
          type: string
          enum:
            - TransferContract.to_address
            - TransferContract.amount
            - TriggerSmartContract.contract_address
            - TriggerSmartContract.call_value
            - TriggerSmartContract.token_id
            - TriggerSmartContract.call_token_value
          description: >-
            Supported TRON transaction fields in format
            "TransactionType.field_name"
          title: TronTransactionConditionField
        operator:
          $ref: '#/components/schemas/ConditionOperator'
        value:
          $ref: '#/components/schemas/ConditionValue'
      required:
        - field_source
        - field
        - operator
        - value
      description: >-
        TRON transaction fields for TransferContract and TriggerSmartContract
        transaction types.
      title: TronTransactionCondition
      x-stainless-model: policies.tron_transaction_condition
    SuiTransactionCommandCondition:
      type: object
      properties:
        field_source:
          type: string
          enum:
            - sui_transaction_command
        field:
          type: string
          enum:
            - commandName
          title: SuiTransactionCommandConditionField
        operator:
          $ref: '#/components/schemas/SuiTransactionCommandOperator'
        value:
          anyOf:
            - $ref: '#/components/schemas/SuiCommandName'
            - type: array
              items:
                $ref: '#/components/schemas/SuiCommandName'
          description: >-
            Command name(s) to match. Must be one of: 'TransferObjects',
            'SplitCoins', 'MergeCoins'
      required:
        - field_source
        - field
        - operator
        - value
      additionalProperties: false
      description: >-
        SUI transaction command attributes, enables allowlisting specific
        command types. Allowed commands: 'TransferObjects', 'SplitCoins',
        'MergeCoins'. Only 'eq' and 'in' operators are supported.
      title: SuiTransactionCommandCondition
      x-stainless-model: policies.sui_transaction_command_condition
    SuiTransferObjectsCommandCondition:
      type: object
      properties:
        field_source:
          type: string
          enum:
            - sui_transfer_objects_command
        field:
          $ref: '#/components/schemas/SuiTransferObjectsCommandField'
        operator:
          $ref: '#/components/schemas/ConditionOperator'
        value:
          $ref: '#/components/schemas/ConditionValue'
      required:
        - field_source
        - field
        - operator
        - value
      description: >-
        SUI TransferObjects command attributes, including recipient and amount
        fields.
      title: SuiTransferObjectsCommandCondition
      x-stainless-model: policies.sui_transfer_objects_command_condition
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
    ConditionOperator:
      type: string
      enum:
        - eq
        - gt
        - gte
        - lt
        - lte
        - in
        - in_condition_set
    ConditionValue:
      anyOf:
        - type: string
        - type: array
          items:
            type: string
    SuiTransactionCommandOperator:
      anyOf:
        - type: string
          enum:
            - eq
        - type: string
          enum:
            - in
      description: >-
        Operator to use for SUI transaction command conditions. Only 'eq' and
        'in' are supported for command names.
      title: SuiTransactionCommandOperator
      x-stainless-model: policies.sui_transaction_command_operator
    SuiTransferObjectsCommandField:
      type: string
      enum:
        - recipient
        - amount
      description: >-
        Supported fields for SUI TransferObjects command conditions. Only
        'recipient' and 'amount' are supported.
      title: SuiTransferObjectsCommandField
      x-stainless-model: policies.sui_transfer_objects_command_field
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