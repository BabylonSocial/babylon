import { beforeEach, describe, expect, mock, test } from 'bun:test';

const rssRows: Array<{
  id: string;
  title: string;
  summary?: string | null;
  publishedAt: Date;
}> = [];

const parodyRows: Array<{
  originalHeadlineId: string;
  originalTitle: string;
  parodyTitle: string;
  generatedAt: Date;
}> = [];

const storedTopics: Array<Record<string, unknown>> = [];

const dbMock = {
  dailyTopic: {
    findFirst: mock(async (args?: Record<string, unknown>) => {
      const where = args?.where as
        | { date?: { equals?: Date; lt?: Date } }
        | undefined;
      if (where?.date?.equals) {
        return (
          storedTopics.find(
            (topic) =>
              (topic.date as Date).getTime() === where.date?.equals?.getTime()
          ) ?? null
        );
      }
      if (where?.date?.lt) {
        return (
          [...storedTopics]
            .filter((topic) => (topic.date as Date) < where.date!.lt!)
            .sort(
              (a, b) => (b.date as Date).getTime() - (a.date as Date).getTime()
            )[0] ?? null
        );
      }
      return null;
    }),
  },
  select: mock(() => ({
    from: mock((table: { __name: string }) => ({
      where: mock(() => ({
        orderBy: mock(() => ({
          limit: mock(() =>
            Promise.resolve(
              table.__name === 'rssHeadlines' ? [...rssRows] : [...parodyRows]
            )
          ),
        })),
      })),
    })),
  })),
  insert: mock(() => ({
    values: mock((data: Record<string, unknown>) => ({
      onConflictDoUpdate: mock(({ set }: { set: Record<string, unknown> }) => ({
        returning: mock(async () => {
          const existingIndex = storedTopics.findIndex(
            (topic) =>
              (topic.date as Date).getTime() === (data.date as Date).getTime()
          );

          if (existingIndex >= 0) {
            storedTopics[existingIndex] = {
              ...storedTopics[existingIndex],
              ...set,
            };
            return [storedTopics[existingIndex]];
          }

          storedTopics.push(data);
          return [data];
        }),
      })),
    })),
  })),
  delete: mock(() => ({
    where: mock(async () => []),
  })),
};

mock.module('@babylon/db', () => ({
  db: dbMock,
  dailyTopics: { __name: 'dailyTopics', id: 'id' },
  rssHeadlines: {
    __name: 'rssHeadlines',
    publishedAt: 'publishedAt',
    id: 'id',
  },
  parodyHeadlines: {
    __name: 'parodyHeadlines',
    generatedAt: 'generatedAt',
    originalHeadlineId: 'originalHeadlineId',
  },
  and: (...args: unknown[]) => args,
  desc: (value: unknown) => value,
  generateSnowflakeId: mock(async () => `topic-${storedTopics.length + 1}`),
  gte: (a: unknown, b: unknown) => [a, b],
}));

mock.module('@babylon/shared', () => ({
  logger: {
    info: mock(() => {}),
    warn: mock(() => {}),
  },
}));

import {
  buildDailyTopicPromptContext,
  dailyTopicService,
  deriveTopicFromText,
  isTextOnTopic,
  normalizeTopicDate,
} from '../services/daily-topic-service';

describe('daily-topic-service', () => {
  beforeEach(() => {
    rssRows.length = 0;
    parodyRows.length = 0;
    storedTopics.length = 0;
    dbMock.dailyTopic.findFirst.mockClear?.();
  });

  test('listCandidates ranks repeated headline topics highest', async () => {
    rssRows.push(
      {
        id: 'h1',
        title: 'OpenAI unveils new reasoning model',
        summary: 'OpenAI expands enterprise rollout',
        publishedAt: new Date('2026-03-06T08:00:00.000Z'),
      },
      {
        id: 'h2',
        title: 'OpenAI faces scrutiny over new launch',
        summary: 'Developers react to OpenAI roadmap',
        publishedAt: new Date('2026-03-06T09:00:00.000Z'),
      },
      {
        id: 'h3',
        title: 'Tesla changes pricing again',
        summary: 'Another Tesla pricing move',
        publishedAt: new Date('2026-03-06T09:30:00.000Z'),
      }
    );

    const candidates = await dailyTopicService.listCandidates(
      new Date('2026-03-06T12:00:00.000Z')
    );

    expect(candidates[0]?.topicKey).toBe('openai');
    expect(candidates[0]?.sourceHeadlineIds).toContain('h1');
    expect(candidates[0]?.sourceHeadlineIds).toContain('h2');
  });

  test('ensureTopicForDate falls back to previous topic when no candidates exist', async () => {
    storedTopics.push({
      id: 'prev-topic',
      date: new Date('2026-03-05T00:00:00.000Z'),
      topicKey: 'openai',
      topicLabel: 'OpenAI',
      summary: 'OpenAI dominates the day',
      sourceType: 'auto',
      sourceHeadlineIds: ['h1'],
      selectionReason: 'Matched headlines',
      isLocked: false,
      createdAt: new Date('2026-03-05T00:00:00.000Z'),
      updatedAt: new Date('2026-03-05T00:00:00.000Z'),
    });

    const topic = await dailyTopicService.ensureTopicForDate(
      new Date('2026-03-06T14:00:00.000Z')
    );

    expect(topic?.topicKey).toBe('openai');
    expect(topic?.sourceType).toBe('fallback_previous_day');
  });

  test('ensureTopicForDate falls back to default topic when no candidates exist yet', async () => {
    const topic = await dailyTopicService.ensureTopicForDate(
      new Date('2026-03-06T14:00:00.000Z')
    );

    expect(topic?.topicKey).toBe('general');
    expect(topic?.topicLabel).toBe('General');
    expect(topic?.sourceType).toBe('fallback_default');
  });

  test('helper functions derive prompt-safe topic context', () => {
    const topic = deriveTopicFromText(
      'OpenAI leadership drama continues through launch day',
      new Date('2026-03-06T14:00:00.000Z')
    );

    expect(
      normalizeTopicDate(new Date('2026-03-06T14:00:00.000Z')).toISOString()
    ).toBe('2026-03-06T00:00:00.000Z');
    expect(buildDailyTopicPromptContext(topic)).toContain(topic.topicLabel);
    expect(
      isTextOnTopic('Will OpenAI announce another feature today?', topic)
    ).toBe(true);
    expect(isTextOnTopic('Will Tesla stock jump today?', topic)).toBe(false);
  });
});
