> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Create a wallet

Privy enables you to programmatically create wallets embedded within your application. When you create a wallet, you can specify its `owner`, which defines who controls the wallet.

* To create a user wallet, specify a **user ID** as an owner of the wallet. This ensures only the authenticated user has access to their wallet. All client-side SDKs create user wallets by default and automatically set the wallet owner as the authenticated user.
* Or, you can specify an **authorization key** as an `owner` on a wallet. The holder of the authorization key, typically your application backend, controls the wallet. You must use a server-side SDK to create wallets owned by an authorization key.

<View title="React" icon="react">
  <Tip>
    The React SDK supports automatically creating embedded wallets for your users when they log in to your app. View [this guide](/basics/react/advanced/automatic-wallet-creation) to learn more and configure automatic wallet creation.
  </Tip>

  <Tabs>
    <Tab title="Ethereum">
      To create a wallet with the React SDK, use the `createWallet` method from the `useCreateWallet` hook:

      ```tsx  theme={"system"}
      createWallet: async ({createAdditional?: boolean, signers?: {signerId: string, policyIds?: string[]}[]}) => Promise<Wallet>
      ```

      ### Usage

      ```tsx  theme={"system"}
      import {useCreateWallet} from '@privy-io/react-auth';
      const {createWallet} = useCreateWallet();
      ```

      ### Parameters

      <ParamField path="opts.createAdditional" type="boolean">
        Whether or not to create an additional Ethereum wallet for the user if they already have an existing Ethereum embedded wallet. Must be set to `true` to create additional wallets. Defaults to `false`. [Learn more](/recipes/hd-wallets)
      </ParamField>

      <ParamField path="opts.signers" type="{signerId: string, policyIds?: string[]}[]">
        An array of [signers](/wallets/using-wallets/signers/overview) to add to the wallet at creation time. Each signer object accepts a `signerId` (the key quorum ID) and an optional `policyIds` array to scope the signer's permissions.
      </ParamField>

      ### Returns

      <ResponseField name="wallet" type="Promise<Wallet>">
        A `Promise` for the linked account object for the created wallet.
      </ResponseField>

      ### Callbacks

      You can optionally register an `onSuccess` or `onError` callback on the `useCreateWallet` hook.

      ```tsx  theme={"system"}
      const {createWallet} = useCreateWallet({
          onSuccess: ({wallet}) => {
              console.log('Created wallet ', wallet);
          },
          onError: (error) => {
              console.error('Failed to create wallet with error ', e)
          }
      })
      ```

      <ParamField path="onSuccess" type="({wallet: Wallet}) => void">
        Optional callback to run after a user successfully creates a wallet.
      </ParamField>

      <ParamField path="onError" type="(error: string) => void">
        Optional callback to run after there is an error during wallet creation.
      </ParamField>
    </Tab>

    <Tab title="Solana">
      To create a wallet with the React SDK, use the `createWallet` method from the `useCreateWallet` hook:

      ```tsx  theme={"system"}
      createWallet: async ({createAdditional?: boolean, signers?: {signerId: string, policyIds?: string[]}[]}) => Promise<Wallet>
      ```

      ### Usage

      ```tsx  theme={"system"}
      import {useCreateWallet} from '@privy-io/react-auth/solana';
      const {createWallet} = useCreateWallet();
      ```

      ### Parameters

      The `createWallet` method optionally accepts as a parameter an `opts` object with the following fields:

      <ParamField path="opts.createAdditional" type="boolean">
        Whether or not to create an additional Solana wallet for the user if they already have an existing Solana embedded wallet. Must be set to `true` to create additional wallets. Defaults to `false`. [Learn more](/recipes/hd-wallets)
      </ParamField>

      <ParamField path="opts.signers" type="{signerId: string, policyIds?: string[]}[]">
        An array of [signers](/wallets/using-wallets/signers/overview) to add to the wallet at creation time. Each signer object accepts a `signerId` (the key quorum ID) and an optional `policyIds` array to scope the signer's permissions.
      </ParamField>

      ### Returns

      <ResponseField name="wallet" type="Wallet">
        The linked account object for the created wallet.
      </ResponseField>
    </Tab>

    <Tab title="Other chains">
      To create a wallet in any of the chains supported at the [Tier 2 level](/wallets/overview/chains)
      with the React SDK, use the `createWallet` method from the `useCreateWallet` hook,
      imported from `@privy-io/react-auth/extended-chains`:

      ```tsx  theme={"system"}
      createWallet: async ({chainType: ExtendedChainType}) => Promise<{user: User; wallet: Wallet}>
      ```

      ### Usage

      ```tsx  theme={"system"}
      import {useCreateWallet} from '@privy-io/react-auth/extended-chains';
      const {createWallet} = useCreateWallet();

      const {user, wallet} = await createWallet({chainType: 'cosmos'}); // or 'stellar', 'sui', etc.
      ```

      ### Parameters

      <ParamField path="opts.chainType" type="ExtendedChainType">
        The chain type of the wallet to create. This could be any of the chains supported at the [Tier 2 level](/wallets/overview/chains).
      </ParamField>

      ### Returns

      <ResponseField path="output" type="Promise<{user: User; wallet: Wallet}>">
        <Expandable title="child properties" defaultOpen="true">
          <ResponseField name="user" type="User">
            The updated user object with the new wallet added to the user's `linkedAccounts` array.
          </ResponseField>

          <ResponseField name="wallet" type="Wallet">
            The newly created wallet.
          </ResponseField>
        </Expandable>
      </ResponseField>
    </Tab>
  </Tabs>
