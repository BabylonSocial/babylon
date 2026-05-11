> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Create RPC intent

> Create an intent to execute an RPC method on a wallet. The intent must be authorized by either the wallet owner or signers before it can be executed.



## OpenAPI

````yaml post /v1/intents/wallets/{wallet_id}/rpc
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
  /v1/intents/wallets/{wallet_id}/rpc:
    post:
      tags:
        - Intents
      summary: Create RPC intent
      description: >-
        Create an intent to execute an RPC method on a wallet. The intent must
        be authorized by either the wallet owner or signers before it can be
        executed.
      operationId: createRpc
      parameters:
        - schema:
            type: string
            description: ID of the wallet.
          required: true
          name: wallet_id
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
              $ref: '#/components/schemas/WalletRpcRequestBody'
      responses:
        '200':
          description: Created RPC intent.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/RpcIntentResponse'
      security:
        - appSecretAuth: []
components:
  schemas:
    WalletRpcRequestBody:
      oneOf:
        - $ref: '#/components/schemas/EthereumPersonalSignRpcInput'
        - $ref: '#/components/schemas/EthereumSignTypedDataRpcInput'
        - $ref: '#/components/schemas/EthereumSignTransactionRpcInput'
        - $ref: '#/components/schemas/EthereumSignUserOperationRpcInput'
        - $ref: '#/components/schemas/EthereumSendTransactionRpcInput'
        - $ref: '#/components/schemas/EthereumSign7702AuthorizationRpcInput'
        - $ref: '#/components/schemas/EthereumSecp256k1SignRpcInput'
        - $ref: '#/components/schemas/SolanaSignMessageRpcInput'
        - $ref: '#/components/schemas/SolanaSignTransactionRpcInput'
        - $ref: '#/components/schemas/SolanaSignAndSendTransactionRpcInput'
      discriminator:
        propertyName: method
        mapping:
          personal_sign:
            $ref: '#/components/schemas/EthereumPersonalSignRpcInput'
          eth_signTypedData_v4:
            $ref: '#/components/schemas/EthereumSignTypedDataRpcInput'
          eth_signTransaction:
            $ref: '#/components/schemas/EthereumSignTransactionRpcInput'
          eth_signUserOperation:
            $ref: '#/components/schemas/EthereumSignUserOperationRpcInput'
          eth_sendTransaction:
            $ref: '#/components/schemas/EthereumSendTransactionRpcInput'
          eth_sign7702Authorization:
            $ref: '#/components/schemas/EthereumSign7702AuthorizationRpcInput'
          secp256k1_sign:
            $ref: '#/components/schemas/EthereumSecp256k1SignRpcInput'
          signMessage:
            $ref: '#/components/schemas/SolanaSignMessageRpcInput'
          signTransaction:
            $ref: '#/components/schemas/SolanaSignTransactionRpcInput'
          signAndSendTransaction:
            $ref: '#/components/schemas/SolanaSignAndSendTransactionRpcInput'
      description: Request body for wallet RPC operations, discriminated by method.
      title: WalletRpcRequestBody
      x-stainless-model: wallets.wallet_rpc_request_body
    RpcIntentResponse:
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
            - RPC
        request_details:
          type: object
          properties:
            method:
              type: string
              enum:
                - POST
            url:
              type: string
            body:
              anyOf:
                - oneOf:
                    - type: object
                      properties:
                        method:
                          type: string
                          enum:
                            - eth_signTransaction
                        params:
                          type: object
                          properties:
                            transaction:
                              type: object
                              properties:
                                from:
                                  type: string
                                to:
                                  type: string
                                chain_id:
                                  anyOf:
                                    - type: string
                                    - type: integer
                                      minimum: -9007199254740991
                                      maximum: 9007199254740991
                                nonce:
                                  anyOf:
                                    - type: string
                                    - type: integer
                                      minimum: -9007199254740991
                                      maximum: 9007199254740991
                                data:
                                  type: string
                                value:
                                  anyOf:
                                    - type: string
                                    - type: integer
                                      minimum: -9007199254740991
                                      maximum: 9007199254740991
                                type:
                                  anyOf:
                                    - type: number
                                      enum:
                                        - 0
                                    - type: number
                                      enum:
                                        - 1
                                    - type: number
                                      enum:
                                        - 2
                                    - type: number
                                      enum:
                                        - 4
                                gas_limit:
                                  anyOf:
                                    - type: string
                                    - type: integer
                                      minimum: -9007199254740991
                                      maximum: 9007199254740991
                                gas_price:
                                  anyOf:
                                    - type: string
                                    - type: integer
                                      minimum: -9007199254740991
                                      maximum: 9007199254740991
                                max_fee_per_gas:
                                  anyOf:
                                    - type: string
                                    - type: integer
                                      minimum: -9007199254740991
                                      maximum: 9007199254740991
                                max_priority_fee_per_gas:
                                  anyOf:
                                    - type: string
                                    - type: integer
                                      minimum: -9007199254740991
                                      maximum: 9007199254740991
                                authorization_list:
                                  type: array
                                  items:
                                    type: object
                                    properties:
                                      contract:
                                        type: string
                                      chain_id:
                                        anyOf:
                                          - type: string
                                          - type: integer
                                            minimum: -9007199254740991
                                            maximum: 9007199254740991
                                      nonce:
                                        anyOf:
                                          - type: string
                                          - type: integer
                                            minimum: -9007199254740991
                                            maximum: 9007199254740991
                                      r:
                                        type: string
                                      s:
                                        type: string
                                      y_parity:
                                        type: number
                                    required:
                                      - contract
                                      - chain_id
                                      - nonce
                                      - r
                                      - s
                                      - y_parity
                                  maxItems: 10
                              additionalProperties: false
                          required:
                            - transaction
                          additionalProperties: false
                        address:
                          type: string
                        chain_type:
                          type: string
                          enum:
                            - ethereum
                        wallet_id:
                          type: string
                      required:
                        - method
                        - params
                      additionalProperties: false
                    - type: object
                      properties:
                        method:
                          type: string
                          enum:
                            - eth_sendTransaction
                        caip2:
                          type: string
                          pattern: ^[-a-z0-9]{3,8}:[-_a-zA-Z0-9]{1,32}$
                        params:
                          type: object
                          properties:
                            transaction:
                              type: object
                              properties:
                                from:
                                  type: string
                                to:
                                  type: string
                                chain_id:
                                  anyOf:
                                    - type: string
                                    - type: integer
                                      minimum: -9007199254740991
                                      maximum: 9007199254740991
                                nonce:
                                  anyOf:
                                    - type: string
                                    - type: integer
                                      minimum: -9007199254740991
                                      maximum: 9007199254740991
                                data:
                                  type: string
                                value:
                                  anyOf:
                                    - type: string
                                    - type: integer
                                      minimum: -9007199254740991
                                      maximum: 9007199254740991
                                type:
                                  anyOf:
                                    - type: number
                                      enum:
                                        - 0
                                    - type: number
                                      enum:
                                        - 1
                                    - type: number
                                      enum:
                                        - 2
                                    - type: number
                                      enum:
                                        - 4
                                gas_limit:
                                  anyOf:
                                    - type: string
                                    - type: integer
                                      minimum: -9007199254740991
                                      maximum: 9007199254740991
                                gas_price:
                                  anyOf:
                                    - type: string
                                    - type: integer
                                      minimum: -9007199254740991
                                      maximum: 9007199254740991
                                max_fee_per_gas:
                                  anyOf:
                                    - type: string
                                    - type: integer
                                      minimum: -9007199254740991
                                      maximum: 9007199254740991
                                max_priority_fee_per_gas:
                                  anyOf:
                                    - type: string
                                    - type: integer
                                      minimum: -9007199254740991
                                      maximum: 9007199254740991
                                authorization_list:
                                  type: array
                                  items:
                                    type: object
                                    properties:
                                      contract:
                                        type: string
                                      chain_id:
                                        anyOf:
                                          - type: string
                                          - type: integer
                                            minimum: -9007199254740991
                                            maximum: 9007199254740991
                                      nonce:
                                        anyOf:
                                          - type: string
                                          - type: integer
                                            minimum: -9007199254740991
                                            maximum: 9007199254740991
                                      r:
                                        type: string
                                      s:
                                        type: string
                                      y_parity:
                                        type: number
                                    required:
                                      - contract
                                      - chain_id
                                      - nonce
                                      - r
                                      - s
                                      - y_parity
                                  maxItems: 10
                              additionalProperties: false
                          required:
                            - transaction
                          additionalProperties: false
                        sponsor:
                          type: boolean
                        address:
                          type: string
                        chain_type:
                          type: string
                          enum:
                            - ethereum
                        wallet_id:
                          type: string
                      required:
                        - method
                        - caip2
                        - params
                      additionalProperties: false
                    - type: object
                      properties:
                        method:
                          type: string
                          enum:
                            - personal_sign
                        params:
                          type: object
                          properties:
                            message:
                              type: string
                            encoding:
                              anyOf:
                                - type: string
                                  enum:
                                    - utf-8
                                - type: string
                                  enum:
                                    - hex
                          required:
                            - message
                            - encoding
                          additionalProperties: false
                        address:
                          type: string
                        chain_type:
                          type: string
                          enum:
                            - ethereum
                        wallet_id:
                          type: string
                      required:
                        - method
                        - params
                      additionalProperties: false
                    - type: object
                      properties:
                        method:
                          type: string
                          enum:
                            - eth_signTypedData_v4
                        params:
                          type: object
                          properties:
                            typed_data:
                              type: object
                              properties:
                                domain:
                                  type: object
                                  additionalProperties: {}
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
                                message:
                                  type: object
                                  additionalProperties: {}
                                primary_type:
                                  type: string
                              required:
                                - domain
                                - types
                                - message
                                - primary_type
                              additionalProperties: false
                          required:
                            - typed_data
                          additionalProperties: false
                        address:
                          type: string
                        chain_type:
                          type: string
                          enum:
                            - ethereum
                        wallet_id:
                          type: string
                      required:
                        - method
                        - params
                      additionalProperties: false
                    - type: object
                      properties:
                        method:
                          type: string
                          enum:
                            - secp256k1_sign
                        params:
                          type: object
                          properties:
                            hash:
                              type: string
                          required:
                            - hash
                          additionalProperties: false
                        address:
                          type: string
                        chain_type:
                          type: string
                          enum:
                            - ethereum
                        wallet_id:
                          type: string
                      required:
                        - method
                        - params
                      additionalProperties: false
                    - type: object
                      properties:
                        method:
                          type: string
                          enum:
                            - eth_sign7702Authorization
                        params:
                          type: object
                          properties:
                            contract:
                              type: string
                            chain_id:
                              anyOf:
                                - type: string
                                - type: integer
                                  minimum: -9007199254740991
                                  maximum: 9007199254740991
                            nonce:
                              anyOf:
                                - type: string
                                - type: integer
                                  minimum: -9007199254740991
                                  maximum: 9007199254740991
                          required:
                            - contract
                            - chain_id
                          additionalProperties: false
                        address:
                          type: string
                        chain_type:
                          type: string
                          enum:
                            - ethereum
                        wallet_id:
                          type: string
                      required:
                        - method
                        - params
                      additionalProperties: false
                    - type: object
                      properties:
                        method:
                          type: string
                          enum:
                            - eth_signUserOperation
                        params:
                          type: object
                          properties:
                            contract:
                              type: string
                            user_operation:
                              type: object
                              properties:
                                sender:
                                  type: string
                                nonce:
                                  type: string
                                call_data:
                                  type: string
                                paymaster:
                                  type: string
                                paymaster_data:
                                  type: string
                                paymaster_post_op_gas_limit:
                                  type: string
                                paymaster_verification_gas_limit:
                                  type: string
                                max_priority_fee_per_gas:
                                  type: string
                                max_fee_per_gas:
                                  type: string
                                call_gas_limit:
                                  type: string
                                verification_gas_limit:
                                  type: string
                                pre_verification_gas:
                                  type: string
                              required:
                                - sender
                                - nonce
                                - call_data
                                - paymaster
                                - paymaster_data
                                - paymaster_post_op_gas_limit
                                - paymaster_verification_gas_limit
                                - max_priority_fee_per_gas
                                - max_fee_per_gas
                                - call_gas_limit
                                - verification_gas_limit
                                - pre_verification_gas
                              additionalProperties: false
                            chain_id:
                              anyOf:
                                - type: string
                                - type: integer
                                  minimum: -9007199254740991
                                  maximum: 9007199254740991
                          required:
                            - contract
                            - user_operation
                            - chain_id
                          additionalProperties: false
                        address:
                          type: string
                        chain_type:
                          type: string
                          enum:
                            - ethereum
                        wallet_id:
                          type: string
                      required:
                        - method
                        - params
                      additionalProperties: false
                - oneOf:
                    - type: object
                      properties:
                        method:
                          type: string
                          enum:
                            - signTransaction
                        params:
                          type: object
                          properties:
                            transaction:
                              type: string
                            encoding:
                              type: string
                              enum:
                                - base64
                          required:
                            - transaction
                            - encoding
                          additionalProperties: false
                        address:
                          type: string
                        chain_type:
                          type: string
                          enum:
                            - solana
                        wallet_id:
                          type: string
                      required:
                        - method
                        - params
                      additionalProperties: false
                    - type: object
                      properties:
                        method:
                          type: string
                          enum:
                            - signAndSendTransaction
                        caip2:
                          type: string
                          pattern: ^[-a-z0-9]{3,8}:[-_a-zA-Z0-9]{1,32}$
                        params:
                          type: object
                          properties:
                            transaction:
                              type: string
                            encoding:
                              type: string
                              enum:
                                - base64
                          required:
                            - transaction
                            - encoding
                          additionalProperties: false
                        sponsor:
                          type: boolean
                        address:
                          type: string
                        chain_type:
                          type: string
                          enum:
                            - solana
                        wallet_id:
                          type: string
                      required:
                        - method
                        - caip2
                        - params
                      additionalProperties: false
                    - type: object
                      properties:
                        method:
                          type: string
                          enum:
                            - signMessage
                        params:
                          type: object
                          properties:
                            message:
                              type: string
                            encoding:
                              type: string
                              enum:
                                - base64
                          required:
                            - message
                            - encoding
                          additionalProperties: false
                        address:
                          type: string
                        chain_type:
                          type: string
                          enum:
                            - solana
                        wallet_id:
                          type: string
                      required:
                        - method
                        - params
                      additionalProperties: false
                - type: object
                  properties:
                    address:
                      type: string
                    method:
                      type: string
                      enum:
                        - exportPrivateKey
                    params:
                      type: object
                      properties:
                        encryption_type:
                          type: string
                          enum:
                            - HPKE
                        recipient_public_key:
                          anyOf:
                            - type: string
                              pattern: >-
                                ^-----BEGIN PUBLIC
                                KEY-----\n[A-Za-z0-9+/=\n]+-----END PUBLIC
                                KEY-----\n$
                            - type: string
                              pattern: ^[A-Za-z0-9+/=]+$
                        export_type:
                          type: string
                          enum:
                            - display
                            - client
                      required:
                        - encryption_type
                        - recipient_public_key
                      additionalProperties: false
                  required:
                    - address
                    - method
                    - params
                  additionalProperties: false
                - oneOf:
                    - type: object
                      properties:
                        method:
                          type: string
                          enum:
                            - transfer
                        params:
                          type: object
                          properties:
                            receiver_spark_address:
                              type: string
                            amount_sats:
                              type: number
                          required:
                            - receiver_spark_address
                            - amount_sats
                          additionalProperties: false
                        network:
                          type: string
                          enum:
                            - MAINNET
                            - REGTEST
                          default: MAINNET
                      required:
                        - method
                        - params
                      additionalProperties: false
                    - type: object
                      properties:
                        method:
                          type: string
                          enum:
                            - getBalance
                        network:
                          type: string
                          enum:
                            - MAINNET
                            - REGTEST
                          default: MAINNET
                      required:
                        - method
                      additionalProperties: false
                    - type: object
                      properties:
                        method:
                          type: string
                          enum:
                            - transferTokens
                        params:
                          type: object
                          properties:
                            token_identifier:
                              type: string
                            token_amount:
                              type: number
                            receiver_spark_address:
                              type: string
                            output_selection_strategy:
                              type: string
                              enum:
                                - SMALL_FIRST
                                - LARGE_FIRST
                            selected_outputs:
                              type: array
                              items:
                                type: object
                                properties:
                                  output:
                                    type: object
                                    properties:
                                      id:
                                        type: string
                                      owner_public_key:
                                        type: string
                                      revocation_commitment:
                                        type: string
                                      withdraw_bond_sats:
                                        type: number
                                      withdraw_relative_block_locktime:
                                        type: number
                                      token_public_key:
                                        type: string
                                      token_identifier:
                                        type: string
                                      token_amount:
                                        type: string
                                    required:
                                      - owner_public_key
                                      - token_amount
                                  previous_transaction_hash:
                                    type: string
                                  previous_transaction_vout:
                                    type: number
                                required:
                                  - previous_transaction_hash
                                  - previous_transaction_vout
                          required:
                            - token_identifier
                            - token_amount
                            - receiver_spark_address
                          additionalProperties: false
                        network:
                          type: string
                          enum:
                            - MAINNET
                            - REGTEST
                          default: MAINNET
                      required:
                        - method
                        - params
                      additionalProperties: false
                    - type: object
                      properties:
                        method:
                          type: string
                          enum:
                            - getStaticDepositAddress
                        network:
                          type: string
                          enum:
                            - MAINNET
                            - REGTEST
                          default: MAINNET
                      required:
                        - method
                      additionalProperties: false
                    - type: object
                      properties:
                        method:
                          type: string
                          enum:
                            - getClaimStaticDepositQuote
                        params:
                          type: object
                          properties:
                            transaction_id:
                              type: string
                            output_index:
                              type: number
                          required:
                            - transaction_id
                          additionalProperties: false
                        network:
                          type: string
                          enum:
                            - MAINNET
                            - REGTEST
                          default: MAINNET
                      required:
                        - method
                        - params
                      additionalProperties: false
                    - type: object
                      properties:
                        method:
                          type: string
                          enum:
                            - claimStaticDeposit
                        params:
                          type: object
                          properties:
                            transaction_id:
                              type: string
                            output_index:
                              type: number
                            credit_amount_sats:
                              type: number
                            signature:
                              type: string
                          required:
                            - transaction_id
                            - credit_amount_sats
                            - signature
                          additionalProperties: false
                        network:
                          type: string
                          enum:
                            - MAINNET
                            - REGTEST
                          default: MAINNET
                      required:
                        - method
                        - params
                      additionalProperties: false
                    - type: object
                      properties:
                        method:
                          type: string
                          enum:
                            - createLightningInvoice
                        params:
                          type: object
                          properties:
                            amount_sats:
                              type: number
                            memo:
                              type: string
                            expiry_seconds:
                              type: number
                            include_spark_address:
                              type: boolean
                            receiver_identity_pubkey:
                              type: string
                            description_hash:
                              type: string
                          required:
                            - amount_sats
                          additionalProperties: false
                        network:
                          type: string
                          enum:
                            - MAINNET
                            - REGTEST
                          default: MAINNET
                      required:
                        - method
                        - params
                      additionalProperties: false
                    - type: object
                      properties:
                        method:
                          type: string
                          enum:
                            - payLightningInvoice
                        params:
                          type: object
                          properties:
                            invoice:
                              type: string
                            max_fee_sats:
                              type: number
                            prefer_spark:
                              type: boolean
                            amount_sats_to_send:
                              type: number
                          required:
                            - invoice
                            - max_fee_sats
                          additionalProperties: false
                        network:
                          type: string
                          enum:
                            - MAINNET
                            - REGTEST
                          default: MAINNET
                      required:
                        - method
                        - params
                      additionalProperties: false
                    - type: object
                      properties:
                        method:
                          type: string
                          enum:
                            - signMessageWithIdentityKey
                        params:
                          type: object
                          properties:
                            message:
                              type: string
                            compact:
                              type: boolean
                          required:
                            - message
                          additionalProperties: false
                        network:
                          type: string
                          enum:
                            - MAINNET
                            - REGTEST
                          default: MAINNET
                      required:
                        - method
                        - params
                      additionalProperties: false
          required:
            - method
            - url
            - body
          description: The original RPC request that would be sent to the wallet endpoint
        current_resource_data:
          type: object
          properties:
            id:
              type: string
            address:
              type: string
            public_key:
              type: string
            created_at:
              type: number
            exported_at:
              type:
                - number
                - 'null'
            imported_at:
              type:
                - number
                - 'null'
            chain_type:
              $ref: '#/components/schemas/WalletChainType'
            policy_ids:
              type: array
              items:
                type: string
            authorization_threshold:
              type: number
            additional_signers:
              type: array
              items:
                type: object
                properties:
                  signer_id:
                    type: string
                    format: cuid2
                  override_policy_ids:
                    type: array
                    items:
                      type: string
                required:
                  - signer_id
            owner_id:
              type:
                - string
                - 'null'
              format: cuid2
            custody:
              $ref: '#/components/schemas/WalletCustodian'
            custodian:
              type: object
              properties:
                name:
                  type: string
              required:
                - name
          required:
            - id
            - address
            - created_at
            - exported_at
            - imported_at
            - chain_type
            - policy_ids
            - additional_signers
            - owner_id
          description: >-
            Current state of the wallet before any changes. If undefined, the
            resource was deleted and no longer exists
        action_result:
          allOf:
            - $ref: '#/components/schemas/BaseActionResult'
            - type: object
              properties:
                response_body:
                  oneOf:
                    - type: object
                      properties:
                        method:
                          type: string
                          enum:
                            - signTransaction
                        data:
                          type: object
                          properties:
                            signed_transaction:
                              type: string
                            encoding:
                              type: string
                              enum:
                                - base64
                          required:
                            - signed_transaction
                            - encoding
                      required:
                        - method
                        - data
                    - type: object
                      properties:
                        method:
                          type: string
                          enum:
                            - signAndSendTransaction
                        data:
                          type: object
                          properties:
                            transaction_id:
                              type: string
                            hash:
                              type: string
                            caip2:
                              type: string
                              pattern: ^[-a-z0-9]{3,8}:[-_a-zA-Z0-9]{1,32}$
                          required:
                            - hash
                            - caip2
                      required:
                        - method
                        - data
                    - type: object
                      properties:
                        method:
                          type: string
                          enum:
                            - signMessage
                        data:
                          type: object
                          properties:
                            signature:
                              type: string
                            encoding:
                              type: string
                              enum:
                                - base64
                          required:
                            - signature
                            - encoding
                      required:
                        - method
                        - data
                    - type: object
                      properties:
                        method:
                          type: string
                          enum:
                            - eth_signTransaction
                        data:
                          type: object
                          properties:
                            signed_transaction:
                              type: string
                            encoding:
                              type: string
                              enum:
                                - rlp
                          required:
                            - signed_transaction
                            - encoding
                      required:
                        - method
                        - data
                    - type: object
                      properties:
                        method:
                          type: string
                          enum:
                            - eth_sendTransaction
                        data:
                          type: object
                          properties:
                            transaction_id:
                              type: string
                            hash:
                              type: string
                            caip2:
                              type: string
                              pattern: ^[-a-z0-9]{3,8}:[-_a-zA-Z0-9]{1,32}$
                            transaction_request:
                              type: object
                              properties:
                                from:
                                  type: string
                                to:
                                  type: string
                                chain_id:
                                  anyOf:
                                    - type: string
                                    - type: integer
                                      minimum: -9007199254740991
                                      maximum: 9007199254740991
                                nonce:
                                  anyOf:
                                    - type: string
                                    - type: integer
                                      minimum: -9007199254740991
                                      maximum: 9007199254740991
                                data:
                                  type: string
                                value:
                                  anyOf:
                                    - type: string
                                    - type: integer
                                      minimum: -9007199254740991
                                      maximum: 9007199254740991
                                type:
                                  anyOf:
                                    - type: number
                                      enum:
                                        - 0
                                    - type: number
                                      enum:
                                        - 1
                                    - type: number
                                      enum:
                                        - 2
                                    - type: number
                                      enum:
                                        - 4
                                gas_limit:
                                  anyOf:
                                    - type: string
                                    - type: integer
                                      minimum: -9007199254740991
                                      maximum: 9007199254740991
                                gas_price:
                                  anyOf:
                                    - type: string
                                    - type: integer
                                      minimum: -9007199254740991
                                      maximum: 9007199254740991
                                max_fee_per_gas:
                                  anyOf:
                                    - type: string
                                    - type: integer
                                      minimum: -9007199254740991
                                      maximum: 9007199254740991
                                max_priority_fee_per_gas:
                                  anyOf:
                                    - type: string
                                    - type: integer
                                      minimum: -9007199254740991
                                      maximum: 9007199254740991
                                authorization_list:
                                  type: array
                                  items:
                                    type: object
                                    properties:
                                      contract:
                                        type: string
                                      chain_id:
                                        anyOf:
                                          - type: string
                                          - type: integer
                                            minimum: -9007199254740991
                                            maximum: 9007199254740991
                                      nonce:
                                        anyOf:
                                          - type: string
                                          - type: integer
                                            minimum: -9007199254740991
                                            maximum: 9007199254740991
                                      r:
                                        type: string
                                      s:
                                        type: string
                                      y_parity:
                                        type: number
                                    required:
                                      - contract
                                      - chain_id
                                      - nonce
                                      - r
                                      - s
                                      - y_parity
                                  maxItems: 10
                              additionalProperties: false
                            user_operation_hash:
                              type: string
                          required:
                            - hash
                            - caip2
                      required:
                        - method
                        - data
                    - type: object
                      properties:
                        method:
                          type: string
                          enum:
                            - personal_sign
                        data:
                          type: object
                          properties:
                            signature:
                              type: string
                            encoding:
                              type: string
                              enum:
                                - hex
                          required:
                            - signature
                            - encoding
                      required:
                        - method
                        - data
                    - type: object
                      properties:
                        method:
                          type: string
                          enum:
                            - secp256k1_sign
                        data:
                          type: object
                          properties:
                            signature:
                              type: string
                            encoding:
                              type: string
                              enum:
                                - hex
                          required:
                            - signature
                            - encoding
                      required:
                        - method
                        - data
                    - type: object
                      properties:
                        method:
                          type: string
                          enum:
                            - eth_sign7702Authorization
                        data:
                          type: object
                          properties:
                            authorization:
                              type: object
                              properties:
                                contract:
                                  type: string
                                chain_id:
                                  anyOf:
                                    - type: string
                                    - type: integer
                                      minimum: -9007199254740991
                                      maximum: 9007199254740991
                                nonce:
                                  anyOf:
                                    - type: string
                                    - type: integer
                                      minimum: -9007199254740991
                                      maximum: 9007199254740991
                                r:
                                  type: string
                                s:
                                  type: string
                                y_parity:
                                  type: number
                              required:
                                - contract
                                - chain_id
                                - nonce
                                - r
                                - s
                                - y_parity
                          required:
                            - authorization
                      required:
                        - method
                        - data
                    - type: object
                      properties:
                        method:
                          type: string
                          enum:
                            - eth_signUserOperation
                        data:
                          type: object
                          properties:
                            signature:
                              type: string
                            encoding:
                              type: string
                              enum:
                                - hex
                          required:
                            - signature
                            - encoding
                      required:
                        - method
                        - data
                    - type: object
                      properties:
                        method:
                          type: string
                          enum:
                            - eth_signTypedData_v4
                        data:
                          type: object
                          properties:
                            signature:
                              type: string
                            encoding:
                              type: string
                              enum:
                                - hex
                          required:
                            - signature
                            - encoding
                      required:
                        - method
                        - data
                    - type: object
                      properties:
                        method:
                          type: string
                          enum:
                            - exportPrivateKey
                        data:
                          type: object
                          properties:
                            encryption_type:
                              type: string
                              enum:
                                - HPKE
                            recipient_public_key:
                              anyOf:
                                - type: string
                                  pattern: >-
                                    ^-----BEGIN PUBLIC
                                    KEY-----\n[A-Za-z0-9+/=\n]+-----END PUBLIC
                                    KEY-----\n$
                                - type: string
                                  pattern: ^[A-Za-z0-9+/=]+$
                            export_type:
                              type: string
                              enum:
                                - display
                                - client
                          required:
                            - encryption_type
                            - recipient_public_key
                          additionalProperties: false
                      required:
                        - method
                        - data
                    - type: object
                      properties:
                        method:
                          type: string
                          enum:
                            - transfer
                        data:
                          type: object
                          properties:
                            id:
                              type: string
                            sender_identity_public_key:
                              type: string
                            receiver_identity_public_key:
                              type: string
                            status:
                              type: string
                            total_value:
                              type: number
                            expiry_time:
                              type: string
                            leaves:
                              type: array
                              items:
                                type: object
                                properties:
                                  leaf:
                                    type: object
                                    properties:
                                      id:
                                        type: string
                                      tree_id:
                                        type: string
                                      value:
                                        type: number
                                      parent_node_id:
                                        type: string
                                      node_tx:
                                        type: string
                                      refund_tx:
                                        type: string
                                      vout:
                                        type: number
                                      verifying_public_key:
                                        type: string
                                      owner_identity_public_key:
                                        type: string
                                      signing_keyshare:
                                        type: object
                                        properties:
                                          owner_identifiers:
                                            type: array
                                            items:
                                              type: string
                                          threshold:
                                            type: number
                                          public_key:
                                            type: string
                                          public_shares:
                                            type: object
                                            additionalProperties:
                                              type: string
                                          updated_time:
                                            type: string
                                        required:
                                          - owner_identifiers
                                          - threshold
                                          - public_key
                                          - public_shares
                                          - updated_time
                                      status:
                                        type: string
                                      network:
                                        type: string
                                        enum:
                                          - MAINNET
                                          - REGTEST
                                    required:
                                      - id
                                      - tree_id
                                      - value
                                      - node_tx
                                      - refund_tx
                                      - vout
                                      - verifying_public_key
                                      - owner_identity_public_key
                                      - status
                                      - network
                                  secret_cipher:
                                    type: string
                                  signature:
                                    type: string
                                  intermediate_refund_tx:
                                    type: string
                                required:
                                  - secret_cipher
                                  - signature
                                  - intermediate_refund_tx
                            created_time:
                              type: string
                            updated_time:
                              type: string
                            type:
                              type: string
                            transfer_direction:
                              type: string
                          required:
                            - id
                            - sender_identity_public_key
                            - receiver_identity_public_key
                            - status
                            - total_value
                            - leaves
                            - type
                            - transfer_direction
                      required:
                        - method
                    - type: object
                      properties:
                        method:
                          type: string
                          enum:
                            - getBalance
                        data:
                          type: object
                          properties:
                            balance:
                              type: string
                            token_balances:
                              type: object
                              additionalProperties:
                                type: object
                                properties:
                                  balance:
                                    type: string
                                  token_metadata:
                                    type: object
                                    properties:
                                      raw_token_identifier:
                                        type: string
                                      token_public_key:
                                        type: string
                                      token_name:
                                        type: string
                                      token_ticker:
                                        type: string
                                      decimals:
                                        type: number
                                      max_supply:
                                        type: string
                                    required:
                                      - raw_token_identifier
                                      - token_public_key
                                      - token_name
                                      - token_ticker
                                      - decimals
                                      - max_supply
                                required:
                                  - balance
                                  - token_metadata
                          required:
                            - balance
                            - token_balances
                      required:
                        - method
                    - type: object
                      properties:
                        method:
                          type: string
                          enum:
                            - transferTokens
                        data:
                          type: object
                          properties:
                            id:
                              type: string
                          required:
                            - id
                      required:
                        - method
                    - type: object
                      properties:
                        method:
                          type: string
                          enum:
                            - getStaticDepositAddress
                        data:
                          type: object
                          properties:
                            address:
                              type: string
                          required:
                            - address
                      required:
                        - method
                    - type: object
                      properties:
                        method:
                          type: string
                          enum:
                            - claimStaticDeposit
                        data:
                          type: object
                          properties:
                            transfer_id:
                              type: string
                          required:
                            - transfer_id
                      required:
                        - method
                    - type: object
                      properties:
                        method:
                          type: string
                          enum:
                            - getClaimStaticDepositQuote
                        data:
                          type: object
                          properties:
                            transaction_id:
                              type: string
                            output_index:
                              type: number
                            network:
                              type: string
                            credit_amount_sats:
                              type: number
                            signature:
                              type: string
                          required:
                            - transaction_id
                            - output_index
                            - network
                            - credit_amount_sats
                            - signature
                      required:
                        - method
                    - type: object
                      properties:
                        method:
                          type: string
                          enum:
                            - payLightningInvoice
                        data:
                          anyOf:
                            - type: object
                              properties:
                                id:
                                  type: string
                                sender_identity_public_key:
                                  type: string
                                receiver_identity_public_key:
                                  type: string
                                status:
                                  type: string
                                total_value:
                                  type: number
                                expiry_time:
                                  type: string
                                leaves:
                                  type: array
                                  items:
                                    type: object
                                    properties:
                                      leaf:
                                        type: object
                                        properties:
                                          id:
                                            type: string
                                          tree_id:
                                            type: string
                                          value:
                                            type: number
                                          parent_node_id:
                                            type: string
                                          node_tx:
                                            type: string
                                          refund_tx:
                                            type: string
                                          vout:
                                            type: number
                                          verifying_public_key:
                                            type: string
                                          owner_identity_public_key:
                                            type: string
                                          signing_keyshare:
                                            type: object
                                            properties:
                                              owner_identifiers:
                                                type: array
                                                items:
                                                  type: string
                                              threshold:
                                                type: number
                                              public_key:
                                                type: string
                                              public_shares:
                                                type: object
                                                additionalProperties:
                                                  type: string
                                              updated_time:
                                                type: string
                                            required:
                                              - owner_identifiers
                                              - threshold
                                              - public_key
                                              - public_shares
                                              - updated_time
                                          status:
                                            type: string
                                          network:
                                            type: string
                                            enum:
                                              - MAINNET
                                              - REGTEST
                                        required:
                                          - id
                                          - tree_id
                                          - value
                                          - node_tx
                                          - refund_tx
                                          - vout
                                          - verifying_public_key
                                          - owner_identity_public_key
                                          - status
                                          - network
                                      secret_cipher:
                                        type: string
                                      signature:
                                        type: string
                                      intermediate_refund_tx:
                                        type: string
                                    required:
                                      - secret_cipher
                                      - signature
                                      - intermediate_refund_tx
                                created_time:
                                  type: string
                                updated_time:
                                  type: string
                                type:
                                  type: string
                                transfer_direction:
                                  type: string
                              required:
                                - id
                                - sender_identity_public_key
                                - receiver_identity_public_key
                                - status
                                - total_value
                                - leaves
                                - type
                                - transfer_direction
                            - type: object
                              properties:
                                id:
                                  type: string
                                created_at:
                                  type: string
                                updated_at:
                                  type: string
                                network:
                                  type: string
                                encoded_invoice:
                                  type: string
                                fee:
                                  type: object
                                  properties:
                                    original_value:
                                      type: number
                                    original_unit:
                                      type: string
                                  required:
                                    - original_value
                                    - original_unit
                                idempotency_key:
                                  type: string
                                status:
                                  type: string
                                typename:
                                  type: string
                                transfer: {}
                                payment_preimage:
                                  type: string
                              required:
                                - id
                                - created_at
                                - updated_at
                                - network
                                - encoded_invoice
                                - fee
                                - idempotency_key
                                - status
                                - typename
                      required:
                        - method
                    - type: object
                      properties:
                        method:
                          type: string
                          enum:
                            - createLightningInvoice
                        data:
                          type: object
                          properties:
                            id:
                              type: string
                            created_at:
                              type: string
                            updated_at:
                              type: string
                            network:
                              type: string
                            invoice: {}
                            status:
                              type: string
                            typename:
                              type: string
                            transfer: {}
                            payment_preimage:
                              type: string
                            receiver_identity_public_key:
                              type: string
                          required:
                            - id
                            - created_at
                            - updated_at
                            - network
                            - status
                            - typename
                      required:
                        - method
                    - type: object
                      properties:
                        method:
                          type: string
                          enum:
                            - signMessageWithIdentityKey
                        data:
                          type: object
                          properties:
                            signature:
                              type: string
                          required:
                            - signature
                      required:
                        - method
              required:
                - response_body
          description: >-
            Result of RPC execution (only present if status is 'executed' or
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
      description: Response for an RPC intent
      title: RpcIntentResponse
      example:
        intent_id: clpq1234567890abcdefghij
        intent_type: RPC
        created_by_display_name: developer@example.com
        created_by_id: did:privy:clabcd123
        created_at: 1741834854578
        resource_id: xs76o3pi0v5syd62ui1wmijw
        authorization_details:
          - members:
              - type: user
                user_id: did:privy:clabcd123
                signed_at: null
            threshold: 1
            display_name: Admin Key Quorum
        status: pending
        expires_at: 1741921254578
        request_details:
          method: POST
          url: https://api.privy.io/v1/wallets/xs76o3pi0v5syd62ui1wmijw/rpc
          body:
            method: eth_sendTransaction
            caip2: eip155:8453
            chain_type: ethereum
            params:
              transaction:
                to: '0x0000000000000000000000000000000000000000'
                value: 1
      x-stainless-model: intents.rpc_intent_response
    EthereumPersonalSignRpcInput:
      type: object
      properties:
        method:
          type: string
          enum:
            - personal_sign
        params:
          type: object
          properties:
            message:
              type: string
            encoding:
              anyOf:
                - type: string
                  enum:
                    - utf-8
                - type: string
                  enum:
                    - hex
          required:
            - message
            - encoding
          additionalProperties: false
        address:
          type: string
        chain_type:
          type: string
          enum:
            - ethereum
      required:
        - method
        - params
      additionalProperties: false
      description: Executes the EVM `personal_sign` RPC (EIP-191) to sign a message.
      title: EthereumPersonalSignRpcInput
      x-stainless-model: wallets.ethereum_personal_sign_rpc_input
    EthereumSignTypedDataRpcInput:
      type: object
      properties:
        method:
          type: string
          enum:
            - eth_signTypedData_v4
        params:
          type: object
          properties:
            typed_data:
              type: object
              properties:
                domain:
                  type: object
                  additionalProperties: {}
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
                message:
                  type: object
                  additionalProperties: {}
                primary_type:
                  type: string
              required:
                - domain
                - types
                - message
                - primary_type
              additionalProperties: false
          required:
            - typed_data
          additionalProperties: false
        address:
          type: string
        chain_type:
          type: string
          enum:
            - ethereum
      required:
        - method
        - params
      additionalProperties: false
      description: >-
        Executes the EVM `eth_signTypedData_v4` RPC (EIP-712) to sign a typed
        data object.
      title: EthereumSignTypedDataRpcInput
      x-stainless-model: wallets.ethereum_sign_typed_data_rpc_input
    EthereumSignTransactionRpcInput:
      type: object
      properties:
        method:
          type: string
          enum:
            - eth_signTransaction
        params:
          type: object
          properties:
            transaction:
              type: object
              properties:
                from:
                  type: string
                to:
                  type: string
                chain_id:
                  anyOf:
                    - type: string
                    - type: integer
                      minimum: -9007199254740991
                      maximum: 9007199254740991
                nonce:
                  anyOf:
                    - type: string
                    - type: integer
                      minimum: -9007199254740991
                      maximum: 9007199254740991
                data:
                  type: string
                value:
                  anyOf:
                    - type: string
                    - type: integer
                      minimum: -9007199254740991
                      maximum: 9007199254740991
                type:
                  anyOf:
                    - type: number
                      enum:
                        - 0
                    - type: number
                      enum:
                        - 1
                    - type: number
                      enum:
                        - 2
                    - type: number
                      enum:
                        - 4
                gas_limit:
                  anyOf:
                    - type: string
                    - type: integer
                      minimum: -9007199254740991
                      maximum: 9007199254740991
                gas_price:
                  anyOf:
                    - type: string
                    - type: integer
                      minimum: -9007199254740991
                      maximum: 9007199254740991
                max_fee_per_gas:
                  anyOf:
                    - type: string
                    - type: integer
                      minimum: -9007199254740991
                      maximum: 9007199254740991
                max_priority_fee_per_gas:
                  anyOf:
                    - type: string
                    - type: integer
                      minimum: -9007199254740991
                      maximum: 9007199254740991
                authorization_list:
                  type: array
                  items:
                    type: object
                    properties:
                      contract:
                        type: string
                      chain_id:
                        anyOf:
                          - type: string
                          - type: integer
                            minimum: -9007199254740991
                            maximum: 9007199254740991
                      nonce:
                        anyOf:
                          - type: string
                          - type: integer
                            minimum: -9007199254740991
                            maximum: 9007199254740991
                      r:
                        type: string
                      s:
                        type: string
                      y_parity:
                        type: number
                    required:
                      - contract
                      - chain_id
                      - nonce
                      - r
                      - s
                      - y_parity
                  maxItems: 10
              additionalProperties: false
          required:
            - transaction
          additionalProperties: false
        address:
          type: string
        chain_type:
          type: string
          enum:
            - ethereum
      required:
        - method
        - params
      additionalProperties: false
      description: Executes the EVM `eth_signTransaction` RPC to sign a transaction.
      title: EthereumSignTransactionRpcInput
      x-stainless-model: wallets.ethereum_sign_transaction_rpc_input
    EthereumSignUserOperationRpcInput:
      type: object
      properties:
        method:
          type: string
          enum:
            - eth_signUserOperation
        params:
          type: object
          properties:
            contract:
              type: string
            user_operation:
              type: object
              properties:
                sender:
                  type: string
                nonce:
                  type: string
                call_data:
                  type: string
                paymaster:
                  type: string
                paymaster_data:
                  type: string
                paymaster_post_op_gas_limit:
                  type: string
                paymaster_verification_gas_limit:
                  type: string
                max_priority_fee_per_gas:
                  type: string
                max_fee_per_gas:
                  type: string
                call_gas_limit:
                  type: string
                verification_gas_limit:
                  type: string
                pre_verification_gas:
                  type: string
              required:
                - sender
                - nonce
                - call_data
                - paymaster
                - paymaster_data
                - paymaster_post_op_gas_limit
                - paymaster_verification_gas_limit
                - max_priority_fee_per_gas
                - max_fee_per_gas
                - call_gas_limit
                - verification_gas_limit
                - pre_verification_gas
              additionalProperties: false
            chain_id:
              anyOf:
                - type: string
                - type: integer
                  minimum: -9007199254740991
                  maximum: 9007199254740991
          required:
            - contract
            - user_operation
            - chain_id
          additionalProperties: false
        address:
          type: string
        chain_type:
          type: string
          enum:
            - ethereum
      required:
        - method
        - params
      additionalProperties: false
      description: Executes an RPC method to hash and sign a UserOperation.
      title: EthereumSignUserOperationRpcInput
      x-stainless-model: wallets.ethereum_sign_user_operation_rpc_input
    EthereumSendTransactionRpcInput:
      type: object
      properties:
        method:
          type: string
          enum:
            - eth_sendTransaction
        caip2:
          type: string
          pattern: ^[-a-z0-9]{3,8}:[-_a-zA-Z0-9]{1,32}$
        params:
          type: object
          properties:
            transaction:
              type: object
              properties:
                from:
                  type: string
                to:
                  type: string
                chain_id:
                  anyOf:
                    - type: string
                    - type: integer
                      minimum: -9007199254740991
                      maximum: 9007199254740991
                nonce:
                  anyOf:
                    - type: string
                    - type: integer
                      minimum: -9007199254740991
                      maximum: 9007199254740991
                data:
                  type: string
                value:
                  anyOf:
                    - type: string
                    - type: integer
                      minimum: -9007199254740991
                      maximum: 9007199254740991
                type:
                  anyOf:
                    - type: number
                      enum:
                        - 0
                    - type: number
                      enum:
                        - 1
                    - type: number
                      enum:
                        - 2
                    - type: number
                      enum:
                        - 4
                gas_limit:
                  anyOf:
                    - type: string
                    - type: integer
                      minimum: -9007199254740991
                      maximum: 9007199254740991
                gas_price:
                  anyOf:
                    - type: string
                    - type: integer
                      minimum: -9007199254740991
                      maximum: 9007199254740991
                max_fee_per_gas:
                  anyOf:
                    - type: string
                    - type: integer
                      minimum: -9007199254740991
                      maximum: 9007199254740991
                max_priority_fee_per_gas:
                  anyOf:
                    - type: string
                    - type: integer
                      minimum: -9007199254740991
                      maximum: 9007199254740991
                authorization_list:
                  type: array
                  items:
                    type: object
                    properties:
                      contract:
                        type: string
                      chain_id:
                        anyOf:
                          - type: string
                          - type: integer
                            minimum: -9007199254740991
                            maximum: 9007199254740991
                      nonce:
                        anyOf:
                          - type: string
                          - type: integer
                            minimum: -9007199254740991
                            maximum: 9007199254740991
                      r:
                        type: string
                      s:
                        type: string
                      y_parity:
                        type: number
                    required:
                      - contract
                      - chain_id
                      - nonce
                      - r
                      - s
                      - y_parity
                  maxItems: 10
              additionalProperties: false
          required:
            - transaction
          additionalProperties: false
        sponsor:
          type: boolean
        address:
          type: string
        chain_type:
          type: string
          enum:
            - ethereum
      required:
        - method
        - caip2
        - params
      additionalProperties: false
      description: >-
        Executes the EVM `eth_sendTransaction` RPC to sign and broadcast a
        transaction.
      title: EthereumSendTransactionRpcInput
      x-stainless-model: wallets.ethereum_send_transaction_rpc_input
    EthereumSign7702AuthorizationRpcInput:
      type: object
      properties:
        method:
          type: string
          enum:
            - eth_sign7702Authorization
        params:
          type: object
          properties:
            contract:
              type: string
            chain_id:
              anyOf:
                - type: string
                - type: integer
                  minimum: -9007199254740991
                  maximum: 9007199254740991
            nonce:
              anyOf:
                - type: string
                - type: integer
                  minimum: -9007199254740991
                  maximum: 9007199254740991
          required:
            - contract
            - chain_id
          additionalProperties: false
        address:
          type: string
        chain_type:
          type: string
          enum:
            - ethereum
      required:
        - method
        - params
      additionalProperties: false
      description: Signs an EIP-7702 authorization.
      title: EthereumSign7702AuthorizationRpcInput
      x-stainless-model: wallets.ethereum_sign_7702_authorization_rpc_input
    EthereumSecp256k1SignRpcInput:
      type: object
      properties:
        method:
          type: string
          enum:
            - secp256k1_sign
        params:
          type: object
          properties:
            hash:
              type: string
          required:
            - hash
          additionalProperties: false
        address:
          type: string
        chain_type:
          type: string
          enum:
            - ethereum
      required:
        - method
        - params
      additionalProperties: false
      description: Signs a raw hash on the secp256k1 curve.
      title: EthereumSecp256k1SignRpcInput
      x-stainless-model: wallets.ethereum_secp_256k_1_sign_rpc_input
    SolanaSignMessageRpcInput:
      type: object
      properties:
        method:
          type: string
          enum:
            - signMessage
        params:
          type: object
          properties:
            message:
              type: string
            encoding:
              type: string
              enum:
                - base64
          required:
            - message
            - encoding
          additionalProperties: false
        address:
          type: string
        chain_type:
          type: string
          enum:
            - solana
      required:
        - method
        - params
      additionalProperties: false
      description: Executes the SVM `signMessage` RPC to sign a message.
      title: SolanaSignMessageRpcInput
      x-stainless-model: wallets.solana_sign_message_rpc_input
    SolanaSignTransactionRpcInput:
      type: object
      properties:
        method:
          type: string
          enum:
            - signTransaction
        params:
          type: object
          properties:
            transaction:
              type: string
            encoding:
              type: string
              enum:
                - base64
          required:
            - transaction
            - encoding
          additionalProperties: false
        address:
          type: string
        chain_type:
          type: string
          enum:
            - solana
      required:
        - method
        - params
      additionalProperties: false
      description: Executes the SVM `signTransaction` RPC to sign a transaction.
      title: SolanaSignTransactionRpcInput
      x-stainless-model: wallets.solana_sign_transaction_rpc_input
    SolanaSignAndSendTransactionRpcInput:
      type: object
      properties:
        method:
          type: string
          enum:
            - signAndSendTransaction
        caip2:
          type: string
          pattern: ^[-a-z0-9]{3,8}:[-_a-zA-Z0-9]{1,32}$
        params:
          type: object
          properties:
            transaction:
              type: string
            encoding:
              type: string
              enum:
                - base64
          required:
            - transaction
            - encoding
          additionalProperties: false
        sponsor:
          type: boolean
        address:
          type: string
        chain_type:
          type: string
          enum:
            - solana
      required:
        - method
        - caip2
        - params
      additionalProperties: false
      description: >-
        Executes the SVM `signAndSendTransaction` RPC to sign and broadcast a
        transaction.
      title: SolanaSignAndSendTransactionRpcInput
      x-stainless-model: wallets.solana_sign_and_send_transaction_rpc_input
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
    WalletCustodian:
      type: object
      properties:
        provider:
          type: string
          description: The custodian responsible for the wallet.
        provider_user_id:
          type: string
          description: The resource ID of the beneficiary of the custodial wallet.
      required:
        - provider
        - provider_user_id
      description: Information about the custodian managing this wallet.
      title: WalletCustodian
      x-stainless-model: wallets.wallet_custodian
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