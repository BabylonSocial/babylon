> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Swapping crypto using Privy and Omniston

<div style={{marginBottom: '1rem'}}>
  <Badge variant="neutral">Author(s): STON.fi Team</Badge>
</div>

<Warning>
  This guide was contributed by the STON.fi Team, and has not been validated by Privy. Please review
  and test thoroughly before using in production. If you find a bug or problem with this resource,
  please let Privy support know and we'll alert STON.fi Team.
</Warning>

This guide extends the [Getting started with Privy and TON](/recipes/community/ton-vite-react) application by adding token swap functionality using Omniston - a protocol that aggregates liquidity from multiple DEXes including STON.fi and DeDust.

## Prerequisites

Before starting this guide, ensure you have:

* Completed the [Getting started with Privy and TON](/recipes/community/ton-vite-react) guide
* A working React app with Privy authentication for TON
* A deployed and funded TON wallet (minimum 0.05 TON for gas fees)
* The existing utilities and hooks from the previous guide already implemented

## Step 1: Install Omniston SDK and STON.fi API

From your existing project root, install the Omniston SDK and STON.fi API:

```bash  theme={"system"}
pnpm add @ston-fi/omniston-sdk-react @ston-fi/api
```

## Step 2: Add Omniston provider

Update your `src/main.tsx` to add the Omniston provider:

```tsx  theme={"system"}
// src/main.tsx
import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {PrivyProvider} from '@privy-io/react-auth';
import {Omniston, OmnistonProvider} from '@ston-fi/omniston-sdk-react';
import './index.css';
import App from './App';

const omniston = new Omniston({apiUrl: 'wss://omni-ws.ston.fi'});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PrivyProvider appId={import.meta.env.VITE_PRIVY_APP_ID} config={{loginMethods: ['email']}}>
      <OmnistonProvider omniston={omniston}>
        <App />
      </OmnistonProvider>
    </PrivyProvider>
  </StrictMode>
);
```

## Step 3: Create asset fetching hook

Create a simple hook to fetch available tokens:

```tsx  theme={"system"}
// src/hooks/useAssets.ts
import {useState, useEffect} from 'react';
import {StonApiClient, AssetTag, type AssetInfoV2} from '@ston-fi/api';

export const useAssets = () => {
  const [assets, setAssets] = useState<AssetInfoV2[]>([]);

  useEffect(() => {
    const fetchAssets = async () => {
      try {
        const client = new StonApiClient();
        const condition = [
          AssetTag.LiquidityVeryHigh,
          AssetTag.LiquidityHigh,
          AssetTag.LiquidityMedium
        ].join(' | ');
        const result = await client.queryAssets({condition});
        setAssets(result);
      } catch (err) {
        console.error('Failed to fetch assets:', err);
      }
    };
    fetchAssets();
  }, []);

  return assets;
};
```

## Step 3.5: Add utility files

The swap hook needs some utility files to work with TON and Privy. Create these if you don't have them already:

```tsx  theme={"system"}
// src/utils/tonClient.ts
import {TonClient} from '@ton/ton';

export const getTonClient = () => {
  const apiKey = import.meta.env.VITE_TON_API_KEY;
  return new TonClient({
    endpoint: 'https://toncenter.com/api/v2/jsonRPC',
    apiKey: apiKey
  });
};
```

```tsx  theme={"system"}
// src/utils/tonAddress.ts
import {WalletContractV4} from '@ton/ton';

export function maybeStripEd25519PublicKeyPrefix(publicKey: string) {
  if (publicKey.length === 66 && publicKey.startsWith('00')) {
    return publicKey.slice(2);
  }
  return publicKey;
}

export function deriveTonWalletFromPublicKey(publicKey: string) {
  const strippedKey = maybeStripEd25519PublicKeyPrefix(publicKey);
  const publicKeyBuffer = Buffer.from(strippedKey, 'hex');
  const wallet = WalletContractV4.create({
    workchain: 0,
    publicKey: publicKeyBuffer
  });
  return {
    address: wallet.address.toString(),
    wallet
  };
}
```

