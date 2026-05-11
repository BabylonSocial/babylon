> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Webhooks overview

> Set up webhooks to receive real-time notifications when users take actions in your application

Webhooks allow you to specify a backend endpoint that Privy will call with a
signed payload whenever a user makes an action in your application, such as
logging in, or linking a new account.
As soon as you register an endpoint, Privy will start sending subscribed events
in near real-time.

<Info>
  Webhooks can be tested at no cost in development environments. To enable webhooks in production,
  upgrade to the Enterprise plan in the Privy Dashboard.
</Info>

<img src="https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/Webhooks.png?fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=991c4fac21a2532704a32d492dfaeb50" alt="images/Webhooks.png" data-og-width="1843" width="1843" data-og-height="1317" height="1317" data-path="images/Webhooks.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/Webhooks.png?w=280&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=b211378d887cbb2629f0881b3cf36ba2 280w, https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/Webhooks.png?w=560&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=1233d21cb5732d45b49ec736f2391640 560w, https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/Webhooks.png?w=840&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=7e8544c1d8d268f2b0091bbda8c74924 840w, https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/Webhooks.png?w=1100&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=bfcc33d9d5c2f53b11e9a9c235cd12bb 1100w, https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/Webhooks.png?w=1650&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=ef68597557e926207350de261ac69945 1650w, https://mintcdn.com/privy-c2af3412/YvGXGsI-T4KAqoan/images/Webhooks.png?w=2500&fit=max&auto=format&n=YvGXGsI-T4KAqoan&q=85&s=b5706c5af1c6c8071a26714e40ef4bae 2500w" />

## Registering an endpoint

