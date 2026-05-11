> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Allowlist

**With Privy, you can enable an allowlist for your application to gate access to specific email addresses, phone numbers, and/or wallet addresses.** You can use the allowlist feature to coordinate a beta launch of your product for early-access users, manage an ongoing waitlist, and more!

When you enable an allowlist for your app:

* All existing users will still be permitted to login to your app
* New users must be added to the allowlist by their email address, phone number, or wallet address to be permitted to login
* New users who have not been added to your allowlist will **not** be permitted to login.

<Note>
  Allowlists apply to email, SMS, wallet, and OAuth methods with verified emails only. Login methods
  like Telegram and Farcaster are not supported.
</Note>

## Enabling the allowlist for your app

You can enable an allowlist directly from the [Privy developer dashboard](https://dashboard.privy.io). To do so, just navigate to the **Users** page > [Access Control](https://dashboard.privy.io/apps/cm7z7tdvm00oxpsqt25bha0tv/users?tab=access-control) tab of the dashboard and toggle allowlists on.

<img src="https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/Allow.png?fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=3b4ffdce0f7ee57faa679c25ec982af2" alt="images/Allow.png" data-og-width="1843" width="1843" data-og-height="1317" height="1317" data-path="images/Allow.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/Allow.png?w=280&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=f81a785712652173e5455fa5de8d715e 280w, https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/Allow.png?w=560&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=38e0fe821f3c3ec414afd08c56a47a6b 560w, https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/Allow.png?w=840&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=3153fda8e9bc7f058a630b8c6ae295f9 840w, https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/Allow.png?w=1100&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=a73b89babde69a9b0c0a4759e3d6c1ff 1100w, https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/Allow.png?w=1650&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=e10f60fa46de61d6f954b6bdb8b9b182 1650w, https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/Allow.png?w=2500&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=a9e1d2ceb3b8272476306f4043611c75 2500w" />

## Managing the allowlist

There are two main ways to manage the allowlist for your app:

* Using the API, you can easily [add users](/user-management/users/managing-users/allowlist#adding-to-the-allow-list), [remove users](/user-management/users/managing-users/allowlist#removing-from-the-allow-list), and [get your current allowlist](/user-management/users/managing-users/allowlist#getting-the-allow-list).
* Using the developer dashboard, you can easily [add and remove users](/user-management/users/managing-users/allowlist#adding-to-the-allow-list) from your app's invite list page.

<Tip>
  It's easy to use the Privy API to manage your waitlist with a third party-tool. For instance, if you are using [Airtable](https://www.airtable.com/) to manage your waitlist, you can easily integrate it with Privy.

  Check out [this guide](/recipes/dashboard/airtable) for more!
</Tip>

## Adding to the allowlist

Privy allows you to easily add a user's email address, phone number, or wallet address to the allowlist for your app.

<View title="NodeJS (server-auth)" icon="node-js">
  Use the `inviteToAllowlist` method to add a user to your allowlist.

  ```tsx  theme={"system"}
  const allowlistEntry = await privy.inviteToAllowlist({
    type: 'email',
    value: 'batman@privy.io'
  });
  ```

  As a parameter to the method, pass an object with the following fields:

  <ParamField path="type" type="'email' | 'phone' | 'wallet'" required>
    The type of account to add to the allowlist.
  </ParamField>

  <ParamField path="value" type="string" required>
    The identifier of the account to add to the allowlist. Should be the corresponding email address,
    phone number, or wallet address.
  </ParamField>

  If the invitation is successful, the method will return an allowlist entry object. If the invitation
  fails, the method will throw an error.
</View>

<View title="REST API" icon="terminal">
  ## Using the REST API

  Make a `POST` request to:

  ```sh  theme={"system"}
  https://auth.privy.io/api/v1/apps/<your-privy-app-id>/allowlist
  ```

  In the body of the request, include the following fields:

  <ParamField path="type" type="'email' | 'phone' | 'wallet'" required>
    The type of account to add to the allowlist.
  </ParamField>

  <ParamField path="value" type="string" required>
    The identifier of the account to add to the allowlist. Should be the corresponding email address,
    phone number, or wallet address.
  </ParamField>

  Below is a sample cURL command for adding an email to the allowlist:

  ```bash  theme={"system"}
  curl --request POST 'https://auth.privy.io/api/v1/apps/<your-privy-app-id>/allowlist' \
  -u "<your-privy-app-id>:<your-privy-app-secret>" \
  -H "privy-app-id: <your-privy-app-id>" \
  -H 'Content-Type: application/json' \
  --data-raw '{
      "type": "email",
      "value": "user@email.com"
  }'
  ```

  A successful response will include the new allowlist entry, like below

  ```json  theme={"system"}
  {
    "id": "allowlist-entry-ID",
    "type": "wallet",
    "value": "0xab5801a7d398351b8be11c439e05c5b3259aec9b",
    "appId": "your-privy-app-ID"
  }
  ```
</View>

## Removing from the allowlist

Privy allows you to easily remove a user's email address, phone number, or wallet address to the allowlist for your app.

<View title="NodeJS (server-auth)" icon="node-js">
  Use the `removeFromAllowlist` method to remove a user from your allowlist.

  ```tsx  theme={"system"}
  const removedAllowlistEntry = await privy.removeFromAllowlist({
    type: 'email',
    value: 'batman@privy.io'
  });
  ```

  As a parameter to the method, pass an object with the following fields:

  <ParamField path="type" type="'email' | 'phone' | 'wallet'" required>
    The type of account to remove from the allowlist.
  </ParamField>

  <ParamField path="value" type="string" required>
    The identifier of the account to remove from the allowlist. Should be the corresponding email
    address, phone number, or wallet address.
  </ParamField>

  If the invitation is successful, the method will return an object that represents the now-deleted
  allowlist entry. If the invitation fails, the method will throw an error.
</View>

<View title="REST API" icon="terminal">
  Make a `DELETE` request to:

  ```sh  theme={"system"}
  https://auth.privy.io/api/v1/apps/<your-privy-app-id>/allowlist
  ```

  In the body of the request, include the following fields:

  <ParamField path="type" type="'email' | 'phone' | 'wallet'" required>
    The type of account to remove from the allowlist.
  </ParamField>

  <ParamField path="value" type="string" required>
    The identifier of the account to remove from the allowlist. Should be the corresponding email
    address, phone number, or wallet address.
  </ParamField>

  Below is a sample cURL command for deleting an email from the allowlist:

  ```bash  theme={"system"}
  curl --request DELETE 'https://auth.privy.io/api/v1/apps/<your-privy-app-id>/allowlist' \
  -u "<your-privy-app-id>:<your-privy-app-secret>" \
  -H "privy-app-id: <your-privy-app-id>" \
  -H 'Content-Type: application/json' \
  --data-raw '{
    "type": "email",
    "value": "user@email.com"
  }'
  ```

  A successful response will include a message, such as:

  ```json  theme={"system"}
  {
    "message": "Successfully deleted from allowlist"
  }
  ```

  If there is no corresponding allowlist entry for the invited account you attempted to delete, the response will include an error.
</View>

<Info>
  If a user has successfully logged into your application (e.g. after having been added to the allow
  list), you must [delete their user object](/user-management/users/managing-users/deleting-users),
  rather than deleting their allowlist entry—to revoke their access.
</Info>

***

# Getting the allowlist

Privy allows you to easily get the current allowlist for your app.

<View title="NodeJS (server-auth)" icon="node-js">
  Use the 's method to get your app's current allowlist. Pass no parameters to this method.

  ```tsx  theme={"system"}
  const allowlistEntry = await privy.getAllowlist();
  ```

  If the request is successful, the method will return an array of objects. These include a `type` describing the type of entry (`'email'`, `'phone'`, or `'wallet'`) and a `value` with the corresponding account identifier (e.g. the email address).
</View>

<View title="REST API" icon="terminal">
  Make a `GET` request to:

  ```
  https://auth.privy.io/api/v1/apps/<your-privy-app-id>/allowlist
  ```

  Below is a sample cURL command for getting your current allowlist:

  ```bash  theme={"system"}
  curl --request GET 'https://auth.privy.io/api/v1/apps/<your-privy-app-id>/allowlist' \
  -u "<your-privy-app-id>:<your-privy-app-secret>" \
  -H "privy-app-id: <your-privy-app-id>"
  ```

  A successful response will include an array of your current allowlist entries, like below:

  ```json  theme={"system"}
  [
    {
      "id": "allowlist-entry-ID",
      "type": "wallet",
      "value": "0xab5801a7d398351b8be11c439e05c5b3259aec9b",
      "appId": "your-privy-app-ID"
    },
    {
      "id": "allowlist-entry-ID",
      "type": "email",
      "value": "user@email.com",
      "appId": "your-privy-app-ID"
    }
    // ...
  ]
  ```
</View>

***

# Customizing allowlist rejection

If your app has an allowlist enabled, new users who attempt to login with an account not in your allowlist will not be permitted to login to your app.

**You can customize the screen shown to the user when they are denied permission to login, to help contextualize the allowlist within your app.**

To customize this screen, make a `POST` request to

```
https://auth.privy.io/api/v1/apps/<your-privy-app-id>
```

In the body of the request, include an field that contains a JSON with the following fields. All fields in this object are optional.

<ParamField path="error_title" type="string">
  The primary text for the error message you'd like to show your user. Defaults to "You don't have
  access to this app".
</ParamField>

<ParamField path="error_detail" type="string">
  The secondary text for the error message you'd like to show your user. Defaults to "Have you been
  invited?"
</ParamField>

<ParamField path="cta_text" type="string">
  The text to show on the error confirmation button. Defaults to "Try another account"
</ParamField>

<ParamField path="cta_link" type="string">
  The URL to navigate the user to, when they click the error CTA. Defaults to just closing the
  screen on click, instead of navigating the user to another URL.
</ParamField>

Below is a sample cURL command for updating the allowlist config:

```bash  theme={"system"}
curl --request POST 'https://auth.privy.io/api/v1/apps/<your-privy-app-id>' \
-u "<your-privy-app-id>:<your-privy-app-secret>" \
-H "privy-app-id: <your-privy-app-id>" \
-H 'Content-Type: application/json' \
--data-raw '{
  "allowlist_config": {
    "error_title": "Insert your error title",
    "error_detail": "Insert your error detail",
    "cta_text": "Insert your error CTA",
    "cta_link": "Insert a URL to navigate the user to when clicking the CTA"
  }
}'
```
\n