/**
 * MCP API Key Authentication
 *
 * Validates user API keys for MCP authentication
 */

import { userApiKeys, eq, asSystem } from '@babylon/db';
import { logger } from '@babylon/shared';
import { hashApiKey } from '@babylon/api';

/**
 * Validate user API key and return userId
 *
 * @param apiKey - The API key to validate
 * @returns User ID if key is valid, null otherwise
 */
export async function validateUserApiKey(
  apiKey: string
): Promise<{ userId: string } | null> {
  if (!apiKey) {
    return null;
  }

  try {
    // Hash the provided API key
    const keyHash = hashApiKey(apiKey);

    // Use asSystem for key lookup since we're authenticating based on the key itself
    const keyRecord = await asSystem(async (dbClient) => {
      return await dbClient.query.userApiKeys.findFirst({
        where: (keys, { eq, and: andFn, isNull: isNullFn, or: orFn, gt: gtFn }) =>
          andFn(
            eq(keys.keyHash, keyHash),
            isNullFn(keys.revokedAt),
            orFn(
              isNullFn(keys.expiresAt),
              gtFn(keys.expiresAt, new Date())
            )
          ),
      });
    });

    if (!keyRecord) {
      logger.warn('Invalid or expired API key', undefined, 'MCP Auth');
      return null;
    }

    // Update lastUsedAt timestamp
    await asSystem(async (dbClient) => {
      await dbClient
        .update(userApiKeys)
        .set({ lastUsedAt: new Date() })
        .where(eq(userApiKeys.id, keyRecord.id));
    });

    return {
      userId: keyRecord.userId,
    };
  } catch (error) {
    logger.error('Error validating API key', error, 'MCP Auth');
    return null;
  }
}