</View>

<View title="React Native" icon="react">
  <Tip>
    The React Native SDK supports automatically creating embedded wallets for your users when they log in to your app. View [this guide](/basics/react/advanced/automatic-wallet-creation) to learn more and configure automatic wallet creation.
  </Tip>

  <Tabs>
    <Tab title="Ethereum">
      To create a wallet with the React Native SDK, use the `create` method from the `useEmbeddedEthereumWallet` hook:

      ```tsx  theme={"system"}
      create: async ({createAdditional?: boolean}) => Promise<{user: User}>
      ```

      ### Usage

      ```tsx  theme={"system"}
      import {useEmbeddedEthereumWallet} from '@privy-io/expo';
      const {create} = useEmbeddedEthereumWallet();
      ```

      ### Parameters

      The `create` method optionally accepts as a parameter an `opts` object with the following fields:

      <ParamField path="opts.createAdditional" type="boolean">
        Whether or not to create an additional Ethereum wallet for the user if they already have an existing Ethereum embedded wallet. Must be set to `true` to create additional wallets. Defaults to `false`. [Learn more](/recipes/hd-wallets)
      </ParamField>

      ### Returns

      <ResponseField name="user" type="Promise<{user: User}>">
        A `Promise` for an object containing the updated `user` object for the user.
      </ResponseField>
    </Tab>

    <Tab title="Solana">
      To create a wallet with the React Native SDK, use the `create` method from the `useEmbeddedSolanaWallet` hook:

      ```tsx  theme={"system"}
      create: async ({createAdditional?: boolean}) => Promise<{user: User}>
      ```

      ### Usage

      ```tsx  theme={"system"}
      import {useEmbeddedSolanaWallet} from '@privy-io/expo';
      const {create} = useEmbeddedSolanaWallet();
      ```

      ### Parameters

      The `create` method optionally accepts as a parameter an `opts` object with the following fields:

      <ParamField path="opts.createAdditional" type="boolean">
        Whether or not to create an additional Solana wallet for the user if they already have an existing Solana embedded wallet. Must be set to `true` to create additional wallets. Defaults to `false`. [Learn more](/recipes/hd-wallets)
      </ParamField>

      ### Returns

      <ResponseField name="user" type="Promise<{user: User}>">
        A `Promise` for an object containing the updated `user` object.
      </ResponseField>
    </Tab>

    <Tab title="Other chains">
      To create a wallet in any of the chains supported at the [Tier 2 level](/wallets/overview/chains)
      with the React Native SDK, use the `createWallet` method from the `useCreateWallet` hook,
      imported from `@privy-io/expo/extended-chains`:

      ```tsx  theme={"system"}
      createWallet: async ({chainType: ExtendedChainType}) => Promise<{user: PrivyUser; wallet: Wallet}>
      ```

      ### Usage

      ```tsx  theme={"system"}
      import {useCreateWallet} from '@privy-io/expo/extended-chains';
      const {createWallet} = useCreateWallet();

      const {user, wallet} = await createWallet({chainType: 'cosmos'}); // or 'stellar', 'sui', etc.
      ```

      ### Parameters

      <ParamField path="opts.chainType" type="ExtendedChainType">
        The chain type of the wallet to create. This could be any of the chains supported at the [Tier 2 level](/wallets/overview/chains).
      </ParamField>

      ### Returns

      <ResponseField path="output" type="Promise<{user: PrivyUser; wallet: Wallet}>">
        <Expandable title="child properties" defaultOpen="true">
          <ResponseField name="user" type="PrivyUser">
            The updated user object with the new wallet added to the user's `linked_accounts` array.
          </ResponseField>

          <ResponseField name="wallet" type="Wallet">
            The newly created wallet.
          </ResponseField>
        </Expandable>
      </ResponseField>
    </Tab>
  </Tabs>
