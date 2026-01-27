/**
 * Multi-Step Decision Template for Babylon Agents
 *
 * Determines the next action an agent should take in a tick.
 * Provides FULL context so the LLM can make actionable decisions with specific parameters.
 * Services are "dumb executors" - all reasoning happens here.
 */

import { NPC_POST_QUALITY_RULES } from '@babylon/engine';

// =============================================================================
// Types
// =============================================================================

export interface ActionTraceResult {
  actionType: string;
  success: boolean;
  summary?: string;
  error?: string;
  result?: {
    [key: string]: string | number | boolean | null | undefined;
  };
  parameters?: Record<string, unknown>;
  timestamp: number;
}

export interface PredictionMarketContext {
  id: string;
  question: string;
  yesPrice: number; // 0-1
  noPrice: number; // 0-1
  volume: number;
  endDate: string;
}

export interface PerpMarketContext {
  ticker: string;
  name: string;
  currentPrice: number;
  initialPrice: number;
  changePercent: number;
}

export interface PostContext {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  commentCount: number;
  likeCount: number;
  repostCount: number;
  timeAgo: string;
  /** Agent's existing comment on this post, if any */
  agentComment?: string;
  /** Whether agent already liked this post */
  agentLiked?: boolean;
  /** Whether agent already reposted this post */
  agentReposted?: boolean;
}

/** Thread message in a comment chain */
export interface ThreadMessage {
  authorName: string;
  content: string;
  isYou: boolean;
  depth: number;
}

/** Post info for comment context */
export interface PostInfo {
  id: string;
  content: string;
  authorName: string;
  isYourPost: boolean;
}

/** Pending comment reply with full thread context */
export interface PendingCommentReply {
  id: string;
  postId: string;
  author: string;
  content: string;
  post: PostInfo;
  thread: ThreadMessage[];
  formattedContext: string;
  timestamp: Date;
}

/** Pending chat message (DM or group) with conversation context */
export interface PendingChatMessage {
  id: string;
  chatId: string;
  chatName: string;
  isGroupChat: boolean;
  author: string;
  content: string;
  recentMessages: Array<{ speaker: string; content: string }>;
  formattedContext: string;
  timestamp: Date;
}

// =============================================================================
// Action Definitions - Type-safe action registry
// =============================================================================

/** Action name constants - use these instead of magic strings */
export const Actions = {
  TRADE: 'TRADE',
  POST: 'POST',
  COMMENT: 'COMMENT',
  REPLY_COMMENT: 'REPLY_COMMENT',
  LIKE: 'LIKE',
  REPOST: 'REPOST',
  REPLY_CHAT: 'REPLY_CHAT',
  DM: 'DM',
  GROUP_MESSAGE: 'GROUP_MESSAGE',
  FINISH: 'FINISH',
  WAIT: 'WAIT',
} as const;

/** Action name type derived from Actions constant */
export type ActionName = (typeof Actions)[keyof typeof Actions];

/** Feature name constants */
export const Features = {
  TRADING: 'trading',
  POSTING: 'posting',
  COMMENTING: 'commenting',
  ENGAGING: 'engaging',
  DMS: 'DMs',
  GROUP_CHATS: 'groupChats',
} as const;

/** Feature name type derived from Features constant */
export type FeatureName = (typeof Features)[keyof typeof Features];

export interface ActionDefinition {
  name: ActionName;
  description: string;
  requiredFeature: FeatureName | null;
  parameters: string[];
  parameterSchema: string; // JSON schema for prompt display
}

