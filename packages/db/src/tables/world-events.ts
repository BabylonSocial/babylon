import { desc } from 'drizzle-orm';
import { index, integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import type { DrizzleClient } from '../client';
import { logger } from '../logger';

export const worldEvents = pgTable(
  'WorldEvent',
  {
    id: text('id').primaryKey(),
    eventType: text('eventType').notNull(),
    description: text('description').notNull(),
    actors: text('actors').array().notNull().default([]),
    relatedQuestion: integer('relatedQuestion'),
    pointsToward: text('pointsToward'),
    visibility: text('visibility').notNull().default('public'),
    gameId: text('gameId'),
    dayNumber: integer('dayNumber'),
    timestamp: timestamp('timestamp', { mode: 'date' }).notNull().defaultNow(),
    createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
  },
  (table) => [
    index('WorldEvent_gameId_dayNumber_idx').on(table.gameId, table.dayNumber),
    index('WorldEvent_relatedQuestion_idx').on(table.relatedQuestion),
    index('WorldEvent_timestamp_idx').on(table.timestamp),
  ]
);

export type WorldEvent = typeof worldEvents.$inferSelect;
export type NewWorldEvent = typeof worldEvents.$inferInsert;

export async function createWorldEventRow(
  db: DrizzleClient,
  event: {
    id: string;
    eventType: string;
    description:
      | string
      | { title?: string; text?: string; timestamp?: string; source?: string };
    actors: string[];
    relatedQuestion?: number;
    pointsToward?: string;
    visibility: string;
    gameId?: string;
    dayNumber?: number;
  }
) {
  let descriptionString: string;
  if (typeof event.description === 'string') {
    descriptionString = event.description;
  } else if (event.description && typeof event.description === 'object') {
    descriptionString =
      event.description.text ||
      event.description.title ||
      JSON.stringify(event.description);
  } else {
    descriptionString = String(event.description || '');
  }

  const safeRelatedQuestion =
    typeof event.relatedQuestion === 'number' &&
    Number.isFinite(event.relatedQuestion) &&
    event.relatedQuestion >= 0 &&
    event.relatedQuestion <= 2147483647
      ? event.relatedQuestion
      : undefined;

  const safeDayNumber =
    typeof event.dayNumber === 'number' &&
    Number.isFinite(event.dayNumber) &&
    event.dayNumber >= 0 &&
    event.dayNumber <= 2147483647
      ? event.dayNumber
      : undefined;

  if (
    event.relatedQuestion !== undefined &&
    safeRelatedQuestion === undefined
  ) {
    logger.warn('[WorldEvent] Invalid relatedQuestion value', {
      relatedQuestion: event.relatedQuestion,
      eventId: event.id,
    });
  }

  if (event.dayNumber !== undefined && safeDayNumber === undefined) {
    logger.warn('[WorldEvent] Invalid dayNumber value', {
      dayNumber: event.dayNumber,
      eventId: event.id,
    });
  }

  const created = await db
    .insert(worldEvents)
    .values({
      id: event.id,
      eventType: event.eventType,
      description: descriptionString,
      actors: event.actors,
      relatedQuestion: safeRelatedQuestion,
      pointsToward: event.pointsToward,
      visibility: event.visibility,
      gameId: event.gameId,
      dayNumber: safeDayNumber,
    })
    .returning();

  return created[0]!;
}

export async function getRecentWorldEvents(db: DrizzleClient, limit = 100) {
  return db
    .select()
    .from(worldEvents)
    .limit(limit)
    .orderBy(desc(worldEvents.timestamp));
}
