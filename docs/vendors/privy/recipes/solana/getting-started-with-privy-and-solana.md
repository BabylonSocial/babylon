> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Getting started with Privy and Solana

This guide will demonstrate how to integrate Privy with Solana to enable wallet login as well as message and transaction signing.

### Resources

<CardGroup cols={2}>
  <Card title="Github starter repository" icon="arrow-up-right-from-square" href="https://github.com/privy-io/examples/tree/main/examples/privy-next-solana" arrow>
    A starter repository for building an app with Privy and Solana.
  </Card>

  <Card title="Privy Solana Wallets" icon="wallet" href="/wallets/using-wallets/solana/sign-a-message" arrow>
    Privy Solana wallets can be a user's EOA or an embedded wallet. This guide shows how to use them
    to sign messages and transactions.
  </Card>
</CardGroup>

## Creating your Privy app

<Info>
  If you haven’t set up Privy yet, follow our [React quickstart guide](/basics/react/installation)
  to get your app ID and configure your app.
</Info>

Privy’s React SDK provides a secure way to authenticate users and manage wallets in your frontend application. Learn more about [getting started with React](/basics/react/installation).

## Configuring Privy

<Accordion title="Solana dependencies on yarn">
  For the Privy React SDK to work with Next.js using webpack, you need to add a custom webpack configuration. If you are not using Yarn, you can skip this step. Add the code below to your `next.config.ts` file:

  ```ts  theme={"system"}
  // next.config.ts
  import type {NextConfig} from 'next';

  const nextConfig: NextConfig = {
    /* config options here */
    webpack: (config) => {
      config.externals['@solana/kit'] = 'commonjs @solana/kit';
      config.externals['@solana-program/memo'] = 'commonjs @solana-program/memo';
      config.externals['@solana-program/system'] = 'commonjs @solana-program/system';
      config.externals['@solana-program/token'] = 'commonjs @solana-program/token';
      return config;
    }
  };

  export default nextConfig;
  ```
</Accordion>

In order to detect external Solana wallets, your app needs to enable Solana connectors.
If you also wish to use Privy wallets to send transactions, then you must define solana RPC clients for Privy to use.

```tsx {29} {14-21} theme={"system"}
// components/providers.tsx
'use client';

import {PrivyProvider} from '@privy-io/react-auth';
import {toSolanaWalletConnectors} from '@privy-io/react-auth/solana';
import {createSolanaRpc, createSolanaRpcSubscriptions} from '@solana/kit';
import {ReactNode} from 'react';

export function Providers({children}: {children: ReactNode}) {
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID}
      config={{
        solana: {
          rpcs: {
            'solana:mainnet': {
              rpc: createSolanaRpc('https://api.mainnet-beta.solana.com'), // or your custom RPC endpoint
              rpcSubscriptions: createSolanaRpcSubscriptions('wss://api.mainnet-beta.solana.com') // or your custom RPC endpoint
            }
          }
        },
        appearance: {
          showWalletLoginFirst: true,
          walletChainType: 'solana-only'
        },
        loginMethods: ['wallet', 'email'],
        externalWallets: {
          solana: {
            connectors: toSolanaWalletConnectors() // For detecting EOA browser wallets
          }
        },
        embeddedWallets: {
          createOnLogin: 'all-users'
        }
      }}
    >
      {children}
    </PrivyProvider>
  );
}
```

<Info>
  `config.solana.rpcs` is only required when using Privy's embedded wallet UIs (UI `signTransaction`
  and `signAndSendTransaction`). If your app only uses external Solana wallets, you can omit the
  `solana.rpcs` configuration and prepare/send transactions directly via your chosen RPC client.
</Info>

## Using Privy in your app

With Privy now integrated into your app, you can leverage its hooks to authenticate users, generate embedded wallets, and facilitate message and transaction signing.

### Log in with Privy

To log in users with Privy, you can use the `useLogin` hook from the `@privy-io/react-auth` package. This hook provides a function to log in users.

```tsx {8} theme={"system"}
// components/loginButton.tsx
'use client';
import {useLogin} from '@privy-io/react-auth';
import {useRouter} from 'next/navigation';

export function LoginButton() {
  const router = useRouter();
  const {login} = useLogin({
    onError: (error) => {
      console.error('Login error:', error);
    },
    onComplete: (user) => {
      console.log('User logged in:', user);
      // Redirect to the dashboard or another page after login
      router.replace('/dashboard');
    }
  });

  return <button onClick={login}>Log in with Privy</button>;
}
```

### Creating a Solana embedded wallet

To create a Solana embedded wallet, you can use the `useWallets` hook from `@privy-io/react-auth/solana`. This hook provides a `createWallet` function to create an embedded wallet.

```tsx  theme={"system"}
// components/createWalletButton.tsx
'use client';
import {useWallets, useCreateWallet} from '@privy-io/react-auth/solana';

export function CreateWalletButton(props: {createAdditional: boolean}) {
  const {ready} = useWallets();
  const {createWallet} = useCreateWallet();

  if (!ready) {
    return <div>Loading...</div>;
  }

  const handleCreateWallet = async () => {
    try {
      // If createAdditional is true, it will create an additional HD wallet for the user.
      const wallet = await createWallet({createAdditional: props.createAdditional});
      console.log('Embedded wallet created:', wallet);
    } catch (error) {
      console.error('Error creating embedded wallet:', error);
    }
  };

  return <button onClick={handleCreateWallet}>Create Embedded Wallet</button>;
}
```

