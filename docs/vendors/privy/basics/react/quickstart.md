> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Quickstart

> Learn how to authenticate users, create embedded wallets, and send transactions in your React app

## 0. Prerequisites

This guide assumes that you have completed the [Setup](/basics/react/setup) guide.

## 1. Enable a user to log in via email

<Tip>
  This quickstart guide will demonstrate how to authenticate a user with a one time password as an
  example, but Privy supports many authentication methods. Explore our [Authentication
  docs](/authentication/overview) to learn about other methods such as socials, passkeys, and
  external wallets to authenticate users in your app.
</Tip>

**To authenticate a user via their email address, use the React SDK's `useLoginWithEmail` hook.**

```tsx  theme={"system"}
import {useLoginWithEmail} from '@privy-io/react-auth';
...
const {sendCode, loginWithCode} = useLoginWithEmail();
```

Ensure that this hook is mounted in a component that is wrapped by the [PrivyProvider](/basics/react/setup#initializing-privy).
You can use the returned methods **`sendCode`** and **`loginWithCode`** to authenticate your user per the instructions below.

### Send an OTP

Send a one-time passcode (OTP) to the user's **email** by passing their email address to the **`sendCode`** method returned from `useLoginWithEmail`:

```tsx  theme={"system"}
import {useState} from 'react';
import {useLoginWithEmail} from '@privy-io/react-auth';

export default function LoginWithEmail() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const {sendCode, loginWithCode} = useLoginWithEmail();

  return (
    <div>
      <input onChange={(e) => setEmail(e.currentTarget.value)} value={email} />
      <button onClick={() => sendCode({email})}>Send Code</button>
      <input onChange={(e) => setCode(e.currentTarget.value)} value={code} />
      <button onClick={() => loginWithCode({code})}>Login</button>
    </div>
  );
}
```

## 2. Create an embedded wallet for the user

Your app can configure Privy to [**automatically** create wallets](/basics/react/advanced/automatic-wallet-creation) for your users as part of their **login** flow. The embedded wallet will be generated and linked to the user object upon authentication.

Alternatively your app can [**manually** create wallets](/wallets/wallets/create/create-a-wallet) for users when required.

<Info>Privy can provision wallets for your users on both **Ethereum** and **Solana**.</Info>

## 3. Send a transaction with the embedded wallet

<Tabs>
  <Tab title="EVM">
    With the users' embedded wallet, your application can now prompt the user to sign and send transactions.

    ```tsx  theme={"system"}
    import {useSendTransaction} from '@privy-io/react-auth';
    export default function SendTransactionButton() {
      const {sendTransaction} = useSendTransaction();
      const onSendTransaction = async () => {
        sendTransaction({
          to: '0xE3070d3e4309afA3bC9a6b057685743CF42da77C',
          value: 100000
        });
      };

      return <button onClick={onSendTransaction}>Send Transaction</button>;
    }
    ```

    <Tip>
      [Learn more](/wallets/using-wallets/ethereum/send-a-transaction) about sending transactions with
      the embedded wallet. Privy enables you to take many actions on the embedded wallet, including
      [sign a message](/wallets/using-wallets/ethereum/sign-a-message), [sign typed
      data](/wallets/using-wallets/ethereum/sign-typed-data), and [sign a
      transaction](/wallets/using-wallets/ethereum/sign-a-transaction).
    </Tip>
  </Tab>

  <Tab title="Solana">
    With the users' embedded wallet, your application can now prompt the user to sign and send transactions.

    ```tsx  theme={"system"}
    import {useSendTransaction} from '@privy-io/react-auth/solana';
    import {Connection, Transaction, VersionedTransaction, SystemProgram, LAMPORTS_PER_SOL} from '@solana/web3.js';

    export default function SendTransactionButton() {
      const {sendTransaction} = useSendTransaction();
      const connection = new Connection('https://api.mainnet-beta.solana.com');

      // Create a new transaction
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: wallet.publicKey,
          toPubkey: new PublicKey('RECIPIENT_ADDRESS_HERE'),
          lamports: 0.1 * LAMPORTS_PER_SOL
        })
      );

      const onSendTransaction = async () => {
        sendTransaction({
          transaction,
          connection
        });
      }

      return <button onClick={onSendTransaction}>Send Transaction</button>;

    }
    ```

    <Tip>
      [Learn more](/wallets/using-wallets/solana/send-a-transaction) about sending transactions with
      the embedded wallet. Privy enables you to take many actions on the embedded wallet, including [send a transaction](/wallets/using-wallets/solana/send-a-transaction), [sign a message](/wallets/using-wallets/solana/sign-a-message), and [sign a
      transaction](/wallets/using-wallets/solana/sign-a-transaction).
    </Tip>
  </Tab>
</Tabs>

Congratulations, you have successfully been able to integrate Privy authentication and wallet into your React application!
\n