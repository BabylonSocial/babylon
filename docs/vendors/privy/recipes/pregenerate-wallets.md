> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Pregenerating wallets

With Privy, you can **pregenerate self-custodial Ethereum and Solana wallets** for existing users, or create a new user with other login methods, like an email address or phone number, without requiring the user to login.
You can even send assets to the wallet before the user logs in to your app for the first time.

Once the user associated with the account logs in, they will be able to access the pregenerated wallet and any assets sent to them.

Wallet pregeneration is useful for:

* **Airdrops and rewards**: Distribute tokens or NFTs to users before they sign up
* **Web2 to web3 migrations**: Import existing users from a database and provision wallets for them
* **Frictionless onboarding**: Allow users to receive assets before creating an account
* **Server-side provisioning**: Generate wallets programmatically based on off-chain events or criteria

This recipe covers three scenarios: creating wallets for new users, adding wallets to existing users, and batch importing users with wallets.

## Pregenerating wallets for new users

Create new users with pregenerated wallets in a single operation. This is useful for airdrops, migrations, or any scenario where wallets need to exist before authentication.

<View title="NodeJS" icon="node-js">
  To pregenerate embedded wallets for a new user, use the `create` method on the `users()` interface of the Privy client.

  ### Usage

  ```tsx [expandable] theme={"system"}
  const privy = new PrivyClient({ appId: 'your-app-id', appSecret: 'your-app-secret' });

  const user = await privy.users().create({
      linked_accounts: [
          {
              type: 'email',
              address: 'batman@privy.io',
          },
      ],
      wallets: [
          {
              chain_type: 'ethereum',
              wallet_index: 0,
              additional_signers: [
                  {
                      signer_id: '<signer-id>',
                      // Policies specific to this signer
                      override_policy_ids: ['<policy-id>']
                  }
              ],
              // Policies for all transactions on the wallet, no matter the signer
              policy_ids: ['<policy-id>']
          },
          {
              chain_type: 'solana',
              wallet_index: 0,
              additional_signers: [
                  {
                      signer_id: '<signer-id>',
                      override_policy_ids: ['<policy-id>']
                  }
              ],
              policy_ids: []
          }
      ],
      create_direct_signer: true
  });
  ```

  ### Params and returns

  Check out the [API reference](/api-reference/users/create) for more details.
</View>

<View title="NodeJS (server-auth)" icon="node-js">
  <Warning>
    The `@privy-io/server-auth` library is deprecated. We recommend integrating `@privy-io/node` for
    the latest features and support.
  </Warning>

  To pregenerate embedded wallets for a new user, use the `importUser` method from `PrivyClient`.

  ```javascript  theme={"system"}
  importUser: ({linkedAccounts: LinkedAccountType[], customMetadata?: CustomMetadataType, wallets?: WalletCreateRequestType[], createDirectSigner?: boolean}) => Promise<User>
  ```

  ### Usage

  ```tsx [expandable] theme={"system"}
  const privy = new PrivyClient('your-app-id', 'your-app-secret');

  const user = await privy.importUser({
      linkedAccounts: [
          {
              type: 'email',
              address: 'batman@privy.io',
          },
      ],
      wallets: [
          {
              chainType: 'ethereum',
              walletIndex: 0,
              additionalSigners: [
                  {
                      signerId: '<signer-id>',
                      // Policies specific to this signer
                      overridePolicyIds: ['<policy-id>']
                  }
              ],
              // Policies for all transactions on the wallet, no matter the signer
              policyIds: ['<policy-id>']
          },
          {
              chainType: 'solana',
              walletIndex: 0,
              additionalSigners: [
                  {
                      signerId: '<signer-id>',
                      overridePolicyIds: ['<policy-id>']
                  }
              ],
              policyIds: []
          }
      ],
      createDirectSigner: true
  });
  ```

  ### Params

  <ParamField path="linkedAccounts" type="LinkedAccountType[]" required>
    An array of linked accounts to associate with the user.
  </ParamField>

  <ParamField path="customMetadata" type="CustomMetadataType">
    Custom metadata to associate with the user.
  </ParamField>

  <ParamField path="wallets" type="WalletCreateRequestType[]">
    An array of wallets to create for the user.

    <Expandable defaultOpen="true">
      <ParamField path="chainType" type="'ethereum' | 'solana' | 'stellar' | 'cosmos' | 'sui' | 'tron' | 'bitcoin-segwit' | 'near' | 'ton' | 'starknet' | 'movement'" required>
        The chain type of the wallet to create.
      </ParamField>

      <ParamField path="walletIndex" type="number">
        The HD wallet index to use for wallet generation. Defaults to `0`.
      </ParamField>

      <ParamField path="additionalSigners" type="object[]">
        <Expandable defaultOpen="true">
          <ParamField path="signerId" type="string">
            The ID of the signer.
          </ParamField>

          <ParamField path="overridePolicyIds" type="string[]">
            List of policy IDs for policies that should be enforced on the wallet. Currently, only one policy is supported per wallet.
          </ParamField>
        </Expandable>
      </ParamField>

      <ParamField path="createSmartAccount" type="boolean">
        Set to `true` to create a smart account with the user's wallet as the signer. Can only be set on wallets where `chainType` is `ethereum`.
      </ParamField>
    </Expandable>
  </ParamField>

  <ParamField path="createDirectSigner" type="boolean">
    Set to `true` to create a UserSigner for custom JWT authentication for all wallets. Requires a custom JWT linked account.
  </ParamField>

  ### Returns

  <ResponseField name="user" type="User">
    The user with the newly created wallets.
  </ResponseField>
