#!/usr/bin/env bun

import { and, desc, eq } from '@babylon/db';
import { agentLogs, closeDatabase, db, users } from '@babylon/db/runtime';
import { v4 as uuidv4 } from 'uuid';
import {
  type AgentWalletStateClassification,
  assessAgentWalletState,
} from '../packages/agents/src/identity/agent-wallet-state';
import {
  isPrivyNotFoundError,
  provisionAgentPrivyWallet,
} from '../packages/api/src/services/privy/agent-wallet-provisioning';
import { assertPrivyOfflineConfig } from '../packages/api/src/services/privy/offline-config';

/**
 * Remediate agent wallet state into the canonical Privy-backed offline-ready model.
 *
 * Safe by default:
 * - no writes unless `--apply` is provided
 * - supports targeting a single agent or a classification bucket
 *
 * Usage:
 *   bun run scripts/remediate-agent-wallets.ts
 *   bun run scripts/remediate-agent-wallets.ts --classification=recreate_privy_user
 *   bun run scripts/remediate-agent-wallets.ts --agent=<agentUserId> --apply
 *   bun run scripts/remediate-agent-wallets.ts --apply --limit=50
 */

type CliOptions = {
  agentId: string | null;
  apply: boolean;
  classification: AgentWalletStateClassification | null;
  json: boolean;
  limit: number;
};

type AgentWalletRow = {
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

type RemediationSummary = {
  scanned: number;
  matched: number;
  readySkipped: number;
  dryRunPlanned: number;
  remediated: number;
  manualReview: number;
  failed: number;
};

const VALID_CLASSIFICATIONS: AgentWalletStateClassification[] = [
  'ready',
  'empty',
  'recover_with_existing_privy_user',
  'recreate_privy_user',
  'inconsistent_partial_state',
];

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

  const classificationRaw = findArg('--classification=');
  if (
    classificationRaw &&
    !VALID_CLASSIFICATIONS.includes(
      classificationRaw as AgentWalletStateClassification
    )
  ) {
    throw new Error(
      `Invalid --classification value "${classificationRaw}". Expected one of: ${VALID_CLASSIFICATIONS.join(', ')}`
    );
  }

  return {
    agentId: findArg('--agent='),
    apply: args.includes('--apply'),
    classification:
      (classificationRaw as AgentWalletStateClassification | null) ?? null,
    json: args.includes('--json'),
    limit,
  };
}

function formatPlannedAction(
  action: ReturnType<typeof assessAgentWalletState>['remediationAction']
): string {
  switch (action) {
    case 'none':
      return 'skip';
    case 'provision_with_existing_privy_user':
      return 'provision existing Privy user';
    case 'provision_with_new_privy_user':
      return 'provision new Privy user';
    case 'manual_review':
      return 'manual review';
  }
}

