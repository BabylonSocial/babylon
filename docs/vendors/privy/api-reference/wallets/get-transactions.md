> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Get transactions

> Get incoming and outgoing transactions of a wallet by wallet ID.



## OpenAPI

````yaml get /v1/wallets/{wallet_id}/transactions
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
  /v1/wallets/{wallet_id}/transactions:
    get:
      tags:
        - Wallets
      summary: Get transactions
      description: Get incoming and outgoing transactions of a wallet by wallet ID.
      parameters:
        - schema:
            type: string
            description: ID of the wallet.
          required: true
          name: wallet_id
          in: path
        - schema:
            type: string
            minLength: 1
          required: false
          name: cursor
          in: query
        - schema:
            type:
              - number
              - 'null'
            maximum: 100
          required: false
          name: limit
          in: query
        - schema:
            type: string
            enum:
              - ethereum
              - arbitrum
              - base
              - tempo
              - linea
              - optimism
              - polygon
              - solana
              - sepolia
          required: true
          name: chain
          in: query
        - schema:
            anyOf:
              - type: string
                enum:
                  - usdc
                  - eth
                  - pol
                  - usdt
                  - eurc
                  - usdb
                  - sol
                  - usdc
                  - eurc
              - type: array
                items:
                  type: string
                  enum:
                    - usdc
                    - eth
                    - pol
                    - usdt
                    - eurc
                    - usdb
                    - sol
                    - usdc
                    - eurc
                maxItems: 4
          required: true
          name: asset
          in: query
        - schema:
            type: string
          required: false
          name: tx_hash
          in: query
        - schema:
            type: string
            description: ID of your Privy app.
          required: true
          name: privy-app-id
          in: header
      responses:
        '200':
          description: Latest wallet transactions.
          content:
            application/json:
              schema:
                type: object
                properties:
                  transactions:
                    type: array
                    items:
                      type: object
                      properties:
                        caip2:
                          type: string
                        transaction_hash:
                          type:
                            - string
                            - 'null'
                        status:
                          type: string
                          enum:
                            - broadcasted
                            - confirmed
                            - execution_reverted
                            - failed
                            - replaced
                            - finalized
                            - provider_error
                            - pending
                        created_at:
                          type: number
                        sponsored:
                          type: boolean
                        details:
                          oneOf:
                            - type: object
                              properties:
                                type:
                                  type: string
                                  enum:
                                    - transfer_sent
                                sender:
                                  type: string
                                sender_privy_user_id:
                                  type:
                                    - string
                                    - 'null'
                                recipient:
                                  type: string
                                recipient_privy_user_id:
                                  type:
                                    - string
                                    - 'null'
                                chain:
                                  type: string
                                  enum:
                                    - ethereum
                                    - arbitrum
                                    - base
                                    - tempo
                                    - linea
                                    - optimism
                                    - polygon
                                    - solana
                                    - zksync_era
                                    - sepolia
                                    - arbitrum_sepolia
                                    - base_sepolia
                                    - linea_testnet
                                    - optimism_sepolia
                                    - polygon_amoy
                                    - solana_devnet
                                    - solana_testnet
                                asset:
                                  anyOf:
                                    - type: string
                                      enum:
                                        - usdc
                                        - eth
                                        - pol
                                        - usdt
                                        - eurc
                                        - usdb
                                        - sol
                                        - usdc
                                        - eurc
                                    - type: string
                                raw_value:
                                  type: string
                                raw_value_decimals:
                                  type: number
                                display_values:
                                  type: object
                                  additionalProperties:
                                    type: string
                              required:
                                - type
                                - sender
                                - sender_privy_user_id
                                - recipient
                                - recipient_privy_user_id
                                - chain
                                - asset
                                - raw_value
                                - raw_value_decimals
                                - display_values
                            - type: object
                              properties:
                                type:
                                  type: string
                                  enum:
                                    - transfer_received
                                sender:
                                  type: string
                                sender_privy_user_id:
                                  type:
                                    - string
                                    - 'null'
                                recipient:
                                  type: string
                                recipient_privy_user_id:
                                  type:
                                    - string
                                    - 'null'
                                chain:
                                  type: string
                                  enum:
                                    - ethereum
                                    - arbitrum
                                    - base
                                    - tempo
                                    - linea
                                    - optimism
                                    - polygon
                                    - solana
                                    - zksync_era
                                    - sepolia
                                    - arbitrum_sepolia
                                    - base_sepolia
                                    - linea_testnet
                                    - optimism_sepolia
                                    - polygon_amoy
                                    - solana_devnet
                                    - solana_testnet
                                asset:
                                  anyOf:
                                    - type: string
                                      enum:
                                        - usdc
                                        - eth
                                        - pol
                                        - usdt
                                        - eurc
                                        - usdb
                                        - sol
                                        - usdc
                                        - eurc
                                    - type: string
                                raw_value:
                                  type: string
                                raw_value_decimals:
                                  type: number
                                display_values:
                                  type: object
                                  additionalProperties:
                                    type: string
                              required:
                                - type
                                - sender
                                - sender_privy_user_id
                                - recipient
                                - recipient_privy_user_id
                                - chain
                                - asset
                                - raw_value
                                - raw_value_decimals
                                - display_values
                            - type: 'null'
                        privy_transaction_id:
                          type: string
                        wallet_id:
                          type: string
                      required:
                        - caip2
                        - transaction_hash
                        - status
                        - created_at
                        - details
                        - privy_transaction_id
                        - wallet_id
                  next_cursor:
                    type:
                      - string
                      - 'null'
                required:
                  - transactions
                  - next_cursor
                example:
                  transactions:
                    - caip2: eip155:8453
                      transaction_hash: >-
                        0x03fe1b0fd11a74d277a5b7a68b762de906503b82cbce2fc791250fd2b77cf137
                      status: confirmed
                      created_at: 1746920539240
                      privy_transaction_id: au6wxoyhbw4yhwbn1s5v9gs9
                      wallet_id: xs76o3pi0v5syd62ui1wmijw
                      details:
                        type: transfer_sent
                        chain: base
                        asset: eth
                        sender: '0xa24c8d74c913e5dba36e45236c478f37c8bba20e'
                        sender_privy_user_id: rkiz0ivz254drv1xw982v3jq
                        recipient: '0x38bc05d7b69f63d05337829fa5dc4896f179b5fa'
                        recipient_privy_user_id: cmakymbpt000te63uaj85d9r6
                        raw_value: '1'
                        raw_value_decimals: 18
                        display_values:
                          eth: '0.000000000000000001'
                  next_cursor: null
      security:
        - appSecretAuth: []
components:
  securitySchemes:
    appSecretAuth:
      type: http
      scheme: basic
      description: >-
        Basic Auth header with your app ID as the username and your app secret
        as the password.

````\n