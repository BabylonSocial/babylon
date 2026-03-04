/**
 * OpenAPI Specification Generator
 *
 * Generates openapi.json from Zod schemas defined in packages/api/src/openapi/paths/.
 * Uses zod-openapi's createDocument() with Zod v4 native .meta() support.
 *
 * Usage: bun run scripts/generate-openapi.ts
 */

import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createDocument } from 'zod-openapi';
import {
  adminPaths,
  agentPaths,
  chatPaths,
  feedPaths,
  marketPaths,
  miscPaths,
  postPaths,
  profilePaths,
  socialPaths,
  systemPaths,
  userPaths,
} from '../packages/api/src/openapi/paths';

const spec = createDocument({
  openapi: '3.1.0',
  info: {
    title: 'Babylon API',
    version: '1.0.0',
    description: 'API for the Babylon prediction market and social platform.',
    contact: {
      name: 'API Support',
      url: 'https://github.com/BabylonSocial/babylon',
    },
  },
  servers: [
    {
      url: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
      description: 'Development server',
    },
    {
      url: 'https://babylon.market',
      description: 'Production server',
    },
  ],
  components: {
    securitySchemes: {
      PrivyAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Privy authentication JWT token',
      },
    },
  },
  paths: {
    ...systemPaths,
    ...userPaths,
    ...profilePaths,
    ...agentPaths,
    ...postPaths,
    ...chatPaths,
    ...feedPaths,
    ...socialPaths,
    ...miscPaths,
    ...marketPaths,
    ...adminPaths,
  },
});

const outputPath = resolve(import.meta.dirname, '..', 'openapi.json');
const content = JSON.stringify(spec, null, 2);
writeFileSync(outputPath, content, 'utf-8');

const pathCount = Object.keys(spec.paths ?? {}).length;
const schemaCount = Object.keys(spec.components?.schemas ?? {}).length;
console.log(`Generated ${outputPath}`);
console.log(`  ${pathCount} paths, ${schemaCount} component schemas`);
