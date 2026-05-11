> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Embedded wallets

**If you're running into issues with creating and using embedded wallets in your app, check out some common errors below, and how to resolve them.**

## Embedded wallets created on `localhost`, but not on deployment

If you are able to successfully create embedded wallets for your users on **`localhost`**, but not in a deployed environment, **double-check that the protocol for your deployment URL is `https://` (secure), and *not* `http://`**. Privy embedded wallets use the browser's native [WebCrypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API), which is only available in secure contexts like **`https://`**.

**In kind, you *must* use a secure context (`https://`) for your deployment.** Embedded wallets will *not* be created or work in insecure contexts like **`http://`**, except **`localhost`**, which is a special case and treated by the browser as a secure context.

## Access to the Base RPC URL has been blocked by CORS

If you're using embedded wallets on Base or Base Goerli, and see the following error:

```
Access to fetch at 'https://base-mainnet.blastapi.io/insert-api-key' from origin 'insert-your-origin' has been blocked by CORS policy...
```

**This likely indicates that your IP address has been rate limited by the Blast RPC URL for making too many requests within a short time window.**

Though this may appear to be a CORS violation, the initial error sent by Blast should indicate this rate limit (with a 429 status code). Successive errors due to the rate limit may not include the required CORS headers, which is why the overall error message appears as a CORS violation.

**If you are seeing this issue, please try again shortly.** If it still does not resolve, please [reach out](https://privy.io/slack) and we can help debug!
\n