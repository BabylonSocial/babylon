/**
 * Team Chat Coordinator API
 *
 * Handles messages in team chat when no agents are tagged.
 * Uses a global coordinator runtime with limited actions.
 *
 * @route POST /api/agents/team-chat/coordinator
 * @access Authenticated
 *
 * @description
 * The coordinator helps users understand Babylon and coordinate their agents.
 * It uses plugin-user-core (read-only actions) instead of plugin-agent-core.
 * Responses are displayed without message bubbles (full-width text).
 *
 * Efficiency optimizations (refactor/coordinator-efficiency):
 * - composeState() called only on first iteration; subsequent iterations
 *   reuse the state object and only re-fetch DISPATCH_HISTORY after dispatches
 * - Summary phase reuses the last decision state instead of re-composing
 * - Decision prompt conditionally includes multi-agent orchestration docs
 * - Summary template stripped to minimal context needed for synthesis
 * - Parse retries use format reinforcement hints + lower temperature
 * - All requests instrumented with action-type and timing telemetry
 */

import { agentRuntimeManager, teamChatService } from '@babylon/agents';
import {
  authenticateUser,
  broadcastChatMessage,
  checkRateLimitAsync,
  RATE_LIMIT_CONFIGS,
  withErrorHandling,
} from '@babylon/api';
import { db, eq, messages, users } from '@babylon/db';
import {
  COORDINATOR_SENDER_ID,
  checkUserInput,
  GROQ_MODELS,
  generateSnowflakeId,
  logger,
  type MessageMetadata,
  type MessageTag,
  MessageTypeEnum,
} from '@babylon/shared';
import {
  composePromptFromState,
  type Memory,
  ModelType,
  parseKeyValueXml,
  type State,
} from '@elizaos/core';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

// Coordinator may dispatch to child agents via DISPATCH_TO_AGENT / DISPATCH_TO_AGENTS:
// coordinator (5 iters ≈ 5s) + parallel agent dispatch (≈ 15s) + summary (≈ 2s) ≈ 22s total
// Parallel dispatches via DISPATCH_TO_AGENTS can take longer — 120s covers worst case.
export const maxDuration = 120;

/**
 * Access the ElizaOS runtime's internal stateCache.
 *
 * ElizaOS (v0.x) stores action results and injected state data in a Map keyed
 * by message ID. This is not part of the public API — it's accessed via type
 * assertion because there's no official getter. If ElizaOS changes the cache
 * structure, this accessor will return undefined (safe — all callers handle that).
 *
 * Verified against: @elizaos/core processActions (line ~48919) and
 * composeState (line ~49200) in node_modules/@elizaos/core/dist/node/index.node.js
 */
function getRuntimeStateCache(runtime: unknown):
  | Map<
      string,
      {
        values?: Record<string, unknown>;
        data?: Record<string, unknown>;
        text?: string;
      }
    >
  | undefined {
  return (
    runtime as {
      stateCache?: Map<
        string,
        {
          values?: Record<string, unknown>;
          data?: Record<string, unknown>;
          text?: string;
        }
      >;
    }
  ).stateCache;
}

/** Trace result from a single coordinator action execution */
type ActionTraceResult = {
  actionType: string;
  success: boolean;
  text: string;
  error?: string;
  values?: Record<string, unknown>;
  parameters?: Record<string, unknown>;
  timestamp: number;
  durationMs?: number;
  tag?: MessageTag;
};

/**
 * Format trace results into the same string format the ACTION_STATE provider uses.
 * Kept in sync with `formatActionResults` in `action-state.ts` — both produce
 * the text that populates `{{actionResults}}` in coordinator prompt templates.
 */
function formatTraceResults(results: ActionTraceResult[]): string {
  if (results.length === 0) return 'No actions taken yet in this request.';
  return results
    .map((r, i) => {
      const status = r.success ? '✓ Success' : '✗ Failed';
      let out = `${i + 1}. **${r.actionType}** - ${status}`;
      if (r.text) out += `\n   Summary: ${r.text}`;
      if (r.error) out += `\n   Error: ${r.error}`;
      if (r.values && Object.keys(r.values).length > 0) {
        const vals = Object.entries(r.values)
          .map(([k, v]) => `   - ${k}: ${JSON.stringify(v)}`)
          .join('\n');
        out += `\n   Values:\n${vals}`;
      }
      return out;
    })
    .join('\n\n');
}

// =============================================================================
// Coordinator Prompt Templates
// =============================================================================

