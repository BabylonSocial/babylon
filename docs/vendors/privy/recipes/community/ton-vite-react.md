> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Getting started with Privy and TON (Vite + React)

<div style={{marginBottom: '1rem'}}>
  <Badge variant="neutral">Author(s): STON.fi Team</Badge>
</div>

<Warning>
  This guide was contributed by the STON.fi Team, and has not been validated by Privy. Please review
  and test thoroughly before using in production. If you find a bug or problem with this resource,
  please let Privy support know and we'll alert STON.fi Team.
</Warning>

This guide demonstrates how to integrate Privy with the TON blockchain in a Vite + React app to enable wallet login as well as message and transaction signing.

### Resources

<CardGroup cols={2}>
  <Card title="Privy TON Wallets" icon="wallet" href="/wallets/using-wallets/other-chains" arrow>
    Learn how to use Privy embedded wallets with TON for signing messages and transactions.
  </Card>

  <Card title="React quickstart" icon="rocket" href="/basics/react/installation" arrow>
    Get started with Privy's React SDK.
  </Card>
</CardGroup>

## Creating your Privy app

<Info>
  If you haven't set up Privy yet, follow our [React quickstart guide](/basics/react/installation)
  to get your app ID and configure your app.
</Info>

## Installing with Vite

Create a new Vite + React + TypeScript application and install the required dependencies:

```bash  theme={"system"}
npm create vite@latest privy-ton-app --template react-ts
cd privy-ton-app
```

Install the required packages for TON integration:

```bash  theme={"system"}
npm install @privy-io/react-auth @ton/ton viem
```

Additionally, install the Node.js polyfills plugin for Vite, which is necessary to provide Buffer and other Node.js APIs in the browser environment (required by TON libraries):

```bash  theme={"system"}
npm install -D vite-plugin-node-polyfills
```

Next, install Tailwind CSS and its Vite plugin:

```bash  theme={"system"}
npm install -D tailwindcss @tailwindcss/vite
```

Configure the Vite plugin by updating `vite.config.js` file:

```javascript  theme={"system"}
import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import {nodePolyfills} from 'vite-plugin-node-polyfills';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    nodePolyfills({
      include: ['buffer'],
      globals: {
        Buffer: true
      }
    })
  ]
});
```

Then, import Tailwind CSS in your main CSS file. Open `src/index.css` and replace any existing code with:

```css  theme={"system"}
@import 'tailwindcss';
```

