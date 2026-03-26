import { generateSnowflakeId } from '@babylon/shared';
import { and, count, desc, eq, gte, lte } from 'drizzle-orm';
import {
  boolean,
  doublePrecision,
  index,
  integer,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import type { DrizzleClient } from '../client';

export const questions = pgTable(
  'Question',
  {
    id: text('id').primaryKey(),
    questionNumber: integer('questionNumber').notNull().unique(),
    text: text('text').notNull(),
    scenarioId: integer('scenarioId').notNull(),
    outcome: boolean('outcome').notNull(),
    rank: integer('rank').notNull(),
    createdDate: timestamp('createdDate', { mode: 'date' })
      .notNull()
      .defaultNow(),
    resolutionDate: timestamp('resolutionDate', { mode: 'date' }).notNull(),
    status: text('status').notNull().default('active'),
    topicKey: text('topicKey'),
    topicLabel: text('topicLabel'),
    topicDate: timestamp('topicDate', { mode: 'date' }),
    resolvedOutcome: boolean('resolvedOutcome'),
    createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp('updatedAt', { mode: 'date' }).notNull(),
    oracleCommitBlock: integer('oracleCommitBlock'),
    oracleCommitTxHash: text('oracleCommitTxHash'),
    oracleCommitment: text('oracleCommitment'),
    oracleError: text('oracleError'),
    oraclePublishedAt: timestamp('oraclePublishedAt', { mode: 'date' }),
    oracleRevealBlock: integer('oracleRevealBlock'),
    oracleRevealTxHash: text('oracleRevealTxHash'),
    oracleSaltEncrypted: text('oracleSaltEncrypted'),
    oracleSessionId: text('oracleSessionId').unique(),
    resolutionProofUrl: text('resolutionProofUrl'),
    resolutionDescription: text('resolutionDescription'),
    resolutionConfidence: doublePrecision('resolutionConfidence'),
    requiresManualReview: boolean('requiresManualReview')
      .notNull()
      .default(false),
    resolutionReviewStatus: text('resolutionReviewStatus'),
    resolutionReviewedAt: timestamp('resolutionReviewedAt', { mode: 'date' }),
    resolutionReviewedBy: text('resolutionReviewedBy'),
  },
  (table) => [
    index('Question_createdDate_idx').on(table.createdDate),
    index('Question_oraclePublishedAt_idx').on(table.oraclePublishedAt),
    index('Question_oracleSessionId_idx').on(table.oracleSessionId),
    index('Question_status_resolutionDate_idx').on(
      table.status,
      table.resolutionDate
    ),
    index('Question_topicKey_topicDate_idx').on(
      table.topicKey,
      table.topicDate
    ),
    index('Question_requiresManualReview_status_idx').on(
      table.status,
      table.requiresManualReview,
      table.resolutionReviewStatus
    ),
  ]
);

export type Question = typeof questions.$inferSelect;
export type NewQuestion = typeof questions.$inferInsert;

export type QuestionWithScenarioTimeframe = Question & {
  scenario: number;
  timeframe: string;
};

function calculateTimeframe(resolutionDate: Date): string {
  const now = new Date();
  const msUntilResolution = resolutionDate.getTime() - now.getTime();
  const daysUntilResolution = Math.ceil(
    msUntilResolution / (1000 * 60 * 60 * 24)
  );

  if (daysUntilResolution <= 1) return '24h';
  if (daysUntilResolution <= 7) return '7d';
  if (daysUntilResolution <= 30) return '30d';
  return '30d+';
}

function adaptQuestion(dbQuestion: Question): QuestionWithScenarioTimeframe {
  return {
    ...dbQuestion,
    scenario: dbQuestion.scenarioId,
    timeframe: calculateTimeframe(dbQuestion.resolutionDate),
  };
}

export async function createQuestionRow(
  db: DrizzleClient,
  question: {
    text: string;
    scenario?: number;
    outcome?: boolean;
    rank?: number;
    createdDate?: string | Date;
    resolutionDate: string | Date;
    status?: string;
    resolvedOutcome?: boolean;
    questionNumber: number;
  }
) {
  const created = await db
    .insert(questions)
    .values({
      id: await generateSnowflakeId(),
      questionNumber: question.questionNumber,
      text: question.text,
      scenarioId: question.scenario ?? 0,
      outcome: question.outcome ?? false,
      rank: question.rank ?? 0,
      createdDate: new Date(question.createdDate || new Date()),
      resolutionDate: new Date(question.resolutionDate),
      status: question.status || 'active',
      resolvedOutcome: question.resolvedOutcome,
      updatedAt: new Date(),
    })
    .returning();

  return created[0]!;
}

export async function getActiveQuestionsWithTimeframe(
  db: DrizzleClient,
  timeframe?: string
) {
  const now = new Date();
  const conditions = [eq(questions.status, 'active')];

  if (timeframe) {
    let endDate: Date | undefined;

    switch (timeframe) {
      case '24h':
        endDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        conditions.push(gte(questions.resolutionDate, now));
        conditions.push(lte(questions.resolutionDate, endDate));
        break;
      case '7d':
        endDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        conditions.push(gte(questions.resolutionDate, now));
        conditions.push(lte(questions.resolutionDate, endDate));
        break;
      case '30d':
        endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        conditions.push(gte(questions.resolutionDate, now));
        conditions.push(lte(questions.resolutionDate, endDate));
        break;
      case '30d+': {
        const startDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        conditions.push(gte(questions.resolutionDate, startDate));
        break;
      }
    }
  }

  const result = await db
    .select()
    .from(questions)
    .where(and(...conditions))
    .orderBy(desc(questions.createdDate));

  return result.map((q) => adaptQuestion(q));
}

export async function getQuestionsReadyToResolve(db: DrizzleClient) {
  const result = await db
    .select()
    .from(questions)
    .where(
      and(
        eq(questions.status, 'active'),
        lte(questions.resolutionDate, new Date())
      )
    );

  return result.map((q) => adaptQuestion(q));
}

export async function listAllQuestionsWithTimeframe(db: DrizzleClient) {
  const result = await db
    .select()
    .from(questions)
    .orderBy(desc(questions.createdDate));

  return result.map((q) => adaptQuestion(q));
}

export async function resolveQuestionById(
  db: DrizzleClient,
  id: string,
  resolvedOutcome: boolean
) {
  const updated = await db
    .update(questions)
    .set({
      status: 'resolved',
      resolvedOutcome,
    })
    .where(eq(questions.id, id))
    .returning();

  return updated[0]!;
}

export async function countAllQuestions(db: DrizzleClient) {
  const result = await db.select({ count: count() }).from(questions);
  return Number(result[0]?.count ?? 0);
}

export async function countActiveQuestions(db: DrizzleClient) {
  const result = await db
    .select({ count: count() })
    .from(questions)
    .where(eq(questions.status, 'active'));
  return Number(result[0]?.count ?? 0);
}