</View>

<View title="Swift" icon="swift">
  <Tabs>
    <Tab title="Ethereum">
      To create a wallet with the Swift SDK, use the `createEthereumWallet` method from the `PrivyUser` instance:

      ```swift  theme={"system"}
      func createEthereumWallet(allowAdditional: Bool) async throws -> EmbeddedEthereumWallet
      ```

      ### Parameters

      The `createEthereumWallet` method optionally accepts the following parameters:

      <ParamField path="allowAdditional" type="Boolean">
        Whether or not to create an additional Ethereum wallet for the user if they already have an existing Ethereum embedded wallet. Must be set to `true` to create additional wallets. Defaults to `false`.
      </ParamField>

      ### Returns

      <ResponseField name="wallet" type="EmbeddedEthereumWallet">
        The newly created `EmbeddedEthereumWallet`.
      </ResponseField>
    </Tab>

    <Tab title="Solana">
      To create a wallet with the Swift SDK, use the `createSolanaWallet` method from the `PrivyUser` instance:

      ```swift  theme={"system"}
      func createSolanaWallet() async throws -> EmbeddedSolanaWallet
      ```

      ### Returns

      <ResponseField name="wallet" type="EmbeddedSolanaWallet">
        The newly created `EmbeddedSolanaWallet`.
      </ResponseField>
    </Tab>
  </Tabs>
</View>

<View title="Android" icon="android">
  <Tabs>
    <Tab title="Ethereum">
      To create a wallet with the Android SDK, use the `createEthereumWallet` method from the `PrivyUser` instance:

      ```kotlin  theme={"system"}
      public suspend fun createEthereumWallet: (allowAdditional?: Boolean) => Result<EmbeddedEthereumWallet>
      ```

      ### Parameters

      The `createEthereumWallet` method optionally accepts the following parameters:

      <ParamField path="allowAdditional" type="Boolean">
        Whether or not to create an additional Ethereum wallet for the user if they already have an existing Ethereum embedded wallet. Must be set to `true` to create additional wallets. Defaults to `false`.
      </ParamField>

      ### Returns

      <ResponseField name="wallet" type="Result<EmbeddedEthereumWallet>">
        A `Result` containing the `EmbeddedEthereumWallet` for the user.
      </ResponseField>
    </Tab>

    <Tab title="Solana">
      To create a wallet with the Android SDK, use the `createSolanaWallet` method from the `PrivyUser` instance:

      ```kotlin  theme={"system"}
      public suspend fun createEthereumWallet: (allowAdditional?: Boolean) => Result<EmbeddedSolanaWallet>
      ```

      ### Returns

      <ResponseField name="wallet" type="Result<EmbeddedSolanaWallet>">
        A `Result` containing the `EmbeddedSolanaWallet` for the user.
      </ResponseField>
    </Tab>
  </Tabs>
