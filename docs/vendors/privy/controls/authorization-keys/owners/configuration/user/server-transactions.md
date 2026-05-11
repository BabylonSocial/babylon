> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Sending transactions from your server

Many apps would like users to explicitly authorize transactions, but to send transaction requests from their server for increased reliability, retries, and various other use cases.

To send transactions from your server by default:

<Tabs>
  <Tab title="Using Privy as your authentication provider">
    <Steps>
      <Step title="Create wallets with a user owner">
        To ensure the wallet can only be controlled by the user, create the wallet with a user
        owner. If you use one of Privy's client-side SDKs to create wallets, wallets are created
        with a user owner by default.
      </Step>

      <Step title="Request a signature over your transaction request">
        [Construct your transaction request](/controls/authorization-keys/using-owners/sign) and use
        Privy's [client-side SDKs'
        methods](/controls/authorization-keys/using-owners/sign#react%2C-expo) to have the user sign
        the transaction request.
      </Step>

      <Step title="Execute the transaction request from your server">
        Send your user's authorization signature from your client to your server, and [send your
        transaction request](/controls/authorization-keys/using-owners/action) with the user's
        signature to Privy's API.
      </Step>
    </Steps>
  </Tab>

  <Tab title="Using your own authentication provider">
    <Steps>
      <Step title="Create wallets with a user owner">
        To ensure the wallet can only be controlled by the user, create the wallet with a user
        owner. If you use one of Privy's client-side SDKs to create wallets, wallets are created
        with a user owner by default.
      </Step>

      <Step title="Request a user key">
        Next, given a user's access token from your authentication provider, [request a user
        key](/controls/authorization-keys/keys/create/user/request) from Privy's API. You will use
        this key to sign transaction requests to Privy's aPI.
      </Step>

      <Step title="Sign the request with your user key">
        Next, [construct your transaction request](/controls/authorization-keys/using-owners/sign)
        and [sign the transaction request](/controls/authorization-keys/using-owners/sign) with the
        user key
      </Step>

      <Step title="Execute the transaction request from your server">
        Send your user's authorization signature from your client to your server, and [send your
        transaction request](/controls/authorization-keys/using-owners/action) with the user's
        signature to Privy's API.
      </Step>
    </Steps>
  </Tab>
</Tabs>
\n