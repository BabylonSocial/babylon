> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Using Privy as your authentication provider

Privy offers a variety of authentication methods, including:

* **[Email](/authentication/user-authentication/login-methods/email) or [SMS](/authentication/user-authentication/login-methods/sms)**: Passwordless login via a one-time passcode sent to a user's email address or phone number.
* **[Passkey](/authentication/user-authentication/login-methods/passkey)**: Biometric or passkey-based login based on the WebAuthn standard.
* **[OAuth and socials](/authentication/user-authentication/login-methods/oauth)**: Social login with Google, Apple, Twitter, Discord, GitHub, LinkedIn, Spotify, Telegram, Farcaster, and more.
* **[Wallets](/authentication/user-authentication/login-methods/wallet)**: External wallet login via Sign-In With Ethereum and Sign-In With Solana.

Your app can configure each of the account types above to be an upfront login method, or as an account that users link to their profile after login.

Privy also supports [MFA](/authentication/user-authentication/mfa/overview) for taking actions on wallets, enhancing the security of your users' accounts for higher-value transactions.

All of Privy's authentication methods create a common [user object](/user-management/users/the-user-object), where you can easily find a user's unique ID and all of the accounts they've linked to their profile. A user is a user, regardless of whether they've connected with a wallet, email or Discord account.

Once a user of your application successfully authenticates with Privy, Privy issues an [access token](/authentication/user-authentication/access-tokens) for the user that you app can additionally use to represent an authenticated session or to make authenticated requests to your backend.
\n