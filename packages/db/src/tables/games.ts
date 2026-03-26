import { generateSnowflakeId } from '@babylon/shared';
import { desc, eq } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import type { DrizzleClient } from '../client';
import { logger } from '../logger';

export const games = pgTable(
  'Game',
  {
    id: text('id').primaryKey(),
    currentDay: integer('currentDay').notNull().default(1),
    currentDate: timestamp('currentDate', { mode: 'date' })
      .notNull()
      .defaultNow(),
    isRunning: boolean('isRunning').notNull().default(false),
    isContinuous: boolean('isContinuous').notNull().default(true),
    speed: integer('speed').notNull().default(60000),
    startedAt: timestamp('startedAt', { mode: 'date' }),
    pausedAt: timestamp('pausedAt', { mode: 'date' }),
    completedAt: timestamp('completedAt', { mode: 'date' }),
    lastTickAt: timestamp('lastTickAt', { mode: 'date' }),
    lastSnapshotAt: timestamp('lastSnapshotAt', { mode: 'date' }),
    activeQuestions: integer('activeQuestions').notNull().default(0),
    createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp('updatedAt', { mode: 'date' }).notNull(),
  },
  (table) => [
    index('Game_isContinuous_idx').on(table.isContinuous),
    index('Game_isRunning_idx').on(table.isRunning),
  ]
);

export type Game = typeof games.$inferSelect;
export type NewGame = typeof games.$inferInsert;

export async function initializeContinuousGame(db: DrizzleClient) {
  const existing = await db
    .select()
    .from(games)
    .where(eq(games.isContinuous, true))
    .limit(1);

  if (existing.length > 0 && existing[0]) {
    logger.info(`Game already initialized (${existing[0].id})`);
    return existing[0];
  }

  const gameId = await generateSnowflakeId();
  const created = await db
    .insert(games)
    .values({
      id: gameId,
      isContinuous: true,
      isRunning: true,
      currentDate: new Date(),
      speed: 60000,
      updatedAt: new Date(),
    })
    .returning();

  const game = created[0]!;
  logger.info(`Game initialized (${game.id})`);
  return game;
}

export async function getContinuousGameState(db: DrizzleClient) {
  const result = await db
    .select()
    .from(games)
    .where(eq(games.isContinuous, true))
    .limit(1);
  return result[0] ?? null;
}

export async function updateContinuousGameState(
  db: DrizzleClient,
  data: {
    currentDay?: number;
    currentDate?: Date;
    lastTickAt?: Date;
    lastSnapshotAt?: Date;
    activeQuestions?: number;
  }
) {
  const game = await getContinuousGameState(db);
  if (!game) throw new Error('Game not initialized');

  const updated = await db
    .update(games)
    .set(data)
    .where(eq(games.id, game.id))
    .returning();

  return updated[0]!;
}

export async function listAllGamesByCreatedDesc(db: DrizzleClient) {
  return db.select().from(games).orderBy(desc(games.createdAt));
}
