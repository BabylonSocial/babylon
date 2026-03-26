import {
  doublePrecision,
  index,
  json,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import type { JsonValue } from '../types';

export const npcInteractions = pgTable(
  'NPCInteraction',
  {
    id: text('id').primaryKey(),
    actor1Id: text('actor1Id').notNull(),
    actor2Id: text('actor2Id').notNull(),
    interactionType: text('interactionType').notNull(),
    sentiment: doublePrecision('sentiment').notNull().default(0),
    context: text('context').notNull(),
    metadata: json('metadata').$type<JsonValue>(),
    timestamp: timestamp('timestamp', { mode: 'date' }).notNull().defaultNow(),
  },
  (table) => [
    index('NPCInteraction_actor1Id_actor2Id_timestamp_idx').on(
      table.actor1Id,
      table.actor2Id,
      table.timestamp
    ),
    index('NPCInteraction_timestamp_idx').on(table.timestamp),
    index('NPCInteraction_actor1Id_idx').on(table.actor1Id),
    index('NPCInteraction_actor2Id_idx').on(table.actor2Id),
    index('NPCInteraction_interactionType_idx').on(table.interactionType),
  ]
);

export type NPCInteraction = typeof npcInteractions.$inferSelect;
export type NewNPCInteraction = typeof npcInteractions.$inferInsert;
