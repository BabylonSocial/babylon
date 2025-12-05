#!/usr/bin/env bun

/**
 * Deploy Commands
 *
 * Commands:
 *   local     - Deploy contracts to local Hardhat
 *   testnet   - Deploy contracts to Base Sepolia testnet
 *   mainnet   - Deploy contracts to Base mainnet
 *   setup     - Post-deployment testnet setup
 */

import { $ } from 'bun';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { parseArgs, wantsHelp, getFlag } from '../lib/args.js';
import { logger } from '../lib/logger.js';

// Path to contracts package (foundry.toml location)
const CONTRACTS_DIR = join(process.cwd(), 'packages', 'contracts');

// Network configurations
const NETWORKS = {
  local: {
    rpcUrl: 'http://localhost:8545',
    chainId: 31337,
    privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
    name: 'Hardhat Local',
  },
  testnet: {
    rpcUrl: process.env.BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org',
    chainId: 84532,
    privateKey: process.env.DEPLOYER_PRIVATE_KEY || '',
    name: 'Base Sepolia',
  },
  mainnet: {
    rpcUrl: process.env.BASE_MAINNET_RPC_URL || 'https://mainnet.base.org',
    chainId: 8453,
    privateKey: process.env.DEPLOYER_PRIVATE_KEY || '',
    name: 'Base Mainnet',
  },
} as const;

type NetworkName = keyof typeof NETWORKS;

function printHelp(): void {
  console.log(`
Deploy Commands

USAGE:
  babylon deploy <command> [options]

COMMANDS:
  local       Deploy to local Hardhat node
  testnet     Deploy to Base Sepolia testnet
  mainnet     Deploy to Base mainnet
  setup       Post-deployment testnet setup

OPTIONS:
  --skip-verify    Skip contract verification on block explorer
  --force          Force deployment even if contracts exist

ENVIRONMENT:
  DEPLOYER_PRIVATE_KEY    Private key for deployment (testnet/mainnet)
  BASE_SEPOLIA_RPC_URL    RPC URL for testnet
  BASE_MAINNET_RPC_URL    RPC URL for mainnet
  ETHERSCAN_API_KEY       API key for contract verification

EXAMPLES:
  babylon deploy local              Deploy to local Hardhat
  babylon deploy testnet            Deploy to Base Sepolia
  babylon deploy mainnet --force    Force mainnet deployment
  babylon deploy setup              Run testnet setup after deploy
`);
}

function parseDeploymentOutput(output: string): Record<string, string> {
  const addresses: Record<string, string> = {};
  
  // Parse Diamond address - matches both "Diamond: 0x..." and "Diamond (Proxy): 0x..."
  const diamondMatch = output.match(/Diamond(?: \(Proxy\))?:\s*(0x[a-fA-F0-9]{40})/);
  if (diamondMatch) addresses.diamond = diamondMatch[1]!;

  // Parse other addresses - all use "Name: 0x..." format from forge script
  const patterns = [
    ['diamondCutFacet', /DiamondCutFacet:\s*(0x[a-fA-F0-9]{40})/],
    ['diamondLoupeFacet', /DiamondLoupeFacet:\s*(0x[a-fA-F0-9]{40})/],
    ['predictionMarketFacet', /PredictionMarketFacet:\s*(0x[a-fA-F0-9]{40})/],
    ['oracleFacet', /OracleFacet:\s*(0x[a-fA-F0-9]{40})/],
    ['liquidityPoolFacet', /LiquidityPoolFacet:\s*(0x[a-fA-F0-9]{40})/],
    ['perpetualMarketFacet', /PerpetualMarketFacet:\s*(0x[a-fA-F0-9]{40})/],
    ['referralSystemFacet', /ReferralSystemFacet:\s*(0x[a-fA-F0-9]{40})/],
    ['priceStorageFacet', /PriceStorageFacet:\s*(0x[a-fA-F0-9]{40})/],
    ['identityRegistry', /IdentityRegistry:\s*(0x[a-fA-F0-9]{40})/],
    ['reputationSystem', /ReputationSystem:\s*(0x[a-fA-F0-9]{40})/],
    ['babylonGameOracle', /BabylonGameOracle:\s*(0x[a-fA-F0-9]{40})/],
    ['predimarket', /Predimarket:\s*(0x[a-fA-F0-9]{40})/],
    ['marketFactory', /MarketFactory:\s*(0x[a-fA-F0-9]{40})/],
    ['contestOracle', /ContestOracle:\s*(0x[a-fA-F0-9]{40})/],
    ['banManager', /BanManager:\s*(0x[a-fA-F0-9]{40})/],
    ['labelManager', /ReputationLabelManager:\s*(0x[a-fA-F0-9]{40})/],
    ['reportingSystem', /ReportingSystem:\s*(0x[a-fA-F0-9]{40})/],
    ['testToken', /TestToken:\s*(0x[a-fA-F0-9]{40})/],
  ] as const;

  for (const [name, pattern] of patterns) {
    const match = output.match(pattern);
    if (match) addresses[name] = match[1]!;
  }

  return addresses;
}

