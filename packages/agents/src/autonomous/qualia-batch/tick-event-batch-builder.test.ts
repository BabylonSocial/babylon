import { describe, expect, it } from 'bun:test';
import { marketSignature } from './tick-event-batch-builder';

describe('tick-event-batch-builder / marketSignature', () => {
  it('buckets change percent for dedupe keys', () => {
    expect(marketSignature('AAA', 1.24)).toBe('AAA:1.0');
    expect(marketSignature('AAA', 1.26)).toBe('AAA:1.5');
  });
});
