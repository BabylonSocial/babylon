import { UsernameSchema } from '@babylon/shared';
import { z } from 'zod';

export const DiscordActivityRequestSchema = z
  .object({
    code: z.string().min(1),
    state: z.string().min(1, 'OAuth state parameter is required'),
  })
  .meta({ id: 'DiscordActivityRequestSchema' });

export const FarcasterCallbackBodySchema = z
  .object({
    message: z.string(),
    signature: z.string(),
    fid: z.number(),
    username: z.string(),
    displayName: z.string().optional(),
    pfpUrl: z.string().url().optional(),
    state: z.string(),
  })
  .meta({ id: 'FarcasterCallbackBodySchema' });

export const FarcasterOnboardingCallbackBodySchema = z
  .object({
    message: z.string(),
    signature: z.string(),
    fid: z.number(),
    username: z.string(),
    displayName: z.string().optional(),
    pfpUrl: z.string().url().optional(),
    bio: z.string().optional(),
    state: z.string(),
  })
  .meta({ id: 'FarcasterOnboardingCallbackBodySchema' });

export const SiweAuthSchema = z
  .object({
    message: z.string().min(1, 'Message is required'),
    signature: z.string().min(1, 'Signature is required'),
    username: UsernameSchema,
  })
  .meta({ id: 'SiweAuthSchema' });

export const TelegramValidateRequestSchema = z
  .object({
    initData: z.string().min(1, 'initData is required'),
  })
  .meta({ id: 'TelegramValidateRequestSchema' });
