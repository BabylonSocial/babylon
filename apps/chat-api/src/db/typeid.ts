/**
 * TypeID Infrastructure for Chat-API
 *
 * TypeIDs are prefixed UUIDs that provide type-safe identifiers.
 * Format: prefix_base32encodedUUID (e.g., "cht_01h455vb4pex5vsknk084sn02q")
 *
 * Benefits:
 * - Type safety: ChatId cannot be used where MessageId is expected
 * - Human readable: Prefix indicates entity type
 * - Storage efficient: Stored as UUID in database
 */

import { fromString, getType, TypeID, toUUID, typeid } from 'typeid-js';
import { z } from 'zod';

const TYPE_ID_SUFFIX_LENGTH = 26;

/**
 * Mapping of entity names to their TypeID prefixes
 */
export const idTypesMapNameToPrefix = {
  // Chat domain entities
  chat: 'cht',
  message: 'msg',
  chatParticipant: 'cprt',
  chatAdmin: 'cadm',
  chatInvite: 'cinv',
  groupMembership: 'gmem',
  dmAcceptance: 'dma',
  moderationLog: 'mlog',

  // Shared/referenced entities
  user: 'usr',
  request: 'req',
} as const;

type IdTypesMapNameToPrefix = typeof idTypesMapNameToPrefix;

type IdTypesMapPrefixToName = {
  [K in keyof IdTypesMapNameToPrefix as IdTypesMapNameToPrefix[K]]: K;
};

const idTypesMapPrefixToName = Object.fromEntries(
  Object.entries(idTypesMapNameToPrefix).map(([name, prefix]) => [prefix, name])
) as IdTypesMapPrefixToName;

export type IdTypePrefixNames = keyof typeof idTypesMapNameToPrefix;

/**
 * Branded TypeID string type
 * e.g., TypeId<"chat"> = "cht_01h455vb4pex5vsknk084sn02q"
 */
export type TypeId<T extends IdTypePrefixNames> =
  `${(typeof idTypesMapNameToPrefix)[T]}_${string}`;

/**
 * Create a Zod validator for a specific TypeID prefix
 */
export const typeIdValidator = <const T extends IdTypePrefixNames>(prefix: T) =>
  z
    .string()
    .startsWith(`${idTypesMapNameToPrefix[prefix]}_`)
    .length(TYPE_ID_SUFFIX_LENGTH + idTypesMapNameToPrefix[prefix].length + 1)
    .refine(
      (input) => {
        try {
          TypeID.fromString(input).asType(idTypesMapNameToPrefix[prefix]);
          return true;
        } catch {
          return false;
        }
      },
      {
        message: `Invalid ${prefix} TypeID format`,
      }
    ) as z.ZodType<TypeId<T>, TypeId<T>>;

/**
 * Generate a new TypeID for an entity type
 */
export const typeIdGenerator = <const T extends IdTypePrefixNames>(
  prefix: T
): TypeId<T> => typeid(idTypesMapNameToPrefix[prefix]).toString() as TypeId<T>;

/**
 * Convert a UUID to a TypeID string
 */
export const typeIdFromUuid = <const T extends IdTypePrefixNames>(
  prefix: T,
  uuid: string
): TypeId<T> => {
  const actualPrefix = idTypesMapNameToPrefix[prefix];
  return TypeID.fromUUID(actualPrefix, uuid).toString() as TypeId<T>;
};

/**
 * Convert a TypeID string to UUID and prefix
 */
export const typeIdToUuid = <const T extends IdTypePrefixNames>(
  input: TypeId<T>
): { uuid: string; prefix: string } => {
  const id = fromString(input);
  return {
    uuid: toUUID(id).toString(),
    prefix: getType(id),
  };
};

/**
 * Validate that a value is a valid TypeID of a specific type
 */
export const validateTypeId = <const T extends IdTypePrefixNames>(
  prefix: T,
  data: unknown
): data is TypeId<T> => typeIdValidator(prefix).safeParse(data).success;

/**
 * Infer the entity type from a TypeID string
 */
export const inferTypeIdPrefix = <T extends keyof IdTypesMapPrefixToName>(
  input: `${T}_${string}`
): IdTypesMapPrefixToName[T] =>
  idTypesMapPrefixToName[
    TypeID.fromString(input).getType() as T
  ] as IdTypesMapPrefixToName[T];

// ============================================================================
// Pre-defined TypeID validators and types for chat domain
// ============================================================================

export const ChatId = typeIdValidator('chat');
export type ChatId = z.infer<typeof ChatId>;

export const MessageId = typeIdValidator('message');
export type MessageId = z.infer<typeof MessageId>;

export const ChatParticipantId = typeIdValidator('chatParticipant');
export type ChatParticipantId = z.infer<typeof ChatParticipantId>;

export const ChatAdminId = typeIdValidator('chatAdmin');
export type ChatAdminId = z.infer<typeof ChatAdminId>;

export const ChatInviteId = typeIdValidator('chatInvite');
export type ChatInviteId = z.infer<typeof ChatInviteId>;

export const GroupMembershipId = typeIdValidator('groupMembership');
export type GroupMembershipId = z.infer<typeof GroupMembershipId>;

export const DmAcceptanceId = typeIdValidator('dmAcceptance');
export type DmAcceptanceId = z.infer<typeof DmAcceptanceId>;

export const ModerationLogId = typeIdValidator('moderationLog');
export type ModerationLogId = z.infer<typeof ModerationLogId>;

export const UserId = typeIdValidator('user');
export type UserId = z.infer<typeof UserId>;

export const RequestId = typeIdValidator('request');
export type RequestId = z.infer<typeof RequestId>;
