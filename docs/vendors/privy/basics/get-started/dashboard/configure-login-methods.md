> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Configure login methods

If you plan on using Privy for user onboarding, you'll need to configure the login methods you want to use in your app.
All client SDKs require at least one login method to be enabled - follow the steps below to set up different options for your users!

### Basic login methods

For most apps, we recommend either including alternative login options alongside the following, or enabling [Multi-Factor Authentication](/authentication/user-authentication/mfa). This ensures broad accessibility across all regions and that users can continue accessing their accounts in the event that they lose access to one login method.

<AccordionGroup>
  <Accordion title="Email login">
    Privy enables your users to log in via email or link verified email addresses to their account. You can enable email login and linking via the Authentication page of the dashboard.

    #### One-Time Password Authentication

    When a user attempts to log in with their email, a one-time password (OTP) will be sent to their email address. This password is valid for 10 minutes and must be entered to complete the authentication process.

    #### Allow/disallow `+` in email addresses

    You can configure whether to allow email addresses containing the + character in the Authentication page of the dashboard.

    This is useful for users who want to use email aliases.

    <Info>
      Allowing + in email addresses enables users to create multiple accounts using
      email aliases with a single base email address. Consider your application's
      security requirements when configuring this option.
    </Info>
  </Accordion>

  <Accordion title="SMS login">
    Privy enables your users to log in via SMS or link verified phone numbers to their account. You can enable SMS login and linking via the **Authentication** page of the dashboard.

    #### One-Time Password Authentication

    Similar to email authentication, when a user attempts to log in via SMS, a one-time password (OTP) will be sent to their phone number. This password is valid for 10 minutes and must be entered to complete the authentication process.

    #### US and Canada only SMS support

    US and Canada only SMS support is included on all plans.

    You can enable access to US and Canada SMS via the **Authentication** page of the dashboard.

    <Info>
      If you enable SMS login, you may be responsible for additional charges per SMS sent. Underlying
      Twilio network costs will be passed through directly. See Twilio's pricing page
      [here](https://assets.cdn.prod.twilio.com/pricing-csv/SMSPricing.csv).
    </Info>

    #### International SMS support

    International SMS via BYO Twilio is available only for accounts on Scale and Enterprise plans. Out-of-the-box international SMS is available only for accounts on Enterprise plans, and includes the following regions:

    | Region         | Region Code |
    | -------------- | ----------- |
    | Argentina      | +54         |
    | Australia      | +61         |
    | Canada         | +1          |
    | Chile          | +56         |
    | Czech Republic | +420        |
    | Germany        | +49         |
    | Hong Kong      | +852        |
    | Hungary        | +36         |
    | Japan          | +81         |
    | New Zealand    | +64         |
    | Portugal       | +351        |
    | Saudi Arabia   | +966        |
    | Singapore      | +65         |
    | South Korea    | +82         |
    | Sweden         | +46         |
    | Taiwan         | +886        |
    | Thailand       | +66         |
    | Turkey         | +90         |
    | United Kingdom | +44         |
    | United States  | +1          |

    Learn more about International SMS support [here](/recipes/dashboard/login-methods/sms-whatsapp), and reach out to
    [support@privy.io](mailto:support@privy.io) to request access.
  </Accordion>

  <Accordion title="Wallet login">
    Privy supports blockchain wallet-based authentication methods that allow users to securely connect using their existing wallets.

    #### Supported wallet types

    Currently, Privy supports both **Sign in with Ethereum (SIWE)** and **Sign in with Solana (SIWS)** to authenticate your user into the application with any EVM or SVM compatible wallet.

    <Note>
      We're actively working to expand our support for other networks, such as Bitcoin, Sui, etc.
      Interested in a specific network that isn't currently supported? Contact us at [support@privy.io](mailto:support@privy.io) to
      inquire about additional chain support or to discuss your specific use case requirements.
    </Note>

    #### Restrict Users to a Single Wallet

    You can enable the **`Restrict users to linking a single third-party wallet`** option for your application.

    When enabled, users can only link one wallet to their account, preventing potential confusion or security issues that might arise from multiple linked wallets.
  </Accordion>
</AccordionGroup>

### Social providers

Privy allows you to log users into their accounts with existing social accounts, such as Google, Twitter, Farcaster, Telegram, and more! Follow the steps below to enable different social account login methods for your users.

<Info>
  {' '}

  Google OAuth login may not work in in-app browsers (IABs), such as those embedded in social apps,
  due to Google's restrictions in these environments. Other OAuth providers are generally
  unaffected.
</Info>

<AccordionGroup>
  <Accordion title="OAuth login methods (Google, Twitter, etc.)">
    ## OAuth login methods

    Privy allows you to log users in with their existing social accounts via the [OAuth 2.0 protocol](https://datatracker.ietf.org/doc/html/rfc6749). Privy currently supports many of the most popular OAuth providers (Google, Twitter, etc.) -- follow the guide below in order to enable these login methods for your application.

    ### Default vs custom credentials

    You can enable OAuth (social) logins quickly by just toggling it on in the Dashboard page. This will use default OAuth credentials that the Privy team has configured with each provider.

    However, best practice is to **configure your own app's OAuth credentials for each account type.**

    **Configuring your own OAuth credentials has many benefits:**

    * Your app has more control over security and resiliency.
    * Your users will see your branding on the social login provider's authentication screen.

    <Tip>
      **Just getting started with Privy?** We recommend you complete your integration in development
      using Privy's default credentials first. Before going to production, you can easily swap in your
      own credentials!
    </Tip>

    ### Configure your OAuth credentials

    Follow this guide to configure your own app's OAuth credentials.

    <Steps>
      <Step title="Setup your OAuth apps for each provider">
        To configure OAuth credentials for a given provider, first create an OAuth app with your chosen provider, following the provider-specific instructions below.

        For all providers, during setup, specify Privy's OAuth callback endpoint as your redirect URI:

        ```
        https://auth.privy.io/api/v1/oauth/callback
        ```
      </Step>

      <Step title="Configure your credentials with Privy">
        <Warning>
          Your custom credentials will go live to all your users as soon as you save them in the dashboard.
          We highly encourage you to test them in a development app before setting them for your production
          app.
        </Warning>

        Navigate to the **Login methods** page on the [Privy dashboard](https://dashboard.privy.io) by selecting your app and clicking Login Methods on the side bar. Click on the socials tab to see the social providers. Enter the OAuth credentials under the drop down for you set up.

        If a provider does not have a drop down, it does not currently support configuring your own credentials.

        <AccordionGroup>
          <Accordion title="Apple">
            #### Apple

            Follow [this](https://developer.apple.com/documentation/signinwithapple/configuring-your-environment-for-sign-in-with-apple) guide to configure your Apple app, service, and key. Note that Apple differs from the rest of the providers in a few ways.

            <Info>
              When creating the Service ID with the associated `Sign in with Apple` feature, be sure to add
              `https://auth.privy.io/api/v1/oauth/callback` as a registered redirect URI for your service.
            </Info>

            You will need to provide the following to Privy upon completion:

            * Team ID: the identifier associated with your Apple developer account.
            * Service ID: this will be used as your `Client ID`. You can find this value listed under the `Identifier` field in the `Service IDs` section:
              {" "}
              <img src="https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/apple-services-id.png?fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=2201a3fcb22313740cbb9c8a9c99433d" alt="Apple services id" data-og-width="2652" width="2652" data-og-height="644" height="644" data-path="images/apple-services-id.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/apple-services-id.png?w=280&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=75b47034da46fb7cc4b2455c6565bbd5 280w, https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/apple-services-id.png?w=560&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=806ec9d6ca526c82773b0b0f26d23b46 560w, https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/apple-services-id.png?w=840&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=385c370f865228c0ce28fece52e5e96d 840w, https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/apple-services-id.png?w=1100&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=30ff1fa1a70550f7a876218bfac07542 1100w, https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/apple-services-id.png?w=1650&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=3345a5fab29a267d4b618a7a143eb78b 1650w, https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/apple-services-id.png?w=2500&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=c891f94bcb17c72f9fb19665543d628a 2500w" />

            <Tip>
              If you are building an iOS mobile app, you will need to use the App ID instead of the Service ID.
              This should be the same as your application's `BundleId` and should be entered as your `Client ID`
              in the privy dashboard. You will still need to create a `Sign in with Apple` service associated
              with this App ID. Android apps should continue to use the Service ID as their `Client ID`.
            </Tip>

            * Key ID: the identifier associated with your key, found in the `Keys` section of the Apple Developer dashboard.
            * Key: this private key will be generated alongside the `Key ID` and will be used as your `Signing key`. Be sure to copy and paste the entire key with the header and footer into the `Signing key` input.

            <Info>
              If you have an app that has users who have already logged in using Privy's default credentials, we
              do not yet support migrating these users. If you'd like to test using your own credentials in a
              development environment, you can do so by creating a new app and setting your credentials before
              any Apple users log in.
            </Info>
          </Accordion>

          <Accordion title="Discord">
            #### Discord

            Follow [this](https://discord.com/developers/docs/topics/oauth2) guide to register a developer application. After Creating a Discord app, use the OAuth2 settings to generate a `Client Secret` and set `Redirects`. You will need to provide the following to Privy upon completion:

            * Client ID
            * Client Secret
          </Accordion>

          <Accordion title="GitHub">
            #### GitHub

            Follow [this](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app) guide to create a GitHub OAuth App. Do not enable device flow. You will need to provide the following to Privy upon completion:

            * Client ID
            * Client secret
          </Accordion>

          <Accordion title="Google">
            #### Google

            Follow [this](https://support.google.com/cloud/answer/6158849?hl=en) guide. When you are creating your app, make sure to specify `Web App` for your app type (it will be treated as a web app in the context of OAuth since you are using Privy). You will need to provide the following to Privy upon completion:

            * Client ID
            * Client secret
          </Accordion>

          <Accordion title="Instagram">
            #### Instagram

            Privy makes use of the Instagram API to allow your users to log in with and connect their Instagram business profiles to a Privy application. Follow [this](https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/create-a-meta-app-with-instagram/) guide to create a Facebook Business application with an associated Instagram product, from which you can access the [Instagram API with Instagram Login](https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login). After creating the Instagram product, use the OAuth2 settings to generate a `Client Secret` and set `Redirects`. You will need to provide the following to Privy upon completion:

            * Client ID
            * Client Secret

            Please note that this is the Client ID and Secret associated with the Instagram **Product** associated with your Facebook app, and not the Client ID and secret associated with the Facebook app.

            <Info>
              The Instagram API only allows for login with Instagram
              [business](https://www.facebook.com/business/instagram) or
              [creator](https://help.instagram.com/2358103564437429/?helpref=uf_share) accounts. Personal
              Instagram accounts cannot be used to log into Privy applications.
            </Info>
          </Accordion>

          <Accordion title="LinkedIn">
            #### LinkedIn

            Follow [this](https://learn.microsoft.com/en-us/linkedin/shared/authentication/authorization-code-flow?context=linkedin%2Fcontext\&tabs=HTTPS1#step-1-configure-your-application) guide. You will need to provide the following to Privy upon completion:

            * Client ID
            * Primary Client Secret

            <Info>
              If you have an app that has users who have already logged in using Privy's default credentials, we
              do not yet support migrating these users. If you'd like to test using your own credentials in a
              development environment, you can do so by creating a new app and setting your credentials before
              any LinkedIn users log in.
            </Info>
          </Accordion>

          <Accordion title="LINE">
            #### LINE

            Follow [this](https://developers.line.biz/en/docs/line-login/integrate-line-login/) guide to create a LINE Login channel. When setting up your channel:

            <Info>
              **Important**: When configuring LINE with your own credentials (BYO), make sure to request **email
              access** for your LINE channel. This ensures users' email addresses can be retrieved during
              authentication.
            </Info>

            You will need to provide the following to Privy upon completion:

            * Channel ID
            * Channel Secret
          </Accordion>

          <Accordion title="Spotify">
            #### Spotify

            Follow [this](https://developer.spotify.com/documentation/web-api/concepts/apps) guide to register a developer application. After Creating a Spotify app, use the OAuth2 settings to generate a `Client Secret` and set `Redirects`. You will need to provide the following to Privy upon completion:

            * Client ID
            * Client Secret
          </Accordion>

          <Accordion title="TikTok">
            #### TikTok

            Follow the instructions in the 'Prerequisites' section of [this](https://developers.tiktok.com/doc/login-kit-desktop/) guide to register your app and enable LoginKit. When you are creating your app, make sure to specify `Configure for Web` for your app type (it will be treated as a web app in the context of OAuth since you are using Privy).

            TikTok is different from other providers in a few key ways:

            * Your OAuth `client_id` is referred to as `client_key`.
            * You are required to provide a Terms of Service URL and Privacy Policy URL when creating your app.
            * TikTok conducts a review process, and your new credentials will not work until your app is approved and move to `Production` status.

            You will need to provide the following to Privy upon completion:

            * Client key (as described above)
            * Client secret

            <Info>
              If you have an app that has users who have already logged in using Privy's default credentials, we
              do not yet support migrating these users. If you'd like to test using your own credentials in a
              development environment, you can do so by creating a new app and setting your credentials before
              any TikTok users log in.
            </Info>
          </Accordion>

          <Accordion title="Twitch">
            #### Twitch

            Follow [this](https://dev.twitch.tv/docs/authentication/register-app/) guide to register a developer application. After creating a Twitch app, use the OAuth2 settings to generate a `Client Secret` and set redirect URIs. You will need to provide the following to Privy upon completion:

            * Client ID
            * Client Secret
          </Accordion>

          <Accordion title="X (formerly known as Twitter)">
            #### X (formerly known as Twitter)

            Follow [this](https://developer.twitter.com/en/docs/apps/app-management) guide to create an X (formerly known as Twitter) app. Make sure to configure your app as a "Confidential client". In the application authentication settings this is the `Web app, Automated App or Bot` option for `Type of App`. You will need to provide the following to Privy upon completion:

            * Client ID
            * Client Secret

            The X option for Native App doesn't enforce the use of a Client Secret. This is useful for authenticating with X on your mobile device, without any server involved in the process. You can learn more about Confidential clients [in the official X developer documentation](https://developer.x.com/en/docs/authentication/oauth-2-0/authorization-code).

            <Accordion title="OAuth 1.0a for Twitter">
              #### Setting up Twitter OAuth 1.0a

              To configure [OAuth 1.0a](https://docs.x.com/resources/fundamentals/authentication/oauth-1-0a/api-key-and-secret) for X integration with Privy, first ensure your X developer account has at least Basic tier access, as OAuth 1.0a is only available for this tier and higher.

              Then, configure your app's permissions to match your integration needs (Read or Read and Write).

              Once you have completed setting up your Twitter app to allow for OAuth 1.0a authorization, you will need to provide the following to Privy in the dashboard:

              * Consumer API Key
              * Consumer API Secret

              #### Which OAuth version should I use?

              This guide explains the differences between OAuth 2.0 and OAuth 1.0a to help you determine which is most appropriate for your implementation. You can also read more about the differences between the 2 versions in the [X API docs.](https://docs.x.com/resources/fundamentals/authentication/overview)

              ##### OAuth 2.0

              OAuth 2.0 is the default authentication flow and recommended for most integrations due to its simplicity and ease of setup.

              #### Advantages

              * **Simple Implementation**: This flow is straightforward to set up and implement.
              * **Granular Permission Scopes**: You can specify which permissions to request (e.g., `users.tweet.read`, `users.tweet.write`).

              #### Limitations

              * **API Restriction**: OAuth 2.0 tokens can only access the X v2 API, not the v1.1 API.
              * **App-wide Rate Limits**: Rate limits are enforced across your entire application rather than per user.
                * For example, if the `users/me` endpoint has a rate limit of 450 requests per 15 minutes, and 500 users attempt to authenticate, the last 50 users would be rate-limited and unable to complete the login process.

              ### OAuth 1.0a

              OAuth 1.0a provides a different authentication approach with user-specific access tokens and separate rate limits.

              #### Advantages

              * **User-Specific Rate Limits**: Each user's API usage is rate-limited individually, preventing one user's activity from affecting others.
              * **Broader API Access**: OAuth 1.0a tokens can access both v2 and v1.1 APIs.
              * **Isolated User Authorization**: Returns user-specific access tokens with either read-only or read-write permissions.

              #### Limitations

              * **Less Granular Permissions**: OAuth 1.0a offers less specific permission control—tokens typically grant either full read access, full read-write access, or no authorization.
              * **Higher Tier Requirement**: Only supported for X developer accounts with Basic tier or higher.
              * **Implementation Complexity**: Creating OAuth signatures for API requests requires [additional code and setup](https://docs.x.com/resources/fundamentals/authentication/oauth-1-0a/creating-a-signature) compared to OAuth 2.0.
            </Accordion>
          </Accordion>
        </AccordionGroup>
      </Step>

      <Step title="Configure token return and custom scopes">
        For any OAuth login method for which you configure your own credentials, you are able to have the user's OAuth and Refresh access tokens returned to your application's front by toggling `Return OAuth tokens` and making use of the [useOAuthTokens](/recipes/react/oauth-tokens) hook.

        If you allow for your application to return OAuth tokens to the front-end, you are also able to configure custom scopes for the OAuth authorization flow, so that the OAuth token returned can be authorized to make API requests beyond the standard scope (such as writes, or authorized access to more granular user data).

        <Warning>
          It is important that OAuth and refresh tokens are highly sensitive tokens that should be handled
          and stored in a secure fashion, inaccessible to any other third-party systems. Contact us if you
          have questions or would like guidance on token management best practices.
        </Warning>
      </Step>
    </Steps>

    ### Notes

    * You can update them anytime, with the exception of Apple, LinkedIn, and TikTok.
    * You can set and save credentials for disabled providers. These credentials will be stored and will be used for that provider's requests once you enable it.
    * If you are experiencing an issue after setting your own credentials, you can roll back to using Privy's default credentials by removing your own from the configuration screen. We only recommend doing this if you are experiencing an issue as moving to use your own credentials is best practice. This will not work for Apple, LinkedIn, or TikTok if you have existing users.

    ### FAQ

    <br />

    #### Can I delete my custom credentials and go back to using the Privy default ones?

    You can remove your credentials from the same page you configured them to go back to using Privy's defaults. We only recommend doing this if you are experiencing an issue with your own credentials as migrating to your own credentials is the best practice.

    For Apple, LinkedIn, and TikTok, once your credentials are in use, you will not be able to reset them due to user migration (see below).

    #### Will migrating to custom credentials impact my users?

    For most providers, the change will be undetectable by end users, other than their seeing your app's name next time the log in (rather than Privy's). For Apple, LinkedIn, and TikTok, if your app currently uses Privy's default credentials, we do not support updating to custom credentials. This process requires a migration which we have not yet built.

    #### Can I configure my own custom OAuth provider to work with Privy?

    No, we do not support the use of OAuth providers outside of our supported set. If you'd like to use a different provider, you may be able to through the use of [custom auth](/authentication/user-authentication/jwt-based-auth/overview).
  </Accordion>

  <Accordion title="Telegram login">
    ## Telegram Login

    Follow [this](https://core.telegram.org/bots/tutorial#obtain-your-bot-token) guide to create a telegram bot. After creating a Telegram bot, you must set your domain using the `/setdomain` command in the `@BotFather` chat. You will need to provide the following to Privy via the Privy Dashboard upon completion:

    * Bot token (eg: `1234567890:AzByCxDwEvFuGtHsIr1k2M4o5Q6s7U8w9Y0`)
    * Bot handle (eg: `@MyBot_bot`)

    Note that when configuring Telegram login:

    * Your domain must be configured as your bot's allowed domain.
    * If you have CSP enforcement, you'll need to update these directives:
      * `script-src` must allow `https://telegram.org` in order to be able to download Telegram's widget script.
      * `frame-src` must allow `https://oauth.telegram.org` in order to be able to render Telegram's widget iframe.

    <Tip>
      To use your app as a Telegram Mini-App in the Telegram web client, add `http://web.telegram.org`
      and `https://web.telegram.org` to your allowed domains in the dashboard
      [Settings](https://dashboard.privy.io?page=settings) page.
    </Tip>

    <Warning>
      Telegram login requires developers to create a Telegram bot with a bot secret. This bot secret controls the Telegram bot and is also used as a symmetric key for authentication. Control over this key enables a developer to sign over authentication data, meaning compromise of this key puts your users (and their accounts) at risk.

      **Securing this symmetric key is essential for the security of all of your app's Telegram logins.**
    </Warning>

    <Info>
      Since you need to set your bot's allowed domain you'll need to use a tunneling tool for local
      development such as [Cloudflare
      tunnels](https://developers.cloudflare.com/pages/how-to/preview-with-cloudflare-tunnel/) or
      [ngrok](https://ngrok.com/).
    </Info>

    Learn more about Telegram authentication [here](/recipes/react/seamless-telegram).
  </Accordion>

  <Accordion title="Farcaster login">
    ## Farcaster login

    [**Farcaster**](https://www.farcaster.xyz/) is a sufficiently decentralized social network whose core social graph is stored on-chain. Users can choose how content they create is stored and it enables unique, composable experiences by enabling users to link their accounts with a wallet of their choosing.

    **Privy enables your users to easily log in to your app using their Farcaster account.** This means you can easily integrate Privy with Farcaster to compose experiences with a user's existing social graph or network.

    #### Automatically link connected wallets on when logging in with Farcaster

    Farcaster accounts generally have associated embedded and verified addresses. By toggling this option, upon logging in with Farcaster, Privy will also add the associated wallet addresses as linked external wallets of the authenticated user.
  </Accordion>
</AccordionGroup>

### Third-Party auth provider

If you plan to use Privy with a custom authentication provider like Auth0, Stytch, or Firebase, use the **Third-Party auth** page of the dashboard to register the required information from your provider. Otherwise, skip this guide!

<Info>
  **Don't see the Third-Party Auth page in the Dashboard?** Please request access to this feature
  via the [Plugins](https://dashboard.privy.io/apps?page=integrations\&tab=plugins) tab on the
  Integrations page.
</Info>

<AccordionGroup>
  <Accordion title="JWT Verification Details">
    To verify your user's auth status, Privy requires a verification key to ensure the JWTs received by Privy are valid. You must provide **one** of the following:

    * **JWKS endpoint**: If your provider uses [JWKS](https://auth0.com/docs/secure/tokens/json-web-tokens/json-web-key-sets) to sign JWTs, provide a JWKS endpoint to allow Privy to get your auth provider's JWT public key.

    ```
    {
      "keys": [
        {
          // JWKS
        }
      ]
    }
    ```

    * **Public Verification Key**: If your provider uses a single key to sign JWTs, provide the corresponding public key certificate used for verification.

    For Auth0, you can follow [these instructions](https://auth0.com/docs/get-started/tenant-settings/signing-keys/view-signing-certificates) to get these details.
  </Accordion>

  <Accordion title="JWT ID Claim">
    Enter the claim from your user's JWT that contains the user's unique ID. **In most access tokens and identity tokens, this is the [`sub`](https://auth0.com/docs/secure/tokens/json-web-tokens/json-web-token-claims) claim.**
  </Accordion>

  <Accordion title="JWT `aud` Claim (Optional)">
    `aud` accepts multiple values. If any of the `aud` values in the JWT are included in the set of allowed `aud` values, the JWT will be successfully verified.

    <Accordion title="Why does Privy need this information?">
      When a user logs into your app, your auth provider issues them an **access** and/or an
      **identity** token to represent their auth status. To provision your user's embedded wallet,
      **Privy must validate this token to authenticate your user.** Privy will verify both the token's
      signature and its expiration time
      ([`exp`](https://datatracker.ietf.org/doc/html/rfc7519#section-4.1.4) claim).
    </Accordion>
  </Accordion>
</AccordionGroup>
\n