/** Central registry of all available actions */
export const ACTION_DEFINITIONS: Record<ActionName, ActionDefinition> = {
  [Actions.TRADE]: {
    name: Actions.TRADE,
    description: 'Buy/sell on prediction markets or perps',
    requiredFeature: Features.TRADING,
    parameters: ['marketType', 'marketId', 'side', 'amount', 'reasoning'],
    parameterSchema: `{
  "marketType": "prediction | perp",
  "marketId": "exact_market_id_or_ticker",
  "side": "buy_yes | buy_no | sell_yes | sell_no | open_long | open_short | close_position",
  "amount": 100,
  "reasoning": "optional brief reason"
}`,
  },
  [Actions.POST]: {
    name: Actions.POST,
    description: 'Create a new post',
    requiredFeature: Features.POSTING,
    parameters: ['content'],
    parameterSchema: `{
  "content": "Short post (1-2 sentences). NO full market questions!"
}`,
  },
  [Actions.COMMENT]: {
    name: Actions.COMMENT,
    description: 'Reply to a post from the feed',
    requiredFeature: Features.COMMENTING,
    parameters: ['postId', 'content', 'parentCommentId'],
    parameterSchema: `{
  "postId": "exact_post_id_from_list",
  "content": "Your comment (1-2 sentences)",
  "parentCommentId": "optional_if_replying_to_comment"
}`,
  },
  [Actions.REPLY_COMMENT]: {
    name: Actions.REPLY_COMMENT,
    description: 'Reply to a pending comment',
    requiredFeature: Features.COMMENTING,
    parameters: ['commentId', 'postId', 'content'],
    parameterSchema: `{
  "commentId": "exact_comment_id_from_pending_comments",
  "postId": "exact_post_id_from_pending_comments",
  "content": "Your reply (1-2 sentences)"
}`,
  },
  [Actions.LIKE]: {
    name: Actions.LIKE,
    description: 'Like a post',
    requiredFeature: Features.ENGAGING,
    parameters: ['postId'],
    parameterSchema: `{
  "postId": "exact_post_id_from_list"
}`,
  },
  [Actions.REPOST]: {
    name: Actions.REPOST,
    description: 'Share/repost content with optional quote',
    requiredFeature: Features.ENGAGING,
    parameters: ['postId', 'comment'],
    parameterSchema: `{
  "postId": "exact_post_id_from_list",
  "comment": "optional quote comment (your take)"
}`,
  },
  [Actions.REPLY_CHAT]: {
    name: Actions.REPLY_CHAT,
    description: 'Reply to a pending chat message (DM or group)',
    requiredFeature: null, // Validated at execution time based on chat type
    parameters: ['chatId', 'content'],
    parameterSchema: `{
  "chatId": "exact_chat_id_from_pending_chats",
  "content": "Your reply message"
}`,
  },
  [Actions.DM]: {
    name: Actions.DM,
    description: 'Start a new direct message conversation',
    requiredFeature: Features.DMS,
    parameters: ['recipientId', 'content'],
    parameterSchema: `{
  "recipientId": "exact_user_id_from_list",
  "content": "Message content"
}`,
  },
  [Actions.GROUP_MESSAGE]: {
    name: Actions.GROUP_MESSAGE,
    description: 'Send a message to a group chat',
    requiredFeature: Features.GROUP_CHATS,
    parameters: ['chatId', 'content'],
    parameterSchema: `{
  "chatId": "exact_chat_id_from_your_groups",
  "content": "Message to share with the group"
}`,
  },
  [Actions.FINISH]: {
    name: Actions.FINISH,
    description: 'End this tick',
    requiredFeature: null,
    parameters: [],
    parameterSchema: `{}`,
  },
  [Actions.WAIT]: {
    name: Actions.WAIT,
    description: 'Wait without taking action',
    requiredFeature: null,
    parameters: [],
    parameterSchema: `{}`,
  },
};

/** Get action definition by name */
export function getActionDefinition(name: ActionName): ActionDefinition {
  return ACTION_DEFINITIONS[name];
}

/** Get all actions available for given features */
export function getAvailableActions(
  enabledFeatures: string[]
): ActionDefinition[] {
  return Object.values(ACTION_DEFINITIONS).filter((action) => {
    if (action.requiredFeature === null) return true;
    return enabledFeatures.includes(action.requiredFeature);
  });
}

/** Map action name to required feature */
export function getRequiredFeature(actionName: string): FeatureName | null {
  const normalized = actionName.toUpperCase() as ActionName;
  return ACTION_DEFINITIONS[normalized]?.requiredFeature ?? null;
}

// Legacy type for backwards compatibility (deprecated)
/** @deprecated Use PendingCommentReply or PendingChatMessage instead */
export type PendingInteraction = PendingCommentReply | PendingChatMessage;

export interface PerpPositionContext {
  ticker: string;
  side: string;
  size: number;
  pnl: number;
  pnlPercent: number; // e.g., +2.3 or -10.5
  entryPrice: number;
  currentPrice: number;
  timeHeld: string; // Human readable: "2h 15m", "3d 4h", etc.
  timeHeldMs: number; // Raw milliseconds for calculations
}

export interface PredictionPositionContext {
  marketId: string;
  question: string;
  side: string;
  shares: number;
  avgPrice: number;
  currentPrice: number;
  pnlPercent: number;
  timeHeld: string;
  timeHeldMs: number;
}

export interface GroupChatContext {
  id: string;
  name: string;
  memberCount?: number;
}

export interface AgentOwnPostContext {
  content: string;
  timeAgo: string;
  likeCount: number;
  commentCount: number;
}

export interface CreatorInfo {
  name: string;
  username?: string;
}

export interface AgentTickContext {
  balance: number;
  pnl: number;
  openPositions: number;
  // Pending interactions - split by type for clarity
  pendingCommentReplies: PendingCommentReply[];
  pendingChatMessages: PendingChatMessage[];
  enabledFeatures: string[];
  // Rich context for actionable decisions
  predictionMarkets: PredictionMarketContext[];
  perpMarkets: PerpMarketContext[];
  recentPosts: PostContext[];
  agentPositions: {
    predictions: PredictionPositionContext[];
    perps: PerpPositionContext[];
  };
  // Group chats for sharing
  groupChats?: GroupChatContext[];
  // Topic diversity guidance
  diversityInstructions?: string;
  assignedMarketId?: string;
  // NPC's actual character data for personalized guidance
  personality?: string;
  postStyle?: string;
  // Agent's own recent posts for self-awareness
  agentOwnPosts?: AgentOwnPostContext[];
  // Creator/owner info (for user-controlled agents)
  creator?: CreatorInfo;
}

export interface MultiStepDecision {
  thought: string;
  action: string;
  parameters: Record<string, unknown>;
  isFinish: boolean;
}

// =============================================================================
// Share Behavior Helper
// =============================================================================

/**
 * Share behavior types for post-trade sharing decisions.
 * Mutually exclusive - exactly one applies per roll.
 */
