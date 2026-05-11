> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Creating key quorums

To create a key quorum, first [create the authorization keys](/controls/authorization-keys/keys/create/key) and/or [get the user IDs](/controls/authorization-keys/keys/create/user/overview) of the users that will constitute the key quorum. Key quorums can also include other [key quorums](/controls/key-quorum/overview) as members (one level deep).

Once you have the user ID(s), authorization key(s), and/or key quorum ID(s), register the key quorum with Privy via the Dashboard or the REST API.

<View title="Dashboard" icon="terminal">
  Visit the [**Authorization keys**](https://dashboard.privy.io/apps?page=authorization-keys) page of the **Wallets** section for your app, click **New key**, and select **Register key quorum instead**.

  Specify the public keys you'd like to add to the quorum and an authorization threshold.

  <Info>
    Key quorums containing both user IDs and authorization keys must be created via the REST API.
  </Info>

    <img src="https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/authkeys.png?fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=e9705db989c192fe5f754f9171182807" alt="Dashboard" data-og-width="1843" width="1843" data-og-height="1317" height="1317" data-path="images/authkeys.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/authkeys.png?w=280&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=f1c68142fd64fde65070c49350f621f3 280w, https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/authkeys.png?w=560&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=dc8e1fdc596c3a4241b7d9550aedd7be 560w, https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/authkeys.png?w=840&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=fc125e38e7114ef1e7b2d4c052fc4d67 840w, https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/authkeys.png?w=1100&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=8dd4658d33a8963176fb50fff56e5550 1100w, https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/authkeys.png?w=1650&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=938fd2d2863c2256c0cfb08985cc6ac9 1650w, https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/authkeys.png?w=2500&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=3e898804c565170c9e3983131cf0944c 2500w" />
</View>

<View title="NodeJS" icon="node-js">
  <Info>
    This guide is for the **`@privy-io/node`** library only, as the feature is not available in the
    **`@privy-io/server-auth`** library.
  </Info>

  You can create a key quorum using the Node SDK by using the `keyQuorums().create()` method.

  ### Usage

  <Tip>
    The returned `id` for the key quorum is used as the `owner_id` field when creating or updating resources (e.g. wallets or policies) in the Privy API.
  </Tip>

  ```ts title="Example: Create a 2-of-2 key quorum with an authorization key and a user" theme={"system"}
  try {
    const keyQuorum = await privyClient.keyQuorums().create({
      public_keys: ['authorization-key'],
      user_ids: ['user-id'],
      key_quorum_ids: ['key-quorum-id'], // Optional: nest other key quorums as members
      display_name: '2 of 2 Test Key Quorum',
      authorization_threshold: 2, // Require 2 signatures (both keys)
    });

    const keyQuorumId = keyQuorum.id;
  } catch (error) {
    console.error(error);
  }
  ```

  Refer to the [API reference](/api-reference/key-quorums/create) for more details on the available parameters and returns.
</View>

<View title="Java" icon="java">
  You can create a key quorum using the Java SDK by using the `keyQuorums().create()` method.

  ### Usage

  <Tip>
    The returned `id` for the key quorum is used as the `ownerId` field when creating or updating resources (e.g. wallets or policies) in the Privy API.
  </Tip>

  ```java title="Example: Create a 2-of-2 key quorum with an authorization key and a user" theme={"system"}
  try {
    KeyQuorumCreateRequestBody keyQuorumRequest = KeyQuorumCreateRequestBody.builder()
        .publicKeys(List.of("authorization-key"))
        .userIds(List.of("user-id"))
        .keyQuorumIds(List.of("key-quorum-id")) // Optional: nest other key quorums as members
        .displayName("2 of 2 Test Key Quorum")
        .authorizationThreshold(2.0) // Require 2 signatures (both keys)
        .build();

    KeyQuorumCreateResponse keyQuorumResponse = privyClient
        .keyQuorums()
        .create(keyQuorumRequest);

    if (keyQuorumResponse.keyQuorum().isPresent()) {
        KeyQuorum keyQuorum = keyQuorumResponse.keyQuorum().get();
        String keyQuorumId = keyQuorum.id();
    }
  } catch (APIException e) {
    String errorBody = e.bodyAsString();
    System.err.println(errorBody);
  } catch (Exception e) {
    System.err.println(e.getMessage());
  }
  ```

  ### Parameters

  When creating a key quorum, you can specify the following values on the `KeyQuorumCreateRequestBody` builder:

  <ParamField path="publicKeys" type="List<String>">
    A list of base64-encoded, DER-formatted P-256 public keys to register.
  </ParamField>

  <ParamField path="userIds" type="List<String>">
    A list of user IDs to include in the key quorum.
  </ParamField>

  <ParamField path="keyQuorumIds" type="List<String>">
    A list of key quorum IDs to include as members of this key quorum (one level deep). Each nested quorum counts as one member toward the parent's authorization threshold.
  </ParamField>

  <ParamField path="authorizationThreshold" type="Double">
    The minimum number of signatures required to authorize an action. If left unset, the default is all keys.
  </ParamField>

  <ParamField path="displayName" type="String">
    Human readable display name to attach to the key.
  </ParamField>

  ### Returns

  The `KeyQuorumCreateResponse` object contains an optional `keyQuorum()` field, present if the key quorum was created successfully.

  <ResponseField name="keyQuorum()" type="Optional<KeyQuorum>">
    The created `KeyQuorum` object.

    <Expandable title="KeyQuorum" defaultOpen="true">
      <ResponseField name="id" type="String">
        Unique ID for the key quorum, used to assign the `owner_id` to a resource.
      </ResponseField>

      <ResponseField name="authorizationKeys" type="List<AuthorizationKey>">
        The list of authorization keys included in the key quorum.

        <Expandable title="AuthorizationKey">
          <ResponseField name="publicKey" type="String">
            The public key of the authorization key.
          </ResponseField>

          <ResponseField name="displayName" type="String">
            The display name of the authorization key.
          </ResponseField>
        </Expandable>
      </ResponseField>

      <ResponseField name="userIds" type="List<String>">
        The list of user IDs included in the key quorum.
      </ResponseField>

      <ResponseField name="keyQuorumIds" type="List<String>">
        The list of key quorum IDs nested as members of this key quorum.
      </ResponseField>

      <ResponseField name="authorizationThreshold" type="Double">
        The minimum number of signatures required to authorize an action. If left unset, the default is all keys.
      </ResponseField>

      <ResponseField name="displayName" type="String">
        Human readable display name to attach to the key.
      </ResponseField>
    </Expandable>
  </ResponseField>
</View>

<View title="Rust" icon="rust">
  You can create a key quorum using the Rust SDK by using the `key_quorums().create()` method.

  ### Usage

  <Tip>
    The returned `id` for the key quorum is used as the `owner_id` field when creating or updating resources (e.g. wallets or policies) in the Privy API.
  </Tip>

  ```rust title="Example: Create a 2-of-2 key quorum with an authorization key and a user" theme={"system"}
  use privy_rs::{PrivyClient, generated::types::*};

  let client = PrivyClient::new(app_id, app_secret)?;

  let request = CreateKeyQuorumBody {
      public_keys: Some(vec!["authorization-key".to_string()]),
      user_ids: Some(vec!["user-id".to_string()]),
      key_quorum_ids: Some(vec!["key-quorum-id".to_string()]), // Optional: nest other key quorums
      display_name: Some("2 of 2 Test Key Quorum".to_string()),
      authorization_threshold: Some(2.0), // Require 2 signatures (both keys)
  };

  let key_quorum = client
      .key_quorums()
      .create(request)
      .await?;

  let key_quorum_id = key_quorum.id;
  println!("Created key quorum: {}", key_quorum_id);
  ```

  ### Parameters and Returns

  See the Rust SDK documentation for detailed parameter and return types, including embedded examples:

  * [KeyQuorumsClient::create](https://docs.rs/privy-rs/latest/privy_rs/subclients/struct.KeyQuorumsClient.html#method.create)

  For REST API details, see the [API reference](/api-reference/key-quorums/create).
</View>

<View title="Go" icon="golang">
  To create a key quorum with the Go SDK, use the `New` method on the `KeyQuorums` service.

  ### Usage

  <Tip>
    The returned `Id` for the key quorum is used as the `OwnerId` field when creating or updating
    resources (e.g. wallets or policies) in the Privy API.
  </Tip>

  ```go title="Example: Create a 2-of-2 key quorum with an authorization key and a user" theme={"system"}
  quorum, err := client.KeyQuorums.New(context.Background(), privy.KeyQuorumNewParams{
      PublicKeys:             []string{"authorization-key"},
      UserIDs:                []string{"user-id"},
      KeyQuorumIDs:           []string{"key-quorum-id"}, // Optional: nest other key quorums
      DisplayName:            privy.String("2 of 2 Test Key Quorum"),
      AuthorizationThreshold: privy.Float(2), // Require 2 signatures (both keys)
  })
  if err != nil {
      log.Fatalf("failed to create key quorum: %v", err)
  }

  keyQuorumID := quorum.ID
  ```

  ### Parameters and Returns

  See the [API reference](/api-reference/key-quorums/create) for more details.
</View>

<View title="REST API" icon="terminal">
  Register the key quorum with Privy by making a `POST` request to:

  ```sh  theme={"system"}
  https://api.privy.io/v1/key_quorums
  ```

  In the request body, include the following.

  <Accordion title="Show request body parameters">
    <ParamField path="public_keys" type="string[]">
      A list of base64-encoded, DER-formatted P-256 public keys to register.
    </ParamField>

    <ParamField path="user_ids" type="string[]">
      A list of user IDs to include in the key quorum.
    </ParamField>

    <ParamField path="key_quorum_ids" type="string[]">
      A list of key quorum IDs to include as members of this key quorum (one level deep). Each nested quorum counts as one member toward the parent's authorization threshold.
    </ParamField>

    <ParamField path="authorization_threshold" type="number">
      The minimum number of signatures required to authorize an action. If left unset, the default is all keys.
    </ParamField>

    <ParamField path="display_name" type="string">
      Human readable display name to attach to the key.
    </ParamField>
  </Accordion>

  If the request is successful, Privy will return the following fields in the response.

  <Accordion title="Show response body fields">
    <ResponseField name="id" type="string">
      Unique ID for the key quorum, used to assign the `owner_id` to a resource.
    </ResponseField>

    <ResponseField name="authorization_keys" type="{public_key: string, display_name: string | null}[]">
      The list of public keys and their display names.
    </ResponseField>

    <ResponseField name="user_ids" type="string[]">
      The list of user IDs included in the key quorum.
    </ResponseField>

    <ResponseField name="key_quorum_ids" type="string[]">
      The list of key quorum IDs nested as members of this key quorum.
    </ResponseField>

    <ResponseField path="authorization_threshold" type="number | null">
      The minimum number of signatures required to authorize an action. If left unset, the default is all keys.
    </ResponseField>

    <ResponseField name="display_name" type="string">
      Human readable display name to attach to the key.
    </ResponseField>
  </Accordion>

  <Tip>
    The returned `id` for the key quorum is used as the `owner_id` field when creating or updating resources (e.g. wallets or policies) in the Privy API.
  </Tip>

  See an example request for creating a key quorum below.

  <Accordion title="Show example request to create a key quorum">
    As an example, a request to register a 2 of 2 key quorum might look like the following:

    ```bash  theme={"system"}
    $ curl --request POST https://api.privy.io/v1/key_quorums \
    -u "<your-privy-app-id>:<your-privy-app-secret>" \
    -H "privy-app-id: <your-privy-app-id>" \
    -H 'Content-Type: application/json' \
    -d '{
        "display_name": "Sample key",
        "public_keys": [
            "MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEx4aoeD72yykviK+f/ckqE2CItVIG\n1rCnvC3/XZ1HgpOcMEMialRmTrqIK4oZlYd1RfxU3za/C9yjhboIuoPD3g==",
            "MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAErzZtQr/bMIh3Y8f9ZqseB9i/AfjQ\nhu+agbNqXcJy/TfoNqvc/Y3Mh7gIZ8ZLXQEykycx4mYSpqrxp1lBKqsZDQ=="
        ],
        "key_quorum_ids": ["<nested-key-quorum-id>"],
        "authorization_threshold": 2
    }'
    ```

    An example successful response would look like:

    ```json  theme={"system"}
    {
        "id": "<insert-owner-id>",
        "display_name": "Sample key",
        "public_keys": [
            {
              "public_key": "MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEx4aoeD72yykviK+f/ckqE2CItVIG\n1rCnvC3/XZ1HgpOcMEMialRmTrqIK4oZlYd1RfxU3za/C9yjhboIuoPD3g=="
            },
            {
              "public_key": "MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAErzZtQr/bMIh3Y8f9ZqseB9i/AfjQ\nhu+agbNqXcJy/TfoNqvc/Y3Mh7gIZ8ZLXQEykycx4mYSpqrxp1lBKqsZDQ=="
            }
        ],
        "key_quorum_ids": ["<nested-key-quorum-id>"],
        "authorization_threshold": 2
    }
    ```
  </Accordion>
</View>
\n