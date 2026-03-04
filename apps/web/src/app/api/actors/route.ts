/**
 * Actors Data API
 *
 * @route GET /api/actors
 * @access Public
 *
 * @description
 * Returns all actors and organizations data from the game world. Uses TypeScript
 * imports for optimal performance and type safety. Includes NPCs, organizations,
 * and their metadata.
 *
 * @returns {Promise<NextResponse>} JSON response with actors and organizations data
 *
 * @example
 * ```typescript
 * const response = await fetch('/api/actors');
 * const data = await response.json();
 * console.log(data.actors); // Array of all actors
 * ```
 *
 * @see {@link @babylon/engine#loadActorsData} Actors data loader (TypeScript imports)
 */

import { loadActorsData } from '@babylon/engine';
import { NextResponse } from 'next/server';

/**
 * GET /api/actors
 *
 * @description Fetches all actors and organizations data from the game world
 *
 * @returns {Promise<NextResponse>} Actors and organizations data
 */
export async function GET() {
  const actorsData = loadActorsData();
  return NextResponse.json(actorsData);
}