</View>

<View title="Java" icon="java">
  To pregenerate embedded wallets for a new user, use the `createUser` method.

  <Tip>
    Take a look at the [guide on creating users](/user-management/migrating-users-to-privy/create-or-import-a-user)
    for more information on creating users with particular linked accounts and
    metadata before they sign in to the application.
  </Tip>

  ```java  theme={"system"}
  try {
      List<LinkedAccountInput> createUserLinkedAccounts = List.of(/* Some linked accounts... */);

      // Pregenerate an Ethereum and Solana wallet for the user
      List<UserWalletRequest> wallets = List.of(
          UserWalletRequest.builder()
              .chainType(WalletChainType.ETHEREUM)
              .walletIndex(0)
              .build(),
          UserWalletRequest.builder()
              .chainType(WalletChainType.SOLANA)
              .walletIndex(0)
              .build()
      );

      UserCreateRequestBody requestBody = UserCreateRequestBody.builder()
          .linkedAccounts(createUserLinkedAccounts)
          .wallets(wallets)
          .createDirectSigner(true)
          .build();
      UserCreateResponse response = privyClient.users().create(requestBody);

      // Check if the user was created successfully.
      // The application can now use the address of their generated wallet.
      if (response.user().isPresent()) {
          User user = response.user().get();

          // Extract Ethereum wallet from User response
          LinkedAccountEthereumEmbeddedWallet ethereumWallet = user.getFirstLinkedAccountByType(
              LinkedAccountEthereumEmbeddedWallet.class
          );

          // Grab the generated wallet address
          String ethereumAddress = ethereumWallet.address();

          // Extract Solana wallet from User response
          LinkedAccountSolanaEmbeddedWallet solanaWallet = user.getFirstLinkedAccountByType(
              LinkedAccountSolanaEmbeddedWallet.class
          );

          // Grab the generated wallet address
          String solanaAddress = solanaWallet.address();
      }
  } catch (APIException e) {
      String errorBody = e.bodyAsString();
      System.err.println(errorBody);
  } catch (Exception e) {
      System.err.println(e.getMessage());
  }
  ```
</View>

