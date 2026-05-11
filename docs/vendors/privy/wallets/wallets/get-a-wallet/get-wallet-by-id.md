> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Get wallet by ID

You can get a specific wallet by its ID from the Privy API.

Note this is a wallet-centric abstraction. You may be looking for a way to [find a given user's wallets](/user-management/users/managing-users/querying-users).

<View title="NodeJS" icon="node-js">
  To get a wallet by ID, use the `get` method on the `wallets()` interface of the Privy client.

  ### Usage

  ```tsx  theme={"system"}
  const wallet = await privy.wallets().get(walletId);
  ```

  ### Parameters and Returns

  Check out the [API reference](/api-reference/wallets/get) for more details.
</View>

<View title="NodeJS (server-auth)" icon="node-js">
  <Warning>
    The `@privy-io/server-auth` library is deprecated. We recommend integrating `@privy-io/node` for
    the latest features and support.
  </Warning>

  To get a wallet by ID, use the `getWallet` method.

  ```tsx  theme={"system"}
  getWallet: ({id}: {id: string}) => Promise<WalletApiWalletResponseType>
  ```

  ### Usage

  ```tsx  theme={"system"}
  const wallet = await client.walletApi.getWallet({id: walletId});
  ```

  ### Parameters

  <ParamField path="id" type="string">
    The ID of the wallet to get
  </ParamField>

  ### Returns

  <ResponseField name="wallet" type="WalletApiWalletResponseType">
    <Expandable defaultOpen="true">
      <ResponseField name="id" type="string">
        Unique ID of the wallet
      </ResponseField>

      <ResponseField name="address" type="string">
        Address of the wallet
      </ResponseField>

      <ResponseField name="chainType" type="'ethereum' | 'solana'">
        Chain type of the wallet
      </ResponseField>

      <ResponseField name="policyIds" type="string[]">
        List of policy IDs associated with the wallet
      </ResponseField>

      <ResponseField type="string | null" name="ownerId">
        The key quorum ID of the owner of the wallet.
      </ResponseField>

      <ResponseField type="{signerId: string}[]" name="additionalSigners">
        The key quorum IDs of the additional signers for the wallet.
      </ResponseField>

      <ResponseField name="createdAt" type="Date">
        The creation date of the wallet
      </ResponseField>
    </Expandable>
  </ResponseField>
</View>

<View title="Java" icon="java">
  To get a wallet by ID, use the `retrieve` method.

  ```java  theme={"system"}
  try {
      WalletRetrieveResponse response = privyClient.wallets().retrieve(walletId);
      if (response.wallet().isPresent()) {
          Wallet wallet = response.wallet().get();
      }
  } catch (APIException e) {
      String errorBody = e.bodyAsString();
      System.err.println(errorBody);
  } catch (Exception e) {
      System.err.println(e.getMessage());
  }
  ```

  ### Parameters

  <ParamField body="walletId" type="String" required>
    The ID of the wallet to retrieve
  </ParamField>

  ### Returns

  The `WalletRetrieveResponse` object contains an optional `wallet()` field, present if the
  wallet was retrieved successfully.

  <ResponseField name="wallet()" type="Optional<Wallet>">
    The retrieved `Wallet` object.

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
        The key quorum ID of the owner of the wallet.
      </ResponseField>

      <ResponseField type="List<WalletAdditionalSigner>" name="additionalSigners">
        The key quorum IDs of the additional signers for the wallet.
      </ResponseField>

      <ResponseField type="double" name="createdAt">
        The creation date of the wallet, in milliseconds since midnight, January 1, 1970 UTC.
      </ResponseField>
    </Expandable>
  </ResponseField>
</View>

<View title="REST API" icon="terminal">
  To get a wallet by ID, make a `GET` request to:

  ```
  https://api.privy.io/v1/wallets/[wallet-id]
  ```

  ### Response

  <ResponseField name="data" type="WalletApiWalletResponseType">
    The wallet object

    <Expandable defaultOpen="true">
      <ResponseField name="id" type="string">
        Unique ID of the wallet
      </ResponseField>

      <ResponseField name="address" type="string">
        Address of the wallet
      </ResponseField>

      <ResponseField name="chain_type" type="'ethereum' | 'solana'">
        Chain type of the wallet
      </ResponseField>

      <ResponseField name="policy_ids" type="string[]">
        List of policy IDs associated with the wallet
      </ResponseField>

      <ResponseField type="string | null" name="owner_id">
        The key quorum ID of the owner of the wallet.
      </ResponseField>

      <ResponseField type="{signer_id: string}[]" name="additional_signers">
        The key quorum IDs of the additional signers for the wallet.
      </ResponseField>

      <ResponseField name="created_at" type="number">
        The creation date of the wallet, in milliseconds since midnight, January 1, 1970 UTC.
      </ResponseField>
    </Expandable>
  </ResponseField>
</View>

<View title="Rust" icon="rust">
  To get a wallet by ID, use the `get` method on the `wallets()` interface of the Privy client.

  ### Usage

  ```rust  theme={"system"}
  use privy_rs::PrivyClient;

  let client = PrivyClient::new(app_id, app_secret)?;
  let wallet = client.wallets().get("wallet-id").await?;
  println!("Retrieved wallet {} with address {}", wallet.id, wallet.address);
  ```

  ### Parameters and Returns

  See the Rust SDK documentation for detailed parameter and return types, including embedded examples:

  * [WalletsClient::get](https://docs.rs/privy-rs/latest/privy_rs/subclients/struct.WalletsClient.html#method.get)
  * [Wallet](https://docs.rs/privy-rs/latest/privy_rs/generated/types/struct.Wallet.html)

  For REST API details, see the [API reference](/api-reference/wallets/get).
</View>

<View title="Go" icon="golang">
  To get a wallet by ID with the Go SDK, use the `Get` method on the `Wallets` service.

  ### Usage

  ```go  theme={"system"}
  wallet, err := client.Wallets.Get(context.Background(), "wallet-id")
  if err != nil {
      log.Fatalf("failed to get wallet: %v", err)
  }

  fmt.Println("Wallet:", wallet.ID, wallet.Address, wallet.ChainType)
  ```

  ### Parameters and Returns

  See the [API reference](/api-reference/wallets/get) for more details.
</View>
\n