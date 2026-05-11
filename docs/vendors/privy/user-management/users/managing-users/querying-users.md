> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# null

Privy supports multiple ways to fetch and manage users in your application.

<View title="NodeJS" icon="node-js">
  ## Querying users by identity token

  <Tip>
    Using identity tokens is the recommended way to query user information about authenticated users
    in your backend. If you need user data about unauthenticated users, you can use the `_get`
    method by passing in a user's DID.
  </Tip>

  Use the `get` method to get a single user by their identity token passed from the client, to learn more about identity tokens, see [identity tokens](/user-management/users/identity-tokens).

  ```typescript  theme={"system"}
  const user = await privy.users().get({id_token: 'your-id_token'});
  ```

  ## Querying users by ID

  To get a user by their Privy ID, call the `.users()._get()` method on the `PrivyClient`.

  ```ts  theme={"system"}
  try {
    const user = privyClient.users()._get('insert-user-id');
  } catch (error) {
    console.error(error);
  }
  ```

  Check out the [API reference](/api-reference/users/get) for more details on the available parameters and returns.

  ## Querying for all users

  To get all users for your app, call the `.users().list()` method on the `PrivyClient`.

  <CodeGroup>
    ```ts Automatic pagination theme={"system"}
    try {
      for await (const user of privyClient.users().list()) {
        console.log(user.id);
      }
    } catch (error) {
      console.error(error);
    }
    ```

    ```ts Manual pagination theme={"system"}
    try {
      const usersPage = await privyClient.users().list({
        // Optional params
        // cursor: '<cursor>',
        // limit: 100,
      });

      const users = usersPage.data;

      if (usersPage.hasNextPage()) {
        const nextPage = await usersPage.getNextPage();
        const nextUsers = nextPage.data;
        expect(nextUsers.length).toBeGreaterThan(0);
      }
    } catch (error) {
        console.error(error);
    }
    ```
  </CodeGroup>

  Check out the [API reference](/api-reference/users/get-all) for more details on the available parameters and returns.

  ## Querying for users by account data

  <AccordionGroup>
    <Accordion title="By email address">
      ```ts  theme={"system"}
      try {
        const user = await privy.users().getByEmailAddress({ address: 'batman@privy.io' });
      } catch (error) {
        console.error(error);
      }
      ```
    </Accordion>

    <Accordion title="By phone number">
      ```ts  theme={"system"}
      try {
        const user = await privy.users().getByPhoneNumber({ number: '+1 555 555 5555' });
      } catch (error) {
        console.error(error);
      }
      ```
    </Accordion>

    <Accordion title="By wallet address">
      ```ts  theme={"system"}
      try {
        const user = await privy.users().getByWalletAddress({ address: '0x1234567890' });
      } catch (error) {
        console.error(error);
      }
      ```
    </Accordion>

    <Accordion title="By smart wallet address">
      ```ts  theme={"system"}
      try {
        const user = await privy.users().getBySmartWalletAddress({ address: '0x1234567890' });
      } catch (error) {
        console.error(error);
      }
      ```
    </Accordion>

    <Accordion title="By custom auth ID">
      ```ts  theme={"system"}
      try {
        const user = await privy.users().getByCustomAuthID({ custom_user_id: 'insert-custom-auth-id' });
      } catch (error) {
        console.error(error);
      }
      ```
    </Accordion>

    <Accordion title="By Farcaster ID">
      ```ts  theme={"system"}
      try {
        const user = await privy.users().getByFarcasterID({ fid: 1234 });
      } catch (error) {
        console.error(error);
      }
      ```
    </Accordion>

    <Accordion title="By Twitter subject">
      ```ts  theme={"system"}
      try {
        const user = await privy.users().getByTwitterSubject({ subject: 'insert-twitter-subject' });
      } catch (error) {
        console.error(error);
      }
      ```
    </Accordion>

    <Accordion title="By Twitter username">
      ```ts  theme={"system"}
      try {
        const user = await privy.users().getByTwitterUsername({ username: 'batman' });
      } catch (error) {
        console.error(error);
      }
      ```
    </Accordion>

    <Accordion title="By Discord username">
      ```ts  theme={"system"}
      try {
        const user = await privy.users().getByDiscordUsername({ username: 'batman' });
      } catch (error) {
        console.error(error);
      }
      ```
    </Accordion>

    <Accordion title="By Telegram User ID">
      ```ts  theme={"system"}
      try {
        const user = await privy.users().getByTelegramUserID({ telegram_user_id: 'insert-telegram-user-id' });
      } catch (error) {
        console.error(error);
      }
      ```
    </Accordion>

    <Accordion title="By Telegram username">
      ```ts  theme={"system"}
      try {
        const user = await privy.users().getByTelegramUsername({ username: 'batman' });
      } catch (error) {
        console.error(error);
      }
      ```
    </Accordion>

    <Accordion title="By GitHub username">
      ```ts  theme={"system"}
      try {
        const user = await privy.users().getByGitHubUsername({ username: 'batman' });
      } catch (error) {
        console.error(error);
      }
      ```
    </Accordion>
  </AccordionGroup>
