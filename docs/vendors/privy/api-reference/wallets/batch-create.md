> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Create wallets in batch

> Creates multiple wallets in a single request.

### Batch behavior

This endpoint creates multiple wallets in a single request. Each wallet creation is processed independently, so a failure for one wallet does not affect the others.

If the request body is valid, the endpoint returns HTTP 200 with a `results` array containing the success or failure status for each wallet. Request-level errors (invalid body, authentication failure, rate limiting) return standard HTTP error codes before any wallets are processed.


## OpenAPI

````yaml post /v1/wallets/batch
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
  /v1/wallets/batch:
    post:
      tags:
        - Wallets
      summary: Create wallets in batch
      description: >-
        Creates multiple wallets in a single request. Each wallet creation is
        independent; failures for one wallet do not affect others. Maximum batch
        size is 100 wallets.
      operationId: createWalletsBatch
      parameters:
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
              $ref: '#/components/schemas/WalletBatchCreateInput'
      responses:
        '200':
          description: >-
            Batch creation results. Always returns 200 with a results array
            containing success/failure status for each wallet.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/WalletBatchCreateResponse'
      security:
        - appSecretAuth: []
components:
  schemas:
    WalletBatchCreateInput:
      type: object
      properties:
        wallets:
          type: array
          items:
            $ref: '#/components/schemas/WalletBatchItemInput'
          minItems: 1
          maxItems: 100
          description: Array of wallet creation requests. Minimum 1, maximum 100.
      required:
        - wallets
      additionalProperties: false
      description: Request body for batch wallet creation.
      title: WalletBatchCreateInput
      example:
        wallets:
          - chain_type: ethereum
          - chain_type: solana
      x-stainless-model: wallets.wallet_batch_create_input
    WalletBatchCreateResponse:
      type: object
      properties:
        results:
          type: array
          items:
            $ref: '#/components/schemas/WalletBatchCreateResult'
          description: >-
            Array of results for each wallet creation request, in the same order
            as input.
      required:
        - results
      description: Response for a batch wallet creation request.
      title: WalletBatchCreateResponse
      example:
        results:
          - index: 0
            success: true
            wallet:
              id: id2tptkqrxd39qo9j423etij
              address: '0xF1DBff66C993EE895C8cb176c30b07A559d76496'
              chain_type: ethereum
              policy_ids: []
              additional_signers: []
              owner_id: rkiz0ivz254drv1xw982v3jq
              created_at: 1741834854578
              exported_at: null
              imported_at: null
          - index: 1
            success: false
            error: Policy not found
            code: not_found
      x-stainless-model: wallets.wallet_batch_create_response
    WalletBatchItemInput:
      type: object
      properties:
        chain_type:
          $ref: '#/components/schemas/WalletChainType'
        policy_ids:
          type: array
          items:
            type: string
            minLength: 24
            maxLength: 24
          maxItems: 1
          description: >-
            List of policy IDs for policies that should be enforced on the
            wallet. Currently, only one policy is supported per wallet.
        owner:
          $ref: '#/components/schemas/OwnerInput'
        owner_id:
          $ref: '#/components/schemas/OwnerIdInput'
        additional_signers:
          $ref: '#/components/schemas/WalletAdditionalSigner'
      required:
        - chain_type
      additionalProperties: false
      description: Input for a single wallet in a batch creation request.
      title: WalletBatchItemInput
      example:
        chain_type: ethereum
      x-stainless-model: wallets.wallet_batch_item_input
    WalletBatchCreateResult:
      oneOf:
        - type: object
          properties:
            index:
              type: number
              description: The index of the wallet in the original request array.
            success:
              type: boolean
              enum:
                - true
            wallet:
              $ref: '#/components/schemas/Wallet'
          required:
            - index
            - success
            - wallet
          description: A successful wallet creation result within a batch operation.
          title: WalletBatchCreateSuccess
        - type: object
          properties:
            index:
              type: number
              description: The index of the wallet in the original request array.
            success:
              type: boolean
              enum:
                - false
            error:
              type: string
              description: >-
                A human-readable error message with details about what went
                wrong.
            code:
              type: string
              description: >-
                A PrivyErrorCode string identifying the error type (e.g.,
                "invalid_data", "resource_conflict").
          required:
            - index
            - success
            - error
            - code
          description: A failed wallet creation result within a batch operation.
          title: WalletBatchCreateFailure
      description: A single result from a batch wallet creation operation.
      title: WalletBatchCreateResult
      x-stainless-model: wallets.wallet_batch_create_result
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
    WalletAdditionalSigner:
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
              format: cuid2
            description: >-
              The array of policy IDs that will be applied to wallet requests.
              If specified, this will override the base policy IDs set on the
              wallet.
        required:
          - signer_id
      description: Additional signers for the wallet.
    Wallet:
      type: object
      properties:
        id:
          type: string
          description: >-
            Unique ID of the wallet. This will be the primary identifier when
            using the wallet in the future.
        address:
          type: string
          description: Address of the wallet.
        public_key:
          type: string
          description: >-
            The compressed, raw public key for the wallet along the chain
            cryptographic curve.
        created_at:
          type: number
          description: Unix timestamp of when the wallet was created in milliseconds.
        chain_type:
          $ref: '#/components/schemas/WalletChainType'
        policy_ids:
          type: array
          items:
            type: string
          description: List of policy IDs for policies that are enforced on the wallet.
        owner_id:
          type:
            - string
            - 'null'
          description: The key quorum ID of the owner of the wallet.
        additional_signers:
          $ref: '#/components/schemas/WalletAdditionalSigner'
        exported_at:
          type:
            - number
            - 'null'
          description: >-
            Unix timestamp of when the wallet was exported in milliseconds, if
            the wallet was exported.
        imported_at:
          type:
            - number
            - 'null'
          description: >-
            Unix timestamp of when the wallet was imported in milliseconds, if
            the wallet was imported.
      required:
        - id
        - address
        - created_at
        - chain_type
        - policy_ids
        - owner_id
        - additional_signers
        - exported_at
        - imported_at
      description: A wallet managed by Privy's wallet infrastructure.
      title: Wallet
      example:
        id: id2tptkqrxd39qo9j423etij
        address: '0xF1DBff66C993EE895C8cb176c30b07A559d76496'
        chain_type: ethereum
        policy_ids: []
        additional_signers: []
        owner_id: rkiz0ivz254drv1xw982v3jq
        created_at: 1741834854578
        exported_at: null
        imported_at: null
      x-stainless-model: wallets.wallet
  securitySchemes:
    appSecretAuth:
      type: http
      scheme: basic
      description: >-
        Basic Auth header with your app ID as the username and your app secret
        as the password.

````\n