You can also remove `src/App.css` (we don't need it), and remove the import statement `import './App.css'` from `src/App.tsx` if it exists.

<Tip>
  For simplicity, this guide uses Tailwind CSS for styling the components. The setup for Tailwind
  CSS is already included in the instructions above, so you don't need to set it up separately.
</Tip>

### Environment variables

Vite requires environment variables to be prefixed with `VITE_`:

```bash  theme={"system"}
# .env (or .env.development)
# Get your Privy App ID from https://dashboard.privy.io after creating an app
VITE_PRIVY_APP_ID=your_privy_app_id
# You can get a free API key from https://toncenter.com/
VITE_TON_API_KEY=your_toncenter_api_key
```

## Setting up the app entry point

Set up the main entry point with the Privy provider directly in your main.tsx file:

```tsx  theme={"system"}
// src/main.tsx
import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import {PrivyProvider} from '@privy-io/react-auth';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PrivyProvider
      appId={import.meta.env.VITE_PRIVY_APP_ID}
      config={{
        loginMethods: ['email']
      }}
    >
      <App />
    </PrivyProvider>
  </StrictMode>
);
```

## Using Privy in your app

With Privy integrated, you can authenticate users, generate embedded wallets, and facilitate message and transaction signing.

### Log in with Privy

To log in users with Privy, use the `useLogin` hook:

```tsx  theme={"system"}
// src/components/LoginButton.tsx
import {useLogin} from '@privy-io/react-auth';

export function LoginButton() {
  const {login} = useLogin({
    onComplete: (user) => {
      console.log('User logged in:', user);
    }
  });

  return (
    <button className="bg-blue-500 text-white px-4 py-2 rounded-md" onClick={login}>
      Log in with Privy
    </button>
  );
}
```

### Creating a TON embedded wallet

First, create a custom hook to access the TON wallet from Privy's linked accounts:

```tsx  theme={"system"}
// src/hooks/useTonWallet.ts
import {usePrivy} from '@privy-io/react-auth';

export function useTonWallet() {
  const {user} = usePrivy();

  const tonWallet = user?.linkedAccounts?.find(
    (account) => account.type === 'wallet' && 'chainType' in account && account.chainType === 'ton'
  ) as any;

  const address = tonWallet?.address;
  const walletId = tonWallet?.id; // Wallet ID needed for Privy API calls

  return {
    tonWallet,
    address,
    walletId,
    exists: !!tonWallet
  };
}
```

Now use the `useCreateWallet` hook from extended chains to create a wallet:

```tsx  theme={"system"}
// src/components/CreateWalletButton.tsx
import {useCreateWallet} from '@privy-io/react-auth/extended-chains';
import {useTonWallet} from '../hooks/useTonWallet';

export function CreateWalletButton() {
  const {exists: hasTonWallet} = useTonWallet();
  const {createWallet} = useCreateWallet();

  const handleCreateWallet = async () => {
    try {
      const {wallet} = await createWallet({chainType: 'ton'});
      console.log('TON wallet created:', wallet.address);
    } catch (error) {
      console.error('Error creating wallet:', error);
    }
  };

  if (hasTonWallet) {
    return <div>TON wallet already created</div>;
  }

  return (
    <button className="bg-blue-500 text-white px-4 py-2 rounded-md" onClick={handleCreateWallet}>
      Create TON Wallet
    </button>
  );
}
```

### Getting wallet balance

To check the balance of a TON wallet using our custom hooks and utilities:

```tsx  theme={"system"}
// src/hooks/useTonBalance.ts
import {useTonWallet} from './useTonWallet';
import {Address, fromNano, TonClient} from '@ton/ton';
import {useEffect, useState} from 'react';

export function useTonBalance() {
  const {address} = useTonWallet();
  const [balance, setBalance] = useState<string>('0');

  useEffect(() => {
    if (!address) return;

    const fetchBalance = async () => {
      const client = new TonClient({
        endpoint: 'https://toncenter.com/api/v2/jsonRPC',
        apiKey: import.meta.env.VITE_TON_API_KEY
      });
      const nano = await client.getBalance(Address.parse(address));
      setBalance(fromNano(nano));
    };

    fetchBalance();
  }, [address]);

  return {balance, address};
}
```

### Checking wallet deployment status

TON wallets are smart contracts that need to be deployed before they can be used. Create a hook to check the deployment status:

```tsx  theme={"system"}
// src/hooks/useWalletDeployment.ts
import {useEffect, useState} from 'react';
import {TonClient, Address} from '@ton/ton';

export function useWalletDeployment(address: string | undefined) {
  const [isDeployed, setIsDeployed] = useState<boolean | null>(null);

  useEffect(() => {
    if (!address) return;

    const checkDeployment = async () => {
      try {
        const client = new TonClient({
          endpoint: 'https://toncenter.com/api/v2/jsonRPC',
          apiKey: import.meta.env.VITE_TON_API_KEY
        });
        const state = await client.getContractState(Address.parse(address));
        setIsDeployed(state.state === 'active');
      } catch (error) {
        console.error('Failed to check wallet deployment:', error);
        setIsDeployed(false);
      }
    };

    checkDeployment();
    // Check periodically
    const interval = setInterval(checkDeployment, 10000); // Every 10 seconds
    return () => clearInterval(interval);
  }, [address]);

  return {isDeployed};
}
```

### Deploying the wallet

<Tip>
  Ensure your wallet has sufficient balance (minimum 0.05 TON) before attempting deployment. The
  deployment transaction requires gas fees.
</Tip>

```tsx  theme={"system"}
// src/components/DeployWalletButton.tsx
import {usePrivy} from '@privy-io/react-auth';
import {useSignRawHash} from '@privy-io/react-auth/extended-chains';
import {toNano, internal, SendMode, TonClient, WalletContractV4} from '@ton/ton';
import {useTonBalance} from '../hooks/useTonBalance';
import {useTonWallet} from '../hooks/useTonWallet';
import {toHex} from 'viem';

export function DeployWalletButton() {
  const {getAccessToken} = usePrivy();
  const {signRawHash} = useSignRawHash();
  const {balance, address} = useTonBalance();
  const {walletId} = useTonWallet();

  const handleDeploy = async () => {
    if (!address || !walletId || parseFloat(balance) < 0.05) return;

    // Fetch wallet public key from Privy
    const accessToken = await getAccessToken();
    const res = await fetch(`https://auth.privy.io/api/v1/wallets/${walletId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'privy-app-id': import.meta.env.VITE_PRIVY_APP_ID
      }
    });

    const data = await res.json();
    let publicKey = (data.public_key || data.publicKey).replace('0x', '');

    // Strip Ed25519 prefix if present
    if (publicKey.length === 66 && publicKey.startsWith('00')) {
      publicKey = publicKey.slice(2);
    }

    // Create wallet and client
    const wallet = WalletContractV4.create({
      workchain: 0,
      publicKey: Buffer.from(publicKey, 'hex')
    });

    const client = new TonClient({
      endpoint: 'https://toncenter.com/api/v2/jsonRPC',
      apiKey: import.meta.env.VITE_TON_API_KEY
    });

    const contract = client.open(wallet);

    // Create deployment message
    const deployMessage = await wallet.createTransfer({
      seqno: 0,
      messages: [
        internal({
          value: toNano('0.01'),
          to: wallet.address,
          body: 'Deploy'
        })
      ],
      sendMode: SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS,
      signer: async (msgCell) => {
        const {signature} = await signRawHash({
          address,
          chainType: 'ton' as const,
          hash: toHex(msgCell.hash()) as `0x${string}`
        });
        return Buffer.from(signature.slice(2), 'hex');
      }
    });

    // Send the deployment message
    await contract.send(deployMessage);
  };

  return (
    <button
      onClick={handleDeploy}
      disabled={parseFloat(balance) < 0.05}
      className="bg-blue-500 text-white px-4 py-2 rounded-md"
    >
      Deploy Wallet
    </button>
  );
}
```

### Signing a message

To sign a message with a TON embedded wallet, we use the browser's crypto.subtle API to hash the message to 32 bytes (SHA-256), which is then signed via signRawHash:

```tsx  theme={"system"}
// src/components/SignMessageButton.tsx
import {useSignRawHash} from '@privy-io/react-auth/extended-chains';
import {useTonWallet} from '../hooks/useTonWallet';
import {toHex} from 'viem';

