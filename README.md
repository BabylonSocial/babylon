<div align="center">

  <h1>🎮 Babylon</h1>

  <p><strong>A multiplayer prediction market game with autonomous AI agents and continuous RL training</strong></p>
  
  <p>
    <a href="https://github.com/BabylonSocial/babylon"><img src="https://img.shields.io/badge/build-passing-brightgreen" alt="Build Status"></a>
    <a href="https://github.com/BabylonSocial/babylon"><img src="https://img.shields.io/badge/tests-passing-brightgreen" alt="Tests"></a>
    <a href="https://docs.babylon.market"><img src="https://img.shields.io/badge/docs-available-blue" alt="Documentation"></a>
    <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.0-blue" alt="TypeScript"></a>
    <a href="https://soliditylang.org/"><img src="https://img.shields.io/badge/Solidity-0.8-363636" alt="Solidity"></a>
    <a href="https://arxiv.org/abs/2501.06781"><img src="https://img.shields.io/badge/arXiv-2501.06781-b31b1b.svg" alt="Paper" width=116 height=20></a>
  </p>
</div>


---

A real-time prediction market game with autonomous NPCs, perpetual futures, and gamified social mechanics.

**NOTE**: This is currently in development. We expect to launch publicly around December 1st, 2025. This repo will change heavily in the meantime.

## 📦 Installation

**Requirements:**
- Node.js >= 18.0.0 (for Error cause support)
- Bun >= 1.3.0

```bash
git clone https://github.com/BabylonSocial/babylon.git
cd babylon
bun install

# Setup environment & database
cp .env.example .env
bun run db:push
```

---

## 🚀 Quick Start

```bash
# 1. Install
bun install

# 2. Configure environment
cp .env.example .env
# (Optional) Create .env.local for Next.js-only overrides
# Edit .env (and optionally .env.local) with your Privy credentials + GROQ_API_KEY

# 3. Setup database
bun run db:push
bun run db:seed

# 4. (Optional) Enable Agent0 Integration
# Add to .env:
# AGENT0_ENABLED=true
# BASE_SEPOLIA_RPC_URL=...
# BABYLON_GAME_PRIVATE_KEY=...
# Then configure Agent0: babylon agent agent0-config

# 5. Start development
bun run dev   # ← Automatically starts web + game engine!
```

Visit `http://localhost:3000` - everything runs and generates content automatically!

---

### Development Modes

**Default Mode** (Recommended):
```bash
bun run dev   # ← Web + Game Engine (both automatically!)
```
Runs web server plus the local cron simulator. Content is generated via cron endpoints every 60 seconds.

**Web Only** (UI/API only, no local cron simulator):
```bash
bun run dev:web
```
Use if you're only working on frontend and don't need live cron-driven content.

**Next.js Only** (Run Next directly):
```bash
bun run dev:next-only
```
Useful if you want to bypass Turbo and run the Next dev flow directly.

### Real-Time Updates

The application uses **Server-Sent Events (SSE)** for real-time updates (Vercel-compatible):
- Feed updates (new posts)
- Market price changes
- Breaking news
- Chat messages

**For Production (Vercel):** Optionally set up Redis for cross-instance broadcasting:
```bash
# Add to Vercel environment variables
UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token
```

---

## 🚀 Development

```bash
# Start dev server
bun run dev

# Build & test
bun run build
bun run typecheck
bun run lint
bun run test
```

Visit `http://localhost:3000`

---

## 🤖 AI Assistants (Ruler)

This repo uses **Ruler** to centralize AI coding instructions in `.ruler/**`.

```bash
# Install deps
bun install

# Generate local agent config files (gitignored)
bun run ruler:apply
```

- Edit rules in `.ruler/**` only (generated files like `AGENTS.md`, `CLAUDE.md`, MCP configs should not be edited manually).
- For OpenAI Codex CLI to pick up the project config/MCP, set `CODEX_HOME="$(pwd)/.codex"`.

---

## 🧪 Testing

```bash
bun run test:unit           # Unit tests
bun run test:integration    # Integration tests
bun run test:e2e           # E2E tests
bun run contracts:test     # Smart contracts
```

