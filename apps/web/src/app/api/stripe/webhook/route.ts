/**
 * Stripe Webhook Handler
 *
 * @route POST /api/stripe/webhook - Handle Stripe webhook events
 * @access Public (signature-verified)
 *
 * @description
 * Receives and processes Stripe webhook events for payment lifecycle.
 * Critically handles checkout.session.completed to credit points.
 *
 * Security:
 * - Webhook signature is verified before processing
 * - Idempotency is ensured via paymentRequestId uniqueness
 * - No authentication required (signature verification is auth)
 *
 * Handled Events:
 * - checkout.session.completed: Credit points to user
 * - checkout.session.expired: Log expiration (no action needed)
 * - checkout.session.async_payment_succeeded: Credit points (async methods)
 * - checkout.session.async_payment_failed: Log failure
 * - charge.dispute.created: Deduct points (Phase 2)
 * - charge.refunded: Deduct points (Phase 2)
 */

import { PointsService } from '@babylon/api';
import { and, balanceTransactions, db, eq } from '@babylon/db';
import { logger } from '@babylon/shared';
import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { trackServerEvent } from '@/lib/posthog/server';
import { constructWebhookEvent, stripe } from '@/lib/stripe/server';

/**
 * Result from webhook event handlers
 */
interface WebhookHandlerResult {
  success: boolean;
  alreadyProcessed?: boolean;
  error?: string;
}

/**
 * Stripe webhook requires raw body for signature verification.
 * Next.js App Router provides request body as a stream.
 *
 * ERROR HANDLING:
 * - Return 200 for successfully processed events (including idempotent duplicates)
 * - Return 200 for events we intentionally skip (non-points purchases, etc.)
 * - Return 500 for unexpected errors so Stripe will retry
 */
