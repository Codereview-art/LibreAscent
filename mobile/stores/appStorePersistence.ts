import type { BlockingStats } from "@/types/blocking";
import type { AppState } from "./useAppStore";

export type PersistedAppState = Omit<AppState, "protection" | "stats"> & {
  stats: Pick<BlockingStats, "cleanSince" | "daysClean">;
};

/** Bumps the blocked counters for one blocked event. */
export function incrementBlockedStats(stats: BlockingStats): BlockingStats {
  return {
    ...stats,
    blockedToday: stats.blockedToday + 1,
    totalBlocked: stats.totalBlocked + 1,
    lastBlockedAt: new Date().toISOString(),
  };
}

/** Drops fields that change per blocked event, so dedupingAppStoreStorage can skip those writes. */
export function partializeAppState(state: AppState): PersistedAppState {
  const { protection: _protection, stats, ...rest } = state;
  return {
    ...rest,
    stats: { cleanSince: stats.cleanSince, daysClean: stats.daysClean },
  };
}

/** Restores the fields partializeAppState dropped from the fresh in-memory state. */
export function mergeAppState(
  persistedState: unknown,
  currentState: AppState,
): AppState {
  const persisted = persistedState as Partial<PersistedAppState> | undefined;
  return {
    ...currentState,
    ...persisted,
    stats: { ...currentState.stats, ...persisted?.stats },
  };
}

/** Whole days since cleanSince; the stored daysClean is never advanced, so the dashboard derives it. */
export function daysCleanSince(cleanSince: string, now: Date): number {
  const since = Date.parse(cleanSince);
  if (Number.isNaN(since)) return 0;
  return Math.max(0, Math.floor((now.getTime() - since) / 86_400_000));
}
