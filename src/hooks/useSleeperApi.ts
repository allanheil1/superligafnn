// src/hooks/useSleeperApi.ts
import * as sleeperApi from "../api/sleeper/api";

export const useSleeperApi = () => {
  const runInBatches = async <T>(fns: (() => Promise<T>)[], batchSize = 20): Promise<(T | null)[]> => {
    const results: (T | null)[] = [];
    for (let i = 0; i < fns.length; i += batchSize) {
      const batch = fns.slice(i, i + batchSize);
      const batchResults = await Promise.all(batch.map((fn) => fn().catch(() => null)));
      results.push(...batchResults);
    }
    return results;
  };

  return {
    runInBatches,

    getRosters: (leagueId: string) => sleeperApi.getRosters(leagueId),

    getLeagueUsers: (leagueId: string) => sleeperApi.getLeagueUsers(leagueId),

    getTransactions: (leagueId: string, round: number) => sleeperApi.getTransactions(leagueId, round),

    getMatchups: (leagueId: string, week: number) => sleeperApi.getMatchups(leagueId, week),

    fetchAllPlayers: () => sleeperApi.fetchAllPlayers(),

    getNflState: () => sleeperApi.getSportState("nfl"),
  };
};