export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    logger.error(
      'Stripe webhook received without signature',
      {},
      'StripeWebhook'
    );
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  // Verify webhook signature
  try {
    event = constructWebhookEvent(body, signature);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    logger.error(
      'Stripe webhook signature verification failed',
      { error: message },
      'StripeWebhook'
    );
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    );
  }

  logger.info(
    `Stripe webhook received: ${event.type}`,
    { eventId: event.id, type: event.type },
    'StripeWebhook'
  );

  // Filter events by app metadata — only process events belonging to this app (babylon).
  // Events without metadata.app are allowed through for backward compatibility with
  // resources created before this tagging was added.
  const eventObject = event.data.object as unknown as Record<string, unknown>;
  const appMetadata =
    (eventObject?.metadata as Record<string, string> | undefined)?.app ??
    (
      (eventObject?.subscription_details as Record<string, unknown> | undefined)
        ?.metadata as Record<string, string> | undefined
    )?.app;

  if (appMetadata && appMetadata !== 'babylon') {
    logger.info(
      `Ignoring Stripe event for different app: ${appMetadata}`,
      { eventId: event.id, type: event.type, app: appMetadata },
      'StripeWebhook'
    );
    return NextResponse.json({ received: true, ignored: true });
  }

  // Handle events - each handler returns a result indicating success/failure
  let result: WebhookHandlerResult = { success: true };

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        result = await handleCheckoutSessionCompleted(
          event.data.object,
          event.id
        );
        break;

      case 'checkout.session.async_payment_succeeded':
        // Same handling as completed - async payment methods (bank debits, etc.)
        result = await handleCheckoutSessionCompleted(
          event.data.object,
          event.id
        );
        break;

      case 'checkout.session.expired':
        await handleCheckoutSessionExpired(event.data.object);
        break;

      case 'checkout.session.async_payment_failed':
        await handleCheckoutSessionFailed(event.data.object);
        break;

      case 'charge.dispute.created':
        result = await handleDisputeCreated(
          event.data.object as Stripe.Dispute,
          event.id
        );
        break;

      case 'charge.dispute.closed':
        result = await handleDisputeClosed(
          event.data.object as Stripe.Dispute,
          event.id
        );
        break;

      case 'charge.refunded':
        result = await handleChargeRefunded(
          event.data.object as Stripe.Charge,
          event.id
        );
        break;

      default:
        logger.info(
          `Unhandled Stripe event type: ${event.type}`,
          { eventId: event.id },
          'StripeWebhook'
        );
    }
  } catch (err) {
    // Unexpected error - return 500 so Stripe retries
    const message = err instanceof Error ? err.message : 'Unknown error';
    logger.error(
      'Webhook handler threw unexpected error',
      {
        eventId: event.id,
        eventType: event.type,
        error: message,
        stack: err instanceof Error ? err.stack : undefined,
      },
      'StripeWebhook'
    );
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }

  // Return 500 for processing failures so Stripe retries
  // (but NOT for idempotent duplicates or intentional skips)
  if (!result.success && !result.alreadyProcessed) {
    logger.error(
      'Webhook handler returned failure, requesting retry',
      {
        eventId: event.id,
        eventType: event.type,
        error: result.error,
      },
      'StripeWebhook'
    );
    return NextResponse.json(
      { error: result.error || 'Processing failed' },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}

/**
 * Handle successful checkout session completion
 *
 * This is the critical path for crediting points after payment.
 * Returns a result indicating success/failure for proper error handling.
 */
async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session,
  eventId: string
): Promise<WebhookHandlerResult> {
  // Check payment status first - for async payment methods (bank debits, SEPA, etc.),
  // checkout.session.completed may fire before payment is actually confirmed.
  // We should only credit points when payment_status is 'paid'.
  // For async methods, checkout.session.async_payment_succeeded will fire when paid.
  if (session.payment_status !== 'paid') {
    logger.info(
      'Checkout session completed but payment not yet confirmed, waiting for async_payment_succeeded',
      {
        sessionId: session.id,
        paymentStatus: session.payment_status,
      },
      'StripeWebhook'
    );
    // Return success - don't retry, async_payment_succeeded will fire when paid
    return { success: true };
  }

  // Retrieve the full session to ensure we have all metadata
  // Webhook events may not include all fields
  let fullSession = session;
  if (!session.metadata || Object.keys(session.metadata).length === 0) {
    logger.info(
      'Retrieving full session from Stripe API',
      { sessionId: session.id },
      'StripeWebhook'
    );
    try {
      fullSession = await stripe.checkout.sessions.retrieve(session.id);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      logger.error(
        'Failed to retrieve full session from Stripe API',
        {
          sessionId: session.id,
          eventId,
          error: message,
          stack: err instanceof Error ? err.stack : undefined,
        },
        'StripeWebhook'
      );
      // Return failure so Stripe retries the webhook
      return {
        success: false,
        error: `Failed to retrieve session: ${message}`,
      };
    }
  }

  const metadata = fullSession.metadata;

  logger.info(
    'Processing checkout.session.completed',
    {
      sessionId: session.id,
      hasMetadata: !!metadata,
      metadataKeys: metadata ? Object.keys(metadata) : [],
      metadata,
    },
    'StripeWebhook'
  );

  if (!metadata || Object.keys(metadata).length === 0) {
    // No metadata - can't process, but don't retry (likely not our checkout)
    logger.warn(
      'Checkout session completed without metadata',
      { sessionId: session.id },
      'StripeWebhook'
    );
    return { success: true }; // Don't retry - intentional skip
  }

  const { userId, pointsAmount, amountUSD, purchaseType } = metadata;

  // Validate this is a points purchase
  if (purchaseType !== 'points') {
    logger.info(
      'Checkout session is not a points purchase, skipping',
      { sessionId: session.id, purchaseType },
      'StripeWebhook'
    );
    return { success: true }; // Intentional skip
  }

  if (!userId || !pointsAmount || !amountUSD) {
    logger.error(
      'Checkout session metadata missing required fields',
      { sessionId: session.id, metadata },
      'StripeWebhook'
    );
    return { success: false, error: 'Missing required metadata fields' };
  }

  // Extract payment intent ID for tracking
  const paymentIntentId =
    typeof session.payment_intent === 'string'
      ? session.payment_intent
      : session.payment_intent?.id;

  logger.info(
    `Processing points purchase from Stripe checkout`,
    {
      sessionId: session.id,
      userId,
      pointsAmount,
      amountUSD,
      paymentIntentId,
      eventId,
    },
    'StripeWebhook'
  );

  // Credit points to user
  // Uses session.id as paymentRequestId for idempotency
  // The PointsService will reject if this session ID was already processed
  logger.info(
    'Calling PointsService.purchasePoints',
    {
      userId,
      amountUSD: parseFloat(amountUSD),
      sessionId: fullSession.id,
      paymentIntentId,
    },
    'StripeWebhook'
  );

  const result = await PointsService.purchasePoints(
    userId,
    parseFloat(amountUSD),
    fullSession.id, // paymentRequestId - unique, ensures idempotency
    paymentIntentId, // paymentTxHash - Stripe payment intent ID
    'stripe' // paymentProvider
  );

  logger.info(
    'PointsService.purchasePoints result',
    { result },
    'StripeWebhook'
  );

  if (!result.success) {
    // Check if this is a duplicate (already processed)
    if (result.alreadyAwarded) {
      logger.info(
        'Points purchase already processed (idempotency check passed)',
        { sessionId: fullSession.id, userId },
        'StripeWebhook'
      );
      return { success: true, alreadyProcessed: true };
    }

    logger.error(
      'Failed to credit points after Stripe checkout',
      {
        sessionId: fullSession.id,
        userId,
        error: result.error,
      },
      'StripeWebhook'
    );
    return { success: false, error: result.error };
  }

  logger.info(
    `Successfully credited ${result.pointsAwarded} points from Stripe purchase`,
    {
      sessionId: fullSession.id,
      userId,
      pointsAwarded: result.pointsAwarded,
      newTotal: result.newTotal,
      amountUSD,
    },
    'StripeWebhook'
  );

  trackServerEvent(userId, 'stripe_checkout_completed', {
    amountUSD: parseFloat(amountUSD),
    pointsAwarded: result.pointsAwarded,
    newTotal: result.newTotal,
    sessionId: fullSession.id,
    ...(paymentIntentId ? { paymentIntentId } : {}),
  });

  return { success: true };
}

