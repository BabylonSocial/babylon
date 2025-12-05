/**
 * PostHog Client Utilities
 * 
 * For client-side usage only.
 * Server-side code should import directly from './server':
 * 
 * import { trackServerEvent } from '@/lib/posthog/server';
 */

export { initPostHog, getPostHog, posthog } from './client';
export type { PostHogClient } from './client';