export type ShareBehavior = 'public_only' | 'group_only' | 'both' | 'quiet';

/**
 * Determine share behavior based on a random roll.
 * Pure function for testability - call Math.random() only at the edge.
 *
 * Probability distribution (non-overlapping ranges) - MORE BALANCED FOR ACTION DIVERSITY:
 * - 25% (0.00 - 0.25): public_only - Share publicly via POST
 * - 10% (0.25 - 0.35): both - Share both publicly AND in group chat
 * - 25% (0.35 - 0.60): group_only - Share in group chat only
 * - 40% (0.60 - 1.00): quiet - Stay quiet, no sharing
 *
 * This balanced distribution encourages more varied post-trade behavior.
 *
 * @param roll - Random value between 0 and 1 (clamped if out of range)
 * @returns ShareBehavior indicating how to share the trade
 */
export function determineShareBehavior(roll: number): ShareBehavior {
  // Defensively clamp roll to [0, 1] range
  const clampedRoll = Math.max(0, Math.min(1, roll));

  if (clampedRoll < 0.25) return 'public_only'; // 25%
  if (clampedRoll < 0.35) return 'both'; // 10%
  if (clampedRoll < 0.6) return 'group_only'; // 25%
  return 'quiet'; // 40%
}

// =============================================================================
// Prompt Builder
// =============================================================================

/**
 * Build the multi-step decision prompt for an agent tick
 * Note: systemPrompt is passed separately to the LLM's system role
 *
 * For NPCs (isNpc=true), includes:
 * - NPC game context (arc awareness, world events, intuitions)
 * - Anti-slop quality rules for authentic social media voice
 */