/**
 * Handle expired checkout session
 *
 * Session expired without payment. Just log for monitoring.
 */
async function handleCheckoutSessionExpired(
  session: Stripe.Checkout.Session
): Promise<void> {
  const metadata = session.metadata;
  const userId = metadata?.userId;

  logger.info(
    'Stripe checkout session expired',
    {
      sessionId: session.id,
      userId: userId || 'unknown',
      amountUSD: metadata?.amountUSD,
    },
    'StripeWebhook'
  );

  if (userId) {
    trackServerEvent(userId, 'stripe_checkout_expired', {
      sessionId: session.id,
      ...(metadata?.amountUSD
        ? { amountUSD: parseFloat(metadata.amountUSD) }
        : {}),
    });
  }
}

/**
 * Handle failed async payment
 *
 * Async payment method (bank debit, etc.) failed after initial authorization.
 */
async function handleCheckoutSessionFailed(
  session: Stripe.Checkout.Session
): Promise<void> {
  const metadata = session.metadata;
  const userId = metadata?.userId;

  logger.warn(
    'Stripe checkout async payment failed',
    {
      sessionId: session.id,
      userId: userId || 'unknown',
      amountUSD: metadata?.amountUSD,
    },
    'StripeWebhook'
  );

  if (userId) {
    trackServerEvent(userId, 'stripe_checkout_failed', {
      sessionId: session.id,
      ...(metadata?.amountUSD
        ? { amountUSD: parseFloat(metadata.amountUSD) }
        : {}),
    });
  }
}

/**
 * Handle dispute (chargeback) creation
 *
 * User initiated a chargeback. Deduct points from user's trading balance.
 * This protects against fraud where users buy points and then chargeback.
 */