```tsx  theme={"system"}
// src/utils/tonWallet.ts
import {WalletContractV4, type OpenedContract} from '@ton/ton';

export async function getWalletSeqno(contract: OpenedContract<WalletContractV4>): Promise<number> {
  try {
    return await contract.getSeqno();
  } catch {
    return 0;
  }
}

export function normalizeOmnistonValue(sendAmount: string | number | bigint): bigint {
  if (typeof sendAmount === 'string') return BigInt(sendAmount);
  if (typeof sendAmount === 'number') return BigInt(sendAmount);
  return sendAmount as bigint;
}

export async function retry<T>(
  fn: () => Promise<T>,
  options: {retries?: number; delay?: number} = {}
): Promise<T> {
  const {retries = 3, delay = 1000} = options;
  let lastError: unknown;
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (i < retries) await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastError;
}
```

## Step 4: Create the swap hook

This hook handles quoting, building transactions, signing with Privy, and tracking:

<Tip>
  This hook integrates Omniston's RFQ (Request for Quote) system to find the best swap rates across
  multiple DEXes, then builds and signs transactions using Privy's embedded wallet.
</Tip>

```tsx  theme={"system"}
// src/hooks/useOmnistonSwap.ts
import {useState, useCallback} from 'react';
import {usePrivy} from '@privy-io/react-auth';
import {useSignRawHash} from '@privy-io/react-auth/extended-chains';
import {
  useRfq,
  useOmniston,
  useTrackTrade,
  SettlementMethod,
  Blockchain,
  GaslessSettlement,
  type QuoteResponseEvent_QuoteUpdated
} from '@ston-fi/omniston-sdk-react';
import {Address, Cell, internal, SendMode, toNano, WalletContractV4} from '@ton/ton';
import {toHex} from 'viem';
import type {AssetInfoV2} from '@ston-fi/api';
import {useTonWallet} from './useTonWallet';
import {getTonClient} from '../utils/tonClient';
import {getWalletSeqno, normalizeOmnistonValue, retry} from '../utils/tonWallet';
import {deriveTonWalletFromPublicKey} from '../utils/tonAddress';

interface UseOmnistonSwapProps {
  fromAsset?: AssetInfoV2;
  toAsset?: AssetInfoV2;
  amount: string;
}

function toBaseUnits(amount: string, decimals?: number) {
  return Math.floor(parseFloat(amount) * 10 ** (decimals ?? 9)).toString();
}

export const useOmnistonSwap = ({fromAsset, toAsset, amount}: UseOmnistonSwapProps) => {
  const {user} = usePrivy();
  const {signRawHash} = useSignRawHash();
  const {address: walletAddress} = useTonWallet();
  const omniston = useOmniston();

  const [outgoingTxHash, setOutgoingTxHash] = useState('');
  const [tradedQuote, setTradedQuote] = useState<QuoteResponseEvent_QuoteUpdated | null>(null);
  const [isSwapping, setIsSwapping] = useState(false);

  const tonWallet = user?.linkedAccounts?.find(
    (account) => account.type === 'wallet' && 'chainType' in account && account.chainType === 'ton'
  );

  // Get quote from Omniston
  const {data: quote, isLoading: quoteLoading} = useRfq(
    {
      settlementMethods: [SettlementMethod.SETTLEMENT_METHOD_SWAP],
      bidAssetAddress: fromAsset
        ? {blockchain: Blockchain.TON, address: fromAsset.contractAddress}
        : undefined,
      askAssetAddress: toAsset
        ? {blockchain: Blockchain.TON, address: toAsset.contractAddress}
        : undefined,
      amount: {
        bidUnits: fromAsset && amount ? toBaseUnits(amount, fromAsset.meta?.decimals) : '0'
      },
      settlementParams: {
        gaslessSettlement: GaslessSettlement.GASLESS_SETTLEMENT_POSSIBLE,
        maxPriceSlippageBps: 500
      }
    },
    {
      enabled:
        !!fromAsset?.contractAddress &&
        !!toAsset?.contractAddress &&
        parseFloat(amount) > 0 &&
        !outgoingTxHash &&
        !isSwapping
    }
  );

  // Track trade status
  const {data: tradeStatus} = useTrackTrade(
    {
      quoteId: tradedQuote?.quote?.quoteId || '',
      traderWalletAddress: {
        blockchain: Blockchain.TON,
        address: walletAddress || ''
      },
      outgoingTxHash
    },
    {
      enabled: !!tradedQuote?.quote?.quoteId && !!walletAddress && !!outgoingTxHash
    }
  );

  const buildTransaction = useCallback(
    async (willTradedQuote: QuoteResponseEvent_QuoteUpdated) => {
      if (!walletAddress) throw new Error('Wallet not connected');

      const tx = await omniston.buildTransfer({
        quote: willTradedQuote.quote,
        sourceAddress: {blockchain: Blockchain.TON, address: walletAddress},
        destinationAddress: {blockchain: Blockchain.TON, address: walletAddress},
        gasExcessAddress: {blockchain: Blockchain.TON, address: walletAddress},
        useRecommendedSlippage: true
      });

      return tx.ton?.messages || [];
    },
    [omniston, walletAddress]
  );

  const getTxByBOC = useCallback(async (exBoc: string, walletAddr: string): Promise<string> => {
    const client = getTonClient();
    const myAddress = Address.parse(walletAddr);

    return retry(
      async () => {
        const transactions = await client.getTransactions(myAddress, {limit: 10});

        for (const tx of transactions) {
          const inMsg = tx.inMessage;
          if (inMsg?.info.type === 'external-in') {
            try {
              if (inMsg.body) {
                const inBoc = inMsg.body.toBoc().toString('base64');
                if (inBoc === exBoc) {
                  return tx.hash().toString('hex');
                }
              }
            } catch {
              const extHash = Cell.fromBase64(exBoc).hash().toString('hex');
              if (inMsg.body) {
                const inHash = inMsg.body.hash().toString('hex');
                if (extHash === inHash) {
                  return tx.hash().toString('hex');
                }
              }
            }
          }
        }
        throw new Error('Transaction not found');
      },
      {retries: 30, delay: 1000}
    );
  }, []);

  const executeSwap = useCallback(async () => {
    if (!quote || quote.type !== 'quoteUpdated' || !walletAddress || !tonWallet || !user) {
      return;
    }

    setIsSwapping(true);

    try {
      setTradedQuote(quote);

      const messages = await buildTransaction(quote);
      if (!messages || messages.length === 0) {
        throw new Error('No transaction messages generated');
      }

      const isEmbedded = tonWallet.type === 'wallet' && !tonWallet.imported && !tonWallet.delegated;
      if (!isEmbedded) {
        throw new Error('Only Privy embedded wallets are supported for swaps');
      }

      if (!tonWallet.publicKey) throw new Error('Unable to find public key');
      const {wallet: derivedWallet, address: derivedAddress} = deriveTonWalletFromPublicKey(
        tonWallet.publicKey
      );

      let wallet: WalletContractV4;
      if (derivedAddress !== walletAddress) {
        const walletAtPrivyAddress = WalletContractV4.create({
          workchain: 0,
          publicKey: derivedWallet.publicKey
        });
        wallet = {
          ...walletAtPrivyAddress,
          address: Address.parse(walletAddress)
        } as WalletContractV4;
      } else {
        wallet = derivedWallet;
      }

      const client = getTonClient();
      const contract = client.open(wallet);

      // Verify wallet is deployed
      const contractState = await client.getContractState(wallet.address);
      if (contractState.state !== 'active') {
        throw new Error('Wallet not deployed');
      }

      // Check balance
      const walletBalance = await client.getBalance(wallet.address);
      const requiredAmount = messages.reduce((sum, msg) => {
        return sum + normalizeOmnistonValue(msg.sendAmount);
      }, 0n);
      const gasReserve = toNano('0.05');
      const totalRequired = requiredAmount + gasReserve;

      if (walletBalance < totalRequired) {
        throw new Error('Insufficient balance for swap');
      }

      const seqno = await getWalletSeqno(contract);

      // Embed createTonSigner logic
      const signer = async (msgCell: Cell) => {
        const hash = msgCell.hash();
        const hexHash = toHex(hash) as `0x${string}`;
        const {signature} = await signRawHash({
          address: walletAddress,
          chainType: 'ton' as const,
          hash: hexHash
        });
        return Buffer.from(signature.slice(2), 'hex');
      };

      const internalMessages = messages.map((msg) =>
        internal({
          value: normalizeOmnistonValue(msg.sendAmount),
          to: Address.parse(msg.targetAddress),
          body: msg.payload ? Cell.fromBase64(msg.payload) : undefined,
          bounce: true
        })
      );

      const transfer = await contract.createTransfer({
        seqno,
        messages: internalMessages,
        sendMode: SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS,
        signer
      });

      await contract.send(transfer);

      const exBoc = transfer.toBoc().toString('base64');
      const txHash = await getTxByBOC(exBoc, walletAddress);

      setOutgoingTxHash(txHash);
    } catch (err: unknown) {
      console.error('Swap failed:', err);
      setTradedQuote(null);
    } finally {
      setIsSwapping(false);
    }
  }, [quote, walletAddress, tonWallet, signRawHash, buildTransaction, getTxByBOC, user]);

  return {
    quote,
    quoteLoading,
    executeSwap,
    isSwapping,
    tradeStatus
  };
};
```

