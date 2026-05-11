> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Treasury wallets

Privy enables developers to create, own, and control wallets for various use cases including [treasury management](https://privy.io/blog/reimagining-treasury-management-with-stablecoins), trading, and commerce.

A common configuration is to set up [key quorum-owned wallets](/controls/authorization-keys/owners/overview), which require authorizations from multiple parties before taking important actions. These setups typically also implement [policies](/controls/overview) to define what actions can be taken with a wallet.

At a high-level, this recipe will teach developers how to create a key quorum, implement a policy, generate a wallet that is subject to these controls, and send a transaction.

<Steps>
  <Step title="Create an m-of-n key quorum">
    Key quorums make it possible for organizations to require multiple authorizations before taking critical actions, such as updating owners, policies, and signers, exporting a wallet, or using a wallet to send a transaction.

    To start, create [authorization keys](/controls/authorization-keys/owners/types#authorization-keys) in the Privy Dashboard and save the corresponding private keys. Your app will use these private keys to sign requests to Privy's API.

    Next, register the authorization keys in a [key quorum](/controls/authorization-keys/owners/types#key-quorums). Set the authorization threshold to the number of members of the quorum that must sign a given wallet request. For example, in a 2-of-3 quorum, authorization signatures must be provided by at least 2 of the keys in the quorum to authorize requests to the Privy API.

    You will later register this key quorum as the owner of a wallet, and a sufficient number of members of the key quorum must sign requests to use the wallet.

    Follow the guide below to create your authorization key(s) and key quorum.

    <CardGroup cols={2}>
      <Card title="Create authorization keys" href="/controls/authorization-keys/keys/create/key">
        Create authorization keys in your Privy Dashboard.
      </Card>

      <Card title="Key quorums quickstart" href="/controls/key-quorum/create">
        Create a key quorum in your Privy Dashboard.
      </Card>
    </CardGroup>
  </Step>

  <Step title="Implement a policy">
    Privy’s policy engine allows your application to restrict the actions that can be taken with wallets. These policies include critical controls such as transfer limits, time-bound signers, allowlists and denylists of smart contracts and programs, and restricting smart contract parameters and calldata.

    Follow the guide below to create policies for your desired use case. After creating your policy, save the `id` to assign the policy to the wallet(s) you create later.

    <CardGroup cols={2}>
      <Card title="Policies overview" href="/controls/policies/overview">
        Learn how to construct policies with Privy's policy language.
      </Card>

      <Card title="Policies quickstart" href="/controls/policies/create-a-policy">
        Create a policy.
      </Card>
    </CardGroup>
  </Step>

  <Step title="Create a wallet">
    Create a wallet with the following configuration:

    * Set the `owner_id` of the wallet to the `id` of the key quorum you created earlier
    * Set the `policy_ids` array of the wallet to a singleton containing the `id` of the policy you created earlier

    As the owner, the key quorum must sign requests to update the wallet's configuration or execute transactions. The wallet is also subject to the policy you created.

    Follow the guide below to create a wallet with your desired configuration.

    <CardGroup cols={1}>
      <Card title="Wallets quickstart" href="/wallets/wallets/create/create-a-wallet">
        Create a wallet.
      </Card>
    </CardGroup>

    <Info>In addition to the owner, you can also set [additional signers](/wallets/using-wallets/signers/overview) on the wallet that can take actions with the wallet subject to their own policies. This allows multiple parties to authorize requests to the Privy API, with different policies and permissions over the wallet.</Info>
  </Step>

  <Step title="Generate authorization signatures for a request">
    When taking action with the wallet, the wallet's owner must sign requests to the Privy API.

    For your key quorum to authorize this request, m-of-n of the authorization private keys in the quorum must sign the request. These signatures must then be included in the `privy-authorization-signature` header when making a request to take action with a wallet.

    Follow the guide below to learn how to sign requests to the Privy API.

    <Tip>Privy strongly recommends using Privy’s [server-side SDKs](/controls/authorization-keys/using-owners/sign/signing-on-the-server) to generate and include authorization signatures in your requests automatically.</Tip>

    <CardGroup cols={1}>
      <Card title="Authorization signature quickstart" href="/controls/authorization-keys/using-owners/sign/overview">
        Sign requests to the Privy API.
      </Card>
    </CardGroup>
  </Step>

  <Step title="Send a transaction">
    You can now send transactions, sign transactions, or sign messages with Privy's API. Follow the guide below to send a transaction.

    <CardGroup cols={3}>
      <Card title="Send an EVM transaction" href="/wallets/using-wallets/ethereum/sign-a-transaction">
        Learn how to send an EVM transaction.
      </Card>

      <Card title="Send a Solana transaction" href="/wallets/using-wallets/solana/send-a-transaction">
        Learn how to send a Solana transaction.
      </Card>

      <Card title="Send transactions on Tier 2 chains" href="/wallets/using-wallets/other-chains">
        Learn how to send transactions on Tier 2 chains.
      </Card>
    </CardGroup>
  </Step>
</Steps>

### Learn more

Visit the following pages to continue integrating Privy's full feature suite with your wallet.

<CardGroup cols={3}>
  <Card title="Transaction status and webhooks" href="/wallets/gas-and-asset-management/assets/fetch-a-transaction">
    Learn how to check the status of a transaction.
  </Card>

  <Card title="Deposit and withdrawal webhooks" href="/wallets/gas-and-asset-management/assets/balance-event-webhooks">
    Learn how to fetch balances.
  </Card>

  <Card title="Wallet funding" href="/recipes/bridge-onramp">
    Learn how to fund your wallet using Bridge.
  </Card>
</CardGroup>
\n