<View title="REST API" icon="terminal">
  To pregenerate embedded wallets for a new user, make a POST request to `https://auth.privy.io/api/v1/users`.

  ### Usage

  Below is a sample cURL command for creating a new user with pregenerated wallets:

  ```sh  theme={"system"}
  $ curl --request POST https://auth.privy.io/api/v1/users \
  -u "<your-privy-app-id>:<your-privy-app-secret>" \
  -H "privy-app-id: <your-privy-app-id>" \
  -H "Content-Type: application/json" \
  -d '{
          "linked_accounts": [
              {
                  "address": "batman@privy.io",
                  "type": "email"
              }
          ],
          "wallets": [
              {
                  "chain_type": "ethereum",
                  "wallet_index": 0,
                  "policy_ids": ["<policy-id>"],
                  "additional_signers": [
                      {
                          "signer_id": "<signer-id>",
                          "override_policy_ids": ["<policy-id>"]
                      }
                  ]
              },
              {
                  "chain_type": "solana",
                  "wallet_index": 0,
                  "additional_signers": [
                      {
                          "signer_id": "<signer-id>",
                          "override_policy_ids": ["<policy-id>"]
                      }
                  ]
              }
          ],
          "create_direct_signer": true
      }'
  ```

  A successful response will include the new user object along with their user ID and embedded wallet addresses:

  ```json  theme={"system"}
      {
          "id": "did:privy:clddy332f002tyqpq3b3lv327",
          "created_at": 1674788927,
          "linked_accounts": [
              {
                  "address": "batman@privy.io",
                  "type": "email"
              },
              {
                  "address": "0x3DAF84b3f09A0E2092302F7560888dBc0952b7B7",
                  "type": "wallet",
                  "wallet_client": "privy",
                  "chain_type": "ethereum"
              },
              {
                  "address": "9KnvxKTx...",
                  "type": "wallet",
                  "wallet_client": "privy",
                  "chain_type": "solana"
              }
          ]
      }
  ```

  ### Parameters

  <ParamField path="linked_accounts" type="LinkedAccountType[]" required>
    An array of linked accounts to associate with the user.
  </ParamField>

  <ParamField path="custom_metadata" type="CustomMetadataType">
    Custom metadata to associate with the user.
  </ParamField>

  <ParamField path="wallets" type="WalletCreateRequestType[]">
    An array of wallets to create for the user.

    <Expandable defaultOpen="true">
      <ParamField path="chain_type" type="'ethereum' | 'solana' | 'stellar' | 'cosmos' | 'sui' | 'tron' | 'bitcoin-segwit' | 'near' | 'ton' | 'starknet' | 'movement'" required>
        The chain type of the wallet to create.
      </ParamField>

      <ParamField path="wallet_index" type="number">
        The HD wallet index to use for wallet generation. Defaults to `0`.
      </ParamField>

      <ParamField path="policy_ids" type="string[]">
        List of policy IDs for policies that should be enforced on all transactions on the wallet, regardless of signer.
      </ParamField>

      <ParamField path="additional_signers" type="object[]">
        <Expandable defaultOpen="true">
          <ParamField path="signer_id" type="string">
            The ID of the signer.
          </ParamField>

          <ParamField path="override_policy_ids" type="string[]">
            List of policy IDs for policies specific to this signer. Currently, only one policy is supported per wallet.
          </ParamField>
        </Expandable>
      </ParamField>

      <ParamField path="create_smart_account" type="boolean">
        Set to `true` to create a smart account with the user's wallet as the signer. Can only be set on wallets where `chain_type` is `ethereum`.
      </ParamField>
    </Expandable>
  </ParamField>

  <ParamField path="create_direct_signer" type="boolean">
    Set to `true` to create a UserSigner for custom JWT authentication for all wallets. Requires a custom JWT linked account.
  </ParamField>
</View>

## Creating wallets for existing users

Add additional embedded wallets to users who already have Privy accounts. This is useful when expanding to support new chains or creating wallets based on in-app actions.

<View title="NodeJS" icon="node-js">
  To create embedded wallets for an existing user, use the `pregenerateWallets` method from the `users()` interface of the Privy client.

  ### Usage

  ```tsx  theme={"system"}
  const user = await privy.users().pregenerateWallets('did:privy:clddy332f002tyqpq3b3lv327', {
      wallets: [
          {
              chain_type: 'ethereum',
              wallet_index: 0,
          },
          {
              chain_type: 'solana',
              wallet_index: 0,
          }
      ],
      create_direct_signer: true
  });
  ```

  Check out the [API reference](/api-reference/users/pregenerate-wallets) for more details.