## Step 5: Create the swap interface component

Build a simple swap interface:

```tsx  theme={"system"}
// src/components/SwapInterface.tsx
import {useState, useEffect} from 'react';
import type {AssetInfoV2} from '@ston-fi/api';
import {useOmnistonSwap} from '../hooks/useOmnistonSwap';
import {useAssets} from '../hooks/useAssets';

export const SwapInterface: React.FC = () => {
  const [amount, setAmount] = useState('');
  const [fromAsset, setFromAsset] = useState<AssetInfoV2 | undefined>();
  const [toAsset, setToAsset] = useState<AssetInfoV2 | undefined>();

  const assets = useAssets();

  // Set default assets when loaded
  useEffect(() => {
    if (assets.length > 0 && !fromAsset) {
      setFromAsset(assets[0]);
    }
    if (assets.length > 1 && !toAsset) {
      setToAsset(assets[1]);
    }
  }, [assets, fromAsset, toAsset]);

  const {quote, quoteLoading, executeSwap, isSwapping, tradeStatus} = useOmnistonSwap({
    fromAsset,
    toAsset,
    amount
  });

  return (
    <div className="space-y-6">
      {/* From Token */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">From</label>
        <select
          value={fromAsset?.contractAddress || ''}
          onChange={(e) => {
            const selected = assets.find((a) => a.contractAddress === e.target.value);
            setFromAsset(selected);
          }}
          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
        >
          {assets.map((asset) => (
            <option key={asset.contractAddress} value={asset.contractAddress} className="bg-white">
              {asset.meta?.symbol || asset.meta?.displayName || 'Unknown'}
            </option>
          ))}
        </select>
      </div>

      {/* To Token */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">To</label>
        <select
          value={toAsset?.contractAddress || ''}
          onChange={(e) => {
            const selected = assets.find((a) => a.contractAddress === e.target.value);
            setToAsset(selected);
          }}
          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
        >
          {assets.map((asset) => (
            <option key={asset.contractAddress} value={asset.contractAddress} className="bg-white">
              {asset.meta?.symbol || asset.meta?.displayName || 'Unknown'}
            </option>
          ))}
        </select>
      </div>

      {/* Amount */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Amount</label>
        <input
          type="text"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.0"
          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
        />
      </div>

      {/* Quote Display */}
      {quoteLoading && (
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-gray-600 text-sm">Fetching best quote...</p>
        </div>
      )}

      {quote && 'quote' in quote && (
        <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-indigo-200">
          <p className="font-semibold text-gray-800 mb-2">Quote Details</p>
          <div className="space-y-1 text-sm">
            <p className="text-gray-600">
              Provider: <span className="text-gray-800">{quote.quote.resolverName}</span>
            </p>
            <p className="text-gray-600">
              You send:{' '}
              <span className="text-gray-800">
                {(parseInt(quote.quote.bidUnits) / 10 ** (fromAsset?.meta?.decimals ?? 9)).toFixed(
                  4
                )}{' '}
                {fromAsset?.meta?.symbol}
              </span>
            </p>
            <p className="text-gray-600">
              You receive:{' '}
              <span className="text-gray-800">
                {(parseInt(quote.quote.askUnits) / 10 ** (toAsset?.meta?.decimals ?? 9)).toFixed(4)}{' '}
                {toAsset?.meta?.symbol}
              </span>
            </p>
          </div>
        </div>
      )}

      {/* Swap Button */}
      {quote && 'quote' in quote && (
        <button
          onClick={executeSwap}
          disabled={isSwapping}
          className="w-full py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02]"
        >
          {isSwapping ? 'Processing Swap...' : 'Execute Swap'}
        </button>
      )}

      {/* Trade Status */}

      {tradeStatus && (
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-600">
            {tradeStatus.status?.tradeSettled ? (
              <span className="text-green-600">Trade completed successfully</span>
            ) : (
              <span className="text-blue-600">Tracking trade...</span>
            )}
          </p>
        </div>
      )}
    </div>
  );
};
```

