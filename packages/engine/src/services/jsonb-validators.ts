/**
 * JSONB Validators
 *
 * Zod schemas for validating JSONB columns that are type-asserted at runtime.
 * Provides safe parsing with fallbacks for corrupted or malformed data.
 *
 * Uses types from @babylon/db (source of truth) and creates corresponding
 * Zod schemas for runtime validation.
 */

import type { NpcMemory, PriceModifier, RelationshipState } from '@babylon/db';
import { logger } from '@babylon/shared';
import { z } from 'zod';

// Re-export types from the source of truth for convenience
export type { NpcMemory, PriceModifier, RelationshipState } from '@babylon/db';

/**
 * NPC Memory schema - validates against NpcMemory interface from @babylon/db
 * Note: Using z.object directly (not z.ZodType) to preserve .omit() method
 */
export const NpcMemorySchema = z.object({
  id: z.string(),
  type: z.enum([
    'posted',
    'replied_to',
    'mentioned_by',
    'witnessed_event',
    'traded',
  ]),
  timestamp: z.string(), // ISO date string
  summary: z.string(),
  actorIds: z.array(z.string()).optional(),
  eventId: z.string().optional(),
  questionId: z.string().optional(),
  sentiment: z.number().min(-1).max(1),
}) satisfies z.ZodType<NpcMemory>;

/**
 * Array of NPC memories
 */
export const NpcMemoriesSchema = z.array(NpcMemorySchema);

/**
 * Partial memory schema for creation (without id)
 */
export const PartialMemorySchema = NpcMemorySchema.omit({ id: true });

/**
 * Relationship State schema - validates against RelationshipState interface from @babylon/db
 */
export const RelationshipStateSchema = z.object({
  actorId: z.string(),
  sentiment: z.number().min(-1).max(1),
  lastInteraction: z.string(), // ISO date string
  interactionCount: z.number().int().min(0),
  notes: z.array(z.string()),
}) satisfies z.ZodType<RelationshipState>;

/**
 * Map of relationships keyed by actor ID
 */
export const RelationshipsMapSchema = z.record(
  z.string(),
  RelationshipStateSchema
);

/**
 * Interaction update schema for relationship updates
 */
export const InteractionUpdateSchema = z.object({
  sentimentChange: z.number().min(-1).max(1),
  note: z.string().optional(),
});

/**
 * Safely parse NPC memories from JSONB with fallback to empty array.
 * Logs a warning for invalid data but doesn't throw.
 */
export function parseMemoriesSafe(
  data: unknown,
  context?: { actorId?: string }
): NpcMemory[] {
  if (data === null || data === undefined) {
    return [];
  }

  const result = NpcMemoriesSchema.safeParse(data);
  if (result.success) {
    return result.data;
  }

  // Log the validation error but don't throw
  logger.warn(
    'Invalid memories JSONB data',
    {
      actorId: context?.actorId,
      issues: result.error.issues.slice(0, 3),
    },
    'JSONBValidation'
  );

  // Try to salvage valid memories from the array
  if (Array.isArray(data)) {
    const validMemories: NpcMemory[] = [];
    let discardedCount = 0;
    for (const item of data) {
      const itemResult = NpcMemorySchema.safeParse(item);
      if (itemResult.success) {
        validMemories.push(itemResult.data);
      } else {
        discardedCount++;
      }
    }

    // Log salvage statistics
    if (discardedCount > 0) {
      logger.info(
        'Salvaged partial memories from corrupted data',
        {
          actorId: context?.actorId,
          salvaged: validMemories.length,
          discarded: discardedCount,
          total: data.length,
        },
        'JSONBValidation'
      );
    }

    return validMemories;
  }

  return [];
}

/**
 * Safely parse relationships map from JSONB with fallback to empty object.
 * Logs a warning for invalid data but doesn't throw.
 */
