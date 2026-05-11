> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Integrating smart accounts with wagmi

If your app uses wagmi and one of Privy's account abstraction integrations to set up smart accounts for the embedded wallet, you can configure wagmi to reflect the smart account for the embedded wallet instead of the externally-owned account (e.g. signer) by following the instructions below.

## Resources

<CardGroup cols={1}>
  <Card title="Wagmi starter template" icon="github" href="https://github.com/privy-io/examples/tree/main/examples/privy-next-wagmi" arrow>
    Complete starter repository showcasing Privy's wagmi integration with smart accounts and
    embedded wallets.
  </Card>
</CardGroup>

## 0. Setup

This guide assumes that you have already integrated both Privy and wagmi into your app, and are now looking to set up wagmi with smart accounts.

If you have not yet set up the basic integration, please first follow the [Privy quickstart](/basics/react/quickstart) and our [wagmi integration guide](/wallets/connectors/ethereum/integrations/wagmi).

## 1. Initialize an EIP1193 provider for the smart account

Once you've set up your app with wagmi, implement a function that initializes the smart account of your choice (Kernel, SimpleAccount, Biconomy, etc.) from the Privy embedded wallet.

As a parameter, the function should accept an object with a `signer` field that contains a viem [`EIP1193Provider`](https://github.com/wevm/viem/blob/74dbb2e7276af349bc03988eca5ec99b83292e61/src/types/eip1193.ts#L26) for the Privy embedded wallet. It should then initialize a smart account, using the embedded wallet as a signer, and should return a Promise for a viem [`EIP1193Provider`](https://github.com/wevm/viem/blob/74dbb2e7276af349bc03988eca5ec99b83292e61/src/types/eip1193.ts#L26) for the smart account.The function should have the following type:

```tsx  theme={"system"}
async ({signer}: {signer: EIP1193Provider}) => Promise<EIP1193Provider>;
```

As an example, if you are using Privy alongside ZeroDev for smart account support, you can define this function like so:

```tsx  theme={"system"}
import {signerToEcdsaValidator} from '@zerodev/ecdsa-validator';
import {
  createKernelAccount,
  createZeroDevPaymasterClient,
  createKernelAccountClient,
  KernelEIP1193Provider,
  KernelAccountClient
} from '@zerodev/sdk';
import {getEntryPoint, KERNEL_V3_1} from '@zerodev/sdk/constants';
import {http, createPublicClient, EIP1193Provider} from 'viem';
import {baseSepolia} from 'viem/chains';

// Create a public client
const publicClient = createPublicClient({
  transport: http(process.env.BUNDLER_RPC)
});

const entryPoint = getEntryPoint('0.7');
const kernelVersion = KERNEL_V3_1;

export const signerToZeroDevSmartAccount = async ({
  signer
}: {
  signer: EIP1193Provider;
}): Promise<EIP1193Provider> => {
  // Create an ECDSA validator using the EIP1193Provider directly
  const ecdsaValidator = await signerToEcdsaValidator(publicClient, {
    signer: signer,
    entryPoint,
    kernelVersion
  });

  // Create a Kernel account
  const kernelAccount = await createKernelAccount(publicClient, {
    plugins: {
      sudo: ecdsaValidator
    },
    entryPoint,
    kernelVersion
  });

  // Initialize a Kernel (smart account) client from the signer
  const kernelClient = createKernelAccountClient({
    account: kernelAccount,
    chain: baseSepolia,
    bundlerTransport: http(process.env.BUNDLER_RPC),
    client: publicClient,
    paymaster: {
      getPaymasterData: async ({userOperation}) => {
        const paymasterClient = createZeroDevPaymasterClient({
          chain: baseSepolia,
          transport: http(process.env.PAYMASTER_RPC),
          entryPoint
        });
        return paymasterClient.sponsorUserOperation({
          userOperation,
          entryPoint
        });
      }
    }
  }) as KernelAccountClient;

  // Get an EIP1193Provider for the Kernel smart account and return it
  const kernelProvider = new KernelEIP1193Provider(kernelClient);
  return kernelProvider as EIP1193Provider;
};
```

## 2. Use the smart account's EIP1193Provider to register a wagmi connector

Next, import the `useEmbeddedSmartAccountConnector` hook from `@privy-io/wagmi`. This hook allows you to register a smart account connector for wagmi that replaces the regular embedded wallet connector.

```tsx  theme={"system"}
import {useEmbeddedSmartAccountConnector} from '@privy-io/wagmi';
```

Now, call the `useEmbeddedSmartAccountConnector` hook to register a smart account connector with wagmi. As a parameter to the hook, pass an object with the following fields:

| Field                       | Type                                                                      | Description                                                                                                                                                                                   |
| --------------------------- | ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `getSmartAccountFromSigner` | `async ({signer}: {signer: EIP1193Provider}) => Promise<EIP1193Provider>` | A function that takes an `EIP1193Provider` for the user's embedded wallet and converts it to an `EIP1193Provider` for the smart account. This is the same function you implemented in step 1. |

<Info>
  **The `useEmbeddedSmartAccountConnector` hook must be mounted at all times when using wagmi with
  the smart account.** We recommend calling the hook in a component close to the root of your
  application.
</Info>

As an example, if you are using Privy alongside ZeroDev for smart account support, you might call the hook like so:

```tsx  theme={"system"}
// This hook must be mounted whenever using wagmi with the smart account
// See step 1 for the implementation of `signerToZeroDevSmartAccount`
useEmbeddedSmartAccountConnector({
  getSmartAccountFromSigner: signerToZeroDevSmartAccount
});
```

**That's it! You've now registered a smart account connector for the embedded wallet with Privy's wagmi integration, and can use wagmi hooks to interface with the smart account 🎉.**

<Info>
  Currently, Privy's wagmi integration only supports using a smart account with **embedded wallets**, not external wallets (e.g. MetaMask). With the setup above, if a user has an embedded wallet, the smart account connector will be the *only* wallet connected to wagmi.

  If a user does not have an embedded wallet and is using an external wallet, wagmi will interface with the external wallets as usual.
</Info>
\n