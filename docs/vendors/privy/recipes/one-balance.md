> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Integrating OneBalance

[OneBalance](https://docs.onebalance.io/) is a framework for setting up [Credible Accounts](https://docs.onebalance.io/technical-details/onebalance-accounts) for users, that allow them to use their balance on any EVM chain for transactions on any other EVM chain. This allows your app to abstract away the concept of "chains" for end users, and makes it significantly simpler to use balances across multiple EVM chains without the UX friction of explicitly bridging between them.

You can easily [integrate OneBalance with Privy](https://docs.onebalance.io/chain-abstraction-suite/getting-started-guide-for-privy-less-than-greater-than-onebalance) to abstract users' embedded wallet balances across the various chains that your app might support.

Get started with the steps below, or check out [the sample app](https://github.com/OneBalance-io/integration-examples/blob/main/privy/src/features/quote/sign-quote.ts) for a full walkthrough!

## 1. Set up OneBalance accounts for users

To start, create OneBalance accounts for your users and deposit any user assets to the account to set it up for executing transactions.

Follow the guide [here](https://docs.onebalance.io/chain-abstraction-suite/getting-started-guide-for-privy-less-than-greater-than-onebalance/step-2-setting-configurations) to create your OneBalance API key and instantiate your users' accounts and deposit their assets to it.

You can also use your OneBalance API key to fetch an aggregated balance across all the chains your app supports.

## 2. Fetch a quote for a transaction

When executing a transaction, first fetch a quote from the OneBalance API for the transaction per this [guide](https://docs.onebalance.io/chain-abstraction-suite/getting-started-guide-for-privy-less-than-greater-than-onebalance/step-5-fetch-a-quote-for-transaction-execution).

OneBalance supports swaps, transfers, and arbitrary calldata execution, supporting any transaction use case that your app might have.

## 3. Sign the transaction with the embedded wallet

Lastly, after fetching a quote for the transaction, sign the transaction using the user's embedded wallet by requesting an [EIP-712](https://github.com/ethereum/EIPs/blob/master/EIPS/eip-712.md) typed data signature, like so:

```tsx  theme={"system"}
// below interface corresponds to ChainOperationSwaggerDto on OneBalance Swagger documentation
import {ChainOperation} from '<your path to OneBalance interfaces>';
// below interface corresponds to QuoteSwaggerDto on OneBalance Swagger documentation
import {Quote} from '<your path to OneBalance interfaces>';
import {Address, createWalletClient, custom, Hash} from 'viem';

import {ConnectedWallet} from '@privy-io/react-auth';

const signTypedDataWithPrivy =
  (embeddedWallet: ConnectedWallet) =>
  async (typedData: any): Promise<Hash> => {
    const provider = await embeddedWallet.getEthereumProvider();
    const walletClient = createWalletClient({
      transport: custom(provider),
      account: embeddedWallet.address as Address
    });

    return walletClient.signTypedData(typedData);
  };

const signOperation =
  (embeddedWallet: ConnectedWallet) =>
  async (operation: ChainOperation): Promise<ChainOperation> => {
    const signature = await signTypedDataWithPrivy(embeddedWallet)(operation.typedDataToSign);

    return {
      ...operation,
      userOp: {...operation.userOp, signature}
    };
  };

export const signQuote = async (quote: Quote, embeddedWallet: ConnectedWallet) => {
  const signWithEmbeddedWallet = signOperation(embeddedWallet);

  const signedQuote = {
    ...quote
  };

  signedQuote.originChainsOperations = await Promise.all(
    quote.originChainsOperations.map(signWithEmbeddedWallet)
  );
  if (quote.destinationChainOperation) {
    signedQuote.destinationChainOperation = await signWithEmbeddedWallet(
      quote.destinationChainOperation
    );
  }
  return signedQuote;
};
```

Once you have successfully signed the transaction, you can [execute the transaction with the OneBalance API](https://docs.onebalance.io/chain-abstraction-suite/getting-started-guide-for-privy-less-than-greater-than-onebalance/step-7-executing-transactions) and track its execution status.

**That's it! Your users can now transact on any chain with a unified balance!**
\n