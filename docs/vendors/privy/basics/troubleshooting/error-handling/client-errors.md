> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Client-side error codes

This page lists common error codes you may encounter when using Privy, along with their descriptions and troubleshooting steps.

<Tip>
  Encountering an error code that's not listed here? Tell us what you'd like added in
  [Slack](https://privy.io/slack).
</Tip>

## `invalid_native_app_id`

**Description:** Invalid or missing native app identifier for mobile clients

**Common Causes:**

* Using wrong client ID in your application
* Native app identifiers not configured in Privy dashboard
* Using Expo Go without allowlisting `host.exp.Exponent`
* Web clients accidentally sending `privy-native-app-id` header

**Troubleshooting:**

* **Verify client ID:** Double-check that you're using the correct client ID from your Privy dashboard
* **Configure app client:** Ensure you have an [app client configured in your Privy dashboard](/basics/get-started/dashboard/app-clients)
  * **For Expo Go development:** Add `host.exp.Exponent` to your allowed application identifiers in the dashboard

***

## `invalid_origin`

**Description:** The origin that your requests are coming from has not been allowlisted in your Privy dashboard

**Common Causes:**

* You are using an `appClient` (and therefore setting `clientId` in your PrivyProvider) that is overriding the allowed origins for your application.
* You haven't added the origin to your allowed origins in the dashboard.
* Your request is coming from an iFrame whose parent origin is not allowlisted.

**Troubleshooting:**

* If you are using an `appClient`:
  * Set the allowed origins for your application in the dashboard [here](https://dashboard.privy.io/apps?setting=domains\&page=settings).
* If you are not using an `appClient`, you can set the allowed origins for your application in the dashboard [here](https://dashboard.privy.io/apps?setting=domains\&page=settings).
* Make sure to add all parent origins of your application to the allowed origins list [here](https://dashboard.privy.io/apps?setting=domains\&page=settings).

***

## `linked_to_another_user`

**Description:** There is a conflict between the current user and an existing user.

**Common Causes:**

* User previously signed up with Google/Apple OAuth using this email, then tries passwordless email login
* User tries to update their linked\_account to one that's already taken
* Importing users with duplicate linked\_account

> **Use case:**
>
> 1. A user creates an account with one email ([email1@privy.io](mailto:email1@privy.io))
> 2. This user links a different email via OAuth ([email2@privy.io](mailto:email2@privy.io))
> 3. This user then tries to log in with the linked oauth account ([email2@privy.io](mailto:email2@privy.io)) using passwordless login, this will fail because this email is not associated with a passwordless login method.

**Troubleshooting:**

* Enable login method transfer to allow users to migrate their accounts. Learn more [here](/recipes/dashboard/account-transfer).
* Make sure the user is using the correct email address for the login method they are trying to use.

***

## `failed_to_fetch_jwks_uri_document`

**Description:** Failed to fetch JWKS URI document when configuring JWT authentication

**Common Causes:**

* Cloudflare or similar security measures blocking Privy from accessing your JWKS endpoint
* JWKS endpoint not publicly accessible
* Incorrect JWKS.json structure
* Firewall or security rules restricting external access to your endpoint

**Troubleshooting:**

* **Check security configurations:** Review your Cloudflare settings or other security configurations that might be blocking external access to your JWKS endpoint
* **Validate JWKS structure:** Verify your JWKS.json follows the required structure:

```json  theme={"system"}
{
  "keys": [
    {
      "kty": "RSA",
      "n": "your-n-value",
      "e": "AQAB",
      "alg": "RS256",
      "kid": "your-key-id",
      "use": "sig"
    }
  ]
}
```

***

## `Wallet proxy not initialized`

**Description:** Privy was not able to initialize the wallet proxy to interact with embedded wallets.

**Common Causes:**

* The application's origin is not allowlisted
* The app is not waiting for Privy to reach the `ready` state
* The app is not waiting for the wallet to be fully initialized before interacting with it

**Troubleshooting:**

* Confirm that the origin is allowlisted in the dashboard [here](https://dashboard.privy.io/apps?setting=domains\&page=settings).
* Ensure that you are waiting for `ready` [here](/basics/react-native/setup#waiting-for-privy-to-be-ready) and potentially `ready` from `useWallets` [here](/wallets/wallets/get-a-wallet/get-connected-wallet#waiting-for-wallets-to-be-ready)
\n