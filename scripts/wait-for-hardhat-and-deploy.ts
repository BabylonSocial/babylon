#!/usr/bin/env bun
/**
 * Wait for Hardhat Node and Deploy Contracts
 * 
 * This script:
 * 1. Waits for Hardhat node to be ready
 * 2. Deploys contracts once Hardhat is ready
 * 3. Keeps running to monitor Hardhat (used during dev startup)
 * 
 * Note: For local development, the API uses Hardhat's default account #0
 * (0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266) which is pre-funded with 10000 ETH.
 * No manual funding is required.
 */

import { $ } from 'bun'
import { loadDeployment } from '@babylon/contracts'

const HARDHAT_RPC_URL = 'http://localhost:8545'

// Hardhat default account #0 (has 10000 ETH) - used by API for local dev transactions
const HARDHAT_ACCOUNT_0 = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'

/**
 * Check if a contract is deployed at the given address using direct JSON-RPC
 * This is more reliable than using cast which can have issues with hardhat
 */
async function isContractDeployed(address: string): Promise<boolean> {
  const response = await fetch(HARDHAT_RPC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'eth_getCode',
      params: [address, 'latest'],
      id: 1,
    }),
  }).catch(() => null)

  if (!response) return false

  const data = await response.json().catch(() => null) as { result?: string } | null
  const code = data?.result ?? '0x'
  
  // Contract is deployed if code is not empty
  return code !== '0x' && code !== '0x0' && code.length > 2
}

/**
 * Wait for Hardhat node to be ready
 */
async function waitForHardhat(): Promise<boolean> {
  console.info('Waiting for Hardhat node to be ready...', undefined, 'Script')
  
  for (let attempts = 0; attempts < 30; attempts++) {
    const response = await fetch(HARDHAT_RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_blockNumber',
        params: [],
        id: 1,
      }),
    }).catch(() => null)

    if (response?.ok) {
      console.info('✅ Hardhat node is ready', undefined, 'Script')
      return true
    }

    if (attempts === 0) {
      console.info('Waiting for Hardhat node to start...', undefined, 'Script')
    }
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  return false
}

async function main() {
  // Wait for Hardhat to be ready
  const hardhatReady = await waitForHardhat()
  if (!hardhatReady) {
    console.error('❌ Hardhat node failed to start within 30 seconds', undefined, 'Script')
    process.exit(1)
  }
  
  // Check if contracts are already deployed on-chain
  const deployment = await loadDeployment('localnet')
  if (deployment?.contracts.diamond) {
    const deployed = await isContractDeployed(deployment.contracts.diamond)
    if (deployed) {
      console.info('✅ Contracts already deployed', undefined, 'Script')
      console.info(`✅ Using Hardhat account #0 (${HARDHAT_ACCOUNT_0}) for transactions`, undefined, 'Script')
      console.info('Contract deployment monitor running...', undefined, 'Script')
      // Keep the process running to maintain concurrently
      await new Promise(() => {}) // Never resolves
      return
    }
    console.info('Contracts not found on-chain, deploying...', undefined, 'Script')
  }
  
  // Deploy contracts
  console.info('Deploying contracts to Hardhat...', undefined, 'Script')
  await $`bun run deploy:local`
  console.info('✅ Contracts deployed successfully', undefined, 'Script')
  console.info(`✅ Using Hardhat account #0 (${HARDHAT_ACCOUNT_0}) for transactions`, undefined, 'Script')
  
  console.info('Contract deployment monitor running...', undefined, 'Script')
  
  // Keep the process running to maintain concurrently
  await new Promise(() => {}) // Never resolves
}

main().catch((error) => {
  console.error('Failed to deploy contracts', error, 'Script')
  process.exit(1)
})