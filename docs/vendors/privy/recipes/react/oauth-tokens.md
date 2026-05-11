> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Use tokens from OAuth providers

<View title="React" icon="react">
  **To configure callbacks for whenever a user successfully authorizes a third-party OAuth account, use the `useOAuthTokens` hook:**

  ```tsx  theme={"system"}
  import {useOAuthTokens, type OAuthTokens} from '@privy-io/react-auth';

  const {reauthorize} = useOAuthTokens({
    // Any logic you'd like to execute with the OAuth tokens
    onOAuthTokenGrant: ({oAuthTokens}) => {
      console.log(
        oAuthTokens.provider,
        oAuthTokens.accessToken,
        oAuthTokens.accessTokenExpiresInSeconds,
        oAuthTokens.refreshToken,
        oAuthTokens.refreshTokenExpiresInSeconds,
        oAuthTokens.scopes
      );
    }
  });

  // You may also call `getAccessToken` to get the user's current access token
  ```

  As parameters to **`useOAuthTokens`**, you may include an **`onOAuthTokenGrant`** callback.

  <Tip>
    The component where the **`useOAuthTokens`** hook is invoked **must** be mounted on the
    component/page the user returns to after authorizing an OAuth flow in order for this callback to
    execute. Note that having the page lazy load the component with the hook may interfere with
    execution of the callback.
  </Tip>

  ### onAccessTokenGranted

  If set, the **`onOAuthTokenGrant`** callback will execute after a user returns to the application from an OAuth flow authorization. This happens in 3 cases:

  * When the user logs in via an OAuth/social login method,
  * When a user links a new OAuth account to their user account,
  * When a successful **`reauthorize`** call is invoked, and the user authorizes an existing OAuth account.

  Within this callback, you can access:

  * **`provider`**: the OAuth provider, is one of `'apple'`, `'discord'`, `'github'`, `'google'`, `'linkedin'`, `'spotify'`, `'tiktok'`, `'instagram'`, and `'twitter'`.
  * **`accessToken`**: the OAuth access token
  * **`accessTokenExpiresInSeconds`**: the number of seconds until the OAuth access token expires
  * **`refreshToken`**: the OAuth refresh token
  * **`refreshTokenExpiresInSeconds`**: the number of seconds until the OAuth refresh token expires. If the refresh token is present and this field is undefined, it is assumed that the refresh token does not have an expiration date
  * **`scopes`**: the list of OAuth scopes the access token is approved for.

  Learn more about how to use OAuth access and refresh tokens [here.](https://www.oauth.com/oauth2-servers/access-tokens/)

  Within this callback, you can also access a `reauthorize` method, which will allow a user to re-authorize an existing OAuth account in order to retrieve more up-to-date OAuth tokens and account metadata.
</View>

<View title="React Native" icon="react">
  **To configure callbacks for whenever a user successfully authorizes a third-party OAuth account in your React Native app, use the `useOAuthTokens` hook:**

  ```tsx  theme={"system"}
  import {useOAuthTokens} from '@privy-io/expo';

  // The hook takes a single callback that will be triggered when OAuth tokens are granted
  useOAuthTokens({
    onOAuthTokenGrant: (tokens: OAuthTokens) => {
      console.log(
        tokens.provider,
        tokens.accessToken,
        tokens.accessTokenExpiresInSeconds,
        tokens.refreshToken,
        tokens.refreshTokenExpiresInSeconds,
        tokens.scopes
      );
    }
  });
  ```

  <Tip>
    The component where the **`useOAuthTokens`** hook is invoked **must** be mounted on the
    component/page the user returns to after authorizing an OAuth flow in order for this callback to
    execute.
  </Tip>

  ### onOAuthTokenGrant

  The **`onOAuthTokenGrant`** callback will execute after a user returns to the application from an OAuth flow authorization. This happens in 3 cases:

  * When the user logs in via an OAuth/social login method,
  * When a user links a new OAuth account to their user account,
  * When a user re-authorizes an existing OAuth account.

  Within this callback, you can access:

  * **`provider`**: the OAuth provider, is one of `'apple'`, `'discord'`, `'github'`, `'google'`, `'linkedin'`, `'spotify'`, `'tiktok'`, `'instagram'`, and `'twitter'`.
  * **`accessToken`**: the OAuth access token
  * **`accessTokenExpiresInSeconds`**: the number of seconds until the OAuth access token expires
  * **`refreshToken`**: the OAuth refresh token
  * **`refreshTokenExpiresInSeconds`**: the number of seconds until the OAuth refresh token expires. If the refresh token is present and this field is undefined, it is assumed that the refresh token does not have an expiration date
  * **`scopes`**: the list of OAuth scopes the access token is approved for.

  <Info>
    In React Native, OAuth tokens are securely stored in the Expo Secure Store, which is backed by the
    Keychain on iOS and EncryptedSharedPreferences on Android. This ensures that sensitive OAuth
    tokens are properly protected on mobile devices.
  </Info>

  <Info>
    Unlike the React version, the React Native `useOAuthTokens` hook does not return a `reauthorize`
    method. To reauthorize an OAuth account in React Native, you should use the `login` method from
    the `usePrivy` hook.
  </Info>
</View>
\n