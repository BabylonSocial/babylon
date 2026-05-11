> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Signing on the client

Privy's client-side SDKs offer abstractions that allow you to automatically sign requests to the Privy API when invoking SDK methods. With this level of abstraction, your application does not need to handle directly signing requests or including the signature in request headers.

For user-owned wallets, Privy's client-side SDKs (React, React Native, iOS, etc.) automatically sign requests to the Privy API when invoking SDK methods.

Under the hood, Privy's SDK will fetch an ephemeral user signing key, sign the request with it, and include the signature in the request headers when you invoke an SDK method.

**When using Privy's client-side SDKs, you do not need to implement any additional logic to sign requests to the Privy API.**
\n