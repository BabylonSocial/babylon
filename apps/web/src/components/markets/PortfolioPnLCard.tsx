import { formatCurrency as formatCurrencyShared } from '@babylon/shared';
import { Share2, Sparkles } from 'lucide-react';
import type { PortfolioBreakdownSnapshot } from '@/hooks/usePortfolioPnL';

/**
 * Portfolio PnL card component for displaying overall portfolio summary.
 *
 * Displays total account equity and available balance for the user's portfolio.
 * Includes share functionality and buy points button. Shows loading and error
 * states.
 *
 * Features:
 * - Total account equity display
 * - Available balance display
 * - Share functionality
 * - Buy points button
 * - Loading states
 * - Error handling
 *
 * @param props - PortfolioPnLCard component props
 * @returns Portfolio PnL card element
 *
 * @example
 * ```tsx
 * <PortfolioPnLCard
 *   data={portfolioData}
 *   loading={false}
 *   onShare={() => sharePortfolio()}
 *   setShowBuyPointsModal={setShowBuyPoints}
 * />
 * ```
 */
interface PortfolioPnLCardProps {
  data: PortfolioBreakdownSnapshot | null;
  loading: boolean;
  error: string | null;
  onShare: () => void;
  setShowBuyPointsModal: (show: boolean) => void;
}

/**
 * Format currency value safely.
 *
 * Formats a number as Babylon points, defaulting to 0 if invalid.
 * Uses shared formatCurrency utility for consistency across the codebase.
 *
 * @param value - Value to format
 * @returns Formatted currency string
 */
function formatCurrency(value: number | null | undefined) {
  const safeValue =
    typeof value === 'number' && Number.isFinite(value) ? value : 0;
  return formatCurrencyShared(safeValue, { useThousandsSeparator: true });
}

export function PortfolioPnLCard({
  data,
  loading,
  error,
  onShare,
  setShowBuyPointsModal,
}: PortfolioPnLCardProps) {
  return (
    <>
      <div className="mb-2 flex items-center justify-between gap-3">
        <h2 className="font-semibold text-md text-muted-foreground uppercase tracking-wide">
          Your Portfolio
        </h2>
        <div className="flex items-center gap-3">
          {/* <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center justify-center rounded-lg border border-white/10 bg-white/10 p-2 text-foreground backdrop-blur transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="Refresh portfolio P&L"
          >
            <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button> */}
          <button
            type="button"
            onClick={onShare}
            disabled={loading || !data}
            className="inline-flex items-center gap-3 rounded-lg bg-white/90 px-3 py-3 font-semibold text-[#0B1C3D] text-sm shadow transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Share2 className="h-4 w-4" />
            Share P&amp;L
          </button>
          <button
            onClick={() => setShowBuyPointsModal(true)}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-yellow-500 to-amber-600 px-4 py-2.5 font-medium text-primary-foreground shadow-md transition-all hover:from-yellow-600 hover:to-amber-700 hover:shadow-lg"
          >
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">Buy Points</span>
          </button>
        </div>
      </div>
      <section className="mt-4 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-purple-500/10 to-primary/5 px-4 py-3 shadow-sm sm:px-5 sm:py-4">
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4">
              <div className="h-3 w-24 animate-pulse rounded bg-white/40" />
              <div className="mt-2 h-9 w-32 animate-pulse rounded bg-white/60" />
            </div>
            <div className="p-4">
              <div className="h-3 w-32 animate-pulse rounded bg-white/40" />
              <div className="mt-2 h-9 w-32 animate-pulse rounded bg-white/60" />
            </div>
          </div>
        ) : error ? (
          <div className="mt-6 rounded-lg bg-white/10 px-4 py-3 text-foreground/80 text-sm">
            <p className="font-medium text-foreground">
              Unable to load portfolio
            </p>
            <p className="mt-1 text-foreground/80">{error}</p>
          </div>
        ) : (
          data && (
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4">
                <dt className="text-foreground/70 text-xs uppercase">
                  Total Points
                </dt>
                <dd className="mt-2 font-bold text-3xl text-foreground">
                  {formatCurrency(data.totalAssets)}
                </dd>
              </div>
              <div className="p-4">
                <dt className="text-foreground/70 text-xs uppercase">
                  Available to Invest
                </dt>
                <dd className="mt-2 font-bold text-3xl text-foreground">
                  {formatCurrency(data.wallet)}
                </dd>
              </div>
            </div>
          )
        )}
      </section>
    </>
  );
}
