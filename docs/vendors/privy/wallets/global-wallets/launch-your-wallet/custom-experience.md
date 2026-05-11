> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# null

<Warning>
  <b>This is an advanced feature.</b> It is recommended that you reach out to the Privy team if you
  are interested in building a custom global wallet experience.
</Warning>

Privy allows you to build your own custom global wallet experience, instead of using Privy's
default user interfaces. To build your own experience, you will create two new pages using
methods from the `@privy-io/cross-app-provider` library to communicate via the Privy
cross-app protocol. Your app handles the user interfaces, and Privy handles the rest.

<Note>
  The `@privy-io/cross-app-provider` SDK is a vanilla JavaScript library. We recommend using this
  library alongside `@privy-io/react-auth` for the best development experience.
</Note>

This guide highlights the core interfaces of the `@privy-io/cross-app-provider` SDK and how they
integrate with the **React SDK**. For a more complete reference implementation, see the
[**cross-app provider starter repo**](https://github.com/privy-io/examples/tree/main/examples/privy-next-cross-app-provider).

There are two clients in this SDK depending on what style of cross app you are looking to implement. Privy supports both connect and auth mode, where connect allows users to only connect their wallet via a Wagmi connector and auth mode which allows users to login or link with their Privy account.
Connect mode uses the [Mobile Wallet Protocol](https://mobilewalletprotocol.github.io/wallet-mobile-sdk/docs/spec) to connect the wallet, and auth mode uses the [OAuth2 protocol](https://oauth.net/2/) to securely authenticate the user across apps.

<Tabs>
  <Tab title="Connect mode">
    <Steps>
      <Step title="Set up a cross-app provider client">
        ```tsx  theme={"system"}
        // client.ts
        import {createClient} from '@privy-io/cross-app-provider/connect';

        export const client = createClient({
          appId: '<your-privy-app-id>',
          appClientId: '<your-privy-app-client-id>',
          // e.g. https://privy.your-app.com
          privyDomain: '<your-privy-auth-domain>'
        });
        ```
      </Step>

      <Step title="Build the connect experience">
        Allow user's to accept (or reject) a cross-app connection request by using the
        `client` to handle parsing input and responging to the requesting app.

        First, use the `client.getConnectionRequestFromUrlParams` method when the page loads
        to read the request into your app.

        ```tsx  theme={"system"}
        const connectionRequest = client.getConnectionRequestFromUrlParams();
        ```

        <Accordion title="The connection request">
          A connection request object contains:

          * the `requesterPublickey`, used to generate the shared secret for encrypted communication
          * the `callbackUrl`, used to identify the requester and as the `targetOrigin`
            in calls to `window.postMessage`
        </Accordion>

        Then, use `client.acceptConnection` and `client.rejectConnection` to allow your
        users to explicitly approve or deny the connection request respectively via clicking
        a button like so:

        ```tsx  theme={"system"}
        // Approve
        <button
          onClick={async () => {
            await client.acceptConnection({
              accessToken,
              address,
              userId: user.id,
              connectionRequest
            });
          }}
        >
          Accept
        </button>
        ```

        ```tsx  theme={"system"}
        // Deny
        <button
          onClick={async () => {
            await client.rejectConnection({
              accessToken,
              callbackUrl: connectionRequest.callbackUrl
            });
          }}
        >
          Deny
        </button>
        ```
      </Step>

      <Step title="Build the request experience">
        This page allows you to control the experience of a global wallet request.

        First read the request using `client.getVerifiedWalletRequest` to decrypt, parse and
        verify the input. This method will also return the `connection` object used to
        communicate a result back to the requester.

        ```tsx  theme={"system"}
        const {request, connection} = await client.getVerifiedWalletRequest({
          userId: user.id
        });
        ```

        Once you have the result of handling this request you can return the response to the
        requester using `client.handleRequestResult`, for example responding to a signature request:

        ```tsx  theme={"system"}
        const message = request.params[0];
        const {signature} = await signMessage({message});

        await client.handleRequestResult({
          accessToken,
          result: signature,
          connection
        });
        ```

        Similarly, if the user rejects the request use `client.rejectRequest` to send an
        error message to the requester:

        ```tsx  theme={"system"}
        await client.rejectRequest({
          accessToken,
          callbackUrl: connection.callbackUrl
        });
        ```

        If there are other errors (e.g. not enough funds for a transaction) use the
        `client.handleError` method to pass the error back to the requester:

        ```tsx  theme={"system"}
        await client.handleError({
          accessToken,
          error: new Error('<message>'),
          callbackUrl: connection.callbackUrl
        });
        ```
      </Step>

      <Step title="Upgrade your clients">
        Ensure client apps are using the [latest version](/changelogs/cross-app-connect) of
        `@privy-io/cross-app-connect`
      </Step>

      <Step title="Set up your custom URLs in the Privy Dashboard">
        <Tip>
          Prior to enabling the custom URLs in your dashboard, ensure that your integration is ready to
          receive production traffic, including [setting a strong
          CSP](/security/implementation-guide/content-security-policy) and adding your custom URLs as
          allowed domains for your Privy app.
        </Tip>

        From the Privy dashboard, navigate to [**Global Wallet >
        Advanced**](https://dashboard.privy.io/apps?page=ecosystem\&tab=advanced). Enable `Custom URLs`,
        input the URL(s) where your pages are hosted, and save your changes.
      </Step>
    </Steps>
  </Tab>

  <Tab title="Auth mode">
    <Steps>
      <Step title="Set up a cross-app provider client">
        ```tsx  theme={"system"}
        // client.ts
        import {createClient} from '@privy-io/cross-app-provider/auth';

        export const client = createClient({
          appId: '<your-privy-app-id>',
          appClientId: '<your-privy-app-client-id>',
          // e.g. https://privy.your-app.com
          privyDomain: '<your-privy-auth-domain>'
        });
        ```
      </Step>

      <Step title="Build the connect experience">
        Allow user's to accept (or reject) a cross-app connection request by using the
        `client` to handle parsing input and responging to the requesting app.

        First, use the `client.getConnectionRequestFromUrlParams` method when the page loads
        to read the request into your app.

        ```tsx  theme={"system"}
        const connectionRequest = client.getConnectionRequestFromUrlParams();
        ```

        Then, use `client.acceptConnection` and `client.rejectConnection` to allow your
        users to explicitly approve or deny the connection request respectively via clicking
        a button like so:

        ```tsx  theme={"system"}
        // Approve
        <button
          onClick={async () => {
            await client.acceptConnection({
              accessToken,
              codeChallenge: connectionRequest.codeChallenge!,
              codeChallengeMethod: connectionRequest.codeChallengeMethod!,
              state: connectionRequest.state,
              oauthClientId: connectionRequest.oauthClientId
            });
          }}
        >
          Accept
        </button>
        ```

        ```tsx  theme={"system"}
        // Deny
        <button
          onClick={async () => {
            await client.rejectConnection({
              accessToken,
              codeChallenge: connectionRequest.codeChallenge!,
              codeChallengeMethod: connectionRequest.codeChallengeMethod!,
              state: connectionRequest.state,
              oauthClientId: connectionRequest.oauthClientId
            });
          }}
        >
          Deny
        </button>
        ```
      </Step>

      <Step title="Build the request experience">
        This page allows you to control the experience of a global wallet request.

        First read the request using `client.getVerifiedTransactionRequest` to validate the JWT and request.
        This method will return a boolean `verified` and a `data` object.
        `verified` will be false if the JWT is invalid and the request should be ignored.
        In this case, the `data` object will contain a `callbackUrl` you can passed to `handleError` to gracefully exit the page.
        If the request is valid, the `data` object will contain a `request` and a `token` object which you can use to handle the request.

        ```tsx  theme={"system"}
        const {verified, data} = await client.getVerifiedTransactionRequest({
          accessToken
        });
        ```

        Once you have the result of handling this request you can return the response to the
        requester using `client.handleRequestResult`, for example responding to a signature request:

        ```tsx  theme={"system"}
        const message = request.params[0];
        const {signature} = await signMessage({message});

        await client.handleRequestResult({
          accessToken,
          result: signature,
          connection
        });
        ```

        Similarly, if the user rejects the request use `client.rejectRequest` to send an
        error message to the requester:

        ```tsx  theme={"system"}
        await client.rejectRequest({
          accessToken,
          callbackUrl: request.callbackUrl
        });
        ```

        If there are other errors (e.g. not enough funds for a transaction) use the
        `client.handleError` method to pass the error back to the requester:

        ```tsx  theme={"system"}
        await client.handleError({
          accessToken,
          error: new Error('<message>'),
          callbackUrl: request.callbackUrl
        });
        ```
      </Step>

      <Step title="Upgrade your clients">
        Ensure client apps are using the [latest version](/changelogs/cross-app-connect) of
        `@privy-io/cross-app-connect`
      </Step>

      <Step title="Set up your custom URLs in the Privy Dashboard">
        <Tip>
          Prior to enabling the custom URLs in your dashboard, ensure that your integration is ready to
          receive production traffic, including [setting a strong
          CSP](/security/implementation-guide/content-security-policy) and adding your custom URLs as
          allowed domains for your Privy app.
        </Tip>

        From the Privy dashboard, navigate to [**Global Wallet >
        Advanced**](https://dashboard.privy.io/apps?page=ecosystem\&tab=advanced). Enable `Custom URLs`,
        input the URL(s) where your pages are hosted, and save your changes.
      </Step>
    </Steps>
  </Tab>
</Tabs>

That's it, now your global wallet has a fully custom experience!
\n