</View>

<View title="NodeJS (server-auth)" icon="node-js">
  <Warning>
    The `@privy-io/server-auth` library is deprecated. We recommend integrating `@privy-io/node` for
    the latest features and support.
  </Warning>

  To create embedded wallets for an existing user, use the `createWallets` method from `PrivyClient`.

  ```javascript  theme={"system"}
  createWallets: ({userId: string, wallets?: WalletCreateRequestType[], createDirectSigner?: boolean}) => Promise<User>
  ```

  ### Usage

  ```tsx  theme={"system"}
  const user = await privy.createWallets({
      userId: 'did:privy:clddy332f002tyqpq3b3lv327',
      wallets: [
          {
              chainType: 'ethereum',
              walletIndex: 0,
          },
          {
              chainType: 'solana',
              walletIndex: 0,
          }
      ],
      createDirectSigner: true
  });
  ```

  ### Params

  <ParamField path="userId" type="string" required>
    The Privy user ID to create wallets for.
  </ParamField>

  <ParamField path="wallets" type="WalletCreateRequestType[]">
    An array of wallets to create for the user.

    <Expandable defaultOpen="true">
      <ParamField path="chainType" type="'ethereum' | 'solana' | 'stellar' | 'cosmos' | 'sui' | 'tron' | 'bitcoin-segwit' | 'near' | 'ton' | 'starknet' | 'movement'" required>
        The chain type of the wallet to create.
      </ParamField>

      <ParamField path="walletIndex" type="number">
        The HD wallet index to use for wallet generation. Defaults to `0`.
      </ParamField>

      <ParamField path="additionalSigners" type="object[]">
        <Expandable defaultOpen="true">
          <ParamField path="signerId" type="string">
            The ID of the signer.
          </ParamField>

          <ParamField path="overridePolicyIds" type="string[]">
            List of policy IDs for policies that should be enforced on the wallet. Currently, only one
            policy is supported per wallet.
          </ParamField>
        </Expandable>
      </ParamField>

      <ParamField path="createSmartAccount" type="boolean">
        Set to `true` to create a smart account with the user's wallet as the signer. Can only be set
        on wallets where `chainType` is `ethereum`.
      </ParamField>
    </Expandable>
  </ParamField>

  <ParamField path="createDirectSigner" type="boolean">
    Set to `true` to create a UserSigner for custom JWT authentication for all wallets. Requires a custom JWT linked account.
  </ParamField>

  ### Returns

  <ResponseField name="user" type="User">
    The user with the newly created wallets.
  </ResponseField>
</View>

<View title="Go" icon="golang">
  To pregenerate wallets for a user with the Go SDK, use the `PregenerateWallets` method on the `Users` service.

  ### Usage

  ```go  theme={"system"}
  user, err := client.Users.PregenerateWallets(
    context.Background(),
    "did:privy:xxxxx",
    privy.UserPregenerateWalletsParams{
      Wallets: []privy.UserPregenerateWalletsParamsWallet{{
        ChainType: privy.WalletChainTypeEthereum,
        AdditionalSigners: []privy.UserPregenerateWalletsParamsWalletAdditionalSigner{{
           SignerID:          "signer_id",
           OverridePolicyIDs: []string{"string"},
        }},
        CreateSmartWallet: privy.Bool(true),
        PolicyIDs:         []string{"string"},
      }},
    },
  )
  if err != nil {
      log.Fatalf("failed to pregenerate wallets: %v", err)
  }

  fmt.Println("Pregenerated wallets for user:", user.ID)
  ```

  ### Parameters and Returns

  See the [API reference](/api-reference/users/pregenerate-wallets) for more details.
</View>

