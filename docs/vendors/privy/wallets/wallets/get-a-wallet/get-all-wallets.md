> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Get all wallets

Get all wallets for your application.

<View title="NodeJS" icon="node-js">
  To fetch all your application's wallets, use the Privy client's `walletApi.getWallets` method. This is a paginated query.

  ```tsx  theme={"system"}
  getWallets: ({cursor?: string, limit?: number, chainType?: 'ethereum' | 'solana'}) => Promise<{data: WalletApiWalletResponseType[], nextCursor?: string}>
  ```

  ### Usage

  ```ts  theme={"system"}
  // Will iterate automatically until all wallets are fetched
  for await (const wallet of privy.wallets().list({chain_type: 'ethereum'})) {
      // Do something with the wallet
  }
  ```

  ### Parameters and Returns

  Check out the [API reference](/api-reference/wallets/get-all) for more details.
</View>

<View title="NodeJS (server-auth)" icon="node-js">
  <Warning>
    The `@privy-io/server-auth` library is deprecated. We recommend integrating `@privy-io/node` for
    the latest features and support.
  </Warning>

  To fetch all your application's wallets, use the Privy client's `walletApi.getWallets` method. This is a paginated query.

  ```tsx  theme={"system"}
  getWallets: ({cursor?: string, limit?: number, chainType?: 'ethereum' | 'solana'}) => Promise<{data: WalletApiWalletResponseType[], nextCursor?: string}>
  ```

  ### Usage

  ```tsx  theme={"system"}
  const wallets = [];
  let nextCursor;

  do {
      const result = await privy.walletApi.getWallets({chainType: 'ethereum', cursor: nextCursor});
      wallets.push(...result.data);
      nextCursor = result.nextCursor;
  } while (nextCursor);
  const wallet = wallets.find((wallet) => wallet.address === desiredAddress);
  ```

  ### Parameters

  The `getWallets` method optionally accepts an object with the following fields:

  <ParamField path="cursor" type="string">
    ID of the wallet from which start the search
  </ParamField>

  <ParamField path="limit" type="number">
    Max amount of wallets to fetch per page
  </ParamField>

  <ParamField path="chainType" type="'ethereum' | 'solana'">
    Chain type to filter by.
  </ParamField>

  ### Returns

  <ResponseField name="data" type="WalletApiWalletResponseType[]">
    List of wallets in the current page
  </ResponseField>

  <ResponseField name="nextCursor" type="string">
    Cursor to use for fetching the next page of results, if any
  </ResponseField>
</View>

<View title="Java" icon="java">
  To fetch all of your application's wallets, use the `list` method.

  ```java  theme={"system"}
  try {
      WalletListRequest request = WalletListRequest.builder()
          .chainType(WalletChainType.ETHEREUM)
          .build();

      WalletListResponse response = privyClient.wallets().list(request);

      if (response.wallets().isPresent()) {
          List<Wallet> wallets = response.wallets().get().data();
      }
  } catch (APIException e) {
      String errorBody = e.bodyAsString();
      System.err.println(errorBody);
  } catch (Exception e) {
      System.err.println(e.getMessage());
  }
  ```

  ### Parameters

  The `WalletListRequest` object accepts the following parameters, all of which are optional:

  <ParamField body="chainType" type="WalletChainType">
    The chain type to filter by.
  </ParamField>

  <ParamField body="userId" type="String">
    The user ID to filter by.
  </ParamField>

  <ParamField body="cursor" type="String">
    The cursor to use for fetching the next page of results, if any.
  </ParamField>

  <ParamField body="limit" type="Double">
    The maximum number of wallets to fetch per page.
    Defaults to `100`.
  </ParamField>

  ### Returns

  The `WalletListResponse` object contains an optional `object()` field, present if the
  wallets were retrieved successfully.

  <ResponseField name="object()" type="Optional<WalletListResponseBody>">
    The retrieved list of wallets. Each of the elements in the list under `.data()` is a `Wallet` object.

    <Expandable>
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
        The creation date of the wallet, as Unix time.
      </ResponseField>
    </Expandable>
  </ResponseField>
</View>

