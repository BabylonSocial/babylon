> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Update policy

> Update a policy by policy ID.

### SDK methods

Learn more about updating policies using our SDKs [here](/controls/policies/update-a-policy).


## OpenAPI

````yaml patch /v1/policies/{policy_id}
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
  /v1/policies/{policy_id}:
    patch:
      tags:
        - Policies
      summary: Update Policy
      description: Update a policy by policy ID.
      parameters:
        - schema:
            type: string
            minLength: 24
            maxLength: 24
          required: true
          name: policy_id
          in: path
        - schema:
            type: string
            description: ID of your Privy app.
          required: true
          name: privy-app-id
          in: header
        - schema:
            type: string
            description: >-
              Request authorization signature. If multiple signatures are
              required, they should be comma separated.
          required: false
          name: privy-authorization-signature
          in: header
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                name:
                  type: string
                  minLength: 1
                  maxLength: 50
                  description: Name to assign to policy.
                rules:
                  type: array
                  items:
                    $ref: '#/components/schemas/PolicyRuleRequestBody'
                owner:
                  $ref: '#/components/schemas/OwnerInput'
                owner_id:
                  allOf:
                    - $ref: '#/components/schemas/OwnerIdInput'
                    - type:
                        - string
                        - 'null'
              additionalProperties: false
      responses:
        '200':
          description: Updated policy object.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Policy'
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
    Policy:
      type: object
      properties:
        version:
          type: string
          enum:
            - '1.0'
          description: Version of the policy. Currently, 1.0 is the only version.
        name:
          type: string
          minLength: 1
          maxLength: 50
          description: Name to assign to policy.
        chain_type:
          $ref: '#/components/schemas/PolicyChainType'
        id:
          type: string
          minLength: 24
          maxLength: 24
          description: >-
            Unique ID of the created policy. This will be the primary identifier
            when using the policy in the future.
        owner_id:
          type:
            - string
            - 'null'
          format: cuid2
          description: The key quorum ID of the owner of the policy.
        created_at:
          type: number
          description: Unix timestamp of when the policy was created in milliseconds.
        rules:
          type: array
          items:
            $ref: '#/components/schemas/PolicyRuleResponse'
      required:
        - version
        - name
        - chain_type
        - id
        - owner_id
        - created_at
        - rules
      additionalProperties: false
      description: A policy for controlling wallet operations.
      title: Policy
      example:
        id: tb54eps4z44ed0jepousxi4n
        name: Allowlisted stablecoins
        chain_type: ethereum
        rules:
          - id: bdyfoa65pro1eez6iwtzanol
            name: Allowlist USDC contract on Base
            method: eth_sendTransaction
            conditions:
              - field_source: ethereum_transaction
                field: to
                operator: eq
                value: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'
            action: ALLOW
        owner_id: null
        version: '1.0'
        created_at: 1741833088894
      x-stainless-model: policies.policy
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
    PolicyChainType:
      type: string
      enum:
        - ethereum
        - solana
        - tron
        - sui
      description: The chain type the policy applies to.
    PolicyRuleResponse:
      allOf:
        - $ref: '#/components/schemas/PolicyRuleRequestBody'
        - type: object
          properties:
            id:
              type: string
          required:
            - id
          additionalProperties: false
      description: >-
        A rule that defines the conditions and action to take if the conditions
        are true.
      title: PolicyRuleResponse
      example:
        id: rule_123
        name: Allowlist USDC contract on Base
        method: eth_sendTransaction
        conditions:
          - field_source: ethereum_transaction
            field: to
            operator: eq
            value: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'
        action: ALLOW
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
  securitySchemes:
    appSecretAuth:
      type: http
      scheme: basic
      description: >-
        Basic Auth header with your app ID as the username and your app secret
        as the password.

````\n