To skip chain-dependent tests (e.g. in CI when Hardhat/localnet is not available), set `SKIP_CHAIN_TESTS=1`.

---

## 🚢 Deploy to Vercel

```bash
npm i -g vercel
vercel deploy --prod
```

**Required Environment Variables:**

- `DATABASE_URL` - PostgreSQL connection
- `NEXT_PUBLIC_PRIVY_APP_ID` (or `PRIVY_APP_ID`) - Privy App ID
- `PRIVY_APP_SECRET` - Privy backend secret
- `CRON_SECRET` - Cron authentication
- At least one LLM key: `GROQ_API_KEY` or `OPENAI_API_KEY` or `ANTHROPIC_API_KEY`

Validate your env files before running the app:

```bash
bun run env:validate
# optional profiles:
bun run env:validate:staging
bun run env:validate:production
```

Feature-specific requirements are validated conditionally (Agent0, SendGrid, NFT gating, on-chain perps).
See `.env.example` for the full list.

---

## 🖼️ NFT Deployment (ProtoMonkeys)

Deploy the ProtoMonkeys NFT collection for the Top 100 leaderboard rewards.

### Local Development (Automatic)

**NFT minting works automatically with `bun run dev`!** The dev startup:
1. Deploys ProtoMonkeysNFT contract to local Hardhat
2. Seeds the NFT collection (100 NFTs with placeholder metadata)
3. Creates eligibility snapshots for all test users

```bash
bun run dev   # ← NFT minting ready out of the box!
```

Visit `http://localhost:3000/nft` to mint your NFT.

### Manual Local Setup (if needed)

```bash
# 1. Start local Hardhat node
cd packages/contracts
bun hardhat:node

# 2. Deploy NFT contract (new terminal)
NFT_SIGNER_ADDRESS=0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 \
NFT_BASE_URI=http://localhost:3000/api/nft/metadata/ \
forge script script/DeployProtoMonkeysNFT.s.sol:DeployProtoMonkeysNFTLocal \
  --rpc-url http://localhost:8545 --broadcast

# 3. Set the deployed address in .env
NFT_CONTRACT_ADDRESS=<deployed_address>
NEXT_PUBLIC_CHAIN_ID=31337
NFT_CHAIN_ID=31337 # (legacy, optional) must match NEXT_PUBLIC_CHAIN_ID/CHAIN_ID
NFT_SIGNER_PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

# 4. Seed NFT collection and snapshots
bun run scripts/seed-nft-collection.ts
bun run scripts/seed-nft-snapshot-local.ts
```

### Environment Variables (Production)

```bash
# NFT Contract Configuration
NFT_CONTRACT_ADDRESS=0x...          # Set after deployment
NEXT_PUBLIC_CHAIN_ID=1              # 1 = Mainnet, 11155111 = Sepolia, 31337 = Local
NFT_CHAIN_ID=1                      # (legacy, optional) must match NEXT_PUBLIC_CHAIN_ID/CHAIN_ID
NFT_SIGNER_PRIVATE_KEY=0x...        # Backend signer private key (NEVER COMMIT)
NFT_SIGNER_ADDRESS=0x...            # Public address of signer
NFT_BASE_URI=https://babylon.market/api/nft/metadata/
```

Generate a signer keypair for production:
```bash
cast wallet new  # Save the private key securely!
```

### Sepolia Testnet

```bash
cd packages/contracts

# Deploy to Sepolia
forge script script/DeployProtoMonkeysNFT.s.sol:DeployProtoMonkeysNFT \
  --rpc-url https://rpc.sepolia.org \
  --broadcast --verify

# Update environment
NFT_CONTRACT_ADDRESS=<deployed_address>
NEXT_PUBLIC_CHAIN_ID=11155111
NFT_CHAIN_ID=11155111 # (legacy, optional) must match NEXT_PUBLIC_CHAIN_ID/CHAIN_ID
```

### Ethereum Mainnet

