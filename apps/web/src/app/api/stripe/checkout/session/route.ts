/**
 * Stripe Checkout Session API
 *
 * @route POST /api/stripe/checkout/session - Create Stripe Checkout Session
 * @access Authenticated
 *
 * @description
 * Creates a Stripe Checkout Session for purchasing points with a credit card.
 * Returns the session URL for redirecting the user to Stripe's hosted checkout.
 *
 * Points are credited via webhook after successful payment, not in this endpoint.
 *
 * @example
 * ```typescript
 * const response = await fetch('/api/stripe/checkout/session', {
 *   method: 'POST',
 *   headers: {
 *     'Content-Type': 'application/json',
 *     'Authorization': `Bearer ${token}`
 *   },
 *   body: JSON.stringify({ amountUSD: 50 })
 * });
 *
 * const { url } = await response.json();
 * window.location.href = url; // Redirect to Stripe Checkout
 * ```
 */

import { authenticate } from '@babylon/api';
import { logger } from '@babylon/shared';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { trackServerEvent } from '@/lib/posthog/server';
import {
  calculatePointsFromUSD,
  getBaseUrl,
  POINTS_CONFIG,
  stripe,
  validatePurchaseAmount,
} from '@/lib/stripe/server';

interface CreateCheckoutSessionBody {
  amountUSD: number;
}

export async function POST(req: NextRequest) {
  const authUser = await authenticate(req);

  // Ensure user has a database record
  if (!authUser.dbUserId) {
    return NextResponse.json(
      {
        success: false,
        error:
          'User account not fully set up. Please complete your profile first.',
      },
      { status: 401 }
    );
  }

  const userId = authUser.dbUserId;
  const userEmail = authUser.email;

  // Parse request body with error handling for malformed JSON
  let body: CreateCheckoutSessionBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid JSON body' },
      { status: 400 }
    );
  }
  const { amountUSD } = body;

  // Validate amount
  const validation = validatePurchaseAmount(amountUSD);
  if (!validation.valid) {
    return NextResponse.json(
      { success: false, error: validation.error },
      { status: 400 }
    );
  }

  const pointsAmount = calculatePointsFromUSD(amountUSD);

  // Get the origin from the request for accurate redirect URLs
  const requestOrigin =
    req.headers.get('origin') ||
    req.headers.get('referer')?.replace(/\/[^/]*$/, '');
  const baseUrl = getBaseUrl(requestOrigin || undefined);

  // Create Stripe Checkout Session
  // Use Math.round to avoid floating-point errors (e.g., 1.1 * 100 = 110.00000000000001)
  const amountCents = Math.round(amountUSD * 100);

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: POINTS_CONFIG.CURRENCY,
          unit_amount: amountCents, // Stripe uses cents
          product_data: {
            name: `${pointsAmount.toLocaleString()} Babylon Points`,
            description: `Purchase ${pointsAmount.toLocaleString()} points for $${amountUSD}`,
          },
        },
        quantity: 1,
      },
    ],
    // Store purchase details in metadata for webhook processing
    metadata: {
      app: 'babylon',
      userId,
      pointsAmount: pointsAmount.toString(),
      amountUSD: amountUSD.toString(),
      purchaseType: 'points',
    },
    // Pre-fill customer email if available
    customer_email: userEmail || undefined,
    // Success redirect includes session ID for confirmation display
    success_url: `${baseUrl}/markets?stripe_success=true&session_id={CHECKOUT_SESSION_ID}`,
    // Cancel redirect for user who abandons checkout
    cancel_url: `${baseUrl}/markets?stripe_cancelled=true`,
    // Session expires after 30 minutes
    expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
  });

  logger.info(
    `Created Stripe checkout session for ${pointsAmount} points ($${amountUSD})`,
    {
      userId,
      sessionId: session.id,
      amountUSD,
      pointsAmount,
    },
    'StripeCheckout'
  );

  trackServerEvent(userId, 'stripe_checkout_initiated', {
    amountUSD,
    pointsAmount,
    sessionId: session.id,
  });

  return NextResponse.json({
    success: true,
    sessionId: session.id,
    url: session.url,
  });
}
