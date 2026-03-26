import { relations } from 'drizzle-orm';
import { dailyTopics } from './daily-topics';
import { parodyHeadlines } from './parody-headlines';
import { rssFeedSources } from './rss-feed-sources';
import { rssHeadlines } from './rss-headlines';

export const rssFeedSourcesRelations = relations(
  rssFeedSources,
  ({ many }) => ({
    headlines: many(rssHeadlines),
  })
);

export const rssHeadlinesRelations = relations(rssHeadlines, ({ one }) => ({
  source: one(rssFeedSources, {
    fields: [rssHeadlines.sourceId],
    references: [rssFeedSources.id],
  }),
  parodyHeadline: one(parodyHeadlines, {
    fields: [rssHeadlines.id],
    references: [parodyHeadlines.originalHeadlineId],
  }),
}));

export const parodyHeadlinesRelations = relations(
  parodyHeadlines,
  ({ one }) => ({
    originalHeadline: one(rssHeadlines, {
      fields: [parodyHeadlines.originalHeadlineId],
      references: [rssHeadlines.id],
    }),
  })
);

export const dailyTopicsRelations = relations(dailyTopics, () => ({}));