### Using wallets

Privy provides the `useSignMessage`, `useSignTransaction`, and `useSignAndSendTransaction` hooks to sign messages and transactions with embedded wallets. You can also use linked EOA wallets directly for signing messages and transactions.

#### Signing a message

To sign a message with an embedded wallet, use the `useSignMessage` hook:

```tsx  theme={"system"}
import {useSignMessage, useWallets} from '@privy-io/react-auth/solana';

const {signMessage} = useSignMessage();
const {wallets} = useWallets(); // This hook provides access to both embedded and EOA wallets
const wallet = wallets.find((w) => w.standardWallet.name === 'Privy'); // Find the first embedded wallet

const handleSignMessage = async () => {
  try {
    if (!wallet) throw new Error('No embedded wallet found');
    const signature = await signMessage({
      message: new TextEncoder().encode('Hello from Privy!'), // Solana messages are typically encoded as Uint8Array
      wallet
    });
    console.log('Message signed:', signature);
  } catch (error) {
    console.error('Error signing message:', error);
  }
};
```

This function signs a message using the first embedded wallet.

#### Preparing a transaction

Before signing or sending a transaction, you need to prepare it. Here's how you can create a simple SOL transfer transaction:

```tsx  theme={"system"}
import type {ConnectedStandardSolanaWallet} from '@privy-io/react-auth/solana';
import {
  pipe,
  createSolanaRpc,
  getTransactionEncoder,
  createTransactionMessage,
  setTransactionMessageFeePayer,
  setTransactionMessageLifetimeUsingBlockhash,
  appendTransactionMessageInstructions,
  compileTransaction,
  address,
  createNoopSigner
} from '@solana/kit';
import {getTransferSolInstruction} from '@solana-program/system';

const generateTransaction = async (wallet: ConnectedStandardSolanaWallet) => {
  // Simple SOL transfer transaction
  const amount = 1;

  const transferInstruction = getTransferSolInstruction({
    amount: BigInt(parseFloat(amount) * 1_000_000_000), // Convert SOL to lamports
    destination: address('RecipientAddressHere'),
    source: createNoopSigner(address(wallet.address))
  });

  // Configure your RPC connection to point to the correct Solana network
  const {getLatestBlockhash} = createSolanaRpc('https://api.mainnet-beta.solana.com'); // Replace with your Solana RPC endpoint
  const {value: latestBlockhash} = await getLatestBlockhash().send();

  // Create transaction using @solana/kit
  const transaction = pipe(
    createTransactionMessage({version: 0}),
    (tx) => setTransactionMessageFeePayer(address(wallet.address), tx), // Set the message fee payer
    (tx) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx), // Set recent blockhash
    (tx) => appendTransactionMessageInstructions([transferInstruction], tx), // Add your instructions to the transaction
    (tx) => compileTransaction(tx), // Compile the transaction
    (tx) => new Uint8Array(getTransactionEncoder().encode(tx)) // Finally encode the transaction
  );
  return transaction;
};
```

This code creates a transaction object that can be signed or sent later. Replace the placeholder values with actual addresses.

#### Signing a transaction

To sign a transaction, use the `useSignTransaction` hook:

```tsx  theme={"system"}
import {useSignTransaction, useWallets} from '@privy-io/react-auth/solana';

const {signTransaction} = useSignTransaction();
const {wallets} = useWallets(); // This hook provides access to both embedded and EOA wallets

const handleSignTransaction = async () => {
  try {
    const wallet = wallets.find((w) => w.standardWallet.name === 'Privy'); // Find the first embedded wallet
    if (!wallet) throw new Error('No wallet found');

    const transaction = await generateTransaction(wallet); // The transaction prepared earlier
    const transactionSignature = await signTransaction({
      transaction,
      wallet
    });
    console.log('Transaction signed:', transactionSignature);
  } catch (error) {
    console.error('Error signing transaction:', error);
  }
};
```

This function signs the prepared transaction using the embedded wallet and a specified Solana RPC endpoint.

#### Sending a transaction

To send a signed transaction to the Solana network, use the `useSignAndSendTransaction` hook:

```tsx  theme={"system"}
import {useSignAndSendTransaction, useWallets} from '@privy-io/react-auth/solana';

const {signAndSendTransaction} = useSignAndSendTransaction();
const {wallets} = useWallets(); // This hook provides access to both embedded and EOA wallets

const handleSendTransaction = async () => {
  try {
    const wallet = wallets.find((w) => w.standardWallet.name === 'Privy'); // Find the first embedded wallet
    if (!wallet) throw new Error('No wallet found');

    const transaction = await generateTransaction(); // The transaction prepared earlier
    const transactionSignature = await signAndSendTransaction({
      transaction,
      wallet
    });
    console.log('Transaction sent:', transactionSignature);
  } catch (error) {
    console.error('Error sending transaction:', error);
  }
};
```

This function sends the signed transaction to the Solana network and logs the transaction signature.

### Conclusion

This guide has shown you how to integrate Privy with Solana into an application. You can now log in users, create embedded wallets, and sign messages and transactions using the Privy React SDK.
\n