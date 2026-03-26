import { relations } from 'drizzle-orm';
import { index, integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { users } from './user';

export const userSessions = pgTable(
  'UserSession',
  {
    id: text('id').primaryKey(),
    userId: text('userId').notNull(),
    sessionId: text('sessionId').notNull(),
    startedAt: timestamp('startedAt', { mode: 'date' }).notNull(),
    lastActiveAt: timestamp('lastActiveAt', { mode: 'date' }).notNull(),
    endedAt: timestamp('endedAt', { mode: 'date' }),
    deviceType: text('deviceType'),
    userAgent: text('userAgent'),
    ipHash: text('ipHash'),
    pageCount: integer('pageCount').notNull().default(0),
    heartbeatCount: integer('heartbeatCount').notNull().default(1),
    createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
  },
  (table) => [
    index('UserSession_userId_startedAt_idx').on(table.userId, table.startedAt),
    index('UserSession_userId_endedAt_idx').on(table.userId, table.endedAt),
    index('UserSession_startedAt_idx').on(table.startedAt),
    index('UserSession_lastActiveAt_idx').on(table.lastActiveAt),
    index('UserSession_sessionId_idx').on(table.sessionId),
  ]
);

export type UserSession = typeof userSessions.$inferSelect;
export type NewUserSession = typeof userSessions.$inferInsert;

export const userSessionsRelations = relations(userSessions, ({ one }) => ({
  user: one(users, {
    fields: [userSessions.userId],
    references: [users.id],
  }),
}));