async function handleDisputeCreated(
  dispute: Stripe.Dispute,
  eventId: string
): Promise<WebhookHandlerResult> {
  // Get the charge to find the original payment
  const chargeId =
    typeof dispute.charge === 'string' ? dispute.charge : dispute.charge?.id;

  if (!chargeId) {
    logger.error(
      'Dispute created without charge ID',
      { disputeId: dispute.id },
      'StripeWebhook'
    );
    return { success: true }; // Don't retry - can't process without charge ID
  }

  // Retrieve the charge to get payment intent
  const charge = await stripe.charges.retrieve(chargeId, {
    expand: ['payment_intent'],
  });

  const paymentIntent = charge.payment_intent as Stripe.PaymentIntent | null;
  const paymentIntentId = paymentIntent?.id;

  if (!paymentIntentId) {
    logger.error(
      'Dispute charge has no payment intent',
      { disputeId: dispute.id, chargeId },
      'StripeWebhook'
    );
    return { success: true }; // Don't retry - can't process without payment intent
  }

  // Find the original transaction to get the userId
  // Purchases are stored in balanceTransactions with relatedId = paymentIntentId
  const originalTxResult = await db
    .select({
      userId: balanceTransactions.userId,
      amount: balanceTransactions.amount,
      description: balanceTransactions.description,
    })
    .from(balanceTransactions)
    .where(
      and(
        eq(balanceTransactions.relatedId, paymentIntentId),
        eq(balanceTransactions.type, 'stripe_purchase')
      )
    )
    .limit(1);

  const originalTx = originalTxResult[0];

  if (!originalTx) {
    logger.warn(
      'No original purchase transaction found for disputed payment',
      { disputeId: dispute.id, paymentIntentId },
      'StripeWebhook'
    );
    return { success: true }; // Don't retry - not our transaction
  }

  const amountUSD = dispute.amount / 100; // Stripe uses cents

  logger.warn(
    'Processing dispute (chargeback) - deducting points',
    {
      disputeId: dispute.id,
      chargeId,
      userId: originalTx.userId,
      amountUSD,
      reason: dispute.reason,
      status: dispute.status,
      paymentIntentId,
    },
    'StripeWebhook'
  );

  // Deduct points from user
  const result = await PointsService.reversePointsPurchase(
    originalTx.userId,
    paymentIntentId,
    'dispute',
    amountUSD,
    eventId
  );

  if (result.success) {
    logger.info(
      `Deducted ${Math.abs(result.pointsAwarded)} points from user due to dispute`,
      {
        disputeId: dispute.id,
        userId: originalTx.userId,
        pointsDeducted: Math.abs(result.pointsAwarded),
        newBalance: result.newTotal,
      },
      'StripeWebhook'
    );

    trackServerEvent(originalTx.userId, 'stripe_dispute_points_deducted', {
      disputeId: dispute.id,
      amountUSD,
      pointsDeducted: Math.abs(result.pointsAwarded),
      reason: dispute.reason,
    });

    return { success: true, alreadyProcessed: result.alreadyAwarded };
  }

  logger.error(
    'Failed to deduct points for dispute',
    {
      disputeId: dispute.id,
      userId: originalTx.userId,
      error: result.error,
    },
    'StripeWebhook'
  );
  return { success: false, error: result.error };
}

/**
 * Handle dispute closed
 *
 * Dispute has been resolved (won, lost, or withdrawn).
 * If merchant won the dispute, re-credit the points that were deducted.
 */
