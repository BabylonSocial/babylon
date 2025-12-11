import { RPCHandler } from '@orpc/server/fetch';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { HTTPException } from 'hono/http-exception';
import { type ContextDeps, createContext } from './context';
import {
  createChatMcpServer,
  handleMcpDiscovery,
  handleMcpRequest,
} from './mcp';
import { getOpenAPISpec } from './openapi';
import { appRouter } from './routers';
import { generateRequestId } from './utils';

export type AppVariables = {
  requestId: string;
};

export async function createApp(deps: ContextDeps) {
  const { logger, chatService, dmService, messageService } = deps;

  logger.info({ msg: 'Creating chat-api app' });

  // Initialize oRPC handler
  const orpcHandler = new RPCHandler(appRouter);

  // Initialize MCP server
  const mcpServer = createChatMcpServer({
    chatService,
    dmService,
    messageService,
    logger,
  });

  const app = new Hono<{ Variables: AppVariables }>()
    // Request ID middleware
    .use('*', async (c, next) => {
      const requestId = generateRequestId();
      c.set('requestId', requestId);
      await next();
    })
    // Health check (no logging)
    .get('/', (c) => c.text('OK'))
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
      return handleMcpDiscovery(c, { mcpServer, logger });
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

      return handleMcpRequest(c, { mcpServer, logger }, context.user);
    })
    // CORS
    .use(
      '/*',
      cors({
        origin: ['http://localhost:3000', 'https://*.babylon.game'],
        allowMethods: ['GET', 'POST', 'OPTIONS'],
        allowHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
        credentials: true,
      })
    )
    // oRPC handler
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
        const { matched, response } = await orpcHandler.handle(c.req.raw, {
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
