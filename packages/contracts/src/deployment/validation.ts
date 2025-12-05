/**
 * Deployment Validation Utilities
 *
 * Validate that contracts are deployed and working correctly.
 */

import * as fs from 'fs';
import * as path from 'path';
import { ethers } from 'ethers';
import { logger } from './logger';
import type { DeploymentEnv } from './env-detection';

/**
 * Contract addresses for a deployment.
 *
 * Includes all core contracts and optional components that may be deployed.
 */
export interface ContractAddresses {
  /** Diamond proxy contract address */
  diamond: string;
  /** DiamondCut facet address */
  diamondCutFacet: string;
  /** DiamondLoupe facet address */
  diamondLoupeFacet: string;
  /** PredictionMarket facet address */
  predictionMarketFacet: string;
  /** Oracle facet address */
  oracleFacet: string;
  /** LiquidityPool facet address (optional) */
  liquidityPoolFacet?: string;
  /** PerpetualMarket facet address (optional) */
  perpetualMarketFacet?: string;
  /** ReferralSystem facet address (optional) */
  referralSystemFacet?: string;
  /** ERC-8004 Identity Registry address */
  identityRegistry: string;
  /** ERC-8004 Reputation System address */
  reputationSystem: string;
  /** Babylon Game Oracle address (optional) */
  babylonOracle?: string;
  /** Predimarket contract address (optional) */
  predimarket?: string;
  /** Market Factory address (optional) */
  marketFactory?: string;
  /** Contest Oracle address (optional) */
  contestOracle?: string;
  /** Ban Manager address (optional) */
  banManager?: string;
  /** Reporting System address (optional) */
  reportingSystem?: string;
  /** Reputation Label Manager address (optional) */
  labelManager?: string;
  /** Chainlink Oracle mock address (testnet only) */
  chainlinkOracle?: string;
  /** UMA Oracle mock address (testnet only) */
  umaOracle?: string;
  /** Test ERC20 token address (testnet only) */
  testToken?: string;
}

export interface DeploymentInfo {
  network: string;
  chainId: number;
  contracts: ContractAddresses;
  deployer: string;
  timestamp: string;
  blockNumber?: number;
  gasUsed?: string;
  explorer?: Record<string, string>;
}

export interface ValidationResult {
  valid: boolean;
  deployed: boolean;
  errors: string[];
  warnings: string[];
  contracts: Partial<ContractAddresses>;
}

/**
 * Load deployment info from module imports
 */
/**
 * Load deployment information from module imports.
 *
 * @param env - Deployment environment to load
 * @returns Deployment info or null if not found
 */
export async function loadDeployment(
  env: DeploymentEnv
): Promise<DeploymentInfo | null> {
  try {
    if (env === 'localnet') {
      const deployment = await import('../../deployments/local');
      return deployment.default as DeploymentInfo;
    }
    if (env === 'testnet') {
      const deployment = await import('../../deployments/base-sepolia');
      return deployment.default as DeploymentInfo;
    }
    if (env === 'mainnet') {
      const deployment = await import('../../deployments/base');
      return deployment.default as DeploymentInfo;
    }
  } catch {
    return null;
  }

  return null;
}

/**
 * Save deployment information to JSON file.
 *
 * @remarks This function uses Node.js file system APIs and is not compatible
 * with edge runtime. Only use in Node.js environments (scripts, build-time, etc.).
 *
 * @param env - Deployment environment
 * @param deployment - Deployment information to save
 * @throws Error if file system access is not available
 */
export async function saveDeployment(
  env: DeploymentEnv,
  deployment: DeploymentInfo
): Promise<void> {
  if (typeof process === 'undefined' || typeof process.cwd !== 'function') {
    throw new Error(
      'saveDeployment requires Node.js environment with file system access. Not available in edge runtime.'
    );
  }

  const deploymentPaths = {
    localnet: 'packages/contracts/deployments/local',
    testnet: 'packages/contracts/deployments/base-sepolia',
    mainnet: 'packages/contracts/deployments/base',
  };

  const dirpath = path.join(process.cwd(), deploymentPaths[env]);
  const filepath = path.join(dirpath, 'index.json');

  if (!fs.existsSync(dirpath)) {
    fs.mkdirSync(dirpath, { recursive: true });
  }

  fs.writeFileSync(filepath, JSON.stringify(deployment, null, 2));
  logger.info(
    `Deployment saved to ${filepath}`,
    undefined,
    'DeploymentValidation'
  );
}

/**
 * Validate contract deployment
 */