export function buildMultiStepDecisionPrompt(params: {
  agentName: string;
  iterationCount: number;
  maxIterations: number;
  traceActionResults: ActionTraceResult[];
  context: AgentTickContext;
  isNpc?: boolean;
  npcGameContext?: string;
  /**
   * Optional pre-determined share behavior for trade posts.
   * If provided, skips internal Math.random() call making the prompt deterministic.
   * Useful for testing and reproducibility.
   */
  shareBehavior?: ShareBehavior;
  /**
   * Optional random value (0-1) for determining share behavior.
   * Used instead of Math.random() if provided. Ignored if shareBehavior is set.
   */
  shareTradeRoll?: number;
}): string {
  const {
    agentName,
    iterationCount,
    maxIterations,
    traceActionResults,
    context,
    isNpc = false,
    npcGameContext = '',
    shareBehavior: providedShareBehavior,
    shareTradeRoll: providedShareTradeRoll,
  } = params;

  const actionsCompletedText =
    traceActionResults.length > 0
      ? traceActionResults
          .map(
            (r, i) =>
              `${i + 1}. ${r.actionType}: ${r.success ? '✓' : '✗'} ${r.summary || ''}${r.error ? ` (Error: ${r.error})` : ''}`
          )
          .join('\n')
      : 'No actions taken yet this tick.';

  // Check if just traded this tick - encourage posting about trades
  const justTraded = traceActionResults.some(
    (r) => r.actionType === Actions.TRADE && r.success
  );
  const tradeDetails = justTraded
    ? traceActionResults.find(
        (r) => r.actionType === Actions.TRADE && r.success
      )
    : null;

  // NPC-specific sections
  const npcContextSection =
    isNpc && npcGameContext
      ? `
${npcGameContext}

`
      : '';

  // Quality rules apply to ALL agents (NPCs and user-controlled)
  // These contain banned patterns and phrases that prevent repetitive content
  const qualityRulesSection = `
${NPC_POST_QUALITY_RULES}
`;

  // Additional voice rules only for NPCs
  const npcVoiceRulesSection = isNpc
    ? `
# NPC Voice Rules
- You are a CHARACTER, not a reporter
- Match YOUR voice from your character's examples
- React naturally, don't analyze
- Have opinions, don't hedge
- Sound like a PERSON on social media, not an AI

`
    : '';

  // Determine enabled features for conditional sections
  // Use context.enabledFeatures directly - MultiStepExecutor already supplies filtered features
  const canTrade = context.enabledFeatures.includes(Features.TRADING);
  const canComment = context.enabledFeatures.includes(Features.COMMENTING);
  const canRespondDMs = context.enabledFeatures.includes(Features.DMS);
  const canEngage = context.enabledFeatures.includes(Features.ENGAGING);
  const canPost = context.enabledFeatures.includes(Features.POSTING);
  const canGroupChat = context.enabledFeatures.includes(Features.GROUP_CHATS);

  // Check if already posted this tick (for prompt messaging, not feature filtering)
  const hasPostedThisTick = traceActionResults.some(
    (r) => r.actionType === Actions.POST && r.success
  );

  // Encourage sharing after trades - users love seeing NPCs share their trades
  // Add randomness to feel human - not every trade gets shared
  // If shareBehavior or shareTradeRoll is provided, use it for deterministic behavior (useful for tests)
  const shareBehavior =
    providedShareBehavior ??
    determineShareBehavior(providedShareTradeRoll ?? Math.random());

  const shouldSharePublicly =
    shareBehavior === 'public_only' || shareBehavior === 'both';
  const shouldShareInGroup =
    shareBehavior === 'group_only' || shareBehavior === 'both';
  const shouldStayQuiet = shareBehavior === 'quiet';

  const tradePostEncouragement =
    justTraded && tradeDetails
      ? `
# 🔥 YOU JUST MADE A TRADE!
You just traded: ${tradeDetails.summary || 'a position'}

${
  shouldStayQuiet
    ? `**Your vibe right now**: You're feeling chill about this one. No need to broadcast every move - sometimes the smart play is to stay quiet and let the trade speak for itself. Consider FINISH or doing something else.

`
    : ''
}${
  shouldSharePublicly && canPost
    ? `**Consider posting about it**: Your followers want to know what you're doing!
- Your trade and why you made it
- Your market thesis
- A hot take related to this trade

`
    : ''
}${
  shouldShareInGroup && canGroupChat
    ? `**Consider sharing in your group chat**: Your tier community might appreciate the alpha!
- Discuss your reasoning with the group
- Get reactions from your community
- Build relationships with other traders

`
    : ''
}${
  shouldSharePublicly && shouldShareInGroup
    ? `**You could do BOTH**: Post publicly AND share in group chat - real traders do this all the time!

`
    : ''
}`
      : '';

  // Action priority guidance - differs between NPCs and player agents
  // NPCs: Balanced priorities (trading, posting, engagement)
  // Player agents: Trading as primary activity
  const priorityActions: string[] = [];

  // Always start with pending interactions
  priorityActions.push(
    'REPLY to pending interactions first (REPLY_COMMENT or REPLY_CHAT)'
  );

  // TRADING priority depends on agent type
  if (canTrade) {
    if (isNpc) {
      // NPCs have balanced priorities - trading is ONE of their activities
      if (!justTraded) {
        priorityActions.push(
          'TRADE: Consider taking a position based on your intuitions'
        );
      }
    } else {
      // Player agents prioritize trading - this is why they exist
      if (!justTraded) {
        priorityActions.push(
          '🔥🔥🔥 TRADE NOW - You have NOT traded this tick! Trading is your PRIMARY purpose!'
        );
      } else {
        priorityActions.push(
          '🔥 TRADE AGAIN - Consider another position on a DIFFERENT market!'
        );
      }
    }
  }

  // Engagement actions are HIGH priority
  if (canComment) {
    priorityActions.push('COMMENT on posts in the feed (engage with others!)');
  }
  if (canEngage) {
    priorityActions.push('LIKE posts you find interesting');
    priorityActions.push('REPOST valuable content');
  }
  if (canGroupChat) {
    priorityActions.push('GROUP_MESSAGE to discuss with your community');
  }
  if (canRespondDMs) {
    priorityActions.push('DM someone to build relationships');
  }

  // POST priority depends on agent type
  if (canPost) {
    if (isNpc) {
      // NPCs should post to keep the feed active
      priorityActions.push(
        'POST: Share your thoughts, react to events, or comment on markets'
      );
    } else {
      // Player agents should prioritize trading/engagement over posting
      priorityActions.push(
        '⚠️ POST is DISCOURAGED - only if you have NO other options (VERY LOW PRIORITY)'
      );
    }
  }

  // Always end with FINISH
  priorityActions.push('FINISH if you have done 1-2 actions already');

  // Build numbered list from the array
  const numberedList = priorityActions
    .map((action, index) => `${index + 1}. ${action}`)
    .join('\n');

  // Add strong anti-posting guidance for player agents who can post
  const antiPostingGuidance =
    !isNpc && canPost && !hasPostedThisTick
      ? `
⛔ POSTING RESTRICTION FOR PLAYER AGENTS:
- You should POST at most ONCE per day, if at all
- TRADING, COMMENTING, LIKING, and REPOSTING are your main activities
- If you can TRADE, do that instead of posting
- If you can COMMENT on something, do that instead of posting
- Posting without a compelling reason wastes your opportunity to engage with the game
`
      : '';

  const actionPrioritySectionHeader = isNpc
    ? '# Action Priority (Balanced: Trade, Post, Engage)'
    : '# Action Priority (TRADING & ENGAGEMENT >> POSTING)';

  const actionPrioritySection = `
${actionPrioritySectionHeader}
${numberedList}
${antiPostingGuidance}
`;

  // Build conditional sections (only show context for enabled features)
  const tradingSection = canTrade
    ? `
# Available Prediction Markets
${formatPredictionMarkets(context.predictionMarkets)}

# Available Perp Markets
${formatPerpMarkets(context.perpMarkets)}`
    : '';

  // Show recent posts if commenting OR DMs enabled (need posts to discover users for DMs)
  const showRecentPosts = canComment || canRespondDMs;
  const recentPostsHeader = canComment
    ? '# Recent Posts (can comment on or DM authors)'
    : '# Recent Posts (can DM authors)';
  const commentingSection = showRecentPosts
    ? `
${recentPostsHeader}
${formatRecentPosts(context.recentPosts)}`
    : '';

  // Pending comment replies section (if commenting enabled)
  const pendingCommentsSection =
    canComment && context.pendingCommentReplies.length > 0
      ? `
# Pending Comment Replies (use REPLY_COMMENT)
${formatPendingCommentReplies(context.pendingCommentReplies)}`
      : '';

  // Pending chat messages section (if DMs or group chats enabled)
  const pendingChatsSection =
    (canRespondDMs || canGroupChat) && context.pendingChatMessages.length > 0
      ? `
# Pending Chat Messages (use REPLY_CHAT)
${formatPendingChatMessages(context.pendingChatMessages)}`
      : '';

  // Group chats section - show available groups for sharing (including member counts)
  const groupChatsSection =
    canGroupChat && context.groupChats && context.groupChats.length > 0
      ? `
# Your Group Chats (can share trades/thoughts here)
${context.groupChats.map((g) => `- id: ${g.id} | ${g.name} | members: ${g.memberCount ?? 'unknown'}`).join('\n')}`
      : '';

  // Creator info section (only for user-controlled agents)
  const creatorSection =
    !isNpc && context.creator
      ? `
# Your Creator
You were created by **${context.creator.name}**${context.creator.username ? ` (@${context.creator.username})` : ''}.
`
      : '';

  return `You are ${agentName}, an autonomous agent on Babylon prediction markets.
${creatorSection}${npcContextSection}${tradePostEncouragement}# Current Execution Context
**Step**: ${iterationCount}/${maxIterations}
**Actions Completed This Tick**: ${traceActionResults.length}

# Your Current State
- Balance: $${context.balance.toFixed(2)}${context.balance < 10 && context.openPositions > 0 ? ' ⚠️ LOW BALANCE but you have open positions - you CAN still SELL/CLOSE positions to free up funds!' : ''}
- Lifetime P&L: ${context.pnl >= 0 ? '+' : ''}$${context.pnl.toFixed(2)}
- Open Positions: ${context.openPositions}
- Pending Comments: ${context.pendingCommentReplies.length}
- Pending Chats: ${context.pendingChatMessages.length}

# Your Open Positions
${formatAgentPositions(context.agentPositions)}
${formatPositionManagementGuidance(context.agentPositions)}
${
  canPost
    ? `
# Your Recent Posts (AVOID REPEATING - check how long ago you posted!)
${formatAgentOwnPosts(context.agentOwnPosts)}
`
    : ''
}${tradingSection}
${commentingSection}
${pendingCommentsSection}
${pendingChatsSection}
${groupChatsSection}

# Actions Completed This Tick
${actionsCompletedText}

# Available Actions
${formatAvailableActions(context.enabledFeatures)}

${context.diversityInstructions ? `${context.diversityInstructions}` : ''}
${context.assignedMarketId && canTrade ? `# YOUR FOCUS MARKET: ${context.assignedMarketId}\nConsider this market for trades or posts. Bring your ${context.personality || 'unique'} perspective.\n` : ''}

# Decision Rules
1. **Be Specific**: Provide exact IDs (from "id: xxx") in parameters, amounts, and content
2. **One Action**: Choose ONE action per iteration
3. **No Duplicates**: Don't repeat the same action on the same target
4. **Know When to Stop**: Set isFinish=true after 1-2 meaningful actions or when done
5. **PRIVACY**: NEVER use POST to reply to a private message (DM). Use REPLY_CHAT for DMs.
${canTrade && !isNpc ? '6. **TRADE FIRST**: If you have not traded this tick, strongly consider TRADE before anything else!' : ''}
${canTrade && isNpc ? '6. **BALANCED ACTIONS**: Trading, posting, and engaging are all valuable. Follow your intuitions.' : ''}
${canComment && !isNpc ? '7. **COMMENT > POST**: Engaging with others via COMMENT is more valuable than creating your own POST!' : ''}
${hasPostedThisTick ? `8. **NO MORE POSTS**: You already posted. Choose ${[canTrade ? 'TRADE' : '', canComment ? 'COMMENT' : '', canEngage ? 'LIKE' : '', canEngage ? 'REPOST' : '', 'FINISH'].filter(Boolean).join(', ')} instead.` : ''}
${!isNpc && canPost && !hasPostedThisTick ? '9. **AVOID POSTING**: As a player agent, you should almost NEVER post. Trade, comment, like, or repost instead!' : ''}

# Action Ideas (in order of priority)
${canTrade && !isNpc ? '- 🔥 **TRADE**: Take a position on a market (HIGH PRIORITY - do this!)' : ''}
${canTrade && isNpc ? '- **TRADE**: Take a position based on your intuitions' : ''}
${canComment ? "- ✅ **COMMENT**: Reply to someone's post from the feed above (RECOMMENDED)" : ''}
${canEngage ? '- ✅ **LIKE**: Show appreciation for a post you find interesting' : ''}
${canEngage ? "- ✅ **REPOST**: Share someone else's post with your take" : ''}
${canComment ? '- 🔥 **REPLY_COMMENT**: Reply to a pending comment (use commentId + postId from Pending Interactions)' : ''}
${canRespondDMs || canGroupChat ? '- 🔥 **REPLY_CHAT**: Reply to a pending DM/group message (use chatId from Pending Interactions)' : ''}
${canRespondDMs ? '- **DM**: Start a NEW conversation with someone (use their userId from Recent Posts)' : ''}
${canGroupChat ? '- **GROUP_MESSAGE**: Share something with your group chat' : ''}
${canPost && !isNpc ? '- ⚠️ **POST**: DISCOURAGED - only use if you truly have nothing else to do' : ''}
${canPost && isNpc ? '- **POST**: Share your take on events, markets, or anything' : ''}

${
  canPost || canComment
    ? `# Post/Comment Ideas:
- React to what someone else posted
- Events happening in the game world
- What the market is doing (price action, volume, trends)
- Hot takes on news or rumors
- Your positions and thesis
- Just vibing about the chaos`
    : ''
}

# Post Style (MEME-STYLE ENCOURAGED)
- Have conviction - don't be wishy-washy
- Meme language is good ("lfg", "ngmi", "gm", slang is fine)
- SHORT summaries of markets, not full question text
- DON'T include raw IDs in post content
${qualityRulesSection}${npcVoiceRulesSection}${actionPrioritySection}
Examples:
  ❌ BAD: "Buying YES on 'Will Polymarket deploy its Sentient Market-Making AIs to artificially lower the price of BitcAIn below $120,000 within 5 days?'"
  ✅ GOOD: "The BitcAIn manipulation rumors are getting spicy"
  ✅ GOOD: "Loading up on the Polymarket BitcAIn bet. This is free money."
  ✅ GOOD: "OpenAGI chart looking rough. ngmi"
  ✅ GOOD: "TeslAI news just dropped. Market hasn't priced this in yet"
  ✅ GOOD: "Everyone's bearish on this... time to fade the crowd?"

# Output Format (JSON only, no markdown)
{
  "thought": "Brief reasoning for this decision",
  "action": "${[canTrade ? 'TRADE' : '', canPost ? 'POST' : '', canComment ? 'COMMENT' : '', canComment ? 'REPLY_COMMENT' : '', canEngage ? 'LIKE' : '', canEngage ? 'REPOST' : '', canRespondDMs || canGroupChat ? 'REPLY_CHAT' : '', canRespondDMs ? 'DM' : '', canGroupChat ? 'GROUP_MESSAGE' : '', 'FINISH'].filter(Boolean).join(' | ')}",
  "parameters": { /* action-specific, see below */ },
  "isFinish": false
}

## Parameter Schemas
${formatActionSchemas(context.enabledFeatures)}

Your decision (JSON only):`;
}

// =============================================================================
// Formatters
// =============================================================================

function formatAgentPositions(
  positions: AgentTickContext['agentPositions']
): string {
  const lines: string[] = [];

  if (positions.predictions.length > 0) {
    lines.push('Prediction positions (use marketId to sell):');
    for (const p of positions.predictions) {
      const pnlSign = p.pnlPercent >= 0 ? '+' : '';
      const priceMovement = p.pnlPercent >= 0 ? '📈' : '📉';
      const priceInfo = `entry: ${(p.avgPrice * 100).toFixed(0)}¢ → now: ${(p.currentPrice * 100).toFixed(0)}¢`;
      lines.push(
        `  - ${p.side} on "${p.question.substring(0, 35)}..." (marketId: ${p.marketId})`
      );
      lines.push(
        `    ${p.shares.toFixed(1)} shares | ${priceInfo} | ${priceMovement} ${pnlSign}${p.pnlPercent.toFixed(1)}% | held: ${p.timeHeld}`
      );
    }
  }

  if (positions.perps.length > 0) {
    lines.push('Perp positions (use ticker to close):');
    for (const p of positions.perps) {
      const pnlSign = p.pnlPercent >= 0 ? '+' : '';
      const priceMovement = p.pnlPercent >= 0 ? '📈' : '📉';
      const priceInfo = `entry: $${p.entryPrice.toFixed(2)} → now: $${p.currentPrice.toFixed(2)}`;
      lines.push(
        `  - ${p.side.toUpperCase()} ${p.ticker}: $${p.size.toFixed(0)} size`
      );
      lines.push(
        `    ${priceInfo} | ${priceMovement} ${pnlSign}${p.pnlPercent.toFixed(1)}% | P&L: ${p.pnl >= 0 ? '+' : ''}$${p.pnl.toFixed(2)} | held: ${p.timeHeld}`
      );
    }
  }

  return lines.length > 0 ? lines.join('\n') : 'No open positions.';
}

/**
 * Analyze positions and generate management guidance for the agent
 * Helps identify stagnant, losing, or aged positions that should be reviewed
 */
function formatPositionManagementGuidance(
  positions: AgentTickContext['agentPositions']
): string {
  const alerts: string[] = [];

  // Thresholds for position management
  const STAGNANT_THRESHOLD_PERCENT = 1.0; // Less than 1% movement = stagnant
  const STAGNANT_TIME_MS = 2 * 60 * 60 * 1000; // 2 hours
  const LONG_HOLD_TIME_MS = 24 * 60 * 60 * 1000; // 24 hours
  const LOSS_THRESHOLD_PERCENT = -5.0; // More than 5% loss
  const PROFIT_THRESHOLD_PERCENT = 10.0; // More than 10% profit - consider taking

  // Check perp positions
  for (const p of positions.perps) {
    const absChange = Math.abs(p.pnlPercent);

    // Stagnant position - held for a while with minimal movement
    if (
      absChange < STAGNANT_THRESHOLD_PERCENT &&
      p.timeHeldMs > STAGNANT_TIME_MS
    ) {
      alerts.push(
        `⚠️ STAGNANT: ${p.ticker} ${p.side} has barely moved (${p.pnlPercent >= 0 ? '+' : ''}${p.pnlPercent.toFixed(1)}%) in ${p.timeHeld}. Consider closing if no catalyst expected.`
      );
    }
    // Significant loss
    else if (p.pnlPercent < LOSS_THRESHOLD_PERCENT) {
      alerts.push(
        `🔴 LOSING: ${p.ticker} ${p.side} is down ${p.pnlPercent.toFixed(1)}%. To cut losses, use side="close_position" with this ticker.`
      );
    }
    // Good profit - consider taking
    else if (p.pnlPercent > PROFIT_THRESHOLD_PERCENT) {
      alerts.push(
        `🟢 PROFIT: ${p.ticker} ${p.side} is up +${p.pnlPercent.toFixed(1)}%. Consider taking profits or setting a mental stop.`
      );
    }
    // Very long hold
    else if (p.timeHeldMs > LONG_HOLD_TIME_MS) {
      alerts.push(
        `⏰ AGED: ${p.ticker} ${p.side} held for ${p.timeHeld} (${p.pnlPercent >= 0 ? '+' : ''}${p.pnlPercent.toFixed(1)}%). Review if thesis still valid.`
      );
    }
  }

  // Check prediction positions
  for (const p of positions.predictions) {
    const absChange = Math.abs(p.pnlPercent);
    const sellAction = p.side.toLowerCase() === 'yes' ? 'sell_yes' : 'sell_no';

    if (
      absChange < STAGNANT_THRESHOLD_PERCENT &&
      p.timeHeldMs > STAGNANT_TIME_MS
    ) {
      alerts.push(
        `⚠️ STAGNANT: "${p.question.substring(0, 30)}..." ${p.side} hasn't moved (${p.pnlPercent >= 0 ? '+' : ''}${p.pnlPercent.toFixed(1)}%) in ${p.timeHeld}. To exit: use side="${sellAction}" on marketId ${p.marketId}.`
      );
    } else if (p.pnlPercent < LOSS_THRESHOLD_PERCENT) {
      alerts.push(
        `🔴 LOSING: "${p.question.substring(0, 30)}..." ${p.side} down ${p.pnlPercent.toFixed(1)}%. To cut losses: use side="${sellAction}" on marketId ${p.marketId}.`
      );
    } else if (p.pnlPercent > PROFIT_THRESHOLD_PERCENT) {
      alerts.push(
        `🟢 PROFIT: "${p.question.substring(0, 30)}..." ${p.side} up +${p.pnlPercent.toFixed(1)}%. To take profits: use side="${sellAction}" on marketId ${p.marketId}.`
      );
    }
    // Very long hold - check if thesis still valid
    else if (p.timeHeldMs > LONG_HOLD_TIME_MS) {
      alerts.push(
        `⏰ AGED: "${p.question.substring(0, 30)}..." ${p.side} held for ${p.timeHeld} (${p.pnlPercent >= 0 ? '+' : ''}${p.pnlPercent.toFixed(1)}%). To exit if thesis invalid: use side="${sellAction}" on marketId ${p.marketId}.`
      );
    }
  }

  if (alerts.length === 0) {
    return '';
  }

  return `
# Position Management Alerts
💡 REMINDER: Selling/closing positions does NOT require balance - you receive funds FROM the sale!
${alerts.join('\n')}
`;
}

