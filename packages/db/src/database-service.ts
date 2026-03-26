/**
 * Database Service
 *
 * @description Thin facade over table-local query helpers in `src/tables/*`.
 * Prefer importing helpers from the table module when you only need one domain.
 */

import { db } from './db';
import type { ActorStateRow } from './tables/actor-state';
import {
  countAllActorStates,
  getActorStateById,
  listAllActorStates,
  upsertActorStateRow,
} from './tables/actor-state';
import {
  getContinuousGameState,
  initializeContinuousGame,
  listAllGamesByCreatedDesc,
  updateContinuousGameState,
} from './tables/games';
import type { OrganizationStateRow } from './tables/organization-state';
import {
  countAllOrganizationStates,
  getOrganizationStateById,
  listAllOrganizationStates,
  listOrganizationStatesByPriceDesc,
  upsertOrganizationStateRow,
} from './tables/organization-state';
import type { FeedPost } from './tables/posts';
import {
  countAllPosts,
  createFeedPost,
  createManyFeedPosts,
  createPostWithAllFields,
  getPostsByActor,
  getRecentPosts,
} from './tables/posts';
import type { QuestionWithScenarioTimeframe } from './tables/questions';
import {
  countActiveQuestions,
  countAllQuestions,
  createQuestionRow,
  getActiveQuestionsWithTimeframe,
  getQuestionsReadyToResolve,
  listAllQuestionsWithTimeframe,
  resolveQuestionById,
} from './tables/questions';
import {
  getStockDailySnapshots,
  getStockPriceHistory,
  recordStockDailySnapshot,
  recordStockPriceUpdate,
} from './tables/stock-prices';
import {
  createWorldEventRow,
  getRecentWorldEvents,
} from './tables/world-events';

export type { FeedPost } from './tables/posts';

class DatabaseService {
  get db() {
    return db;
  }

  async initializeGame() {
    return initializeContinuousGame(db);
  }

  async getGameState() {
    return getContinuousGameState(db);
  }

  async updateGameState(data: {
    currentDay?: number;
    currentDate?: Date;
    lastTickAt?: Date;
    lastSnapshotAt?: Date;
    activeQuestions?: number;
  }) {
    return updateContinuousGameState(db, data);
  }

  async createPost(post: FeedPost & { gameId?: string; dayNumber?: number }) {
    return createFeedPost(db, post);
  }

  async createPostWithAllFields(
    data: Parameters<typeof createPostWithAllFields>[1]
  ) {
    return createPostWithAllFields(db, data);
  }

  async createManyPosts(
    postsData: Array<FeedPost & { gameId?: string; dayNumber?: number }>
  ) {
    return createManyFeedPosts(db, postsData);
  }

  async getRecentPosts(limit = 100, cursorOrOffset?: string | number) {
    return getRecentPosts(db, limit, cursorOrOffset);
  }

  async getPostsByActor(
    authorId: string,
    limit = 100,
    cursorOrOffset?: string | number
  ) {
    return getPostsByActor(db, authorId, limit, cursorOrOffset);
  }

  async getTotalPosts() {
    return countAllPosts(db);
  }

  async createQuestion(question: Parameters<typeof createQuestionRow>[1]) {
    return createQuestionRow(db, question);
  }

  async getActiveQuestions(
    timeframe?: string
  ): Promise<QuestionWithScenarioTimeframe[]> {
    return getActiveQuestionsWithTimeframe(db, timeframe);
  }

  async getQuestionsToResolve(): Promise<QuestionWithScenarioTimeframe[]> {
    return getQuestionsReadyToResolve(db);
  }

  async getAllQuestions(): Promise<QuestionWithScenarioTimeframe[]> {
    return listAllQuestionsWithTimeframe(db);
  }

  async resolveQuestion(id: string, resolvedOutcome: boolean) {
    return resolveQuestionById(db, id, resolvedOutcome);
  }

  async upsertOrganizationState(
    id: string,
    currentPrice: number | null
  ): Promise<OrganizationStateRow> {
    return upsertOrganizationStateRow(db, id, currentPrice);
  }

  async updateOrganizationPrice(
    id: string,
    price: number
  ): Promise<OrganizationStateRow> {
    return upsertOrganizationStateRow(db, id, price);
  }

  async getOrganizationState(id: string): Promise<OrganizationStateRow | null> {
    return getOrganizationStateById(db, id);
  }

  async getAllOrganizationStates(): Promise<OrganizationStateRow[]> {
    return listAllOrganizationStates(db);
  }

  async getOrganizationsByPrice(): Promise<OrganizationStateRow[]> {
    return listOrganizationStatesByPriceDesc(db);
  }

  async recordPriceUpdate(
    organizationId: string,
    price: number,
    change: number,
    changePercent: number
  ) {
    return recordStockPriceUpdate(
      db,
      organizationId,
      price,
      change,
      changePercent
    );
  }

  async recordDailySnapshot(
    organizationId: string,
    data: {
      openPrice: number;
      highPrice: number;
      lowPrice: number;
      closePrice: number;
      volume: number;
    }
  ) {
    return recordStockDailySnapshot(db, organizationId, data);
  }

  async getPriceHistory(organizationId: string, limit = 1440) {
    return getStockPriceHistory(db, organizationId, limit);
  }

  async getDailySnapshots(organizationId: string, days = 30) {
    return getStockDailySnapshots(db, organizationId, days);
  }

  async createEvent(event: Parameters<typeof createWorldEventRow>[1]) {
    return createWorldEventRow(db, event);
  }

  async getRecentEvents(limit = 100) {
    return getRecentWorldEvents(db, limit);
  }

  async upsertActorState(
    state: Partial<ActorStateRow> & { id: string }
  ): Promise<ActorStateRow> {
    return upsertActorStateRow(db, state);
  }

  async getAllActorStates(): Promise<ActorStateRow[]> {
    return listAllActorStates(db);
  }

  async getActorState(id: string): Promise<ActorStateRow | null> {
    return getActorStateById(db, id);
  }

  async getStats() {
    const [
      totalPosts,
      totalQuestions,
      activeQuestions,
      totalOrganizations,
      totalActors,
      gameState,
    ] = await Promise.all([
      countAllPosts(db),
      countAllQuestions(db),
      countActiveQuestions(db),
      countAllOrganizationStates(db),
      countAllActorStates(db),
      getContinuousGameState(db),
    ]);

    return {
      totalPosts,
      totalQuestions,
      activeQuestions,
      totalOrganizations,
      totalActors,
      currentDay: gameState?.currentDay ?? 1,
      isRunning: gameState?.isRunning || false,
    };
  }

  async getAllGames() {
    return listAllGamesByCreatedDesc(db);
  }
}

let dbInstance: DatabaseService | null = null;

export function getDbInstance(): DatabaseService {
  if (!dbInstance) {
    dbInstance = new DatabaseService();
  }
  return dbInstance;
}

export { DatabaseService };
