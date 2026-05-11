> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# OpenClaw Agentic Wallets

# Using Privy Server Wallets with OpenClaw

Enable your AI agent to autonomously execute onchain transactions using Privy server wallets. This recipe shows how to set up an OpenClaw agent with its own wallet, complete with policy-based guardrails.

<Warning>
  **Experimental Integration**: OpenClaw is a third-party open-source project and is not officially
  supported by Privy. This recipe is provided for educational purposes. Use at your own risk and
  always test thoroughly before deploying to production.
</Warning>

## What is OpenClaw?

[OpenClaw](https://github.com/openclaw/openclaw) is an open-source framework for running AI agents that can interact with external tools and services. By combining OpenClaw with Privy server wallets, you can create agents that autonomously execute blockchain transactions within defined policy constraints.

<Info>
  **About OpenClaw**: OpenClaw is a community-driven project. Privy does not maintain, endorse, or
  provide support for OpenClaw. For OpenClaw-specific issues, please refer to their [GitHub
  repository](https://github.com/openclaw/openclaw) and [Discord
  community](https://discord.com/invite/clawd).
</Info>

## Use Cases

What can autonomous agents do with their own wallets?

* **Trading & DeFi**: Execute swaps, rebalance portfolios, compound yields
* **Payments**: Pay for API calls, tip creators, handle subscriptions
* **On-chain Automation**: Vote in governance, renew ENS domains, bridge assets
* **Agent-to-Agent**: Pay other agents for tasks, escrow funds, settle debts
* **NFTs**: Mint, purchase, and manage digital assets

## Prerequisites

* A Privy account with API credentials ([dashboard.privy.io](https://dashboard.privy.io))
* OpenClaw installed and configured
* Node.js 18+

## Installation

### Option 1: Install from ClawHub (Recommended)

The easiest way to install the skill:

<Warning>
  **Review Before Installing**: Before equipping your OpenClaw agent with any skill, always review its contents first:

  1. Read the `SKILL.md` file to understand what the skill does
  2. Examine the ZIP file contents before extraction
  3. Inspect all source files in the skill to verify there's no malicious code

  Never blindly install skills from untrusted sources.
</Warning>

```bash  theme={"system"}
clawhub install privy
```

<Info>Don't have ClawHub? Install it first: `npm i -g clawhub`</Info>

### Option 2: Clone from GitHub

Alternatively, clone directly into your workspace:

```bash  theme={"system"}
git clone https://github.com/privy-io/privy-agentic-wallets-skill.git ~/.openclaw/workspace/skills/privy
```

### Configure Privy Credentials

Add your Privy credentials to your OpenClaw config (`~/.openclaw/openclaw.json`):

```json  theme={"system"}
{
  "env": {
    "vars": {
      "PRIVY_APP_ID": "your-app-id",
      "PRIVY_APP_SECRET": "your-app-secret"
    }
  }
}
```

<Warning>
  **Security Notice**: Your Privy App Secret grants full access to create wallets and sign
  transactions. Never commit it to version control, share it publicly, or expose it in client-side
  code.
</Warning>

### Restart OpenClaw

```bash  theme={"system"}
openclaw gateway restart
```

## Usage

Once configured, your OpenClaw agent can interact with Privy wallets through natural language commands.

### Create a Wallet

Ask your agent:

> "Create an Ethereum wallet for yourself using Privy"

The agent will call the Privy API to create a server wallet and return the address.

### Create a Policy

Policies define guardrails for what the agent can do:

> "Create a policy that limits transactions to 0.1 ETH max, only on Base mainnet"

### Attach Policy to Wallet

> "Attach the spending limit policy to my wallet"

### Execute a Transaction

> "Send 0.01 ETH to 0x1234... on Base"

The agent will execute the transaction through Privy's RPC endpoint, subject to any attached policies.

## Policy Examples

### Spending Limit

Restrict maximum value per transaction:

```json  theme={"system"}
{
  "name": "Max 0.1 ETH per tx",
  "method": "eth_sendTransaction",
  "conditions": [
    {
      "field_source": "ethereum_transaction",
      "field": "value",
      "operator": "lte",
      "value": "100000000000000000"
    }
  ],
  "action": "ALLOW"
}
```

### Chain Restriction

Lock the wallet to a specific chain:

```json  theme={"system"}
{
  "name": "Base mainnet only",
  "method": "eth_sendTransaction",
  "conditions": [
    {
      "field_source": "ethereum_transaction",
      "field": "chain_id",
      "operator": "eq",
      "value": "8453"
    }
  ],
  "action": "ALLOW"
}
```

### Contract Allowlist

Only allow interactions with specific contracts:

```json  theme={"system"}
{
  "name": "Only Uniswap Router",
  "method": "eth_sendTransaction",
  "conditions": [
    {
      "field_source": "ethereum_transaction",
      "field": "to",
      "operator": "in",
      "value": ["0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD"]
    }
  ],
  "action": "ALLOW"
}
```

## How It Works

1. **Agent receives request**: User asks the agent to perform a wallet operation
2. **Skill provides context**: OpenClaw loads the Privy skill which teaches the agent how to use the API
3. **API authentication**: Agent uses stored credentials to authenticate with Privy
4. **Policy enforcement**: Privy validates the transaction against attached policies
5. **Transaction execution**: If policies allow, Privy signs and broadcasts the transaction
6. **Result returned**: Agent reports the transaction hash or error to the user

## Security Considerations

<Warning>
  **Important Disclaimers**

  1. **Not Production Ready**: This integration is experimental. Thoroughly test in testnet environments before using real funds.

  2. **Fund Limits**: Only fund agent wallets with amounts you're comfortable losing. Start with small amounts for testing.

  3. **Policy Design**: Design policies conservatively. It's safer to start restrictive and loosen over time than the reverse.

  4. **Credential Security**: Privy credentials in OpenClaw config are stored in plaintext. Ensure your machine is secure and the config file has appropriate permissions.

  5. **Agent Autonomy**: Autonomous agents can make mistakes. Consider requiring human approval for high-value transactions.

  6. **No Warranty**: This integration is provided as-is. Neither Privy nor OpenClaw maintainers are responsible for lost funds.
</Warning>

## If Your Agent Is Compromised

If you suspect your agent or credentials have been compromised, we recommend taking the following steps immediately:

1. **Rotate your Privy App Secret**: Generate a new App Secret from [dashboard.privy.io](https://dashboard.privy.io) and update your OpenClaw config. This invalidates the old credentials.

2. **Rotate authorization keys**: If you've equipped your wallets with extra signers and stored authorization keys locally, rotate those keys as well.

3. **Review recent transactions**: Check your wallet activity in the Privy dashboard for any unauthorized transactions.

4. **Transfer remaining funds**: Move any remaining funds to a new, uncompromised wallet.

5. **Audit your setup**: Investigate how the compromise occurred and address any security gaps before redeploying.

## Supported Chains

| Chain    | chain\_type | CAIP-2           |
| -------- | ----------- | ---------------- |
| Ethereum | `ethereum`  | `eip155:1`       |
| Base     | `ethereum`  | `eip155:8453`    |
| Polygon  | `ethereum`  | `eip155:137`     |
| Arbitrum | `ethereum`  | `eip155:42161`   |
| Optimism | `ethereum`  | `eip155:10`      |
| Solana   | `solana`    | `solana:mainnet` |

Privy also supports: Cosmos, Stellar, Sui, Aptos, Tron, Bitcoin (SegWit), NEAR, TON, Starknet

## Testing

For testnet development:

1. Create wallets on Base Sepolia (chain ID 84532)
2. Get testnet ETH from [Base Sepolia Faucet](https://www.coinbase.com/faucets/base-ethereum-goerli-faucet)
3. Test transactions before moving to mainnet

## Troubleshooting

**"Credentials not configured"**

* Ensure `PRIVY_APP_ID` and `PRIVY_APP_SECRET` are set in your OpenClaw config
* Restart the gateway after config changes

**"Policy violation"**

* Check your policy conditions match the transaction parameters
* Verify chain\_id matches the target network

**"Wallet not found"**

* Confirm the wallet ID exists in your Privy dashboard
* Ensure you're using the correct App ID

## Learn More

* [Privy Server Wallets](https://docs.privy.io/guide/server-wallets)
* [Privy Policies](https://docs.privy.io/guide/server-wallets/policies)
* [OpenClaw Documentation](https://docs.openclaw.ai)
* [Privy Agentic Wallets Skill](https://github.com/privy-io/privy-agentic-wallets-skill)
\n