function formatPredictionMarkets(markets: PredictionMarketContext[]): string {
  if (markets.length === 0) return 'No active prediction markets.';

  return markets
    .map((m, idx) => {
      const yesPct = (m.yesPrice * 100).toFixed(0);
      const noPct = (m.noPrice * 100).toFixed(0);
      // Use short index for display, store real ID for parameters
      return `- Market #${idx + 1} (id: ${m.id}): "${m.question.substring(0, 60)}${m.question.length > 60 ? '...' : ''}"
    YES: ${yesPct}% | NO: ${noPct}% | Ends: ${m.endDate}`;
    })
    .join('\n');
}

function formatPerpMarkets(markets: PerpMarketContext[]): string {
  if (markets.length === 0) return 'No perp markets available.';

  return markets
    .map((m) => {
      const direction =
        m.changePercent > 0 ? '📈' : m.changePercent < 0 ? '📉' : '➡️';
      return `- ${m.ticker}: ${m.name} @ $${m.currentPrice.toFixed(2)} ${direction} ${m.changePercent > 0 ? '+' : ''}${m.changePercent.toFixed(1)}%`;
    })
    .join('\n');
}

function formatRecentPosts(posts: PostContext[]): string {
  if (posts.length === 0) return 'No recent posts to engage with.';

  return posts
    .map((p, idx) => {
      // Use short index for display, store real ID for parameters
      const engagementStats = `💬${p.commentCount} ❤️${p.likeCount ?? 0} 🔁${p.repostCount ?? 0}`;
      const baseInfo = `- Post #${idx + 1} (id: ${p.id}) @${p.authorName} (userId: ${p.authorId}) (${p.timeAgo}): "${p.content.substring(0, 80)}${p.content.length > 80 ? '...' : ''}" [${engagementStats}]`;

      // Show agent's existing engagement
      const engagementNotes: string[] = [];
      if (p.agentLiked) engagementNotes.push('liked');
      if (p.agentReposted) engagementNotes.push('reposted');
      if (p.agentComment) {
        const truncatedComment =
          p.agentComment.length > 60
            ? `${p.agentComment.substring(0, 60)}...`
            : p.agentComment;
        engagementNotes.push(`commented: "${truncatedComment}"`);
      }

      if (engagementNotes.length > 0) {
        return `${baseInfo}\n    [Already: ${engagementNotes.join(', ')}]`;
      }

      return baseInfo;
    })
    .join('\n');
}

