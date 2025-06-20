// src/hooks/useSleeperApi.ts
import { useSnackbarContext } from "../context/SnackbarContext";
import * as sleeperApi from "../api/sleeper/api";

export const useSleeperApi = () => {
  const { openSnack, openLoading, closeLoading } = useSnackbarContext();

  // Faz a chamada, exibe snack de sucesso ou erro e controla loading
  const call = async <T>(fn: () => Promise<T>, successMsg: string, errorMsg: string): Promise<T | null> => {
    openLoading();
    try {
      const result = await fn();
      openSnack(successMsg, "success");
      return result;
    } catch (err: any) {
      openSnack(errorMsg, "error");
      return null;
    } finally {
      closeLoading();
    }
  };

  return {
    // Users
    getUser: (id: string) => call(() => sleeperApi.getUser(id), "Usuário obtido com sucesso", "Erro ao obter usuário"),

    // Leagues
    getLeaguesForUser: (userId: string, sport: string, season: string) =>
      call(() => sleeperApi.getLeaguesForUser(userId, sport, season), "Ligas carregadas com sucesso", "Erro ao obter ligas"),

    getLeague: (leagueId: string) => call(() => sleeperApi.getLeague(leagueId), "Liga obtida com sucesso", "Erro ao obter liga"),

    getRosters: (leagueId: string) =>
      call(() => sleeperApi.getRosters(leagueId), "Rosters carregados com sucesso", "Erro ao obter rosters"),

    getLeagueUsers: (leagueId: string) =>
      call(
        () => sleeperApi.getLeagueUsers(leagueId),
        "Usuários da liga carregados com sucesso",
        "Erro ao obter usuários da liga"
      ),

    getMatchups: (leagueId: string, week: number) =>
      call(
        () => sleeperApi.getMatchups(leagueId, week),
        `Matchups da semana ${week} obtidos com sucesso`,
        "Erro ao obter matchups"
      ),

    getWinnersBracket: (leagueId: string) =>
      call(
        () => sleeperApi.getWinnersBracket(leagueId),
        "Chave vencedora carregada com sucesso",
        "Erro ao obter chave vencedora"
      ),

    getLosersBracket: (leagueId: string) =>
      call(() => sleeperApi.getLosersBracket(leagueId), "Chave perdedora carregada com sucesso", "Erro ao obter chave perdedora"),

    getTransactions: (leagueId: string, round: number) =>
      call(
        () => sleeperApi.getTransactions(leagueId, round),
        `Transações da rodada ${round} carregadas com sucesso`,
        "Erro ao obter transações"
      ),

    getTradedPicks: (leagueId: string) =>
      call(
        () => sleeperApi.getTradedPicks(leagueId),
        "Picks negociadas carregadas com sucesso",
        "Erro ao obter picks negociadas"
      ),

    getSportState: (sport: string) =>
      call(() => sleeperApi.getSportState(sport), "Estado do esporte carregado com sucesso", "Erro ao obter estado do esporte"),

    // Drafts
    getDraftsForUser: (userId: string, sport: string, season: string) =>
      call(
        () => sleeperApi.getDraftsForUser(userId, sport, season),
        "Drafts do usuário carregados com sucesso",
        "Erro ao obter drafts"
      ),

    getDraftsForLeague: (leagueId: string) =>
      call(
        () => sleeperApi.getDraftsForLeague(leagueId),
        "Drafts da liga carregados com sucesso",
        "Erro ao obter drafts da liga"
      ),

    getDraft: (draftId: string) => call(() => sleeperApi.getDraft(draftId), "Draft obtido com sucesso", "Erro ao obter draft"),

    getDraftPicks: (draftId: string) =>
      call(() => sleeperApi.getDraftPicks(draftId), "Picks do draft carregadas com sucesso", "Erro ao obter picks do draft"),

    getDraftTradedPicks: (draftId: string) =>
      call(
        () => sleeperApi.getDraftTradedPicks(draftId),
        "Picks negociadas do draft carregadas com sucesso",
        "Erro ao obter picks negociadas do draft"
      ),

    // Players
    fetchAllPlayers: () =>
      call(() => sleeperApi.fetchAllPlayers(), "Jogadores carregados com sucesso", "Erro ao obter lista de jogadores"),

    getTrendingPlayers: (type: "add" | "drop", lookback_hours?: number, limit?: number) =>
      call(
        () => sleeperApi.getTrendingPlayers(type, lookback_hours, limit),
        `Trending players (${type}) carregados com sucesso`,
        "Erro ao obter trending players"
      ),
  };
};
