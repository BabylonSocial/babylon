> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Update key quorum

> Update a key quorum by key quorum ID.



## OpenAPI

````yaml patch /v1/key_quorums/{key_quorum_id}
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
  /v1/key_quorums/{key_quorum_id}:
    patch:
      tags:
        - Key quorums
      summary: Update key quorum
      description: Update a key quorum by key quorum ID.
      parameters:
        - schema:
            type: string
            format: cuid2
          required: true
          name: key_quorum_id
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
              $ref: '#/components/schemas/KeyQuorumCreateParams'
            example:
              display_name: Prod key quorum
              public_keys:
                - >-
                  MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEx4aoeD72yykviK+f/ckqE2CItVIG

                  1rCnvC3/XZ1HgpOcMEMialRmTrqIK4oZlYd1RfxU3za/C9yjhboIuoPD3g==
              authorization_threshold: 1
      responses:
        '200':
          description: Newly created key quorum.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/KeyQuorum'
      security:
        - appSecretAuth: []
components:
  schemas:
    KeyQuorumCreateParams:
      type: object
      properties:
        public_keys:
          type: array
          items:
            type: string
          description: >-
            List of P-256 public keys of the keys that should be authorized to
            sign on the key quorum, in base64-encoded DER format.
        authorization_threshold:
          type: number
          minimum: 1
          description: >-
            The number of keys that must sign for an action to be valid. Must be
            less than or equal to total number of key quorum members.
        display_name:
          type: string
          maxLength: 50
        user_ids:
          type: array
          items:
            type: string
          description: >-
            List of user IDs of the users that should be authorized to sign on
            the key quorum.
        key_quorum_ids:
          type: array
          items:
            type: string
          minItems: 1
          maxItems: 5
          description: >-
            List of key quorum IDs that should be members of this key quorum.
            Key quorums can only be nested 1 level deep.
      description: Request input for creating or updating a key quorum.
      title: KeyQuorumCreateParams
      x-stainless-model: key_quorums.key_quorum_create_params
    KeyQuorum:
      type: object
      properties:
        id:
          type: string
          format: cuid2
        display_name:
          type: string
          maxLength: 50
        authorization_threshold:
          type: number
          minimum: 1
        authorization_keys:
          type: array
          items:
            type: object
            properties:
              public_key:
                type: string
              display_name:
                type:
                  - string
                  - 'null'
                maxLength: 50
            required:
              - public_key
              - display_name
        user_ids:
          type: array
          items:
            type: string
        key_quorum_ids:
          type: array
          items:
            type: string
          minItems: 1
          maxItems: 5
          description: List of nested key quorum IDs that are members of this key quorum.
      required:
        - id
        - authorization_keys
      description: A key quorum for authorizing wallet operations.
      title: KeyQuorum
      example:
        id: tb54eps4z44ed0jepousxi4n
        display_name: Prod key quorum
        authorization_threshold: 1
        authorization_keys:
          - public_key: |-
              MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEx4aoeD72yykviK+f/ckqE2CItVIG
              1rCnvC3/XZ1HgpOcMEMialRmTrqIK4oZlYd1RfxU3za/C9yjhboIuoPD3g==
            display_name: null
          - public_key: |-
              MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAErzZtQr/bMIh3Y8f9ZqseB9i/AfjQ
              hu+agbNqXcJy/TfoNqvc/Y3Mh7gIZ8ZLXQEykycx4mYSpqrxp1lBKqsZDQ==
            display_name: null
      x-stainless-model: key_quorums.key_quorum
  securitySchemes:
    appSecretAuth:
      type: http
      scheme: basic
      description: >-
        Basic Auth header with your app ID as the username and your app secret
        as the password.

````\n