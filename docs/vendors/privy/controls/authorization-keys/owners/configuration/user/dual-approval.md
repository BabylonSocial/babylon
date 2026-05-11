> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Requiring user and server approvals

Many apps require *both* users and servers to approve transactions, which can be used to enhance the security of your application. For example, if a user's account is compromised, attackers cannot unilaterally take actions with the user's wallets without the server's approval.

To enable a configuration where both users and servers must approve transactions, Privy recommends the following:

<Steps>
  <Step title="Create a wallet owned by an m-of-k key quorum">
    Create a wallet owned by an *m-of-k* key quorum (m ≥ 2) whose elements include at least a
    **user** and an **authorization key** controlled by your server. You can do this via Privy's
    [REST API](/wallets/wallets/create/create-a-wallet).
  </Step>

  <Step title="Have users and server(s) both sign transaction requests">
    Next, construct your transaction request and have
    [users](/controls/authorization-keys/owners/configuration/user#sending-transactions-from-your-server)
    *and* [servers](/controls/authorization-keys/using-owners/sign) sign the transaction request.
  </Step>

  <Step title="Execute your transaction request with the user and server signatures">
    Finally, [execute the transaction request](/wallets/using-wallets/ethereum/send-a-transaction)
    with both signatures.
  </Step>
</Steps>
\n