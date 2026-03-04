/**
 * Swagger/OpenAPI Utilities
 *
 * @deprecated The old JSDoc-based swagger system has been replaced by
 * zod-openapi in packages/api/src/openapi/. Use `bun run generate:api`
 * to regenerate the OpenAPI spec and client hooks.
 *
 * Remaining exports are kept for backward compatibility only.
 */

export { swaggerDefinition } from './config';
export type { OpenAPIParameter, OpenAPIResponse, OpenAPIRoute } from './types';
