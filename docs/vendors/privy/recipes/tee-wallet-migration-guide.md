> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Migrating wallets from on-device to TEEs

Privy's security architecture leverages secure execution environments to protect your users' assets. Wallet private keys are only temporarily reconstructed within these strictly isolated, secure execution environments when needed for sensitive operations.

Privy provides two types of secure execution environments: 1) via TEEs and 2) on the user's device.

* With **[TEE execution](/security/wallet-infrastructure/architecture)**, wallets are reassembled within trusted execution environments (TEEs), also known as secure enclaves.
* With **[on-device execution](/security/wallet-infrastructure/advanced/user-device)**, wallets are reassembled directly on user devices.

Each environment ensures that private keys are never stored in complete form and are only temporarily reconstructed when needed.

### Feature support

Your app must enable TEE execution in order to access the following features:

* Support for **[Tier 2 and Tier 1 chains](/wallets/overview/chains)**, such as Bitcoin, SUI, Cosmos, and more.
* **[Policy engine](/controls/policies/overview)** in order to restrict Ethereum and Solana transactions.
* Server-side access to wallets, using **[signers](/wallets/using-wallets/signers)**.

#### Unsupported features

Support for the following features is in active development for TEE-based execution:

* Farcaster signers

## Migration guide

The following guide details how to migrate from on-device to TEE execution. When you enable TEE execution, all new wallets will be created within **trusted execution environments (TEEs)**. Existing on-device wallets will be migrated to TEEs when users next log in to your app. This is a one-way change.

**To be eligible to migrate from on-device to TEE execution:**

* Your app cannot be using Farcaster signers
* If your app is using delegated actions, migrating to TEE execution will reset all delegations and you will need to re-enable these delegated permissions using signers
* Your app cannot be built on the Flutter SDK or Unity SDK

### Step 1: Identify your app's execution environment