<View title="REST API" icon="terminal">
  To fetch your wallets by pages, make a `GET` request to:

  ```
  https://api.privy.io/v1/wallets
  ```

  ### Query

  In the request query parameters, include any of the following:

  <ParamField path="cursor" type="string">
    ID of the wallet from which start the search
  </ParamField>

  <ParamField path="limit" type="number">
    Max amount of wallets per page
  </ParamField>

  <ParamField path="chain_type" type="'ethereum' | 'solana'">
    Chain type to filter by.
  </ParamField>

  ### Response

  In the response, Privy will send back the following if successful:

  <ResponseField name="data" type="Array<WalletApiWalletResponseType>">
    List of wallets in the current page

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

  <ResponseField name="next_cursor" type="string">
    ID of the wallet from which start the next page
  </ResponseField>

  ### Example

  As an example, a sample request to fetch EVM wallets might look like the following:

  ```bash  theme={"system"}
  $ curl --request GET https://api.privy.io/v1/wallets?chain_type=ethereum&limit=1 \
  -u "<your-privy-app-id>:<your-privy-app-secret>" \
  -H "privy-app-id: <your-privy-app-id>" \
  -H 'Content-Type: application/json' \
  ```

  A successful response will look like the following:

  ```json  theme={"system"}
  {
    "data": [
      {
        "id": "yepf6384cu2nkup42gvrwdqh",
        "address": "0x2F3eb40872143b77D54a6f6e7Cc120464C764c09",
        "chain_type": "ethereum",
        "authorization_threshold": 2,
        "owner_id": null,
        "additional_signers": [],
        "created_at": 1733923425155
      }
    ],
    "next_cursor": "u67nttpkeeti2hm9w7aoxdcc"
  }
  ```
</View>

<View title="Rust" icon="rust">
  To fetch all your application's wallets, use the `list` method on the `wallets()` interface of the Privy client. This is a paginated query that requires manual pagination.

  ### Usage

  ```rust  theme={"system"}
  use privy_rs::{PrivyClient, generated::types::*};

  let client = PrivyClient::new(app_id, app_secret)?;

  // Manual pagination through all wallets
  let mut all_wallets = Vec::new();
  let mut cursor = None;

  loop {
      let response = client.wallets().list(&WalletListQuery {
          chain_type: Some(WalletChainType::Ethereum),
          user_id: None,
          limit: Some(50), // Fetch 50 at a time
          cursor: cursor.clone(),
      }).await?;

      all_wallets.extend(response.data);

      if let Some(next_cursor) = response.next_cursor {
          cursor = Some(next_cursor);
      } else {
          break; // No more pages
      }
  }

  for wallet in all_wallets {
      println!("Wallet {}: {}", wallet.id, wallet.address);
  }
  ```

  ### Parameters and Returns

  See the Rust SDK documentation for detailed parameter and return types, including embedded examples:

  * [WalletsClient::list](https://docs.rs/privy-rs/latest/privy_rs/subclients/struct.WalletsClient.html#method.list)
  * [WalletListQuery](https://docs.rs/privy-rs/latest/privy_rs/generated/types/struct.WalletListQuery.html)
  * [Wallet](https://docs.rs/privy-rs/latest/privy_rs/generated/types/struct.Wallet.html)

  For REST API details, see the [API reference](/api-reference/wallets/get-all).

  ### Helper Function Example

  ```rust  theme={"system"}
  use privy_rs::{PrivyClient, generated::types::*};

  async fn fetch_all_wallets_by_chain(
      client: &PrivyClient,
      chain_type: WalletChainType,
  ) -> Result<Vec<Wallet>, Box<dyn std::error::Error>> {
      let mut all_wallets = Vec::new();
      let mut cursor = None;

      loop {
          let response = client
              .wallets()
              .list(&WalletListQuery {
                  chain_type: Some(chain_type.clone()),
                  user_id: None,
                  limit: Some(50), // Fetch 50 at a time
                  cursor: cursor.clone(),
              })
              .await?;

          all_wallets.extend(response.data);

          if let Some(next_cursor) = response.next_cursor {
              cursor = Some(next_cursor);
          } else {
              break; // No more pages
          }
      }

      Ok(all_wallets)
  }
  ```
</View>

<View title="Go" icon="golang">
  To fetch all wallets with the Go SDK, use the `ListAutoPaging` method on the `Wallets` service. This handles pagination automatically.

  ### Usage

  ```go  theme={"system"}
  iter := client.Wallets.ListAutoPaging(context.Background(), privy.WalletListParams{
      ChainType: privy.WalletChainTypeEthereum,
  })

  for iter.Next() {
      wallet := iter.Current()
      fmt.Println("Wallet:", wallet.ID, wallet.Address)
  }

  if err := iter.Err(); err != nil {
      log.Fatalf("error listing wallets: %v", err)
  }
  ```

  ### Parameters and Returns

  See the [API reference](/api-reference/wallets/get-all) for more details.
</View>
\n