> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Configure allowed URLs

## Allowed domains

Use the **Configuration > App settings** page > **Domains** tab of the Privy Dashboard to manage **allowed origins** for web and native mobile apps and to manage **HttpOnly cookies** in web apps.

<Info>You should only use this setting when using Privy in a production website.</Info>

#### Browser (web & mobile web)

In a browser environment (web & mobile web), allowed origins restrict which **domains** are allowed to use your Privy app ID.

In the **Allowed origins** section of this page, select the **Web & mobile web** option. In the input field, list any domains that will use your Privy app ID, separated by commas, spaces, or breaks.

Please note the following requirements:

* The protocol (`https`) is required.
* Trailing paths (`/path`) are not supported.
* Wildcards (`*`) are only supported as a subdomain (`*.domain.com`), but not as a domain alone (`*.com`).
* Partial wildcards of the form `*-sometext.domain.com` are not supported.
* Localhost (`http://localhost:port`) *is* supported but you *must* specify the `port` number. Though supported, we do **not** recommend listing `localhost` as an allowed domain for production apps. If you need to temporarily list `localhost` as an allowed domain for your production app ID, please take care to remove it when not developing.

<Tip>
  Many hosting providers and their corresponding DNS configurations treat `https://www.example.com`
  and `https://example.com` interchangeably. If these URLs are equivalent for your app setup, we
  recommend adding **both** (with and without the `www` subdomain) domains as allowed origins to the
  dashboard.
</Tip>

<Info>
  Setting allowed domains restricts **client-side access** to your Privy app ID only. Privy's REST
  API endpoints that you would query from your backend are gated by your app secret, which should
  **never** be exposed on a user's client.
</Info>

#### Supporting preview URLs

Many hosting providers (e.g. Vercel) support preview deployment URLs to make it easy to test changes, like:

```
// Matches the pattern *.netlify.app, which anyone with a free Netlify account can deploy to
deploy-preview-id--yoursitename.netlify.app
```

For security reasons, **we do not allow whitelisting domains with a *generic* pattern** that are commonly used for these preview deployments, such as:

* `https://*.netlify.app` / `https://*.vercel.app`
* `https://*-projectname.netlify.app` / `https://*-projectname.vercel.app`

Any project can deploy to a domain that matches `https://*.netlify.app`, `https://*.vercel.app`, or similar. If you were to whitelist this domain for your production App ID, any actor could set up any arbitrary deployment with your hosting provider and can use your production App ID within their site.

**If you'd like to secure your Privy App ID on preview deployment URLs, please check if your hosting provider allows you to map preview deployments to a stable subdomain that only *you control***, like:

```
// Matches the pattern *.yoursitename.netlify.app, which only members of your Netlify account
// (or hosting provider) can deploy to
deploy-preview-42<b>.yoursitename.netlify.app</b>
```

This allows you to list `https://*.yoursitename.netlify.app` under allowed domains, which arbitrary actors cannot deploy to. See instructions to set this up with [Vercel](https://vercel.com/docs/deployments/generated-urls#preview-deployment-suffix) or [Netlify](https://docs.netlify.com/domains-https/custom-domains/automatic-deploy-subdomains/).

### Native mobile

<Info>
  You should only use this setting if you use Privy in a native mobile app (e.g. via the [Expo
  SDK](/basics/react-native/quickstart).
</Info>

In a native mobile environment (e.g. iOS and Android apps), allowed origins request which **application identifiers** are allowed to use your Privy app ID.

In the **Allowed origins** section of this page, select the **Native** option. In the input field, list any domains that will use your Privy app ID, separated by commas, spaces, or breaks.

### HttpOnly Cookies

Set secure cookies that restrict access to client-side scripts, protecting sensitive data from XSS attacks. Once toggled on, you’ll be prompted to add an app domain which Privy to store user access tokens as a first-party cookie. This improves your app security and enhances your app with features like server-side rendering (SSR).

Please see our [cookies guide](/recipes/react/cookies) for instructions on how to set an app domain in this field.
\n