<View title="REST API" icon="terminal">
  To pregenerate embedded wallets for an existing user, make a POST request to `https://api.privy.io/v1/wallets`.

  ### Usage

  Below is a sample cURL command for creating wallets for an existing user:

  ```sh  theme={"system"}
  $ curl --request POST \
      --url https://api.privy.io/v1/wallets \
      --header 'Authorization: Basic <encoded-value>' \
      --header 'Content-Type: application/json' \
      --header 'privy-app-id: <privy-app-id>' \
      --data '
      {
          "chain_type": "ethereum",
          "owner": {
              "user_id": "did:privy:clddy332f002tyqpq3b3lv327"
          },
          "policy_ids": ["<policy-id>"]
          "additional_signers": [
              {
                  "signer_id": "<signer-id>",
                  "override_policy_ids": ["<policy-id>"]
              }
          ]
      }
      '
  ```

  A successful response will include the updated user object with their newly created wallet addresses:

  ```json  theme={"system"}
      {
          "id": "did:privy:clddy332f002tyqpq3b3lv327",
          "created_at": 1674788927,
          "linked_accounts": [
              {
                  "address": "batman@privy.io",
                  "type": "email"
              },
              {
                  "address": "0x3DAF84b3f09A0E2092302F7560888dBc0952b7B7",
                  "type": "wallet",
                  "wallet_client": "privy",
                  "chain_type": "ethereum"
              },
              {
                  "address": "9KnvxKTx...",
                  "type": "wallet",
                  "wallet_client": "privy",
                  "chain_type": "solana"
              }
          ]
      }
  ```

  ### Parameters

  <ParamField path="user_id" type="string" required>
    The Privy user ID to create wallets for.
  </ParamField>

  <ParamField path="wallets" type="WalletCreateRequestType[]">
    An array of wallets to create for the user.

    <Expandable defaultOpen="true">
      <ParamField path="chain_type" type="'ethereum' | 'solana' | 'stellar' | 'cosmos' | 'sui' | 'tron' | 'bitcoin-segwit' | 'near' | 'ton' | 'starknet' | 'movement'" required>
        The chain type of the wallet to create.
      </ParamField>

      <ParamField path="wallet_index" type="number">
        The HD wallet index to use for wallet generation. Defaults to `0`.
      </ParamField>

      <ParamField path="policy_ids" type="string[]">
        List of policy IDs for policies that should be enforced on all transactions on the wallet, regardless of signer.
      </ParamField>

      <ParamField path="additional_signers" type="object[]">
        <Expandable defaultOpen="true">
          <ParamField path="signer_id" type="string">
            The ID of the signer.
          </ParamField>

          <ParamField path="override_policy_ids" type="string[]">
            List of policy IDs for policies specific to this signer. Currently, only one policy is supported per wallet.
          </ParamField>
        </Expandable>
      </ParamField>

      <ParamField path="create_smart_account" type="boolean">
        Set to `true` to create a smart account with the user's wallet as the signer. Can only be set on wallets where `chain_type` is `ethereum`.
      </ParamField>
    </Expandable>
  </ParamField>

  <ParamField path="create_direct_signer" type="boolean">
    Set to `true` to create a UserSigner for custom JWT authentication for all wallets. Requires a custom JWT linked account.
  </ParamField>
</View>

## Batch importing users with wallets

Import multiple users with pregenerated wallets in a single batch operation. This is more efficient than creating users individually when provisioning wallets for hundreds or thousands of users at once.