Navigate to the [Privy Dashboard](https://dashboard.privy.io/apps?tab=advanced\&page=wallets) to verify your app's wallet execution environment. On the **Wallets** page, navigate to the **Advanced** tab.

Your app's wallet environment will be shown here as either "On-device" (with an option to "Request access to migrate to TEE") or "TEE enabled". Apps may only enable one execution environment.

### Step 2: Upgrade your SDKs

TEE execution is supported by the following SDK versions or later:

**Client SDKs**:

* **React**: `@privy-io/react-auth@3.13.0`
* **Expo**: `@privy-io/expo@0.54.0`
* **iOS (Swift)**: `2.0.0-beta.11`
* **Android (Kotlin)**: `0.1.0-beta.1`
* **Flutter**: `0.1.0-beta.1`
* **Unity**: `0.6.0`

<Warning>
  Note that while the Flutter SDK and Unity SDK support TEE execution, they do NOT support migrating
  accounts from on-device to TEEs. If you have existing on-device wallets on these SDKs and want to
  migrate them to TEEs, please reach out to [support@privy.io](mailto:support@privy.io).
</Warning>

**Server SDKs**:

* **Node**: `@privy-io/node@0.1.0`
* **Node (legacy)**: `@privy-io/server-auth@1.26.0`

### Step 3: Enable TEE execution in the Dashboard and contact us

In the [Privy Dashboard](https://dashboard.privy.io/apps?tab=advanced\&page=wallets), navigate to the **Wallets** page and then the **Advanced** tab. Select **"Request access to migrate to TEE"** and follow the instructions.

When you enable TEE execution, all new wallets will be created within trusted execution environments (TEEs). Existing user wallets will be migrated from on-device to TEEs via end-to-end encryption as users next log in to your app. All client-side features will be immediately available after the user logs in and their wallet is migrated.

Please note that:

* All client-side features will be immediately available once a user logs in and their wallet is migrated.
* Only wallets that have been migrated to TEEs will support server-side features. Some users may not return to your app, so their wallets will remain on-device.
* User-managed recovery (like cloud recovery) will no longer be prompted on new devices and will be disabled after migration.
* This is a one-way change, and on-device execution is disabled once migration occurs.

<Accordion title=" (Optional) Manually control when wallets are migrated">
  By default, wallets are migrated automatically when users log in. If you prefer to manually control when wallets are migrated, you can disable automatic migration and trigger the migration process manually.

  <Warning>
    Automatic migration is enabled by default and is the recommended approach.

    If you are opting for manual migration, make sure that the migration is
    triggered as soon as possible. Avoid giving the option to opt-out to ensure a
    uniform experience across your userbase.
  </Warning>

  <View title="React" icon="react">
    Begin by disabling automatic migration by setting the
    `disableAutomaticMigration` flag to `true` in the provider config.

    ```tsx  theme={"system"}
    <PrivyProvider
      appId="your-privy-app-id"
      config={{
        ...theRestOfYourConfig,
        embeddedWallets: {
          disableAutomaticMigration: true
        }
      }}
    >
      {/* your app's content */}
    </PrivyProvider>
    ```

    Then, manually trigger the migration process by calling the `migrate`
    method returned by the `useMigrateWallets` hook.

    ```ts  theme={"system"}
    import {useMigrateWallets} from '@privy-io/react-auth';

    const {migrate} = useMigrateWallets();

    await migrate();
    ```

    ### Returns

    <ResponseField name="success" type="boolean">
      A promise that resolves to an object with a success property indicating
      if the user's wallets were migrated successfully.

      The promise will reject otherwise.
    </ResponseField>
  </View>

  <View title="React Native" icon="react">
    Begin by disabling automatic migration by setting the
    `disableAutomaticMigration` flag to `true` in the provider config.

    ```tsx  theme={"system"}
    <PrivyProvider
      appId="your-privy-app-id"
      config={{
        ...theRestOfYourConfig,
        embedded: {
          disableAutomaticMigration: true
        }
      }}
    >
      {/* your app's content */}
    </PrivyProvider>
    ```

    Then, manually trigger the migration process by calling the `migrate`
    method returned by the `useMigrateWallets` hook.

    ```ts  theme={"system"}
    import {useMigrateWallets} from '@privy-io/expo';

    const {migrate} = useMigrateWallets();

    await migrate();
    ```

    ### Returns

    <ResponseField name="success" type="boolean">
      A promise that resolves to an object with a success property indicating
      if the user's wallets were migrated successfully.

      The promise will reject otherwise.
    </ResponseField>
  </View>

  <View title="Android" icon="android">
    Begin by disabling automatic migration by setting the `disableAutomaticMigration` flag to `true` in the Privy config.

    ```kotlin  theme={"system"}
    val privy = Privy.init(
        context = applicationContext,
        config = PrivyConfig(
            appId = "your-privy-app-id",
            appClientId = "your-privy-app-client-id",
            logLevel = PrivyLogLevel.DEBUG,
            disableAutomaticMigration = true
        )
    )
    ```

    Then, manually trigger the migration process by calling the `migrateWalletsIfNeeded` method on the authenticated user.

    ```kotlin  theme={"system"}
    val user = privy.getUser()

    val result = user?.migrateWalletsIfNeeded()
    ```

    ### Returns

    <ResponseField name="Result<Unit>" type="Result<Unit>">
      A Result that resolves to success if the user's wallets were migrated successfully. The Result will contain a failure otherwise.
    </ResponseField>
  </View>

  <View title="Swift" icon="swift">
    Begin by disabling automatic migration by setting the
    `disableAutomaticMigration` flag to `true` in the embedded wallet config.

    ```swift  theme={"system"}
    let config = PrivyConfig(
        appId: "your-privy-app-id",
        appClientId: "your-privy-app-client-id",
        embeddedWalletConfig: PrivyEmbeddedWalletConfig(
            disableAutomaticMigration: true
        )
    )
    ```

    Then, manually trigger the migration process by calling the `migrateWalletsIfNeeded` method on the authenticated user.

    ```swift  theme={"system"}
    let user = privy.getUser()

    try await user?.migrateWalletsIfNeeded()
    ```

    ### Returns

    <ResponseField name="Void" type="Void">
      An async function that completes if the user's wallets were migrated successfully.

      The function will throw otherwise.
    </ResponseField>
  </View>
</Accordion>

## Breaking changes

Enabling TEE-based execution involves a limited set of breaking changes. These breaking changes do not apply to most apps.

### Unsupported features

A small number of features are not yet supported with TEE-based execution: [list of unsupported features](/recipes/tee-wallet-migration-guide#unsupported-features).

### useSessionSigners

TEE execution enables deeper configurability for clients to provision server-side access to user wallets. In particular, the advanced interface enables your app to specify policies or multiple signers on a wallet.

To provision server-side access to user wallets, use the `useSessionSigner` hook instead of the previous `useDelegatedActions` hook.

#### Adding signers (previous)

```javascript {1,4,7} theme={"system"}
import { useHeadlessDelegatedActions, ConnectedWallet } from '@privy-io/react-auth';

function SessionSignersButton(wallet: ConnectedWallet) {
  const { delegateWallet } = useHeadlessDelegatedActions();

  const handleAddSessionSigner = async () => {
    await delegateWallet({ address: wallet.address, chainType: wallet.type });
  }

  return (
    <div>
      <button onClick={() => handleAddSessionSigner()}>
        Add Signer
      </button>
    </div>
  );
}
```

Learn more about the previous interface [here](/wallets/using-wallets/signers/delegate-wallet).
The previous interface for revoking access can be found [here](/wallets/using-wallets/signers/revoke-wallets).

#### Adding signers (updated)

The updated interface allows a signer ID to be specified and for policies to be set which constrain that signer.

```javascript {1, 4,7-15} theme={"system"}
import {useSigners, ConnectedWallet} from '@privy-io/react-auth';

function SessionSignersButton(wallet: ConnectedWallet) {
  const {addSigners} = useSigners();

  const handleAddSessionSigner = async () => {
    await addSigners({
      address: wallet.address,
      signers: [
          {
            signerId: "<insert-signer-id>",
            policyIds: ["<insert-policy-id"],
          },
        ],
    });
}

  return (
    <div>
      <button onClick={() => handleAddSessionSigner()}>
        Add Signer
      </button>
    </div>
  );
}
```

Learn more about the updated interface [here](/wallets/using-wallets/signers/add-signers).
The updated interface for revoking access can be found [here](/wallets/using-wallets/signers/remove-signers).

## New advanced interfaces

### Server-side wallet creation

TEE execution enables deeper configurability for server-side wallet creation. In particular, the advanced interface enables your app to specify policies and signers when you create a wallet from your server.

The following interface update applies to [importing a single user](/user-management/migrating-users-to-privy/create-or-import-a-user), [batch importing users](/user-management/migrating-users-to-privy/create-or-import-a-batch-of-users), and [pregenerating wallets for existing users](/recipes/pregenerate-wallets) via the [`/users`](/api-reference/users), `/users/import` and `/v1/wallets` endpoints.

#### Wallet creation (previous)

<ParamField path="create_ethereum_wallet" type="boolean">
  (Optional) Whether to create an Ethereum wallet for the user.
</ParamField>

<ParamField path="create_solana_wallet" type="boolean">
  (Optional) Whether to create a Solana wallet for the user.
</ParamField>

<ParamField path="create_ethereum_smart_wallet" type="boolean">
  (Optional) Whether to create an Ethereum smart wallet for the user.
</ParamField>

<ParamField path="number_of_ethereum_wallets_to_create" type="number">
  (Optional) The number of Ethereum wallets to pregenerate for the user. Defaults to `1`.
</ParamField>

#### Wallet creation (updated)

<ParamField path="wallets" type="object[]" required>
  The wallets to create for the user.

  <Expandable defaultOpen="true">
    <ParamField path="chain_type" type="ethereum | solana | cosmos | stellar | sui | bitcoin-segwit | near | ton | starknet | aptos" required>
      Chain type of the wallet. "ethereum" supports any EVM-compatible network.
    </ParamField>

    <ParamField path="policy_ids" type="string[]">
      List of policy IDs for policies that should be enforced on the wallet. Currently, only one policy is supported per wallet.
    </ParamField>

    <ParamField path="additional_signers" type="object[]">
      <Expandable defaultOpen="true">
        <ParamField path="signer_id" type="string">
          The key ID of the signer.
        </ParamField>

        <ParamField path="override_policy_ids" type="string[]">
          List of policy IDs for policies that should be enforced on the wallet. Currently, only one policy is supported per wallet.
        </ParamField>
      </Expandable>
    </ParamField>

    <ParamField path="create_smart_wallet" type="boolean" required>
      Set to `true` to create a smart wallet with the user's wallet as the signer. Can only be set on wallets where `chain_type` is `ethereum`.
    </ParamField>
  </Expandable>
</ParamField>

#### Example usage

The following request body:

```json  theme={"system"}
{
  "create_ethereum_wallet": true,
  "create_smart_wallet": true,
  "create_solana_wallet": true
}
```

can be updated to:

```json  theme={"system"}
{
  "wallets": [{"chain_type": "ethereum", "create_smart_wallet": true}, {"chain_type": "solana"}]
}
```

In the updated interface, wallets may also set policies and signers, e.g.:

```json  theme={"system"}
{
  "wallets": [
    {"chain_type": "ethereum", "policy_ids": ["<policy-id>"], "create_smart_wallet": true},
    {
      "chain_type": "solana",
      "additional_signers": [
        {"signer_id": "<signer-id-1>", "override_policy_ids": ["policy-id-1"]},
        {"signer_id": "<signer-id-2>"}
      ]
    }
  ]
}
```
\n