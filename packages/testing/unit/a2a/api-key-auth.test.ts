/**
 * A2A API Key Authentication Unit Tests
 *
 * Tests for API key validation utilities
 */

import { describe, expect, it } from 'bun:test';
import {
  A2A_API_KEY_HEADER,
  isLocalHost,
  validateApiKey,
} from '@babylon/a2a';

describe('A2A API Key Authentication', () => {
  describe('isLocalHost', () => {
    it('should return true for localhost', () => {
      expect(isLocalHost('localhost')).toBe(true);
      expect(isLocalHost('localhost:3000')).toBe(true);
      expect(isLocalHost('LOCALHOST')).toBe(true);
    });

    it('should return true for 127.0.0.1', () => {
      expect(isLocalHost('127.0.0.1')).toBe(true);
      expect(isLocalHost('127.0.0.1:3000')).toBe(true);
    });

    it('should return true for IPv6 localhost', () => {
      expect(isLocalHost('::1')).toBe(true);
      expect(isLocalHost('::1:3000')).toBe(true);
    });

    it('should return false for remote hosts', () => {
      expect(isLocalHost('example.com')).toBe(false);
      expect(isLocalHost('192.168.1.1')).toBe(false);
      expect(isLocalHost('api.babylon.game')).toBe(false);
    });

    it('should return false for null/undefined', () => {
      expect(isLocalHost(null)).toBe(false);
      expect(isLocalHost(undefined)).toBe(false);
    });
  });

  describe('validateApiKey', () => {
    const mockRequest = (apiKey: string | null, host?: string) => ({
      headers: {
        get: (name: string) => {
          if (name.toLowerCase() === A2A_API_KEY_HEADER) return apiKey;
          if (name.toLowerCase() === 'host') return host || null;
          return null;
        },
      },
      host,
    });

    it('should allow localhost requests without API key when enabled', () => {
      const request = mockRequest(null, 'localhost:3000');
      const result = validateApiKey(request, {
        requiredApiKey: 'test-key',
        allowLocalhost: true,
      });

      expect(result.authenticated).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject localhost when allowLocalhost is false', () => {
      const request = mockRequest(null, 'localhost:3000');
      const result = validateApiKey(request, {
        requiredApiKey: 'test-key',
        allowLocalhost: false,
      });

      expect(result.authenticated).toBe(false);
      expect(result.statusCode).toBe(401);
    });

    it('should authenticate valid API key', () => {
      const request = mockRequest('valid-api-key', 'api.babylon.game');
      const result = validateApiKey(request, {
        requiredApiKey: 'valid-api-key',
        allowLocalhost: false,
      });

      expect(result.authenticated).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject invalid API key', () => {
      const request = mockRequest('wrong-key', 'api.babylon.game');
      const result = validateApiKey(request, {
        requiredApiKey: 'correct-key',
        allowLocalhost: false,
      });

      expect(result.authenticated).toBe(false);
      expect(result.statusCode).toBe(401);
      expect(result.error).toContain('Unauthorized');
    });

    it('should reject missing API key on non-localhost', () => {
      const request = mockRequest(null, 'api.babylon.game');
      const result = validateApiKey(request, {
        requiredApiKey: 'test-key',
        allowLocalhost: false,
      });

      expect(result.authenticated).toBe(false);
      expect(result.statusCode).toBe(401);
    });

    it('should return 503 when API key is not configured', () => {
      const request = mockRequest('any-key', 'api.babylon.game');
      const result = validateApiKey(request, {
        requiredApiKey: undefined,
        allowLocalhost: false,
      });

      expect(result.authenticated).toBe(false);
      expect(result.statusCode).toBe(503);
      expect(result.error).toContain('not configured');
    });
  });

  describe('A2A_API_KEY_HEADER', () => {
    it('should be the correct header name', () => {
      expect(A2A_API_KEY_HEADER).toBe('x-babylon-api-key');
    });
  });
});

