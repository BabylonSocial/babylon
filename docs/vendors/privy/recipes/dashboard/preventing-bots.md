> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Bot traffic mitigation

The strongest bot mitigation setup combines several controls. You can start in the Privy dashboard and then add sitewide protections.

## 1. Enable invisible CAPTCHA

Privy supports invisible CAPTCHA with [Cloudflare Turnstile](https://www.cloudflare.com/products/turnstile/) and [hCaptcha](https://www.hcaptcha.com/). Enable CAPTCHA in [App settings > Advanced](https://dashboard.privy.io/apps?page=settings\&setting=advanced).

When using hCaptcha, configure the risk tolerance setting to define how strictly the system blocks suspicious attempts.

<Info>
  When using a strict CSP, include CAPTCHA domains in policy directives. See the [CSP
  guide](/security/implementation-guide/content-security-policy#optional-features).
</Info>

## 2. Block low-quality email signups

On the [Authentication](https://dashboard.privy.io/apps?page=login-methods) page, enable email restrictions that reduce throwaway account creation:

* Block temporary email domains
* Disable `+` aliases in email addresses

Privy uses [`mailchecker`](https://github.com/FGRibreau/mailchecker/) to identify temporary email domains.

<Info>
  Blocking `+` aliases increases friction for abuse, but may also impact legitimate alias usage.
  Choose this setting based on your app's risk profile.
</Info>

## 3. Block VOIP numbers for phone login

On the [Authentication](https://dashboard.privy.io/apps?page=login-methods) page, enable VOIP blocking for phone login.

When SMS or WhatsApp login is in enabled, block VOIP numbers to reduce disposable phone signups and OTP abuse.

## 4. Use the denylist for repeat offenders

Use the [denylist](/user-management/users/managing-users/denylist) to block known bad users from logging in or creating new accounts.

Supported denylist entries include:

* Email addresses
* Email domains
* Phone numbers
* EVM wallet addresses
* Solana wallet addresses

## 5. Add sitewide Cloudflare protections

Privy controls are strongest when paired with edge protection in front of your app.

A practical Cloudflare setup usually includes:

* Bot management or Super Bot Fight Mode
* Managed Challenge on high-risk pages like sign up and login
* Blocking or challenging high-risk traffic segments for your app's threat model

## 6. Add supporting controls

For stronger defense in depth, also configure:

* [Allowed domains](/recipes/dashboard/allowed-domains) to prevent unauthorized client usage of your app ID
* [Allowed OAuth redirects](/recipes/react/allowed-oauth-redirects) to reduce OAuth abuse risk
* [MFA](/authentication/user-authentication/mfa/overview) for sensitive or high-value actions
* Minimum required login methods only, to reduce attack surface

Anti-bot strategy should evolve with traffic patterns. Review signup quality, OTP volume, and conversion rates on a regular cadence.

## FAQ

<AccordionGroup>
  <Accordion title="Help! My legitimate users are failing CAPTCHA">
    CAPTCHA providers do not share specific details about how they classify attempts as bot-like
    traffic. As a workaround, users can try:

    <ul>
      <li>Disabling VPN, proxy, or traffic filtering tools</li>
      <li>Trying an incognito/private window to identify browser extension interference</li>
      <li>Trying a different browser or device</li>
      <li>Switching networks (for example, from public Wi-Fi to mobile data)</li>
      <li>Retrying after a short wait</li>
    </ul>
  </Accordion>

  <Accordion title="How do I delete bots?">
    Privy does not recommend deleting users unless absolutely necessary. Blocking future access with
    the [denylist](/user-management/users/managing-users/denylist) is usually a better first step.
    When you need to delete users, follow [Deleting
    users](/user-management/users/managing-users/deleting-users).
  </Accordion>

  <Accordion title="What if I manage my own Twilio account and my app is experiencing SMS fraud?">
    Enable Twilio [Fraud Guard](https://www.twilio.com/docs/verify/preventing-toll-fraud), and
    review Twilio [Verify
    geo-permissions](https://www.twilio.com/docs/verify/preventing-toll-fraud/verify-geo-permissions)
    to limit risky destination regions.
  </Accordion>
</AccordionGroup>
\n