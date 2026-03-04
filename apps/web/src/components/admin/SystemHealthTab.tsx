/**
 * System Health tab component for monitoring platform health.
 *
 * Displays real-time system health metrics including game engine status,
 * API latency, error rates, and recent errors. Auto-refreshes every
 * 30 seconds with visual status indicators.
 *
 * Features:
 * - Overall health status indicator
 * - Game engine status display
 * - LLM/API metrics (calls, latency, errors)
 * - Recent errors list
 * - Auto-refresh (30s interval)
 * - Manual refresh button
 * - Loading states
 *
 * @returns System health tab element
 */
'use client';

import { adminGetSystemHealth } from '@babylon/api-hooks';
import { cn } from '@babylon/shared';
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Clock,
  Cpu,
  RefreshCw,
  Server,
  Zap,
} from 'lucide-react';
import { useCallback, useEffect, useState, useTransition } from 'react';
import { Skeleton } from '@/components/shared/Skeleton';

type HealthStatus = 'healthy' | 'degraded' | 'critical';

interface SystemHealthData {
  status: HealthStatus;
  issues: string[];
  timestamp: string;
  gameEngine: {
    isRunning: boolean;
    currentDay: number;
    lastTickAt: string | null;
    timeSinceLastTickMs: number | null;
    tickIntervalMs: number;
    uptimeMs: number;
  };
  activityMetrics: {
    lastHour: {
      newUsers: number;
      newPosts: number;
    };
    last24Hours: {
      newUsers: number;
      newPosts: number;
    };
  };
  recentErrors: Array<{
    id: string;
    error: string;
    promptType: string;
    createdAt: string;
  }>;
}