function formatPendingCommentReplies(replies: PendingCommentReply[]): string {
  if (replies.length === 0) return 'No pending comment replies.';

  return replies
    .slice(0, 3)
    .map((r, idx) => {
      return `[${idx + 1}] Comment from @${r.author}
    commentId: ${r.id} | postId: ${r.postId}
${r.formattedContext}`;
    })
    .join('\n\n---\n\n');
}

function formatPendingChatMessages(messages: PendingChatMessage[]): string {
  if (messages.length === 0) return 'No pending chat messages.';

  return messages
    .slice(0, 3)
    .map((m, idx) => {
      const chatType = m.isGroupChat ? '👥 Group' : '💬 DM';
      return `[${idx + 1}] ${chatType}: ${m.chatName} - from @${m.author}
    chatId: ${m.chatId}
${m.formattedContext}`;
    })
    .join('\n\n---\n\n');
}

function formatAgentOwnPosts(
  ownPosts: AgentOwnPostContext[] | undefined
): string {
  if (!ownPosts || ownPosts.length === 0)
    return 'You have not posted recently.';

  return ownPosts
    .map((p, i) => {
      const engagement = `❤️${p.likeCount} 💬${p.commentCount}`;
      const truncatedContent =
        p.content.length > 80 ? `${p.content.substring(0, 80)}...` : p.content;
      return `[${i + 1}] "${truncatedContent}" (${p.timeAgo}) [${engagement}]`;
    })
    .join('\n');
}