async function handleDisputeClosed(
  dispute: Stripe.Dispute,
  eventId: string
): Promise<WebhookHandlerResult> {
  // Determine outcome
  const merchantWon = dispute.status === 'won';

  logger.info(
    `Stripe dispute closed: ${merchantWon ? 'MERCHANT WON' : 'CUSTOMER WON'}`,
    {
      disputeId: dispute.id,
      status: dispute.status,
    },
    'StripeWebhook'
  );

  // Only take action if merchant won - re-credit the points
  if (!merchantWon) {
    // Customer won or dispute was lost - points stay deducted
    return { success: true }; // Intentional skip
  }

  // Get the charge to find the original payment
  const chargeId =
    typeof dispute.charge === 'string' ? dispute.charge : dispute.charge?.id;

  if (!chargeId) {
    logger.error(
      'Dispute closed without charge ID',
      { disputeId: dispute.id },
      'StripeWebhook'
    );
    return { success: true }; // Don't retry - can't process without charge ID
  }

  // Retrieve the charge to get payment intent
  const charge = await stripe.charges.retrieve(chargeId, {
    expand: ['payment_intent'],
  });

  const paymentIntent = charge.payment_intent as Stripe.PaymentIntent | null;
  const paymentIntentId = paymentIntent?.id;

  if (!paymentIntentId) {
    logger.error(
      'Dispute charge has no payment intent',
      { disputeId: dispute.id, chargeId },
      'StripeWebhook'
    );
    return { success: true }; // Don't retry - can't process without payment intent
  }

  // Find the dispute deduction transaction to get the userId
  // Dispute deductions are stored in balanceTransactions with type = 'stripe_dispute'
  // We look for the original purchase to get the userId
  const originalPurchaseResult = await db
    .select({
      userId: balanceTransactions.userId,
      amount: balanceTransactions.amount,
      description: balanceTransactions.description,
    })
    .from(balanceTransactions)
    .where(
      and(
        eq(balanceTransactions.relatedId, paymentIntentId),
        eq(balanceTransactions.type, 'stripe_purchase')
      )
    )
    .limit(1);

  const originalPurchase = originalPurchaseResult[0];

  if (!originalPurchase) {
    logger.warn(
      'No original purchase found for won dispute - cannot re-credit',
      { disputeId: dispute.id, paymentIntentId },
      'StripeWebhook'
    );
    return { success: true }; // Don't retry - no deduction to reverse
  }

  const amountUSD = dispute.amount / 100; // Stripe uses cents

  logger.info(
    'Re-crediting points after winning dispute',
    {
      disputeId: dispute.id,
      userId: originalPurchase.userId,
      amountUSD,
    },
    'StripeWebhook'
  );

  // Re-credit points to user
  const result = await PointsService.creditDisputeWon(
    originalPurchase.userId,
    dispute.id,
    amountUSD,
    eventId
  );

  if (result.success) {
    logger.info(
      `Re-credited ${result.pointsAwarded} points to user after winning dispute`,
      {
        disputeId: dispute.id,
        userId: originalPurchase.userId,
        pointsCredited: result.pointsAwarded,
        newBalance: result.newTotal,
      },
      'StripeWebhook'
    );

    trackServerEvent(
      originalPurchase.userId,
      'stripe_dispute_won_points_credited',
      {
        disputeId: dispute.id,
        amountUSD,
        pointsCredited: result.pointsAwarded,
      }
    );

    return { success: true, alreadyProcessed: result.alreadyAwarded };
  }

  logger.error(
    'Failed to re-credit points after dispute won',
    {
      disputeId: dispute.id,
      userId: originalPurchase.userId,
      error: result.error,
    },
    'StripeWebhook'
  );
  return { success: false, error: result.error };
}

/**
 * Handle charge refund
 *
 * A refund was processed. Deduct the corresponding points from user's balance.
 * Handles both full and partial refunds.
 *
 * NOTE: charge.amount_refunded is CUMULATIVE, not incremental.
 * For partial refunds, we calculate the incremental amount by checking
 * how many points we've already deducted for this payment.
 */