async function main(): Promise<void> {
  const options = parseArgs();
  if (options.apply) {
    assertPrivyOfflineConfig();
  }

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
        .limit(1)) as AgentWalletRow[])
    : ((await db
        .select(baseSelect)
        .from(users)
        .where(eq(users.isAgent, true))
        .orderBy(desc(users.createdAt))
        .limit(options.limit)) as AgentWalletRow[]);

  const scopedRows = rows.filter((row) => {
    if (options.agentId && row.id !== options.agentId) return false;
    const assessment = assessAgentWalletState(row);
    if (
      options.classification &&
      assessment.classification !== options.classification
    ) {
      return false;
    }
    return true;
  });

  const summary: RemediationSummary = {
    scanned: rows.length,
    matched: scopedRows.length,
    readySkipped: 0,
    dryRunPlanned: 0,
    remediated: 0,
    manualReview: 0,
    failed: 0,
  };

  const reportRows: Array<Record<string, unknown>> = [];

  console.log('Agent wallet remediation');
  console.log(`- Scanned agents: ${summary.scanned}`);
  console.log(`- Matching scope: ${summary.matched}`);
  console.log(`- Apply changes: ${options.apply ? 'yes' : 'no (dry-run)'}`);
  if (options.agentId) console.log(`- agent filter: ${options.agentId}`);
  if (options.classification) {
    console.log(`- classification filter: ${options.classification}`);
  }
  console.log(`- limit: ${options.limit}`);

  for (const row of scopedRows) {
    const assessment = assessAgentWalletState(row);

    if (assessment.isReady) {
      summary.readySkipped += 1;
    }

    const reportRow = {
      id: row.id,
      username: row.username,
      classification: assessment.classification,
      remediationAction: assessment.remediationAction,
      privyId: row.privyId,
      privyWalletId: row.privyWalletId,
      walletAddress: row.walletAddress,
      reasons: assessment.reasons,
    };

    if (assessment.remediationAction === 'none') {
      reportRows.push({
        ...reportRow,
        outcome: 'skipped_ready',
      });
      continue;
    }

    if (assessment.remediationAction === 'manual_review') {
      summary.manualReview += 1;
      reportRows.push({
        ...reportRow,
        outcome: 'manual_review',
      });
      continue;
    }

    if (!options.apply) {
      summary.dryRunPlanned += 1;
      reportRows.push({
        ...reportRow,
        outcome: 'dry_run',
        plannedAction: formatPlannedAction(assessment.remediationAction),
      });
      continue;
    }

    try {
      const preferredExistingPrivyId =
        assessment.remediationAction === 'provision_with_existing_privy_user'
          ? row.privyId
          : null;

      let fallbackToNewPrivyUser = false;
      let provisioned;

      try {
        provisioned = await provisionAgentPrivyWallet({
          agentUserId: row.id,
          existingPrivyId: preferredExistingPrivyId,
        });
      } catch (error) {
        if (!preferredExistingPrivyId || !isPrivyNotFoundError(error)) {
          throw error;
        }

        fallbackToNewPrivyUser = true;
        provisioned = await provisionAgentPrivyWallet({
          agentUserId: row.id,
          existingPrivyId: null,
        });
      }
      const remediationAt = new Date();

      await db.transaction(async (tx) => {
        await tx
          .update(users)
          .set({
            privyId: provisioned.privyId,
            privyWalletId: provisioned.privyWalletId,
            walletAddress: provisioned.walletAddress,
            offlineWalletReady: true,
            offlineWalletReadyAt: remediationAt,
            updatedAt: remediationAt,
          })
          .where(eq(users.id, row.id));

        await tx.insert(agentLogs).values({
          id: uuidv4(),
          agentUserId: row.id,
          type: 'system',
          level: 'info',
          message: `Agent wallet remediated: ${provisioned.walletAddress}`,
          metadata: {
            previousState: {
              privyId: row.privyId,
              privyWalletId: row.privyWalletId,
              walletAddress: row.walletAddress,
              offlineWalletReady: row.offlineWalletReady,
            },
            remediationClassification: assessment.classification,
            remediationAction: assessment.remediationAction,
            fallbackToNewPrivyUser,
            privyId: provisioned.privyId,
            privyWalletId: provisioned.privyWalletId,
            walletAddress: provisioned.walletAddress,
            createdPrivyUser: provisioned.createdPrivyUser,
            createdWallet: provisioned.createdWallet,
            updatedSigner: provisioned.updatedSigner,
            remediatedAt: remediationAt.toISOString(),
          },
        });
      });

      summary.remediated += 1;
      reportRows.push({
        ...reportRow,
        outcome: 'remediated',
        fallbackToNewPrivyUser,
        newPrivyId: provisioned.privyId,
        newPrivyWalletId: provisioned.privyWalletId,
        newWalletAddress: provisioned.walletAddress,
      });
    } catch (error) {
      summary.failed += 1;
      reportRows.push({
        ...reportRow,
        outcome: 'failed',
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  if (options.json) {
    console.log(JSON.stringify({ summary, results: reportRows }, null, 2));
    await closeDatabase();
    return;
  }

  console.log('\nSummary:');
  console.log(`- Ready skipped: ${summary.readySkipped}`);
  console.log(`- Dry-run planned: ${summary.dryRunPlanned}`);
  console.log(`- Remediated: ${summary.remediated}`);
  console.log(`- Manual review: ${summary.manualReview}`);
  console.log(`- Failed: ${summary.failed}`);

  if (reportRows.length > 0) {
    console.log('\nResults:');
    for (const row of reportRows) {
      console.log(
        [
          `id=${String(row.id)}`,
          `username=${String(row.username ?? 'null')}`,
          `classification=${String(row.classification)}`,
          `action=${String(row.remediationAction)}`,
          `outcome=${String(row.outcome)}`,
          row.error ? `error=${String(row.error)}` : null,
          row.newWalletAddress
            ? `newWalletAddress=${String(row.newWalletAddress)}`
            : null,
        ]
          .filter(Boolean)
          .join(' | ')
      );
    }
  }

  if (!options.apply) {
    console.log('\nDry-run only. Re-run with --apply to persist changes.');
  }

  await closeDatabase();
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch(async (error) => {
    console.error('Agent wallet remediation failed:', error);
    await closeDatabase();
    process.exit(1);
  });
