/**
 * SIWE Authentication Endpoint
 *
 * @route POST /api/auth/siwe/authenticate
 * @access Public
 *
 * @description
 * Authenticates an agent using SIWE (Sign-In With Ethereum).
 * - If wallet exists: Issues a new API key (login)
 * - If wallet doesn't exist: Creates new user with isAgent=true (register)
 */

import {
  generateApiKey,
  hashApiKey,
  successResponse,
  verifySiweMessage,
  withErrorHandling,
} from '@babylon/api';
import { SiweAuthSchema } from '@babylon/api/schemas';
import {
  db,
  eq,
  generateSnowflakeId,
  sql,
  userApiKeys,
  users,
  withTransaction,
} from '@babylon/db';
import { logger } from '@babylon/shared';
import { type NextRequest, NextResponse } from 'next/server';

export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = await request.json();

  // Validate request body
  const parseResult = SiweAuthSchema.safeParse(body);
  if (!parseResult.success) {
    const firstError = parseResult.error.issues[0];
    return NextResponse.json(
      {
        error: 'validation_error',
        message: firstError?.message || 'Invalid request',
      },
      { status: 400 }
    );
  }

  const { message, signature, username } = parseResult.data;

  // Verify SIWE signature
  const verifyResult = await verifySiweMessage(message, signature);
  if (!verifyResult.success) {
    return NextResponse.json(
      {
        error: verifyResult.error,
        message: getErrorMessage(verifyResult.error),
      },
      { status: 400 }
    );
  }

  const walletAddress = verifyResult.address.toLowerCase();

  // Check if wallet already registered
  const [existingUser] = await db
    .select({
      id: users.id,
      username: users.username,
      walletAddress: users.walletAddress,
    })
    .from(users)
    .where(eq(users.walletAddress, walletAddress))
    .limit(1);

  if (existingUser) {
    // LOGIN FLOW: Existing user - issue new API key
    const apiKey = generateApiKey();
    const keyHash = hashApiKey(apiKey);
    const keyId = await generateSnowflakeId();

    await db.insert(userApiKeys).values({
      id: keyId,
      userId: existingUser.id,
      keyHash,
      name: `SIWE Login ${new Date().toISOString().split('T')[0]}`,
      createdAt: new Date(),
    });

    logger.info(
      'SIWE agent login',
      {
        userId: existingUser.id,
        username: existingUser.username,
        walletAddress: existingUser.walletAddress,
      },
      'SIWE'
    );

    return successResponse({
      success: true,
      isNewUser: false,
      userId: existingUser.id,
      username: existingUser.username,
      walletAddress: existingUser.walletAddress,
      apiKey, // Only shown once!
    });
  }

  // REGISTER FLOW: New user - check username availability (case-insensitive)
  const [existingUsername] = await db
    .select({ id: users.id })
    .from(users)
    .where(sql`lower(${users.username}) = lower(${username})`)
    .limit(1);

  if (existingUsername) {
    return NextResponse.json(
      {
        error: 'username_taken',
        message: `Username '${username}' is already taken`,
      },
      { status: 409 }
    );
  }

  // Create user and API key in transaction
  const result = await withTransaction(async (tx) => {
    const userId = await generateSnowflakeId();

    // Create user
    const [user] = await tx
      .insert(users)
      .values({
        id: userId,
        username,
        displayName: username,
        walletAddress,
        isAgent: true,
        profileComplete: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning({
        id: users.id,
        username: users.username,
        walletAddress: users.walletAddress,
      });

    if (!user) {
      throw new Error('Failed to create user');
    }

    // Generate API key
    const apiKey = generateApiKey();
    const keyHash = hashApiKey(apiKey);
    const keyId = await generateSnowflakeId();

    await tx.insert(userApiKeys).values({
      id: keyId,
      userId,
      keyHash,
      name: 'SIWE Registration',
      createdAt: new Date(),
    });

    return { user, apiKey };
  });

  logger.info(
    'SIWE agent registration',
    {
      userId: result.user.id,
      username: result.user.username,
      walletAddress: result.user.walletAddress,
    },
    'SIWE'
  );

  return successResponse({
    success: true,
    isNewUser: true,
    userId: result.user.id,
    username: result.user.username,
    walletAddress: result.user.walletAddress,
    apiKey: result.apiKey, // Only shown once!
  });
});

function getErrorMessage(
  error:
    | 'invalid_nonce'
    | 'invalid_domain'
    | 'invalid_signature'
    | 'expired_message'
): string {
  switch (error) {
    case 'invalid_nonce':
      return 'Nonce is invalid, expired, or already used. Please request a new nonce.';
    case 'invalid_domain':
      return 'Domain in SIWE message does not match expected domain.';
    case 'invalid_signature':
      return 'Signature verification failed.';
    case 'expired_message':
      return 'SIWE message has expired.';
  }
}
