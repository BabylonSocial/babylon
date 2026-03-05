/**
 * Points Transfer API
 *
 * @route POST /api/points/transfer - Transfer points
 * @access Authenticated
 *
 * @description
 * Enables peer-to-peer point transfers between users. Similar to Farcaster's
 * "pay" feature. Includes optional message and notifications.
 *
 * @example
 * ```typescript
 * await fetch('/api/points/transfer', {
 *   method: 'POST',
 *   headers: { 'Authorization': `Bearer ${token}` },
 *   body: JSON.stringify({
 *     recipientId: 'user-id',
 *     amount: 100,
 *     message: 'Thanks!'
 *   })
 * });
 * ```
 */

import {
  authenticate,
  cachedDb,
  createNotification,
  withErrorHandling,
} from '@babylon/api';
import { TransferPointsSchema } from '@babylon/api/schemas';
import { db } from '@babylon/db';
import { generateSnowflakeId, logger } from '@babylon/shared';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

/**
 * POST /api/points/transfer
 * Transfer points from authenticated user to another user
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  // Authenticate the sender
  const authUser = await authenticate(request);
  const senderId = authUser.dbUserId!;

  // Parse and validate request body
  const body = await request.json();
  const validation = TransferPointsSchema.safeParse(body);

  if (!validation.success) {
    const firstError = validation.error.issues?.[0];
    return NextResponse.json(
      { error: firstError?.message || 'Invalid request data' },
      { status: 400 }
    );
  }

  const { recipientId, amount, message } = validation.data;

  // Prevent self-transfers
  if (senderId === recipientId) {
    return NextResponse.json(
      { error: 'Cannot send points to yourself' },
      { status: 400 }
    );
  }

  // Check if trying to send to Agent0 network agent or app (not local User records)
  if (recipientId.startsWith('agent0-') || recipientId.startsWith('app-')) {
    return NextResponse.json(
      {
        error:
          'Cannot send points to external agents or apps. Points can only be sent to Babylon users and agents.',
      },
      { status: 400 }
    );
  }

  // Verify sender and recipient exist
  const [sender, recipient] = await Promise.all([
    db.user.findUnique({
      where: { id: senderId },
      select: {
        id: true,
        reputationPoints: true,
        displayName: true,
        username: true,
      },
    }),
    db.user.findUnique({
      where: { id: recipientId },
      select: {
        id: true,
        reputationPoints: true,
        displayName: true,
        username: true,
      },
    }),
  ]);

  if (!sender) {
    return NextResponse.json({ error: 'Sender not found' }, { status: 404 });
  }

  if (!recipient) {
    return NextResponse.json({ error: 'Recipient not found' }, { status: 404 });
  }

  // Check if sender has enough points
  if (sender.reputationPoints < amount) {
    return NextResponse.json(
      {
        error: `Insufficient points. You have ${sender.reputationPoints} points, but tried to send ${amount} points.`,
        available: sender.reputationPoints,
        requested: amount,
      },
      { status: 400 }
    );
  }

  // Perform the transfer in a transaction
  const result = await db.$transaction(async (tx) => {
    const senderPointsBefore = sender.reputationPoints;
    const recipientPointsBefore = recipient.reputationPoints;

    // Deduct from sender
    const senderCurrentPoints = Number(sender.reputationPoints);
    const updatedSender = await tx.user.update({
      where: { id: senderId },
      data: {
        reputationPoints: senderCurrentPoints - amount,
      },
    });

    // Add to recipient
    const recipientCurrentPoints = Number(recipient.reputationPoints);
    const updatedRecipient = await tx.user.update({
      where: { id: recipientId },
      data: {
        reputationPoints: recipientCurrentPoints + amount,
      },
    });

    // Create transaction record for sender (negative)
    await tx.pointsTransaction.create({
      data: {
        id: await generateSnowflakeId(),
        userId: senderId,
        amount: -amount,
        pointsBefore: senderPointsBefore,
        pointsAfter: updatedSender.reputationPoints,
        reason: 'transfer_sent',
        metadata: JSON.stringify({
          recipientId,
          recipientName: recipient.displayName || recipient.username,
          message,
        }),
      },
    });

    // Create transaction record for recipient (positive)
    await tx.pointsTransaction.create({
      data: {
        id: await generateSnowflakeId(),
        userId: recipientId,
        amount: amount,
        pointsBefore: recipientPointsBefore,
        pointsAfter: updatedRecipient.reputationPoints,
        reason: 'transfer_received',
        metadata: JSON.stringify({
          senderId,
          senderName: sender.displayName || sender.username,
          message,
        }),
      },
    });

    return {
      sender: updatedSender,
      recipient: updatedRecipient,
    };
  });

  // Invalidate cache for both users to update UI immediately
  await Promise.all([
    cachedDb.invalidateUserCache(senderId),
    cachedDb.invalidateUserCache(recipientId),
  ]).catch((error) => {
    logger.warn('Failed to invalidate user cache after points transfer', {
      error,
      senderId,
      recipientId,
    });
  });

  logger.info(
    `Points transfer: ${sender.username || senderId} sent ${amount} points to ${recipient.username || recipientId}`,
    {
      senderId,
      recipientId,
      amount,
      message,
      senderNewBalance: result.sender.reputationPoints,
      recipientNewBalance: result.recipient.reputationPoints,
    },
    'PointsTransfer'
  );

  // Send notification to recipient
  const senderName = sender.displayName || sender.username || 'Someone';
  const notificationMessage = message
    ? `${senderName} sent you ${amount} points: "${message}"`
    : `${senderName} sent you ${amount} points`;

  await createNotification({
    userId: recipientId,
    type: 'points_received',
    actorId: senderId,
    title: `You received ${amount} points`,
    message: notificationMessage,
  }).catch((err) => {
    // Log error but don't fail the transfer
    logger.error(
      'Failed to create notification for points transfer',
      { error: err, recipientId, senderId },
      'PointsTransfer'
    );
  });

  return NextResponse.json({
    success: true,
    transfer: {
      amount,
      sender: {
        id: sender.id,
        name: sender.displayName || sender.username,
        newBalance: result.sender.reputationPoints,
      },
      recipient: {
        id: recipient.id,
        name: recipient.displayName || recipient.username,
        newBalance: result.recipient.reputationPoints,
      },
      message,
    },
  });
});
