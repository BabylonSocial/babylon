/**
 * Message Types Sync Test
 *
 * Validates that MessageTypeEnum values stay in sync with the database enum.
 * This prevents type drift between the shared types and database schema.
 */

import { describe, expect, it } from 'bun:test';
import { messageTypeEnum } from '@babylon/db/tables/messaging-enums';
import { MessageTypeEnum } from '@babylon/shared';

describe('MessageTypeEnum Sync', () => {
  it('should have MessageTypeEnum values match database enum values', () => {
    const dbEnumValues = messageTypeEnum.enumValues;
    const sharedEnumValues = Object.values(MessageTypeEnum);

    const sortedDbValues = [...dbEnumValues].sort();
    const sortedSharedValues = [...sharedEnumValues].sort();

    expect(sortedSharedValues).toEqual(sortedDbValues);
  });

  it('should have all database enum values present in MessageTypeEnum', () => {
    const dbEnumValues = messageTypeEnum.enumValues;
    const sharedEnumValues = Object.values(MessageTypeEnum);

    for (const dbValue of dbEnumValues) {
      expect(sharedEnumValues).toContain(dbValue);
    }
  });

  it('should have all MessageTypeEnum values present in database enum', () => {
    const dbEnumValues = messageTypeEnum.enumValues;
    const sharedEnumValues = Object.values(MessageTypeEnum);

    for (const sharedValue of sharedEnumValues) {
      expect(dbEnumValues).toContain(sharedValue);
    }
  });
});
