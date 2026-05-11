> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Fetch balance via API

<Warning>
  The following functionality exists for [wallets reconstituted
  server-side](/wallets/wallets/create/create-a-wallet). More on [Privy architecture
  here](/security/wallet-infrastructure/architecture)
</Warning>

<View title="REST API" icon="terminal">
  Privy supports fetching wallet balances by the wallet ID.

  To do so, make a `GET` request to

  ```bash  theme={"system"}
  https://api.privy.io/v1/wallets/<wallet_id>/balance
  ```

  replacing `<wallet_id>` with the ID of your desired wallet.

  ## Response

  <ResponseField name="balance" type="string">
    The wallet's native token balance in the smallest denomination (e.g., wei for Ethereum). Returned
    as a string to maintain precision.
  </ResponseField>

  <ResponseField name="chain_type" type="string">
    The blockchain type (e.g., "ethereum", "solana").
  </ResponseField>

  <ResponseField name="address" type="string">
    The wallet's public address.
  </ResponseField>

  ## Example

  For example, your app might fetch a wallet's balance using the `cURL` request below.

  ```bash  theme={"system"}
  $ curl --request GET https://api.privy.io/v1/wallets/<wallet_id>/balance \
  -u "<your-privy-app-id>:<your-privy-app-secret>" \
  -H "privy-app-id: <your-privy-app-id>" \
  -H 'Content-Type: application/json'
  ```

  The response might look like

  ```json  theme={"system"}
  {
    "balances": [
      {
        "chain": "base",
        "asset": "eth",
        "raw_value": "1000000000000000000",
        "raw_value_decimals": 18,
        "display_values": {
          "eth": "0.001",
          "usd": "2.56"
        }
      }
    ]
  }
  ```

  ### Parameters and Returns

  Check out the [API reference](/api-reference/wallets/get-balance) for more details.
</View>

<View title="NodeJS" icon="node-js">
  To get a wallet's balance using the NodeJS SDK, use the `getBalance` method on the `wallets()` interface of the Privy client:

  ### Usage

  ```typescript  theme={"system"}
  import {PrivyClient} from '@privy-io/node';

  const privy = new PrivyClient({
    appId: 'insert-your-app-id',
    appSecret: 'insert-your-app-secret'
  });

  const balance = await privy.wallets().balance.get('insert-wallet-id', {
    asset: 'usdc',
    chain: 'ethereum'
  });
  console.log(balance);
  ```

  ### Parameters and Returns

  Check out the [API reference](/api-reference/wallets/get-balance) for more details.
</View>

<View title="Java" icon="java">
  To get a wallet's balance by ID, use the `getBalance` method.

  ```java  theme={"system"}
  try {
      WalletBalanceResponse response = privyClient
          .wallets()
          .balance()
          .walletId("insert-wallet-id")
          .call();

      if (response.object().isPresent()) {
          WalletBalanceResponseBody balanceBody = response.object().get();

          // The response contains a list of balances (one per chain/asset combination)
          for (Balance balance : balanceBody.balances()) {
              String rawValue = balance.rawValue();
              double rawValueDecimals = balance.rawValueDecimals();
              System.out.println("Balance: " + rawValue);
              System.out.println("Balance (decimals): " + rawValueDecimals);
              System.out.println("Chain: " + balance.chain());
              System.out.println("Asset: " + balance.asset());
          }
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
    The ID of the wallet to retrieve balance for
  </ParamField>

  ### Returns

  The `WalletBalanceResponse` object contains balance information for the wallet.

  <ResponseField name="balances()" type="List<Balance>">
    List of balance objects for different chain/asset combinations.

    <Expandable defaultOpen="true">
      <ResponseField name="rawValue()" type="String">
        Balance value as a string in the smallest denomination to maintain precision.
      </ResponseField>

      <ResponseField name="rawValueDecimals()" type="double">
        Balance value as a decimal number.
      </ResponseField>

      <ResponseField name="chain()" type="BalanceChainType">
        The blockchain type (e.g., ETHEREUM, SOLANA, BASE, POLYGON).
      </ResponseField>

      <ResponseField name="asset()" type="Asset">
        The asset type (e.g., NATIVE, USDC, USDT).
      </ResponseField>

      <ResponseField name="displayValues()" type="Map<String, String>">
        Formatted display values for the balance in different currencies/formats.
      </ResponseField>
    </Expandable>
  </ResponseField>
</View>

<View title="Rust" icon="rust">
  To get a wallet's balance using the Rust SDK, use the `get_balance` method on the `wallets()` interface of the Privy client:

  ### Usage

  ```rust  theme={"system"}
  use privy_rs::PrivyClient;

  let client = PrivyClient::new(app_id, app_secret)?;

  // For a Solana wallet
  let balance = client
      .wallets()
      .balance()
      .get(
          "insert-wallet-id",
          &GetWalletBalanceAsset::String(GetWalletBalanceAssetString::Sol),
          &GetWalletBalanceChain::String(GetWalletBalanceChainString::Solana),
          None, // optional: currency conversion (e.g., Some(GetWalletBalanceIncludeCurrency::Usd))
      )
      .await?;
  ```

  ### Parameters and Returns

  See the Rust SDK documentation for detailed parameter and return types, including embedded examples:

  * [WalletsBalanceClient::get](https://docs.rs/privy-rs/latest/privy_rs/subclients/struct.WalletsBalanceClient.html)
  * [GetWalletBalanceResponse](https://docs.rs/privy-rs/latest/privy_rs/generated/types/struct.GetWalletBalanceResponse.html)

  For REST API details, see the [API reference](/api-reference/wallets/get-balance).
</View>

<View title="Go" icon="golang">
  Use the `Get` method on the `Balance` service to fetch the balance of a wallet.

  ### Usage

  ```go  theme={"system"}
  balance, err := client.Wallets.Balance.Get(
      context.Background(),
      "wallet-id",
      privy.WalletBalanceGetParams{
          Chain: privy.WalletBalanceGetParamsChainUnion{
              OfWalletBalanceGetsChainString: privy.String("eip155:1"),
          },
      },
  )
  if err != nil {
      log.Fatalf("failed to get balance: %v", err)
  }

  fmt.Println("Balance:", balance)
  ```

  ### Parameters and Returns

  See the [API reference](/api-reference/wallets/get-balance) for more details.
</View>
\n