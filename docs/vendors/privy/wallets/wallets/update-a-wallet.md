> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Update a wallet

Privy enables you to update the policies, owners, and signers for a wallet.

<View title="REST API" icon="terminal">
  To update an existing wallet, make a `PATCH` request to:

  ```
  https://api.privy.io/v1/wallets/<wallet_id>
  ```

  <Info>
    Wallets with `owner_id` present must provide an [authorization signature](/api-reference/authorization-signatures) as a request header. Privy SDKs offer utility functions such as `generateAuthorizationSignature` to generate the authorization signature.
  </Info>

  ### Body

  In the request body, include the following fields:

  <ParamField path="policy_ids" type="string[]">
    New policy IDs to enforce on the wallet. Currently, only one policy is supported per wallet.
  </ParamField>

  <ParamField type="{user_id: string} | {public_key: string} | null" path="owner">
    The user ID or P-256 public key of the owner of the wallet. If you provide this, do not specify an owner\_id as it will be generated automatically.

    View [this guide](/controls/authorization-keys/owners/overview) to learn more about owners.
  </ParamField>

  <ParamField type="string | null" path="owner_id">
    The key quorum ID of the owner of the wallet. If you provide this, do not specify an owner.

    View [this guide](/controls/authorization-keys/owners/overview) to learn more about owners.
  </ParamField>

  <ParamField type="{signer_id: string}[]" path="additional_signers">
    The key quorum IDs to add as additional signers for the wallet.

    View [this guide](/controls/key-quorum/overview) to learn more about key quorums.
  </ParamField>

  Any fields not included in the `PATCH` request body will remain unchanged from the original wallet.

  ### Response

  If the wallet is updated successfully, the response will include the updated wallet.

  <ResponseField name="id" type="string">
    Unique ID for the wallet.
  </ResponseField>

  <ResponseField name="address" type="string">
    Address of the wallet.
  </ResponseField>

  <ResponseField name="chain_type" type="'ethereum'">
    Chain type for the wallet.
  </ResponseField>

  <ResponseField name="policy_ids" type="MethodRule">
    Updated policy IDs to enforce on the wallet.
  </ResponseField>

  <ResponseField type="string | null" name="owner_id">
    The key quorum ID of the owner of the wallet.
  </ResponseField>

  <ResponseField type="{signer_id: string}[]" name="additional_signers">
    The key quorum IDs of the additional signers for the wallet.
  </ResponseField>

  ### Example

  A sample request might look like the following:

  ```tsx  theme={"system"}
  $ curl --request PATCH https://api.privy.io/v1/wallets/rbokq6mmq5f8j1cgyr6a5g4n \
  -u "<your-privy-app-id>:<your-privy-app-secret>" \
  -H "privy-app-id: <your-privy-app-id>" \
  -H "privy-authorization-signature: <authorization-signature-for-request>" \
  -H 'Content-Type: application/json' \
  --data '{
      "policy_ids": ["fmfdj6yqly31huorjqzq38zc"],
      "owner_id": "yhu8t1fjns9rtc2o702ub3vt",
      "additional_signers": [{"signer_id": "trt9syg5k19jvxwbnt6t8rd0"}]
  }'
  ```

  A successful response will look like the following:

  ```tsx  theme={"system"}
  {
    "id": "rbokq6mmq5f8j1cgyr6a5g4n",
    "address": "0xE315ce0854CcbdB0E33e71af1190F48Eb5d4f5a4",
    "chain_type": "ethereum",
    "policy_ids": ["fmfdj6yqly31huorjqzq38zc"],
    "owner_id": "yhu8t1fjns9rtc2o702ub3vt",
    "additional_signers": [
      {
        "signer_id": "trt9syg5k19jvxwbnt6t8rd0"
      }
    ],
    "created_at": 1737492220389
  }
  ```
</View>

