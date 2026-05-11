> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Get wallet

> Get a wallet by wallet ID.

### SDK methods

Learn more about getting wallets using our SDKs [here](/wallets/wallets/get-a-wallet/get-wallet-by-id).


## OpenAPI

````yaml get /v1/wallets/{wallet_id}
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
  /v1/wallets/{wallet_id}:
    get:
      tags:
        - Wallets
      summary: Get wallet
      description: Get a wallet by wallet ID.
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
      responses:
        '200':
          description: Requested wallet object.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Wallet'
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