> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Custom gas sponsorship rate limits

> Implement spending controls for gas-sponsored transactions

Gas sponsorship allows your app to pay for transaction fees on behalf of users. Privy natively offers controls to limit total spend and allows for per-transaction control on whether to sponsor gas, but your app may implement finer controls on spend across wallets, users, or apps.

This guide walks through an implementation of wallet-level, user-level, and app-level spending limits for Privy gas-sponsored transactions across a given timeframe.

## Prerequisites

* A Privy app with [gas sponsorship enabled](/wallets/gas-and-asset-management/gas/setup)
* Basic familiarity with [sending transactions](/wallets/using-wallets/ethereum/send-a-transaction)

## Overview

The recipe implements a three-tier spending control system:

* **Wallet-level**: Limit spending per individual wallet
* **User-level**: Limit spending per user across all their wallets
* **App-level**: Limit total spending across all users

Privy exposes a `sponsor` parameter in a transaction request to conditionally enable gas sponsorship, which your app can integrate with. Based on whether a given meter is exceeded, the app
can conditionally choose to send a gas sponsored transaction or fallback to a non-sponsored submission. This allows the app to create a stopgap in spend based on custom metering.

## Step 1: Configure custom spending limits

To start, set up a simple policy configuration based on a daily spending limit. This strategy defines daily spending limits for each tier, resetting these limits every day, e.g. at midnight UTC.

```tsx  theme={"system"}
const LIMITS = {
  perWalletDailyCents: 200, // $2 per wallet per day
  perUserDailyCents: 500, // $5 per user per day
  perAppDailyCents: 10000 // $100 per app per day
};
```

## Step 2: Set up spend tracking

To actually know how much gas your app has consumed, set up a storage system to track spending.

```tsx  theme={"system"}
interface SpendTracker {
  date: string; // YYYY-MM-DD
  spentCents: number;
}

const walletSpend = new Map<string, SpendTracker>();
const userSpend = new Map<string, SpendTracker>();
let appSpend: SpendTracker = {date: '', spentCents: 0};
```

## Step 3: Estimate transaction costs

Define cost estimates per chain. For production use, implement dynamic cost estimation based on current gas prices.

In practice, your app could also adjust the cost multipliers dynamically based on the type of transaction and a given chain. For example, recording a higher multiple of gas spend for a transaction on Solana that is also an SPL token transfer.

```tsx  theme={"system"}
const CHAIN_COSTS: Record<string, number> = {
  'eip155:1': 100, // Ethereum: ~$1
  'eip155:8453': 5, // Base: ~$0.05
  'solana:mainnet': 1 // Solana: ~$0.01
};

function estimateCostCents(chainId: string): number {
  return CHAIN_COSTS[chainId] || 100; // Default $1
}
```

## Step 4: Implement rate limit checks

Check spending against all tiers based on current date before allowing sponsorship.

```tsx  theme={"system"}
function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

function canSponsor(
  walletAddress: string,
  userId: string,
  costCents: number
): {allowed: boolean; reason?: string} {
  const today = getToday();

  // Level 1: Check wallet limit
  let walletTracker = walletSpend.get(walletAddress);
  if (!walletTracker || walletTracker.date !== today) {
    walletTracker = {date: today, spentCents: 0};
  }

  if (walletTracker.spentCents + costCents > LIMITS.perWalletDailyCents) {
    return {
      allowed: false,
      reason: `Wallet daily limit of $${LIMITS.perWalletDailyCents / 100} reached`
    };
  }

  // Level 2: Check user limit
  let userTracker = userSpend.get(userId);
  if (!userTracker || userTracker.date !== today) {
    userTracker = {date: today, spentCents: 0};
  }

  if (userTracker.spentCents + costCents > LIMITS.perUserDailyCents) {
    return {
      allowed: false,
      reason: `User daily limit of $${LIMITS.perUserDailyCents / 100} reached`
    };
  }

  // Level 3: Check app limit
  if (appSpend.date !== today) {
    appSpend = {date: today, spentCents: 0};
  }

  if (appSpend.spentCents + costCents > LIMITS.perAppDailyCents) {
    return {
      allowed: false,
      reason: `App daily limit of $${LIMITS.perAppDailyCents / 100} reached`
    };
  }

  return {allowed: true};
}
```

## Step 5: Record spending after transactions

Update all spending trackers when a sponsored transaction is allowed and is successfully submitted.

```tsx  theme={"system"}
function recordSpend(walletAddress: string, userId: string, costCents: number): void {
  const today = getToday();

  // Update wallet tracker
  let walletTracker = walletSpend.get(walletAddress);
  if (!walletTracker || walletTracker.date !== today) {
    walletTracker = {date: today, spentCents: 0};
  }
  walletTracker.spentCents += costCents;
  walletSpend.set(walletAddress, walletTracker);

  // Update user tracker
  let userTracker = userSpend.get(userId);
  if (!userTracker || userTracker.date !== today) {
    userTracker = {date: today, spentCents: 0};
  }
  userTracker.spentCents += costCents;
  userSpend.set(userId, userTracker);

  // Update app tracker
  if (appSpend.date !== today) {
    appSpend = {date: today, spentCents: 0};
  }
  appSpend.spentCents += costCents;
}
```

## Step 6: Send transactions with conditional sponsorship

Integrate the rate limiting logic with Privy's transaction API.

```tsx  theme={"system"}
async function sendTransaction({userId, walletAddress, chainId, transaction}) {
  const estimatedCostCents = estimateCostCents(chainId);
  const {allowed, reason} = canSponsor(walletAddress, userId, estimatedCostCents);

  const response = await fetch(`https://api.privy.io/v1/wallets/${walletAddress}/rpc`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'privy-app-id': process.env.PRIVY_APP_ID!,
      Authorization: `Bearer ${process.env.PRIVY_APP_SECRET}`
    },
    body: JSON.stringify({
      method: 'eth_sendTransaction',
      params: {
        transaction: {transaction}
      },
      caip2: chainId,
      sponsor: allowed // Conditionally sponsor based on limits
    })
  });

  if (response.ok) {
    const result = await response.json();

    // Record spend if sponsored
    if (allowed) {
      recordSpend(walletAddress, userId, estimatedCostCents);
    } else {
      console.log(reason);
    }
  }
}
```

## Advanced considerations

Some additional directions to explore for more advanced custom rate limiting:

* Replace in-memory rate limit storage with persistent storage, e.g. Redis
* For smoother limits, consider implementing sliding window rate limiting
* Implement rate limit counters for number of total transactions sent in addition to transaction dollar volume. For example, a rate limit to allow at most 100 transactions per day
* Implement per-transaction limits. For example, reject a transaction if its gas cost estimate prior to submission is over \$1

## Related resources

<CardGroup cols={2}>
  <Card title="Gas sponsorship overview" icon="gas-pump" href="/wallets/gas-and-asset-management/gas/overview">
    Learn about Privy's gas sponsorship engine
  </Card>

  <Card title="Send a transaction" icon="paper-plane" href="/wallets/using-wallets/ethereum/send-a-transaction">
    Guide to sending transactions with Privy
  </Card>
</CardGroup>
\n