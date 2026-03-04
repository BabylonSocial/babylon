/**
 * Chat Participants API
 *
 * @route GET /api/chats/[id]/participants - Get chat participants
 * @route POST /api/chats/[id]/participants - Add users to chat
 * @access Authenticated (participants only)
 *
 * @description
 * Manages chat participants. GET returns list of participants, POST adds new
 * users to a group chat. Includes automatic notifications for new participants.
 *
 * @example
 * ```typescript
 * // Get participants
 * const response = await fetch(`/api/chats/${chatId}/participants`, {
 *   headers: { 'Authorization': `Bearer ${token}` }
 * });
 *
 * // Add participants
 * await fetch(`/api/chats/${chatId}/participants`, {
 *   method: 'POST',
 *   headers: { 'Authorization': `Bearer ${token}` },
 *   body: JSON.stringify({
 *     userIds: ['user1', 'user2']
 *   })
 * });
 * ```
 *
 * @see {@link /lib/services/notification-service} Notification service
 */

import {
  authenticate,
  BusinessLogicError,
  NFTVerificationService,
  NotFoundError,
  notifyGroupChatInvite,
  successResponse,
  withErrorHandling,
} from '@babylon/api';
import { requireNftChatAccess } from '@babylon/api/services/nft-chat-gating-service';
import { asSystem, asUser } from '@babylon/db';
import { generateSnowflakeId, logger } from '@babylon/shared';
import type { NextRequest } from 'next/server';

/**
 * POST /api/chats/[id]/participants
 * Add users to a group chat
 */
export const POST = withErrorHandling(
  async (
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
  ) => {
    const user = await authenticate(request);
    const { id: chatId } = await context.params;

    if (!chatId) {
      throw new BusinessLogicError('Chat ID is required', 'CHAT_ID_REQUIRED');
    }

    await requireNftChatAccess(user, chatId);

    // Validate request body
    const body = await request.json();
    const { userIds } = body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      throw new BusinessLogicError(
        'At least one user ID is required',
        'USER_IDS_REQUIRED'
      );
    }

    // Check if chat exists and user is a participant
    const chat = await asUser(user, async (db) => {
      const chat = await db.chat.findUnique({
        where: { id: chatId },
        include: {
          participants: true,
        },
      });

      if (!chat) {
        throw new NotFoundError('Chat', chatId);
      }

      type ChatWithParticipants = typeof chat & {
        participants?: Array<{
          id: string;
          chatId: string;
          userId: string;
          joinedAt: Date;
          isActive: boolean;
        }>;
      };
      const chatWithParticipants = chat as ChatWithParticipants;

      // Check if user is a participant
      const isParticipant = (chatWithParticipants.participants || []).some(
        (p) => p.userId === user.userId
      );

      if (!isParticipant) {
        throw new BusinessLogicError(
          'You must be a participant to invite others',
          'NOT_PARTICIPANT'
        );
      }

      // If it's a DM, convert to group chat
      if (!chat.isGroup) {
        // Update chat to be a group chat
        await db.chat.update({
          where: { id: chatId },
          data: {
            isGroup: true,
            name: 'Group Chat', // Default name, can be updated later
            updatedAt: new Date(),
          },
        });
      }

      return chat;
    });

    // Verify NFT ownership for NFT-gated chats
    if (chat.nftGated && chat.requiredNftContractAddress) {
      const usersToVerify = await asSystem(async (db) =>
        db.user.findMany({
          where: {
            id: { in: userIds },
            isActor: false,
            isBanned: false,
          },
          select: {
            id: true,
            walletAddress: true,
            displayName: true,
            username: true,
            profileImageUrl: true,
          },
        })
      );

      const verificationResults = await Promise.all(
        usersToVerify.map(async (user) => ({
          user,
          verification: await NFTVerificationService.verifyChatAccess(
            user.walletAddress ?? null,
            chat.requiredNftContractAddress!,
            chat.requiredNftTokenId ?? null,
            chat.requiredNftChainId ?? undefined
          ),
        }))
      );

      const usersWithoutNft = verificationResults.filter(
        (r) => !r.verification.canAccess
      );

      if (usersWithoutNft.length > 0) {
        const userNames = usersWithoutNft
          .map((r) => r.user.displayName || r.user.username || r.user.id)
          .join(', ');
        throw new BusinessLogicError(
          `The following users do not own the required NFT: ${userNames}. ${usersWithoutNft[0]?.verification.reason || ''}`,
          'NFT_REQUIRED'
        );
      }
    }

    // Verify all users exist and add them to the chat
    const addedUsers = await asSystem(async (db) => {
      // Verify users exist and are not actors
      const usersToAdd = await db.user.findMany({
        where: {
          id: { in: userIds },
          isActor: false,
          isBanned: false,
        },
        select: {
          id: true,
          displayName: true,
          username: true,
          profileImageUrl: true,
        },
      });

      if (usersToAdd.length === 0) {
        throw new BusinessLogicError('No valid users to add', 'NO_VALID_USERS');
      }

      // Filter out users already in the chat
      type ChatWithParticipants = typeof chat & {
        participants?: Array<{
          userId: string;
        }>;
      };
      const chatWithParticipants = chat as ChatWithParticipants;
      const existingParticipantIds = (
        chatWithParticipants.participants || []
      ).map((p) => p.userId);
      const newUsers = usersToAdd.filter(
        (u) => !existingParticipantIds.includes(u.id)
      );

      if (newUsers.length === 0) {
        throw new BusinessLogicError(
          'All users are already in the chat',
          'ALREADY_PARTICIPANTS'
        );
      }

      // Add new participants
      await Promise.all(
        newUsers.map(async (newUser) =>
          db.chatParticipant.create({
            data: {
              id: await generateSnowflakeId(),
              chatId,
              userId: newUser.id,
            },
          })
        )
      );

      // Get updated chat info (including groupId for notification linking)
      const updatedChat = await db.chat.findUnique({
        where: { id: chatId },
        select: {
          id: true,
          name: true,
          isGroup: true,
          groupId: true,
        },
      });

      // Send notifications to invited users
      const inviterUser = await db.user.findUnique({
        where: { id: user.userId },
        select: {
          displayName: true,
          username: true,
        },
      });

      await Promise.all(
        newUsers.map((newUser) =>
          notifyGroupChatInvite(
            newUser.id,
            user.userId,
            updatedChat?.groupId,
            updatedChat?.name || 'a group chat'
          )
        )
      );

      logger.info(
        'Users added to chat',
        {
          chatId,
          addedBy: user.userId,
          addedUsers: newUsers.map((u) => u.id),
        },
        'POST /api/chats/[id]/participants'
      );

      return {
        addedUsers: newUsers,
        inviterName:
          inviterUser?.displayName || inviterUser?.username || 'Someone',
        chatName: updatedChat?.name || 'Group Chat',
      };
    });

    return successResponse({
      message: `Added ${addedUsers.addedUsers.length} user(s) to the chat`,
      data: {
        chatId,
        addedUsers: addedUsers.addedUsers.map((u) => ({
          id: u.id,
          displayName: u.displayName,
          username: u.username,
          profileImageUrl: u.profileImageUrl,
        })),
      },
    });
  }
);