<View title="REST API" icon="terminal">
  To batch import multiple users with pregenerated wallets, make a POST request to `https://auth.privy.io/api/v1/apps/<your-app-id>/users/import`.

  ### Usage

  Below is a sample cURL command for batch importing users with pregenerated wallets:

  ```sh  theme={"system"}
  $ curl --request POST https://auth.privy.io/api/v1/apps/<your-privy-app-id>/users/import \
  -u "<your-privy-app-id>:<your-privy-app-secret>" \
  -H "privy-app-id: <your-privy-app-id>" \
  -H "Content-Type: application/json" \
  -d '{
      "users": [
          {
              "linked_accounts": [
                  {
                      "address": "user1@example.com",
                      "type": "email"
                  }
              ],
              "wallets": [
                  {
                      "chain_type": "ethereum",
                      "wallet_index": 0,
                      "policy_ids": ["<policy-id>"],
                      "additional_signers": [
                          {
                              "signer_id": "<signer-id>",
                              "override_policy_ids": ["<policy-id>"]
                          }
                      ]
                  }
              ],
              "create_direct_signer": true
          },
          {
              "linked_accounts": [
                  {
                      "address": "user2@example.com",
                      "type": "email"
                  }
              ],
              "wallets": [
                  {
                      "chain_type": "solana",
                      "wallet_index": 0
                  }
              ],
              "create_direct_signer": false
          }
      ]
  }'
  ```

  A successful response will include an array of the newly created users with their wallet addresses:

  ```json  theme={"system"}
  {
      "users": [
          {
              "id": "did:privy:abc123",
              "created_at": 1674788927,
              "linked_accounts": [
                  {
                      "address": "user1@example.com",
                      "type": "email"
                  },
                  {
                      "address": "0x3DAF84b3f09A0E2092302F7560888dBc0952b7B7",
                      "type": "wallet",
                      "wallet_client": "privy",
                      "chain_type": "ethereum"
                  }
              ]
          },
          {
              "id": "did:privy:def456",
              "created_at": 1674788928,
              "linked_accounts": [
                  {
                      "address": "user2@example.com",
                      "type": "email"
                  },
                  {
                      "address": "9KnvxKTx...",
                      "type": "wallet",
                      "wallet_client": "privy",
                      "chain_type": "solana"
                  }
              ]
          }
      ]
  }
  ```

  ### Parameters

  <ParamField path="users" type="UserImportRequest[]" required>
    An array of user objects to import. Each object has the following fields:

    <Expandable defaultOpen="true">
      <ParamField path="linked_accounts" type="LinkedAccountType[]" required>
        An array of linked accounts to associate with the user.
      </ParamField>

      <ParamField path="custom_metadata" type="CustomMetadataType">
        Custom metadata to associate with the user.
      </ParamField>

      <ParamField path="wallets" type="WalletCreateRequestType[]">
        An array of wallets to create for the user.

        <Expandable defaultOpen="true">
          <ParamField path="chain_type" type="'ethereum' | 'solana' | 'stellar' | 'cosmos' | 'sui' | 'tron' | 'bitcoin-segwit' | 'near' | 'ton' | 'starknet' | 'movement'" required>
            The chain type of the wallet to create.
          </ParamField>

          <ParamField path="wallet_index" type="number">
            The HD wallet index to use for wallet generation. Defaults to `0`.
          </ParamField>

          <ParamField path="policy_ids" type="string[]">
            List of policy IDs for policies that should be enforced on all transactions on the wallet, regardless of signer.
          </ParamField>

          <ParamField path="additional_signers" type="object[]">
            <Expandable defaultOpen="true">
              <ParamField path="signer_id" type="string">
                The ID of the signer.
              </ParamField>

              <ParamField path="override_policy_ids" type="string[]">
                List of policy IDs for policies specific to this signer. Currently, only one policy is supported per wallet.
              </ParamField>
            </Expandable>
          </ParamField>

          <ParamField path="create_smart_account" type="boolean">
            Set to `true` to create a smart account with the user's wallet as the signer. Can only be set on wallets where `chain_type` is `ethereum`.
          </ParamField>
        </Expandable>
      </ParamField>

      <ParamField path="create_direct_signer" type="boolean">
        Set to `true` to create a UserSigner for custom JWT authentication for all wallets. Requires a custom JWT linked account.
      </ParamField>
    </Expandable>
  </ParamField>
</View>

## What happens when users log in

When users log in for the first time after wallets have been pregenerated, the wallets automatically appear in their account. Users can immediately access these wallets and any assets that were sent to them.

These wallets work identically to wallets created during login. Users can sign transactions, view balances, and manage their assets through the standard application interface.
\n