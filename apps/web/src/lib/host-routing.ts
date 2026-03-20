const DEFAULT_WAITLIST_HOSTS = [
  'babylon.market',
  'www.babylon.market',
  'staging.babylon.market',
  'www.staging.babylon.market',
] as const;

const LEGACY_CANONICAL_HOSTS = {
  'babylon.social': {
    waitlist: 'babylon.market',
    app: 'play.babylon.market',
  },
  'www.babylon.social': {
    waitlist: 'babylon.market',
    app: 'play.babylon.market',
  },
} as const;

export type CanonicalHostTarget = 'waitlist' | 'app';

const LEGACY_WAITLIST_PATHS = new Set(['/', '/share']);

function normalizeHostname(hostname: string): string {
  return hostname.trim().toLowerCase();
}

export function isAssetRequest(pathname: string): boolean {
  return (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/assets') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/fonts') ||
    pathname.startsWith('/.well-known') ||
    pathname.startsWith('/_vercel') ||
    pathname.startsWith('/monitoring') ||
    /\.[^/]+$/.test(pathname)
  );
}

export function getWaitlistHostnames(): Set<string> {
  const raw = process.env.WAITLIST_HOSTNAMES;
  if (!raw || raw.trim().length === 0) return new Set(DEFAULT_WAITLIST_HOSTS);

  return new Set(
    raw
      .split(',')
      .map(normalizeHostname)
      .filter((h) => h.length > 0)
  );
}

export function isWaitlistHostname(hostname: string): boolean {
  return getWaitlistHostnames().has(normalizeHostname(hostname));
}

export function isWaitlistHomePage(hostname: string, pathname: string): boolean {
  return isWaitlistHostname(hostname) && pathname === '/';
}

export function isLegacyCanonicalHostname(hostname: string): boolean {
  return normalizeHostname(hostname) in LEGACY_CANONICAL_HOSTS;
}

export function getLegacyCanonicalOrigin(
  hostname: string,
  protocol: string,
  target: CanonicalHostTarget
): string | null {
  const legacyHost =
    LEGACY_CANONICAL_HOSTS[
      normalizeHostname(hostname) as keyof typeof LEGACY_CANONICAL_HOSTS
    ];
  if (!legacyHost) return null;

  return `${protocol}//${legacyHost[target]}`;
}

export function getLegacyCanonicalTargetForPath(
  pathname: string
): CanonicalHostTarget {
  if (LEGACY_WAITLIST_PATHS.has(pathname)) return 'waitlist';
  if (pathname.startsWith('/share/')) return 'waitlist';
  if (isAssetRequest(pathname)) return 'waitlist';

  return 'app';
}
