> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Guidance for Content Security Policies (CSPs)

<Info>New to CSPs? [Skip to CSP Basics](#csp-basics) for an introduction.</Info>

If you are using Privy in a web client environment, we recommend setting a strict [Content Security Policy (CSP)](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP) as a defense-in-depth strategy to mitigate XSS, clickjacking, and cross-site leak vulnerabilities.

## Quick start

<Tip>
  Remember to add your own domain to the relevant directives (e.g., add your domain to
  `connect-src`, `script-src`, etc.)
</Tip>

### Base CSP configuration

<Tabs>
  <Tab title="Raw CSP">
    ```
    Content-Security-Policy:
      default-src 'self';
      script-src 'self' https://challenges.cloudflare.com;
      style-src 'self' 'unsafe-inline';
      img-src 'self' data: blob:;
      font-src 'self';
      object-src 'none';
      base-uri 'self';
      form-action 'self';
      frame-ancestors 'none';
      child-src https://auth.privy.io https://verify.walletconnect.com https://verify.walletconnect.org;
      frame-src https://auth.privy.io https://verify.walletconnect.com https://verify.walletconnect.org https://challenges.cloudflare.com;
      connect-src 'self' https://auth.privy.io wss://relay.walletconnect.com wss://relay.walletconnect.org wss://www.walletlink.org https://*.rpc.privy.systems https://explorer-api.walletconnect.com;
      worker-src 'self';
      manifest-src 'self'
    ```
  </Tab>

  <Tab title="Next.js">
    ```js  theme={"system"}
    const nextConfig = {
      async headers() {
        return [
          {
            source: "/:path*",
            headers: [
              {
                key: "Content-Security-Policy",
                value: `
                  default-src 'self';
                  script-src 'self' https://challenges.cloudflare.com;
                  style-src 'self' 'unsafe-inline';
                  img-src 'self' data: blob:;
                  font-src 'self';
                  object-src 'none';
                  base-uri 'self';
                  form-action 'self';
                  frame-ancestors 'none';
                  child-src https://auth.privy.io https://verify.walletconnect.com https://verify.walletconnect.org;
                  frame-src https://auth.privy.io https://verify.walletconnect.com https://verify.walletconnect.org https://challenges.cloudflare.com;
                  connect-src 'self' https://auth.privy.io wss://relay.walletconnect.com wss://relay.walletconnect.org wss://www.walletlink.org https://*.rpc.privy.systems https://explorer-api.walletconnect.com;
                  worker-src 'self';
                  manifest-src 'self'
                `,
              },
            ],
          },
        ];
      },
    };
    ```
  </Tab>

  <Tab title="Express">
    ```js  theme={"system"}
    const helmet = require("helmet");

    app.use(
      helmet.contentSecurityPolicy({
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "https://challenges.cloudflare.com"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "blob:"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
          frameAncestors: ["'none'"],
          childSrc: [
            "https://auth.privy.io",
            "https://verify.walletconnect.com",
            "https://verify.walletconnect.org",
          ],
          frameSrc: [
            "https://auth.privy.io",
            "https://verify.walletconnect.com",
            "https://verify.walletconnect.org",
            "https://challenges.cloudflare.com",
          ],
          connectSrc: [
            "'self'",
            "https://auth.privy.io",
            "wss://relay.walletconnect.com",
            "wss://relay.walletconnect.org",
            "wss://www.walletlink.org",
            "https://*.rpc.privy.systems",
            "https://explorer-api.walletconnect.com",
          ],
          workerSrc: ["'self'"],
          manifestSrc: ["'self'"],
        },
      })
    );
    ```
  </Tab>

  <Tab title="Ruby on Rails">
    ```ruby  theme={"system"}
    Rails.application.config.content_security_policy do |policy|
      policy.default_src :self
      policy.script_src :self, "https://challenges.cloudflare.com"
      policy.style_src :self, :unsafe_inline
      policy.img_src :self, :data, :blob
      policy.font_src :self
      policy.object_src :none
      policy.base_uri :self
      policy.form_action :self
      policy.frame_ancestors :none
      policy.child_src "https://auth.privy.io",
                      "https://verify.walletconnect.com",
                      "https://verify.walletconnect.org"
      policy.frame_src "https://auth.privy.io",
                      "https://verify.walletconnect.com",
                      "https://verify.walletconnect.org",
                      "https://challenges.cloudflare.com"
      policy.connect_src :self,
                        "https://auth.privy.io",
                        "wss://relay.walletconnect.com",
                        "wss://relay.walletconnect.org",
                        "wss://www.walletlink.org",
                        "https://*.rpc.privy.systems",
                        "https://explorer-api.walletconnect.com"
      policy.worker_src :self
      policy.manifest_src :self
    end
    ```
  </Tab>
</Tabs>

## CSP recommendations

### CSP directives for @privy-io/react-auth

As part of enforcing a CSP, you will need to allow certain trusted resources that your site needs to load as part of normal operation:

<Info>
  If you have a base domain enabled, you must **also** add your domain-specific Privy instance, e.g.
  `https://privy.your-base-domain.com`.
</Info>

#### Required domains

* `child-src`
  * [https://auth.privy.io](https://auth.privy.io) (Privy iframe)
  * [https://verify.walletconnect.com](https://verify.walletconnect.com) (WalletConnect iframe)
  * [https://verify.walletconnect.org](https://verify.walletconnect.org) (WalletConnect fallback iframe)
* `frame-src`
  * [https://auth.privy.io](https://auth.privy.io) (Privy iframe)
  * [https://verify.walletconnect.com](https://verify.walletconnect.com) (WalletConnect iframe)
  * [https://verify.walletconnect.org](https://verify.walletconnect.org) (WalletConnect fallback iframe)
* `connect-src`
  * [https://auth.privy.io](https://auth.privy.io) (Privy API)
  * wss\://relay.walletconnect.com (WalletConnect API)
  * wss\://relay.walletconnect.org (WalletConnect fallback API)
  * wss\://[www.walletlink.org](http://www.walletlink.org) (Coinbase Wallet API)
  * https\://\*.rpc.privy.systems (Privy RPC provider)
  * [https://explorer-api.walletconnect.com](https://explorer-api.walletconnect.com) (WalletConnect Explorer API)

#### Optional features

If your app uses Telegram login or linking, add:

* `frame-src`: [https://oauth.telegram.org](https://oauth.telegram.org) (Telegram OAuth domain)
* `script-src`: [https://telegram.org](https://telegram.org) (Telegram login domain)

If your app uses Privy's [funding kit](/wallets/funding/overview), add:

* `connect-src`:
  * [https://api.relay.link](https://api.relay.link) (Relay Bridging Provider)
  * [https://api.testnets.relay.link](https://api.testnets.relay.link) (Relay Bridging Provider for testnets)

If your app is on Solana, please add the [Solana cluster endpoints](https://solana.com/docs/core/clusters#on-a-high-level) if an override is not provided:

* `connect-src`:
  * [https://api.mainnet-beta.solana.com](https://api.mainnet-beta.solana.com)
  * [https://api.devnet.solana.com](https://api.devnet.solana.com)
  * [https://api.testnet.solana.com](https://api.testnet.solana.com)

If your app uses CAPTCHA, please add (based on provider):

* `frame-src`
  * [https://challenges.cloudflare.com](https://challenges.cloudflare.com) (Cloudflare Turnstile)
  * [https://hcaptcha.com](https://hcaptcha.com) (hCaptcha)
  * https\://\*.hcaptcha.com (hCaptcha)
* `connect-src`
  * [https://hcaptcha.com](https://hcaptcha.com) (hCaptcha)
  * https\://\*.hcaptcha.com (hCaptcha)
* `script-src`
  * [https://challenges.cloudflare.com](https://challenges.cloudflare.com) (Cloudflare Turnstile)
  * [https://hcaptcha.com](https://hcaptcha.com) (hCaptcha)
  * https\://\*.hcaptcha.com (hCaptcha)
* `style-src`
  * [https://hcaptcha.com](https://hcaptcha.com) (hCaptcha)
  * https\://\*.hcaptcha.com (hCaptcha)

## Best practices

1. **Start strict**: Begin with restrictive policies, and loosen only as needed. Document all exceptions.
2. **Test regularly**: Test your CSP after dependency updates and validate during deployments. Check compatibility across different browsers.
3. **Monitor**: Track violation reports and monitor performance impact. Watch for bypass attempts.
4. **Document changes and procedures**: Record all CSP changes and document allowed sources. Document testing procedures for your app.

## Testing and deployment

<Tip>
  We highly recommend testing your CSP thoroughly before deploying and enforcing in production.
</Tip>

### Test your CSP in a staging environment

Run through your standard user flows in a **staging** environment with CSP enforcement. This may mean connecting to browser extension wallets / mobile app wallets, transacting, logging out, etc.

It is possible that directives need to be updated after Privy SDK upgrades. **Whenever upgrading the Privy SDK, always test your CSP again before deploying the update to production.**

Other software you use, such as [MetaMask](https://docs.metamask.io/wallet/how-to/get-started-building/secure-dapp/), may document their own guidance on CSP usage.

### Using Report-Only mode

Most browsers support a [`Content-Security-Policy-Report-Only`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy-Report-Only) header, which sends violation reports without actually enforcing policies. This allows the developer to judge whether a modification to their CSP will impact their site's expected functionality.

If your policy is strict, you will see many reported violations due to extensions trying to inject scripts into the browser. This is completely normal. It's best to filter these out to avoid the noise.

### Deployment

We recommend that you first deploy your CSP in ` report-only` mode with the header `Content-Security-Policy-Report-Only`. Once it has been validated in production, you can migrate to `Content-Security-Policy`, which will enforce directive violations.

Going forward, you can deploy with both `Content-Security-Policy-Report-Only` and `Content-Security-Policy` headers set simultaneously. This will allow you to test on the report only header and A/B test against your existing policy.

### Monitoring

We recommend that you configure the `report-uri` to see violation/enforcement reports and set up a monitoring dashboard so you can review reports.

## CSP basics

A Content Security Policy (CSP) is a set of rules that tell the browser **what sources of content are valid.** CSPs help prevent the browser from executing malicious scripts. They can be used to increase the security of any website.

To enable a CSP, you need to configure your web server or backend application to return the `Content-Security-Policy` HTTP header. In that header, you specify a policy. A policy is described using a set of policy directives, each of which tells the browser what to do with respect to a given resource type.

### Example: `img-src` directive

For example, the `img-src` directive tells the browser sources of images are valid.
If you set this CSP header:

```
Content-Security-Policy: img-src https://my-website.com/
```

Then any `<img>` from other sites will be blocked:

```
<img src="https://bad-website.com/image.jpg"/>   {/* Error! This won't load! */}
```

### Important directives

Policy directives tell the browser what to do for a given resource type.

* Keep `script-src` as locked down as possible to prevent malicious code execution
* Set `frame-ancestors` to `none` unless you expect your website to be embedded
* Keep `connect-src` as locked down as possible to prevent unauthorized data exfiltration
* Use `child-src` and `frame-src` to control iframe loading and execution
* Consider `worker-src` if using web workers
* Implement `default-src` as a fallback for unlisted directives

### Read the following guides to learn more:

* [https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
* [https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy)
* [https://cheatsheetseries.owasp.org/cheatsheets/Content\_Security\_Policy\_Cheat\_Sheet.html](https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html)
\n