async function sha256Hex(message: string): Promise<`0x${string}`> {
  const data = new TextEncoder().encode(message);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return toHex(new Uint8Array(digest)) as `0x${string}`;
}

export function SignMessageButton() {
  const {signRawHash} = useSignRawHash();
  const {address} = useTonWallet();

  const handleSignMessage = async () => {
    if (!address) return;

    try {
      const message = 'Hello from Privy!';
      const hash = await sha256Hex(message);

      const {signature} = await signRawHash({
        address,
        chainType: 'ton' as const,
        hash
      });

      console.log('Message signature:', signature);
      alert('Message signed! Check console for signature.');
    } catch (error) {
      console.error('Error signing message:', error);
    }
  };

  return <button onClick={handleSignMessage}>Sign Message</button>;
}
```

### Sending a transaction

To send TON from the embedded wallet using browser-compatible methods:

```tsx  theme={"system"}
// src/components/SendTransactionButton.tsx
import {usePrivy} from '@privy-io/react-auth';
import {useSignRawHash} from '@privy-io/react-auth/extended-chains';
import {toNano, internal, SendMode, TonClient, WalletContractV4} from '@ton/ton';
import {useTonWallet} from '../hooks/useTonWallet';
import {useState} from 'react';
import {toHex} from 'viem';

