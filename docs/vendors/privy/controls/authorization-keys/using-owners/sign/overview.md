> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Signing requests

When updating resources like wallets, policies, or key quorums in the Privy API, requests must be signed by the resource owner in order to be authorized.

When signing messages or sending transactions with a wallet, requests must be signed by the wallet owner or an additional signer whose policies allow for the signature or transaction.

Learn more about the [abstractions](/controls/authorization-keys/using-owners/sign/overview#abstractions) that Privy offers to for request signing and the underlying [steps](/controls/authorization-keys/using-owners/sign/overview#steps) involved.

## Abstractions

Privy offers several level of abstractions through SDKs to simplify the implementation of request signing.

In order of highest-level to lowest-level, these abstractions are **automatic signing**, **utility functions**, and **direct implementation**.

<Tip>
  Wherever possible, we strongly recommend using a Privy SDKs' **automatic signing** functionality
  or **utility functions** to sign requests. Implementing request signing directly is an advanced
  integration.
</Tip>

### Automatic signing

With automatic signing, Privy SDKs automatically handles producing signatures when making requests to the Privy API. This means your application does not directly need to handle any signing logic.

<Note>
  Learn how to [use automatic
  signing](/controls/authorization-keys/using-owners/sign/signing-on-the-server) in your
  application.
</Note>

### Utility functions

If your application is unable to use automatic signing as part of Privy's SDKs, Privy's SDKs also offer utility functions for signature payload preparation and in-line signing.

Using utility functions over automatic signing may be preferred if your authorization keys are secured in a separate service (e.g. KMS) and signing can only be executed within that service.

<Note>
  Learn how to [use these utility
  functions](/controls/authorization-keys/using-owners/sign/utility-functions) in your application.
</Note>

Privy SDKs typically offer two utilities:

* **Formatting requests for authorization signatures.** This accepts a request you intend to make to the Privy API and constructs the required payload for signing.
* **Generating authorization signatures.** Given a formatted signature payload, this method accepts the private key for an authorization key or an authorization context generally and produces the corresponding signature over the payload.

You can combine these utility functions with your own direct implementation of signing or a call out to an external signing service (e.g. AWS KMS) to generate your authorization signature. As an example, you might:

1. Construct your request payload
2. Use the Privy SDK's formatting requests function to generate your signature payload
3. Make a call out to your external signing service to sign the payload from step (2)
4. Include the signature in a `privy-authorization-signature` header for the request.

### Direct implementation

<Note>
  Learn how to implement [direct
  signing](/controls/authorization-keys/using-owners/sign/direct-implementation) in your
  application.
</Note>

If your application cannot integrate one of Privy's SDKs, you can also directly implement request signing in your stack. This is an advanced integration; wherever possible, we recommend using Privy SDKs for request signing.

## Signature payload

When signing a request to the Privy API, the payload to sign must be a JSON object containing the following fields:

| Field                              | Type                                                                                                                                                                                                                                                  | Description                                                                                                                                                                                                       |   |   |   |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | - | - | - |
| `version`                          | `1`                                                                                                                                                                                                                                                   | Authorization signature version. Currently, `1` is the only version.                                                                                                                                              |   |   |   |
| `method`                           | `'POST'  \| 'PUT'                                                                                                                                                                                                             \| 'PATCH' \| 'DELETE'` | HTTP method for the request. Signatures are not required on `'GET'` requests.                                                                                                                                     |   |   |   |
| `url`                              | `string`                                                                                                                                                                                                                                              | The full URL for the request. Should not include a trailing slash.                                                                                                                                                |   |   |   |
| `body`                             | `JSON`                                                                                                                                                                                                                                                | JSON body for the request.                                                                                                                                                                                        |   |   |   |
| `headers`                          | `JSON`                                                                                                                                                                                                                                                | JSON object containing any Privy-specific headers, e.g. those that are prefixed with `'privy-'`. This should **not** include any other headers, such as authentication headers, `content-type`, or trace headers. |   |   |   |
| `headers['privy-app-id']`          | `string`                                                                                                                                                                                                                                              | Privy app ID header (required).                                                                                                                                                                                   |   |   |   |
| `headers['privy-idempotency-key']` | `string`                                                                                                                                                                                                                                              | Privy idempotency key header (optional). If the request does not contain an idempotency key, leave this field out of the payload.                                                                                 |   |   |   |
\n