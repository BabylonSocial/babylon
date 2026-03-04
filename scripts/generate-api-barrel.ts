/**
 * Generates the barrel export (index.ts) for packages/api-hooks/src/generated/
 * by scanning for all generated domain directories.
 *
 * This runs after Orval to ensure the barrel export includes all generated domains.
 */

import { readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const generatedDir = resolve(
  import.meta.dirname,
  '..',
  'packages/api-hooks/src/generated'
);

const entries = readdirSync(generatedDir)
  .filter((entry) => {
    if (entry === 'model' || entry === 'index.ts') return false;
    const fullPath = join(generatedDir, entry);
    return statSync(fullPath).isDirectory();
  })
  .sort();

const lines = [
  '// Auto-generated barrel export — do not edit manually.',
  '// Re-run `bun run generate:api` to regenerate.',
  '',
  "export * from './model';",
  ...entries.map((dir) => `export * from './${dir}/${dir}';`),
  '',
];

const outputPath = join(generatedDir, 'index.ts');
writeFileSync(outputPath, lines.join('\n'), 'utf-8');

console.log(`Generated barrel export with ${entries.length} domain modules`);