## Step 6: Integrate with your TonWalletManager

Add tabs to switch between wallet and swap functionality in your existing `TonWalletManager` component:

```tsx  theme={"system"}
// src/components/TonWalletManager.tsx
import {useState} from 'react';
import {usePrivy} from '@privy-io/react-auth';
import {useTonWallet} from '../hooks/useTonWallet';
import {useTonBalance} from '../hooks/useTonBalance';
import {useWalletDeployment} from '../hooks/useWalletDeployment';
import {LoginButton} from './LoginButton';
import {CreateWalletButton} from './CreateWalletButton';
import {WalletDeployStatus} from './WalletDeployStatus';
import {SignMessageButton} from './SignMessageButton';
import {SendTransactionButton} from './SendTransactionButton';
import {SwapInterface} from './SwapInterface'; // Add this import

export function TonWalletManager() {
  const {user, logout, authenticated} = usePrivy();
  const {address, exists} = useTonWallet();
  const {balance} = useTonBalance();
  const {isDeployed} = useWalletDeployment(address);
  const [activeTab, setActiveTab] = useState<'wallet' | 'swap'>('wallet'); // Add tab state

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
            {/* Add tab navigation */}
            <div className="flex space-x-2 mb-4">
              <button
                onClick={() => setActiveTab('wallet')}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                  activeTab === 'wallet'
                    ? 'bg-indigo-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Wallet
              </button>
              <button
                onClick={() => setActiveTab('swap')}
                disabled={!isDeployed}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                  activeTab === 'swap'
                    ? 'bg-indigo-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                Swap
              </button>
            </div>

            {/* Tab content */}
            {activeTab === 'wallet' ? (
              <>
                {/* Existing wallet content */}
                {address && <WalletDeployStatus address={address} />}

                <div className="bg-gray-50 p-4 rounded">
                  <p className="font-semibold">Wallet Address:</p>
                  <p className="text-sm break-all font-mono">{address}</p>
                  <p className="mt-2">
                    <span className="font-semibold">Balance:</span> {balance} TON
                  </p>
                  {isDeployed && (
                    <p className="text-sm text-green-600 mt-1">✓ Wallet is deployed</p>
                  )}
                </div>

                {isDeployed && (
                  <>
                    <SignMessageButton />
                    <SendTransactionButton />
                  </>
                )}
              </>
            ) : (
              <SwapInterface />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
```

