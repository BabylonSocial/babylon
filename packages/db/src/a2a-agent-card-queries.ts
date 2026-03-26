/**
 * DB reads for A2A agent card generation (keeps Drizzle out of @babylon/a2a).
 */

import { eq } from 'drizzle-orm';
import { db } from './db';
import { users } from './tables/user';
import { userAgentConfigs } from './tables/user-agent-configs';

export async function fetchA2aAgentCardUserRow(agentId: string) {
  const [user] = await db
    .select({
      id: users.id,
      displayName: users.displayName,
      bio: users.bio,
      profileImageUrl: users.profileImageUrl,
      isAgent: users.isAgent,
    })
    .from(users)
    .where(eq(users.id, agentId))
    .limit(1);

  return user ?? null;
}

export async function fetchA2aAgentConfigRow(agentId: string) {
  const [agentConfig] = await db
    .select({
      systemPrompt: userAgentConfigs.systemPrompt,
      personality: userAgentConfigs.personality,
      tradingStrategy: userAgentConfigs.tradingStrategy,
      a2aEnabled: userAgentConfigs.a2aEnabled,
    })
    .from(userAgentConfigs)
    .where(eq(userAgentConfigs.userId, agentId))
    .limit(1);

  return agentConfig ?? null;
}
