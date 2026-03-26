/**
 * Read paths for agent group-chat context (joins + aggregates).
 * Raw Drizzle is required for the subquery + count pattern.
 */

import { count, eq } from 'drizzle-orm';
import { db, getRawDrizzle } from './db';
import { chatParticipants } from './tables/chat-participants';
import { chats } from './tables/chats';
import { groups } from './tables/groups';

export async function listTeamGroupIds(): Promise<string[]> {
  const teamGroups = await db
    .select({ id: groups.id })
    .from(groups)
    .where(eq(groups.type, 'team'));
  return teamGroups.map((g) => g.id);
}

export type AgentGroupChatRow = {
  id: string;
  name: string | null;
  groupId: string | null;
  memberCount: number;
};

/**
 * Group chats the agent participates in, with member counts (excludes filtering — caller may drop team groups).
 */
export async function listAgentGroupChatsWithMemberCounts(
  agentUserId: string,
  limit: number
): Promise<AgentGroupChatRow[]> {
  const rawDb = getRawDrizzle();
  const agentParticipation = rawDb
    .select({ chatId: chatParticipants.chatId })
    .from(chatParticipants)
    .where(eq(chatParticipants.userId, agentUserId))
    .as('agent_participation');

  return rawDb
    .select({
      id: chats.id,
      name: chats.name,
      groupId: chats.groupId,
      memberCount: count(chatParticipants.id),
    })
    .from(chats)
    .innerJoin(agentParticipation, eq(chats.id, agentParticipation.chatId))
    .innerJoin(chatParticipants, eq(chats.id, chatParticipants.chatId))
    .where(eq(chats.isGroup, true))
    .groupBy(chats.id, chats.name, chats.groupId)
    .limit(limit);
}
