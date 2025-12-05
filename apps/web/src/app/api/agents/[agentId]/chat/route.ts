/**
 * Agent Chat Interaction API
 *
 * @route POST /api/agents/[agentId]/chat - Send message to agent
 * @route GET /api/agents/[agentId]/chat - Get chat history
 * @access Authenticated (owner only)
 *
 * @description
 * Real-time chat interface with autonomous agents. Agents respond using
 * their configured personality, system prompts, and conversation history.
 * Includes content safety checks, automatic retry logic, and points-based
 * usage tracking.
 *
 * @openapi
 * /api/agents/{agentId}/chat:
 *   post:
 *     tags:
 *       - Agents
 *     summary: Send message to agent
 *     description: Initiates chat interaction with agent (owner only)
 *     security:
 *       - PrivyAuth: []
 *     parameters:
 *       - in: path
 *         name: agentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Agent user ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *                 maxLength: 1000
 *               usePro:
 *                 type: boolean
 *                 description: Use pro-tier model
 *     responses:
 *       200:
 *         description: Agent responded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 messageId:
 *                   type: string
 *                 response:
 *                   type: string
 *                 pointsCost:
 *                   type: number
 *                 modelUsed:
 *                   type: string
 *                 balanceAfter:
 *                   type: number
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not agent owner
 *       404:
 *         description: Agent not found
 *   get:
 *     tags:
 *       - Agents
 *     summary: Get chat history
 *     description: Returns conversation history with agent (owner only)
 *     security:
 *       - PrivyAuth: []
 *     parameters:
 *       - in: path
 *         name: agentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Agent user ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Maximum messages to return
 *     responses:
 *       200:
 *         description: Chat history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 messages:
 *                   type: array
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not agent owner
 *       404:
 *         description: Agent not found
 *
 * @example
 * ```typescript
 * // Send message
 * const response = await fetch(`/api/agents/${agentId}/chat`, {
 *   method: 'POST',
 *   headers: { 'Authorization': `Bearer ${token}` },
 *   body: JSON.stringify({ message: 'Hello!' })
 * });
 *
 * // Get history
 * const { messages } = await fetch(`/api/agents/${agentId}/chat`, {
 *   headers: { 'Authorization': `Bearer ${token}` }
 * }).then(r => r.json());
 * ```
 */

import { ModelType, parseKeyValueXml } from '@elizaos/core';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { db } from '@babylon/db';
import { agentRuntimeManager, agentService } from '@babylon/agents';
import { withErrorHandling } from '@babylon/api';
import { logger } from '@babylon/shared';
import { authenticateUser } from '@babylon/api';
import { checkAgentOutput, checkUserInput } from '@babylon/shared';

/**
 * POST /api/agents/[agentId]/chat
 *
 * Sends a message to an autonomous agent and receives a response. Validates input safety,
 * checks agent ownership, deducts points, generates agent response using LLM, checks output
 * safety, and stores conversation history. Supports both standard and pro-tier models.
 *
 * @param req - Next.js request containing message content and optional usePro flag
 * @param params - Route parameters with agentId
 * @returns Agent response with message ID, content, points cost, model used, and balance
 * @throws {400} Invalid message content, unsafe input, or insufficient points
 * @throws {401} Unauthorized
 * @throws {404} Agent not found or user doesn't own agent
 */