export function parseRelationshipsSafe(
  data: unknown,
  context?: { actorId?: string }
): Record<string, RelationshipState> {
  if (data === null || data === undefined) {
    return {};
  }

  const result = RelationshipsMapSchema.safeParse(data);
  if (result.success) {
    return result.data;
  }

  // Log the validation error but don't throw
  logger.warn(
    'Invalid relationships JSONB data',
    {
      actorId: context?.actorId,
      issues: result.error.issues.slice(0, 3),
    },
    'JSONBValidation'
  );

  // Try to salvage valid relationships from the object
  if (typeof data === 'object' && data !== null) {
    const validRelationships: Record<string, RelationshipState> = {};
    let discardedCount = 0;
    const entries = Object.entries(data);
    for (const [key, value] of entries) {
      const itemResult = RelationshipStateSchema.safeParse(value);
      if (itemResult.success) {
        validRelationships[key] = itemResult.data;
      } else {
        discardedCount++;
      }
    }

    // Log salvage statistics
    if (discardedCount > 0) {
      logger.info(
        'Salvaged partial relationships from corrupted data',
        {
          actorId: context?.actorId,
          salvaged: Object.keys(validRelationships).length,
          discarded: discardedCount,
          total: entries.length,
        },
        'JSONBValidation'
      );
    }

    return validRelationships;
  }

  return {};
}

/**
 * Validate a single memory object before inserting.
 * Throws if invalid - use for write operations.
 */
export function validateMemory(
  memory: unknown
): asserts memory is Omit<NpcMemory, 'id'> {
  PartialMemorySchema.parse(memory);
}

/**
 * Validate a single relationship update before writing.
 * Throws if invalid - use for write operations.
 */
export function validateRelationshipUpdate(
  interaction: unknown
): asserts interaction is z.infer<typeof InteractionUpdateSchema> {
  InteractionUpdateSchema.parse(interaction);
}

/**
 * PriceModifier schema - validates against PriceModifier interface from @babylon/db
 */
export const PriceModifierSchema = z.object({
  eventId: z.string(),
  effect: z.number().min(0.01).max(10), // Effect multiplier bounded 0.01x to 10x
  decayRate: z.number().min(0).max(1), // Decay rate 0-100% per hour
  appliedAt: z.string(), // ISO date string
  expiresAt: z.string(), // ISO date string
}) satisfies z.ZodType<PriceModifier>;

/**
 * Array of price modifiers
 */
export const PriceModifiersSchema = z.array(PriceModifierSchema);

/**
 * Safely parse price modifiers from JSONB with fallback to empty array.
 * Logs a warning for invalid data but doesn't throw.
 */
export function parseModifiersSafe(
  data: unknown,
  context?: { orgId?: string }
): PriceModifier[] {
  if (data === null || data === undefined) {
    return [];
  }

  const result = PriceModifiersSchema.safeParse(data);
  if (result.success) {
    return result.data;
  }

  // Log the validation error but don't throw
  logger.warn(
    'Invalid modifiers JSONB data',
    {
      orgId: context?.orgId,
      issues: result.error.issues.slice(0, 3),
    },
    'JSONBValidation'
  );

  // Try to salvage valid modifiers from the array
  if (Array.isArray(data)) {
    const validModifiers: PriceModifier[] = [];
    let discardedCount = 0;
    for (const item of data) {
      const itemResult = PriceModifierSchema.safeParse(item);
      if (itemResult.success) {
        validModifiers.push(itemResult.data);
      } else {
        discardedCount++;
      }
    }

    // Log salvage statistics
    if (discardedCount > 0) {
      logger.info(
        'Salvaged partial modifiers from corrupted data',
        {
          orgId: context?.orgId,
          salvaged: validModifiers.length,
          discarded: discardedCount,
          total: data.length,
        },
        'JSONBValidation'
      );
    }

    return validModifiers;
  }

  return [];
}

/**
 * Validate a single price modifier before inserting.
 * Throws if invalid - use for write operations.
 */
export function validatePriceModifier(
  modifier: unknown
): asserts modifier is PriceModifier {
  PriceModifierSchema.parse(modifier);
}
