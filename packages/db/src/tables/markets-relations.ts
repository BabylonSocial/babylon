import { relations } from 'drizzle-orm';
import { markets } from './markets';
import { organizations } from './organizations';
import { positions } from './positions';
import { predictionPriceHistories } from './prediction-price-histories';
import { questions } from './questions';
import { stockPrices } from './stock-prices';
import { users } from './user';

export const marketsRelations = relations(markets, ({ many }) => ({
  positions: many(positions),
  priceHistory: many(predictionPriceHistories),
}));

export const questionsRelations = relations(questions, ({ many }) => ({
  positions: many(positions),
}));

export const positionsRelations = relations(positions, ({ one }) => ({
  Market: one(markets, {
    fields: [positions.marketId],
    references: [markets.id],
  }),
  Question: one(questions, {
    fields: [positions.questionId],
    references: [questions.questionNumber],
  }),
  User: one(users, {
    fields: [positions.userId],
    references: [users.id],
  }),
}));

export const predictionPriceHistoriesRelations = relations(
  predictionPriceHistories,
  ({ one }) => ({
    market: one(markets, {
      fields: [predictionPriceHistories.marketId],
      references: [markets.id],
    }),
  })
);

export const organizationsRelations = relations(organizations, ({ many }) => ({
  stockPrices: many(stockPrices),
}));

export const stockPricesRelations = relations(stockPrices, ({ one }) => ({
  Organization: one(organizations, {
    fields: [stockPrices.organizationId],
    references: [organizations.id],
  }),
}));
