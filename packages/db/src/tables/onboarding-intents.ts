import { relations } from 'drizzle-orm';
import {
  boolean,
  index,
  json,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import type { JsonValue } from '../types';
import { onboardingStatusEnum } from './enums';
import { users } from './user';

export const onboardingIntents = pgTable(
  'OnboardingIntent',
  {
    id: text('id').primaryKey(),
    userId: text('userId').notNull().unique(),
    status: onboardingStatusEnum('status').notNull().default('PENDING_PROFILE'),
    referralCode: text('referralCode'),
    payload: json('payload').$type<JsonValue>(),
    profileApplied: boolean('profileApplied').notNull().default(false),
    profileCompletedAt: timestamp('profileCompletedAt', { mode: 'date' }),
    onchainStartedAt: timestamp('onchainStartedAt', { mode: 'date' }),
    onchainCompletedAt: timestamp('onchainCompletedAt', { mode: 'date' }),
    lastError: json('lastError').$type<JsonValue>(),
    createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp('updatedAt', { mode: 'date' }).notNull(),
  },
  (table) => [
    index('OnboardingIntent_createdAt_idx').on(table.createdAt),
    index('OnboardingIntent_status_idx').on(table.status),
  ]
);

export type OnboardingIntent = typeof onboardingIntents.$inferSelect;
export type NewOnboardingIntent = typeof onboardingIntents.$inferInsert;

export const onboardingIntentsRelations = relations(
  onboardingIntents,
  ({ one }) => ({
    user: one(users, {
      fields: [onboardingIntents.userId],
      references: [users.id],
    }),
  })
);
