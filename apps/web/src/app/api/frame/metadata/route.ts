/**
 * Farcaster Frame Metadata API
 *
 * @route GET /api/frame/metadata - Get Frame metadata
 * @access Public
 *
 * @description
 * Returns Frame metadata for Farcaster apps including name, icon, splash
 * image, and home URL. Used for Frame discovery and configuration.
 *
 * @example
 * ```typescript
 * const metadata = await fetch('/api/frame/metadata').then(r => r.json());
 * ```
 */

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const metadata = {
    name: 'Babylon',
    icon: 'https://babylon.market/assets/logos/logo.svg',
    splashImage: 'https://babylon.market/assets/images/og-image.png',
    splashBackgroundColor: '#0a0a0a',
    homeUrl: 'https://babylon.market',
    version: 'next',
  };

  return NextResponse.json(metadata, {
    headers: {
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
