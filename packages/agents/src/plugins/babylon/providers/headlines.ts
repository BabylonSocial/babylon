/**
 * Headlines Provider
 * Provides recent news headlines from RSS feeds
 */

import { db } from '@babylon/db/runtime';

import type {
  IAgentRuntime,
  Memory,
  Provider,
  ProviderResult,
  State,
} from '@elizaos/core';

/**
 * Provider: Recent Headlines
 * Gets recent news headlines from RSS feeds
 */
export const headlinesProvider: Provider = {
  name: 'BABYLON_HEADLINES',
  description: 'Get recent news headlines from RSS feeds',

  get: async (
    _runtime: IAgentRuntime,
    _message: Memory,
    _state: State
  ): Promise<ProviderResult> => {
    // Get recent headlines (last 24 hours)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const headlines = await db.rssHeadline.findMany({
      where: {
        publishedAt: {
          gte: yesterday,
        },
      },
      orderBy: {
        publishedAt: 'desc',
      },
      take: 15,
    });

    if (headlines.length === 0) {
      return { text: 'No recent headlines available.' };
    }

    const headlinesText = headlines
      .map((h, i) => {
        const timeAgo = getTimeAgo(h.publishedAt);
        return `${i + 1}. ${h.title}
   Source: ${h.sourceId}
   ${timeAgo}${h.summary ? `\n   ${h.summary.substring(0, 100)}...` : ''}`;
      })
      .join('\n\n');

    return {
      text: `Recent Headlines (Last 24h):

${headlinesText}`,
      data: {
        headlines: headlines.map((h) => ({
          id: h.id,
          title: h.title,
          source: h.sourceId,
          category: null,
          publishedAt: h.publishedAt,
          link: h.link,
          summary: h.summary,
        })),
      },
    };
  },
};

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