/**
 * Build the decision prompt dynamically based on the user's agent count.
 * When the user has <2 agents, multi-agent orchestration docs are excluded
 * to save ~400-500 tokens per decision call.
 */
function buildCoordinatorDecisionTemplate(agentCount: number): string {
  const orchestrationSection =
    agentCount >= 2
      ? `
## Multi-Agent Orchestration
**Use DISPATCH_TO_AGENTS** when the user's request benefits from input from multiple agents.
  - Dispatches run in parallel — much faster than asking agents one by one
  - Use when the user says "all agents", "everyone", "coordinate", "team", or when you need perspectives from multiple agents
  - Parameters: {"dispatches": [{"agentId": "...", "command": "..."}, ...]}

**Use RELAY_TO_AGENT** when you need to pass one agent's results as context to another agent.
  - Use after a dispatch has completed and another agent needs those findings
  - Parameters: {"agentId": "...", "command": "...", "relayContext": "Summary of what other agents found"}

## Orchestration Patterns
**Gather & Synthesize**: DISPATCH_TO_AGENTS → collect all responses → summarize for user
**Gather, Relay & Execute**: DISPATCH_TO_AGENTS (research) → RELAY_TO_AGENT (trader with context) → summarize
**Expert Consultation**: DISPATCH_TO_AGENT to the single relevant expert
`
      : '';

  return `# Your Role
{{coordinatorContext}}

---

# User's Team
{{teamMembers}}

---

# Conversation History (You ↔ User)
{{recentMessages}}

---

{{#if hasDispatchHistory}}
# What Your Agents Have Said Recently
{{dispatchHistory}}

---

{{/if}}
# Current Message from {{ownerName}}
{{currentMessage}}

---

# Execution Context
Step {{iterationCount}} of {{maxIterations}}
Actions taken this round: {{actionCount}}

---

{{actionsWithParams}}

---

# Actions Completed This Round
{{#if actionCount}}
{{actionResults}}
**IMPORTANT**: Use data from these results for your response. Do NOT repeat these actions.
{{else}}
No actions taken yet.
{{/if}}

---

# Decision Guide

## Single-Agent Tasks
**Use DISPATCH_TO_AGENT** when the user wants one agent to execute a trade, post, comment, or any action.
  - Select the agent using their [id: ...] from the Team Members list above
  - Write the command clearly as the exact instruction for the agent
  - If no agents exist in the team, skip this action and tell the user to create one at /agents
${orchestrationSection}
## Information Queries
**Use a data-fetch action** (CHECK_PERPS, CHECK_PREDICTIONS, CHECK_USER_PNL, etc.) when you need information to answer the user's question.

## Skip Actions
**Skip all actions (set action to "" and isFinish to true)** when:
  - The question is conversational or you already have the data needed
  - The user is asking about a previous turn's result — just answer directly
  - You have already dispatched or fetched what was needed this turn

**NEVER repeat the same action with the same parameters.**
**NEVER include action names or action syntax in a text response — actions are separate from your final reply.**

Use plain @username for mentions. No markdown links.

<keys>
"thought" Your reasoning about what the user needs and which action (if any) to take
"action" Action name from available actions above, or empty string "" if no action needed
"parameters" JSON parameters for the action, or {} if no parameters needed
"isFinish" Set to true when ready to respond to user
</keys>

# OUTPUT FORMAT
<output>
<response>
  <thought>Your reasoning here</thought>
  <action>ACTION_NAME or ""</action>
  <parameters>{"param": "value"} or {}</parameters>
  <isFinish>true or false</isFinish>
</response>
</output>`;
}

/**
 * Lean summary template — only includes team members (for @username references),
 * the current message, and action results. Removed coordinatorContext (~200 tokens),
 * recentMessages (~800 tokens), dispatchHistory (~200 tokens), and verbose examples
 * (~300 tokens) since the summary only needs to synthesize action results.
 */
const coordinatorSummaryTemplate = `# User's Team
{{teamMembers}}

---

# Current Message from {{ownerName}}
{{currentMessage}}

---

# Actions You Completed
{{#if actionCount}}
{{actionResults}}
{{else}}
No actions were taken this turn.
{{/if}}

---

# CRITICAL RULES — You MUST follow these:
1. This is your FINAL text response. All actions for this turn have already been executed above.
2. Do NOT include action names (DISPATCH_TO_AGENT, CHECK_PERPS, etc.) or action syntax in your text.
3. Do NOT say "let me dispatch", "I'll try again", or promise future actions you have not already taken.
4. Do NOT make up information — only reference data from the Actions You Completed section.
5. If you dispatched to an agent, include a brief quote or summary of what the agent actually did or said. Use plain @username for mentions.
6. Keep your response concise and factual.

Output ONLY this XML:

<response>
<thought>Brief reasoning</thought>
<text>Your helpful response to the user</text>
</response>`;

