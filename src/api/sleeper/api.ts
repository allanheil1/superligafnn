import axios from "axios";
import {
  User,
  League,
  Roster,
  LeagueUser,
  Matchup,
  BracketMatchup,
  Transaction,
  DraftPickTrade,
  SportState,
  Draft,
  DraftPick,
  PlayerMap,
  TrendingPlayer,
} from "./types";

export const sleeperAxios = axios.create({
  baseURL: "https://api.sleeper.app/v1",
});

// Users
export const getUser = async (id: string): Promise<User> => {
  const { data } = await sleeperAxios.get<User>(`/user/${id}`);
  return data;
};

// Leagues
export const getLeaguesForUser = async (userId: string, sport: string, season: string): Promise<League[]> => {
  const { data } = await sleeperAxios.get<League[]>(`/user/${userId}/leagues/${sport}/${season}`);
  return data;
};

export const getLeague = async (leagueId: string): Promise<League> => {
  const { data } = await sleeperAxios.get<League>(`/league/${leagueId}`);
  return data;
};

export const getRosters = async (leagueId: string): Promise<Roster[]> => {
  const { data } = await sleeperAxios.get<Roster[]>(`/league/${leagueId}/rosters`);
  return data;
};

export const getLeagueUsers = async (leagueId: string): Promise<LeagueUser[]> => {
  const { data } = await sleeperAxios.get<LeagueUser[]>(`/league/${leagueId}/users`);
  return data;
};

export const getMatchups = async (leagueId: string, week: number): Promise<Matchup[]> => {
  const { data } = await sleeperAxios.get<Matchup[]>(`/league/${leagueId}/matchups/${week}`);
  return data;
};

export const getWinnersBracket = async (leagueId: string): Promise<BracketMatchup[]> => {
  const { data } = await sleeperAxios.get<BracketMatchup[]>(`/league/${leagueId}/winners_bracket`);
  return data;
};

export const getLosersBracket = async (leagueId: string): Promise<BracketMatchup[]> => {
  const { data } = await sleeperAxios.get<BracketMatchup[]>(`/league/${leagueId}/losers_bracket`);
  return data;
};

export const getTransactions = async (leagueId: string, round: number): Promise<Transaction[]> => {
  const { data } = await sleeperAxios.get<Transaction[]>(`/league/${leagueId}/transactions/${round}`);
  return data;
};

export const getTradedPicks = async (leagueId: string): Promise<DraftPickTrade[]> => {
  const { data } = await sleeperAxios.get<DraftPickTrade[]>(`/league/${leagueId}/traded_picks`);
  return data;
};

export const getSportState = async (sport: string): Promise<SportState> => {
  const { data } = await sleeperAxios.get<SportState>(`/state/${sport}`);
  return data;
};
// Drafts
export const getDraftsForUser = async (userId: string, sport: string, season: string): Promise<Draft[]> => {
  const { data } = await sleeperAxios.get<Draft[]>(`/user/${userId}/drafts/${sport}/${season}`);
  return data;
};

export const getDraftsForLeague = async (leagueId: string): Promise<Draft[]> => {
  const { data } = await sleeperAxios.get<Draft[]>(`/league/${leagueId}/drafts`);
  return data;
};

export const getDraft = async (draftId: string): Promise<Draft> => {
  const { data } = await sleeperAxios.get<Draft>(`/draft/${draftId}`);
  return data;
};

export const getDraftPicks = async (draftId: string): Promise<DraftPick[]> => {
  const { data } = await sleeperAxios.get<DraftPick[]>(`/draft/${draftId}/picks`);
  return data;
};

export const getDraftTradedPicks = async (draftId: string): Promise<DraftPickTrade[]> => {
  const { data } = await sleeperAxios.get<DraftPickTrade[]>(`/draft/${draftId}/traded_picks`);
  return data;
};

// Players
export const fetchAllPlayers = async (): Promise<PlayerMap> => {
  const { data } = await sleeperAxios.get<PlayerMap>(`/players/nfl`);
  return data;
};

export const getTrendingPlayers = async (
  type: "add" | "drop",
  lookback_hours?: number,
  limit?: number
): Promise<TrendingPlayer[]> => {
  const params: any = {};
  if (lookback_hours) params.lookback_hours = lookback_hours;
  if (limit) params.limit = limit;
  const { data } = await sleeperAxios.get<TrendingPlayer[]>(`/players/nfl/trending/${type}`, { params });
  return data;
};