## Step 7: Test your integration

1. Start your development server:

```bash  theme={"system"}
pnpm dev
```

2. Test the complete flow:
   * Log in with your email
   * Ensure your wallet is deployed and funded
   * Switch to the Swap tab
   * Select tokens to swap (e.g., TON → USDT)
   * Enter an amount
   * Review the quote
   * Execute the swap
   * Monitor the trade status

## Troubleshooting

### Common Issues

<Tabs>
  <Tab title="Wallet Issues">
    * **"Only embedded wallets are supported"**
      * The swap functionality only works with Privy embedded wallets
      * Imported or delegated wallets are not supported

    * **"Wallet not deployed"**
      * Deploy your wallet first using the deployment flow from the previous guide
      * Ensure you have at least 0.05 TON for deployment

    * **"Insufficient balance"**
      * Swaps require the input amount plus gas fees (be sure to have at least \~0.2 TON for gas)
      * Top up your wallet and try again
  </Tab>

  <Tab title="Swap Issues">
    * **No quotes appearing**
      * Ensure both tokens are selected
      * Amount for swap must be greater than 0
      * Some token pairs may have low liquidity

    * **Transaction tracking fails**
      * The helper retries automatically
      * If it persists, wait a moment and try again
  </Tab>
</Tabs>

## Summary

This guide extends your Privy + TON application with:

* Omniston SDK integration for DEX aggregation
* Quote fetching from multiple liquidity sources
* Transaction building and signing with Privy
* Real-time trade tracking
* A polished swap UI with error handling

You can now seamlessly swap tokens on TON blockchain using Privy embedded wallets, with the best rates aggregated from multiple DEXes.
\n