export async function validateDeployment(
  env: DeploymentEnv,
  rpcUrl: string,
  expectedContracts?: Partial<ContractAddresses>
): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const contracts: Partial<ContractAddresses> = {};

  try {
    const deployment = await loadDeployment(env);

    if (!deployment) {
      return {
        valid: false,
        deployed: false,
        errors: [
          `No deployment found for ${env}`,
          'Run the deployment script to deploy contracts',
        ],
        warnings: [],
        contracts: {},
      };
    }

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const network = await provider.getNetwork();
    const deploymentChainId = BigInt(deployment.chainId);
    if (network.chainId !== deploymentChainId) {
      errors.push(
        `Chain ID mismatch: provider is ${network.chainId}, deployment is ${deploymentChainId}`
      );
    }

    const contractsToValidate = expectedContracts || deployment.contracts;

    if (contractsToValidate.diamond) {
      const code = await provider.getCode(contractsToValidate.diamond);
      if (code === '0x' || code === '0x0') {
        errors.push(`Diamond not deployed at ${contractsToValidate.diamond}`);
      } else {
        contracts.diamond = contractsToValidate.diamond;
        logger.info(
          `✅ Diamond verified at ${contractsToValidate.diamond}`,
          undefined,
          'DeploymentValidation'
        );
      }
    }

    if (contractsToValidate.identityRegistry) {
      const code = await provider.getCode(contractsToValidate.identityRegistry);
      if (code === '0x' || code === '0x0') {
        errors.push(
          `Identity Registry not deployed at ${contractsToValidate.identityRegistry}`
        );
      } else {
        contracts.identityRegistry = contractsToValidate.identityRegistry;
        logger.info(
          `✅ Identity Registry verified at ${contractsToValidate.identityRegistry}`,
          undefined,
          'DeploymentValidation'
        );
      }
    }

    if (contractsToValidate.reputationSystem) {
      const code = await provider.getCode(contractsToValidate.reputationSystem);
      if (code === '0x' || code === '0x0') {
        errors.push(
          `Reputation System not deployed at ${contractsToValidate.reputationSystem}`
        );
      } else {
        contracts.reputationSystem = contractsToValidate.reputationSystem;
        logger.info(
          `✅ Reputation System verified at ${contractsToValidate.reputationSystem}`,
          undefined,
          'DeploymentValidation'
        );
      }
    }

    if (contracts.diamond) {
      try {
        const diamondContract = new ethers.Contract(
          contracts.diamond,
          ['function getBalance(address) view returns (uint256)'],
          provider
        );

        if (diamondContract.getBalance) {
          await diamondContract.getBalance(ethers.ZeroAddress);
        }
        logger.info(
          '✅ Diamond contract is functional',
          undefined,
          'DeploymentValidation'
        );
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        warnings.push(
          `Diamond contract may not be fully functional: ${errorMessage}`
        );
      }
    }

    return {
      valid: errors.length === 0,
      deployed: Object.keys(contracts).length > 0,
      errors,
      warnings,
      contracts,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      valid: false,
      deployed: false,
      errors: [`Validation failed: ${errorMessage}`],
      warnings,
      contracts,
    };
  }
}

/**
 * Check if a contract is deployed at an address
 */
export async function isContractDeployed(
  rpcUrl: string,
  address: string
): Promise<boolean> {
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const code = await provider.getCode(address);
  return code !== '0x' && code !== '0x0';
}

/**
 * Update environment file with contract addresses
 * 
 * NOTE: This function uses Node.js file system APIs and is not compatible with edge runtime.
 * Only use this in Node.js environments (scripts, build-time, etc.).
 */