async function checkForge(): Promise<boolean> {
  try {
    await $`forge --version`.quiet();
    return true;
  } catch {
    return false;
  }
}

async function deployToNetwork(network: NetworkName, skipVerify: boolean, _force: boolean): Promise<void> {
  const config = NETWORKS[network];
  
  logger.header(`Deploying to ${config.name}`);

  // Check forge is installed
  if (!await checkForge()) {
    logger.fail('Foundry (forge) not installed');
    console.log('\nInstall with: curl -L https://foundry.paradigm.xyz | bash && foundryup');
    process.exit(1);
  }

  // Check private key for non-local
  if (network !== 'local' && !config.privateKey) {
    logger.fail('DEPLOYER_PRIVATE_KEY not set');
    console.log('\nSet it in your environment:');
    console.log('  export DEPLOYER_PRIVATE_KEY=0x...');
    process.exit(1);
  }

  // For local, check Hardhat is running
  if (network === 'local') {
    try {
      await $`cast block-number --rpc-url ${config.rpcUrl}`.quiet();
      logger.success('Hardhat node is running');
    } catch {
      logger.fail('Hardhat is not running');
      console.log('\nStart it with: bun run hardhat');
      process.exit(1);
    }
  }

  // Compile contracts (run from contracts directory where foundry.toml is)
  logger.step('Compiling contracts...');
  await $`cd ${CONTRACTS_DIR} && bunx hardhat compile`.quiet();
  logger.success('Contracts compiled');

  // Clean previous artifacts for local
  if (network === 'local') {
    logger.step('Cleaning previous artifacts...');
    await $`rm -rf ${CONTRACTS_DIR}/broadcast ${CONTRACTS_DIR}/cache`.quiet();
    
    // Configure mining
    await $`cast rpc evm_setAutomine false --rpc-url ${config.rpcUrl}`.quiet();
    await $`cast rpc evm_setIntervalMining 1000 --rpc-url ${config.rpcUrl}`.quiet();
  }

  // Deploy (run from contracts directory where foundry.toml is)
  logger.step('Deploying contracts...');
  
  const scriptPath = 'script/DeployBabylon.s.sol:DeployBabylon';
  process.env.DEPLOYER_PRIVATE_KEY = config.privateKey;
  
  const verifyFlag = !skipVerify && network !== 'local' ? '--verify' : '';
  
  try {
    const result = await $`cd ${CONTRACTS_DIR} && forge script ${scriptPath} \
      --rpc-url ${config.rpcUrl} \
      --private-key ${config.privateKey} \
      --broadcast ${verifyFlag}`;
    
    const output = result.text();
    const addresses = parseDeploymentOutput(output);
    
    if (!addresses.diamond) {
      throw new Error('Failed to parse deployment addresses');
    }

    logger.success('Deployment complete!');
    console.log('\nContract addresses:');
    console.log(`  Diamond: ${addresses.diamond}`);
    
    // Save to env file
    const envFile = network === 'local' ? '.env.local' : `.env.${network}`;
    const envPath = join(process.cwd(), envFile);
    
    let envContent = existsSync(envPath) ? readFileSync(envPath, 'utf-8') : '';
    
    const updates = [
      ['BABYLON_DIAMOND_ADDRESS', addresses.diamond],
      ['BABYLON_CHAIN_ID', String(config.chainId)],
    ];
    
    for (const [key, value] of updates) {
      const regex = new RegExp(`^${key}=.*$`, 'm');
      if (envContent.match(regex)) {
        envContent = envContent.replace(regex, `${key}=${value}`);
      } else {
        envContent += `\n${key}=${value}`;
      }
    }
    
    writeFileSync(envPath, envContent);
    logger.success(`Updated ${envFile}`);

  } catch (error) {
    logger.fail('Deployment failed');
    throw error;
  }
}

