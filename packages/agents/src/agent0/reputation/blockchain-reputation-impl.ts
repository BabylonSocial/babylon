/**
 * Blockchain Reputation Implementation
 *
 * Production implementation for Agent0 blockchain reputation functions.
 * These functions query the Agent0 network and sync reputation data to the local database.
 *
 * Note: Agent0 uses feedback-based reputation (averageValue 0-100), not betting-based reputation.
 * Betting-related fields are set to 0 as they're not applicable to Agent0's reputation model.
 */
import { eq } from '@babylon/db';
import { db, users } from '@babylon/db/runtime';
import { logger } from '@babylon/shared';
import type { SDK } from 'agent0-sdk';

/**
 * Query on-chain reputation for an agent from Agent0 network
 *
 * Note: Agent0 uses feedback-based reputation (averageValue 0-100),
 * not betting-based reputation. Betting fields return 0 as they're
 * not applicable to Agent0's reputation model.
 *
 * @param sdk - Agent0 SDK instance
 * @param tokenId - Agent token ID on Agent0 network
 * @returns Reputation data or null if not available
 */
export async function getOnChainReputation(
  sdk: SDK,
  tokenId: number
): Promise<{
  totalBets: bigint;
  winningBets: bigint;
  totalVolume: bigint;
  profitLoss: bigint;
  accuracyScore: bigint;
  trustScore: bigint;
  isBanned: boolean;
} | null> {
  try {
    const agentId = `1:${tokenId}`; // Ethereum mainnet format

    // Query Agent0 reputation summary
    const summary = await sdk.getReputationSummary(agentId);

    if (!summary || summary.count === 0) {
      logger.info(
        'No Agent0 reputation data found',
        { tokenId, agentId },
        'Agent0Reputation'
      );
      return null;
    }

    // Map Agent0 feedback-based reputation to interface
    // averageValue is 0-100 scale, convert to bigint
    const trustScore = BigInt(Math.round(summary.averageValue));
    const accuracyScore = BigInt(Math.round(summary.averageValue));

    logger.info(
      'Agent0 reputation retrieved successfully',
      {
        tokenId,
        agentId,
        feedbackCount: summary.count,
        averageValue: summary.averageValue,
      },
      'Agent0Reputation'
    );

    return {
      // Agent0 uses feedback, not betting - set betting fields to 0
      totalBets: 0n,
      winningBets: 0n,
      totalVolume: 0n,
      profitLoss: 0n,
      // Use feedback average as both scores
      accuracyScore,
      trustScore,
      // Agent0 doesn't have ban status in reputation summary
      isBanned: false,
    };
  } catch (error) {
    logger.error(
      'getOnChainReputation failed',
      error instanceof Error ? error : new Error(String(error)),
      'Agent0Reputation'
    );
    return null;
  }
}

/**
 * Sync on-chain reputation from Agent0 network to local database
 *
 * @param sdk - Agent0 SDK instance
 * @param agentUserId - Local database user ID for the agent
 * @param agent0TokenId - Agent's token ID on Agent0 network
 * @returns Promise that resolves to unknown (for flexibility)
 */
export async function syncOnChainReputation(
  sdk: SDK,
  agentUserId: string,
  agent0TokenId: number
): Promise<unknown> {
  try {
    const agentId = `1:${agent0TokenId}`;

    // Get reputation from Agent0 network
    const summary = await sdk.getReputationSummary(agentId);

    if (!summary || summary.count === 0) {
      logger.info(
        'No Agent0 reputation to sync',
        { agentUserId, agent0TokenId },
        'Agent0Reputation'
      );
      return undefined;
    }

    await db
      .update(users)
      .set({
        agent0TrustScore: summary.averageValue,
        agent0FeedbackCount: summary.count,
      })
      .where(eq(users.id, agentUserId));

    logger.info(
      'Agent0 reputation synced successfully',
      {
        agentUserId,
        agent0TokenId,
        feedbackCount: summary.count,
        averageValue: summary.averageValue,
      },
      'Agent0Reputation'
    );

    return undefined;
  } catch (error) {
    logger.error(
      'syncOnChainReputation failed',
      error instanceof Error ? error : new Error(String(error)),
      'Agent0Reputation'
    );
    // Don't throw - sync failures shouldn't block registration
    return undefined;
  }
}