export const POST = withErrorHandling(
  async (
    req: NextRequest,
    { params }: { params: Promise<{ agentId: string }> }
  ) => {
    const { agentId } = await params;
    logger.info('Agent chat endpoint hit', { agentId }, 'AgentChat');

    let body: { message: string; usePro: boolean };
    try {
      body = (await req.json()) as { message: string; usePro: boolean };
    } catch (error) {
      logger.error(
        'Failed to parse request body',
        { error, agentId },
        'AgentChat'
      );
      return NextResponse.json(
        { success: false, error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const message = body.message;
    const usePro = body.usePro;

    // Validate and block unsafe input
    const inputCheck = checkUserInput(message);
    if (!inputCheck.safe) {
      logger.warn(
        'Unsafe user input blocked',
        { agentId, reason: inputCheck.reason, category: inputCheck.category },
        'AgentChat'
      );
      return NextResponse.json(
        { success: false, error: inputCheck.reason || 'Invalid input' },
        { status: 400 }
      );
    }

    const user = await authenticateUser(req);

    // Verify user owns this agent before allowing chat
    const agent = await agentService.getAgent(agentId, user.id);
    if (!agent) {
      return NextResponse.json(
        { success: false, error: 'Agent not found' },
        { status: 404 }
      );
    }

    const pointsCost = usePro ? 1 : 1;

    // Deduct points before generating response
    const newBalance = await agentService.deductPoints(
      agentId,
      pointsCost,
      `Chat message (${usePro ? 'pro' : 'free'} mode)`,
      undefined
    );

    // Fetch conversation history BEFORE saving the new message (to avoid duplicates)
    const recentMessages = await db.agentMessage.findMany({
      where: { agentUserId: agentId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        role: true,
        content: true,
        createdAt: true,
      },
    });

    // Build conversation history and append the current user message
    const historyPart = recentMessages
      .reverse()
      .map((m) => {
        const speaker = m.role === 'user' ? 'User' : agent.displayName;
        return `${speaker}: ${m.content}`;
      })
      .join('\n');

    const conversationHistory = historyPart
      ? `${historyPart}\nUser: ${message}`
      : `User: ${message}`;

    // Prepare runtime
    const runtime = await agentRuntimeManager.getRuntime(agentId);

    // Always use qwen 32b (TEXT_LARGE) - free chat, 1pt per tick
    const modelType = ModelType.TEXT_LARGE;
    const MAX_TOKENS = 200;

    const prompt = `CRITICAL: You have only ${MAX_TOKENS} tokens. Your response MUST start with <response> immediately. No <think> tags. No reasoning.

# System
${agent.agentSystem}

# Conversation
${conversationHistory}

# Task
Generate ${agent.displayName}'s response. Stay in character.

# Required Output Format (use exactly this structure)
<response>
<text>your message to user</text>
</response>`;

    // Generate response with retry loop (max 3 attempts)
    const MAX_ATTEMPTS = 3;
    let response: string | null = null;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        const isRetry = attempt > 1;
        const currentPrompt = isRetry
          ? `${prompt}\n\nIMPORTANT: Keep your response professional, helpful, and appropriate. No profanity or inappropriate content.\n\nREMINDER: You MUST output valid XML. Start with <response> and include <text> with your message.`
          : prompt;

        const generated = await runtime.useModel(modelType, {
          prompt: currentPrompt,
          temperature: isRetry ? 0.6 : 0.8,
          maxTokens: MAX_TOKENS,
        });

        // Extract <response>...</response> block before parsing
        const responseMatch = generated.match(/<response>([\s\S]*?)<\/response>/i);
        if (!responseMatch) {
          logger.warn('No <response> block found', { agentId, attempt, raw: generated.substring(0, 300) }, 'AgentChat');
          continue;
        }

        // Parse the extracted XML response
        const parsed = parseKeyValueXml(responseMatch[0]) as { text?: string } | null;

        // Check if we got valid text
        if (!parsed?.text || parsed.text.trim().length === 0) {
          logger.warn('Failed to parse XML response', { agentId, attempt, raw: generated.substring(0, 300) }, 'AgentChat');
          continue;
        }

        const extractedText = parsed.text.trim();

        // Check safety
        const safetyCheck = checkAgentOutput(extractedText);
        if (!safetyCheck.safe) {
          logger.warn(
            'Unsafe response generated',
            { agentId, attempt, reason: safetyCheck.reason, preview: extractedText.substring(0, 100) },
            'AgentChat'
          );
          continue;
        }

        // Success!
        response = extractedText;
        break;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error(
          'Failed to generate response',
          { error: errorMessage, agentId, attempt },
          'AgentChat'
        );
        continue;
      }
    }

    // If all attempts failed, refund points and return error
    if (!response) {
      await agentService.depositPoints(agentId, user.id, pointsCost);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to generate a valid response after multiple attempts. Points have been refunded.',
        },
        { status: 500 }
      );
    }

    // Success: save both messages now
    // Use explicit timestamps to ensure correct ordering (user message before assistant)
    const userMessageId = uuidv4();
    const assistantMessageId = uuidv4();
    const userMessageTime = new Date();
    const assistantMessageTime = new Date(userMessageTime.getTime() + 1); // 1ms later

    await db.agentMessage.createMany({
      data: [
        {
          id: userMessageId,
          agentUserId: agentId,
          role: 'user',
          content: message,
          pointsCost: 0,
          metadata: {},
          createdAt: userMessageTime,
        },
        {
          id: assistantMessageId,
          agentUserId: agentId,
          role: 'assistant',
          content: response,
          modelUsed: usePro ? 'groq-70b' : 'groq-8b',
          pointsCost,
          createdAt: assistantMessageTime,
          metadata: {},
        },
      ],
    });

    await db.user.update({
      where: { id: agentId },
      data: { agentLastChatAt: new Date() },
    });

    await db.agentLog.create({
      data: {
        id: uuidv4(),
        agentUserId: agentId,
        type: 'chat',
        level: 'info',
        message: 'Chat interaction completed',
        prompt: message,
        completion: response,
        metadata: {
          usePro,
          pointsCost,
          modelUsed: usePro ? 'groq-70b' : 'groq-8b',
        },
      },
    });

    logger.info(`Chat completed for agent ${agentId}`, undefined, 'AgentsAPI');

    return NextResponse.json({
      success: true,
      messageId: assistantMessageId,
      response,
      pointsCost,
      modelUsed: usePro ? 'groq-70b' : 'groq-8b',
      balanceAfter: newBalance,
    });
  }
);

/**
 * GET /api/agents/[agentId]/chat
 *
 * Retrieves chat history with an autonomous agent. Returns paginated conversation messages
 * with timestamps, model used, and points cost for each message. Verifies agent ownership.
 *
 * @param req - Next.js request with optional limit query parameter (default: 50)
 * @param params - Route parameters with agentId
 * @returns Chat history with array of message objects
 * @throws {401} Unauthorized
 * @throws {404} Agent not found or user doesn't own agent
 */
export const GET = withErrorHandling(
  async (
    req: NextRequest,
    { params }: { params: Promise<{ agentId: string }> }
  ) => {
    const user = await authenticateUser(req);
    const { agentId } = await params;

    const agent = await agentService.getAgent(agentId, user.id);
    if (!agent) {
      return NextResponse.json(
        { success: false, error: 'Agent not found' },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(req.url);
    const limit = Number.parseInt(searchParams.get('limit')!);

    const messages = await agentService.getChatHistory(agentId, limit);

    return NextResponse.json({
      success: true,
      messages: messages.map((msg) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        modelUsed: msg.modelUsed,
        pointsCost: msg.pointsCost,
        createdAt: msg.createdAt.toISOString(),
      })),
    });
  }
);
