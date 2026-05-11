> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Additional OAuth providers

This guide demonstrates how to integrate any custom [OAuth 2.0 provider](https://oauth.net/2/) that is not natively supported by Privy.

<Warning>
  This is an advanced feature. We recommend understanding the basics of OAuth 2.0 before proceeding.
  Misconfiguring this feature can lead to security vulnerabilities.
</Warning>

## Overview

Privy's custom OAuth feature allows you to:

* **Integrate any OAuth 2.0 provider** - Add authentication for services like YouTube, Kraken, or Reddit not natively supported by Privy
* **Maintain unified user experience** - Custom providers work seamlessly with Privy's existing authentication flows
* **Customize branding** - Upload custom provider icons and display names for your login UI
* **Advanced configuration** - Support for PKCE, custom scopes, and flexible user data mapping

## Step 1: Configure your OAuth provider

First, you'll need to set up your OAuth application with the provider you want to integrate.

### Register your application

1. Navigate to your OAuth provider's developer console
2. Create a new OAuth application
3. Configure the redirect URI to point to Privy:
   ```
   https://auth.privy.io/api/v1/oauth/callback
   ```
4. Note your client ID and client secret
5. Review the provider's documentation for:
   * Authorization endpoint URL
   * Token endpoint URL
   * User info endpoint URL (if needed)
   * Available scopes
   * User data structure

### Example: Setting up Twitch OAuth

Here's how to configure Twitch as an example:

1. Go to the [Twitch Developer Console](https://dev.twitch.tv/console)
2. Create a new application with these settings:
   * **Name**: Your app name
   * **OAuth Redirect URLs**: `https://auth.privy.io/api/v1/oauth/callback`
   * **Category**: Choose appropriate category
3. Note the **Client ID** and generate a **Client Secret**
4. Review Twitch's OAuth endpoints:
   * Authorization URL: `https://id.twitch.tv/oauth2/authorize`
   * Token URL: `https://id.twitch.tv/oauth2/token`
   * User Info: `https://id.twitch.tv/oauth2/userinfo`

## Step 2: Configure custom OAuth in Privy Dashboard

Navigate to your Privy Dashboard and configure the custom OAuth provider.

<Warning>
  Once set, custom OAuth provider fields cannot be changed. Be sure to double check your
  configuration before saving. Once users are created under a custom OAuth provider, the
  configuration cannot be deleted.
</Warning>

### Basic configuration

1. Go to **Settings > Login methods** in your Privy Dashboard
2. Click **Add Custom Provider**
3. Fill in the basic configuration:

**Display name** (required)

* How the provider appears in your login UI
* Example: "Twitch", "Kraken", "Reddit"

**Provider icon**

* Upload a icon for your login button
* Will be displayed alongside other social login options

**Client ID** (required)

* The client ID from your OAuth provider
* Used to identify your application during OAuth flow

**Client secret** (required)

* The client secret from your OAuth provider
* Securely stored and used for token exchange

### OAuth endpoints

Configure the OAuth flow endpoints:

**Authorization URL** (required)

* Where users are redirected to grant permissions
* Example: `https://provider.com/oauth/authorize`

**Token URL** (required)

* Endpoint for exchanging authorization code for access token
* Also known as the refresh URL
* Example: `https://provider.com/oauth/token`

**Profile URL** (optional)

* Endpoint to fetch user information
* Only needed if using "Profile Endpoint" user info source
* Example: `https://api.provider.com/user`

### Advanced configuration

**Scopes**

* List of OAuth scopes to request
* Common scopes: `openid`, `profile`, `email`
* Provider-specific examples:
  * Twitch: `user:read:email`, `openid`
  * Discord: `identify`, `email`

**Scopes delimiter**

* Character used to separate multiple scopes
* Default: space (` `)
* Some providers use comma (`,`) or plus (`+`)

**PKCE enabled**

* Enable Proof Key for Code Exchange for enhanced security
* Recommended for public clients and mobile apps
* Check if your OAuth provider supports PKCE before enabling this setting

**Use cookie domain for redirect**

* Advanced setting for custom domain configurations
* Leave disabled unless specifically needed

### User information configuration

Configure how Privy extracts user data from your OAuth provider. Review your authentication provider's documentation to determine which method is needed for your use case.

**ID Token**

* Extract user info from OpenID Connect ID token
* Works with providers that return ID tokens

**Profile endpoint**

* Fetch user info from a dedicated API endpoint
* Requires additional HTTP request

**Access token JWT**

* Extract user info directly from access token

### Field mapping

Map user data fields from your provider to Privy user attributes using dot notation for nested fields. Review your auth provider's documentation to determine which fields are available for extraction and tell Privy where to put that information on the user's linked account.

```json  theme={"system"}
{
  "path_to_name": "display_name",
  "path_to_username": "login",
  "path_to_email": "user.email",
  "path_to_profile_picture_url": "profile_image_url"
}
```

## Step 3: Implement in your application

Once configured in the Dashboard, your custom OAuth provider works automatically with Privy's SDKs.

### Using Privy UIs

Your custom OAuth provider will appear automatically in Privy's login UI:

```tsx  theme={"system"}
import {useLogin, usePrivy} from '@privy-io/react-auth';

function LoginPage() {
  const {ready, authenticated, user} = usePrivy();
  const {login} = useLogin();

  // Custom providers appear automatically in the login modal
  if (!ready) return <div>Loading...</div>;

  if (!authenticated) {
    return <button onClick={login}>Sign in</button>;
  }

  return <UserDashboard user={user} />;
}
```

### Using whitelabel UIs

Your app can also use our whitelabel hooks to login with custom OAuth providers. As a parameter to the `initOAuth` method, pass an object with `provider` field set to `custom:<your-provider-name>`.

```tsx  theme={"system"}
import {useLoginWithOAuth} from '@privy-io/react-auth';

function CustomTwitchButton() {
  const {initOAuth} = useLoginWithOAuth({
    onComplete: (user) => {
      console.log('Twitch login successful:', user);
    },
    onError: (error) => {
      console.error('Twitch login failed:', error);
    }
  });

  const handleTwitchLogin = () => {
    initOAuth({provider: 'custom:twitch'});
  };

  return (
    <button onClick={handleTwitchLogin}>
      <img src="/twitch-icon.png" alt="Twitch" width="20" height="20" />
      Connect Twitch account
    </button>
  );
}
```

### Accessing custom OAuth account data

Custom OAuth accounts are available in the user object. Filter the linked accounts by `type === custom:<your-provider-name>` to find the account.

```tsx  theme={"system"}
import {usePrivy} from '@privy-io/react-auth';

function UserProfile() {
  const {user} = usePrivy();

  // Find custom OAuth accounts
  const customAccounts = user?.linkedAccounts?.filter((account) =>
    account.type.startsWith('custom:')
  );

  // Find specific provider account
  const twitchAccount = user?.linkedAccounts?.find((account) => account.type === 'custom:twitch');

  return (
    <div>
      <h2>Connected Accounts</h2>
      {customAccounts?.map((account) => (
        <div key={account.type}>
          <strong>{account.type.replace('custom:', '')}</strong>
          <p>Username: {account.username}</p>
          <p>Email: {account.email}</p>
        </div>
      ))}
    </div>
  );
}
```

<Tip>Your app can configure multiple custom OAuth providers with Privy.</Tip>
\n