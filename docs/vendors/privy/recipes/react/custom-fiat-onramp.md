> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# null

## Integrating a custom fiat on-ramp into your app

<Tip>
  Privy has out-of-the-box on-ramp support for [Moonpay and Coinbase](/wallets/funding/overview). If
  you're looking to integrate a custom fiat on-ramp provider, you can follow the instructions below.
</Tip>

**Privy provides integration points for fiat on-ramp providers alongside our SDK, so users can purchase crypto through those providers and deliver it to their wallets. Providers process payments and handle fiat-to-crypto conversion.**

If your app involves on-chain actions like sending transactions or calling smart contracts, users likely need a way to fund wallets with crypto to pay gas and make purchases. Fiat on-ramps allow users to purchase crypto via traditional payment methods, such as credit/debit cards and ACH transfers.

In this guide, you'll find instructions for:

* how to choose the right fiat on-ramp provider for your app
* how to integrate a fiat on-ramp provider
* a complete demo implementation of a fiat on-ramp integrated alongside Privy

## Choosing a fiat on-ramp provider

**To start, you'll need to choose a fiat on-ramp provider that meets your app's requirements.** Different on-ramp providers vary in their support of:

* different tokens (ETH, USDC, Dai, POL, etc.)
* different networks (Ethereum, Polygon, Optimism, etc.)
* different regions (US, Europe, Brazil, South Korea, India, etc.).
* different payment methods (credit cards, debit cards, ACH, instant ACH, etc. )

You should choose a fiat on-ramp provider based on your needs across the categories listed above. You can check each provider's documentation to determine if it can support the requirements of your app and your user base. Some providers we recommend working with include [Sardine](https://docs.payments.sardine.ai/products/onramp), [Stripe](https://docs.stripe.com/crypto/onramp/embedded-quickstart), [Ramp Network](https://rampnetwork.com/), and [Onramper](https://www.onramper.com/).

Once you have chosen an on-ramp provider for your app, **set up an account with that provider and retrieve your sandbox API keys to build an integration**.

Most providers will provision you with a **public API key** that can be exposed to your frontend, and a **secret API key** that should only exist on your server. Some providers may also offer a **webhook API key** so you can subscribe to updates on your users' transactions.

## Integrating the provider

For the remainder of this guide, we will assume **Moonpay** is our chosen fiat on-ramp provider (though you should choose the provider that is best for your app). Note that Moonpay is supported out-of-the-box, but these integration steps can be suitable for your chosen custom fiat on-ramp provider.

The overall integration shape is roughly the same across different providers, and generally looks like:

1. In your **frontend**, collect details about your user (wallet address, email, etc.) and the assets they want to purchase (which tokens, what network, amount, etc.). Make a request to your **backend** with these details.
2. In your **backend**, once you receive the request from step (1), construct a fiat on-ramp URL for your user. Each provider will give you a base URL for a generic on-ramp flow, and you can tailor the flow to be specific to your user by setting the details from step (1) as query parameters. Send this URL back to your **frontend**.
3. In you **frontend**, once you receive the URL from step (2), you can either redirect your user to that URL or embed it in an `iframe` within your site. Within the new page/`iframe`, your user will complete their purchase flow and any required identity verification steps.

Below is a guide of how to implement steps (1)-(3) with Moonpay as a concrete example. For the sake of this demo, assume that, in this app, users are able to login with their email address and are prompted to create a Privy embedded wallet upon logging in (which they will need to fund).

### 1. Collect information about the user's on-ramp flow in your frontend

To start, we'll add a `fundWallet` method to our frontend that collects information about our user and our desired on-ramp flow, and sends it to our backend.

In this example app, users login with their email address and create a Privy embedded wallet upon logging in. Thus, we can get the user's email and wallet address from their [`user`](/user-management/users/the-user-object) object and include it in this request. This ensures the user doesn't have to enter this manually when completing the on-ramp flow later.

```tsx Getting the email and wallet address of the user theme={"system"}
const walletAddress = user?.wallet?.address;
const emailAddress = user?.email?.address;
```

