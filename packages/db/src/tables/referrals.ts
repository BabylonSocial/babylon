import { relations } from 'drizzle-orm';
import {
  boolean,
  index,
  json,
  pgTable,
  text,
  timestamp,
  unique,
} from 'drizzle-orm/pg-core';
import type { JsonValue } from '../types';
import { users } from './user';

export const referrals = pgTable(
  'Referral',
  {
    id: text('id').primaryKey(),
    referrerId: text('referrerId').notNull(),
    referredUserId: text('referredUserId'),
    referralCode: text('referralCode').notNull(),
    status: text('status').notNull().default('pending'),
    createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
    completedAt: timestamp('completedAt', { mode: 'date' }),
    qualifiedAt: timestamp('qualifiedAt', { mode: 'date' }),
    signupPointsAwarded: boolean('signupPointsAwarded')
      .notNull()
      .default(false),
    suspiciousReferralFlags: json('suspiciousReferralFlags').$type<JsonValue>(),
  },
  (table) => [
    unique('Referral_referralCode_referredUserId_key').on(
      table.referralCode,
      table.referredUserId
    ),
    index('Referral_referralCode_idx').on(table.referralCode),
    index('Referral_referrerId_idx').on(table.referrerId),
    index('Referral_referredUserId_idx').on(table.referredUserId),
    index('Referral_status_createdAt_idx').on(table.status, table.createdAt),
    index('Referral_qualifiedAt_idx').on(table.qualifiedAt),
    index('Referral_referrerId_status_qualifiedAt_signupPointsAwarded_idx').on(
      table.referrerId,
      table.status,
      table.qualifiedAt,
      table.signupPointsAwarded
    ),
    index('Referral_referrerId_signupPointsAwarded_completedAt_idx').on(
      table.referrerId,
      table.signupPointsAwarded,
      table.completedAt
    ),
  ]
);

export type Referral = typeof referrals.$inferSelect;
export type NewReferral = typeof referrals.$inferInsert;

export const referralsRelations = relations(referrals, ({ one }) => ({
  User_Referral_referrerIdToUser: one(users, {
    fields: [referrals.referrerId],
    references: [users.id],
    relationName: 'Referral_referrerIdToUser',
  }),
  User_Referral_referredUserIdToUser: one(users, {
    fields: [referrals.referredUserId],
    references: [users.id],
    relationName: 'Referral_referredUserIdToUser',
  }),
}));
