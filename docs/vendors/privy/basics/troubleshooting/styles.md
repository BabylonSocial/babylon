> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Styles

If you're running into issues with the styles of Privy's UIs in your app, check out some common errors below, and how to resolve them.

### Corrupted styles with Sentry

If your application uses [**Sentry**](https://sentry.io/welcome/) for monitoring, and you are seeing corrupted styles in Privy's UIs, it may be due to a bug with certain versions of Sentry's JavaScript libraries (e.g. [**`@sentry/react`**](https://www.npmjs.com/package/@sentry/react) and [**`@sentry/nextjs`**](https://www.npmjs.com/package/@sentry/nextjs)). **See this [GitHub issue](https://github.com/getsentry/sentry-javascript/issues/9170#issuecomment-1761391585) for more information.**

To resolve this issue, try upgrading your **`@sentry/*`** package to a **version higher than `7.74.0`**.
\n