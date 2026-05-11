> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Get balance

> Get the balance of a wallet by wallet ID.

### SDK methods

Learn more about fetching wallet balances using our SDKs [here](/wallets/gas-and-asset-management/assets/fetch-balance).


## OpenAPI

````yaml get /v1/wallets/{wallet_id}/balance
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
  /v1/wallets/{wallet_id}/balance:
    get:
      tags:
        - Wallets
      summary: Get balance
      description: Get the balance of a wallet by wallet ID.
      parameters:
        - schema:
            type: string
            description: ID of the wallet.
          required: true
          name: wallet_id
          in: path
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
                maxItems: 10
          required: false
          name: asset
          in: query
        - schema:
            anyOf:
              - type: string
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
              - type: array
                items:
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
                maxItems: 10
          required: false
          name: chain
          in: query
        - schema:
            type: string
            enum:
              - usd
              - eur
          required: false
          name: include_currency
          in: query
        - schema:
            anyOf:
              - type: string
              - type: array
                items:
                  type: string
                maxItems: 10
            description: >-
              The token contract address(es) to query in format "chain:address"
              (e.g., "base:0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" or
              "solana:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v").
          required: false
          name: token
          in: query
        - schema:
            type: string
            description: ID of your Privy app.
          required: true
          name: privy-app-id
          in: header
      responses:
        '200':
          description: Latest wallet balance.
          content:
            application/json:
              schema:
                type: object
                properties:
                  balances:
                    type: array
                    items:
                      type: object
                      properties:
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
                        - chain
                        - asset
                        - raw_value
                        - raw_value_decimals
                        - display_values
                required:
                  - balances
                example:
                  balances:
                    - chain: base
                      asset: eth
                      raw_value: '1000000000000000000'
                      raw_value_decimals: 18
                      display_values:
                        eth: '0.001'
                        usd: '2.56'
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