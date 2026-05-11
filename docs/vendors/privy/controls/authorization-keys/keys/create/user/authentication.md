> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Configure authentication settings

<Tip>If your app uses Privy as your authentication provider, you can skip this step.</Tip>

In order to issue user keys for users, the Privy API must verify the user's access token to ensure that the authenticated user is the party making the request for the user key.

To verify a user's access token, Privy requires that your app register details of your authentication setup in the Privy Dashboard. Namely:

1. Get your **JWKS.json** endpoint from your authentication provider (e.g. Auth0, Firebase, Stytch). Privy will use this endpoint to verify access tokens for your users.
2. In the **Authentication** page of the **Configuration** section of the Privy Dashboard, enable **JWT-based authentication**.
3. Once JWT-based authentication has been enabled:
   1. Determine whether your app will be authenticating requests that contain your provider's JWTs from a **server side or client side environment**.
      {/* prettier-ignore */}
   2. Register the **JWKS.json** endpoint from your authentication provider and the name of the **JWT claim** that specifies the user's ID (typically `sub`).
      Privy can now verify access tokens issued by your authentication provider to authenticate users, and issue user keys for users.
\n