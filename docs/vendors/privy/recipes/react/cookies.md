> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Configure cookies

When a user logs in to your app, Privy issues that user an access token that stores their authenticated session. **You can configure Privy to store a user's access token either with a browser's [local storage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage) or as a [`HttpOnly` cookie](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies) set on your app's base domain**.

By default, Privy will store the user's access token in local storage. Configuring cookies requires that your app have a stable base domain and that you set a DNS record for this domain. In kind, **cookies are recommended for production applications only**.

While developing your integration, you can use Privy's default setup of local storage to get started.

## Enabling cookies

To configure your app to use cookies, follow the steps below:

### 1. Create separate development and production Privy app IDs

In the [**Privy Dashboard**](https://dashboard.privy.io/), create (at minimum) **two** Privy apps. Concretely, you should create one app for use in **production** environments only, and one app for use in **development** environments only.

This step is critical, as once you enable cookies, your production app ID will **only** work in your production environment, and will error in all other environments.

<Info>
  The development process for all environments (production and development) will be the same on your
  end. The only difference is that you **must** use separate app IDs for each environment.
</Info>

Next, follow the steps below, **only for your production app ID**. Do not complete them for your development app.

### 2. For your production app, register your production domain in the Privy Dashboard

In the [**Privy Dashboard**](https://dashboard.privy.io/), find your **production app** in the App Dropdown of the left sidebar. Then, navigate to the **Configuration > App settings** page > **Domains** tab for that app.

Toggle on **HttpOnly cookies**. You'll be prompted to add an app domain. This is the domain root of your web app (e.g. example.com). Do not include the protocol or [www](http://www).

**Do not list a domain that is not a production domain.** As a general rule, our team will not automatically approve domains that appear to be scoped to a sandbox environment. Example of such unsupported domains include `*.vercel.app`, `*.railway.app`, `*.herokuapp.com`, and `*.amazonaws.com`.

### 3. For your production domain, set the necessary DNS records

Once you've set your app's domain in **Configuration >> App settings >> Domains**, Privy will display any required DNS records you must set for that for that domain. **Go to the admin dashboard of your domain registrar and set the required DNS records.**

Once done, return to the **HttpOnly cookies** section in the **Privy Dashboard** and click the **Refresh** button on your domain. This will force Privy to re-verify if the correct DNS records have been set for that domain or not. Please note that it may take a few hours for DNS records to propagate before Privy can confirm that it is verified.

This allows Privy's servers to set a first-party cookie on your production domain.

**Once you've finished the steps above, Privy will review your request and update servers to begin setting cookies on your production app's domain.**

<Info>
  Once your domain is verified, the corresponding App ID can only be used on that **exact**
  production domain.
</Info>

<Info>
  If using Cloudflare as your DNS records provider, make sure that the registered DNS record is
  **not** set to **Proxied**, and is set to **DNS Only** until the domain verification is complete.
</Info>

### App clients and cookies

Each app can only have one **cookie domain**. If you share an app ID across web and mobile environments, you can use app clients to conditionally enforce cookies depending on the environment. For example, you can have an app client that enforces cookies for your web app, and an app client that does not enforce it for your mobile app.

To toggle cookie settings for different app clients, first set your **HttpOnly Cookies** and an app domain. Then, go to the **Configuration > App settings** page > **Clients** tab, and find the **App client** you’d like to enable cookies for. Select “edit”, set the cookies toggle to **Enabled**, and save.

If you enable cookies in an app client, but no base domain is set on your app, no cookies will be set.

<Tip>
  Within an app client, you can choose to enable or disable cookies. If you enable cookies for any
  client, they will be set on the domain that is configured as your app’s **domain**.
</Tip>

### Debugging DNS issues

#### CAA records block issuance

Some providers may require extra configuration in order to set up SSL for your base domain to work with Privy. If you are seeing the error "CAA records block issuance" in the Privy dashboard or you keep trying to set an `acme_challenge` and state resets, you might either:

1. Already have CAA record that does not include one of the CAs Privy uses to issue SSL certs
2. Need to explicitly set a CAA record

To resolve this, go to your provider and create a `CAA` record on your root domain (ie `example.com`, not including any subdomains). If there are already contents in the `CAA` record, append the following, otherwise create a new record containing the following:

```
# Let's Encrypt
0 issue "letsencrypt.org"
0 issuewild "letsencrypt.org"

# Google Trust Services
0 issue "pki.goog; cansignhttpexchanges=yes"
0 issuewild "pki.goog; cansignhttpexchanges=yes"
```

#### The hostname is associated with a held zone

If you use Cloudflare as a DNS provider and have "held" your zone for security reasons, you will need to temporarily [release the hold](https://developers.cloudflare.com/fundamentals/setup/account/account-security/zone-holds/#release-zone-holds).

## Using cookies in development

In **both production and development** (local, preview, staging) environments, Privy will set a cookie with the name `privy-token` to store your user's session. **Your app logic for handling the cookie (e.g. in your authorization middleware) does not need to handle different environments differently.**

The mechanics of *how the cookie is set* is the key difference between production and development environments. This is why you **must only use your production App ID within your production environment**.

Concretely:

* For your **production** app ID, once you have completed the steps above, Privy's **servers** will set a cookie, only on the domain you have verified and any subdomains. Cookies will not be set on localhost.
* For your **development** app ID(s), Privy's **client** will automatically set a cookie on *any* domain you use this App ID on, including localhost. This allows you to use the same app logic around cookies across various environments. As a security precaution, client-set cookies for development have a shorter lifetime (7 days, versus 30 days for server-set cookies).

We recommend maintaining two apps, one for development and one for production. However, if you need to develop with your production App ID in a `localhost` environment, you can do so by using [App Clients](/basics/get-started/dashboard/app-clients).

## Server-side rendering

With cookies, when an authenticated user visits a page of your app, the request to fetch the page from your server will automatically include the user's access token as a **`privy-token`** cookie.

If your app uses **server-side rendering (SSR)**, you can use the presence of this cookie (and other Privy cookies) to determine if the user is authenticated *before* your page is rendered on the client.

### When the `privy-token` is present

Concretely, if the request to your server includes a valid **`privy-token`**, you should consider the user as authenticated and should handle them accordingly.

### When the `privy-token` is absent

If the request to your server does *not* include a valid **`privy-token`**, the user might either:

* be unauthenticated, and will need to **`login`** to become unauthenticated.
* *appear* as unauthenticated, and will need to wait for the page to be rendered in their client before you can determine if they are authenticated.

The latter case generally occurs when an authenticated user steps away from your app for more than an hour, allowing the access token to expire, and returns to your app for the first time. In this case, the request to fetch the page from your server will **not** include a valid **`privy-token`**, as it has expired, but the **`privy-token`** will be refreshed imminently as soon as the page loads in the user's browser.

To handle this case, when the **`privy-token`** is missing in the request, you should **instead wait for your app to load in the client, to allow their user's authentication status to update correctly, before taking any actions based on their authentication status.** This most commonly occurs in middleware setups that perform server-side routing.

One solution for handling this flow is to set up your app and middleware like so:

#### Client-side setup

In your client, add a new page (e.g. **`/refresh`**) that implements the following:

1. Call Privy’s **`getAccessToken`** method when the page loads. This ensures that whenever the user visits this page, their session is refreshed if they are authenticated.
2. If **`getAccessToken`** returns a valid token, redirect the user to the path specified in a **`redirect_uri`** query parameter. Your middleware will populate this query parameter later.
3. If **`getAccessToken`** returns `null`, redirect the user to your login page as they are not authenticated.

#### Middleware setup

In your middleware, when your backend receives a request to fetch a given page:

1. If the request includes a **`privy-token`** that is valid, you can consider the user authenticated and apply your normal middleware.
2. If the request does not include a **`privy-token`** but does include a **`privy-session`** cookie, the user may be authenticated, and you’ll need to refresh their session from the client before applying your middleware.
3. To refresh the user’s session from the client, you can redirect the user to the **`/refresh`** page you set up above. As part of this, you should also pass the original route the user intended to visit as a query param (e.g. **`redirect_url`**) when you redirect them to **`/refresh`**. Per the client-side setup, this allows the user's session to be refreshed and for them to be correctly redirected based on their authentication status.

Make sure to exclude the following from the above redirect middleware:

1. The page at the `/refresh` path you setup: in this case, the user should be allowed to visit the `/refresh` page as their authentication status and redirect will be handled *on that page* in the client. Redirecting away from this page in your middleware may result in an infinite redirecting loop.
2. Any page that includes the query parameter `privy_oauth_code`, `privy_oauth_state`, or `privy_oauth_provider`: these parameters are a required component of Privy's [OAuth login flow](/authentication/user-authentication/login-methods/oauth) and applying a redirect will destructively erase them.

As an example, if you're using NextJS, you might setup your middleware like so:

```tsx  theme={"system"}
// Replace this array with an array of paths for pages in your app that do not require the
// user to be authenticated, e.g. a login page
const UNAUTHENTICATED_PAGES = [];

export const config = {
  // necessary to ensure that you are redirected to the refresh page
  matcher: '/'
};

export async function middleware(req: NextRequest) {
  const cookieAuthToken = req.cookies.get('privy-token');
  const cookieSession = req.cookies.get('privy-session');

  // Bypass middleware when `privy_oauth_code` is a query parameter, as
  // we are in the middle of an authentication flow
  if (req.nextUrl.searchParams.get('privy_oauth_code')) return NextResponse.next();

  // Bypass middleware when the /refresh page is fetched, otherwise
  // we will enter an infinite loop
  if (req.url.includes('/refresh')) return NextResponse.next();

  // If the user has `privy-token`, they are definitely authenticated
  const definitelyAuthenticated = Boolean(cookieAuthToken);
  // If user has `privy-session`, they also have `privy-refresh-token` and
  // may be authenticated once their session is refreshed in the client
  const maybeAuthenticated = Boolean(cookieSession);

  if (!definitelyAuthenticated && maybeAuthenticated) {
    // If user is not authenticated, but is maybe authenticated
    // redirect them to the `/refresh` page to trigger client-side refresh flow
    return NextResponse.redirect(new URL('/refresh', req.url));
  }

  return NextResponse.next();
}
```

<Info>
  By design, Privy does **not** permit apps to refresh a user's access token from the app's server
  via the user's refresh token. This is a standard security protection to limit the surface area of
  exposure of the refresh token.
</Info>

### Setting SameSite to Lax

Cookies set by Privy are by default set with the `SameSite` attribute set to `Strict`.
This ensures that cookies are only sent on requests originating from the same site that set the cookie.

However, you may wish to receive cookies on cross-site top-level navigations or [safe requests methods](https://developer.mozilla.org/en-US/docs/Glossary/Safe/HTTP) (e.g. `GET`, `HEAD`, `OPTIONS`).
In this case, you can toggle setting the `SameSite` attribute to `Lax` in the [**Privy Dashboard**](https://dashboard.privy.io/?page=settings\&setting=domains).

<Warning>
  Setting SameSite=Lax sends your cookies on cross-site top-level navigations. If your app has any
  unprotected state-changing endpoints an attacker could leverage this to lure your users into
  making changes to their accounts.
</Warning>

In the [**Privy Dashboard**](https://dashboard.privy.io/?page=settings\&setting=domains), find your **production app** in the App Dropdown of the left sidebar.
Then, navigate to the **Configuration > App settings** page > **Domains** tab for that app.
Check the box next to **Set SameSite to Lax** under **HttpOnly cookies**.
\n