export async function updateEnvFile(
  env: DeploymentEnv,
  contracts: ContractAddresses
): Promise<void> {
  if (typeof process === 'undefined' || typeof process.cwd !== 'function') {
    throw new Error(
      'updateEnvFile requires Node.js environment with file system access. Not available in edge runtime.'
    );
  }

  const envFiles = {
    localnet: '.env.local',
    testnet: '.env.testnet',
    mainnet: '.env.production',
  };

  const envFile = path.join(process.cwd(), envFiles[env]);

  let envContent = '';
  if (fs.existsSync(envFile)) {
    envContent = fs.readFileSync(envFile, 'utf-8');
  }

  const updates: Record<string, string | undefined> = {
    NEXT_PUBLIC_DIAMOND_ADDRESS: contracts.diamond,
    NEXT_PUBLIC_IDENTITY_REGISTRY: contracts.identityRegistry,
    NEXT_PUBLIC_REPUTATION_SYSTEM: contracts.reputationSystem,
    NEXT_PUBLIC_PREDICTION_MARKET_FACET: contracts.predictionMarketFacet,
    NEXT_PUBLIC_ORACLE_FACET: contracts.oracleFacet,
    NEXT_PUBLIC_LIQUIDITY_POOL_FACET: contracts.liquidityPoolFacet,
    NEXT_PUBLIC_PERPETUAL_MARKET_FACET: contracts.perpetualMarketFacet,
    NEXT_PUBLIC_REFERRAL_SYSTEM_FACET: contracts.referralSystemFacet,
    NEXT_PUBLIC_BAN_MANAGER: contracts.banManager,
    NEXT_PUBLIC_REPORTING_SYSTEM: contracts.reportingSystem,
    NEXT_PUBLIC_LABEL_MANAGER: contracts.labelManager,
    NEXT_PUBLIC_BABYLON_ORACLE: contracts.babylonOracle,
    NEXT_PUBLIC_PREDIMARKET: contracts.predimarket,
    NEXT_PUBLIC_MARKET_FACTORY: contracts.marketFactory,
    NEXT_PUBLIC_CONTEST_ORACLE: contracts.contestOracle,
    NEXT_PUBLIC_TEST_TOKEN: contracts.testToken,
  };

  if (contracts.chainlinkOracle) {
    updates.NEXT_PUBLIC_CHAINLINK_ORACLE = contracts.chainlinkOracle;
  }

  if (contracts.umaOracle) {
    updates.NEXT_PUBLIC_UMA_ORACLE = contracts.umaOracle;
  }

  for (const [key, value] of Object.entries(updates)) {
    if (value) {
      const regex = new RegExp(`^${key}=.*$`, 'm');
      const match = envContent.match(regex);
      if (match) {
        envContent = envContent.replace(regex, `${key}=${value}`);
      } else {
        envContent += `\n${key}=${value}`;
      }
    }
  }

  fs.writeFileSync(envFile, envContent);
  logger.info(
    `Updated ${envFile} with contract addresses`,
    undefined,
    'DeploymentValidation'
  );
}

/**
 * Print deployment validation result
 */
export function printDeploymentValidationResult(
  result: ValidationResult,
  env: DeploymentEnv
): void {
  if (!result.deployed) {
    logger.error(
      `❌ No contracts deployed for ${env}`,
      undefined,
      'DeploymentValidation'
    );
    for (const error of result.errors) {
      logger.error(`   ${error}`, undefined, 'DeploymentValidation');
    }

    logger.info(
      '\nTo deploy contracts, run:',
      undefined,
      'DeploymentValidation'
    );
    logger.info(
      `   bun run contracts:deploy:${env === 'testnet' ? 'testnet' : env === 'mainnet' ? 'mainnet' : 'local'}`,
      undefined,
      'DeploymentValidation'
    );
    return;
  }

  if (result.warnings.length > 0) {
    logger.warn('Warnings:', undefined, 'DeploymentValidation');
    for (const warning of result.warnings) {
      logger.warn(`  ⚠️  ${warning}`, undefined, 'DeploymentValidation');
    }
  }

  if (result.errors.length > 0) {
    logger.error('Validation errors:', undefined, 'DeploymentValidation');
    for (const error of result.errors) {
      logger.error(`  ❌ ${error}`, undefined, 'DeploymentValidation');
    }
    throw new Error('Contract validation failed');
  }

  if (!result.valid) {
    throw new Error('Contract validation failed');
  }

  logger.info(
    '✅ All contracts validated successfully',
    undefined,
    'DeploymentValidation'
  );
}

/**
 * Wait for transaction confirmation.
 *
 * Polls the network until the transaction has the required number of confirmations.
 *
 * @param provider - Ethers provider instance
 * @param txHash - Transaction hash to wait for
 * @param confirmations - Number of confirmations required (default: 1)
 * @returns Transaction receipt or null if timeout
 * @throws Error if confirmation timeout is reached
 */
export async function waitForTransaction(
  provider: ethers.Provider,
  txHash: string,
  confirmations = 1
): Promise<ethers.TransactionReceipt | null> {
  logger.info(
    `Waiting for transaction ${txHash}...`,
    undefined,
    'DeploymentValidation'
  );

  let attempts = 0;
  const maxAttempts = 60;

  while (attempts < maxAttempts) {
    try {
      const receipt = await provider.getTransactionReceipt(txHash);
      if (receipt && receipt.blockNumber) {
        const currentBlock = await provider.getBlockNumber();
        const confirmedBlocks = currentBlock - receipt.blockNumber;

        if (confirmedBlocks >= confirmations) {
          logger.info(
            `✅ Transaction confirmed (${confirmedBlocks} blocks)`,
            undefined,
            'DeploymentValidation'
          );
          return receipt;
        }

        logger.info(
          `Transaction has ${confirmedBlocks}/${confirmations} confirmations`,
          undefined,
          'DeploymentValidation'
        );
      }
    } catch (error) {
      logger.warn(
        'Error checking transaction',
        { error },
        'DeploymentValidation'
      );
    }

    await new Promise((resolve) => setTimeout(resolve, 5000));
    attempts++;
  }

  throw new Error('Transaction confirmation timeout');
}

