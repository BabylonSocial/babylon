> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Polymarket Builder codes

Polymarket's Builder program enables apps to earn fees on trades they route through the platform. This guide demonstrates how to integrate Polymarket trading using Privy for authentication and embedded wallet provisioning—giving your users a seamless, gasless trading experience with web2-style onboarding.

<CardGroup cols={2}>
  <Card title="Polymarket" icon="chart-pie" href="https://polymarket.com/">
    The world's largest prediction market platform.
  </Card>

  <Card title="Builder Program" icon="book" href="https://docs.polymarket.com/developers/builders/builder-intro">
    Official builder program documentation.
  </Card>
</CardGroup>

<Card title="Polymarket builder code example repo" icon="github" href="https://github.com/Polymarket/privy-safe-builder-example">
  Official Next.js example with Privy authentication and Polymarket trading.
</Card>

## Getting started

<Steps>
  <Step title="Create a Privy app">
    Sign up at [dashboard.privy.io](https://dashboard.privy.io) and create an app.
  </Step>

  <Step title="Get builder credentials">
    Obtain your builder API key, secret, and passphrase from
    [Polymarket](https://polymarket.com/settings?tab=builder).
  </Step>

  <Step title="Get a Polygon RPC URL">
    Use any Polygon mainnet RPC provider (Alchemy, Infura, or a public RPC).
  </Step>
</Steps>

### Setup

To get started, you'll need to set up:

* **Privy authentication** — Handles login and provisions embedded wallets
* **Builder signing endpoint** — Keeps your builder credentials secure server-side
* **Polymarket clients** — RelayClient for Safe operations, ClobClient for trading

Clone the example:

```bash  theme={"system"}
git clone https://github.com/Polymarket/privy-safe-builder-example.git
cd privy-safe-builder-example
npm install
```

Add your credentials to `.env.local`:

```bash  theme={"system"}
NEXT_PUBLIC_POLYGON_RPC_URL=your_rpc_url
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id
POLYMARKET_BUILDER_API_KEY=your_builder_api_key
POLYMARKET_BUILDER_SECRET=your_builder_secret
POLYMARKET_BUILDER_PASSPHRASE=your_builder_passphrase
```

Run `npm run dev` and open [localhost:3000](http://localhost:3000).

## Integration steps

### Step 1: Set up authentication

First, wrap your app with `PrivyProvider` and use Privy's hooks to handle login. When users authenticate, Privy automatically provisions an embedded wallet:

```tsx  theme={"system"}
import {PrivyProvider, usePrivy, useWallets} from '@privy-io/react-auth';

function App() {
  const {login, authenticated} = usePrivy();
  const {wallets} = useWallets();

  const embeddedWallet = wallets.find((w) => w.walletClientType === 'privy');

  return (
    <button onClick={login}>
      {authenticated ? `Connected: ${embeddedWallet?.address}` : 'Login'}
    </button>
  );
}
```

### Step 2: Configure the builder signing endpoint

Next, set up a server-side API route to keep your builder credentials secure. The example includes this at [`app/api/polymarket/sign/route.ts`](https://github.com/Polymarket/privy-safe-builder-example/blob/main/app/api/polymarket/sign/route.ts).

This endpoint generates HMAC signatures for the `RelayClient` and `ClobClient`:

```typescript {skip-check} theme={"system"}
import {NextRequest, NextResponse} from 'next/server';
import {BuilderApiKeyCreds, buildHmacSignature} from '@polymarket/builder-signing-sdk';

const BUILDER_CREDENTIALS: BuilderApiKeyCreds = {
  key: process.env.POLYMARKET_BUILDER_API_KEY!,
  secret: process.env.POLYMARKET_BUILDER_SECRET!,
  passphrase: process.env.POLYMARKET_BUILDER_PASSPHRASE!
};

export async function POST(request: NextRequest) {
  const body = await request.json();
  const {method, path, body: requestBody} = body;

  const sigTimestamp = Date.now().toString();

  const signature = buildHmacSignature(
    BUILDER_CREDENTIALS.secret,
    parseInt(sigTimestamp),
    method,
    path,
    requestBody
  );

  return NextResponse.json({
    POLY_BUILDER_SIGNATURE: signature,
    POLY_BUILDER_TIMESTAMP: sigTimestamp,
    POLY_BUILDER_API_KEY: BUILDER_CREDENTIALS.key,
    POLY_BUILDER_PASSPHRASE: BUILDER_CREDENTIALS.passphrase
  });
}
```

<Warning>
  This reference implementation exposes builder credentials to the client. For production, implement
  a proxy pattern where the server makes all CLOB/Relay requests, or add auth token validation
  before returning credentials.
</Warning>

### Step 3: Deploy a Safe wallet

Polymarket uses Gnosis Safe wallets for trading. The [`hooks/useSafeDeployment.ts`](https://github.com/Polymarket/privy-safe-builder-example/blob/main/hooks/useSafeDeployment.ts) hook handles this.

First, derive the Safe address from the user's EOA (this is deterministic—the same EOA always gets the same Safe):

```typescript {skip-check} theme={"system"}
import {deriveSafe} from '@polymarket/builder-relayer-client/dist/builder/derive';
import {getContractConfig} from '@polymarket/builder-relayer-client/dist/config';
import {POLYGON_CHAIN_ID} from '@/constants/polymarket';

const config = getContractConfig(POLYGON_CHAIN_ID);
const safeAddress = deriveSafe(eoaAddress, config.SafeContracts.SafeFactory);
```

Then check if the Safe exists and deploy it if needed:

```typescript {skip-check} theme={"system"}
import {RelayClient, RelayerTransactionState} from '@polymarket/builder-relayer-client';

async function deploySafe(relayClient: RelayClient): Promise<string> {
  // Prompts signer for a signature
  const response = await relayClient.deploy();

  // Poll until the transaction is mined/confirmed (60s timeout, 3s interval)
  const result = await relayClient.pollUntilState(
    response.transactionID,
    [
      RelayerTransactionState.STATE_MINED,
      RelayerTransactionState.STATE_CONFIRMED,
      RelayerTransactionState.STATE_FAILED
    ],
    '60',
    3000
  );

  return result.proxyAddress;
}
```

The Safe holds the user's USDC.e and outcome tokens. Deployment is gasless—Polymarket's relayer covers the cost.

### Step 4: Get user API credentials

User API Credentials authenticate requests to the CLOB. The [`hooks/useUserApiCredentials.ts`](https://github.com/Polymarket/privy-safe-builder-example/blob/main/hooks/useUserApiCredentials.ts) hook handles this.

For new users, create credentials:

```typescript {skip-check} theme={"system"}
import {ClobClient} from '@polymarket/clob-client';
import {CLOB_API_URL, POLYGON_CHAIN_ID} from '@/constants/polymarket';
import {useWallet} from '@/providers/WalletContext';

const {eoaAddress, ethersSigner} = useWallet();
const tempClient = new ClobClient(CLOB_API_URL, POLYGON_CHAIN_ID, ethersSigner);
const creds = await tempClient.createApiKey(); // Prompts for signature
```

For returning users, derive existing credentials:

```typescript {skip-check} theme={"system"}
const creds = await tempClient.deriveApiKey(); // Prompts for signature
```

Both methods require the user to sign an EIP-712 message. The example stores credentials in localStorage for convenience, but production apps should use secure httpOnly cookies or server-side session management.

### Step 5: Set token approvals

Before trading, the Safe must approve Polymarket's contracts. The [`hooks/useTokenApprovals.ts`](https://github.com/Polymarket/privy-safe-builder-example/blob/main/hooks/useTokenApprovals.ts) hook batches all approvals into a single transaction.

**USDC.e (ERC-20) approvals for:**

* CTF Contract: `0x4d97dcd97ec945f40cf65f87097ace5ea0476045`
* CTF Exchange: `0x4bFb41d5B3570DeFd03C39a9A4D8dE6Bd8B8982E`
* Neg Risk Exchange: `0xC5d563A36AE78145C45a50134d48A1215220f80a`
* Neg Risk Adapter: `0xd91E80cF2E7be2e162c6513ceD06f1dD0dA35296`

**Outcome token (ERC-1155) approvals for:**

* CTF Exchange: `0x4bFb41d5B3570DeFd03C39a9A4D8dE6Bd8B8982E`
* Neg Risk Exchange: `0xC5d563A36AE78145C45a50134d48A1215220f80a`
* Neg Risk Adapter: `0xd91E80cF2E7be2e162c6513ceD06f1dD0dA35296`

```typescript {skip-check} theme={"system"}
const approvalStatus = await checkAllApprovals(safeAddress);

if (!approvalStatus.allApproved) {
  const approvalTxs = createAllApprovalTxs();
  const response = await relayClient.execute(approvalTxs, 'Set token approvals');
  await response.wait();
}
```

Approvals persist across sessions—users only sign once. All approval transactions are gasless via the relayer.

### Step 6: Place an order

With the session initialized, place orders through the CLOB client:

```typescript {skip-check} theme={"system"}
const order = {
  tokenID: '0x...', // Outcome token from market
  price: 0.65, // 65 cents
  size: 10, // 10 shares
  side: 'BUY',
  feeRateBps: 0,
  expiration: 0, // Good-til-cancel
  taker: '0x0000000000000000000000000000000000000000'
};

const response = await clobClient.createAndPostOrder(order, {negRisk: false}, OrderType.GTC);
console.log('Order ID:', response.orderID);
```

Orders are signed by the user's Privy EOA and executed from their Safe address. Builder attribution is automatic via the builder config.

## Troubleshooting

<AccordionGroup>
  <Accordion title="Privy authentication failed">
    Verify `NEXT_PUBLIC_PRIVY_APP_ID` is set correctly. Check that your domain is allowed in the
    Privy dashboard.
  </Accordion>

  <Accordion title="Failed to initialize relay client">
    Check builder credentials in `.env.local`. Verify the `/api/polymarket/sign` endpoint is
    accessible.
  </Accordion>

  <Accordion title="Safe deployment failed">
    Ensure the Polygon RPC URL is valid. The user must approve the signature via Privy.
  </Accordion>

  <Accordion title="Token approval failed">
    The Safe must be deployed first. Verify the builder relay service is operational.
  </Accordion>

  <Accordion title="Orders not appearing">
    Verify the trading session is complete and the Safe has a USDC.e balance. Wait 2-3 seconds for
    CLOB sync.
  </Accordion>
</AccordionGroup>

## Resources

<CardGroup cols={2}>
  <Card title="CLOB API" icon="code" href="https://docs.polymarket.com/developers/CLOB/introduction">
    Order book API for placing and managing orders.
  </Card>

  <Card title="Relayer client" icon="bolt" href="https://docs.polymarket.com/developers/builders/relayer-client">
    Gasless Safe deployment and approvals.
  </Card>
</CardGroup>
\n