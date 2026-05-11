> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Create or import a batch of users

To import existing users, Privy allows you to create users with their linked accounts (wallet, email, etc.) in batches via REST API to simplify the migration process. To create users, pass in an array of user objects which each represent a new user. You can also create wallets with wallet pregeneration.

Once a user has been created, all of their accounts (wallet, email, etc.) will be included in their user object when they log in. If the user has an embedded wallet, that wallet will be available to the user upon sign in.

<View title="REST API" icon="terminal">
  Make a `POST` request to:

  ```sh  theme={"system"}
  https://auth.privy.io/api/v1/users/import
  ```

  In the body of the request, include a `users` field with an array of up to 20 user objects.

  Below is a **sample cURL command** for creating multiple new users:

  ```bash  theme={"system"}
  $ curl --request POST https://auth.privy.io/api/v1/users/import \
  -u "<your-privy-app-id>:<your-privy-app-secret>" \
  -H "privy-app-id: <your-privy-app-id>" \
  -H "Content-Type: application/json" \
  -d '{
     "users": [
         {
             "linked_accounts": [
                 {
                     "type": "email",
                     "address": "joker@gmail.com"
                 }
             ]
         },
         {
             "linked_accounts": [
                 {
                     "type": "wallet",
                     "chain_type": "ethereum",
                     "address": "0xd8da6bf26964af9d7eed9e03e53415d37aa96045"
                 }
             ]
         },
         {
             "linked_accounts": [
                 {
                     "type": "email",
                     "address": "robin@gmail.com"
                 }
             ]
         }
     ]
  }'
  ```

  ### Parameters

  <ParamField body="linked_accounts" type="LinkedAccount[]" required>
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

  <ParamField path="wallets" type="WalletCreateRequestType[]">
    (Optional) An array of wallets to create for the user.

    <Expandable defaultOpen="true">
      <ParamField path="chain_type" type="'ethereum' | 'solana' | 'stellar' | 'cosmos' | 'sui' | 'tron' | 'bitcoin-segwit' | 'near' | 'ton' | 'starknet' | 'movement' | 'aptos'" required>
        The chain type of the wallet to create.
      </ParamField>

      <ParamField path="additional_signers" type="object[]">
        <Expandable defaultOpen="true">
          <ParamField path="signer_id" type="string">
            The ID of the signer.
          </ParamField>

          <ParamField path="policy_ids" type="string[]">
            List of policy IDs for policies that should be enforced on the wallet. Currently, only one
            policy is supported per wallet.
          </ParamField>
        </Expandable>
      </ParamField>

      <ParamField path="create_smart_wallet" type="boolean">
        Set to `true` to create a smart wallet with the user's wallet as the signer. Can only be set
        on wallets where `chain_type` is `ethereum`.
      </ParamField>
    </Expandable>
  </ParamField>

  ### Response Format

  A successful response will include a list of results along with details about which succeeded and which failed:

  ```json  theme={"system"}
  {
    "results": [
      {
        "action": "create",
        "index": 0,
        "success": true,
        "id": "did:privy:clfn2wysq01ijykc8gyq2j2t1"
      },
      {
        "action": "create",
        "index": 1,
        "success": false,
        "code": 101,
        "error": "Account conflict caused by an existing user. Multiple users cannot share the same account.",
        "cause": "did:privy:clfmxole300rmykc89nojp3v2"
      },
      {
        "action": "create",
        "index": 2,
        "success": true,
        "id": "did:privy:clfn2wysq01ijykc8gyq2j2t3"
      }
    ]
  }
  ```

  Each result in the response includes:

  <ResponseField name="action" type="string">
    The action taken ("create").
  </ResponseField>

  <ResponseField name="index" type="number">
    The index of the user in the request array.
  </ResponseField>

  <ResponseField name="success" type="boolean">
    Whether the user creation succeeded.
  </ResponseField>

  <ResponseField name="id" type="string">
    The Privy DID of the user (if successful).
  </ResponseField>

  <ResponseField name="code" type="number">
    Error code (if unsuccessful).
  </ResponseField>

  <ResponseField name="error" type="string">
    Error message (if unsuccessful).
  </ResponseField>

  <ResponseField name="cause" type="string">
    The conflicting DID (if there was an account conflict).
  </ResponseField>
</View>

<Info>
  User creation endpoints have a rate limit of 240 users per minute. If you are being rate limited,
  responses will have status code 429. We suggest you set up exponential back-offs starting at 1
  second to seamlessly recover.
</Info>
\n