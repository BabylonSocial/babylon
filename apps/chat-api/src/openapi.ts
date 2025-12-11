/**
 * OpenAPI Specification Generator for Chat API
 *
 * Generates OpenAPI 3.1 spec from oRPC router definitions.
 * Uses @orpc/openapi with Zod schema conversion.
 */

import { OpenAPIGenerator } from '@orpc/openapi';
import { ZodToJsonSchemaConverter } from '@orpc/zod';
import { appRouter } from './routers';

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
  `.trim(),
  contact: {
    name: 'Babylon Support',
    url: 'https://babylon.game',
  },
};

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
        url: 'http://localhost:3001',
        description: 'Local development',
      },
      {
        url: 'https://chat-api.babylon.game',
        description: 'Production',
      },
    ],
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