</View>

<View title="NodeJS (server-auth)" icon="node-js">
  <Warning>
    The `@privy-io/server-auth` library is deprecated. We recommend integrating `@privy-io/node` for
    the latest features and support.
  </Warning>

  ## Querying users by identity token

  <Tip>
    Using identity tokens is the recommended way to query user information about authenticated users in your backend. If you need user data about unauthenticated users, you can use the `getUsers` method by passing in a user's DID.
  </Tip>

  Use the `getUser` method to get a single user by their identity token passed from the client, to learn more about identity tokens, see [identity tokens](/user-management/users/identity-tokens).

  ```typescript  theme={"system"}
  const user = await privy.getUser({idToken: 'your-idToken'});
  ```

  ## Other ways to query users

  <Warning>
    Privy rate limits REST API endpoints that you may call from your server. If you're looking to get
    information about an authenticated user, consider using [identity
    tokens](/user-management/users/identity-tokens) as a more secure and efficient way to access user
    data. For handling rate limits when they occur, see our guide on [implementing retry logic and other best practices](/recipes/dashboard/optimizing#handling-rate-limits).
  </Warning>

  ### Querying users by ID

  Use the `getUser` method to get a single user by their Privy DID:

  ```typescript  theme={"system"}
  const user = await privy.getUserById('did:privy:XXXXXX');
  ```

  ### Querying for all users

  Use the `getUsers` method to get a list of all your users:

  ```typescript  theme={"system"}
  const users = await privy.getUsers();
  ```

  <Note>
    The `getUsers` method automatically handles pagination and includes built-in exponential backoff to manage rate limits.
  </Note>

  ### Querying for users by account data

  <AccordionGroup>
    <Accordion title="By email address">
      Use the `getUserByEmail` method to get a user by their email address:

      ```typescript  theme={"system"}
      const user = await privy.getUserByEmail('user@gmail.com');
      ```
    </Accordion>

    <Accordion title="By phone number">
      Use the `getUserByPhoneNumber` method to get a user by their phone number:

      ```typescript  theme={"system"}
      const user = await privy.getUserByPhoneNumber('+1 555 555 5555');
      ```
    </Accordion>

    <Accordion title="By wallet address">
      Use the `getUserByWalletAddress` method to get a user by their wallet address:

      ```typescript  theme={"system"}
      const user = await privy.getUserByWalletAddress('0xABCDEFGHIJKL01234567895C5cAe8B9472c14328');
      ```
    </Accordion>

    <Accordion title="By smart wallet address">
      Use the `getUserBySmartWalletAddress` method to get a user by their smart wallet address:

      ```typescript  theme={"system"}
      const user = await privy.getUserBySmartWalletAddress('0xABCDEFGHIJKL01234567895C5cAe8B9472c14328');
      ```
    </Accordion>

    <Accordion title="By custom auth ID">
      Use the `getUserByCustomAuthId` method to get a user by their custom auth ID:

      ```typescript  theme={"system"}
      const user = await privy.getUserByCustomAuthId('123');
      ```
    </Accordion>

    <Accordion title="By Farcaster fid">
      Use the `getUserByFarcasterId` method to get a user by their Farcaster fid:

      ```typescript  theme={"system"}
      const user = await privy.getUserByFarcasterId(1402);
      ```
    </Accordion>

    <Accordion title="By Twitter subject">
      Use the `getUserByTwitterSubject` method to get a user by their Twitter subject:

      ```typescript  theme={"system"}
      const user = await privy.getUserByTwitterSubject('456');
      ```
    </Accordion>

    <Accordion title="By Twitter username">
      Use the `getUserByTwitterUsername` method to get a user by their Twitter username:

      ```typescript  theme={"system"}
      const user = await privy.getUserByTwitterUsername('batman');
      ```
    </Accordion>

    <Accordion title="By Discord username">
      Use the `getUserByDiscordUsername` method to get a user by their Discord username:

      ```typescript  theme={"system"}
      const user = await privy.getUserByDiscordUsername('batman');
      ```
    </Accordion>

    <Accordion title="By Telegram User ID">
      Use the `getUserByTelegramUserId` method to get a user by their Telegram User ID:

      ```typescript  theme={"system"}
      const user = await privy.getUserByTelegramUserId('456');
      ```
    </Accordion>

    <Accordion title="By Telegram username">
      Use the `getUserByTelegramUsername` method to get a user by their Telegram username:

      ```typescript  theme={"system"}
      const user = await privy.getUserByTelegramUsername('batman');
      ```
    </Accordion>
  </AccordionGroup>
</View>

<View title="Python" icon="python">
  ## Querying users by identity token

  <Tip>
    Using identity tokens is the recommended way to query user information about authenticated users in your backend. If you need user data about unauthenticated users, you can use the `get` method by passing in a user's DID.
  </Tip>

  Use the `get_by_id_token` method to get a single user by their identity token passed from the client, to learn more about identity tokens, see [identity tokens](/user-management/users/identity-tokens).

  ```python  theme={"system"}
  user = privy.users.get_by_id_token(id_token="your-idToken")
  ```

  ## Other ways to query users

  <Warning>
    Privy rate limits REST API endpoints that you may call from your server. If you're looking to get
    information about an authenticated user, consider using [identity
    tokens](/user-management/users/identity-tokens) as a more secure and efficient way to access user
    data. For handling rate limits when they occur, see our guide on [implementing retry logic and other best practices](/recipes/dashboard/optimizing#handling-rate-limits).
  </Warning>

  ### Querying users by ID

  Use the `get` method to get a single user by their Privy DID:

  ```python  theme={"system"}
  user = privy.users.get(user_id="did:privy:XXXXXX")
  ```

  ### Querying for all users

  Use the `list` method to get a list of all your users:

  ```python  theme={"system"}
  users = privy.users.list()
  ```

  <Note>
    The `list` method automatically handles pagination.
  </Note>

  ### Querying for users by account data

  <AccordionGroup>
    <Accordion title="By email address">
      Use the `get_by_email_address` method to get a user by their email address:

      ```python  theme={"system"}
      user = privy.users.get_by_email_address(address="user@gmail.com")
      ```
    </Accordion>

    <Accordion title="By wallet address">
      Use the `get_by_wallet_address` method to get a user by their wallet address:

      ```python  theme={"system"}
      user = privy.users.get_by_wallet_address(address="0xABCDEFGHIJKL01234567895C5cAe8B9472c14328")
      ```
    </Accordion>

    <Accordion title="By custom auth ID">
      Use the `get_by_jwt_subject_id` method to get a user by their custom auth ID:

      ```python  theme={"system"}
      user = privy.users.get_by_jwt_subject_id(custom_user_id="123")
      ```
    </Accordion>
  </AccordionGroup>
</View>

<View title="Java" icon="java">
  ## Querying users by ID

  To get a user by their Privy DID, call the `.users().retrieve()` method on the `PrivyClient`.

  ```java  theme={"system"}
  try {
      UserRetrieveResponse response = privyClient.users().retrieve("<did>");
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

  <ParamField path="userId" type="String" required>
    The user's Privy DID (i.e., `did:privy:XXXXXX`).
  </ParamField>

  ### Returns

  The `UserRetrieveResponse` object contains an optional `user()` field, present if the user was
  retrieved successfully.

  <ResponseField name="user()" type="Optional<User>">
    The retrieved `User` object. See the [user object](/user-management/users/the-user-object) for
    more details.
  </ResponseField>

  ## Querying for all users

  To get all users for your app, call the `.users().list()` method on the `PrivyClient`.

  ```java  theme={"system"}
  try {
      UserListRequestBody requestBody = UserListRequestBody.builder()

      UserListResponse response = privyClient
          .users()
          .list()
          // .cursor("<cursor>") // Optional
          // .limit(100) // Optional
          .call();

      if (response.object().isPresent()) {
          List<User> users = response.object().get().data();
      }
  } catch (APIException e) {
      String errorBody = e.bodyAsString();
      System.err.println(errorBody);
  } catch (Exception e) {
      System.err.println(e.getMessage());
  }
  ```

  ### Parameters

  <ParamField path=".cursor()" type="string">
    Cursor for pagination. Use the `next_cursor` from the previous response.
  </ParamField>

  <ParamField path=".limit()" type="number">
    Number of users to return per request. Defaults to 100.
  </ParamField>

  ### Returns

  The `UserListResponse` object contains an optional `object()` field, present if the users were
  retrieved successfully.

  <ResponseField name="object()" type="Optional<UserListResponseBody>">
    The retrieved `UserListResponseBody` object.

    <Expandable defaultOpen="true">
      <ResponseField name="data()" type="List<User>">
        The list of users.
      </ResponseField>

      <ResponseField name="nextCursor()" type="Optional<String>">
        Cursor to use for the next batch of users.
      </ResponseField>
    </Expandable>
  </ResponseField>

  ## Querying for users by account data

  <AccordionGroup>
    <Accordion title="By email address">
      To get a user by their email address, call the `.users().retrieveByEmailAddress()` method on the
      `PrivyClient`.

      ```java  theme={"system"}
      try {
          UserRetrieveByEmailAddressRequestBody request = UserRetrieveByEmailAddressRequestBody.builder()
              .address("user@gmail.com")
              .build();

          UserRetrieveByEmailAddressResponse response = privyClient
              .users()
              .retrieveByEmailAddress(request);

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

      You can specify the following values on the `UserRetrieveByEmailAddressRequestBody` builder:

      <ParamField path=".address()" type="String" required>
        Email address of the user.
      </ParamField>

      ### Returns

      The `UserRetrieveByEmailAddressResponse` object contains an optional `user()` field, present if the user was retrieved successfully.

      <ResponseField name="user()" type="Optional<User>">
        The retrieved `User` object. See the [user object](/user-management/users/the-user-object) for
        more details.
      </ResponseField>
    </Accordion>

    <Accordion title="By custom auth ID">
      To get a user by their custom auth ID, call the `.users().retrieveByCustomAuthId()` method on the
      `PrivyClient`.

      ```java  theme={"system"}
      try {
          UserRetrieveByCustomAuthIdRequestBody request = UserRetrieveByCustomAuthIdRequestBody.builder()
              .customUserId("123")
              .build();

          UserRetrieveByCustomAuthIdResponse response = privyClient
              .users()
              .retrieveByCustomAuthId(request);

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

      You can specify the following values on the `UserRetrieveByCustomAuthIdRequestBody` builder:

      <ParamField path=".customUserId()" type="String" required>
        Custom user ID provided by your authentication system.
      </ParamField>

      ### Returns

      The `UserRetrieveByCustomAuthIdResponse` object contains an optional `user()` field, present if the user was retrieved successfully.

      <ResponseField name="user()" type="Optional<User>">
        The retrieved `User` object. See the [user object](/user-management/users/the-user-object) for
        more details.
      </ResponseField>
    </Accordion>
  </AccordionGroup>
</View>

<View title="REST API" icon="terminal">
  ## Querying users by ID

  To get a user by their Privy DID, make a `GET` request to:

  ```bash  theme={"system"}
  https://auth.privy.io/api/v1/users/<did>
  ```

  ### Parameters

  <ParamField query="did" type="string" required>
    The user's Privy DID (e.g., `did:privy:XXXXXX`).
  </ParamField>

  ### Sample request

  ```bash  theme={"system"}
  curl --request GET https://auth.privy.io/api/v1/users/<user-did> \
  -u "<your-privy-app-id>:<your-privy-app-secret>" \
  -H "privy-app-id: <your-privy-app-id>"
  ```

  ## Querying for all users

  To get all users for your app, make a `GET` request to:

  ```bash  theme={"system"}
  https://auth.privy.io/api/v1/users
  ```

  ### Parameters

  <ParamField query="cursor" type="string">
    Cursor for pagination. Use the `next_cursor` from the previous response.
  </ParamField>

  <ParamField query="limit" type="number">
    Number of users to return per request. Defaults to 100.
  </ParamField>

  ### Response

  The response will include:

  * `data`: Array of user objects
  * `next_cursor`: Cursor to use for the next batch of users

  ### Sample request

  ```bash  theme={"system"}
  # First batch of users
  curl --request GET https://auth.privy.io/api/v1/users \
  -u "<your-privy-app-id>:<your-privy-app-secret>" \
  -H "privy-app-id: <your-privy-app-id>"

  # Subsequent batches using cursor
  curl --request GET https://auth.privy.io/api/v1/users?cursor=<next_cursor> \
  -u "<your-privy-app-id>:<your-privy-app-secret>" \
  -H "privy-app-id: <your-privy-app-id>"
  ```

  ## Querying for users by account data

  <AccordionGroup>
    <Accordion title="By email address">
      To get a user by their email address, make a `POST` request to:

      ```bash  theme={"system"}
      https://auth.privy.io/api/v1/users/email/address
      ```

      ### Body

      <ParamField body="address" type="string" required>
        Email address of the user.
      </ParamField>

      ### Sample request

      ```bash  theme={"system"}
      curl --request POST "https://auth.privy.io/api/v1/users/email/address" \
      -u "<your-privy-app-id>:<your-privy-app-secret>" \
      -H "privy-app-id: <your-privy-app-id>" \
      -H 'Content-Type: application/json' \
      -d '{
        "address": "user@gmail.com"
      }'
      ```
    </Accordion>

    <Accordion title="By phone number">
      To get a user by their phone number, make a `POST` request to:

      ```bash  theme={"system"}
      https://auth.privy.io/api/v1/users/phone/number
      ```

      ### Body

      <ParamField body="number" type="string" required>
        Phone number of the user.
      </ParamField>

      ### Sample request

      ```bash  theme={"system"}
      curl --request POST "https://auth.privy.io/api/v1/users/phone/number" \
      -u "<your-privy-app-id>:<your-privy-app-secret>" \
      -H "privy-app-id: <your-privy-app-id>" \
      -H 'Content-Type: application/json' \
      -d '{
        "number": "1234567890"
      }'
      ```
    </Accordion>

    <Accordion title="By wallet address">
      To get a user by their wallet address, make a `POST` request to:

      ```bash  theme={"system"}
      https://auth.privy.io/api/v1/users/wallet/address
      ```

      ### Body

      <ParamField body="address" type="string" required>
        Wallet address of the user.
      </ParamField>

      ### Sample request

      ```bash  theme={"system"}
      curl --request POST "https://auth.privy.io/api/v1/users/wallet/address" \
      -u "<your-privy-app-id>:<your-privy-app-secret>" \
      -H "privy-app-id: <your-privy-app-id>" \
      -H 'Content-Type: application/json' \
      -d '{
        "address": "0xABCDEFGHIJKL01234567895C5cAe8B9472c14328"
      }'
      ```
    </Accordion>

    <Accordion title="By smart wallet address">
      To get a user by their smart wallet address, make a `POST` request to:

      ```bash  theme={"system"}
      https://auth.privy.io/api/v1/users/smart_wallet/address
      ```

      ### Body

      <ParamField body="address" type="string" required>
        Smart wallet address of the user.
      </ParamField>

      ### Sample request

      ```bash  theme={"system"}
      curl --request POST "https://auth.privy.io/api/v1/users/smart_wallet/address" \
      -u "<your-privy-app-id>:<your-privy-app-secret>" \
      -H "privy-app-id: <your-privy-app-id>" \
      -H 'Content-Type: application/json' \
      -d '{
        "address": "0xABCDEFGHIJKL01234567895C5cAe8B9472c14328"
      }'
      ```
    </Accordion>

    <Accordion title="By custom auth ID">
      To get a user by their custom auth ID, make a `POST` request to:

      ```bash  theme={"system"}
      https://auth.privy.io/api/v1/users/custom_auth/id
      ```

      ### Body

      <ParamField body="custom_user_id" type="string" required>
        Custom user ID provided by your authentication system.
      </ParamField>

      ### Sample request

      ```bash  theme={"system"}
      curl --request POST "https://auth.privy.io/api/v1/users/custom_auth/id" \
      -u "<your-privy-app-id>:<your-privy-app-secret>" \
      -H "privy-app-id: <your-privy-app-id>" \
      -H 'Content-Type: application/json' \
      -d '{
        "custom_user_id": "123"
      }'
      ```
    </Accordion>

    <Accordion title="By Farcaster fid">
      To get a user by their Farcaster fid, make a `POST` request to:

      ```bash  theme={"system"}
      https://auth.privy.io/api/v1/users/farcaster/fid
      ```

      ### Body

      <ParamField body="fid" type="string" required>
        Farcaster ID of the user.
      </ParamField>

      ### Sample request

      ```bash  theme={"system"}
      curl --request POST "https://auth.privy.io/api/v1/users/farcaster/fid" \
      -u "<your-privy-app-id>:<your-privy-app-secret>" \
      -H "privy-app-id: <your-privy-app-id>" \
      -H 'Content-Type: application/json' \
      -d '{
        "fid": "789"
      }'
      ```
    </Accordion>

    <Accordion title="By Twitter subject">
      To get a user by their Twitter subject, make a `POST` request to:

      ```bash  theme={"system"}
      https://auth.privy.io/api/v1/users/twitter/subject
      ```

      ### Body

      <ParamField body="subject" type="string" required>
        Twitter subject identifier of the user.
      </ParamField>

      ### Sample request

      ```bash  theme={"system"}
      curl --request POST "https://auth.privy.io/api/v1/users/twitter/subject" \
      -u "<your-privy-app-id>:<your-privy-app-secret>" \
      -H "privy-app-id: <your-privy-app-id>" \
      -H 'Content-Type: application/json' \
      -d '{
        "subject": "12345"
      }'
      ```

      <Note>
        Use subject instead of username to get Twitter accounts with faster queries.
      </Note>
    </Accordion>

    <Accordion title="By Twitter username">
      To get a user by their Twitter username, make a `POST` request to:

      ```bash  theme={"system"}
      https://auth.privy.io/api/v1/users/twitter/username
      ```

      ### Body

      <ParamField body="username" type="string" required>
        Twitter username of the user.
      </ParamField>

      ### Sample request

      ```bash  theme={"system"}
      curl --request POST "https://auth.privy.io/api/v1/users/twitter/username" \
      -u "<your-privy-app-id>:<your-privy-app-secret>" \
      -H "privy-app-id: <your-privy-app-id>" \
      -H 'Content-Type: application/json' \
      -d '{
        "username": "batman"
      }'
      ```
    </Accordion>

    <Accordion title="By Discord username">
      To get a user by their Discord username, make a `POST` request to:

      ```bash  theme={"system"}
      https://auth.privy.io/api/v1/users/discord/username
      ```

      ### Body

      <ParamField body="username" type="string" required>
        Discord username of the user.
      </ParamField>

      ### Sample request

      ```bash  theme={"system"}
      curl --request POST "https://auth.privy.io/api/v1/users/discord/username" \
      -u "<your-privy-app-id>:<your-privy-app-secret>" \
      -H "privy-app-id: <your-privy-app-id>" \
      -H 'Content-Type: application/json' \
      -d '{
        "username": "batman"
      }'
      ```
    </Accordion>

    <Accordion title="By Telegram User ID">
      To get a user by their Telegram User ID, make a `POST` request to:

      ```bash  theme={"system"}
      https://auth.privy.io/api/v1/users/telegram/telegram_user_id
      ```

      ### Body

      <ParamField body="telegram_user_id" type="string" required>
        Telegram User ID of the user.
      </ParamField>

      ### Sample request

      ```bash  theme={"system"}
      curl --request POST "https://auth.privy.io/api/v1/users/telegram/telegram_user_id" \
      -u "<your-privy-app-id>:<your-privy-app-secret>" \
      -H "privy-app-id: <your-privy-app-id>" \
      -H 'Content-Type: application/json' \
      -d '{
        "telegram_user_id": "12345"
      }'
      ```

      <Note>
        Use ID instead of username to get Telegram accounts with faster queries.
      </Note>
    </Accordion>

    <Accordion title="By Telegram username">
      To get a user by their Telegram username, make a `POST` request to:

      ```bash  theme={"system"}
      https://auth.privy.io/api/v1/users/telegram/username
      ```

      ### Body

      <ParamField body="username" type="string" required>
        Telegram username of the user.
      </ParamField>

      ### Sample request

      ```bash  theme={"system"}
      curl --request POST "https://auth.privy.io/api/v1/users/telegram/username" \
      -u "<your-privy-app-id>:<your-privy-app-secret>" \
      -H "privy-app-id: <your-privy-app-id>" \
      -H 'Content-Type: application/json' \
      -d '{
        "username": "batman"
      }'
      ```
    </Accordion>
  </AccordionGroup>
</View>

<View title="Rust" icon="rust">
  ## Querying users by ID

  To get a user by their Privy ID, call the `.users().get()` method on the `PrivyClient`.

  ```rust  theme={"system"}
  use privy_rs::PrivyClient;

  let client = PrivyClient::new(app_id, app_secret)?;

  let user = client.users().get("insert-user-id").await?;
  println!("Found user: {}", user.id);
  ```

  Check out the [API reference](/api-reference/users/get) for more details on the available parameters and returns.

  ## Querying for all users

  To get all users for your app, call the `.users().list()` method on the `PrivyClient`.

  ```rust  theme={"system"}
  use privy_rs::{PrivyClient, generated::types::ListUsersQuery};

  let client = PrivyClient::new(app_id, app_secret)?;

  // Get users with optional pagination
  let users_response = client
      .users()
      .list(Some(&ListUsersQuery {
          cursor: None,
          limit: Some(100),
      }))
      .await?;

  for user in users_response.data {
      println!("User ID: {}", user.id);
  }

  // Handle pagination if needed
  if let Some(next_cursor) = users_response.next_cursor {
      let next_page = client
          .users()
          .list(Some(&ListUsersQuery {
              cursor: Some(next_cursor),
              limit: Some(100),
          }))
          .await?;
  }
  ```

  ## Querying users by specific criteria

  The Rust SDK provides several methods to query users by specific linked accounts:

  ```rust  theme={"system"}
  use privy_rs::generated::types::*;

  // Get user by email address
  let user = client
      .users()
      .get_by_email_address(&GetUsersByEmailAddressBody {
          email: "user@example.com".to_string(),
      })
      .await?;

  // Get user by wallet address
  let user = client
      .users()
      .get_by_wallet_address(&GetUsersByWalletAddressBody {
          address: "0x1234...".to_string(),
      })
      .await?;

  // Get user by phone number
  let user = client
      .users()
      .get_by_phone_number(&GetUsersByPhoneNumberBody {
          phone_number: "+1234567890".to_string(),
      })
      .await?;

  // Get user by custom auth ID
  let user = client
      .users()
      .get_by_custom_auth_id(&GetUsersByCustomAuthIdBody {
          custom_user_id: "custom-user-123".to_string(),
      })
      .await?;
  ```
</View>

<View title="Go" icon="golang">
  The Go SDK provides multiple methods to query users on the `Users` service.

  ### Get user by ID

  ```go  theme={"system"}
  user, err := client.Users.Get(context.Background(), "did:privy:xxxxx")
  if err != nil {
      log.Fatalf("failed to get user: %v", err)
  }
  ```

  ### Get user by email

  ```go  theme={"system"}
  user, err := client.Users.GetByEmailAddress(context.Background(), privy.UserGetByEmailAddressParams{
      Address: "user@example.com",
  })
  if err != nil {
      log.Fatalf("failed to get user: %v", err)
  }
  ```

  ### Get user by wallet address

  ```go  theme={"system"}
  user, err := client.Users.GetByWalletAddress(context.Background(), privy.UserGetByWalletAddressParams{
      Address: "0x1234...",
  })
  if err != nil {
      log.Fatalf("failed to get user: %v", err)
  }
  ```

  ### Other query methods

  The Go SDK also supports:

  * `client.Users.GetByPhoneNumber`
  * `client.Users.GetByCustomAuthID`
  * `client.Users.GetBySmartWalletAddress`
  * `client.Users.GetByTwitterUsername`
  * `client.Users.GetByGitHubUsername`
  * `client.Users.GetByTelegramUserID`

  ### Parameters and Returns

  See the [API reference](/api-reference/users/get) for more details.
</View>
\n