</View>

<View title="Unity" icon="unity">
  <Tabs>
    <Tab title="Ethereum">
      To create a wallet with the Unity SDK, use the `CreateWallet` method on your `PrivyUser` instance:

      ```csharp  theme={"system"}
      Task<IEmbeddedEthereumWallet> CreateWallet(bool allowAdditional)
      ```

      ### Parameters

      The `CreateWallet` method accepts the following parameter:

      <ParamField path="allowAdditional" type="Boolean">
        Whether or not to create an additional wallet for the user if they already have an existing ethereum wallet.
        Must be set to `true` to create additional wallets.
        Defaults to `false`.
      </ParamField>

      ### Returns

      <ResponseField name="wallet" type="Task<IEmbeddedEthereumWallet>">
        A `Task` for the created ethereum wallet object.
      </ResponseField>
    </Tab>

    <Tab title="Solana">
      To create a wallet with the Unity SDK, use the `CreateSolanaWallet` method on your `PrivyUser` instance:

      ```csharp  theme={"system"}
      Task<IEmbeddedSolanaWallet> CreateSolanaWallet(bool allowAdditional)
      ```

      ### Parameters

      The `CreateSolanaWallet` method accepts the following parameter:

      <ParamField path="allowAdditional" type="Boolean">
        Whether or not to create an additional wallet for the user if they already have an existing solana wallet.
        Must be set to `true` to create additional wallets.
        Defaults to `false`.
      </ParamField>

      ### Returns

      <ResponseField name="wallet" type="Task<IEmbeddedSolanaWallet>">
        A `Task` for the created solana wallet object.
      </ResponseField>
    </Tab>
  </Tabs>
</View>

<View title="Flutter" icon="flutter">
  <Tabs>
    <Tab title="Ethereum">
      To create a wallet with the Flutter SDK, use the `createEthereumWallet` method from the `PrivyUser` instance:

      ```dart  theme={"system"}
      Future<Result<EmbeddedEthereumWallet>> createEthereumWallet({bool allowAdditional = false});
      ```

      ### Parameters

      The `createEthereumWallet` method optionally accepts as a parameter an `opts` object with the following fields:

      <ParamField path="allowAdditional" type="bool">
        Whether or not to create an additional Ethereum wallet for the user if they already have an existing Ethereum embedded wallet. Must be set to `true` to create additional wallets. Defaults to `false`.
      </ParamField>

      ### Returns

      <ResponseField name="wallet" type="Future<Result<EmbeddedEthereumWallet>>">
        A `Result` containing the `EmbeddedEthereumWallet` for the user.
      </ResponseField>
    </Tab>

    <Tab title="Solana">
      To create a wallet with the Android SDK, use the `createSolanaWallet` method from the `PrivyUser` instance:

      ```dart  theme={"system"}
      Future<Result<EmbeddedSolanaWallet>> createSolanaWallet()
      ```

      ### Parameters

      The `createSolanaWallet` method optionally accepts the following parameters:

      <ParamField path="allowAdditional" type="Boolean">
        Whether or not to create an additional Solana wallet for the user if they already have an existing Solana embedded wallet. Must be set to `true` to create additional wallets. Defaults to `false`.
      </ParamField>

      ### Returns

      <ResponseField name="wallet" type="Future<Result<EmbeddedSolanaWallet>>">
        A `Result` containing the `EmbeddedSolanaWallet` for the user.
      </ResponseField>
    </Tab>
  </Tabs>
</View>