```bash
cd packages/contracts

# Deploy to mainnet (requires ETH for gas)
forge script script/DeployProtoMonkeysNFT.s.sol:DeployProtoMonkeysNFT \
  --rpc-url https://eth.llamarpc.com \
  --broadcast --verify

# Update environment
NFT_CONTRACT_ADDRESS=<deployed_address>
NEXT_PUBLIC_CHAIN_ID=1
NFT_CHAIN_ID=1 # (legacy, optional) must match NEXT_PUBLIC_CHAIN_ID/CHAIN_ID
```

### Post-Deployment Setup

```bash
# 1. Seed NFT collection with metadata (100 NFTs)
bun run scripts/seed-nft-collection.ts

# 2. Create eligibility snapshot from leaderboard (top 100 users)
# This populates the nftSnapshot table for mint eligibility
```

### Contract Tests

```bash
cd packages/contracts
forge test --match-contract ProtoMonkeysNFT -vvv
```

### Architecture

| Component | Description |
|-----------|-------------|
| `ProtoMonkeysNFT.sol` | ERC-721 contract with ECDSA signature-gated minting |
| `/api/nft/eligibility` | Check if user is in top 100 snapshot |
| `/api/nft/mint/prepare` | Generate signed mint transaction |
| `/api/nft/mint/confirm` | Verify on-chain mint, update database |
| `/api/nft/metadata/[tokenId]` | ERC-721 metadata endpoint |

---

## 📚 Documentation

**[📖 Full Documentation →](https://docs.babylon.market)**

- Smart Contracts: `bun run deploy:local|testnet`
- RL Training: See `packages/training/README.md`
- Game Control: `babylon game start|pause|status` (via CLI)
- **Agent skills & LLM-facing docs**: We expose A2A and MCP; agents need an up-to-date reference.
  - `bun run docs:generate` — Pulls vendor docs and regenerates skills packages.
  - `bun run skills:generate` — Skills markdown only. `bun run skills:package` — Full package.

---

## 📱 Farcaster Mini App Setup

Babylon is configured as a **Farcaster Mini App** with automatic authentication. Users opening your app from any Farcaster client (e.g., Warpcast) are logged in automatically!

### Prerequisites

- Privy account with Farcaster enabled
- Production deployment at `https://babylon.market`

### Configuration Steps

#### 1. Configure Privy Dashboard (10 min)

Visit https://dashboard.privy.io/ and configure:

**Enable Farcaster:**
- Navigate to: **User management → Authentication → Socials**
- Enable **Farcaster**

**⚠️ CRITICAL: Add Allowed Domains:**
- Navigate to: **Configuration → App settings → Domains**
- Add these domains:
  - ✅ `https://babylon.market` (your production domain)
  - ⚠️ **`https://farcaster.xyz`** ← **REQUIRED for Mini Apps!**
  - ✅ `http://localhost:3000` (for development)

> **Why `https://farcaster.xyz`?** Required for iframe-in-iframe support that Farcaster Mini Apps use.

**Set Callback URL:**
- Add: `https://babylon.market/api/auth/farcaster/callback`

#### 2. Verify Environment Variables

Ensure these are set in production:

```bash
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id
PRIVY_APP_SECRET=your_privy_app_secret
```

#### 3. Deploy

```bash
vercel --prod
```

#### 4. Test in Farcaster

Create a cast in a Farcaster client (e.g., Warpcast):
```
Check out Babylon! 🏛️

https://babylon.market
```

Click to launch → Users are automatically logged in! ✨

### How It Works

1. **Mini App SDK** detects Farcaster context
2. **Auto-login** triggers via Privy + `@farcaster/miniapp-sdk`
3. User approves once
4. **Instant authentication** - no forms or passwords!

### Using Mini App Context in Code

```typescript
import { useFarcasterMiniApp } from '@/components/providers/FarcasterFrameProvider'

function MyComponent() {
  const { isMiniApp, fid, username } = useFarcasterMiniApp()

  if (isMiniApp) {
    return <div>Welcome from Farcaster, {username}!</div>
  }

  return <div>Welcome to Babylon!</div>
}
```

### Key Resources

- **Farcaster Mini Apps**: https://miniapps.farcaster.xyz/
- **Privy Recipe**: https://docs.privy.io/recipes/farcaster/mini-apps
- **Mini Apps SDK**: https://github.com/farcaster/miniapp-sdk
