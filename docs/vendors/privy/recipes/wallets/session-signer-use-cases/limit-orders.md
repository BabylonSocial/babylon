> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Using signers to execute limit orders with wallets

Signers allow your app to execute limit orders or other transactions while a user is offline. You can also configure signers such that you can only execute certain orders restricted by specific [policies](/controls/policies/overview) that you define.

At a high-level, you can use signers to execute limit orders.

<Steps>
  <Step title="Add a signer to the user's wallet">
    Follow the "adding signers quickstart" to first request access to a user's wallet. Store the private key(s) associated with your signer ID securely in your server. Your Telegram bot or agent will need this to execute transaction requests.

    <CardGroup cols={1}>
      <Card title="Adding signers quickstart" href="/wallets/using-wallets/signers/quickstart">
        Request access to user wallets with signers.
      </Card>
    </CardGroup>
  </Step>

  <Step title="Execute the limit order from your server">
    Next, use Privy's NodeJS SDK or REST API to execute the limit order from your server. When making the request to Privy's API, you must sign the request with the private key(s) associated with your signer ID.

    Follow the guides below to learn how to sign requests and execute transactions on EVM and Solana.

    <CardGroup cols={3}>
      <Card title="Sign requests" href="/controls/authorization-keys/using-owners/sign">
        Sign requests to the Privy API with your signer.
      </Card>

      <Card title="EVM" href="/wallets/using-wallets/ethereum/send-a-transaction">
        Take actions on EVM chains with Privy's NodeJS SDK or REST API.
      </Card>

      <Card title="Solana" href="/wallets/using-wallets/solana/send-a-transaction">
        Take actions on Solana with Privy's NodeJS SDK or REST API.
      </Card>
    </CardGroup>
  </Step>
</Steps>
\n