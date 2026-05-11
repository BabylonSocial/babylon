> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Update wallet

> Create an intent to update a wallet. The intent must be authorized by the wallet owner before it can be executed.



## OpenAPI

````yaml post /v1/intents/wallets/{wallet_id}
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
  /v1/intents/wallets/{wallet_id}:
    post:
      tags:
        - Intents
      summary: Create wallet update intent
      description: >-
        Create an intent to update a wallet. The intent must be authorized by
        the wallet owner before it can be executed.
      operationId: updateWallet
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
              $ref: '#/components/schemas/PatchWalletRequestBody'
      responses:
        '200':
          description: Created wallet update intent.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/WalletIntentResponse'
      security:
        - appSecretAuth: []
components:
  schemas:
    PatchWalletRequestBody:
      type: object
      properties:
        policy_ids:
          type: array
          items:
            type: string
            minLength: 24
            maxLength: 24
          maxItems: 1
          description: >-
            New policy IDs to enforce on the wallet. Currently, only one policy
            is supported per wallet.
        owner:
          $ref: '#/components/schemas/OwnerInput'
        owner_id:
          allOf:
            - $ref: '#/components/schemas/OwnerIdInput'
            - type:
                - string
                - 'null'
        additional_signers:
          $ref: '#/components/schemas/WalletAdditionalSigner'
      description: Request body for updating a wallet.
      title: PatchWalletRequestBody
      x-stainless-model: wallets.patch_wallet_request_body
    WalletIntentResponse:
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
            - WALLET
        request_details:
          type: object
          properties:
            method:
              type: string
              enum:
                - PATCH
            url:
              type: string
            body:
              type: object
              properties:
                policy_ids:
                  type: array
                  items:
                    type: string
                    format: cuid2
                  maxItems: 1
                authorization_key_ids:
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
                          format: cuid2
                        maxItems: 1
                    required:
                      - signer_id
                    additionalProperties: false
                owner:
                  anyOf:
                    - type: object
                      properties:
                        user_id:
                          type: string
                      required:
                        - user_id
                      additionalProperties: false
                    - type: object
                      properties:
                        public_key:
                          type: string
                      required:
                        - public_key
                      additionalProperties: false
                    - type: 'null'
                    - type: 'null'
                owner_id:
                  type:
                    - string
                    - 'null'
                  format: cuid2
              additionalProperties: false
          required:
            - method
            - url
            - body
          description: >-
            The original wallet update request that would be sent to the wallet
            endpoint
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
                prior_state:
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
                  description: State of the wallet immediately before execution
              required:
                - response_body
                - prior_state
          description: >-
            Result of wallet update execution (only present if status is
            'executed' or 'failed')
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
      description: Response for a wallet intent
      title: WalletIntentResponse
      x-stainless-model: intents.wallet_intent_response
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