export function SystemHealthTab() {
  const [data, setData] = useState<SystemHealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, startRefresh] = useTransition();
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchHealth = useCallback((showRefreshing = false) => {
    const fetchLogic = async () => {
      try {
        const result = await adminGetSystemHealth();
        setData(result as unknown as SystemHealthData);
        setLastUpdated(new Date());
      } catch {
        // Silently fail, leave data as null
      } finally {
        setLoading(false);
      }
    };

    if (showRefreshing) {
      startRefresh(fetchLogic);
    } else {
      void fetchLogic();
    }
  }, []);

  useEffect(() => {
    fetchHealth();
  }, [fetchHealth]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => fetchHealth(), 30000);
    return () => clearInterval(interval);
  }, [fetchHealth]);

  const formatUptime = (ms: number) => {
    const hours = Math.floor(ms / (60 * 60 * 1000));
    const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    }
    return `${hours}h ${minutes}m`;
  };

  const formatTimeSince = (ms: number | null) => {
    if (ms === null) return 'Never';
    if (ms < 60000) return `${Math.round(ms / 1000)}s ago`;
    if (ms < 3600000) return `${Math.round(ms / 60000)}m ago`;
    return `${Math.round(ms / 3600000)}h ago`;
  };

  const getStatusColor = (status: HealthStatus) => {
    switch (status) {
      case 'healthy':
        return 'text-green-500 bg-green-500/10 border-green-500/20';
      case 'degraded':
        return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      case 'critical':
        return 'text-red-500 bg-red-500/10 border-red-500/20';
    }
  };

  const getStatusIcon = (status: HealthStatus) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      case 'degraded':
        return <AlertTriangle className="h-6 w-6 text-yellow-500" />;
      case 'critical':
        return <AlertCircle className="h-6 w-6 text-red-500" />;
    }
  };

  const MetricCard = ({
    icon: Icon,
    label,
    value,
    subValue,
    status,
  }: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: string | number;
    subValue?: string;
    status?: 'good' | 'warning' | 'error';
  }) => (
    <div className="rounded-xl border border-border bg-card p-3 transition-shadow hover:shadow-md sm:p-5">
      <div className="mb-2 flex items-center justify-between sm:mb-3">
        <div className="rounded-lg bg-muted p-1.5 sm:p-2">
          <Icon className="h-4 w-4 text-muted-foreground sm:h-5 sm:w-5" />
        </div>
        {status && (
          <div
            className={cn(
              'h-2.5 w-2.5 rounded-full sm:h-3 sm:w-3',
              status === 'good' && 'bg-green-500',
              status === 'warning' && 'bg-yellow-500',
              status === 'error' && 'bg-red-500'
            )}
          />
        )}
      </div>
      <div className="font-bold text-lg sm:text-2xl">{value}</div>
      <div className="mt-0.5 text-muted-foreground text-xs sm:mt-1 sm:text-sm">
        {label}
      </div>
      {subValue && (
        <div className="mt-0.5 text-[10px] text-muted-foreground sm:mt-1 sm:text-xs">
          {subValue}
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <Skeleton className="h-20 sm:h-24" />
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 sm:h-32" />
          ))}
        </div>
        <Skeleton className="h-48 sm:h-64" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        <Server className="mx-auto mb-3 h-12 w-12 opacity-50" />
        <p>Failed to load system health data</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Status */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div
            className={cn('rounded-xl border p-4', getStatusColor(data.status))}
          >
            {getStatusIcon(data.status)}
          </div>
          <div>
            <h2 className="font-bold text-2xl capitalize">
              System {data.status}
            </h2>
            <p className="text-muted-foreground">
              {data.issues.length === 0
                ? 'All systems operational'
                : `${data.issues.length} issue${data.issues.length > 1 ? 's' : ''} detected`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-muted-foreground text-sm">
              Updated {formatTimeSince(Date.now() - lastUpdated.getTime())}
            </span>
          )}
          <button
            onClick={() => fetchHealth(true)}
            disabled={isRefreshing}
            className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2 font-medium text-sm transition-colors hover:bg-muted/80 disabled:opacity-50"
          >
            <RefreshCw
              className={cn('h-4 w-4', isRefreshing && 'animate-spin')}
            />
            Refresh
          </button>
        </div>
      </div>

      {/* Issues Banner */}
      {data.issues.length > 0 && (
        <div
          className={cn(
            'rounded-xl border p-4',
            data.status === 'critical'
              ? 'border-red-500/20 bg-red-500/10'
              : 'border-yellow-500/20 bg-yellow-500/10'
          )}
        >
          <div className="mb-2 flex items-center gap-2 font-semibold">
            <AlertTriangle
              className={cn(
                'h-5 w-5',
                data.status === 'critical' ? 'text-red-500' : 'text-yellow-500'
              )}
            />
            Active Issues
          </div>
          <ul className="space-y-1">
            {data.issues.map((issue, i) => (
              <li key={i} className="text-muted-foreground text-sm">
                • {issue}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Game Engine Status */}
      <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
        <h3 className="mb-3 flex items-center gap-2 font-semibold text-base sm:mb-4 sm:text-lg">
          <Zap className="h-4 w-4 text-yellow-500 sm:h-5 sm:w-5" />
          Game Engine
        </h3>
        <div className="grid grid-cols-2 gap-2 sm:gap-4 md:grid-cols-3 lg:grid-cols-5">
          <div className="rounded-lg bg-muted/50 p-2.5 sm:p-4">
            <div className="mb-0.5 text-[10px] text-muted-foreground sm:mb-1 sm:text-xs">
              Status
            </div>
            <div
              className={cn(
                'flex items-center gap-1.5 font-semibold text-sm sm:gap-2 sm:text-base',
                data.gameEngine.isRunning ? 'text-green-500' : 'text-yellow-500'
              )}
            >
              <div
                className={cn(
                  'h-1.5 w-1.5 rounded-full sm:h-2 sm:w-2',
                  data.gameEngine.isRunning
                    ? 'animate-pulse bg-green-500'
                    : 'bg-yellow-500'
                )}
              />
              {data.gameEngine.isRunning ? 'Running' : 'Paused'}
            </div>
          </div>
          <div className="rounded-lg bg-muted/50 p-2.5 sm:p-4">
            <div className="mb-0.5 text-[10px] text-muted-foreground sm:mb-1 sm:text-xs">
              Game Day
            </div>
            <div className="font-semibold text-sm sm:text-base">
              Day {data.gameEngine.currentDay}
            </div>
          </div>
          <div className="rounded-lg bg-muted/50 p-2.5 sm:p-4">
            <div className="mb-0.5 text-[10px] text-muted-foreground sm:mb-1 sm:text-xs">
              Last Tick
            </div>
            <div className="font-semibold text-sm sm:text-base">
              {formatTimeSince(data.gameEngine.timeSinceLastTickMs)}
            </div>
          </div>
          <div className="rounded-lg bg-muted/50 p-2.5 sm:p-4">
            <div className="mb-0.5 text-[10px] text-muted-foreground sm:mb-1 sm:text-xs">
              Tick Interval
            </div>
            <div className="font-semibold text-sm sm:text-base">
              {Math.round(data.gameEngine.tickIntervalMs / 1000)}s
            </div>
          </div>
          <div className="col-span-2 rounded-lg bg-muted/50 p-2.5 sm:p-4 md:col-span-1">
            <div className="mb-0.5 text-[10px] text-muted-foreground sm:mb-1 sm:text-xs">
              Uptime
            </div>
            <div className="font-semibold text-sm sm:text-base">
              {formatUptime(data.gameEngine.uptimeMs)}
            </div>
          </div>
        </div>
      </div>

      {/* Activity Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
        {/* Last Hour */}
        <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
          <h3 className="mb-3 flex items-center gap-2 font-semibold text-base sm:mb-4 sm:text-lg">
            <Clock className="h-4 w-4 text-blue-500 sm:h-5 sm:w-5" />
            Last Hour
          </h3>
          <div className="grid grid-cols-2 gap-2 sm:gap-4">
            <MetricCard
              icon={Activity}
              label="New Users"
              value={data.activityMetrics.lastHour.newUsers.toLocaleString()}
              status="good"
            />
            <MetricCard
              icon={Cpu}
              label="New Posts"
              value={data.activityMetrics.lastHour.newPosts.toLocaleString()}
              status="good"
            />
          </div>
        </div>

        {/* Last 24 Hours */}
        <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
          <h3 className="mb-3 flex items-center gap-2 font-semibold text-base sm:mb-4 sm:text-lg">
            <Clock className="h-4 w-4 text-purple-500 sm:h-5 sm:w-5" />
            Last 24 Hours
          </h3>
          <div className="grid grid-cols-2 gap-2 sm:gap-4">
            <MetricCard
              icon={Activity}
              label="New Users"
              value={data.activityMetrics.last24Hours.newUsers.toLocaleString()}
              status="good"
            />
            <MetricCard
              icon={Cpu}
              label="New Posts"
              value={data.activityMetrics.last24Hours.newPosts.toLocaleString()}
              status="good"
            />
          </div>
        </div>
      </div>

      {/* Recent Errors */}
      {data.recentErrors.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="mb-4 flex items-center gap-2 font-semibold text-lg">
            <AlertCircle className="h-5 w-5 text-red-500" />
            Recent Errors (Last Hour)
          </h3>
          <div className="space-y-2">
            {data.recentErrors.map((error) => (
              <div
                key={error.id}
                className="rounded-lg border border-red-500/10 bg-red-500/5 p-3"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="rounded bg-muted px-2 py-0.5 font-mono text-xs">
                        {error.promptType}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {new Date(error.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="truncate font-mono text-red-400 text-sm">
                      {error.error}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
