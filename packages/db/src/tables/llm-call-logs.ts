import {
  doublePrecision,
  index,
  integer,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

export const llmCallLogs = pgTable(
  'llm_call_logs',
  {
    id: text('id').primaryKey(),
    trajectoryId: text('trajectoryId').notNull(),
    stepId: text('stepId').notNull(),
    callId: text('callId').notNull().unique(),
    timestamp: timestamp('timestamp', { mode: 'date' }).notNull(),
    latencyMs: integer('latencyMs'),
    model: text('model').notNull(),
    purpose: text('purpose').notNull(),
    actionType: text('actionType'),
    systemPrompt: text('systemPrompt').notNull(),
    userPrompt: text('userPrompt').notNull(),
    messagesJson: text('messagesJson'),
    response: text('response').notNull(),
    reasoning: text('reasoning'),
    temperature: doublePrecision('temperature').notNull(),
    maxTokens: integer('maxTokens').notNull(),
    topP: doublePrecision('topP'),
    promptTokens: integer('promptTokens'),
    completionTokens: integer('completionTokens'),
    totalTokens: integer('totalTokens'),
    metadata: text('metadata'),
    createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
  },
  (table) => [
    index('llm_call_logs_callId_idx').on(table.callId),
    index('llm_call_logs_timestamp_idx').on(table.timestamp),
    index('llm_call_logs_trajectoryId_idx').on(table.trajectoryId),
    index('llm_call_logs_createdAt_idx').on(table.createdAt),
  ]
);

export type LlmCallLog = typeof llmCallLogs.$inferSelect;
export type NewLlmCallLog = typeof llmCallLogs.$inferInsert;
