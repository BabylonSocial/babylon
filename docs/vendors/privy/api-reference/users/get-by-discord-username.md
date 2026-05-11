> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Get user by Discord username

> Looks up a user by their Discord username.



## OpenAPI

````yaml post /v1/users/discord/username
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
  /v1/users/discord/username:
    post:
      tags:
        - Users
      summary: Lookup User by Discord Username
      description: Looks up a user by their Discord username.
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
                username:
                  type: string
              required:
                - username
      responses:
        '200':
          description: Object with user data.
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'
      security:
        - appSecretAuth: []
components:
  schemas:
    User:
      type: object
      properties:
        id:
          type: string
        linked_accounts:
          type: array
          items:
            $ref: '#/components/schemas/LinkedAccount'
        mfa_methods:
          type: array
          items:
            $ref: '#/components/schemas/LinkedMfaMethod'
        created_at:
          type: number
          description: Unix timestamp of when the user was created in milliseconds.
        has_accepted_terms:
          type: boolean
          description: Indicates if the user has accepted the terms of service.
        is_guest:
          type: boolean
          description: Indicates if the user is a guest account user.
        custom_metadata:
          $ref: '#/components/schemas/CustomMetadata'
      required:
        - id
        - linked_accounts
        - mfa_methods
        - created_at
        - has_accepted_terms
        - is_guest
      description: A Privy user object.
      title: User
      example:
        id: did:privy:cm3np4u9j001rc8b73seqmqqk
        created_at: 1731974895
        linked_accounts:
          - address: tom.bombadill@privy.io
            type: email
            first_verified_at: 1674788927
            latest_verified_at: 1674788927
            verified_at: 1674788927
          - type: farcaster
            fid: 4423
            owner_address: '0xE6bFb4137F3A8C069F98cc775f324A84FE45FdFF'
            username: payton
            display_name: payton ↑
            bio: >-
              engineering at /privy. building pixelpool.xyz, the first Farcaster
              video client. nyc. 👨‍💻🍎🏳️‍🌈  nf.td/payton
            profile_picture: >-
              https://supercast.mypinata.cloud/ipfs/QmNexfCxdnFzWdJqKVgrjd27UGLMexNaw5FXu1XKR3cQF7?filename=IMG_2799.png
            profile_picture_url: >-
              https://supercast.mypinata.cloud/ipfs/QmNexfCxdnFzWdJqKVgrjd27UGLMexNaw5FXu1XKR3cQF7?filename=IMG_2799.png
            verified_at: 1740678402
            first_verified_at: 1740678402
            latest_verified_at: 1741194370
          - type: passkey
            credential_id: Il5vP-3Tm3hNmDVBmDlREgXzIOJnZEaiVnT-XMliXe-BufP9GL1-d3qhozk9IkZwQ_
            authenticator_name: 1Password
            public_key: >-
              pQECAyYgASFYIKdGwx5XxZ/7CJJzT8d5L6jyLNQdTH7X+rSZdPJ9Ux/QIlggRm4OcJ8F3aB5zYz3T9LxLdDfGpWvYkHgS4A8tPz9CqE=
            created_with_browser: Chrome
            created_with_os: Mac OS
            created_with_device: Macintosh
            enrolled_in_mfa: true
            verified_at: 1741194420
            first_verified_at: 1741194420
            latest_verified_at: 1741194420
        mfa_methods:
          - type: passkey
            verified_at: 1741194420
        has_accepted_terms: true
        is_guest: false
      x-stainless-model: users.user
    LinkedAccount:
      anyOf:
        - $ref: '#/components/schemas/LinkedAccountEmail'
        - $ref: '#/components/schemas/LinkedAccountPhone'
        - $ref: '#/components/schemas/LinkedAccountEthereum'
        - $ref: '#/components/schemas/LinkedAccountSolana'
        - $ref: '#/components/schemas/LinkedAccountSmartWallet'
        - $ref: '#/components/schemas/LinkedAccountEthereumEmbeddedWallet'
        - $ref: '#/components/schemas/LinkedAccountSolanaEmbeddedWallet'
        - $ref: '#/components/schemas/LinkedAccountBitcoinSegwitEmbeddedWallet'
        - $ref: '#/components/schemas/LinkedAccountBitcoinTaprootEmbeddedWallet'
        - $ref: '#/components/schemas/LinkedAccountCurveSigningEmbeddedWallet'
        - $ref: '#/components/schemas/LinkedAccountGoogleOauth'
        - $ref: '#/components/schemas/LinkedAccountTwitterOauth'
        - $ref: '#/components/schemas/LinkedAccountDiscordOauth'
        - $ref: '#/components/schemas/LinkedAccountGithubOauth'
        - $ref: '#/components/schemas/LinkedAccountSpotifyOauth'
        - $ref: '#/components/schemas/LinkedAccountInstagramOauth'
        - $ref: '#/components/schemas/LinkedAccountTiktokOauth'
        - $ref: '#/components/schemas/LinkedAccountLineOauth'
        - $ref: '#/components/schemas/LinkedAccountTwitchOauth'
        - $ref: '#/components/schemas/LinkedAccountLinkedInOauth'
        - $ref: '#/components/schemas/LinkedAccountAppleOauth'
        - $ref: '#/components/schemas/LinkedAccountCustomOauth'
        - $ref: '#/components/schemas/LinkedAccountCustomJwt'
        - $ref: '#/components/schemas/LinkedAccountFarcaster'
        - $ref: '#/components/schemas/LinkedAccountPasskey'
        - $ref: '#/components/schemas/LinkedAccountTelegram'
        - $ref: '#/components/schemas/LinkedAccountCrossApp'
        - $ref: '#/components/schemas/LinkedAccountAuthorizationKey'
      description: A linked account for the user.
      title: LinkedAccount
      x-stainless-model: users.linked_account
    LinkedMfaMethod:
      oneOf:
        - $ref: '#/components/schemas/SmsMfaMethod'
        - $ref: '#/components/schemas/TotpMfaMethod'
        - $ref: '#/components/schemas/PasskeyMfaMethod'
      discriminator:
        propertyName: type
        mapping:
          sms:
            $ref: '#/components/schemas/SmsMfaMethod'
          totp:
            $ref: '#/components/schemas/TotpMfaMethod'
          passkey:
            $ref: '#/components/schemas/PasskeyMfaMethod'
      description: A multi-factor authentication method linked to the user.
      title: LinkedMfaMethod
      x-stainless-model: users.linked_mfa_method
    CustomMetadata:
      type: object
      additionalProperties:
        anyOf:
          - type: string
          - type: number
          - type: boolean
      description: Custom metadata associated with the user.
      title: CustomMetadata
      x-stainless-model: users.custom_metadata
    LinkedAccountEmail:
      type: object
      properties:
        type:
          type: string
          enum:
            - email
        address:
          type: string
        verified_at:
          type: number
        first_verified_at:
          type:
            - number
            - 'null'
        latest_verified_at:
          type:
            - number
            - 'null'
      required:
        - type
        - address
        - verified_at
        - first_verified_at
        - latest_verified_at
      description: An email account linked to the user.
      title: LinkedAccountEmail
      x-stainless-model: users.linked_account_email
    LinkedAccountPhone:
      type: object
      properties:
        type:
          type: string
          enum:
            - phone
        number:
          type: string
        phoneNumber:
          type: string
        verified_at:
          type: number
        first_verified_at:
          type:
            - number
            - 'null'
        latest_verified_at:
          type:
            - number
            - 'null'
      required:
        - type
        - phoneNumber
        - verified_at
        - first_verified_at
        - latest_verified_at
      description: A phone number account linked to the user.
      title: LinkedAccountPhone
      x-stainless-model: users.linked_account_phone
    LinkedAccountEthereum:
      type: object
      properties:
        type:
          type: string
          enum:
            - wallet
        address:
          type: string
        chain_id:
          type: string
        chain_type:
          type: string
          enum:
            - ethereum
        wallet_client:
          type: string
          enum:
            - unknown
        wallet_client_type:
          type: string
        connector_type:
          type: string
        verified_at:
          type: number
        first_verified_at:
          type:
            - number
            - 'null'
        latest_verified_at:
          type:
            - number
            - 'null'
      required:
        - type
        - address
        - chain_type
        - wallet_client
        - verified_at
        - first_verified_at
        - latest_verified_at
      description: An Ethereum wallet account linked to the user.
      title: LinkedAccountEthereum
      x-stainless-model: users.linked_account_ethereum
    LinkedAccountSolana:
      type: object
      properties:
        type:
          type: string
          enum:
            - wallet
        address:
          type: string
        chain_type:
          type: string
          enum:
            - solana
        wallet_client:
          type: string
          enum:
            - unknown
        wallet_client_type:
          type: string
        connector_type:
          type: string
        verified_at:
          type: number
        first_verified_at:
          type:
            - number
            - 'null'
        latest_verified_at:
          type:
            - number
            - 'null'
      required:
        - type
        - address
        - chain_type
        - wallet_client
        - verified_at
        - first_verified_at
        - latest_verified_at
      description: A Solana wallet account linked to the user.
      title: LinkedAccountSolana
      x-stainless-model: users.linked_account_solana
    LinkedAccountSmartWallet:
      type: object
      properties:
        type:
          type: string
          enum:
            - smart_wallet
        address:
          type: string
        smart_wallet_type:
          $ref: '#/components/schemas/SmartWalletType'
        smart_wallet_version:
          type: string
        verified_at:
          type: number
        first_verified_at:
          type:
            - number
            - 'null'
        latest_verified_at:
          type:
            - number
            - 'null'
      required:
        - type
        - address
        - smart_wallet_type
        - verified_at
        - first_verified_at
        - latest_verified_at
      description: A smart wallet account linked to the user.
      title: LinkedAccountSmartWallet
      x-stainless-model: users.linked_account_smart_wallet
    LinkedAccountEthereumEmbeddedWallet:
      type: object
      properties:
        id:
          type:
            - string
            - 'null'
        type:
          type: string
          enum:
            - wallet
        address:
          type: string
        imported:
          type: boolean
        delegated:
          type: boolean
        wallet_index:
          type: number
        chain_id:
          type: string
        chain_type:
          type: string
          enum:
            - ethereum
        wallet_client:
          type: string
          enum:
            - privy
        wallet_client_type:
          type: string
          enum:
            - privy
        connector_type:
          type: string
          enum:
            - embedded
        recovery_method:
          $ref: '#/components/schemas/EmbeddedWalletRecoveryMethod'
        verified_at:
          type: number
        first_verified_at:
          type:
            - number
            - 'null'
        latest_verified_at:
          type:
            - number
            - 'null'
      required:
        - id
        - type
        - address
        - imported
        - delegated
        - wallet_index
        - chain_id
        - chain_type
        - wallet_client
        - wallet_client_type
        - connector_type
        - recovery_method
        - verified_at
        - first_verified_at
        - latest_verified_at
      description: An Ethereum embedded wallet account linked to the user.
      title: LinkedAccountEthereumEmbeddedWallet
      x-stainless-model: users.linked_account_ethereum_embedded_wallet
    LinkedAccountSolanaEmbeddedWallet:
      type: object
      properties:
        id:
          type:
            - string
            - 'null'
        type:
          type: string
          enum:
            - wallet
        address:
          type: string
        imported:
          type: boolean
        delegated:
          type: boolean
        wallet_index:
          type: number
        chain_id:
          type: string
        chain_type:
          type: string
          enum:
            - solana
        wallet_client:
          type: string
          enum:
            - privy
        wallet_client_type:
          type: string
          enum:
            - privy
        connector_type:
          type: string
          enum:
            - embedded
        recovery_method:
          $ref: '#/components/schemas/EmbeddedWalletRecoveryMethod'
        verified_at:
          type: number
        first_verified_at:
          type:
            - number
            - 'null'
        latest_verified_at:
          type:
            - number
            - 'null'
        public_key:
          type: string
      required:
        - id
        - type
        - address
        - imported
        - delegated
        - wallet_index
        - chain_id
        - chain_type
        - wallet_client
        - wallet_client_type
        - connector_type
        - recovery_method
        - verified_at
        - first_verified_at
        - latest_verified_at
        - public_key
      description: A Solana embedded wallet account linked to the user.
      title: LinkedAccountSolanaEmbeddedWallet
      x-stainless-model: users.linked_account_solana_embedded_wallet
    LinkedAccountBitcoinSegwitEmbeddedWallet:
      type: object
      properties:
        id:
          type:
            - string
            - 'null'
        type:
          type: string
          enum:
            - wallet
        address:
          type: string
        imported:
          type: boolean
        delegated:
          type: boolean
        wallet_index:
          type: number
        chain_id:
          type: string
        chain_type:
          type: string
          enum:
            - bitcoin-segwit
        wallet_client:
          type: string
          enum:
            - privy
        wallet_client_type:
          type: string
          enum:
            - privy
        connector_type:
          type: string
          enum:
            - embedded
        recovery_method:
          $ref: '#/components/schemas/EmbeddedWalletRecoveryMethod'
        verified_at:
          type: number
        first_verified_at:
          type:
            - number
            - 'null'
        latest_verified_at:
          type:
            - number
            - 'null'
        public_key:
          type: string
      required:
        - id
        - type
        - address
        - imported
        - delegated
        - wallet_index
        - chain_id
        - chain_type
        - wallet_client
        - wallet_client_type
        - connector_type
        - recovery_method
        - verified_at
        - first_verified_at
        - latest_verified_at
        - public_key
      description: A Bitcoin SegWit embedded wallet account linked to the user.
      title: LinkedAccountBitcoinSegwitEmbeddedWallet
      x-stainless-model: users.linked_account_bitcoin_segwit_embedded_wallet
    LinkedAccountBitcoinTaprootEmbeddedWallet:
      type: object
      properties:
        id:
          type:
            - string
            - 'null'
        type:
          type: string
          enum:
            - wallet
        address:
          type: string
        imported:
          type: boolean
        delegated:
          type: boolean
        wallet_index:
          type: number
        chain_id:
          type: string
        chain_type:
          type: string
          enum:
            - bitcoin-taproot
        wallet_client:
          type: string
          enum:
            - privy
        wallet_client_type:
          type: string
          enum:
            - privy
        connector_type:
          type: string
          enum:
            - embedded
        recovery_method:
          $ref: '#/components/schemas/EmbeddedWalletRecoveryMethod'
        verified_at:
          type: number
        first_verified_at:
          type:
            - number
            - 'null'
        latest_verified_at:
          type:
            - number
            - 'null'
        public_key:
          type: string
      required:
        - id
        - type
        - address
        - imported
        - delegated
        - wallet_index
        - chain_id
        - chain_type
        - wallet_client
        - wallet_client_type
        - connector_type
        - recovery_method
        - verified_at
        - first_verified_at
        - latest_verified_at
        - public_key
      description: A Bitcoin Taproot embedded wallet account linked to the user.
      title: LinkedAccountBitcoinTaprootEmbeddedWallet
      x-stainless-model: users.linked_account_bitcoin_taproot_embedded_wallet
    LinkedAccountCurveSigningEmbeddedWallet:
      type: object
      properties:
        id:
          type:
            - string
            - 'null'
        type:
          type: string
          enum:
            - wallet
        address:
          type: string
        imported:
          type: boolean
        delegated:
          type: boolean
        wallet_index:
          type: number
        chain_id:
          type: string
        chain_type:
          $ref: '#/components/schemas/CurveSigningChainType'
        wallet_client:
          type: string
          enum:
            - privy
        wallet_client_type:
          type: string
          enum:
            - privy
        connector_type:
          type: string
          enum:
            - embedded
        recovery_method:
          $ref: '#/components/schemas/EmbeddedWalletRecoveryMethod'
        verified_at:
          type: number
        first_verified_at:
          type:
            - number
            - 'null'
        latest_verified_at:
          type:
            - number
            - 'null'
        public_key:
          type: string
      required:
        - id
        - type
        - address
        - imported
        - delegated
        - wallet_index
        - chain_id
        - chain_type
        - wallet_client
        - wallet_client_type
        - connector_type
        - recovery_method
        - verified_at
        - first_verified_at
        - latest_verified_at
        - public_key
      description: A curve signing embedded wallet account linked to the user.
      title: LinkedAccountCurveSigningEmbeddedWallet
      x-stainless-model: users.linked_account_curve_signing_embedded_wallet
    LinkedAccountGoogleOauth:
      type: object
      properties:
        type:
          type: string
          enum:
            - google_oauth
        subject:
          type: string
        email:
          type: string
        name:
          type:
            - string
            - 'null'
        verified_at:
          type: number
        first_verified_at:
          type:
            - number
            - 'null'
        latest_verified_at:
          type:
            - number
            - 'null'
      required:
        - type
        - subject
        - email
        - name
        - verified_at
        - first_verified_at
        - latest_verified_at
      description: A Google OAuth account linked to the user.
      title: LinkedAccountGoogleOauth
      x-stainless-model: users.linked_account_google_oauth
    LinkedAccountTwitterOauth:
      type: object
      properties:
        type:
          type: string
          enum:
            - twitter_oauth
        subject:
          type: string
        username:
          type:
            - string
            - 'null'
        name:
          type:
            - string
            - 'null'
        profile_picture_url:
          type:
            - string
            - 'null'
        verified_at:
          type: number
        first_verified_at:
          type:
            - number
            - 'null'
        latest_verified_at:
          type:
            - number
            - 'null'
      required:
        - type
        - subject
        - username
        - name
        - profile_picture_url
        - verified_at
        - first_verified_at
        - latest_verified_at
      description: A Twitter OAuth account linked to the user.
      title: LinkedAccountTwitterOauth
      x-stainless-model: users.linked_account_twitter_oauth
    LinkedAccountDiscordOauth:
      type: object
      properties:
        type:
          type: string
          enum:
            - discord_oauth
        subject:
          type: string
        username:
          type:
            - string
            - 'null'
        email:
          type:
            - string
            - 'null'
        verified_at:
          type: number
        first_verified_at:
          type:
            - number
            - 'null'
        latest_verified_at:
          type:
            - number
            - 'null'
      required:
        - type
        - subject
        - username
        - email
        - verified_at
        - first_verified_at
        - latest_verified_at
      description: A Discord OAuth account linked to the user.
      title: LinkedAccountDiscordOauth
      x-stainless-model: users.linked_account_discord_oauth
    LinkedAccountGithubOauth:
      type: object
      properties:
        type:
          type: string
          enum:
            - github_oauth
        subject:
          type: string
        username:
          type:
            - string
            - 'null'
        name:
          type:
            - string
            - 'null'
        email:
          type:
            - string
            - 'null'
        verified_at:
          type: number
        first_verified_at:
          type:
            - number
            - 'null'
        latest_verified_at:
          type:
            - number
            - 'null'
      required:
        - type
        - subject
        - username
        - name
        - email
        - verified_at
        - first_verified_at
        - latest_verified_at
      description: A GitHub OAuth account linked to the user.
      title: LinkedAccountGithubOauth
      x-stainless-model: users.linked_account_github_oauth
    LinkedAccountSpotifyOauth:
      type: object
      properties:
        type:
          type: string
          enum:
            - spotify_oauth
        subject:
          type: string
        email:
          type:
            - string
            - 'null'
        name:
          type:
            - string
            - 'null'
        verified_at:
          type: number
        first_verified_at:
          type:
            - number
            - 'null'
        latest_verified_at:
          type:
            - number
            - 'null'
      required:
        - type
        - subject
        - email
        - name
        - verified_at
        - first_verified_at
        - latest_verified_at
      description: A Spotify OAuth account linked to the user.
      title: LinkedAccountSpotifyOauth
      x-stainless-model: users.linked_account_spotify_oauth
    LinkedAccountInstagramOauth:
      type: object
      properties:
        type:
          type: string
          enum:
            - instagram_oauth
        subject:
          type: string
        username:
          type:
            - string
            - 'null'
        verified_at:
          type: number
        first_verified_at:
          type:
            - number
            - 'null'
        latest_verified_at:
          type:
            - number
            - 'null'
      required:
        - type
        - subject
        - username
        - verified_at
        - first_verified_at
        - latest_verified_at
      description: An Instagram OAuth account linked to the user.
      title: LinkedAccountInstagramOauth
      x-stainless-model: users.linked_account_instagram_oauth
    LinkedAccountTiktokOauth:
      type: object
      properties:
        type:
          type: string
          enum:
            - tiktok_oauth
        subject:
          type: string
        username:
          type:
            - string
            - 'null'
        name:
          type:
            - string
            - 'null'
        verified_at:
          type: number
        first_verified_at:
          type:
            - number
            - 'null'
        latest_verified_at:
          type:
            - number
            - 'null'
      required:
        - type
        - subject
        - username
        - name
        - verified_at
        - first_verified_at
        - latest_verified_at
      description: A TikTok OAuth account linked to the user.
      title: LinkedAccountTiktokOauth
      x-stainless-model: users.linked_account_tiktok_oauth
    LinkedAccountLineOauth:
      type: object
      properties:
        type:
          type: string
          enum:
            - line_oauth
        subject:
          type: string
        name:
          type:
            - string
            - 'null'
        email:
          type:
            - string
            - 'null'
        profile_picture_url:
          type:
            - string
            - 'null'
        verified_at:
          type: number
        first_verified_at:
          type:
            - number
            - 'null'
        latest_verified_at:
          type:
            - number
            - 'null'
      required:
        - type
        - subject
        - name
        - email
        - profile_picture_url
        - verified_at
        - first_verified_at
        - latest_verified_at
      description: A LINE OAuth account linked to the user.
      title: LinkedAccountLineOauth
      x-stainless-model: users.linked_account_line_oauth
    LinkedAccountTwitchOauth:
      type: object
      properties:
        type:
          type: string
          enum:
            - twitch_oauth
        subject:
          type: string
        username:
          type:
            - string
            - 'null'
        verified_at:
          type: number
        first_verified_at:
          type:
            - number
            - 'null'
        latest_verified_at:
          type:
            - number
            - 'null'
      required:
        - type
        - subject
        - username
        - verified_at
        - first_verified_at
        - latest_verified_at
      description: A Twitch OAuth account linked to the user.
      title: LinkedAccountTwitchOauth
      x-stainless-model: users.linked_account_twitch_oauth
    LinkedAccountLinkedInOauth:
      type: object
      properties:
        type:
          type: string
          enum:
            - linkedin_oauth
        subject:
          type: string
        name:
          type: string
        email:
          type:
            - string
            - 'null'
        vanity_name:
          type: string
        verified_at:
          type: number
        first_verified_at:
          type:
            - number
            - 'null'
        latest_verified_at:
          type:
            - number
            - 'null'
      required:
        - type
        - subject
        - email
        - verified_at
        - first_verified_at
        - latest_verified_at
      description: A LinkedIn OAuth account linked to the user.
      title: LinkedAccountLinkedInOauth
      x-stainless-model: users.linked_account_linked_in_oauth
    LinkedAccountAppleOauth:
      type: object
      properties:
        type:
          type: string
          enum:
            - apple_oauth
        subject:
          type: string
        email:
          type:
            - string
            - 'null'
        verified_at:
          type: number
        first_verified_at:
          type:
            - number
            - 'null'
        latest_verified_at:
          type:
            - number
            - 'null'
      required:
        - type
        - subject
        - email
        - verified_at
        - first_verified_at
        - latest_verified_at
      description: An Apple OAuth account linked to the user.
      title: LinkedAccountAppleOauth
      x-stainless-model: users.linked_account_apple_oauth
    LinkedAccountCustomOauth:
      type: object
      properties:
        type:
          $ref: '#/components/schemas/CustomOAuthProviderID'
        subject:
          type: string
        name:
          type: string
        username:
          type: string
        email:
          type: string
        profile_picture_url:
          type: string
        verified_at:
          type: number
        first_verified_at:
          type:
            - number
            - 'null'
        latest_verified_at:
          type:
            - number
            - 'null'
      required:
        - type
        - subject
        - verified_at
        - first_verified_at
        - latest_verified_at
      description: A custom OAuth account linked to the user.
      title: LinkedAccountCustomOauth
      x-stainless-model: users.linked_account_custom_oauth
    LinkedAccountCustomJwt:
      type: object
      properties:
        type:
          type: string
          enum:
            - custom_auth
        custom_user_id:
          type: string
        verified_at:
          type: number
        first_verified_at:
          type:
            - number
            - 'null'
        latest_verified_at:
          type:
            - number
            - 'null'
      required:
        - type
        - custom_user_id
        - verified_at
        - first_verified_at
        - latest_verified_at
      description: A custom JWT account linked to the user.
      title: LinkedAccountCustomJwt
      x-stainless-model: users.linked_account_custom_jwt
    LinkedAccountFarcaster:
      type: object
      properties:
        type:
          type: string
          enum:
            - farcaster
        fid:
          type: number
        owner_address:
          type: string
        username:
          type: string
        display_name:
          type: string
        bio:
          type: string
        profile_picture:
          type: string
        profile_picture_url:
          type: string
        homepage_url:
          type: string
        verified_at:
          type: number
        first_verified_at:
          type:
            - number
            - 'null'
        latest_verified_at:
          type:
            - number
            - 'null'
        signer_public_key:
          type: string
      required:
        - type
        - fid
        - owner_address
        - verified_at
        - first_verified_at
        - latest_verified_at
      description: A Farcaster account linked to the user.
      title: LinkedAccountFarcaster
      x-stainless-model: users.linked_account_farcaster
    LinkedAccountPasskey:
      type: object
      properties:
        type:
          type: string
          enum:
            - passkey
        created_with_browser:
          type: string
        created_with_os:
          type: string
        created_with_device:
          type: string
        credential_id:
          type: string
        authenticator_name:
          type: string
        public_key:
          type: string
        enrolled_in_mfa:
          type: boolean
        verified_at:
          type: number
        first_verified_at:
          type:
            - number
            - 'null'
        latest_verified_at:
          type:
            - number
            - 'null'
      required:
        - type
        - credential_id
        - enrolled_in_mfa
        - verified_at
        - first_verified_at
        - latest_verified_at
      description: A passkey account linked to the user.
      title: LinkedAccountPasskey
      x-stainless-model: users.linked_account_passkey
    LinkedAccountTelegram:
      type: object
      properties:
        type:
          type: string
          enum:
            - telegram
        telegram_user_id:
          type: string
        first_name:
          type:
            - string
            - 'null'
        last_name:
          type:
            - string
            - 'null'
        username:
          type:
            - string
            - 'null'
        photo_url:
          type:
            - string
            - 'null'
        verified_at:
          type: number
        first_verified_at:
          type:
            - number
            - 'null'
        latest_verified_at:
          type:
            - number
            - 'null'
      required:
        - type
        - telegram_user_id
        - verified_at
        - first_verified_at
        - latest_verified_at
      description: A Telegram account linked to the user.
      title: LinkedAccountTelegram
      x-stainless-model: users.linked_account_telegram
    LinkedAccountCrossApp:
      type: object
      properties:
        type:
          type: string
          enum:
            - cross_app
        subject:
          type: string
        provider_app_id:
          type: string
        embedded_wallets:
          type: array
          items:
            $ref: '#/components/schemas/CrossAppEmbeddedWallet'
        smart_wallets:
          type: array
          items:
            $ref: '#/components/schemas/CrossAppSmartWallet'
        verified_at:
          type: number
        first_verified_at:
          type:
            - number
            - 'null'
        latest_verified_at:
          type:
            - number
            - 'null'
      required:
        - type
        - subject
        - provider_app_id
        - embedded_wallets
        - smart_wallets
        - verified_at
        - first_verified_at
        - latest_verified_at
      description: A cross-app account linked to the user.
      title: LinkedAccountCrossApp
      x-stainless-model: users.linked_account_cross_app
    LinkedAccountAuthorizationKey:
      type: object
      properties:
        type:
          type: string
          enum:
            - authorization_key
        public_key:
          type: string
        verified_at:
          type: number
        first_verified_at:
          type:
            - number
            - 'null'
        latest_verified_at:
          type:
            - number
            - 'null'
      required:
        - type
        - public_key
        - verified_at
        - first_verified_at
        - latest_verified_at
      description: An authorization key linked to the user.
      title: LinkedAccountAuthorizationKey
      x-stainless-model: users.linked_account_authorization_key
    SmsMfaMethod:
      type: object
      properties:
        type:
          type: string
          enum:
            - sms
        verified_at:
          type: number
      required:
        - type
        - verified_at
      description: A SMS MFA method.
      title: SmsMfaMethod
      x-stainless-model: users.sms_mfa_method
    TotpMfaMethod:
      type: object
      properties:
        type:
          type: string
          enum:
            - totp
        verified_at:
          type: number
      required:
        - type
        - verified_at
      description: A TOTP MFA method.
      title: TotpMfaMethod
      x-stainless-model: users.totp_mfa_method
    PasskeyMfaMethod:
      type: object
      properties:
        type:
          type: string
          enum:
            - passkey
        verified_at:
          type: number
      required:
        - type
        - verified_at
      description: A Passkey MFA method.
      title: PasskeyMfaMethod
      x-stainless-model: users.passkey_mfa_method
    SmartWalletType:
      type: string
      enum:
        - safe
        - kernel
        - light_account
        - biconomy
        - coinbase_smart_wallet
        - thirdweb
      description: The provider for a smart wallet.
      title: SmartWalletType
      x-stainless-model: users.smart_wallet_type
    EmbeddedWalletRecoveryMethod:
      type: string
      enum:
        - privy
        - user-passcode
        - google-drive
        - icloud
        - recovery-encryption-key
        - privy-v2
      description: The method used to recover an embedded wallet account.
      title: EmbeddedWalletRecoveryMethod
      x-stainless-model: users.embedded_wallet_recovery_method
    CurveSigningChainType:
      type: string
      enum:
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
      description: The wallet chain types that support curve-based signing.
      title: CurveSigningChainType
      x-stainless-model: wallets.curve_signing_chain_type
    CustomOAuthProviderID:
      type: string
      description: >-
        The ID of a custom OAuth provider, set up for this app. Must start with
        "custom:".
      title: CustomOAuthProviderID
      x-stainless-model: client_auth.custom_oauth_provider_id
    CrossAppEmbeddedWallet:
      type: object
      properties:
        address:
          type: string
      required:
        - address
      description: An embedded wallet associated with a cross-app account.
      title: CrossAppEmbeddedWallet
      x-stainless-model: users.cross_app_embedded_wallet
    CrossAppSmartWallet:
      type: object
      properties:
        address:
          type: string
      required:
        - address
      description: A smart wallet associated with a cross-app account.
      title: CrossAppSmartWallet
      x-stainless-model: users.cross_app_smart_wallet
  securitySchemes:
    appSecretAuth:
      type: http
      scheme: basic
      description: >-
        Basic Auth header with your app ID as the username and your app secret
        as the password.

````\n