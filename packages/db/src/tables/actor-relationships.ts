import {
  boolean,
  doublePrecision,
  index,
  integer,
  json,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import type { JsonValue } from '../types';

export const actorRelationships = pgTable(
  'ActorRelationship',
  {
    id: text('id').primaryKey(),
    actor1Id: text('actor1Id').notNull(),
    actor2Id: text('actor2Id').notNull(),
    relationshipType: text('relationshipType').notNull(),
    strength: doublePrecision('strength').notNull(),
    sentiment: doublePrecision('sentiment').notNull(),
    isPublic: boolean('isPublic').notNull().default(true),
    history: text('history'),
    affects: json('affects').$type<JsonValue>(),
    createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp('updatedAt', { mode: 'date' }).notNull(),
    lastInteraction: timestamp('lastInteraction', { mode: 'date' }),
    interactionCount: integer('interactionCount').notNull().default(0),
    evolutionCount: integer('evolutionCount').notNull().default(0),
  },
  (table) => [
    index('ActorRelationship_actor1Id_idx').on(table.actor1Id),
    index('ActorRelationship_actor2Id_idx').on(table.actor2Id),
    index('ActorRelationship_relationshipType_idx').on(table.relationshipType),
    index('ActorRelationship_sentiment_idx').on(table.sentiment),
    index('ActorRelationship_strength_idx').on(table.strength),
    index('ActorRelationship_lastInteraction_idx').on(table.lastInteraction),
  ]
);

export type ActorRelationship = typeof actorRelationships.$inferSelect;
export type NewActorRelationship = typeof actorRelationships.$inferInsert;
