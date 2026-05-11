> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# null

Privy allows you to set custom metadata on the `user` object to store any app-specific metadata. This field is a generic JSON object up to 1KB in size. The JSON can contain arbitrary key-value pairs where the key is a `string` and value is a `string`, `integer`, or `boolean` (ie `{username: 'name', isVerified: true, age: 23}`).

<View title="NodeJS" icon="node-js">
  Use the **`PrivyClient`**'s **`setCustomMetadata`** method from the `users()` interface to set the custom metadata field for a user by their ID. As parameters, pass the user's ID as a `string` and the JSON object that you wish to set as custom metadata:

  ```ts  theme={"system"}
  import {PrivyClient} from '@privy-io/node';

  const privy = new PrivyClient({
    appId: process.env.PRIVY_APP_ID!,
    appSecret: process.env.PRIVY_APP_SECRET!
  });

  try {
    const user = await privy.users().setCustomMetadata('insert-user-id', {
      custom_metadata: {
        username: 'name'
      }
    });
  } catch (error) {
    console.error(error);
  }
  ```

  If a matching user is found for the ID and the custom metadata object is valid, the method will return the corresponding **`User`** object with updated custom metadata. If no matching user is found, or the custom metadata input is malformed or too large (>1KB), the method will throw an error.
</View>

<View title="NodeJS (server-auth)" icon="node-js">
  <Warning>
    The `@privy-io/server-auth` library is deprecated. We recommend integrating `@privy-io/node` for
    the latest features and support.
  </Warning>

  Use the **`PrivyClient`**'s **`setCustomMetadata`** method to set the custom metadata field for a user by their DID. As parameters, pass the user's DID as a `string` and the JSON object that you wish to set as custom metadata:

  ```typescript  theme={"system"}
  import {PrivyClient} from '@privy-io/server-auth';

  const privy = new PrivyClient(process.env.PRIVY_APP_ID!, process.env.PRIVY_APP_SECRET!);

  const user = await privy.setCustomMetadata('did:privy:XXXXXX', {username: 'name'});
  ```

  If a matching user is found for the DID and the custom metadata object is valid, the method will return the corresponding **`User`** object with updated custom metadata. If no matching user is found, or the custom metadata input is malformed or too large (>1KB), the method will throw an error.

  <Tip>
    When using the **`setCustomMetadata`** function in TypeScript, you can specify a type generic in order to enable type inference on the method like so:

    ```tsx  theme={"system"}
    // TypeScript will throw a type error if customMetadata is not of type {key1: string}
    const user = await privy.setCustomMetadata<{key1: string}>('did:privy:XXXXXX', customMetadata);
    ```
  </Tip>
</View>

<View title="Java" icon="java">
  You can set or update the custom metadata for a user by their ID using the `users().setCustomMetadata()` method.

  ```java  theme={"system"}
  try {
      UserCustomMetadataSetRequestBody customMetadataRequestBody = UserCustomMetadataSetRequestBody.builder()
  		    .customMetadata(Map.of("username", CustomMetadata.of("name")))
  	      .build();

      UserCustomMetadataSetResponse customMetadataResponse = privyClient
          .users()
          .setCustomMetadata()
          .userId("did:privy:XXXXXX")
          .requestBody(customMetadataRequestBody)
          .call();

      if (customMetadataResponse.user().isPresent()) {
          User updatedUser = customMetadataResponse.user().get();
      }
  } catch (APIException e) {
      String errorBody = e.bodyAsString();
      System.err.println(errorBody);
  } catch (Exception e) {
      System.err.println(e.getMessage());
  }
  ```

  ### Parameters

  When setting the custom metadata for a user, you may specify the following values on the `UserCustomMetadataSetRequestBody` builder:

  <ParamField path="customMetadata" type="Map<String, CustomMetadata>">
    A map of custom metadata key-value pairs. The key is a `String` and value is `CustomMetadata`
    object, which can be a `String`, `double`, or `boolean`.
  </ParamField>

  ### Returns

  The `UserCustomMetadataSetResponse` object contains an optional `user()` field that contains the
  updated user object if the custom metadata was set successfully.

  <ResponseField name="user()" type="Optional<User>">
    The updated user object. See the [user object](/user-management/users/the-user-object) for more
    details.
  </ResponseField>
