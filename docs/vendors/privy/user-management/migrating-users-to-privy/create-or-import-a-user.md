> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Create or import a user

To import an existing user, Privy allows you to create a user with their linked accounts (wallet, email, etc.) as part of the user creation request. You can also generate a wallet when you create a user.

When the user logs in, all of their linked accounts will be included in the user object. If the user has a pregenerated embedded wallet, that wallet will be available to the user upon sign in.

<View title="NodeJS" icon="node-js">
  You can create a user by calling the `.users().create()` method on the `PrivyClient`.

  ```ts  theme={"system"}
  import {PrivyClient} from '@privy-io/node';

  const privy = new PrivyClient({
    appId: 'insert-your-app-id',
    appSecret: 'insert-your-app-secret'
  });

  try {
    const user = await privy.users().create({
      linked_accounts: [{type: 'email', address: 'batman@privy.io'}],
      wallets: [{chain_type: 'ethereum'}],
      custom_metadata: {key: 'value'}
    });
  } catch (error) {
    console.error(error);
  }
  ```

  Refer to the [API reference](/api-reference/users/create) for more details on the available
  parameters and returns.
</View>

<View title="NodeJS (server-auth)" icon="node-js">
  <Warning>
    The `@privy-io/server-auth` library is deprecated. We recommend integrating `@privy-io/node` for
    the latest features and support.
  </Warning>

  Use the **`PrivyClient`**'s **`importUser`** method to create or import a single user into your Privy app.

  ```tsx  theme={"system"}
  const user = await privy.importUser({
    linkedAccounts: [
      {
        type: 'email',
        address: 'batman@privy.io'
      }
    ],
    wallets: [{chainType: "ethereum"}]
    customMetadata: {
      key: 'value'
    }
  });
  ```

  ### Parameters

  <ParamField body="linkedAccounts" type="LinkedAccount[]" required>
    An array including all of the user's linked accounts. These objects are in the same shape as the
    linked accounts returned by [`getUser`](/user-management/users/managing-users/querying-users). For
    each linked account, you must specify the `type` and must not include a `verifiedAt` timestamp.

    <Accordion title="LinkedAccount types">
      <Accordion title="AppleAccount">
        | Field     | Type            | Description                                             |
        | --------- | --------------- | ------------------------------------------------------- |
        | `type`    | `'apple_oauth'` | N/A                                                     |
        | `email`   | `string`        | Email address associated with the user's Apple account. |
        | `subject` | `number`        | ID of user from Apple's user API.                       |
      </Accordion>

      <Accordion title="CustomJwtAccount">
        | Field                                            | Type            | Description                           |
        | ------------------------------------------------ | --------------- | ------------------------------------- |
        | `type`                                           | `'custom_auth'` | N/A                                   |
        | API: `custom_user_id` <br /> SDK: `customUserId` | `string`        | ID of user from custom auth provider. |
      </Accordion>

      <Accordion title="DiscordAccount">
        | Field      | Type              | Description                                                                                         |
        | ---------- | ----------------- | --------------------------------------------------------------------------------------------------- |
        | `type`     | `'discord_oauth'` | N/A                                                                                                 |
        | `subject`  | `string`          | ID of user from Discord user API response.                                                          |
        | `email`    | `string`          | Email of user from Discord user API response                                                        |
        | `username` | `string`          | Username of user from Discord user API response. Include the 4-digit discriminator prefixed by '#'. |

        (See [Discord docs](https://discord.com/developers/docs/resources/user))
      </Accordion>

      <Accordion title="EmailAccount">
        | Field     | Type      | Description                    |
        | --------- | --------- | ------------------------------ |
        | `type`    | `'email'` | N/A                            |
        | `address` | `string`  | Email address of user account. |
      </Accordion>

      <Accordion title="FarcasterAccount">
        | Field                                                      | Type          | Description                                                                                                                                             |
        | ---------------------------------------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
        | `type`                                                     | `'farcaster'` | N/A                                                                                                                                                     |
        | `fid`                                                      | `number`      | FID of the user from Farcaster user API response.                                                                                                       |
        | API: `owner_address` <br /> SDK: `ownerAddress`            | `string`      | Wallet address of the user from Farcaster user API response. Note that this is the Farcaster wallet address, and not the Privy embedded wallet address. |
        | `username`                                                 | `string`      | (Optional) Username of user from Farcaster user API response. Do not include the '@'.                                                                   |
        | API: `display_name` <br /> SDK: `displayName`              | `string`      | (Optional) Display name of user from Farcaster user API response.                                                                                       |
        | `bio`                                                      | `string`      | (Optional) Bio of user from Farcaster user API response.                                                                                                |
        | API: `profile_picture_url` <br /> SDK: `profilePictureUrl` | `string`      | (Optional) Profile picture URL of the user from Farcaster user API response. Must be a valid image URL.                                                 |
        | API: `homepage_url` <br /> SDK: `homepageUrl`              | `string`      | (Optional) Profile URL of the user from Farcaster user API response.                                                                                    |

        (See [Farcaster docs](https://docs.farcaster.xyz/reference/hubble/httpapi/userdata#userdata-api). Note that the Privy import interface differs slightly from the Farcaster public interface in order to maintain consistency with other Privy **`LinkedAccount`** types.)
      </Accordion>

      <Accordion title="GithubAccount">
        | Field      | Type             | Description                                    |
        | ---------- | ---------------- | ---------------------------------------------- |
        | `type`     | `'github_oauth'` | N/A                                            |
        | `subject`  | `string`         | ID of user from GitHub user API response.      |
        | `email`    | `string`         | Email of user from GitHub user API response    |
        | `name`     | `string`         | Name of user from GitHub user API response     |
        | `username` | `string`         | Username of user from GitHub user API response |

        (See [GitHub docs](https://docs.github.com/en/rest/users/users?apiVersion=2022-11-28#get-the-authenticated-user))
      </Accordion>

      <Accordion title="GoogleAccount">
        | Field     | Type             | Description                                                |
        | --------- | ---------------- | ---------------------------------------------------------- |
        | `type`    | `'google_oauth'` | N/A                                                        |
        | `subject` | `string`         | `sub` pulled from Google-provided JWT with "openid" scope. |
        | `email`   | `string`         | `email` from Google-provided JWT with "email" scope.       |
        | `name`    | `string`         | `name` from Google-provided JWT with "profile" scope.      |
      </Accordion>

      <Accordion title="InstagramAccount">
        | Field      | Type                | Description                                                                 |
        | ---------- | ------------------- | --------------------------------------------------------------------------- |
        | `type`     | `'instagram_oauth'` | N/A                                                                         |
        | `subject`  | `string`            | ID of user from Instagram user API response.                                |
        | `username` | `string`            | The name displayed on a user's profile from Instagram's `/me` API response. |

        (See [Instagram docs](https://developers.facebook.com/docs/instagram-basic-display-api/reference/me/))
      </Accordion>

      <Accordion title="LinkedinAccount">
        | Field     | Type               | Description                                                           |
        | --------- | ------------------ | --------------------------------------------------------------------- |
        | `type`    | `'linkedin_oauth'` | N/A                                                                   |
        | `subject` | `string`           | ID of user from LinkedIn user API response.                           |
        | `email`   | `string`           | Email of user from LinkedIn user API response                         |
        | `name`    | `string`           | Name of user from LinkedIn user API response. Do not include the '@'. |

        (See [Linkedin docs](https://learn.microsoft.com/en-us/linkedin/consumer/integrations/self-serve/sign-in-with-linkedin-v2#api-request-to-retreive-member-details))
      </Accordion>

      <Accordion title="PhoneAccount">
        | Field    | Type      | Description                                                             |
        | -------- | --------- | ----------------------------------------------------------------------- |
        | `type`   | `'phone'` | N/A                                                                     |
        | `number` | `string`  | Phone number of user account (non-international numbers default to US). |

        While `number` is accepted as input, `phoneNumber` is returned in the response.
      </Accordion>

      <Accordion title="SpotifyAccount">
        | Field     | Type              | Description                                                                     |
        | --------- | ----------------- | ------------------------------------------------------------------------------- |
        | `type`    | `'spotify_oauth'` | N/A                                                                             |
        | `subject` | `string`          | ID of user from Spotify user API response.                                      |
        | `email`   | `string`          | Email of user from Spotify user API.                                            |
        | `name`    | `string`          | The name displayed on a user's profile from Spotify display\_name API response. |

        (See [Spotify docs](https://developer.spotify.com/documentation/web-api/reference/get-current-users-profile))
      </Accordion>

      <Accordion title="TelegramAccount">
        | Field            | Type         | Description                                                      |
        | ---------------- | ------------ | ---------------------------------------------------------------- |
        | `type`           | `'telegram'` | N/A                                                              |
        | `telegramUserId` | `string`     | ID of a user's telegram account.                                 |
        | `firstName`      | `string`     | The first name displayed on a user's telegram account.           |
        | `lastName`       | `string`     | (Optional) The last name displayed on a user's telegram account. |
        | `username`       | `string`     | (Optional) The username displayed on a user's telegram account.  |
        | `photo_url`      | `string`     | (Optional) The url of a user's telegram account profile picture. |

        (See [Telegram docs](https://core.telegram.org/widgets/login#checking-authorization))
      </Accordion>

      <Accordion title="TwitterAccount">
        | Field                                                   | Type              | Description                                                                                           |
        | ------------------------------------------------------- | ----------------- | ----------------------------------------------------------------------------------------------------- |
        | `type`                                                  | `'twitter_oauth'` | N/A                                                                                                   |
        | `subject`                                               | `string`          | ID of user from Twitter user API response.                                                            |
        | `name`                                                  | `string`          | Name of user from Twitter user API response                                                           |
        | `username`                                              | `string`          | Username of user from Twitter user API response. Do not include the '@'.                              |
        | API: profile\_picture\_url`<br/>`SDK: profilePictureUrl | `string`          | (Optional) Profile picture URL of the user from Twitter user API response. Must be a valid image URL. |

        (See [Twitter docs](https://developer.twitter.com/en/docs/twitter-api/users/lookup/api-reference/get-users-me#tab0))
      </Accordion>

      <Accordion title="SmartWalletAccount">
        | Field               | Type              | Description                                                                                             |
        | ------------------- | ----------------- | ------------------------------------------------------------------------------------------------------- |
        | `type`              | `'smart_wallet'`  | N/A                                                                                                     |
        | `address`           | `string`          | Checksummed smart wallet address.                                                                       |
        | `smart_wallet_type` | `SmartWalletType` | One of `'kernel'`, `'safe'`, `'biconomy'`, `'thirdweb'`, `'light_account'` or `'coinbase_smart_wallet'` |
      </Accordion>

      <Accordion title="WalletAccount">
        | Field                                    | Type                     | Description                                                                                              |
        | ---------------------------------------- | ------------------------ | -------------------------------------------------------------------------------------------------------- |
        | `type`                                   | `'wallet'`               | N/A                                                                                                      |
        | API:`chain_type` <br /> SDK: `chainType` | `'ethereum' \| 'solana'` | Type of chain for the wallet. EVM chains (`'ethereum'`) and Solana (`'solana'`) are currently supported. |
        | `address`                                | `string`                 | Checksummed wallet address.                                                                              |
      </Accordion>
    </Accordion>
  </ParamField>

  <ParamField body="customMetadata" type="object">
    An object containing any custom metadata you want to associate with the user. This metadata will
    be returned in the user object when the user logs in.
  </ParamField>

  <ParamField path="wallets" type="WalletCreateRequestType[]">
    (Optional) An array of wallets to create for the user.

    <Expandable defaultOpen="true">
      <ParamField path="chainType" type="'ethereum' | 'solana' | 'stellar' | 'cosmos' | 'sui' | 'tron' | 'bitcoin-segwit' | 'near' | 'ton' | 'starknet' | 'aptos'" required>
        The chain type of the wallet to create.
      </ParamField>

      <ParamField path="additionalSigners" type="object[]">
        <Expandable defaultOpen="true">
          <ParamField path="signerId" type="string">
            The ID of the signer.
          </ParamField>

          <ParamField path="policyIds" type="string[]">
            List of policy IDs for policies that should be enforced on the wallet. Currently, only one
            policy is supported per wallet.
          </ParamField>
        </Expandable>
      </ParamField>

      <ParamField path="createSmartWallet" type="boolean">
        Set to `true` to create a smart wallet with the user's wallet as the signer. Can only be set
        on wallets where `chainType` is `ethereum`.
      </ParamField>
    </Expandable>
  </ParamField>
</View>

<View title="Java" icon="java">
  You can create a user by calling the `.users().create()` method on the `PrivyClient`.

  ```java  theme={"system"}
  try {
      List<LinkedAccountInput> createUserLinkedAccounts = List.of(
          LinkedAccountInput.email("batman@privy.io")
      );
      Map<String, CustomMetadata> customMetadata = Map.of("username", CustomMetadata.of("name"));

      // Pregenerate an Ethereum wallet for the user
      List<UserWalletRequest> wallets = List.of(
          UserWalletRequest.builder()
              .chainType(WalletChainType.ETHEREUM)
              .build()
      );

      UserCreateRequestBody requestBody = UserCreateRequestBody.builder()
          .linkedAccounts(createUserLinkedAccounts)
          .customMetadata(customMetadata)
          .wallets(wallets)
          .build();

      UserCreateResponse response = privyClient
          .users()
          .create(requestBody);

      if (response.user().isPresent()) {
          User user = response.user().get();
      }
  } catch (APIException e) {
      String errorBody = e.bodyAsString();
      System.err.println(errorBody);
  } catch (Exception e) {
      System.err.println(e.getMessage());
  }
  ```

  ### Parameters

  You can specify the following values on the `UserCreateRequestBody` builder:

  <ParamField path="linkedAccounts" type="List<LinkedAccountInput>" required>
    A list of linked accounts to create for the user.
  </ParamField>

  <ParamField path="customMetadata" type="Map<String, CustomMetadata>">
    An object containing any custom metadata you want to associate with the user. This metadata will
    be returned in the user object when the user logs in.
  </ParamField>

  <ParamField path="wallets" type="List<UserWalletRequest>">
    A list of wallets to create for the user.
  </ParamField>

  ### Returns

  The `UserCreateResponse` object contains an optional `user()` field, present if the user was created successfully.

  <ResponseField name="user()" type="Optional<User>">
    The created `User` object. See the [user object](/user-management/users/the-user-object) for more
    details.
  </ResponseField>
</View>

<View title="Rust" icon="rust">
  You can create a user by calling the `.users().create()` method on the `PrivyClient`.

  ```rust  theme={"system"}
  use privy_rs::{PrivyClient, generated::types::*};
  use std::collections::HashMap;

  let client = PrivyClient::new(app_id, app_secret)?;

  // Create custom metadata with proper typing
  let mut metadata_map = HashMap::new();
  metadata_map.insert("key".to_string(), CustomMetadataValue::String("value".to_string()));
  let custom_metadata = CustomMetadata::from(metadata_map);

  let user = client
      .users()
      .create(&CreateUserBody {
          linked_accounts: vec![
              LinkedAccountInput::EmailInput(LinkedAccountEmailInput {
                  address: "batman@privy.io".to_string(),
                  type_: LinkedAccountEmailInputType::Email,
              }),
          ],
          wallets: vec![
              CreateWalletBody {
                  chain_type: WalletChainType::Ethereum,
                  additional_signers: None,
                  owner: None,
                  owner_id: None,
                  policy_ids: vec![],
              },
          ],
          custom_metadata: Some(custom_metadata),
      })
      .await?;

  println!("Created user: {}", user.id);
  ```

  ### Parameters and Returns

  See the Rust SDK documentation for detailed parameter and return types, including embedded examples:

  * [UsersClient::create](https://docs.rs/privy-rs/latest/privy_rs/subclients/struct.UsersClient.html#method.create)

  For REST API details, see the [API reference](/api-reference/users/create).
</View>

<View title="Go" icon="golang">
  To create or import a user with the Go SDK, use the `New` method on the `Users` service.

  ### Usage

  ```go  theme={"system"}
  user, err := client.Users.New(context.Background(), privy.UserNewParams{
      LinkedAccounts: []privy.LinkedAccountInputUnion{
          {
              OfCustomAuth: &privy.LinkedAccountCustomJwtInput{
                  Type:         privy.LinkedAccountCustomJwtInputTypeCustomAuth,
                  CustomUserID: "your-subject-id",
              },
          },
          {
              OfEmail: &privy.LinkedAccountEmailInput{
                  Type:    privy.LinkedAccountEmailInputTypeEmail,
                  Address: "user@example.com",
              },
          },
      },
  })
  if err != nil {
      log.Fatalf("failed to create user: %v", err)
  }

  fmt.Println("Created user:", user.ID)
  ```

  ### Parameters and Returns

  See the [API reference](/api-reference/users/create) for more details.
</View>

<View title="REST API" icon="terminal">
  Make a `POST` request to:

  ```sh  theme={"system"}
  https://auth.privy.io/api/v1/users
  ```

  Below is a **sample cURL command** for creating a new user:

  ```bash  theme={"system"}
  $ curl --request POST https://auth.privy.io/api/v1/users \
  -u "<your-privy-app-id>:<your-privy-app-secret>" \
  -H "privy-app-id: <your-privy-app-id>" \
  -H 'Content-Type: application/json' \
  -d '{
    "linked_accounts": [
      {
        "address": "batman@privy.io",
        "type": "email"
      }
    ]
  }'
  ```

  ### Parameters

  <ParamField body="linked_accounts" type="LinkedAccount[]" required>
    An array including all of the user's linked accounts. These objects are in the same shape as the
    linked accounts returned by [`getUser`](/user-management/users/managing-users/querying-users). For
    each linked account, you must specify the `type` and must not include a `verifiedAt` timestamp.
  </ParamField>

  <ParamField body="custom_metadata" type="object">
    An object containing any custom metadata you want to associate with the user. This metadata will
    be returned in the user object when the user logs in.
  </ParamField>

  <ParamField path="wallets" type="WalletCreateRequestType[]">
    (Optional) An array of wallets to create for the user.

    <Expandable defaultOpen="true">
      <ParamField path="chainType" type="'ethereum' | 'solana' | 'stellar' | 'cosmos' | 'sui' | 'tron' | 'bitcoin-segwit' | 'near' | 'ton' | 'starknet' | 'aptos'" required>
        The chain type of the wallet to create.
      </ParamField>

      <ParamField path="additional_signers" type="object[]">
        <Expandable defaultOpen="true">
          <ParamField path="signer_id" type="string">
            The ID of the signer.
          </ParamField>

          <ParamField path="override_policy_ids" type="string[]">
            The array of policy IDs that will be applied to wallet requests. If specified, this will
            override the base policy IDs set on the wallet. Currently, only one policy is supported
            per signer.
          </ParamField>
        </Expandable>
      </ParamField>

      <ParamField path="policy_ids" type="string[]">
        List of policy IDs for policies that should be enforced on the wallet. Currently, only one
        policy is supported per wallet.
      </ParamField>

      <ParamField path="create_smart_wallet" type="boolean">
        Set to `true` to create a smart wallet with the user's wallet as the signer. Can only be set
        on wallets where `chainType` is `ethereum`.
      </ParamField>
    </Expandable>
  </ParamField>

  A successful response will include the new user object along with their DID:

  ```json  theme={"system"}
  {
    "id": "did:privy:clddy332f002tyqpq3b3lv327",
    "created_at": 1674788927,
    "linked_accounts": [
      {
        "address": "batman@privy.io",
        "type": "email",
        "verified_at": 1674788927
      }
    ]
  }
  ```
</View>

<Info>
  User creation endpoints have a rate limit of 240 users in total per minute. If you are being rate
  limited, responses will have status code 429. We suggest you set up exponential back-offs starting
  at 1 second to seamlessly recover.
</Info>
\n