export function SendTransactionButton() {
  const {getAccessToken} = usePrivy();
  const {signRawHash} = useSignRawHash();
  const {address, tonWallet, walletId} = useTonWallet();
  const [recipientAddress, setRecipientAddress] = useState('');
  const [sendAmount, setSendAmount] = useState('0.1');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendTransaction = async () => {
    if (!address || !tonWallet || !walletId || !recipientAddress) {
      alert('Please enter a recipient address');
      return;
    }

    try {
      setIsLoading(true);

      // Get access token and fetch public key from Privy API using wallet ID
      const accessToken = await getAccessToken();

      const res = await fetch(`https://auth.privy.io/api/v1/wallets/${walletId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'privy-app-id': import.meta.env.VITE_PRIVY_APP_ID
        }
      });

      if (!res.ok) throw new Error('Failed to fetch wallet public key');
      const data = await res.json();
      let publicKey = (data.public_key || data.publicKey).replace('0x', '');

      // Strip Ed25519 prefix if present
      if (publicKey.length === 66 && publicKey.startsWith('00')) {
        publicKey = publicKey.slice(2);
      }

      const amount = toNano(sendAmount);

      // Create wallet contract
      const wallet = WalletContractV4.create({
        workchain: 0,
        publicKey: Buffer.from(publicKey, 'hex')
      });

      // Create TON client
      const tonApiKey = import.meta.env.VITE_TON_API_KEY as string | undefined;
      const client = new TonClient({
        endpoint: 'https://toncenter.com/api/v2/jsonRPC',
        apiKey: tonApiKey
      });

      const seqno = await client.open(wallet).getSeqno();

      const transfer = await wallet.createTransfer({
        seqno,
        messages: [
          internal({
            value: amount,
            to: recipientAddress,
            body: 'Transfer from Privy'
          })
        ],
        sendMode: SendMode.PAY_GAS_SEPARATELY,
        signer: async (msgCell) => {
          const hash = msgCell.hash();
          const hashHex = toHex(hash) as `0x${string}`;
          const {signature} = await signRawHash({
            address,
            chainType: 'ton' as const,
            hash: hashHex
          });
          return Buffer.from(signature.slice(2), 'hex');
        }
      });

      await client.open(wallet).send(transfer);
      console.log('Transaction sent');
      alert('Transaction sent successfully!');
    } catch (error) {
      console.error('Error sending transaction:', error);
      alert('Failed to send transaction');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <input
        type="text"
        placeholder="Recipient address (EQ...)"
        value={recipientAddress}
        onChange={(e) => setRecipientAddress(e.target.value)}
        className="w-full p-2 border rounded"
      />
      <input
        type="text"
        placeholder="Amount in TON"
        value={sendAmount}
        onChange={(e) => setSendAmount(e.target.value)}
        className="w-full p-2 border rounded"
      />
      <button
        onClick={handleSendTransaction}
        disabled={isLoading || !recipientAddress}
        className="w-full bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 disabled:opacity-50"
      >
        {isLoading ? 'Sending...' : `Send ${sendAmount} TON`}
      </button>
    </div>
  );
}
```

### Wallet deployment status component

Create a component to inform users about wallet deployment:

```tsx  theme={"system"}
// src/components/WalletDeployStatus.tsx
import {useWalletDeployment} from '../hooks/useWalletDeployment';
import {useTonBalance} from '../hooks/useTonBalance';
import {DeployWalletButton} from './DeployWalletButton';

export function WalletDeployStatus({address}: {address: string}) {
  const {isDeployed} = useWalletDeployment(address);
  const {balance} = useTonBalance();

  // Don't show anything if wallet is deployed or still checking
  if (!address || isDeployed === null || isDeployed) {
    return null;
  }

  const hasSufficientBalance = balance && parseFloat(balance) >= 0.05;

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
      <div className="flex items-start gap-3">
        <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>

        <div className="flex-1">
          <h3 className="text-sm font-medium text-yellow-800">Wallet Not Deployed</h3>
          <p className="text-sm text-yellow-700 mt-1">
            Your TON wallet needs to be deployed before you can send transactions or make swaps.
          </p>

          {hasSufficientBalance ? (
            <div className="mt-3">
              <p className="text-sm font-semibold text-green-700 mb-2">
                ✓ Your wallet has {balance} TON (minimum 0.05 TON required)
              </p>
              <DeployWalletButton />
            </div>
          ) : (
            <div className="mt-3">
              <p className="text-sm font-medium text-yellow-700">To deploy your wallet:</p>
              <ol className="list-decimal list-inside text-sm text-yellow-700 mt-1">
                <li>Send at least 0.05 TON to your wallet address</li>
                <li>Click "Deploy Wallet" once funded</li>
              </ol>
              <div className="mt-2 p-2 bg-yellow-100 rounded">
                <p className="text-xs font-medium text-yellow-800">Your wallet address:</p>
                <p className="text-xs font-mono mt-1 break-all">{address}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

## Complete example container

Here's the complete application that brings together all the components we've created:

```tsx  theme={"system"}
// src/components/TonWalletManager.tsx
import {usePrivy} from '@privy-io/react-auth';
import {useTonWallet} from '../hooks/useTonWallet';
import {useTonBalance} from '../hooks/useTonBalance';
import {useWalletDeployment} from '../hooks/useWalletDeployment';
import {LoginButton} from './LoginButton';
import {CreateWalletButton} from './CreateWalletButton';
import {WalletDeployStatus} from './WalletDeployStatus';
import {SignMessageButton} from './SignMessageButton';
import {SendTransactionButton} from './SendTransactionButton';

export function TonWalletManager() {
  const {user, logout, authenticated} = usePrivy();
  const {address, exists} = useTonWallet();
  const {balance} = useTonBalance();
  const {isDeployed} = useWalletDeployment(address);

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <h1 className="text-2xl font-bold mb-4">TON Wallet Manager</h1>
          <p className="mb-4">Please login to manage your TON wallet</p>
          <LoginButton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-8">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">TON Wallet Manager</h1>
          <button onClick={logout} className="text-red-500 hover:text-red-700">
            Logout
          </button>
        </div>

        <div className="mb-4">
          <p className="text-gray-600">User: {user?.email?.address}</p>
        </div>

        {!exists ? (
          <div className="mb-6">
            <CreateWalletButton />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Show deployment warning if wallet is not deployed */}
            {address && <WalletDeployStatus address={address} />}

            <div className="bg-gray-50 p-4 rounded">
              <p className="font-semibold">Wallet Address:</p>
              <p className="text-sm break-all font-mono">{address}</p>
              <p className="mt-2">
                <span className="font-semibold">Balance:</span> {balance} TON
              </p>
              {isDeployed && <p className="text-sm text-green-600 mt-1">✓ Wallet is deployed</p>}
            </div>

            {/* Only show transaction functions if wallet is deployed */}
            {isDeployed && (
              <>
                <div className="flex gap-2">
                  <SignMessageButton />
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-2">Send TON</h3>
                  <SendTransactionButton />
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
```

## Creating the main App component

The App.tsx component will contain your main application logic:

```tsx  theme={"system"}
// src/App.tsx
import {TonWalletManager} from './components/TonWalletManager';

export default function App() {
  return <TonWalletManager />;
}
```

## Run

```bash  theme={"system"}
npm run dev
```

Open the printed local URL (typically [http://localhost:5173](http://localhost:5173)).

## Summary

1. **Configure env**
   * In `.env` (or `.env.development`), set:
   * `VITE_PRIVY_APP_ID=<your app id>`
   * `VITE_TON_API_KEY=<optional toncenter api key>`

2. **Start the app**
   * Run `npm run dev` and open the local URL.

3. **Log in**
   * Click **Log in with Privy** (email auth).

4. **Create a TON wallet** (once)
   * If you don't have one yet, click **Create TON Wallet**.

5. **Fund the wallet**
   * Send ≥ 0.05 TON to the wallet address shown in the UI.

6. **Deploy the wallet**
   * Click **Deploy Wallet** once funded.
   * Wait until you see **✓ Wallet is deployed**.

7. **Sign a message**
   * Click **Sign Message** to sign an example message (check the console for the signature).

8. **Send TON**
   * Enter **Recipient address** (EQ...) and **Amount in TON**.
   * Click **Send ... TON** and wait for the success notice.
\n