<View title="NodeJS" icon="node-js">
  To create a new wallet with the NodeJS SDK, use the `create` method on the `wallets()` interface of the Privy client.

  <Info>
    If you are creating a user wallet, you must specify the user ID as the owner of the wallet. You can obtain a user ID by first [creating a user](/user-management/migrating-users-to-privy/create-or-import-a-user) before creating the wallet.

    Or, you can [create a user and wallet at the same time](/user-management/migrating-users-to-privy/create-or-import-a-user).
  </Info>

  ### Usage

  ```ts  theme={"system"}
  const {id, address, chain_type} = await privy.wallets().create({chain_type: 'ethereum', owner: {user_id: 'privy:did:xxxxx'}});
  ```

  ### Parameters and Returns

  Check out the [API reference](/api-reference/wallets/create) for more details.

  <Tip>
    Your app can provision a smart account with the wallet as a signer by following [this guide](/wallets/gas-and-asset-management/gas/ethereum).
  </Tip>
</View>

<View title="NodeJS (server-auth)" icon="node-js">
  <Warning>
    The `@privy-io/server-auth` library is deprecated. We recommend integrating `@privy-io/node` for
    the latest features and support.
  </Warning>

  To create a new wallet with the NodeJS SDK, use the `createWallet` method from the Privy client's `walletApi` class:

  ```ts  theme={"system"}
  createWallet: (input: WalletApiCreateRequestType) => Promise<WalletApiCreateResponseType>
  ```

  <Info>
    If you are creating a user wallet, you must specify the user ID as the owner of the wallet. You can obtain a user ID by first [creating a user](/user-management/migrating-users-to-privy/create-or-import-a-user) before creating the wallet.

    Or, you can [create a user and wallet at the same time](/user-management/migrating-users-to-privy/create-or-import-a-user).
  </Info>

  ### Usage

  ```ts  theme={"system"}
  const {id, address, chainType} = await privy.walletApi.createWallet({chainType: 'ethereum', owner: {userId: 'privy:did:xxxxx'}});
  ```

  ### Parameters

  The `createWallet` method accepts as a parameter an `input` object with the following fields:

  <ParamField type="'ethereum' | 'solana' | 'stellar' | 'cosmos' | 'sui' | 'tron' | 'bitcoin-segwit' | 'near' | 'ton' | 'starknet' | 'aptos'" path="chainType" required>
    Chain type of the wallet to create.
  </ParamField>

  <ParamField type="{'userId': string} | {'publicKey': string}" path="owner">
    The user ID to set as the owner of the wallet, or the P-256 public key to set as the owner of the wallet.

    If you provide this, do not specify an `ownerId` as it will be generated automatically.

    View [this guide](/controls/authorization-keys/owners/overview) to learn more about owners.
  </ParamField>

  <ParamField type="string" path="ownerId">
    The key quorum ID of the owner of the wallet. If you provide this, do not specify an `owner`.

    View [this guide](/controls/authorization-keys/owners/overview) to learn more about owners.
  </ParamField>

  <ParamField type="string[]" path="policyIds">
    List of policy IDs for policies that should be enforced on the wallet. Currently, only one policy is supported per wallet.
  </ParamField>

  <ParamField type="string" path="idempotencyKey">
    [Idempotency key](/api-reference/idempotency-keys) to identify a unique request.
  </ParamField>

  <ParamField type="{'signerId': string}[]" path="additionalSigners">
    List of key quorum IDs that should be allowed to approve transactions for the wallet.
  </ParamField>

  ### Returns

  <ResponseField type="string" name="id">
    Unique ID of the created wallet. This will be the primary identifier when using the wallet in the future.
  </ResponseField>

  <ResponseField type="string" name="address">
    Address of the created wallet.
  </ResponseField>

  <ResponseField type="'ethereum' | 'solana' | 'stellar' | 'cosmos' | 'sui' | 'tron' | 'bitcoin-segwit' | 'near' | 'ton' | 'starknet' | 'aptos'" name="chainType">
    Chain type of the created wallet.
  </ResponseField>

  <ResponseField type="string[]" name="policyIds">
    List of policy IDs for policies that are enforced on the wallet.
  </ResponseField>

  <ResponseField type="string | null" name="ownerId">
    The key quorum ID of the owner of the wallet. If an `ownerId` was passed in, this response is the input `ownerId`. If a user ID or authorization key was passed in as the `owner`, this response is a newly created key quorum containing the input user ID or authorization key.
  </ResponseField>

  <ResponseField type="{signerId: string}[]" name="additionalSigners">
    The key quorum IDs of the additional signers for the wallet.
  </ResponseField>

  <Tip>
    Your app can provision a smart account with the wallet as a signer by following [this guide](/wallets/gas-and-asset-management/gas/ethereum).
  </Tip>