In this example app, we also want to *redirect* the user to the on-ramp URL instead of embedding it in an `iframe`. Thus, we can get the URL of the current page (`window.location.href`) and include it in this request. This allows the on-ramp provider to redirect the user back to this page once they have completed their purchase.

```tsx Getting the URL of the current page theme={"system"}
const currentUrl = window.location.href;
```

Depending on your app, you can configure more information about the on-ramp flow as well. For instance:

* If users of your app only ever need to pay gas on Ethereum mainnet, you can pre-populate the asset to be purchased to always be 'eth' and the network to always be 'ethereum'.
* If your app is cross-chain and needs users to have different assets on different chains, you can instead surface UI elements to allow the user to select which asset and network they'd like to fund their wallet with.

<Tip>
  When completing the on-ramp flow, your user will have to manually enter/select any information
  that you do not pre-fill here (e.g. wallet address, which asset to purchase, etc.).
</Tip>

We'll now implement the `fundWallet` method to send this data to our backend, [authorizing the request](/authentication/user-authentication/access-tokens) with the user's Privy auth token.

```tsx Requesting the on-ramp URL from the server theme={"system"}
const {user, getAccessToken} = usePrivy();

...

const fundWallet = async () => {
    const walletAddress = user?.wallet?.address; // Get user's wallet address
    if (!walletAddress) return; // If user does not have a wallet, no-op
    const emailAddress = user?.email?.address; // Get user's email address
    const currentUrl = window.location.href; // Get URL of current page
    const authToken = await getAccessToken(); // Get Privy auth token

    // Send request to server with these details
    // Feel free to swap out `axios` for `fetch` or your preferred HTTP library
    try {
      const onrampResponse = await axios.post(
        // Replace this with the API route you implement in step (2)
        "/api/onramp",
        // Add any additional on-ramp configurations you'd like, such as network, asset, amount, etc.
        {
          address: user!.wallet!.address,
          email: user?.email?.address,
          redirectUrl: currentUrl,
        },
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );
      return onrampResponse.data.url as string;
    } catch (error) {
      console.error(error);
      return undefined;
    }
  };
```

