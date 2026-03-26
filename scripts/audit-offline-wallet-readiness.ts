import { and, count, desc, eq, isNotNull } from '@babylon/db';
import { db, users } from '@babylon/db/runtime';

function parseLimitArg(): number {
  const raw = process.argv[2]?.trim();
  if (!raw) return 100;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return 100;
  return Math.min(parsed, 1000);
}

async function main() {
  const limit = parseLimitArg();

  const [{ totalUsers = 0 }] = await db
    .select({ totalUsers: count() })
    .from(users)
    .where(isNotNull(users.privyId));

  const [{ readyUsers = 0 }] = await db
    .select({ readyUsers: count() })
    .from(users)
    .where(and(isNotNull(users.privyId), eq(users.offlineWalletReady, true)));

  const pending = await db
    .select({
      id: users.id,
      privyId: users.privyId,
      privyWalletId: users.privyWalletId,
      walletAddress: users.walletAddress,
      offlineWalletReady: users.offlineWalletReady,
      offlineWalletReadyAt: users.offlineWalletReadyAt,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })
    .from(users)
    .where(and(isNotNull(users.privyId), eq(users.offlineWalletReady, false)))
    .orderBy(desc(users.createdAt))
    .limit(limit);

  const pendingCount = Math.max(totalUsers - readyUsers, 0);
  const readinessPct =
    totalUsers > 0 ? ((readyUsers / totalUsers) * 100).toFixed(2) : '0.00';

  console.log('Offline wallet readiness audit');
  console.log(`- Total users with privyId: ${totalUsers}`);
  console.log(`- Ready users: ${readyUsers}`);
  console.log(`- Pending users: ${pendingCount}`);
  console.log(`- Readiness: ${readinessPct}%`);
  console.log(`- Showing up to ${limit} pending users`);

  if (pending.length === 0) {
    console.log('\nNo pending users found.');
    return;
  }

  console.log('\nPending users:');
  for (const user of pending) {
    console.log(
      [
        `id=${user.id}`,
        `privyId=${user.privyId}`,
        `walletId=${user.privyWalletId ?? 'null'}`,
        `walletAddress=${user.walletAddress ?? 'null'}`,
        `offlineWalletReady=${String(user.offlineWalletReady)}`,
        `offlineWalletReadyAt=${user.offlineWalletReadyAt?.toISOString() ?? 'null'}`,
        `createdAt=${user.createdAt.toISOString()}`,
        `updatedAt=${user.updatedAt.toISOString()}`,
      ].join(' | ')
    );
  }
}

main().catch((error) => {
  console.error('Audit failed:', error);
  process.exit(1);
});
