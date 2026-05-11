> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Agentic wallets

Privy enables developers to create wallets for AI agents and autonomous systems that can execute onchain transactions independently while maintaining strict policy controls and security guardrails.

Agentic wallets are designed for use cases where autonomous systems need to make decisions and execute transactions without human intervention, such as trading agents, portfolio managers, automated market makers, and autonomous service providers.

At a high-level, this recipe will teach developers how to set up wallets that AI agents can control, implement policies to constrain agent behavior, and enable secure autonomous transaction execution.

<Steps>
  <Step title="Choose your control model">
    Privy supports two primary models for agentic wallets depending on your custody and control requirements:

    **Model 1: Agent-controlled, developer-owned wallets**

    * Your application backend controls the wallet via authorization keys
    * Suitable for fully autonomous agents where users delegate complete control
    * Agent can execute transactions within policy constraints without user approval

    **Model 2: User-owned wallets with agent signers**

    * Users maintain ownership while granting limited permissions to agents
    * Agent operates as an [additional signer](/controls/authorization-keys/owners/overview#signers) with scoped policies
    * Users retain ultimate control and can revoke agent access at any time

    For this recipe, we'll focus on **Model 1** for fully autonomous agents. For Model 2, see the [signers guide](/wallets/using-wallets/signers/overview).
  </Step>

  <Step title="Create authorization keys">
    Set up authorization keys that your application backend will use to control agent wallets.

    To start, create [authorization keys](/controls/authorization-keys/owners/types#authorization-keys) in the Privy Dashboard and securely store the corresponding private keys. Your backend will use these keys to sign requests to Privy's API on behalf of agents.

    For enhanced security, register the authorization keys in a [key quorum](/controls/authorization-keys/owners/types#key-quorums). This enables multi-party approval for critical actions like updating policies or exporting wallets.

    <CardGroup cols={2}>
      <Card title="Create authorization keys" href="/controls/authorization-keys/keys/create/key">
        Create authorization keys in your Privy Dashboard.
      </Card>

      <Card title="Key quorums quickstart" href="/controls/key-quorum/create#nodejs">
        Set up a key quorum for enhanced security.
      </Card>
    </CardGroup>
  </Step>

  <Step title="Define agent policies">
    Policies are critical as they define the boundaries within which your AI agents can operate. Well-designed policies prevent agents from taking unintended or harmful actions while allowing them to function effectively.

    Common policy constraints for agents include:

    * **Transfer limits**: Maximum amounts per transaction or within time windows
    * **Allowlisted contracts**: Restrict agents to interact only with approved protocols
    * **Recipient restrictions**: Limit where funds can be sent
    * **Time-based controls**: Define when agents can operate
    * **Action-specific rules**: Control parameters for swaps, trades, or other operations

    Follow the guide below to create policies for your desired use case. After creating your policy, save the `id` to assign the policy to the wallet(s) you create later.

    <CardGroup cols={2}>
      <Card title="Policies overview" href="/controls/policies/overview">
        Learn how to construct policies with Privy's policy language.
      </Card>

      <Card title="Create a policy" href="/controls/policies/create-a-policy#nodejs">
        Create policies for your agents.
      </Card>
    </CardGroup>
  </Step>

  <Step title="Create the agent wallet">
    Create a wallet owned by your authorization key, with the policies you previously defined attached. Make sure to:

    * Set the `owner_id` of the wallet to the `id` of the authorization key you created earlier
    * Set the `policy_ids` array of the wallet to a singleton containing the `id` of the policy you created earlier

    You can reuse the same policy ID to provision additional wallets so every agent in your fleet is subject to these controls.

    <CardGroup cols={1}>
      <Card title="Wallets quickstart" href="/wallets/wallets/create/create-a-wallet#nodejs">
        Create a wallet.
      </Card>
    </CardGroup>
  </Step>

  <Step title="Execute transactions">
    You can now send transactions, sign transactions, or sign messages with Privy's API. Follow the guide below to send a transaction.

    <CardGroup cols={3}>
      <Card title="Send EVM transaction" href="/wallets/using-wallets/ethereum/send-a-transaction#nodejs">
        Execute transactions on Ethereum and EVM chains.
      </Card>

      <Card title="Send Solana transaction" href="/wallets/using-wallets/solana/send-a-transaction#nodejs">
        Execute transactions on Solana.
      </Card>

      <Card title="Tier 2 chains" href="/wallets/using-wallets/other-chains#nodejs">
        Execute transactions on other supported chains.
      </Card>
    </CardGroup>
  </Step>

  <Step title="Monitor and observe agent behavior">
    Implement monitoring and logging to track your agent's actions and ensure it operates as intended. Privy provides webhooks for transaction events and balance changes.

    <CardGroup cols={2}>
      <Card title="Transaction webhooks" href="/wallets/gas-and-asset-management/assets/transaction-event-webhooks">
        Monitor transaction status and completion.
      </Card>

      <Card title="Balance webhooks" href="/wallets/gas-and-asset-management/assets/balance-event-webhooks">
        Track deposits and withdrawals.
      </Card>
    </CardGroup>
  </Step>
</Steps>

## Learn more

<CardGroup cols={2}>
  <Card title="OpenClaw integration" href="/recipes/agent-integrations/openclaw-agentic-wallets">
    Use Privy wallets with OpenClaw AI agents.
  </Card>

  <Card title="x402 payments quickstart" href="/recipes/agent-integrations/x402">
    Set up your agent to pay for APIs and content.
  </Card>

  <Card title="Hyperliquid quickstart" href="/recipes/hyperliquid-guide">
    Set up your agent to trade on Hyperliquid.
  </Card>

  <Card title="Gas sponsorship" href="/wallets/gas-and-asset-management/gas/overview">
    Automatically sponsor gas fees for agent transactions.
  </Card>
</CardGroup>
\n