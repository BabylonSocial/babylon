#!/usr/bin/env bun
/**
 * Clean .env file
 *
 * Removes:
 * - Completely unused variables
 * - Optional variables that have defaults in config
 * - Duplicate entries (keeps last value)
 * - Orphaned comments and empty sections
 *
 * Usage:
 *   bun run scripts/clean-env.ts .env > .env.clean
 *   # Review .env.clean, then: mv .env.clean .env
 */

import { readFileSync } from 'fs';

// =============================================================================
// Configuration
// =============================================================================

/** Variables that are completely unused in the codebase - DELETE */
const UNUSED_VARS = new Set([
  'TRAIN_RL_LOCAL',
  'FORCE_LOCAL_TRAINING',
  'WANDB_API_KEY',
  'WANDB_ENTITY',
  'WANDB_PROJECT',
  'X_API_KEY',
  'X_API_KEY_SECRET',
  'SEPOLIA_RPC_URL', // Only BASE_SEPOLIA_RPC_URL is used
]);

/** Variables that have defaults and don't need to be in .env unless overriding */
const OPTIONAL_VARS = new Set([
  // Game speed - defaults in engine
  'GAME_SPEED_DEFAULT',
  'GAME_SPEED_MIN',
  'GAME_SPEED_MAX',
  // Oracle - defaults in oracle-service
  'ORACLE_GAS_MULTIPLIER',
  'ORACLE_MAX_GAS_PRICE',
  'ORACLE_CONFIRMATIONS',
  // RL Training - defaults in training package
  'TRAINING_MIN_TRAJECTORIES',
  'TRAINING_MIN_GROUP_SIZE',
  'GAME_TICK_BUDGET_MS',
  'BASE_MODEL',
  'USE_RL_MODEL',
  'RL_FALLBACK_TO_BASE',
  'RECORD_AGENT_TRAJECTORIES',
  // Agent - defaults in agent packages
  'AGENT_AUTO_TRADE',
  'AUTO_CREATE_AGENT_WALLETS',
  'AGENT0_ENABLED',
  'AGENT0_NETWORK',
  // Logging
  'LOG_LEVEL',
]);

/** Contract addresses that are now in public-config.json */
const CONFIG_CONTRACT_VARS = new Set([
  // These are in public-config.json - only keep if you need to override
  'NEXT_PUBLIC_BABYLON_ORACLE',
  'NEXT_PUBLIC_PREDIMARKET',
  'NEXT_PUBLIC_MARKET_FACTORY',
  'NEXT_PUBLIC_CONTEST_ORACLE',
  'NEXT_PUBLIC_TEST_TOKEN',
  'NEXT_PUBLIC_BAN_MANAGER',
  'NEXT_PUBLIC_REPORTING_SYSTEM',
  'NEXT_PUBLIC_LABEL_MANAGER',
]);

// =============================================================================
// Parser
// =============================================================================

interface EnvEntry {
  key: string;
  value: string;
  line: string;
  isComment: boolean;
  isEmpty: boolean;
  isVariable: boolean;
}

function parseEnvLine(line: string): EnvEntry {
  const trimmed = line.trim();

  if (trimmed === '') {
    return { key: '', value: '', line, isComment: false, isEmpty: true, isVariable: false };
  }

  if (trimmed.startsWith('#')) {
    return { key: '', value: '', line, isComment: true, isEmpty: false, isVariable: false };
  }

  const eqIndex = line.indexOf('=');
  if (eqIndex === -1) {
    return { key: '', value: '', line, isComment: false, isEmpty: false, isVariable: false };
  }

  const key = line.substring(0, eqIndex).trim();
  let value = line.substring(eqIndex + 1);

  // Remove quotes if present
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }

  return { key, value, line, isComment: false, isEmpty: false, isVariable: true };
}

// =============================================================================
// Cleaner
// =============================================================================

interface CleanResult {
  output: string;
  removed: { key: string; reason: string }[];
  duplicates: { key: string; kept: string; removed: string[] }[];
}