</View>

<View title="Java" icon="java">
  To create a new wallet with the Java SDK, use the `create` method from the Privy client's `wallets()` helper:

  ### Usage

  ```java  theme={"system"}
  try {
      // Example 1: Create an ethereum wallet with no owner
      WalletCreateRequestBody walletRequest1 = WalletCreateRequestBody.builder()
          .chainType(WalletChainType.ETHEREUM)
          .build();

      // Example 2: Create an ethereum wallet with a user owner
      WalletCreateRequestBody walletRequest2 = WalletCreateRequestBody.builder()
          .chainType(WalletChainType.ETHEREUM)
          .owner(OwnerInput.of(UserOwner.builder().userId("privy-user-id").build()))
          .build();

      // Example 3: Create an ethereum wallet with a public key owner
      WalletCreateRequestBody walletRequest3 = WalletCreateRequestBody.builder()
          .chainType(WalletChainType.ETHEREUM)
          .owner(OwnerInput.of(PublicKeyOwner.builder().publicKey("authorization-key").build()))
          .build();

      // Example 4: Create an ethereum wallet with a key quorum owner
      WalletCreateRequestBody walletRequest4 = WalletCreateRequestBody.builder()
          .chainType(WalletChainType.ETHEREUM)
          .ownerId("key-quorum-id")
          .build();

      WalletCreateResponse response = privyClient.wallets()
          .create(walletRequest1); // or walletRequest2, walletRequest3, or walletRequest4

      if (response.wallet().isPresent()) {
          Wallet createdWallet = response.wallet().get();
      }
  } catch (APIException e) {
      String errorBody = e.bodyAsString();
      System.err.println(errorBody);
  } catch (Exception e) {
      System.err.println(e.getMessage());
  }
  ```

  ### Parameters

  When creating a wallet, you may specify the following values on the `WalletCreateRequestBody`:

  <ParamField body="chainType" type="String" required>
    The chain to create the wallet on.
  </ParamField>

  <ParamField body="policyIds" type="List<String>">
    List of policy IDs for policies that should be enforced on the wallet. Currently, only one policy
    is supported per wallet.
  </ParamField>

  <ParamField body="owner" type="OwnerInput">
    The owner of the resource, which can either be a public key from a p256 keypair, or a user ID. If
    you provide this, do not specify an `ownerId` as it will be generated automatically.
  </ParamField>

  <ParamField body="ownerId" type="String">
    The key quorum ID to set as the owner of the resource. If you provide this, do not specify
    an`owner`.
  </ParamField>

  <ParamField body="additionalSigners" type="WalletAdditionalSigner">
    Additional signers for the wallet.
  </ParamField>

  ### Returns

  The `WalletCreateResponse` object contains an optional `wallet()` field, present if the
  wallet was created successfully.

  <ResponseField name="wallet()" type="Optional<Wallet>">
    The newly created `Wallet` object.

    <Expandable defaultOpen="true">
      <ResponseField type="String" name="id">
        Unique ID of the created wallet. This will be the primary identifier when using the wallet in the future.
      </ResponseField>

      <ResponseField type="String" name="address">
        Address of the created wallet.
      </ResponseField>

      <ResponseField type="WalletChainType" name="chainType">
        Chain type of the created wallet.
      </ResponseField>

      <ResponseField type="List<String>" name="policyIds">
        List of policy IDs for policies that are enforced on the wallet.
      </ResponseField>

      <ResponseField type="String" name="ownerId">
        The key quorum ID of the owner of the wallet. If an `ownerId` was passed in, this response is the input `ownerId`. If a user ID or authorization key was passed in as the `owner`, this response is a newly created key quorum containing the input user ID or authorization key.
      </ResponseField>

      <ResponseField type="List<WalletAdditionalSigner>" name="additionalSigners">
        The key quorum IDs of the additional signers for the wallet.
      </ResponseField>

      <ResponseField type="double" name="createdAt">
        The creation date of the wallet, as Unix time.
      </ResponseField>
    </Expandable>
  </ResponseField>
