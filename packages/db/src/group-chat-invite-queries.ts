/**
 * Postgres-only transactional writes for NPC → user group chat invites.
 * Uses mode-aware `db` for the pre-check and `getRawDrizzle` for ON CONFLICT upserts.
 */

import { generateSnowflakeId } from '@babylon/shared';
import { and, eq } from 'drizzle-orm';
import { db, getRawDrizzle } from './db';
import { chats } from './tables/chats';
import { groupInvites } from './tables/group-invites';
import { groups } from './tables/groups';
import { userInteractions } from './tables/user-interactions';

/**
 * Deterministic group id from chat id (idempotent invites for the same chat).
 */
export function deterministicGroupIdFromChatId(chatId: string): string {
  let hash = 0;
  for (let i = 0; i < chatId.length; i++) {
    const char = chatId.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  const absHash = Math.abs(hash);
  return `grp_${chatId}_${absHash.toString().padStart(10, '0')}`;
}

export type RecordNpcGroupChatInviteResult =
  | { kind: 'noop' }
  | { kind: 'recorded'; inviteId: string; groupId: string };

export async function recordNpcGroupChatInviteTransaction(input: {
  userId: string;
  npcId: string;
  chatId: string;
  chatName: string;
}): Promise<RecordNpcGroupChatInviteResult> {
  const { userId, npcId, chatId, chatName } = input;
  const groupId = deterministicGroupIdFromChatId(chatId);
  const now = new Date();

  const [existingInvite] = await db
    .select()
    .from(groupInvites)
    .where(
      and(
        eq(groupInvites.groupId, groupId),
        eq(groupInvites.invitedUserId, userId)
      )
    )
    .limit(1);

  if (existingInvite) {
    if (
      existingInvite.status === 'pending' ||
      existingInvite.status === 'accepted'
    ) {
      return { kind: 'noop' };
    }
  }

  let inviteId: string;
  const rawDb = getRawDrizzle();

  await rawDb.transaction(async (tx) => {
    await tx
      .insert(groups)
      .values({
        id: groupId,
        name: chatName,
        type: 'npc',
        ownerId: npcId,
        createdById: npcId,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoNothing({ target: groups.id });

    await tx
      .insert(chats)
      .values({
        id: chatId,
        name: chatName,
        isGroup: true,
        gameId: 'realtime',
        groupId,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: chats.id,
        set: {
          groupId,
          updatedAt: now,
        },
      });

    if (existingInvite) {
      inviteId = existingInvite.id;
      await tx
        .update(groupInvites)
        .set({
          status: 'pending',
          invitedBy: npcId,
          invitedAt: now,
          respondedAt: null,
          message: `Join our group chat "${chatName}"!`,
        })
        .where(eq(groupInvites.id, existingInvite.id));
    } else {
      inviteId = await generateSnowflakeId();
      await tx.insert(groupInvites).values({
        id: inviteId,
        groupId,
        invitedUserId: userId,
        invitedBy: npcId,
        status: 'pending',
        message: `Join our group chat "${chatName}"!`,
      });
    }

    await tx
      .update(userInteractions)
      .set({ wasInvitedToChat: true })
      .where(
        and(
          eq(userInteractions.userId, userId),
          eq(userInteractions.npcId, npcId)
        )
      );
  });

  return { kind: 'recorded', inviteId: inviteId!, groupId };
}