/**
 * Format hint appended to the prompt on parse retries to increase the chance
 * of well-formed XML output.
 */
const XML_FORMAT_HINT =
  '\n\nYour previous response could not be parsed. Output ONLY this exact XML structure with no text outside the tags:\n<response>\n  <thought>reasoning</thought>\n  <action>ACTION_NAME or ""</action>\n  <parameters>{}</parameters>\n  <isFinish>true or false</isFinish>\n</response>';

const SUMMARY_XML_FORMAT_HINT =
  '\n\nYour previous response could not be parsed. Output ONLY this exact XML structure with no text outside the tags:\n<response>\n  <thought>reasoning</thought>\n  <text>Your response</text>\n</response>';

import { tryFastPath } from './fast-path';

// =============================================================================
// POST Handler
// =============================================================================

export const POST = withErrorHandling(async (req: NextRequest) => {
  const requestStartMs = Date.now();

  const body = (await req.json()) as {
    content: string;
    teamChatId: string;
  };
  const { content, teamChatId } = body;

  logger.info(
    'Coordinator chat endpoint hit',
    { teamChatId },
    'CoordinatorChat'
  );

  // Validate input
  const inputCheck = checkUserInput(content);
  if (!inputCheck.safe) {
    logger.warn(
      'Unsafe user input blocked',
      { reason: inputCheck.reason, category: inputCheck.category },
      'CoordinatorChat'
    );
    return NextResponse.json(
      { success: false, error: inputCheck.reason || 'Invalid input' },
      { status: 400 }
    );
  }

  const user = await authenticateUser(req);

  // Rate limit coordinator requests (same as regular messages)
  const rateCheck = await checkRateLimitAsync(
    user.id,
    RATE_LIMIT_CONFIGS.SEND_MESSAGE
  );
  if (!rateCheck.allowed) {
    return NextResponse.json(
      {
        success: false,
        error:
          'Rate limit exceeded. Please wait before sending another message.',
      },
      {
        status: 429,
        headers: { 'Retry-After': String(rateCheck.retryAfter ?? 60) },
      }
    );
  }

  // Validate team chat ownership
  const isValidTeamChat = await teamChatService.validateTeamChatOwnership(
    user.id,
    teamChatId
  );
  if (!isValidTeamChat) {
    logger.warn(
      'Invalid team chat ID - user does not own this chat',
      { userId: user.id, teamChatId },
      'CoordinatorChat'
    );
    return NextResponse.json(
      { success: false, error: 'Invalid team chat' },
      { status: 403 }
    );
  }

  // Coordinator uses small model (free, no points deduction)
  const modelType = ModelType.TEXT_SMALL;

  // Get coordinator runtime.
  //
  // Multi-user safety: the coordinator runtime is shared across all concurrent
  // requests, but is safe because:
  // 1. All per-request data (actionResults, state.values, state.data) lives in
  //    local variables — nothing user-specific is written to the runtime itself.
  // 2. The ElizaOS adapter is stubbed, so no runtime-level memory DB writes occur.
  // 3. stateCache is keyed by elizaMessage.id (UUID per request), so concurrent
  //    requests never collide. We delete the key at the end of each request to
  //    prevent unbounded memory growth.
  // 4. Providers read from state.values (ownerId, teamChatId) that are set fresh
  //    each iteration, so different users get different DB query results.
  const runtime = await agentRuntimeManager.getCoordinatorRuntime();

  // Fetch user info for context
  const [userProfile] = await db
    .select({ displayName: users.displayName, username: users.username })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);
  const ownerName = userProfile?.displayName || userProfile?.username || 'User';
  const ownerUsername = userProfile?.username || undefined;

  // Create message object for ElizaOS
  const elizaMessage: Memory = {
    id: uuidv4() as `${string}-${string}-${string}-${string}-${string}`,
    entityId: user.id as `${string}-${string}-${string}-${string}-${string}`,
    roomId: teamChatId as `${string}-${string}-${string}-${string}-${string}`,
    content: { text: content },
    createdAt: Date.now(),
  };

  // =========================================================================
  // Fast-Path Classification (OPT-6)
  // =========================================================================
  // Attempt to classify as a simple read-only query or greeting before
  // entering the LLM decision loop. Saves 1 LLM call (~2s) per fast-path hit.
  const fastPath = tryFastPath(content);

  if (fastPath === 'greeting') {
    // Greeting — canned response, 0 LLM calls, 0 DB queries beyond auth
    logger.info(
      '[Coordinator] Fast-path: greeting',
      { teamChatId, totalDurationMs: Date.now() - requestStartMs },
      'CoordinatorChat'
    );

    const greetingText = `Hey${ownerName !== 'User' ? ` ${ownerName}` : ''}! How can I help you today? I can check markets, your portfolio, the feed, or coordinate your agents.`;

    const responseMessageId = await generateSnowflakeId();
    const responseTime = new Date();

    await db.insert(messages).values({
      id: responseMessageId,
      chatId: teamChatId,
      senderId: COORDINATOR_SENDER_ID,
      content: greetingText,
      type: 'coordinator',
      createdAt: responseTime,
      metadata: null,
    });

    broadcastChatMessage(teamChatId, {
      id: responseMessageId,
      content: greetingText,
      chatId: teamChatId,
      senderId: COORDINATOR_SENDER_ID,
      type: MessageTypeEnum.COORDINATOR,
      createdAt: responseTime.toISOString(),
      metadata: null,
    }).catch((err) => {
      logger.warn(
        `Failed to broadcast coordinator message: ${err}`,
        { teamChatId },
        'CoordinatorChat'
      );
    });

    return NextResponse.json({
      success: true,
      messageId: responseMessageId,
      response: greetingText,
      pointsCost: 0,
      modelUsed: GROQ_MODELS.FREE.displayName,
      type: MessageTypeEnum.COORDINATOR,
      isLLMFailure: false,
      metadata: null,
      fastPath: 'greeting',
    });
  }

  // Multi-step execution — 5 iterations supports multi-agent orchestration patterns:
  // Iteration 1: DISPATCH_TO_AGENTS (parallel gather)
  // Iteration 2: RELAY_TO_AGENT (pass context to executor)
  // Iterations 3-5: follow-up dispatches or early finish
  const MAX_ITERATIONS = 5;
  const traceActionResults: ActionTraceResult[] = [];
  let finalResponse: string | null = null;
  let isLLMFailure = false;
  let totalParseRetries = 0;
  let iterationsRan = 0;

  // State is composed once on the first iteration and reused on subsequent
  // iterations. Only DISPATCH_HISTORY is re-fetched after a dispatch action,
  // since agent responses are now visible in the DB. The other providers
  // (TEAM_MEMBERS, RECENT_MESSAGES, COORDINATOR_CONTEXT, ACTION_STATE, ACTIONS)
  // return identical data within a single request.
  let lastState: State | null = null;
  let lastDispatchIteration = 0;

  // The decision template is built once based on agent count (from first composeState).
  // We defer building it until after the first state composition.
  let coordinatorDecisionTemplate: string | null = null;

  const providers = [
    'RECENT_MESSAGES',
    'DISPATCH_HISTORY',
    'ACTION_STATE',
    'ACTIONS',
    'TEAM_MEMBERS',
    'COORDINATOR_CONTEXT',
  ];

  // =========================================================================
  // Fast-Path Action Execution (OPT-6)
  // =========================================================================
  // If tryFastPath returned an action match, execute it directly without
  // the LLM decision loop. We still compose state (needed by processActions)
  // and still run the summary phase (1 LLM call instead of 2+).
  if (fastPath) {
    logger.info(
      `[Coordinator] Fast-path: ${fastPath.action}`,
      { parameters: fastPath.parameters, teamChatId },
      'CoordinatorChat'
    );

    // Compose state once for processActions and summary
    const state = await runtime.composeState(elizaMessage, providers, true);
    state.values = {
      ...state.values,
      isAgent: false,
      isCoordinator: true,
      currentMessage: content,
      iterationCount: 1,
      maxIterations: 1,
      actionCount: 0,
      ownerId: user.id,
      ownerName,
      ownerUsername,
      teamChatId,
    };
    state.data = {
      ...state.data,
      actionParams: fastPath.parameters,
      broadcastFn: broadcastChatMessage,
    };

    // Persist to stateCache for processActions
    const fpStateCache = getRuntimeStateCache(runtime);
    if (fpStateCache && elizaMessage.id) {
      const cached = fpStateCache.get(elizaMessage.id);
      if (cached) {
        cached.data = {
          ...cached.data,
          actionParams: fastPath.parameters,
          broadcastFn: broadcastChatMessage,
        };
      }
    }

    // Execute the action
    const actionStartMs = Date.now();
    const actionContent = {
      text: `Executing action: ${fastPath.action}`,
      actions: [fastPath.action],
    };
    const actionMessage: Memory = {
      id: uuidv4() as `${string}-${string}-${string}-${string}-${string}`,
      entityId: runtime.agentId,
      roomId: elizaMessage.roomId,
      createdAt: Date.now(),
      content: actionContent,
    };

    const fpResultHolder: {
      result: {
        success?: boolean;
        text?: string;
        values?: Record<string, unknown>;
        tag?: MessageTag;
      } | null;
    } = { result: null };

    await runtime.processActions(
      elizaMessage,
      [actionMessage],
      state,
      async (results: unknown) => {
        const resultsArray = results as Array<{
          content?: {
            success?: boolean;
            text?: string;
            values?: Record<string, unknown>;
            tag?: MessageTag;
          };
        }> | null;
        if (resultsArray && resultsArray.length > 0 && resultsArray[0]) {
          fpResultHolder.result = {
            success: resultsArray[0].content?.success ?? true,
            text:
              typeof resultsArray[0].content?.text === 'string'
                ? resultsArray[0].content.text
                : undefined,
            values: resultsArray[0].content?.values,
            tag: resultsArray[0].content?.tag,
          };
        }
        return [];
      }
    );

    let fpResult = fpResultHolder.result;

    // Fallback: if the action handler returns a result directly (new-style)
    // instead of calling the callback, the result is stored in stateCache
    // under `${messageId}_action_results` by ElizaOS processActions.
    if (!fpResult) {
      const cached = getRuntimeStateCache(runtime)?.get(
        `${elizaMessage.id}_action_results`
      );
      const resultsFromCache =
        (cached?.values?.actionResults as Array<{
          success?: boolean;
          text?: string;
          values?: Record<string, unknown>;
          tag?: MessageTag;
        }>) || [];
      if (resultsFromCache.length > 0 && resultsFromCache[0]) {
        fpResult = {
          success: resultsFromCache[0].success,
          text: resultsFromCache[0].text,
          values: resultsFromCache[0].values,
          tag: resultsFromCache[0].tag,
        };
      }
    }

    const fpSuccess = fpResult?.success ?? false;

    traceActionResults.push({
      actionType: fastPath.action,
      success: fpSuccess,
      text: fpResult?.text || `${fastPath.action} executed`,
      error: fpSuccess ? undefined : fpResult?.text,
      values: fpResult?.values,
      parameters: fastPath.parameters,
      timestamp: Date.now(),
      durationMs: Date.now() - actionStartMs,
      tag: fpResult?.tag,
    });

    iterationsRan = 0; // No decision loop iterations
    lastState = state;

    // Log and skip to summary phase (below the decision loop)
    logger.info(
      '[Coordinator] Fast-path action completed, skipping to summary',
      {
        teamChatId,
        action: fastPath.action,
        success: fpSuccess,
        decisionLoopMs: Date.now() - requestStartMs,
      },
      'CoordinatorChat'
    );
  }

  // =========================================================================
  // LLM Decision Loop (skipped when fast-path matched)
  // =========================================================================
  if (!fastPath) {
    for (let iteration = 1; iteration <= MAX_ITERATIONS; iteration++) {
      iterationsRan = iteration;

      logger.info(
        `[Coordinator] Iteration ${iteration}/${MAX_ITERATIONS}`,
        { actionsCompleted: traceActionResults.length },
        'CoordinatorChat'
      );

      let state: State;

      if (iteration === 1) {
        // First iteration: full composeState (3 DB queries — TEAM_MEMBERS,
        // RECENT_MESSAGES, DISPATCH_HISTORY)
        state = await runtime.composeState(elizaMessage, providers, true);
      } else {
        // Subsequent iterations: reuse state, skip redundant DB queries.
        // Only re-fetch DISPATCH_HISTORY if we dispatched last iteration,
        // since the agent's response is now in the messages table.
        state = lastState!;

        if (lastDispatchIteration === iteration - 1) {
          const dispatchProvider = runtime.providers.find(
            (p) => p.name === 'DISPATCH_HISTORY'
          );
          if (dispatchProvider) {
            const result = await dispatchProvider.get(
              runtime,
              elizaMessage,
              state
            );
            if (result.values) {
              state.values = { ...state.values, ...result.values };
            }
          }
        }
      }

      // Add coordinator-specific values to state
      state.values = {
        ...state.values,
        isAgent: false,
        isCoordinator: true,
        currentMessage: content,
        iterationCount: iteration,
        maxIterations: MAX_ITERATIONS,
        actionCount: traceActionResults.length,
        // User info
        ownerId: user.id,
        ownerName,
        ownerUsername,
        // Team chat context
        teamChatId,
      };

      // Add action results to state data AND update the formatted values string
      // so the {{actionResults}} template variable reflects results from prior iterations.
      // Without this, state reuse (skipping composeState) leaves the formatted string stale.
      state.data = {
        ...state.data,
        actionResults: traceActionResults,
      };
      state.values = {
        ...state.values,
        actionResults: formatTraceResults(traceActionResults),
        hasActionResults: traceActionResults.length > 0,
      };

      lastState = state;

      // Build the decision template on the first iteration once we know
      // the agent count from the TEAM_MEMBERS provider.
      if (!coordinatorDecisionTemplate) {
        const agentCount = (state.values.agentCount as number | undefined) ?? 0;
        coordinatorDecisionTemplate =
          buildCoordinatorDecisionTemplate(agentCount);
      }

      // Build prompt from template
      const prompt = composePromptFromState({
        state,
        template: coordinatorDecisionTemplate,
      });

      // Get LLM decision with retry + format reinforcement
      const MAX_PARSE_RETRIES = 3;
      let parsedStep: Record<string, unknown> | null = null;

      for (let attempt = 1; attempt <= MAX_PARSE_RETRIES; attempt++) {
        const response = await runtime.useModel(modelType, {
          prompt: attempt > 1 ? prompt + XML_FORMAT_HINT : prompt,
          temperature: attempt > 1 ? 0.3 : 0.7,
        });

        parsedStep = parseKeyValueXml(response);

        if (parsedStep) {
          logger.debug(
            `[Coordinator] Parsed decision on attempt ${attempt}`,
            { action: parsedStep.action, isFinish: parsedStep.isFinish },
            'CoordinatorChat'
          );
          break;
        }

        totalParseRetries++;
        logger.warn(
          `[Coordinator] Failed to parse decision (attempt ${attempt})`,
          { preview: response?.substring(0, 200) ?? 'null response' },
          'CoordinatorChat'
        );
      }

      if (!parsedStep) {
        finalResponse =
          "I'm having trouble processing your request. Could you try rephrasing?";
        isLLMFailure = true;
        break;
      }

      const action = ((parsedStep.action as string) ?? '').trim();
      const parameters = parsedStep.parameters;
      const isFinish = parsedStep.isFinish;

      // No action - go to summary phase
      if (!action) {
        break;
      }

      // Execute action
      const actionStartMs = Date.now();
      logger.info(
        `[Coordinator] Executing action: ${action}`,
        { parameters },
        'CoordinatorChat'
      );

      // Parse parameters with fail-fast validation (no silent fallbacks)
      let actionParams: Record<string, unknown> = {};
      if (parameters) {
        if (typeof parameters === 'string') {
          // Fail-fast: let JSON.parse errors propagate
          const parsed: unknown = JSON.parse(parameters);
          // Validate the parsed result is a non-null object (not an array)
          if (
            typeof parsed !== 'object' ||
            parsed === null ||
            Array.isArray(parsed)
          ) {
            throw new Error(
              `Invalid parameters: expected object, got ${Array.isArray(parsed) ? 'array' : typeof parsed}. Original: ${parameters}`
            );
          }
          actionParams = parsed as Record<string, unknown>;
        } else if (
          typeof parameters === 'object' &&
          parameters !== null &&
          !Array.isArray(parameters)
        ) {
          actionParams = parameters as Record<string, unknown>;
        } else if (Array.isArray(parameters)) {
          throw new Error(
            `Invalid parameters: expected object, got array. Original: ${JSON.stringify(parameters)}`
          );
        } else {
          throw new Error(`Unexpected parameters type: ${typeof parameters}`);
        }
      }

      // Store params and inject broadcastFn so DISPATCH_TO_AGENT can broadcast.
      // broadcastFn is injected here (not imported inside packages/agents) to
      // maintain architectural separation between @babylon/api and @babylon/agents.
      //
      // IMPORTANT: ElizaOS processActions() re-composes state internally via
      // runtime.composeState(), which reads from stateCache and DISCARDS any
      // custom state.data injections. To survive the re-composition, we:
      //   1. Write actionParams + broadcastFn into the stateCache entry
      //   2. Also set them on the local state object (for prompt composition)
      state.data = {
        ...state.data,
        actionParams,
        broadcastFn: broadcastChatMessage,
      };

      // Persist to stateCache so processActions' internal composeState preserves them
      const stateCache = getRuntimeStateCache(runtime);
      if (stateCache && elizaMessage.id) {
        const cached = stateCache.get(elizaMessage.id);
        if (cached) {
          cached.data = {
            ...cached.data,
            actionParams,
            broadcastFn: broadcastChatMessage,
          };
        }
      }

      // Build action content for processActions
      const actionContent = {
        text: `Executing action: ${action}`,
        actions: [action],
      };

      const actionMessage: Memory = {
        id: uuidv4() as `${string}-${string}-${string}-${string}-${string}`,
        entityId: runtime.agentId,
        roomId: elizaMessage.roomId,
        createdAt: Date.now(),
        content: actionContent,
      };

      // Concrete types for action results
      interface ActionResultContent {
        success?: boolean;
        text?: string;
        values?: Record<string, unknown>;
        tag?: MessageTag;
      }

      interface ProcessActionsResult {
        content?: ActionResultContent;
      }

      // Use object to allow mutation from callback
      const resultHolder: { result: ActionResultContent | null } = {
        result: null,
      };

      // Fail-fast: let errors from processActions propagate to caller
      await runtime.processActions(
        elizaMessage,
        [actionMessage],
        state,
        async (results: unknown) => {
          const resultsArray = results as ProcessActionsResult[] | null;
          if (resultsArray && resultsArray.length > 0) {
            const firstResult = resultsArray[0];
            if (firstResult) {
              resultHolder.result = {
                success: firstResult.content?.success ?? true,
                text:
                  typeof firstResult.content?.text === 'string'
                    ? firstResult.content.text
                    : undefined,
                values: firstResult.content?.values,
                tag: firstResult.content?.tag,
              };
            }
          }
          return [];
        }
      );

      // Use resultHolder as the single source of truth for action results
      // The callback in processActions captures the result; no fallback to runtime internals
      let actionResult = resultHolder.result;

      // Default to false if result is missing to avoid masking silent failures
      if (!actionResult) {
        const cached = getRuntimeStateCache(runtime)?.get(
          `${elizaMessage.id}_action_results`
        );
        const actionResultsFromCache =
          (cached?.values?.actionResults as Array<{
            success?: boolean;
            text?: string;
            values?: Record<string, unknown>;
          }>) || [];
        actionResult =
          actionResultsFromCache.length > 0
            ? (actionResultsFromCache[0] ?? null)
            : null;
      }
      const success = actionResult?.success ?? false;

      traceActionResults.push({
        actionType: action,
        success,
        text: actionResult?.text || `${action} executed`,
        error: success ? undefined : actionResult?.text,
        values: actionResult?.values,
        parameters: actionParams,
        timestamp: Date.now(),
        durationMs: Date.now() - actionStartMs,
        tag: actionResult?.tag,
      });

      // Track dispatch iterations so we know to refresh DISPATCH_HISTORY
      if (
        action === 'DISPATCH_TO_AGENT' ||
        action === 'DISPATCH_TO_AGENTS' ||
        action === 'RELAY_TO_AGENT'
      ) {
        lastDispatchIteration = iteration;
      }

      // Check if done
      if (isFinish === 'true' || isFinish === true) {
        break;
      }
    }
  }

  // Log decision loop completion with full telemetry (Phase 0 instrumentation)
  const fastPathAction = fastPath ? fastPath.action : null;
  logger.info(
    '[Coordinator] Decision loop completed',
    {
      teamChatId,
      iterations: iterationsRan,
      actionsExecuted: traceActionResults.length,
      actionTypes: traceActionResults.map((r) => r.actionType),
      isLLMFailure,
      totalParseRetries,
      fastPath: fastPathAction ?? 'none',
      decisionLoopMs: Date.now() - requestStartMs,
    },
    'CoordinatorChat'
  );

  // Generate summary/response.
  // Reuse the last decision state instead of calling composeState() again.
  // This saves 3 DB queries (TEAM_MEMBERS, RECENT_MESSAGES, DISPATCH_HISTORY)
  // that would return identical data. composePromptFromState() is a pure function
  // that does not mutate state — verified in ElizaOS source.
  if (!finalResponse) {
    // If the loop never ran (e.g. immediate LLM failure), we need an initial state
    const summaryState =
      lastState ?? (await runtime.composeState(elizaMessage, providers, true));

    summaryState.values = {
      ...summaryState.values,
      isAgent: false,
      isCoordinator: true,
      currentMessage: content,
      ownerId: user.id,
      ownerName,
      ownerUsername,
      teamChatId,
      actionCount: traceActionResults.length,
      // Update formatted action results so {{actionResults}} in the summary
      // template reflects actual results, not the stale "No actions taken yet"
      // from the initial composeState (which ran before actions executed).
      actionResults: formatTraceResults(traceActionResults),
      hasActionResults: traceActionResults.length > 0,
    };
    summaryState.data = {
      ...summaryState.data,
      actionResults: traceActionResults,
    };

    const summaryPrompt = composePromptFromState({
      state: summaryState,
      template: coordinatorSummaryTemplate,
    });

    // Get summary with retry + format reinforcement
    const SUMMARY_RETRIES = 3;
    let extractedText: string | undefined;

    for (let attempt = 1; attempt <= SUMMARY_RETRIES; attempt++) {
      const summaryResponse = await runtime.useModel(modelType, {
        prompt:
          attempt > 1 ? summaryPrompt + SUMMARY_XML_FORMAT_HINT : summaryPrompt,
        temperature: attempt > 1 ? 0.3 : 0.7,
      });

      const summary = parseKeyValueXml(summaryResponse);
      extractedText = summary?.text as string | undefined;

      // Fallback: Try regex if parseKeyValueXml fails
      // Match proper <text>...</text> tags with non-greedy capture
      if (!extractedText) {
        const textMatch = summaryResponse.match(
          /<text\b[^>]*?>([\s\S]*?)<\/text>/i
        );
        if (textMatch?.[1]) {
          extractedText = textMatch[1].trim();
        }
      }

      if (extractedText) {
        break;
      }

      totalParseRetries++;
      logger.warn(
        `[Coordinator] Failed to parse summary (attempt ${attempt})`,
        { preview: summaryResponse?.substring(0, 200) ?? 'null response' },
        'CoordinatorChat'
      );
    }

    finalResponse =
      extractedText ||
      (traceActionResults.length > 0
        ? 'Here is the information you requested.'
        : "I'm here to help! You can ask me about markets, or @mention your agents to trade.");
  }

  const responseText = finalResponse ?? "I'm here to help!";

  // Collect tags from successful action results
  const tags: MessageTag[] = traceActionResults
    .filter((r) => r.success && r.tag)
    .map((r) => r.tag as MessageTag);

  // Build metadata if we have tags
  const metadata: MessageMetadata | null = tags.length > 0 ? { tags } : null;

  // Save coordinator response to messages table
  const responseMessageId = await generateSnowflakeId();
  const responseTime = new Date();

  await db.insert(messages).values({
    id: responseMessageId,
    chatId: teamChatId,
    senderId: COORDINATOR_SENDER_ID,
    content: responseText,
    type: 'coordinator',
    createdAt: responseTime,
    metadata,
  });

  // Broadcast coordinator response
  broadcastChatMessage(teamChatId, {
    id: responseMessageId,
    content: responseText,
    chatId: teamChatId,
    senderId: COORDINATOR_SENDER_ID,
    type: MessageTypeEnum.COORDINATOR,
    createdAt: responseTime.toISOString(),
    metadata,
  }).catch((err) => {
    logger.warn(
      `Failed to broadcast coordinator message: ${err}`,
      { teamChatId },
      'CoordinatorChat'
    );
  });

  // Clean up this request's stateCache entry to prevent unbounded growth on
  // the shared coordinator runtime (see multi-user safety note above).
  const stateCacheKey = `${elizaMessage.id}_action_results`;
  getRuntimeStateCache(runtime)?.delete(stateCacheKey);

  // Note: Coordinator uses free model, no points deduction

  // Full request telemetry (Phase 0 instrumentation)
  const totalDurationMs = Date.now() - requestStartMs;
  logger.info(
    'Coordinator chat completed',
    {
      teamChatId,
      iterations: iterationsRan,
      actionsExecuted: traceActionResults.length,
      actionTypes: traceActionResults.map((r) => r.actionType),
      isLLMFailure,
      totalParseRetries,
      fastPath: fastPathAction ?? 'none',
      totalDurationMs,
    },
    'CoordinatorChat'
  );

  return NextResponse.json({
    success: true,
    messageId: responseMessageId,
    response: responseText,
    pointsCost: 0, // Free model
    modelUsed: GROQ_MODELS.FREE.displayName,
    type: MessageTypeEnum.COORDINATOR,
    isLLMFailure,
    metadata, // Include tags in response for immediate UI update
    ...(fastPathAction ? { fastPath: fastPathAction } : {}),
  });
});
