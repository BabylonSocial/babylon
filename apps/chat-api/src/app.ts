import { OpenAPIHandler } from '@orpc/openapi/fetch';
import { RPCHandler } from '@orpc/server/fetch';
import { apiReference } from '@scalar/hono-api-reference';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { HTTPException } from 'hono/http-exception';
import { type ContextDeps, createContext } from './context';
import { handleMcpDiscovery, handleMcpRequest } from './mcp/transport';
import { getOpenAPISpec } from './openapi';
import { appRouter } from './routers/routers';
import { generateRequestId } from './utils';

export type AppVariables = {
  requestId: string;
};

export async function createApp(deps: ContextDeps) {
  const { logger, chatService, dmService, messageService } = deps;

  logger.info({ msg: 'Creating chat-api app' });

  // Initialize oRPC handlers
  // RPC handler for frontend (POST /rpc/*)
  const rpcHandler = new RPCHandler(appRouter);
  // OpenAPI handler for third-party integrations (REST /api/*)
  const openApiHandler = new OpenAPIHandler(appRouter);

  // MCP deps (server is created per-request in handleMcpRequest)
  const mcpDeps = { chatService, dmService, messageService, logger };

  const app = new Hono<{ Variables: AppVariables }>()
    // Request ID middleware
    .use('*', async (c, next) => {
      const requestId = generateRequestId();
      c.set('requestId', requestId);
      await next();
    })
    // API docs at root
    .get(
      '/',
      apiReference({
        theme: 'kepler',
        spec: { url: '/openapi.json' },
      })
    )
    .get('/health', (c) =>
      c.json({
        status: 'ok',
        service: 'chat-api',
        timestamp: new Date().toISOString(),
      })
    )
    // OpenAPI specification
    .get('/openapi.json', async (c) => {
      const spec = await getOpenAPISpec();
      return c.json(spec);
    })
    // MCP endpoint - GET for discovery (no auth)
    .get('/mcp', async (c) => {
      return handleMcpDiscovery(c, { logger });
    })
    // MCP endpoint - POST for tool calls (auth required)
    .post('/mcp', async (c) => {
      const requestId = c.get('requestId');

      // Create context to get authenticated user
      const context = await createContext({
        ...deps,
        headers: c.req.raw.headers,
        requestId,
      });

      // Server is created per-request with userId baked in (thread-safe)
      return handleMcpRequest(c, mcpDeps, context.user);
    })
    // CORS
    .use(
      '/*',
      cors({
        origin: ['http://localhost:3000', 'https://*.babylon.game'],
        allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
        credentials: true,
      })
    )
    // OpenAPI handler for third-party integrations (REST style)
    .use('/api/*', async (c, next) => {
      const requestId = c.get('requestId');
      const startTime = performance.now();
      const url = new URL(c.req.url);
      const apiPath = url.pathname;

      logger.debug({
        msg: 'API request',
        path: apiPath,
        method: c.req.method,
        requestId,
      });

      const context = await createContext({
        ...deps,
        headers: c.req.raw.headers,
        requestId,
      });

      try {
        const { matched, response } = await openApiHandler.handle(c.req.raw, {
          prefix: '/api',
          context,
        });

        if (matched) {
          const duration = Math.round(performance.now() - startTime);

          logger.info({
            msg: 'API completed',
            path: apiPath,
            method: c.req.method,
            status: response.status,
            duration,
            requestId,
          });

          return c.newResponse(response.body, response);
        }

        await next();
      } catch (error) {
        const duration = Math.round(performance.now() - startTime);

        logger.error({
          msg: 'API failed',
          path: apiPath,
          method: c.req.method,
          duration,
          error: error instanceof Error ? error.message : String(error),
          requestId,
        });

        throw error;
      }
    })
    // RPC handler for frontend
    .use('/rpc/*', async (c, next) => {
      const requestId = c.get('requestId');
      const startTime = performance.now();
      const url = new URL(c.req.url);
      const procedurePath = url.pathname.replace('/rpc/', '');

      logger.debug({
        msg: 'RPC request',
        procedure: procedurePath,
        requestId,
      });

      const context = await createContext({
        ...deps,
        headers: c.req.raw.headers,
        requestId,
      });

      try {
        const { matched, response } = await rpcHandler.handle(c.req.raw, {
          prefix: '/rpc',
          context,
        });

        if (matched) {
          const duration = Math.round(performance.now() - startTime);

          logger.info({
            msg: 'RPC completed',
            procedure: procedurePath,
            status: response.status,
            duration,
            requestId,
          });

          return c.newResponse(response.body, response);
        }

        await next();
      } catch (error) {
        const duration = Math.round(performance.now() - startTime);

        logger.error({
          msg: 'RPC failed',
          procedure: procedurePath,
          duration,
          error: error instanceof Error ? error.message : String(error),
          requestId,
        });

        throw error;
      }
    })
    // Global error handler
    .onError((error, c) => {
      const requestId = c.get('requestId') ?? 'unknown';

      logger.error({
        msg: `Error: ${error.message}`,
        path: c.req.path,
        method: c.req.method,
        requestId,
        error,
      });

      if (error instanceof HTTPException) {
        return c.json(
          {
            message: error.message,
            requestId,
          },
          error.status
        );
      }

      return c.json(
        {
          message: 'Internal Server Error',
          requestId,
        },
        500
      );
    });

  return app;
}
