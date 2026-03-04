/**
 * Onboarding Random Assets API
 *
 * @route GET /api/onboarding/random-assets - Get random assets
 * @access Public
 *
 * @description
 * Returns random profile picture and banner indices for onboarding.
 * Used to assign random assets to new users.
 *
 * @example
 * ```typescript
 * const { profilePictureIndex, bannerIndex } = await fetch('/api/onboarding/random-assets')
 *   .then(r => r.json());
 * ```
 */

import { successResponse } from '@babylon/api';
import { logger } from '@babylon/shared';
import type { NextRequest } from 'next/server';

const TOTAL_PROFILE_PICTURES = 100;
const TOTAL_BANNERS = 100;

interface RandomAssets {
  profilePictureIndex: number;
  bannerIndex: number;
}

/**
 * GET /api/onboarding/random-assets
 * Get random profile picture and banner indices
 */
export async function GET(_request: NextRequest) {
  const profilePictureIndex =
    Math.floor(Math.random() * TOTAL_PROFILE_PICTURES) + 1;
  const bannerIndex = Math.floor(Math.random() * TOTAL_BANNERS) + 1;

  const assets: RandomAssets = {
    profilePictureIndex,
    bannerIndex,
  };

  logger.debug(
    'Generated random assets',
    assets,
    'GET /api/onboarding/random-assets'
  );

  return successResponse(assets);
}