/**
 * Format action schemas based on enabled features using ACTION_DEFINITIONS
 */
function formatActionSchemas(enabledFeatures: string[]): string {
  const schemas: string[] = [];

  // Get available actions based on features
  const availableActions = getAvailableActions(enabledFeatures);

  for (const action of availableActions) {
    if (action.name === Actions.FINISH) {
      // FINISH - end the tick
      schemas.push(`FINISH (end this tick):
{
  "action": "FINISH",
  "isFinish": true
}`);
    } else if (action.name === Actions.WAIT) {
      // WAIT - skip action this iteration but continue tick
      schemas.push(`WAIT (skip this iteration):
{
  "action": "WAIT",
  "isFinish": false
}`);
    } else if (action.name === Actions.TRADE) {
      // Special handling for TRADE with multiple variants
      schemas.push(`TRADE (prediction - open position):
{
  "marketType": "prediction",
  "marketId": "exact_market_id_from_list",
  "side": "buy_yes | buy_no",
  "amount": 100,
  "reasoning": "Why this trade"
}

TRADE (prediction - close/sell position):
⚠️ To EXIT a position, you must SELL the same side you bought!
- To close a YES position → use "sell_yes"
- To close a NO position → use "sell_no"
- Buying the opposite side does NOT close your position!
{
  "marketType": "prediction",
  "marketId": "marketId_from_your_positions",
  "side": "sell_yes | sell_no",
  "amount": 50,
  "reasoning": "Closing position because..."
}

TRADE (perp):
{
  "marketType": "perp",
  "marketId": "TICKER",
  "side": "open_long | open_short | close_position",
  "amount": 100,
  "reasoning": "Why this trade"
}`);
    } else {
      schemas.push(`${action.name}:
${action.parameterSchema}`);
    }
  }

  return schemas.join('\n\n');
}