<View title="Java" icon="java">
  To update an existing wallet, use the `update` method, passing in a `walletId` along with a
  `WalletUpdateRequestBody`.

  ### Usage

  ```java  theme={"system"}
  try {
      WalletUpdateRequestBody request = WalletUpdateRequestBody.builder()
          .policyIds(List.of("new-policy-id"))
          .build();

      // Use the AuthorizationContext to sign the request with the wallet's owner.
      // Example if the wallet's owner is an authorization private key
      AuthorizationContext authorizationContext = AuthorizationContext.builder()
          .addAuthorizationPrivateKey("authorization-key")
          .build();

      WalletUpdateResponse response = privyClient.wallets().update(
          "wallet-id",
          request,
          authorizationContext
      );

      if (response.wallet().isPresent()) {
          Wallet updatedWallet = response.wallet().get();
      }
  } catch (APIException e) {
      String errorBody = e.bodyAsString();
      System.err.println(errorBody);
  } catch (Exception e) {
      System.err.println(e.getMessage());
  }
  ```

  ### Parameters

  When updating a wallet, you may specify the following values on the `WalletUpdateRequestBody`:

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

  The `WalletUpdateResponse` object contains an optional `wallet()` field, present if the
  wallet was updated successfully.

  <ResponseField name="wallet()" type="Optional<Wallet>">
    The updated `Wallet` object.

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
        The key quorum ID of the owner of the wallet. If an `ownerId` was passed in, this response is the input `ownerId`. If a user ID or authorization key was passed in as the `owner`, this response is a newly created key quorum containing the input user ID or authorization key.
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

<View title="Rust" icon="rust">
  To update an existing wallet, use the `update` method on the `wallets()` interface, along with an `AuthorizationContext` for signing the request.

  <Info>
    Wallets with an `owner_id` must provide authorization from the owner to perform updates. Use the `AuthorizationContext` to include the necessary credentials for request signing.
  </Info>

  ### Usage

  ```rust  theme={"system"}
  use privy_rs::{PrivyClient, generated::types::*, AuthorizationContext};

  let client = PrivyClient::new(app_id, app_secret)?;

  // Create authorization context with the wallet owner's key
  let ctx = AuthorizationContext::new()
      .push(PrivateKey("authorization-private-key".to_string()));

  let updated_wallet = client
      .wallets()
      .update(
          "wallet-id",
          &ctx,
          &WalletUpdateBody {
              policy_ids: Some(vec!["new-policy-id".to_string()]),
              owner: None,
              owner_id: Some("new-owner-quorum-id".to_string()),
              additional_signers: Some(vec![
                  WalletAdditionalSigner {
                      signer_id: "additional-signer-id".to_string(),
                  },
              ]),
          },
      )
      .await?;

  println!("Updated wallet: {}", updated_wallet.id);
  ```

  ### Parameters and Returns

  See the Rust SDK documentation for detailed parameter and return types, including embedded examples:

  * [WalletsClient::update](https://docs.rs/privy-rs/latest/privy_rs/subclients/struct.WalletsClient.html#method.update)
  * [WalletUpdateBody](https://docs.rs/privy-rs/latest/privy_rs/generated/types/struct.WalletUpdateBody.html)
  * [AuthorizationContext](https://docs.rs/privy-rs/latest/privy_rs/struct.AuthorizationContext.html)
  * [Wallet](https://docs.rs/privy-rs/latest/privy_rs/generated/types/struct.Wallet.html)

  For REST API details, see the [API reference](/api-reference/wallets/update).
</View>

<View title="Go" icon="golang">
  To update an existing wallet with the Go SDK, use the `Update` method on the `Wallets` service, along with an authorization context for signing the request.

  <Info>
    Wallets with an `owner_id` must provide authorization from the owner to perform updates. Use
    `privy.WithAuthorizationContext` to include the necessary credentials for request signing.
  </Info>

  ### Usage

  ```go  theme={"system"}
  import "github.com/privy-io/go-sdk/authorization"

  // Create authorization context with the wallet owner's key
  authCtx := &authorization.AuthorizationContext{
      PrivateKeys: []string{"authorization-key"},
  }

  updatedWallet, err := client.Wallets.Update(
      context.Background(),
      "wallet-id",
      privy.WalletUpdateParams{
          PolicyIDs: []string{"new-policy-id"},
      },
      privy.WithAuthorizationContext(authCtx),
  )
  if err != nil {
      log.Fatalf("failed to update wallet: %v", err)
  }

  fmt.Println("Updated wallet:", updatedWallet.ID)
  ```

  ### Parameters and Returns

  See the [API reference](/api-reference/wallets/update) for more details.
</View>
\n