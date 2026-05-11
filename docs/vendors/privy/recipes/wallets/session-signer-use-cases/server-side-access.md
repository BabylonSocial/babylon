> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Enabling server-side access to user wallets

Signers allow your app to request server-side access to user wallets. This enables your app to execute transactions from user wallets from your servers directly, giving you more control and the ability to execute transactions even when the user is offline (e.g., for [limit orders](/recipes/wallets/session-signer-use-cases/limit-orders) or [Telegram bot trading](/recipes/wallets/session-signer-use-cases/telegram-bot)).

You can also configure signers to have specific permissions via [policies](/controls/policies/overview), such that you can request server-side access for only certain transaction types.

At a high-level, you can use signers to request server-side access to user wallets.

<Steps>
  <Step title="Add a signer to the user's wallet">
    Follow the "adding a signer quickstart" to first request access to a user's wallet. Store the private key(s) associated with your signer ID securely in your server.

    <CardGroup cols={1}>
      <Card title="Adding a signer quickstart" href="/wallets/using-wallets/signers/quickstart">
        Request access to user wallets with signers.
      </Card>
    </CardGroup>
  </Step>

  <Step title="Execute actions with your signer">
    Next, execute actions with your signer by signing requests with the private key(s) of your signer ID. Follow the guides below to learn how to sign requests and execute actions with wallets.

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