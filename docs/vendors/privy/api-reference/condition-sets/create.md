> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Create condition set

> Create a new condition set. You must provide either "owner" or "owner_id" (but not both) to specify ownership.



## OpenAPI

````yaml post /v1/condition_sets
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
  /v1/condition_sets:
    post:
      tags:
        - Condition sets
      summary: Create Condition Set
      description: >-
        Create a new condition set. You must provide either "owner" or
        "owner_id" (but not both) to specify ownership.
      operationId: create
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
              $ref: '#/components/schemas/ConditionSetRequestBody'
            examples:
              with-owner-id:
                summary: Create with key quorum ID
                value:
                  name: Approved Recipients
                  owner_id: asgkan0r7gi0wdbvf9cw8qio
              with-user-id:
                summary: Create with user ID
                value:
                  name: Approved Recipients
                  owner:
                    user_id: did:privy:clxyz123abc456
              with-public-key:
                summary: Create with public key
                value:
                  name: Approved Recipients
                  owner:
                    public_key: >-
                      MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEx4aoeD72yykviK+f/ckqE2CItVIG1rCnvC3/XZ1HgpOcMEMialRmTrqIK4oZlYd1RfxU3za/C9yjhboIuoPD3g==
      responses:
        '200':
          description: Created condition set object.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ConditionSet'
              examples:
                with-owner-id:
                  summary: Created with key quorum ID
                  value:
                    id: qvah5m2hmp9abqlxdmfiht90
                    name: Approved Recipients
                    owner_id: asgkan0r7gi0wdbvf9cw8qio
                    created_at: 1761271537642
                with-user-id:
                  summary: Created with user ID (new key quorum created)
                  value:
                    id: qvah5m2hmp9abqlxdmfiht91
                    name: Approved Recipients
                    owner_id: newkeyquorumid1234567890
                    created_at: 1761271537642
                with-public-key:
                  summary: Created with public key (new key quorum created)
                  value:
                    id: qvah5m2hmp9abqlxdmfiht92
                    name: Approved Recipients
                    owner_id: anotherkeyquorum9876543
                    created_at: 1761271537642
      security:
        - appSecretAuth: []
components:
  schemas:
    ConditionSetRequestBody:
      type: object
      properties:
        name:
          type: string
          minLength: 1
          maxLength: 100
          description: Name to assign to condition set.
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
      additionalProperties: false
    ConditionSet:
      type: object
      properties:
        id:
          type: string
          minLength: 24
          maxLength: 24
          description: >-
            Unique ID of the created condition set. This will be the primary
            identifier when using the condition set in the future.
        name:
          type: string
          minLength: 1
          maxLength: 100
          description: Name of the condition set.
        owner_id:
          type: string
          format: cuid2
          description: The key quorum ID of the owner of the condition set.
        created_at:
          type: number
          description: >-
            Unix timestamp of when the condition set was created in
            milliseconds.
      required:
        - id
        - name
        - owner_id
        - created_at
      example:
        id: qvah5m2hmp9abqlxdmfiht95
        name: Approved Recipients
        owner_id: asgkan0r7gi0wdbvf9cw8qio
        created_at: 1761271537642
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