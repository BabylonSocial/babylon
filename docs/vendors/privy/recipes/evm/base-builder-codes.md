> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Integrating Base Builder Codes

[Base Builder Codes](https://base.dev) enable developers to unlock rewards by attributing onchain activity back to their applications. By appending an [ERC-8021](https://www.erc8021.com/) attribution suffix to transaction data, Base can identify which application originated each transaction and reward builders accordingly.

Privy's `dataSuffix` plugin makes this integration seamless—once configured, the attribution suffix is automatically appended to all transactions sent through your app, including both EOA transactions and ERC-4337 smart wallet user operations.

## Prerequisites

* A Privy app with `@privy-io/react-auth` v3.13.0+ configured
* A registered Builder Code from [base.dev](https://base.dev) > Settings > Builder Codes

## Installation

Install the `ox` library to generate ERC-8021 compliant data suffixes:

```bash  theme={"system"}
npm install ox
```

## Integration

Import the `dataSuffix` plugin from Privy and the `Attribution` utility from `ox`:

```tsx  theme={"system"}
import {PrivyProvider, dataSuffix} from '@privy-io/react-auth';
import {Attribution} from 'ox/erc8021';

// Generate the ERC-8021 attribution suffix with your Builder Code
const ERC_8021_ATTRIBUTION_SUFFIX = Attribution.toDataSuffix({
  codes: ['YOUR-BUILDER-CODE'] // Replace with your code from base.dev > Settings > Builder Codes
});

function App() {
  return (
    <PrivyProvider
      appId="your-privy-app-id"
      config={{
        ...yourOtherConfig,
        plugins: [dataSuffix(ERC_8021_ATTRIBUTION_SUFFIX)]
      }}
    >
      {/* your app's content */}
    </PrivyProvider>
  );
}
```

**That's it!** Once configured, every transaction sent through your Privy-powered app will include the ERC-8021 attribution suffix, enabling you to unlock rewards from Base.

## How it works

The `dataSuffix` plugin automatically appends your attribution data to:

| Transaction Type         | Where Suffix is Appended |
| ------------------------ | ------------------------ |
| EOA transactions         | `transaction.data` field |
| Smart wallets (ERC-4337) | `userOp.callData` field  |

The ERC-8021 suffix follows a standardized format that Base's sequencer can parse:

```
TX_DATA + [CODES_LENGTH][CODES] + [SCHEMA_ID] + [ERC_MARKER]
```

This allows Base to attribute transactions to your app without requiring any changes to your existing transaction logic or smart contracts.

<Info>
  Base Builder Codes rewards are specific to transactions on Base mainnet and Base Sepolia. However,
  the `dataSuffix` plugin will append the suffix to transactions on **all chains**. If you need
  chain-specific suffix behavior, please [reach out to the Privy team](https://privy.io/slack).
</Info>

<Warning>
  The `dataSuffix` plugin is not yet supported when using the
  [`@privy-io/wagmi`](/wallets/connectors/ethereum/integrations/wagmi) adapter. If you need wagmi
  support, please [contact the Privy team](https://privy.io/slack) for assistance.
</Warning>

## Resources

<CardGroup cols={2}>
  <Card title="ERC-8021 Specification" icon="book" href="https://www.erc8021.com/">
    Learn more about the ERC-8021 attribution standard.
  </Card>

  <Card title="Base Builder Codes" icon="coins" href="https://base.dev">
    Register for a Builder Code and track your rewards.
  </Card>

  <Card title="ox Library" icon="code" href="https://oxlib.sh">
    Documentation for the ox Ethereum utilities library.
  </Card>
</CardGroup>
\n