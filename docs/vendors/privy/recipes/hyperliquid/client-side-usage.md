> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Client-side SDKs

Learn how to integrate Hyperliquid with client-side applications using React and external wallets like MetaMask.

## Overview

When building client-side applications with Hyperliquid, you'll typically want to:

1. Allow users to connect with external wallets (MetaMask, Coinbase Wallet, etc.)
2. Create an embedded agent wallet for programmatic trading
3. Execute L1 actions (trading) through the agent wallet
4. Execute User Signed Actions (withdrawals, approvals) through the user's external wallet

This pattern provides the best user experience - users maintain control through their external wallet while trading operations happen seamlessly through the agent wallet.

## Using External Wallets with Agent Wallets

If you want to execute L1 actions (like placing orders, canceling orders, etc.) with external wallets like MetaMask, create an [Agent Wallet](/recipes/hyperliquid/agents-and-subaccounts) and execute all L1 actions through it.

Agent wallets are designed specifically for programmatic trading and provide a better user experience - users won't see confusing chain switching prompts, and it creates a cleaner separation between user wallets and trading operations.

```javascript  theme={"system"}
import { usePrivy, useWallets, toViemAccount } from "@privy-io/react-auth";
import { useCallback } from "react";
import * as hl from "@nktkas/hyperliquid";

export function useInitializeAgent() {
  const { user, ready } = usePrivy();
  const { wallets, ready: walletsReady } = useWallets();

  const initializeAgent = useCallback(async () => {
    if (!ready || !walletsReady) {
      return null;
    }

    const externalWallet = wallets.find(
      (w) => (
        w.walletClientType != "privy"
        && w.address === user?.wallet?.address
      )
    );

    if (!externalWallet) {
      throw new Error("External wallet not found");
    }

    const embeddedWallet = wallets.find(
      (w) => w.walletClientType == "privy"
    );

    if (!embeddedWallet) {
      throw new Error("Embedded wallet not found");
    }

    const externalViemAccount = await toViemAccount({ wallet: externalWallet });
    const embeddedViemAccount = await toViemAccount({ wallet: embeddedWallet });

    const transport = new hl.HttpTransport();
    const client = new hl.ExchangeClient({
      wallet: externalViemAccount,
      transport,
    });

    await client.approveAgent({
      agentAddress: embeddedWallet.address as `0x${string}`,
      agentName: "Privy Agent",
    });

    const agentClient = new hl.ExchangeClient({
      wallet: embeddedViemAccount,
      transport,
    });

    return agentClient;
  }, [user, wallets, ready, walletsReady]);

  return { initializeAgent };
}
```

<Note>
  **User Signed Actions** (like withdrawals and agent approvals) use the standard Ethereum mainnet
  (chain 1) and work normally with external wallets.
</Note>

## Understanding Action Types

### L1 Actions (Trading Operations)

These actions can be executed by agent wallets without requiring the master wallet's signature:

* Placing orders
* Canceling orders
* Modifying leverage
* Setting position sizes

**Best Practice**: Execute these through an agent wallet for a seamless user experience.

### User Signed Actions

These sensitive operations require the master wallet's signature:

* Withdrawing funds
* Approving agents
* Account transfers
* Approving builder fees

**Best Practice**: Execute these through the user's connected external wallet.

## Best Practices

<AccordionGroup>
  <Accordion title="Initialize agent on first use">
    Create and approve the agent wallet the first time a user wants to trade. Store the agent wallet
    reference for future sessions.
  </Accordion>

  <Accordion title="Handle wallet disconnections">
    Implement proper error handling for when users disconnect their external wallet. The agent
    wallet can continue operating, but User Signed Actions will fail.
  </Accordion>

  <Accordion title="Clear user feedback">
    Communicate to users which wallet is being used for each action. For example, "Placing order
    with trading wallet" vs "Approve with MetaMask".
  </Accordion>
</AccordionGroup>

## Next Steps

<CardGroup cols={2}>
  <Card title="Agent wallets" icon="key" href="/recipes/hyperliquid/agents-and-subaccounts">
    Learn more about agent wallets
  </Card>

  <Card title="Executing trades" icon="chart-line" href="/recipes/hyperliquid/trading-patterns">
    Explore trading patterns and order types
  </Card>
</CardGroup>
\n