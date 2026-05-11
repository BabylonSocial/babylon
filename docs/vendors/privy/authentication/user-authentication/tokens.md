> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Tokens

> Understanding the core tokens in Privy's authentication system

Privy issues three types of tokens when users authenticate with an application: **access tokens**, **refresh tokens**, and **identity tokens**. Each token serves a distinct purpose in the authentication system and works together to provide secure, seamless user experiences.

<CardGroup cols={3}>
  <Card title="Access tokens" icon="key" href="#access-tokens">
    Verify user authentication
  </Card>

  <Card title="Refresh tokens" icon="arrow-rotate-right" href="#refresh-tokens">
    Maintain user sessions
  </Card>

  <Card title="Identity tokens" icon="id-card" href="#identity-tokens">
    Access user data
  </Card>
</CardGroup>

***

## Access tokens

Access tokens are short-lived credentials that prove a user is authenticated. These tokens should be included in requests from the frontend to your backend to verify that the requesting user is genuinely authenticated.

**Key characteristics:**

* **Format**: ES256-signed JWT
* **Lifetime**: 1 hour (default, configurable)
* **Purpose**: Authentication verification
* **Claims**: Session ID, user DID, app ID, issuer, timestamps
* **Automatic refresh**: Yes, when using `getAccessToken` method

**When to use:**

* Verifying user authentication
* Protecting backend API endpoints

