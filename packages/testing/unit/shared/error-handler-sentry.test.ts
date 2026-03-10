import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test';
import {
  setDefaultErrorCapture as importedSetDefaultErrorCapture,
  withErrorHandling as importedWithErrorHandling,
} from '../../../api/src/error-handler';
import {
  AuthenticationError,
  BadRequestError,
  ValidationError,
} from '../../../api/src/errors';

type ErrorHandlerModule = typeof import('../../../api/src/error-handler');

let setDefaultErrorCapture: ErrorHandlerModule['setDefaultErrorCapture'] =
  importedSetDefaultErrorCapture;
let withErrorHandling: ErrorHandlerModule['withErrorHandling'] =
  importedWithErrorHandling;

function createRequest(): import('next/server').NextRequest {
  return new Request('http://localhost/api/test', {
    method: 'POST',
    headers: {
      'x-user-id': 'user-123',
      'x-request-id': 'req-123',
    },
  }) as import('next/server').NextRequest;
}

describe('withErrorHandling + default Sentry capture', () => {
  beforeEach(async () => {
    // Load a fresh module instance so this suite is immune to cross-file mock.module
    // overrides of @babylon/api exports (including withErrorHandling).
    const freshModule = (await import(
      `../../../api/src/error-handler.ts?isolation=${Date.now()}-${Math.random()}`
    )) as ErrorHandlerModule;
    setDefaultErrorCapture = freshModule.setDefaultErrorCapture;
    withErrorHandling = freshModule.withErrorHandling;
  });

  afterEach(() => {
    setDefaultErrorCapture(undefined);
  });

  it('captures unexpected errors through the global capture callback', async () => {
    const captureError = mock(
      (_error: Error, _context: Record<string, unknown>) => {}
    );
    setDefaultErrorCapture(captureError);

    const handler = withErrorHandling(async () => {
      throw new Error('boom');
    });

    const response = await handler(createRequest());
    expect(response.status).toBe(500);
    expect(captureError).toHaveBeenCalledTimes(1);
  });

  it('keeps route-level captureError precedence over the global callback', async () => {
    const globalCapture = mock(
      (_error: Error, _context: Record<string, unknown>) => {}
    );
    const routeCapture = mock(
      (_error: Error, _context: Record<string, unknown>) => {}
    );
    setDefaultErrorCapture(globalCapture);

    const handler = withErrorHandling(
      async () => {
        throw new Error('route override');
      },
      { captureError: routeCapture }
    );

    const response = await handler(createRequest());
    expect(response.status).toBe(500);
    expect(routeCapture).toHaveBeenCalledTimes(1);
    expect(globalCapture).toHaveBeenCalledTimes(0);
  });

  it('does not capture expected validation errors', async () => {
    const captureError = mock(
      (_error: Error, _context: Record<string, unknown>) => {}
    );
    setDefaultErrorCapture(captureError);

    const handler = withErrorHandling(async () => {
      throw new ValidationError('Validation failed');
    });

    const response = await handler(createRequest());
    expect(response.status).toBe(422);
    expect(captureError).toHaveBeenCalledTimes(0);
  });

  it('does not capture authentication errors', async () => {
    const captureError = mock(
      (_error: Error, _context: Record<string, unknown>) => {}
    );
    setDefaultErrorCapture(captureError);

    const handler = withErrorHandling(async () => {
      throw new AuthenticationError('Authentication required');
    });

    const response = await handler(createRequest());
    expect(response.status).toBe(401);
    expect(captureError).toHaveBeenCalledTimes(0);
  });

  it('does not capture expected 4xx operational errors', async () => {
    const captureError = mock(
      (_error: Error, _context: Record<string, unknown>) => {}
    );
    setDefaultErrorCapture(captureError);

    const handler = withErrorHandling(async () => {
      throw new BadRequestError('Invalid request');
    });

    const response = await handler(createRequest());
    expect(response.status).toBe(400);
    expect(captureError).toHaveBeenCalledTimes(0);
  });
});
