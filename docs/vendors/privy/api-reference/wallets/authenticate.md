> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Authenticate

> Obtain a session key to enable wallet access.

<Info>
  Directly managing user authorization keys via the API is an advanced setting. We recommend using
  Privy's SDKs, which internally manage user authorization keys if applicable.
</Info>

This endpoint is used to create an ephemeral signing key for signing requests to [take actions](/api-reference/wallets/ethereum/eth-send-transaction) with a user's wallet.

The returned key is encrypted using Hybrid Public Key Encryption (HPKE), with the following configuration:

<ul>
  <li>KEM (Key Encapsulation Mechanism): DHKEM\_P256\_HKDF\_SHA256</li>
  <li>KDF (Key Derivation Function): HKDF\_SHA256</li>
  <li>AEAD (Authenticated Encryption with Associated Data): CHACHA20\_POLY1305</li>
  <li>Mode: BASE</li>
</ul>

The response `authorization_key` is ciphertext and must be decrypted.


## OpenAPI

````yaml post /v1/wallets/authenticate
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
  /v1/wallets/authenticate:
    post:
      tags:
        - Wallets
      summary: Obtain a session key to enable wallet access.
      description: Obtain a session key to enable wallet access.
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
              type: object
              properties:
                user_jwt:
                  type: string
                  description: The user's JWT, to be used to authenticate the user.
                encryption_type:
                  type: string
                  enum:
                    - HPKE
                  description: >-
                    The encryption type for the authentication response.
                    Currently only supports HPKE.
                recipient_public_key:
                  type: string
                  description: >-
                    The public key of your ECDH keypair, in base64-encoded,
                    SPKI-format, whose private key will be able to decrypt the
                    session key.
              required:
                - user_jwt
              example:
                user_jwt: >-
                  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMn0.KMUFsIDTnFmyG3nMiGM6H9FNFUROf3wh7SmqJp-QV30
                encryption_type: HPKE
                recipient_public_key: >-
                  DAQcDQgAEx4aoeD72yykviK+fckqE2CItVIGn1rCnvCXZ1HgpOcMEMialRmTrqIK4oZlYd1
      responses:
        '200':
          description: Object with authorization key and wallet IDs.
          content:
            application/json:
              schema:
                anyOf:
                  - type: object
                    properties:
                      encrypted_authorization_key:
                        type: object
                        properties:
                          encryption_type:
                            type: string
                            enum:
                              - HPKE
                            description: >-
                              The encryption type used. Currently only supports
                              HPKE.
                          encapsulated_key:
                            type: string
                            description: >-
                              Base64-encoded ephemeral public key used in the
                              HPKE encryption process. Required for decryption.
                          ciphertext:
                            type: string
                            description: >-
                              The encrypted authorization key corresponding to
                              the user's current authentication session.
                        required:
                          - encryption_type
                          - encapsulated_key
                          - ciphertext
                        description: The encrypted authorization key data.
                      expires_at:
                        type: number
                        description: >-
                          The expiration time of the authorization key in
                          seconds since the epoch.
                      wallets:
                        type: array
                        items:
                          $ref: '#/components/schemas/Wallet'
                    required:
                      - encrypted_authorization_key
                      - expires_at
                      - wallets
                    title: With encryption
                    example:
                      encrypted_authorization_key:
                        encryption_type: HPKE
                        encapsulated_key: >-
                          BECqbgIAcs3TpP5GadS6F8mXkSktR2DR8WNtd3e0Qcy7PpoRHEygpzjFWttntS+SEM3VSr4Thewh18ZP9chseLE=
                        ciphertext: >-
                          MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgsqM8IKMlpFxVypBUa/Q2QvB1AmS/g5WHPp3SKq9A75uhRANCAATeX6BDghwclKAH8+/7IjvS1tCpvIfZ570IR44acX93pUGz5iEvpkg+HGaalHAXubuoUMq9CUWRm4wo+3090Nus
                      expires_at: 1697059200000
                      wallets:
                        - id: ubul5xhljqorce73sf82u0p3
                          address: '0x3DE69Fd93873d40459f27Ce5B74B42536f8d6149'
                          chain_type: ethereum
                          policy_ids: []
                          additional_signers:
                            - signer_id: p3cyj3n8mt9f9u2htfize511
                              override_policy_ids: []
                          created_at: 1744300912643
                          owner_id: lzjb3xnjk2ntod3w1hgwa358
                          exported_at: null
                          imported_at: null
                        - id: sb4y18l68xze8gfszafmyv3q
                          address: 9wtGmqMamnKfz49XBwnJASbjcVnnKnT78qKopCL54TAk
                          chain_type: solana
                          policy_ids: []
                          additional_signers:
                            - signer_id: p3cyj3n8mt9f9u2htfize511
                              override_policy_ids: []
                          created_at: 1744300912644
                          owner_id: lzjb3xnjk2ntod3w1hgwa358
                          exported_at: null
                          imported_at: null
                  - type: object
                    properties:
                      authorization_key:
                        type: string
                        description: The raw authorization key data.
                      expires_at:
                        type: number
                        description: >-
                          The expiration time of the authorization key in
                          seconds since the epoch.
                      wallets:
                        type: array
                        items:
                          $ref: '#/components/schemas/Wallet'
                    required:
                      - authorization_key
                      - expires_at
                      - wallets
                    title: Without encryption
      security:
        - appSecretAuth: []
components:
  schemas:
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
  securitySchemes:
    appSecretAuth:
      type: http
      scheme: basic
      description: >-
        Basic Auth header with your app ID as the username and your app secret
        as the password.

````\n