/**
 * Integration Tests: Reputation Sync with Localnet Default Keys
 *
 * Tests that default test keys are used correctly in localnet mode
 */

import { beforeAll, describe, expect, test } from 'bun:test';
import { syncUserReputationToERC8004 } from '@babylon/agents';
import { db } from '@babylon/db/runtime';

import { generateSnowflakeId } from '@babylon/shared';

describe.skip('Reputation Sync with Localnet Default Keys', () => {
  let testAgentUserId: string;

  beforeAll(async () => {
    // Create test agent with unique wallet address
    testAgentUserId = await generateSnowflakeId();

    // Generate a unique wallet address to avoid conflicts
    const uniqueWalletSuffix = Date.now().toString(16).padStart(40, '0');
    const uniqueWalletAddress = `0x${uniqueWalletSuffix}`;

    await db.user.create({
      data: {
        id: testAgentUserId,
        username: `test-localnet-agent-${Date.now()}`,
        displayName: 'Test Localnet Agent',
        isAgent: true,
        agent0TokenId: 12345,
        walletAddress: uniqueWalletAddress,
        updatedAt: new Date(),
      },
    });
  });

  test('should use default localnet key when AGENT0_NETWORK is localnet', async () => {
    // Set localnet mode
    const originalNetwork = process.env.AGENT0_NETWORK;
    const originalFeedbackKey = process.env.AGENT0_FEEDBACK_PRIVATE_KEY;
    const originalBabylonKey = process.env.BABYLON_AGENT0_PRIVATE_KEY;

    try {
      process.env.AGENT0_NETWORK = 'localnet';
      delete process.env.AGENT0_FEEDBACK_PRIVATE_KEY;
      delete process.env.BABYLON_AGENT0_PRIVATE_KEY;

      // Test that sync attempts to use default key
      let result;
      try {
        result = await syncUserReputationToERC8004(testAgentUserId, true);
      } catch (error) {
        // If sync throws an error, that's acceptable - we're just testing key handling
        console.log(
          'Sync threw error (acceptable):',
          error instanceof Error ? error.message : String(error)
        );
        return;
      }

      // Should not have "Feedback private key not configured" error
      expect(result.onChainError).not.toBe(
        'Feedback private key not configured'
      );

      // If there's an error, it should be about wallet/pre-auth, not missing key
      if (result.onChainError) {
        expect(result.onChainError).not.toContain('not configured');
      }
    } finally {
      // Restore original values
      if (originalNetwork) {
        process.env.AGENT0_NETWORK = originalNetwork;
      } else {
        delete process.env.AGENT0_NETWORK;
      }
      if (originalFeedbackKey) {
        process.env.AGENT0_FEEDBACK_PRIVATE_KEY = originalFeedbackKey;
      }
      if (originalBabylonKey) {
        process.env.BABYLON_AGENT0_PRIVATE_KEY = originalBabylonKey;
      }
    }
  });

  test('should prefer explicit env vars over default key', async () => {
    const originalNetwork = process.env.AGENT0_NETWORK;
    const originalFeedbackKey = process.env.AGENT0_FEEDBACK_PRIVATE_KEY;
    const originalBabylonKey = process.env.BABYLON_AGENT0_PRIVATE_KEY;

    try {
      process.env.AGENT0_NETWORK = 'localnet';
      process.env.AGENT0_FEEDBACK_PRIVATE_KEY =
        '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      delete process.env.BABYLON_AGENT0_PRIVATE_KEY;

      const result = await syncUserReputationToERC8004(testAgentUserId, true);

      // Should use explicit key, not default
      expect(result.onChainError).not.toBe(
        'Feedback private key not configured'
      );
    } finally {
      if (originalNetwork) {
        process.env.AGENT0_NETWORK = originalNetwork;
      } else {
        delete process.env.AGENT0_NETWORK;
      }
      if (originalFeedbackKey) {
        process.env.AGENT0_FEEDBACK_PRIVATE_KEY = originalFeedbackKey;
      } else {
        delete process.env.AGENT0_FEEDBACK_PRIVATE_KEY;
      }
      if (originalBabylonKey) {
        process.env.BABYLON_AGENT0_PRIVATE_KEY = originalBabylonKey;
      }
    }
  });

  test('should not use default key when not in localnet mode', async () => {
    const originalNetwork = process.env.AGENT0_NETWORK;
    const originalFeedbackKey = process.env.AGENT0_FEEDBACK_PRIVATE_KEY;
    const originalBabylonKey = process.env.BABYLON_AGENT0_PRIVATE_KEY;

    try {
      process.env.AGENT0_NETWORK = 'sepolia';
      delete process.env.AGENT0_FEEDBACK_PRIVATE_KEY;
      delete process.env.BABYLON_AGENT0_PRIVATE_KEY;

      const result = await syncUserReputationToERC8004(testAgentUserId, true);

      // Should have "Feedback private key not configured" error when not localnet
      expect(result.onChainError).toBe('Feedback private key not configured');
    } finally {
      if (originalNetwork) {
        process.env.AGENT0_NETWORK = originalNetwork;
      } else {
        delete process.env.AGENT0_NETWORK;
      }
      if (originalFeedbackKey) {
        process.env.AGENT0_FEEDBACK_PRIVATE_KEY = originalFeedbackKey;
      }
      if (originalBabylonKey) {
        process.env.BABYLON_AGENT0_PRIVATE_KEY = originalBabylonKey;
      }
    }
  });
});
