/**
 * OpenAPI Specification Generator for Chat API
 *
 * Generates OpenAPI 3.1 spec from oRPC router definitions.
 * Uses @orpc/openapi with Zod schema conversion.
 */

import { OpenAPIGenerator } from '@orpc/openapi';
import { ZodToJsonSchemaConverter } from '@orpc/zod/zod4';
import { appRouter } from './routers/routers';

/**
 * OpenAPI spec info
 */
const API_INFO = {
  title: 'Babylon Chat API',
  version: '1.0.0',
  description: `
Chat API for Babylon prediction markets platform.

## Authentication

All protected endpoints require a valid Privy authentication token.

### Methods:
1. **Cookie**: \`privy-token\` cookie (auto-set by Privy SDK)
2. **Bearer Token**: \`Authorization: Bearer <token>\` header

### Public Endpoints
Some endpoints (like listing game chats) are public and don't require authentication.

## Rate Limiting
API calls are rate-limited per user. Contact support for higher limits.

## Endpoints

This API provides two interfaces:
- **REST API** (\`/api/*\`): OpenAPI-compliant REST endpoints for third-party integrations
- **RPC API** (\`/rpc/*\`): Type-safe RPC endpoints for frontend applications
  `.trim(),
  contact: {
    name: 'Babylon Support',
    url: 'https://babylon.game',
  },
};

/**
 * API tags for grouping endpoints
 */
const API_TAGS = [
  {
    name: 'Chats',
    description: 'Chat room operations - list, create, join, leave',
  },
  {
    name: 'Direct Messages',
    description: 'Direct messaging between users',
  },
  {
    name: 'Messages',
    description: 'Send and receive messages in chats',
  },
  {
    name: 'Groups',
    description: 'Group chat management - members, invites',
  },
  {
    name: 'Moderation',
    description: 'Chat moderation - kick, ban, unban',
  },
];

/**
 * Create OpenAPI generator with Zod schema conversion
 */
export function createOpenAPIGenerator(): OpenAPIGenerator {
  return new OpenAPIGenerator({
    schemaConverters: [new ZodToJsonSchemaConverter()],
  });
}

/**
 * Generate OpenAPI specification from router
 */
export async function generateOpenAPISpec(): Promise<object> {
  const generator = createOpenAPIGenerator();

  const spec = await generator.generate(appRouter, {
    info: API_INFO,
    servers: [
      {
        url: 'http://localhost:3001/api',
        description: 'Local development',
      },
      {
        url: 'https://chat-api.babylon.game/api',
        description: 'Production',
      },
    ],
    tags: API_TAGS,
    security: [
      {
        bearerAuth: [],
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Privy access token',
        },
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'privy-token',
          description: 'Privy token cookie (auto-set by SDK)',
        },
      },
    },
  });

  return spec;
}

/**
 * Get cached OpenAPI spec (generates once, caches result)
 */
let cachedSpec: object | null = null;

export async function getOpenAPISpec(): Promise<object> {
  if (!cachedSpec) {
    cachedSpec = await generateOpenAPISpec();
  }
  return cachedSpec;
}

/**
 * Clear cached spec (useful for development)
 */
export function clearOpenAPICache(): void {
  cachedSpec = null;
}