function cleanEnv(content: string, options: { removeOptional: boolean }): CleanResult {
  const lines = content.split('\n');
  const entries = lines.map(parseEnvLine);
  const removed: { key: string; reason: string }[] = [];

  // Track duplicates
  const varOccurrences = new Map<string, number[]>();
  entries.forEach((entry, idx) => {
    if (entry.isVariable && entry.key) {
      const indices = varOccurrences.get(entry.key) || [];
      indices.push(idx);
      varOccurrences.set(entry.key, indices);
    }
  });

  // Build duplicate report
  const duplicates: { key: string; kept: string; removed: string[] }[] = [];
  for (const [key, indices] of varOccurrences) {
    if (indices.length > 1) {
      const values = indices.map((i) => entries[i].value);
      duplicates.push({
        key,
        kept: values[values.length - 1],
        removed: values.slice(0, -1),
      });
    }
  }

  // Determine which lines to keep
  const keepLine = new Array(entries.length).fill(false);
  const seenVars = new Set<string>();

  // Process in reverse to keep last occurrence of each variable
  for (let i = entries.length - 1; i >= 0; i--) {
    const entry = entries[i];

    if (entry.isVariable && entry.key) {
      // Check if should be removed
      if (UNUSED_VARS.has(entry.key)) {
        removed.push({ key: entry.key, reason: 'unused' });
        continue;
      }
      if (options.removeOptional && OPTIONAL_VARS.has(entry.key)) {
        removed.push({ key: entry.key, reason: 'optional (has default)' });
        continue;
      }
      if (CONFIG_CONTRACT_VARS.has(entry.key)) {
        removed.push({ key: entry.key, reason: 'in public-config.json' });
        continue;
      }

      // Skip duplicates (already seen = not the last occurrence)
      if (seenVars.has(entry.key)) {
        continue;
      }

      seenVars.add(entry.key);
      keepLine[i] = true;
    }
  }

  // Forward pass: keep comments that are immediately before a kept variable
  for (let i = 0; i < entries.length; i++) {
    if (keepLine[i]) continue;

    const entry = entries[i];

    // Keep section headers if followed by content
    if (entry.isComment) {
      const trimmed = entry.line.trim();
      const isSectionHeader =
        trimmed.includes('===') || trimmed.includes('---') || trimmed.includes('Configuration');

      // Look ahead for kept variables
      let hasKeptVar = false;

      for (let j = i + 1; j < entries.length; j++) {
        const next = entries[j];

        // Found another section header
        if (
          next.isComment &&
          (next.line.includes('===') || next.line.includes('Configuration'))
        ) {
          break;
        }

        // Found a kept variable
        if (keepLine[j]) {
          hasKeptVar = true;
          break;
        }
      }

      // Keep this section header if it has content
      if (isSectionHeader && hasKeptVar) {
        keepLine[i] = true;
      }

      // Keep inline comments describing the next variable (1-2 lines before)
      if (!isSectionHeader) {
        for (let j = i + 1; j < Math.min(i + 3, entries.length); j++) {
          if (entries[j].isEmpty) continue;
          if (keepLine[j]) {
            keepLine[i] = true;
            break;
          }
          if (entries[j].isVariable || entries[j].isComment) break;
        }
      }
    }
  }

  // Build output
  const outputLines: string[] = [];
  let prevWasEmpty = true; // Start as true to skip leading empty lines

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];

    if (!keepLine[i]) {
      // Keep single empty line between sections
      if (entry.isEmpty && outputLines.length > 0 && !prevWasEmpty) {
        // Check if next kept line exists
        let hasNextKept = false;
        for (let j = i + 1; j < entries.length; j++) {
          if (keepLine[j]) {
            hasNextKept = true;
            break;
          }
        }
        if (hasNextKept) {
          outputLines.push('');
          prevWasEmpty = true;
        }
      }
      continue;
    }

    // Skip consecutive empty lines
    if (entry.isEmpty) {
      if (!prevWasEmpty) {
        outputLines.push(entry.line);
        prevWasEmpty = true;
      }
      continue;
    }

    outputLines.push(entry.line);
    prevWasEmpty = entry.isEmpty;
  }

  // Remove trailing empty lines
  while (outputLines.length > 0 && outputLines[outputLines.length - 1].trim() === '') {
    outputLines.pop();
  }

  return {
    output: outputLines.join('\n') + '\n',
    removed,
    duplicates,
  };
}

// =============================================================================
// Main
// =============================================================================

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
Usage: bun run scripts/clean-env.ts [options] <env-file>

Options:
  --keep-optional    Keep optional vars (those with defaults)
  --report-only      Only show what would be removed, don't output cleaned file
  -h, --help         Show this help

Examples:
  bun run scripts/clean-env.ts .env > .env.clean
  bun run scripts/clean-env.ts --report-only .env
  bun run scripts/clean-env.ts --keep-optional .env > .env.clean
`);
    process.exit(0);
  }

  const keepOptional = args.includes('--keep-optional');
  const reportOnly = args.includes('--report-only');
  const envFile = args.find((a) => !a.startsWith('-'));

  if (!envFile) {
    console.error('Error: No .env file specified');
    process.exit(1);
  }

  let content: string;
  try {
    content = readFileSync(envFile, 'utf-8');
  } catch (err) {
    console.error(`Error reading ${envFile}:`, err);
    process.exit(1);
  }

  const result = cleanEnv(content, { removeOptional: !keepOptional });

  if (reportOnly) {
    console.log('=== Clean .env Report ===\n');

    if (result.duplicates.length > 0) {
      console.log('📋 DUPLICATES (keeping last value):');
      for (const dup of result.duplicates) {
        console.log(`  ${dup.key}:`);
        console.log(`    Kept: ${dup.kept.substring(0, 50)}${dup.kept.length > 50 ? '...' : ''}`);
        console.log(`    Removed ${dup.removed.length} duplicate(s)`);
      }
      console.log();
    }

    if (result.removed.length > 0) {
      console.log('🗑️  REMOVED:');
      const byReason = new Map<string, string[]>();
      for (const r of result.removed) {
        const list = byReason.get(r.reason) || [];
        list.push(r.key);
        byReason.set(r.reason, list);
      }
      for (const [reason, keys] of byReason) {
        console.log(`  ${reason}:`);
        for (const key of keys) {
          console.log(`    - ${key}`);
        }
      }
      console.log();
    }

    console.log(
      `Summary: ${result.duplicates.length} duplicates resolved, ${result.removed.length} vars removed`
    );
  } else {
    // Output cleaned file to stdout
    process.stdout.write(result.output);

    // Output report to stderr so it doesn't interfere with redirect
    console.error('\n=== Clean .env Summary ===');
    console.error(`Duplicates resolved: ${result.duplicates.length}`);
    console.error(`Variables removed: ${result.removed.length}`);
    if (result.removed.length > 0) {
      console.error('\nRemoved:');
      for (const r of result.removed) {
        console.error(`  - ${r.key} (${r.reason})`);
      }
    }
  }
}

main();
