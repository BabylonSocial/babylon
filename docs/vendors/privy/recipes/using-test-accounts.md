> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# null

Test accounts can be used to build automated tests, for local development, or to reduce friction during Apple's [App Store review](https://developer.apple.com/app-store/review/) process for mobile apps. A new set of credentials are created each time you enable the test account, and the old one is revoked to keep your account secure.

<Info>
  To use these test accounts, your app must support email or SMS login. Testing other login flows
  can either be automated with a library like [Playwright](https://playwright.dev/), or by
  completing the flow manually, as it requires authorization with other APIs *(such as social
  providers)*.
</Info>

## Enabling test accounts

To enable a test account for your app and get its login credentials:

1. Go to the **User management > Authentication > Advanced** tab of the Privy Dashboard
2. Turn on the **Enable test accounts** toggle

Once enabled, you will see the login credentials for your test account that you can use for your app ID.

All test credentials follow the same format, where `XXXX`/`XXXXXX` in the credentials below should be substituted with the values you see in the **User management > Authentication > Advanced** page of the Dashboard. You **cannot** substitute arbitrary values for `XXXX`/`XXXXXX` or use [plus addressing](https://learn.microsoft.com/en-us/exchange/recipients-in-exchange-online/plus-addressing-in-exchange-online); you **must** use the credentials from the Dashboard exactly.

| email                | phone             | OTP *(for either)* |
| -------------------- | ----------------- | ------------------ |
| `test-XXXX@privy.io` | `+1 555 555 XXXX` | `XXXXXX`           |

Once enabled, a test user can log into your app with the provided email or phone number and the provided OTP code to review and test your app.

<Info>
  Depending on when you created your Privy app, you may have a legacy test account enabled with the
  login credentials `test@privy.io` or `+1 555 555 5555`. Please see the **User management >
  Authentication > Advanced** page of the Privy Dashboard to determine if this is the case for your
  app.
</Info>

<Tip>
  Test accounts have a lighter authentication rate limit for apps in development. While all accounts
  in production apps and non-test accounts in development apps are limited to 5 requests every 5
  minutes for email and 5 requests every 10 minutes for SMS, test accounts in development apps are
  limited to 10 requests every 10 seconds for either.
</Tip>

## Getting a test access token programmatically

You can programmatically get an access token for your app's test account using the `getTestAccessToken` method:

```typescript {skip-check} theme={"system"}
getTestAccessToken(): Promise<{accessToken: string}>
```

This method returns a `Promise` that resolves to an object containing the `accessToken` string for the test account.

<Warning>
  `getTestAccessToken` will throw an error if:

  * You have not enabled test credentials in the Privy Dashboard
  * Allowed origins or base domain are enabled for your app
</Warning>
\n