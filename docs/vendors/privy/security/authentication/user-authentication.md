> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# User authentication

**Privy's embedded wallets are fully compatible with any authentication provider that supports JWT-based, stateless authentication.** If you're looking to add embedded wallets to your app, you can either:

* use Privy as your authentication provider (easy to set up out-of-the-box)
* use a custom authentication provider (easy to integrate alongside your existing stack)

## Integrating with any OIDC/JWT-based authentication system

Privy integrates with any authentication system that relies on asymmetric JWT tokens. This includes popular authentication providers such as Auth0, AWS Cognito, Firebase, as well as **all** OIDC (OAuth) social providers such as Google, Apple, and Twitter.

See the [JWT-based authentication guide](/authentication/user-authentication/jwt-based-auth/overview) for more information.

## Integrating with Privy's native authentication methods

Privy's authentication system provides secure user verification out of the box while maintaining a seamless experience. Privy supports multiple verification methods to accommodate different user needs and security requirements:

* Email and phone verification using one-time passwords (OTPs) [Learn more](/authentication/user-authentication/login-methods/email) {/* spellchecker:disable-line */}
* Social authentication through OAuth2.0 with providers like Google, Apple, Twitter, Discord, Github, TikTok, LinkedIn, Spotify, and Instagram [Learn more](/authentication/user-authentication/login-methods/oauth)
* Sign In With Ethereum (SIWE) and Sign in with Solana (SIWS) for web3-native users [Learn more](/authentication/user-authentication/login-methods/wallet)
* Custom authentication methods to match your specific needs

We do not support regular password-based verification given [users' tendencies to use and reuse easy-to-guess passwords](https://blog.lastpass.com/2021/09/breaking-the-cycle-of-password-reuse/), and the [high incidence of password database breaches](https://haveibeenpwned.com/).

## Token architecture

Upon successful authentication, Privy issues two types of tokens that work together to maintain secure user sessions.

**Access token**

The access token is a [JWT (JSON Web Token)](https://jwt.io/introduction) signed by an asymmetric key specific to your app. This signature cryptographically ensures that only Privy could have produced the token - it cannot be spoofed or tampered with. The token has a **one-hour lifetime**, limiting the impact of potential token exposure and enabling quick session revocation if needed.

Your backend can use this token to [validate authenticated requests](/authentication/user-authentication/access-tokens) from users, and the Privy SDK uses it to determine authentication status in your frontend.

**Refresh token**

To provide longer sessions without compromising security, the refresh token has a **30-day lifetime** but can only be used once. When used to obtain a new access token, it's automatically rotated. This ensures refresh tokens can only renew existing sessions, never create new ones.

<Warning>
  If the Privy SDK detects any token tampering, it immediately invalidates the session and requires
  re-authentication. This destroys the corresponding session in Privy's backend.
</Warning>

## Session security

Our authentication system includes several security enhancements to protect user sessions. When using a verified domain, tokens can be stored in **HttpOnly cookies** for enhanced protection against XSS attacks. All tokens are cryptographically signed and verified on both client and server.

The Privy SDK manages this complexity for you, handling token rotation, renewal, and invalidation automatically. Your backend can easily [validate authenticated requests](/authentication/user-authentication/access-tokens) using the provided access tokens.

<Tip>
  Learn more about configuring secure authentication for your application in our [security
  checklist](/security/implementation-guide/security-checklist).
</Tip>
\n