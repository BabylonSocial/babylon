#!/usr/bin/env bun

/**
 * Audit agent wallet readiness against the canonical Privy-backed model.
 *
 * Usage:
 *   bun run scripts/audit-agent-wallet-readiness.ts
 *   bun run scripts/audit-agent-wallet-readiness.ts --agent=<agentUserId>
 *   bun run scripts/audit-agent-wallet-readiness.ts --include-ready --limit=500
 *   bun run scripts/audit-agent-wallet-readiness.ts --json
 */

import { and, desc, eq } from '@babylon/db';
import { closeDatabase, db, users } from '@babylon/db/runtime';
import {
  type AgentWalletStateClassification,
  assessAgentWalletState,
} from '../packages/agents/src/identity/agent-wallet-state';

type CliOptions = {
  agentId: string | null;
  includeReady: boolean;
  json: boolean;
  limit: number;
};

type AgentWalletAuditRow = {
  id: string;
  username: string | null;
  displayName: string | null;
  managedBy: string | null;
  privyId: string | null;
  privyWalletId: string | null;
  walletAddress: string | null;
  offlineWalletReady: boolean;
  offlineWalletReadyAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

function parseArgs(): CliOptions {
  const args = process.argv.slice(2);
  const findArg = (prefix: string): string | null =>
    args.find((arg) => arg.startsWith(prefix))?.slice(prefix.length) ?? null;

  const limitRaw = findArg('--limit=');
  const parsedLimit = limitRaw ? Number.parseInt(limitRaw, 10) : 100;
  const limit =
    Number.isFinite(parsedLimit) && parsedLimit > 0
      ? Math.min(parsedLimit, 5000)
      : 100;

  return {
    agentId: findArg('--agent='),
    includeReady: args.includes('--include-ready'),
    json: args.includes('--json'),
    limit,
  };
}

function incrementCount(
  counts: Record<AgentWalletStateClassification, number>,
  key: AgentWalletStateClassification
): void {
  counts[key] += 1;
}

async function main(): Promise<void> {
  const options = parseArgs();

  const baseSelect = {
    id: users.id,
    username: users.username,
    displayName: users.displayName,
    managedBy: users.managedBy,
    privyId: users.privyId,
    privyWalletId: users.privyWalletId,
    walletAddress: users.walletAddress,
    offlineWalletReady: users.offlineWalletReady,
    offlineWalletReadyAt: users.offlineWalletReadyAt,
    createdAt: users.createdAt,
    updatedAt: users.updatedAt,
  };

  const rows = options.agentId
    ? ((await db
        .select(baseSelect)
        .from(users)
        .where(and(eq(users.id, options.agentId!), eq(users.isAgent, true)))
        .limit(1)) as AgentWalletAuditRow[])
    : ((await db
        .select(baseSelect)
        .from(users)
        .where(eq(users.isAgent, true))
        .orderBy(desc(users.createdAt))
        .limit(options.limit)) as AgentWalletAuditRow[]);

  const assessed = rows.map((row) => {
    const assessment = assessAgentWalletState(row);
    return {
      ...row,
      assessment,
    };
  });

  const counts: Record<AgentWalletStateClassification, number> = {
    ready: 0,
    empty: 0,
    recover_with_existing_privy_user: 0,
    offline_signer_missing: 0,
    recreate_privy_user: 0,
    inconsistent_partial_state: 0,
  };

  for (const row of assessed) {
    incrementCount(counts, row.assessment.classification);
  }

  const rowsToDisplay = options.includeReady
    ? assessed
    : assessed.filter((row) => !row.assessment.isReady);

  if (options.json) {
    console.log(
      JSON.stringify(
        {
          totalAgentsScanned: assessed.length,
          displayedAgents: rowsToDisplay.length,
          counts,
          agents: rowsToDisplay.map((row) => ({
            id: row.id,
            username: row.username,
            displayName: row.displayName,
            managedBy: row.managedBy,
            privyId: row.privyId,
            privyWalletId: row.privyWalletId,
            walletAddress: row.walletAddress,
            offlineWalletReady: row.offlineWalletReady,
            offlineWalletReadyAt:
              row.offlineWalletReadyAt?.toISOString() ?? null,
            createdAt: row.createdAt.toISOString(),
            updatedAt: row.updatedAt.toISOString(),
            classification: row.assessment.classification,
            remediationAction: row.assessment.remediationAction,
            reasons: row.assessment.reasons,
          })),
        },
        null,
        2
      )
    );
    await closeDatabase();
    return;
  }

  console.log('Agent wallet readiness audit');
  console.log(`- Agents scanned: ${assessed.length}`);
  console.log(`- Showing: ${rowsToDisplay.length}`);
  console.log(`- includeReady: ${options.includeReady ? 'yes' : 'no'}`);
  console.log(`- limit: ${options.limit}`);
  if (options.agentId) {
    console.log(`- agent filter: ${options.agentId}`);
  }

  console.log('\nClassification counts:');
  for (const [classification, count] of Object.entries(counts)) {
    console.log(`- ${classification}: ${count}`);
  }

  if (rowsToDisplay.length === 0) {
    console.log('\nNo matching agents found.');
    await closeDatabase();
    return;
  }

  console.log('\nAgents:');
  for (const row of rowsToDisplay) {
    console.log(
      [
        `id=${row.id}`,
        `username=${row.username ?? 'null'}`,
        `displayName=${row.displayName ?? 'null'}`,
        `managedBy=${row.managedBy ?? 'null'}`,
        `classification=${row.assessment.classification}`,
        `action=${row.assessment.remediationAction}`,
        `privyId=${row.privyId ?? 'null'}`,
        `walletId=${row.privyWalletId ?? 'null'}`,
        `walletAddress=${row.walletAddress ?? 'null'}`,
        `offlineReady=${String(row.offlineWalletReady)}`,
        `offlineReadyAt=${row.offlineWalletReadyAt?.toISOString() ?? 'null'}`,
        `reasons=${row.assessment.reasons.join('; ')}`,
      ].join(' | ')
    );
  }

  await closeDatabase();
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch(async (error) => {
    console.error('Agent wallet audit failed:', error);
    await closeDatabase();
    process.exit(1);
  });
