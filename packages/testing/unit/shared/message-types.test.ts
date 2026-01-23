/**
 * Message Types Sync Test
 * 
 * Validates that MessageTypeEnum values stay in sync with the database enum.
 * This prevents type drift between the shared types and database schema.
 */

import { describe, expect, it } from 'bun:test';
import { MessageTypeEnum } from '@babylon/shared';
import { messageTypeEnum } from '@babylon/db/schema/messaging';

describe('MessageTypeEnum Sync', () => {
  it('should have MessageTypeEnum values match database enum values', () => {
    // Extract enum values from the database pgEnum
    // messageTypeEnum is a pgEnum with values: ['user', 'system']
    const dbEnumValues = messageTypeEnum.enumValues;
    
    // Extract values from MessageTypeEnum object
    const sharedEnumValues = Object.values(MessageTypeEnum);
    
    // Sort both arrays for comparison
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
