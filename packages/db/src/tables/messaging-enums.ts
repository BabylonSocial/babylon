import { pgEnum } from 'drizzle-orm/pg-core';

export const groupTypeEnum = pgEnum('group_type', [
  'user',
  'npc',
  'agent',
  'team',
]);

export const messageTypeEnum = pgEnum('message_type', [
  'user',
  'system',
  'coordinator',
]);