async function runTestnetSetup(): Promise<void> {
  logger.header('Testnet Post-Deployment Setup');

  // Check environment
  const diamondAddress = process.env.BABYLON_DIAMOND_ADDRESS;
  if (!diamondAddress) {
    logger.fail('BABYLON_DIAMOND_ADDRESS not set');
    console.log('\nDeploy first: babylon deploy testnet');
    process.exit(1);
  }

  const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
  if (!privateKey) {
    logger.fail('DEPLOYER_PRIVATE_KEY not set');
    process.exit(1);
  }

  const rpcUrl = process.env.BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org';

  logger.step('Initializing game state...');
  
  // Call initialization functions on the contract
  try {
    // Initialize game
    await $`cast send ${diamondAddress} "initializeGame()" \
      --rpc-url ${rpcUrl} \
      --private-key ${privateKey}`.quiet();
    
    logger.success('Game initialized');

    // Create initial market
    await $`cast send ${diamondAddress} "createMarket(string,uint256)" \
      "Will the test event occur?" \
      ${Math.floor(Date.now() / 1000) + 86400 * 7} \
      --rpc-url ${rpcUrl} \
      --private-key ${privateKey}`.quiet();
    
    logger.success('Initial market created');

    console.log('\n✅ Testnet setup complete!');
    console.log(`\nDiamond: ${diamondAddress}`);
    console.log('\nNext: Start the app with bun run dev');

  } catch (error) {
    logger.fail('Setup failed');
    throw error;
  }
}

/**
 * Main entry point for deploy domain commands.
 *
 * @param args - Raw command-line arguments for the deploy domain
 */
export async function runDeployCommand(args: string[]): Promise<void> {
  const parsed = parseArgs(args);

  if (wantsHelp(parsed)) {
    printHelp();
    process.exit(0);
  }

  const skipVerify = getFlag(parsed, 'skip-verify');
  const force = getFlag(parsed, 'force');

  try {
    switch (parsed.command) {
      case 'local':
        await deployToNetwork('local', true, force);
        break;

      case 'testnet':
        await deployToNetwork('testnet', skipVerify, force);
        break;

      case 'mainnet':
        if (!force) {
          logger.fail('Mainnet deployment requires --force flag');
          console.log('\nThis is a safety check. Use: babylon deploy mainnet --force');
          process.exit(1);
        }
        await deployToNetwork('mainnet', skipVerify, force);
        break;

      case 'setup':
        await runTestnetSetup();
        break;

      default:
        if (parsed.command) {
          logger.fail(`Unknown command: ${parsed.command}`);
        }
        printHelp();
        process.exit(parsed.command ? 1 : 0);
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error(`\n❌ ${error.message}`);
    }
    process.exit(1);
  }
}