<Info>
  Access token lifetime can be configured in the [Privy Dashboard](https://dashboard.privy.io) under
  **User management > Authentication > Advanced**.
</Info>

<Card title="Access tokens guide" icon="arrow-right" href="/authentication/user-authentication/access-tokens">
  Learn how to send and verify access tokens
</Card>

## Refresh tokens

Refresh tokens are long-lived credentials used to obtain new access tokens without requiring the user to re-authenticate. These tokens are managed automatically by Privy's SDKs and are not directly accessible to developers.

**Key characteristics:**

* **Format**: Opaque string (not a JWT)
* **Lifetime**: 30 days (default, configurable)
* **Purpose**: Session persistence and access token renewal
* **Storage**: Secure storage managed by Privy SDK
* **Automatic management**: Yes, handled entirely by Privy

**When refresh tokens are used:**

Refresh tokens automatically come into play when:

* `getAccessToken` is called and the current access token is expired
* The user returns to the application within the refresh token lifetime

**Session lifecycle:**

<Steps>
  <Step title="User authenticates">Privy issues both an access token and a refresh token</Step>
  <Step title="Access token expires">After 1 hour, the access token becomes invalid</Step>

  <Step title="Automatic refresh">
    The SDK uses the refresh token to request a new access token
  </Step>

  <Step title="Session continues">The user remains authenticated without re-logging in</Step>
  <Step title="Refresh token expires">After 30 days (default), the user must re-authenticate</Step>
</Steps>

<Info>
  Refresh token lifetime can be configured in the [Privy Dashboard](https://dashboard.privy.io)
  under **User management > Authentication > Advanced**.
</Info>

## Identity tokens

Identity tokens are specialized tokens that contain user data, including linked accounts and custom metadata. These tokens enable efficient access to user information without additional API calls.

**Key characteristics:**

* **Format**: ES256-signed JWT
* **Lifetime**: 10 hours (default, configurable)
* **Purpose**: User data access
* **Claims**: User DID, linked accounts, custom metadata, app ID, issuer, timestamps
* **Configuration**: Must be enabled in Dashboard
* **Automatic refresh**: Yes, when user data changes or access token refreshes

**When to use:**

* Accessing user data (linked accounts, custom metadata) on the backend
* Avoiding additional API calls to Privy's servers

<Info>
  Identity tokens must be enabled in the [Privy Dashboard](https://dashboard.privy.io) under **User
  management > Authentication > Advanced > Return user data in an identity token**. The lifetime can
  be configured under **User management > Authentication > Advanced**.
</Info>

<Card title="Identity tokens guide" icon="arrow-right" href="/user-management/users/identity-tokens">
  Learn how to retrieve and verify identity tokens
</Card>

***

## Session management

**What is a session?**

A session represents a user's authenticated period in an application. Sessions are tracked using the session ID (`sid`) claim present in both access tokens and identity tokens.

**Session creation:**

A new session is created when:

* A user successfully logs in
* A user's existing session has expired and they re-authenticate

**Session persistence:**

Sessions persist through:

* Access token expiration and renewal (via refresh tokens)
* Page refreshes and navigation
* Browser restarts (if refresh token is still valid)

**Session termination:**

A session ends when:

* The user explicitly logs out
* The refresh token expires (after 30 days by default)

<Info>
  Session duration can be configured under **User management > Authentication > Advanced**.
</Info>

***

## Security best practices

<AccordionGroup>
  <Accordion title="Token transmission">
    **Always use HTTPS**

    All token transmission must occur over HTTPS to prevent interception. This applies to:

    * Initial token issuance from Privy
    * Token transmission from frontend to backend
    * Token refresh requests
  </Accordion>

  <Accordion title="Token verification">
    **Always verify tokens on the backend**

    Never trust tokens without verification. Always:

    * Verify the token signature using Privy's verification key
    * Check the token expiration (`exp` claim)
    * Validate the issuer (`iss` claim) is `privy.io`
    * Validate the audience (`aud` claim) matches the app ID

    <Tip>Use Privy SDKs to ensure tokens are verified correctly on the server.</Tip>
  </Accordion>

  <Accordion title="Token exposure">
    **Minimize token exposure**

    * Never log tokens in application logs
    * Never include tokens in URLs or query parameters
    * Never store tokens in insecure locations (plain text files, client-side localStorage on shared devices)
    * Never share tokens across different applications
  </Accordion>

  <Accordion title="Refresh token protection">
    **Refresh tokens require extra care**

    Because refresh tokens are long-lived:

    * They should never be sent to the frontend in web applications using local storage
    * They should only be used by the Privy SDK, never directly by application code
    * They should be rotated when used (handled automatically by Privy)
    * They should be invalidated immediately upon logout
  </Accordion>
</AccordionGroup>

<Warning>
  Privy SDKs handle all token security automatically. Manual token management is not recommended and
  may introduce security vulnerabilities.
</Warning>

***

## Verification

### Verifying access tokens

Access tokens should be verified on the backend using Privy's server SDKs. The verification process validates the token signature, checks expiration, and returns the authenticated user's information.

**Verification returns:**

| Field        | Type     | Description                              |
| ------------ | -------- | ---------------------------------------- |
| `userId`     | `string` | The authenticated user's Privy DID       |
| `sessionId`  | `string` | The unique session identifier            |
| `appId`      | `string` | The Privy app ID                         |
| `issuer`     | `string` | Always `'privy.io'`                      |
| `issuedAt`   | `number` | Unix timestamp when the token was issued |
| `expiration` | `number` | Unix timestamp when the token expires    |

<Card title="Complete access token guide" icon="arrow-right" href="/authentication/user-authentication/access-tokens#verifying-the-access-token">
  View detailed verification examples for Node.js, Python, Go, Rust, and third-party libraries
</Card>

### Verifying identity tokens

Identity tokens should be verified and parsed using Privy's server SDKs. The verification process validates the signature and parses the user data, including linked accounts and custom metadata.

<Warning>
  The `verifyAuthToken` method only works with access tokens. Always use the appropriate identity
  token verification method when working with identity tokens.
</Warning>

<Card title="Complete identity token guide" icon="arrow-right" href="/user-management/users/identity-tokens#verifying-the-identity-token">
  View detailed verification examples and security considerations
</Card>

### Refresh tokens cannot be verified

Refresh tokens are opaque strings that cannot be verified by application code. They are only valid when presented to Privy's authentication endpoints and are managed entirely by Privy's SDKs.

Applications should never:

* Attempt to decode or parse refresh tokens
* Store refresh tokens separately from Privy's SDK storage
* Transmit refresh tokens to custom backends
* Include refresh tokens in logs or analytics
\n