In this example, `fundWallet` parses the response returned by the server (we'll implement this below) and returns the fiat on-ramp URL as a string.

### 2. Construct the on-ramp URL in your backend

Now, we'll implement the logic in our backend to construct the fiat on-ramp URL based on the configuration we collected in step (1). In particular, we'll implement a `POST /api/onramp` handler that receives the request from step (1) and responds with the on-ramp URL.

In our handler, we'll start by parsing the request body for the user's wallet `address`, `email`, and `redirectUrl`. If you included additional information in your request (e.g. asset type, amount), you should parse the request body for those values as well.

```tsx Parsing the request body theme={"system"}
const {address, email, redirectUrl} = req.body;
```

Next, we'll construct the fiat on-ramp URL where our user can complete their purchase. We'll start with the base URL given to use by our fiat on-ramp provider (Moonpay):

```tsx Initializing the on-ramp with our base URL theme={"system"}
const onrampUrl = https://buy-sandbox.moonpay.com?apiKey=YOUR_MOONPAY_PUBLIC_KEY;
```

This generally is a URL at the provider's domain with your account's public key appended as a query parameter.

We can then pre-populate details about the user's on-ramp flow as URL query parameters, based on what we parsed from the request.

```tsx Configuring our on-ramp via URL query parameters theme={"system"}
onrampUrl.searchParams.set('walletAddress', address);
onrampUrl.searchParams.set('redirectURL', redirectUrl);
onrampUrl.searchParams.set('email', email);
onrampUrl.searchParams.set('currencyCode', 'eth');
```

For Moonpay, you can find the exact query parameters that can be pre-populated [here](https://docs.moonpay.com/moonpay/implementation-guide/on-ramp/browser-integration/customize-the-widget).

Lastly, after we've configured the on-ramp URL for our user, we'll authorize the URL using the secret key given to us by our fiat on-ramp provider. For Moonpay, we'll authorize the URL by signing it with the secret key, and appending the signature as a query parameter to the URL:

```tsx Authorizing the on-ramp URL with a signature theme={"system"}
import crypto from "crypto";
...
// Produce signature on URL
const urlSignature = crypto
    .createHmac("sha256", YOUR_MOONPAY_SECRET_KEY)
    .update(onrampUrl.search)
    .digest("base64");

// Set signature as URL query parameter
onrampUrl.searchParams.set("signature", urlSignature);
```

Other providers may have other ways of authorizing the URL, such as requesting a client token from their API and appending that token as a query parameter in place of a signature. You should check each provider's documentation to determine the correct mechanism for authorization.

We can finally send the completely configured, authorized on-ramp URL back to our front-end!

```tsx Returning the on-ramp URL to the client theme={"system"}
return res.status(200).json({url: onrampUrl.toString()});
```

### 3. Redirect your user to the on-ramp URL in your frontend

With steps (1) and (2) completed, our `fundWallet` method in our front-end should now return a configured, authorized on-ramp URL where our user can complete their purchase.

```tsx Getting the on-ramp URL theme={"system"}
const onrampUrl = await fundWallet();
```

In this example, we will *redirect* our user to this URL, so that they can complete their purchase in a new tab:

```tsx Redirecting our user to complete the on-ramp flow theme={"system"}
window.open(onrampUrl, '_blank');
```

Once the user completes their purchase, they will be redirected back to the `redirectUrl` we configured in steps (1) and (2). On this redirect, Moonpay will also append a `transactionId` that we can optionally use to monitor the status of the user's transaction.

<Tip>
  If you redirect your user to the fiat on-ramp URL, as we have done here, we suggest that you show
  them some introductory context about the fiat on-ramp (e.g. in a modal) provider and why they need
  to purchase crypto for your app.
</Tip>

Alternatively, if you do not want to redirect the user to a new tab, you can instead surface the on-ramp URL within an `iframe` embedded within your site:

```tsx Embedding the on-ramp URL in an iframe theme={"system"}
<iframe
    // These are necessary for proper identity verification
    allow="accelerometer; autoplay; camera; gyroscope; payment"
    frameborder="0"
    height="100%"
    width="100%"
    src={onrampUrl}
>
```

\*\*That's it! Your users can now fund the wallets they've connected/created through Privy and take on-chain actions in your app. 💪 \*\*

## NFT Checkout

If your app needs users to fund their wallets specifically so they can **purchase NFTs**, you should consider integrating an **NFT Checkout** flow in addition to, or instead of, a generic fiat on-ramp flow. NFT checkout flows generally offer a smoother user experience, due to less rigid identity verification requirements, higher payment success rates, and clearer context about what the user gets by purchasing crypto.

Many fiat on-ramp providers, including Moonpay and Sardine, offer NFT checkout integrations as well. The shape of this integration is much like that of the generic fiat on-ramp (outlined in this guide), but you will have to configure additional information about your NFT sale (contract address, token type, payments) in each provider's dashboard.

See each provider's documentation for more details, or [reach out](https://privy.io/slack) with any questions.

## Demo integration

Check out our **[fiat on-ramp demo app](https://fiat-onramp-demo.privy.io/)** to see an end-to-end integration of a fiat on-ramp alongside Privy. Take a look at the **[source code](https://github.com/privy-io/examples/tree/main/examples/privy-next-fiat-onramp)** to see how the code snippets from this guide fit into a real app.

This demo app uses a sandbox instance of Moonpay, and you should use certain test values when completing the purchase flow as a user:

* When entering in payment details, **do not use a real payment method**. Use the test credit card listed [here](https://dev.moonpay.com/docs/faq-sandbox-testing#add-a-payment-method).
* When completing identity verification, you will not be prompted to actually submit identity documents (as you would in production). Instead, you will be able to choose whether you'd like to simulate a successful or failed identity verification.
\n