</View>

<View title="REST API" icon="terminal">
  To create a new wallet for a user, make a `POST` request to

  ```bash  theme={"system"}
  https://api.privy.io/v1/wallets
  ```

  <Info>
    If you are creating a user wallet, you must specify the user ID as the owner of the wallet. You can obtain a user ID by first [creating a user](/user-management/migrating-users-to-privy/create-or-import-a-user) before creating the wallet.

    Or, you can [create a user and wallet at the same time](/user-management/migrating-users-to-privy/create-or-import-a-user).
  </Info>

  ### Body

  In the request body, include the following fields.

  <ParamField type="'ethereum' | 'solana' | 'cosmos' | 'stellar' | 'sui' | 'aptos' | 'movement' | 'tron' | 'bitcoin-segwit' | 'near' | 'ton' | 'starknet' | 'spark'" path="chain_type" required>
    Chain type of the wallet to create.
  </ParamField>

  <ParamField type="{user_id: string} | {public_key: string} | null" path="owner">
    The user ID to set as the owner of the wallet, or the P-256 public key to set as the owner of the wallet.

    If you provide this, do not specify an `owner_id` as it will be generated automatically.

    View [this guide](/controls/authorization-keys/owners/overview) to learn more about owners.
  </ParamField>

  <ParamField type="string | null" path="owner_id">
    The key quorum ID of the owner of the wallet. If you provide this, do not specify an `owner`.

    View [this guide](/controls/authorization-keys/owners/overview) to learn more about owners.
  </ParamField>

  <ParamField type="string[]" path="policy_ids">
    List of policy IDs for policies that should be enforced on the wallet. Currently, only one policy is supported per wallet.
  </ParamField>

  <ParamField type="string" path="idempotency_key">
    [Idempotency key](/api-reference/idempotency-keys) to identify a unique request.
  </ParamField>

  <ParamField type="{signer_id: string}[]" path="additional_signers">
    The key quorum IDs to add as additional signers for the wallet.
  </ParamField>

  ### Response

  In the response, Privy will send back the following if successful:

  <ResponseField type="string" name="id">
    Unique ID of the created wallet. This will be the primary identifier when using the wallet in the future.
  </ResponseField>

  <ResponseField type="string" name="address">
    Address of the created wallet.
  </ResponseField>

  <ResponseField type="'ethereum' | 'solana' | 'stellar' | 'cosmos' | 'sui' | 'tron' | 'bitcoin-segwit' | 'near' | 'ton' | 'starknet' | 'aptos'" name="chain_type">
    Chain type of the created wallet.
  </ResponseField>

  <ResponseField type="string[]" name="policy_ids">
    List of policy IDs for policies that are enforced on the wallet.
  </ResponseField>

  <ResponseField type="string | null" name="owner_id">
    The key quorum ID of the owner of the wallet. If an `ownerId` was passed in, this response is the input `ownerId`. If a user ID or authorization key was passed in as the `owner`, this response is a newly created key quorum containing the input user ID or authorization key.
  </ResponseField>

  <ResponseField type="{signer_id: string}[]" name="additional_signers">
    The key quorum IDs of the additional signers for the wallet.
  </ResponseField>

  <ResponseField name="created_at" type="number">
    The creation date of the wallet, in milliseconds since midnight, January 1, 1970 UTC.
  </ResponseField>

  ### Example

  A sample request might look like the following:

  ```bash  theme={"system"}
  curl --request POST https://api.privy.io/v1/wallets \
      -u "<your-privy-app-id>:<your-privy-app-secret>" \
      -H "privy-app-id: <your-privy-app-id>" \
      -H 'Content-Type: application/json' \
      -d '{
      "owner": {
          "user_id": "did:privy:xxxxxx"
      },
      "chain_type": "ethereum"
      }'
  ```

  A successful response will look like the following:

  ```json  theme={"system"}
  {
      "id": "fmfdj6yqly31huorjqzq38zc",
      "address": "0xf9f284C7Eaf97b0f9B5542d83Af7F785D12E803a",
      "chain_type": "ethereum",
      "policy_ids": [],
      "owner_id": null,
      "additional_signers": [],
      "created_at": 1733923425155
  }
  ```

  ### Rate limits

  Wallet creation endpoints are subject to rate limiting. If you encounter rate limits (HTTP 429), implement exponential backoff in your retry logic.

  <Tip>
    Learn more about handling rate limits effectively in our [optimizing your setup](/recipes/dashboard/optimizing#handling-rate-limits) guide.
  </Tip>
</View>

<View title="Rust" icon="rust">
  To create a new wallet with the Rust SDK, use the `create` method on the `wallets()` interface of the Privy client.

  <Info>
    If you are creating a user wallet, you must specify the user ID as the owner of the wallet. You can obtain a user ID by first [creating a user](/user-management/migrating-users-to-privy/create-or-import-a-user) before creating the wallet.

    Or, you can [create a user and wallet at the same time](/user-management/migrating-users-to-privy/create-or-import-a-user).
  </Info>

  ### Usage

  ```rust  theme={"system"}
  use privy_rs::{PrivyClient, generated::types::*};

  let client = PrivyClient::new(app_id, app_secret)?;

  // Create an Ethereum wallet with a user owner
  let wallet = client
      .wallets()
      .create(
          None, // idempotency key (optional)
          &CreateWalletBody {
              chain_type: WalletChainType::Ethereum,
              owner: Some(Owner::UserOwner(UserOwner {
                  user_id: "did:privy:xxxxx".to_string(),
              })),
              policy_ids: vec![],
              additional_signers: vec![],
          },
      )
      .await?;

  println!("Created wallet {} with address {}", wallet.id, wallet.address);
  ```

  ### Parameters and Returns

  See the Rust SDK documentation for detailed parameter and return types, including embedded examples:

  * [WalletsClient::create](https://docs.rs/privy-rs/latest/privy_rs/subclients/struct.WalletsClient.html#method.create)
  * [CreateWalletBody](https://docs.rs/privy-rs/latest/privy_rs/generated/types/struct.CreateWalletBody.html)
  * [Wallet](https://docs.rs/privy-rs/latest/privy_rs/generated/types/struct.Wallet.html)

  For REST API details, see the [API reference](/api-reference/wallets/create).

  <Tip>
    Your app can provision a smart account with the wallet as a signer by following [this guide](/wallets/gas-and-asset-management/gas/ethereum).
  </Tip>
</View>

<View title="Go" icon="golang">
  To create a new wallet with the Go SDK, use the `New` method on the `Wallets` service.

  <Info>
    If you are creating a user wallet, you must specify the user ID as the owner of the wallet. You can obtain a user ID by first [creating a user](/user-management/migrating-users-to-privy/create-or-import-a-user) before creating the wallet.

    Or, you can [create a user and wallet at the same time](/user-management/migrating-users-to-privy/create-or-import-a-user).
  </Info>

  ### Usage

  ```go  theme={"system"}
  // Create an Ethereum wallet with a user owner
  wallet, err := client.Wallets.New(context.Background(), privy.WalletNewParams{
      ChainType: privy.WalletChainTypeEthereum,
      Owner: privy.WalletNewParamsOwnerUnion{
          OfUserOwner: &privy.WalletNewParamsOwnerUserOwner{
              UserID: "did:privy:xxxxx",
          },
      },
  })
  if err != nil {
      log.Fatalf("failed to create wallet: %v", err)
  }

  fmt.Println("Created wallet:", wallet.ID, wallet.Address)
  ```

  ### Parameters and Returns

  See the [API reference](/api-reference/wallets/create) for more details.

  <Tip>
    Your app can provision a smart account with the wallet as a signer by following [this
    guide](/wallets/gas-and-asset-management/gas/ethereum).
  </Tip>
</View>
\n