</View>

<View title="Rust" icon="rust">
  Use the **`PrivyClient`**'s **`set_custom_metadata`** method from the `users()` interface to set the custom metadata field for a user by their ID. As parameters, pass the user's ID as a `string` and the metadata object:

  ```rust  theme={"system"}
  use privy_rs::{PrivyClient, generated::types::*};
  use std::collections::HashMap;

  let client = PrivyClient::new(app_id, app_secret)?;

  // Create custom metadata using the typed enum values
  let mut metadata_map = HashMap::new();
  metadata_map.insert("username".to_string(), CustomMetadataValue::String("name".to_string()));
  metadata_map.insert("isVerified".to_string(), CustomMetadataValue::Boolean(true));
  metadata_map.insert("age".to_string(), CustomMetadataValue::Number(23.0));

  let custom_metadata = CustomMetadata::from(metadata_map);

  let user = client
      .users()
      .set_custom_metadata("insert-user-id", &UserCustomMetadataSetRequestBody {
          custom_metadata,
      })
      .await?;

  println!("Updated user: {}", user.id);
  ```

  If a matching user is found for the ID and the custom metadata object is valid, the method will return the corresponding **`User`** object with updated custom metadata. If no matching user is found, or the custom metadata input is malformed or too large (>1KB), the method will return an error.

  ### Type Safety

  The Rust SDK provides type-safe custom metadata through the `CustomMetadataValue` enum:

  * `CustomMetadataValue::String(String)` for string values
  * `CustomMetadataValue::Number(f64)` for numeric values
  * `CustomMetadataValue::Boolean(bool)` for boolean values
</View>

<View title="Go" icon="golang">
  To set custom metadata for a user with the Go SDK, use the `SetCustomMetadata` method on the `Users` service.

  ### Usage

  ```go  theme={"system"}
  user, err := client.Users.SetCustomMetadata(
      context.Background(),
      "did:privy:xxxxx",
      privy.UserSetCustomMetadataParams{
          CustomMetadata: privy.CustomMetadataParam{
              "role":       privy.CustomMetadataItemUnionParam{OfString: privy.String("admin")},
              "plan":       privy.CustomMetadataItemUnionParam{OfString: privy.String("premium")},
              "signupDate": privy.CustomMetadataItemUnionParam{OfString: privy.String("2024-01-15")},
          },
      },
  )
  if err != nil {
      log.Fatalf("failed to set custom metadata: %v", err)
  }

  fmt.Println("Updated user:", user.ID)
  ```
</View>

<View title="REST API" icon="terminal">
  To set the custom data for a user with a given DID, make a `POST` request to:

  ```bash  theme={"system"}
  https://auth.privy.io/api/v1/users/<did>/custom_metadata
  ```

  Replace `<did>` with your desired Privy DID. It should have the format `did:privy:XXXXXX`.

  Below is a sample cURL command for this request:

  ```bash  theme={"system"}
  curl --request POST https://auth.privy.io/api/v1/users/<user-did>/custom_metadata \
  -u "<your-privy-app-id>:<your-privy-app-secret>" \
  -H "privy-app-id: <your-privy-app-id>"
  -d '{
    "custom_metadata": {username: "name", isVerified: true, age: 23}
  }'
  ```

  A successful response will include the user object associated with the DID, with updated custom\_metadata, like below:

  ```json  theme={"system"}
  {
    "id": "did:privy:cfbsvtqo2c22202mo08847jdux2z",
    "created_at": 1667165891,
    "custom_metadata": {"username": "name"},
    "linked_accounts": [
      {
        "type": "email",
        "address": "user@gmail.com",
        "verified_at": 1667350653
      }
    ]
  }
  ```

  If there is no user associated with the provided DID, or the custom metadata input is malformed or too large (>1KB), the API will return an error.
</View>
\n