1. In your backend, create a new endpoint that will accept **POST** requests from Privy

   <Tip>
     When creating your endpoint to receive webhook events, always verify the payload signature by
     following our [webhook signing key
     documentation](/api-reference/webhooks/overview#webhook-signing-key).
   </Tip>

2. In the dashboard, go to the **Configuration > Webhooks** page

3. Add your new endpoint as the destination URL and select any event types you'd like to be notified for. The URL must begin with `https://`.

You can specify which user events your webhook endpoint will be notified about. The options are as follows:

| Event Name               | Type                      | Action                                                                           |
| ------------------------ | ------------------------- | -------------------------------------------------------------------------------- |
| User created             | user.created              | A user was created in the application.                                           |
| User authenticated       | user.authenticated        | A user successfully logged into the application.                                 |
| User linked account      | user.linked\_account      | A user successfully linked a new login method.                                   |
| User unlinked account    | user.unlinked\_account    | A user successfully unlinked an existing login method.                           |
| User updated account     | user.updated\_account     | A user successfully updates the email or phone number linked to their account.   |
| User transferred account | user.transferred\_account | A user successfully transferred their account to a new account.                  |
| Wallet created for user  | user.wallet\_created      | A wallet (embedded or smart wallet) was successfully created for a user.         |
| MFA enabled              | mfa.enabled               | A user has enabled MFA for their account.                                        |
| MFA disabled             | mfa.disabled              | A user has disabled MFA for their account.                                       |
| Private key exported     | private\_key.exported     | A user has exported their private key from an embedded wallet.                   |
| Wallet recovery setup    | wallet.recovery\_setup    | A user has set up wallet recovery for their embedded wallet.                     |
| Wallet recovered         | wallet.recovered          | A user has successfully recovered their embedded wallet.                         |
| Intent created           | intent.created            | An [intent](/controls/dashboard/overview) was proposed and is awaiting approval. |
| Intent authorized        | intent.authorized         | A team member authorized an intent.                                              |

**That's it! You've successfully configured webhooks for your app.** 🎉

## Testing the webhook setup

<Accordion title="Quick testing guide">
  During development and testing, you can quickly verify your webhook endpoint is working correctly. Here's a simple step-by-step guide:

  #### Step 1: Expose your local endpoint

  If you're testing locally, you'll need to expose your local server to the internet. Use a tool like [ngrok](https://ngrok.com/) or [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/):

  ```bash  theme={"system"}
  # Using ngrok (after installing: https://ngrok.com/download)
  ngrok http 3000

  # Or using Cloudflare Tunnel (after installing: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/)
  cloudflared tunnel --url http://localhost:3000
  ```

  Copy the public URL (e.g., `https://abc123.ngrok.io` or `https://abc123.trycloudflare.com`).

  #### Step 2: Create your webhook endpoint

  Create a simple endpoint in your backend that accepts POST requests:

  ```tsx  theme={"system"}
  import {NextRequest, NextResponse} from 'next/server';

  export async function POST(req: NextRequest) {
    const body = await req.json();

    // Log the webhook payload
    console.log('Webhook received:', body);

    // Return 200 to acknowledge receipt
    return NextResponse.json({received: true}, {status: 200});
  }
  ```

  #### Step 3: Register your endpoint in the dashboard

  1. Go to **Configuration > Webhooks** in the Privy Dashboard
  2. Add your public URL (from Step 1) as the webhook endpoint
  3. Select the event types you want to test

  #### Step 4: Test your endpoint

  Click the **"Test webhook"** button in the dashboard. This will send a test webhook (`privy.test`) to your endpoint with the following payload:

  ```json  theme={"system"}
  {
    "type": "privy.test",
    "message": "Hello, World!"
  }
  ```

  #### Step 5: Verify receipt

  Check your server logs to confirm you received the webhook. You should see:

  * The webhook payload in your console/logs
  * A successful 200 response returned to Privy

  <Tip>
    For quick testing, you can also use services like [webhook.site](https://webhook.site/) or
    [RequestBin](https://requestbin.com/) to get a temporary endpoint URL without setting up your own
    server.
  </Tip>
</Accordion>

## Webhook delivery

Privy sends webhooks to your configured endpoint via Svix.
The webhook system operates on an **at least once** delivery basis with
automatic retries if the endpoint does not successfully respond.

<Info>
  Redundant webhook deliveries can be identified using the `idempotency_key` field where available,
  ensuring your application can safely handle duplicate events.
</Info>

### Retry behavior

Your endpoint must return a 2xx response for the webhook delivery to be
considered successful.
Anything else is considered an error response, and will be retried based on the
following schedule, where each period is started following the failure of the
preceding attempt:

* Immediately
* 5 seconds
* 5 minutes
* 30 minutes
* 2 hours
* 5 hours
* 10 hours
* 10 hours (in addition to the previous)

After the final attempt, the message will be marked as a failure, and must be manually retried from the dashboard. If all attempts to your endpoint fail for 5 consecutive days, your endpoint will be automatically disabled.

### Static IPs

Webhooks will be delivered from the following list of IP addresses:

```
44.228.126.217
50.112.21.217
52.24.126.164
54.148.139.208
2600:1f24:64:8000::/56
```

## Webhook signing key

The webhook signing key is necessary to verify that the payloads sent to your endpoint are from Privy. Follow the steps below in order to set up webhook verification in your backend.

<Accordion title="Verifying a webhook payload">
  Webhook payloads must be verified before they are trusted and used on your server. This is done by verifying a signature sent with your webhook. Privy uses [`svix`](https://www.svix.com/) for webhooks infrastructure.

  <Tip>
    Your endpoint must return a 2xx (status code 200-299) response for the webhook to be marked as
    delivered. Any other statuses (including 3xx) are considered failed deliveries. Your endpoint will
    be automatically disabled after 5 consecutive days of delivery failures
  </Tip>

  ### Using `@privy-io/node`

  Use the **`PrivyClient`**'s **`webhooks().verify`** method to verify an incoming webhook. Pass in the request body and svix headers. As an example, for a Next.js API request:

  ```tsx  theme={"system"}
  import {PrivyClient} from '@privy-io/node';

  const privy = new PrivyClient({
    appId: process.env.PRIVY_APP_ID,
    appSecret: process.env.PRIVY_APP_SECRET,
    webhookSigningSecret: process.env.PRIVY_WEBHOOK_SIGNING_SECRET
  });

  // req is an input of type `NextApiRequest`
  const verifiedPayload = await privy.webhooks().verify({
    payload: req.body,
    svix: {
      id: req.headers['svix-id'],
      timestamp: req.headers['svix-timestamp'],
      signature: req.headers['svix-signature']
    }
  });
  ```

  If the webhook payload is valid, the method returns the verified payload. If the webhook payload is invalid, the method throws an `InvalidWebhookError`.

  ### Manual verification

  In order to verify an incoming webhook, please refer to svix's [manual verification guide](https://docs.svix.com/receiving/verifying-payloads/how-manual) or [library verification guide](https://docs.svix.com/receiving/verifying-payloads/how).
</Accordion>

## Webhook events reference

<CardGroup cols={2}>
  <Card title="User events" icon="user" href="/api-reference/webhooks/user/created">
    Events for user creation, authentication, and account linking. Includes
    [`user.created`](/api-reference/webhooks/user/created),
    [`user.authenticated`](/api-reference/webhooks/user/authenticated), and more.
  </Card>

  <Card title="Transaction events" icon="arrow-right-arrow-left" href="/api-reference/webhooks/transaction/confirmed">
    Events for transaction lifecycle. Includes
    [`transaction.confirmed`](/api-reference/webhooks/transaction/confirmed),
    [`transaction.failed`](/api-reference/webhooks/transaction/failed), and more.
  </Card>

  <Card title="Wallet events" icon="wallet" href="/api-reference/webhooks/wallet/funds_deposited">
    Events for deposits, withdrawals, and wallet security. Includes
    [`wallet.funds_deposited`](/api-reference/webhooks/wallet/funds_deposited),
    [`wallet.private_key_export`](/api-reference/webhooks/wallet/private_key_export), and more.
  </Card>

  <Card title="MFA events" icon="shield-check" href="/api-reference/webhooks/mfa/enabled">
    Events for multi-factor authentication. Includes
    [`mfa.enabled`](/api-reference/webhooks/mfa/enabled) and
    [`mfa.disabled`](/api-reference/webhooks/mfa/disabled).
  </Card>

  <Card title="Intent events" icon="file-signature" href="/api-reference/webhooks/intents/created">
    Events for the intent approval lifecycle. Includes
    [`intent.created`](/api-reference/webhooks/intents/created) and
    [`intent.authorized`](/api-reference/webhooks/intents/authorized).
  </Card>
</CardGroup>
\n