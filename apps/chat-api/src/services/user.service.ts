import { eq } from 'drizzle-orm';
import type { Database } from '../db/db';
import { chatUsersTable } from '../db/schema/schema';
import type { Logger } from '../logger';

export type UserServiceDeps = {
  db: Database;
  logger: Logger;
};

export type UserLookupResult = {
  id: string;
  walletAddress: string | null;
  isAgent: boolean;
};

export type UserService = ReturnType<typeof createUserService>;

export function createUserService(deps: UserServiceDeps) {
  const { db, logger } = deps;

  return {
    /**
     * Look up user by Privy ID, creating if not exists
     * Used by auth to resolve Privy tokens to local user IDs
     */
    async lookupByPrivyId(
      privyId: string,
      walletAddress?: string
    ): Promise<UserLookupResult> {
      const existing = await db.query.chatUsersTable.findFirst({
        where: eq(chatUsersTable.privyId, privyId),
      });

      if (existing) {
        return {
          id: existing.id,
          walletAddress: existing.walletAddress,
          isAgent: false,
        };
      }

      const result = await db
        .insert(chatUsersTable)
        .values({
          privyId,
          walletAddress: walletAddress ?? null,
        })
        .returning();

      const created = result[0];
      if (!created) {
        throw new Error('Failed to create user');
      }

      logger.info({
        msg: 'Created new chat user',
        userId: created.id,
        privyId,
      });

      return {
        id: created.id,
        walletAddress: created.walletAddress,
        isAgent: false,
      };
    },
  };
}