async function handleChargeRefunded(
  charge: Stripe.Charge,
  eventId: string
): Promise<WebhookHandlerResult> {
  const totalRefundedCents = charge.amount_refunded;
  const totalRefundedUSD = totalRefundedCents / 100;
  const paymentIntentId =
    typeof charge.payment_intent === 'string'
      ? charge.payment_intent
      : charge.payment_intent?.id;

  if (!paymentIntentId) {
    logger.error(
      'Refund charge has no payment intent',
      { chargeId: charge.id },
      'StripeWebhook'
    );
    return { success: true }; // Don't retry - can't process without payment intent
  }

  // Find the original transaction to get the userId
  // Purchases are stored in balanceTransactions with relatedId = paymentIntentId
  const originalTxResult = await db
    .select({
      userId: balanceTransactions.userId,
      amount: balanceTransactions.amount,
      description: balanceTransactions.description,
    })
    .from(balanceTransactions)
    .where(
      and(
        eq(balanceTransactions.relatedId, paymentIntentId),
        eq(balanceTransactions.type, 'stripe_purchase')
      )
    )
    .limit(1);

  const originalTx = originalTxResult[0];

  if (!originalTx) {
    logger.warn(
      'No original purchase transaction found for refunded charge',
      { chargeId: charge.id, paymentIntentId },
      'StripeWebhook'
    );
    return { success: true }; // Don't retry - not our transaction
  }

  // Calculate incremental refund amount
  // charge.amount_refunded is CUMULATIVE, so we need to check how much we've already deducted
  // Refunds are stored in balanceTransactions with type = 'stripe_refund'
  // Each refund stores originalPaymentIntentId in description JSON
  const existingRefundsResult = await db
    .select({
      amount: balanceTransactions.amount,
      description: balanceTransactions.description,
    })
    .from(balanceTransactions)
    .where(
      and(
        eq(balanceTransactions.userId, originalTx.userId),
        eq(balanceTransactions.type, 'stripe_refund')
      )
    );

  // Filter refunds to only those for this specific payment intent
  // Each refund transaction stores originalPaymentIntentId in its description JSON
  const refundsForThisPayment = existingRefundsResult.filter((tx) => {
    if (!tx.description) return false;
    const desc = JSON.parse(tx.description) as {
      originalPaymentIntentId?: string;
    };
    return desc.originalPaymentIntentId === paymentIntentId;
  });

  // Sum already deducted points for this payment (amounts are negative for deductions)
  // balanceTransactions stores amount as string
  const alreadyDeductedPoints = refundsForThisPayment.reduce(
    (sum, tx) => sum + Math.abs(Number(tx.amount)),
    0
  );

  // Calculate total refunded points based on cumulative USD
  const totalRefundedPoints = Math.floor(totalRefundedUSD * 100);

  // Incremental = total cumulative - already processed
  const incrementalPointsToDeduct = totalRefundedPoints - alreadyDeductedPoints;

  if (incrementalPointsToDeduct <= 0) {
    logger.info(
      'Refund already fully processed (incremental calculation)',
      {
        chargeId: charge.id,
        eventId,
        totalRefundedPoints,
        alreadyDeductedPoints,
      },
      'StripeWebhook'
    );
    return { success: true, alreadyProcessed: true };
  }

  // Convert back to USD for the service call
  const incrementalAmountUSD = incrementalPointsToDeduct / 100;

  logger.info(
    'Processing refund - deducting points',
    {
      chargeId: charge.id,
      userId: originalTx.userId,
      totalRefundedUSD,
      incrementalAmountUSD,
      incrementalPointsToDeduct,
      alreadyDeductedPoints,
      refundsForThisPaymentCount: refundsForThisPayment.length,
      totalRefundsForUser: existingRefundsResult.length,
      fullRefund: charge.refunded,
      paymentIntentId,
    },
    'StripeWebhook'
  );

  // Deduct the incremental amount
  const result = await PointsService.reversePointsPurchase(
    originalTx.userId,
    paymentIntentId,
    'refund',
    incrementalAmountUSD,
    eventId
  );

  if (result.success) {
    if (result.alreadyAwarded) {
      logger.info(
        'Refund already processed (idempotency check passed)',
        { chargeId: charge.id, eventId },
        'StripeWebhook'
      );
      return { success: true, alreadyProcessed: true };
    }

    logger.info(
      `Deducted ${Math.abs(result.pointsAwarded)} points from user due to refund`,
      {
        chargeId: charge.id,
        userId: originalTx.userId,
        pointsDeducted: Math.abs(result.pointsAwarded),
        newBalance: result.newTotal,
        fullRefund: charge.refunded,
      },
      'StripeWebhook'
    );

    trackServerEvent(originalTx.userId, 'stripe_refund_points_deducted', {
      chargeId: charge.id,
      amountUSD: incrementalAmountUSD,
      pointsDeducted: Math.abs(result.pointsAwarded),
      fullRefund: charge.refunded,
    });

    return { success: true };
  }

  logger.error(
    'Failed to deduct points for refund',
    {
      chargeId: charge.id,
      userId: originalTx.userId,
      error: result.error,
    },
    'StripeWebhook'
  );
  return { success: false, error: result.error };
}
