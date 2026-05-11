> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Deleting users

Privy allows you to delete users via their Privy user ID. This is a destructive action: if the user logs into your app again, they will have a new user ID, will create a new embedded wallet address, and will have to relink any formerly linked accounts.

<Danger>
  **Avoid deleting users whenever possible.** For security of user assets, Privy does not
  delete the embedded wallet, and instead "soft deletes" it by disassociating it from the deleted
  user and archiving the data.

  While wallet recovery may be technically possible if the user still has access to their login method, the recovery process requires significant internal coordination and can take considerable time to complete. There is no guarantee of successful recovery.

  Treat all user deletions as permanent and irreversible. Only delete users when absolutely necessary, and confirm you have exhausted all other options before proceeding.
</Danger>

<View title="NodeJS" icon="node-js">
  Use the **`PrivyClient`**'s **`delete`** method from the `users()` interface to delete a user. As a parameter, pass the user's Privy ID as a `string`:

  ```ts  theme={"system"}
  await privy.users().delete('insert-user-id');
  ```

  ### Complete Example

  ```ts  theme={"system"}
  import { PrivyClient } from '@privy-io/node';

  const privy = new PrivyClient({
    appId: process.env.PRIVY_APP_ID,
    appSecret: process.env.PRIVY_APP_SECRET
  });

  async function deletePrivyUser(id: string) {
    try {
      await privy.users().delete(id);
      console.log(`User ${id} successfully deleted`);
      return true;
    } catch (error) {
      console.error(`Failed to delete user: ${error.message}`);
      return false;
    }
  }
  ```

  This method will throw an error if the deletion operation failed (e.g. due to an invalid Privy ID).
</View>

<View title="NodeJS (server-auth)" icon="node-js">
  <Warning>
    The `@privy-io/server-auth` library is deprecated. We recommend integrating `@privy-io/node` for
    the latest features and support.
  </Warning>

  Use the **`PrivyClient`**'s **`deleteUser`** method to delete a user. As a parameter, pass the user's Privy DID as a `string`:

  ```ts  theme={"system"}
  await privy.deleteUser('did:privy:XXXXXX');
  ```

  ### Complete Example

  ```ts  theme={"system"}
  import { PrivyClient } from '@privy-io/server-auth';

  const privy = new PrivyClient(
    process.env.PRIVY_APP_ID,
    process.env.PRIVY_APP_SECRET
  );

  async function deletePrivyUser(did: string) {
    try {
      await privy.deleteUser(did);
      console.log(`User ${did} successfully deleted`);
      return true;
    } catch (error) {
      console.error(`Failed to delete user: ${error.message}`);
      return false;
    }
  }
  ```

  This method will throw an error if the deletion operation failed (e.g. due to an invalid Privy DID).
</View>

<View title="REST API" icon="terminal">
  Make a `DELETE` request to:

  ```sh  theme={"system"}
  https://auth.privy.io/api/v1/users/<did>
  ```

  Replace `<did>` with your user's Privy DID. It should have the format `did:privy:XXXXXX`.

  ### Request

  <ParamField path="Authentication" type="Basic Auth">
    Use your Privy app ID as the username and your Privy app secret as the password.
  </ParamField>

  <ParamField path="Headers" type="Object">
    <ParamField path="privy-app-id" type="string" required>
      Your Privy app ID.
    </ParamField>
  </ParamField>

  ### Example

  Below is a sample cURL command for deleting the user object associated with a Privy DID:

  ```bash  theme={"system"}
  curl --request DELETE https://auth.privy.io/api/v1/users/<user-did> \
  -u "<your-privy-app-id>:<your-privy-app-secret>" \
  -H "privy-app-id: <your-privy-app-id>"
  ```

  ### Response

  <ResponseField name="Status Code" type="number">
    <ResponseField name="204 No Content">
      The user was successfully deleted.
    </ResponseField>

    <ResponseField name="404 Not Found">
      There is no user associated with the provided Privy DID.
    </ResponseField>
  </ResponseField>
</View>

<View title="Rust" icon="rust">
  Use the **`PrivyClient`**'s **`delete`** method from the `users()` interface to delete a user. As a parameter, pass the user's Privy ID as a `string`:

  ```rust  theme={"system"}
  use privy_rs::PrivyClient;

  let client = PrivyClient::new(app_id, app_secret)?;
  client.users().delete("insert-user-id").await?;
  ```

  ### Complete Example

  ```rust  theme={"system"}
  use privy_rs::PrivyClient;

  async fn delete_privy_user(
      client: &PrivyClient,
      user_id: &str,
  ) -> Result<(), Box<dyn std::error::Error>> {
      match client.users().delete(user_id).await {
          Ok(_) => {
              println!("User {} successfully deleted", user_id);
              Ok(())
          }
          Err(error) => {
              eprintln!("Failed to delete user: {}", error);
              Err(error.into())
          }
      }
  }

  // Usage
  let client = PrivyClient::new(app_id, app_secret)?;
  delete_privy_user(&client, "cmf56qacr01qpl90brxql83lx").await?;
  ```

  This method will return an error if the deletion operation failed (e.g. due to an invalid Privy ID).
</View>

<View title="Go" icon="golang">
  To delete a user with the Go SDK, use the `Delete` method on the `Users` service.

  ### Usage

  ```go  theme={"system"}
  err := client.Users.Delete(context.Background(), "did:privy:xxxxx")
  if err != nil {
      log.Fatalf("failed to delete user: %v", err)
  }
  ```

  ### Parameters and Returns

  See the [API reference](/api-reference/users/delete) for more details.
</View>

<View title="Dashboard" icon="react">
  The Privy Dashboard provides a simple interface to delete users when necessary.

  ## Steps to delete a user

  1. Log in to the [Privy Dashboard](https://dashboard.privy.io/)
  2. Navigate to the **Users** page for your app
  3. Search for the user you wish to delete
  4. Click on the user to open the user drawer
  5. Scroll to the bottom of the user drawer
  6. Click the **Delete User** button
  7. Confirm the deletion in the confirmation dialog

  <Danger>
    This action cannot be undone. Once a user is deleted:

    * If they log in again, they will get a new DID
    * They will need to relink any accounts
    * They will get a new embedded wallet address
    * Any data associated with their previous DID will be inaccessible
  </Danger>
</View>
\n