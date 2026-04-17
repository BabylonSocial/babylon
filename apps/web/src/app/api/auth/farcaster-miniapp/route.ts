/**
 * Farcaster mini-app quickAuth token exchange.
 *
 * Called by FarcasterMiniAppProvider after sdk.quickAuth.getToken() succeeds.
 * The quickAuth token is a JWT issued by https://auth.farcaster.xyz and
 * contains { sub: fid (number), address, iss, aud, exp }.
 *
 * Verification uses @farcaster/quick-auth's createClient().verifyJwt(), which
 * fetches the JWKS from auth.farcaster.xyz (~50-100ms, cached by the server).
 *
 * Client flow:
 *   1. sdk.quickAuth.getToken() → returns Farcaster-signed JWT
 *   2. Client POSTs { token } here
 *   3. This route verifies + provisions + returns { token } (Steward-compatible)
 *   4. Client POSTs to /api/auth/session to set httpOnly cookie
 */

import { withErrorHandling } from '@babylon/api';
import { db, eq, users } from '@babylon/db';
import { generateSnowflakeId } from '@babylon/shared';
import { createClient } from '@farcaster/quick-auth';
import { SignJWT } from 'jose';
import { NextRequest, NextResponse } from 'next/server';

import {
  ensureStewardUser,
  getStewardJwtSecret,
} from '@/lib/auth/steward-server';

function buildFarcasterPlaceholderEmail(fid: number): string {
  return `fid-${fid}@farcaster.babylon.local`;
}

function buildFarcasterPlaceholderName(
  fid: number,
  custodyAddress?: string
): string {
  return custodyAddress
    ? `Farcaster fid ${fid} (${custodyAddress})`
    : `Farcaster fid ${fid}`;
}

async function mintToken(stewardUserId: string, fid: number): Promise<string> {
  return new SignJWT({ userId: stewardUserId, tenantId: 'babylon', fid })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuer('steward')
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(getStewardJwtSecret());
}

export const POST = withErrorHandling(async (req: NextRequest) => {
  let body: { token?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Invalid request body' },
      { status: 400 }
    );
  }

  const { token: quickAuthToken } = body;
  if (!quickAuthToken) {
    return NextResponse.json(
      { ok: false, error: 'token is required' },
      { status: 400 }
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const domain = new URL(appUrl).hostname;

  // Verify quickAuth JWT — makes a network call to auth.farcaster.xyz for JWKS
  const quickAuthClient = createClient();
  let payload: { sub: number; address?: string };
  try {
    payload = (await quickAuthClient.verifyJwt({
      token: quickAuthToken,
      domain,
    })) as typeof payload;
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Invalid Farcaster quickAuth token' },
      { status: 401 }
    );
  }

  const fid = payload.sub;
  if (!fid || typeof fid !== 'number') {
    return NextResponse.json(
      { ok: false, error: 'FID missing from token' },
      { status: 401 }
    );
  }

  const custodyAddress = payload.address?.toLowerCase();
  const placeholderEmail = buildFarcasterPlaceholderEmail(fid);
  const placeholderName = buildFarcasterPlaceholderName(fid, custodyAddress);

  // Look up existing user by FID
  const [existing] = await db
    .select({ id: users.id, stewardId: users.stewardId, email: users.email })
    .from(users)
    .where(eq(users.farcasterFid, String(fid)))
    .limit(1);

  let stewardUserId: string;

  if (existing) {
    if (existing.stewardId) {
      stewardUserId = existing.stewardId;
    } else {
      stewardUserId = await ensureStewardUser({
        email: existing.email ?? placeholderEmail,
        name: placeholderName,
      });
      await db
        .update(users)
        .set({ stewardId: stewardUserId })
        .where(eq(users.id, existing.id));
    }
  } else {
    stewardUserId = await ensureStewardUser({
      email: placeholderEmail,
      name: placeholderName,
    });
    await db.insert(users).values({
      id: await generateSnowflakeId(),
      stewardId: stewardUserId,
      farcasterFid: String(fid),
      displayName: placeholderName,
      hasFarcaster: true,
      isActor: false,
      updatedAt: new Date(),
    });
  }

  const token = await mintToken(stewardUserId, fid);
  return NextResponse.json({ ok: true, token });
});