/**
 * GET /api/chats/[id]/participants
 * Get all participants in a chat
 */
export const GET = withErrorHandling(
  async (
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
  ) => {
    const user = await authenticate(request);
    const { id: chatId } = await context.params;

    if (!chatId) {
      throw new BusinessLogicError('Chat ID is required', 'CHAT_ID_REQUIRED');
    }

    await requireNftChatAccess(user, chatId);

    // Get chat participants
    const participants = await asUser(user, async (db) => {
      const chat = await db.chat.findUnique({
        where: { id: chatId },
        include: {
          participants: true,
        },
      });

      if (!chat) {
        throw new NotFoundError('Chat', chatId);
      }

      type ChatWithParticipants = typeof chat & {
        participants?: Array<{
          userId: string;
        }>;
      };
      const chatWithParticipants = chat as ChatWithParticipants;

      // Check if user is a participant
      const isParticipant = (chatWithParticipants.participants || []).some(
        (p) => p.userId === user.userId
      );

      if (!isParticipant) {
        throw new BusinessLogicError(
          'You must be a participant to view participants',
          'NOT_PARTICIPANT'
        );
      }

      // Get user details for all participants
      const userIds = (chatWithParticipants.participants || []).map(
        (p) => p.userId
      );
      const users = await db.user.findMany({
        where: {
          id: { in: userIds },
        },
        select: {
          id: true,
          displayName: true,
          username: true,
          profileImageUrl: true,
        },
      });

      return users;
    });

    logger.info(
      'Chat participants fetched',
      { chatId, participantCount: participants.length },
      'GET /api/chats/[id]/participants'
    );

    return successResponse({
      participants,
    });
  }
);
