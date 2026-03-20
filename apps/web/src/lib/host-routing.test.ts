import { describe, expect, test } from 'bun:test';
import { isWaitlistHomePage, isWaitlistHostname } from './host-routing';

describe('host-routing', () => {
  test('recognizes configured waitlist hostnames', () => {
    expect(isWaitlistHostname('babylon.market')).toBe(true);
    expect(isWaitlistHostname('www.babylon.market')).toBe(true);
    expect(isWaitlistHostname('staging.babylon.market')).toBe(true);
    expect(isWaitlistHostname('www.staging.babylon.market')).toBe(true);
    expect(isWaitlistHostname('play.babylon.market')).toBe(false);
  });

  test('recognizes the waitlist homepage only on /', () => {
    expect(isWaitlistHomePage('babylon.market', '/')).toBe(true);
    expect(isWaitlistHomePage('www.babylon.market', '/')).toBe(true);
    expect(isWaitlistHomePage('staging.babylon.market', '/')).toBe(true);
    expect(isWaitlistHomePage('play.babylon.market', '/')).toBe(false);
    expect(isWaitlistHomePage('babylon.market', '/feed')).toBe(false);
  });
});