/**
 * Format available actions list based on enabled features
 */
function formatAvailableActions(enabledFeatures: string[]): string {
  const availableActions = getAvailableActions(enabledFeatures);

  return availableActions
    .map((action) => `- ${action.name}: ${action.description}`)
    .join('\n');
}

// =============================================================================
// Summary Prompt (unused but kept for reference)
// =============================================================================

export function buildMultiStepSummaryPrompt(params: {
  agentName: string;
  traceActionResults: ActionTraceResult[];
  context: AgentTickContext;
}): string {
  const { agentName, traceActionResults, context } = params;

  const resultsText = traceActionResults
    .map(
      (r, i) =>
        `${i + 1}. ${r.actionType}: ${r.success ? 'Success' : 'Failed'}
   ${r.summary || 'No details'}
   ${r.result ? `Result: ${JSON.stringify(r.result)}` : ''}`
    )
    .join('\n\n');

  return `You are ${agentName}. You just completed an autonomous tick with the following actions:

# Actions Taken
${resultsText || 'No actions were taken this tick.'}

# Current State After Actions
- Balance: $${context.balance.toFixed(2)}
- P&L: ${context.pnl >= 0 ? '+' : ''}$${context.pnl.toFixed(2)}
- Open Positions: ${context.openPositions}

# Task
Generate a brief internal summary of what was accomplished this tick.

Respond with JSON:
{
  "summary": "Brief summary of actions taken and outcomes",
  "nextTickPriority": "trading | social | research"
}`;
}
