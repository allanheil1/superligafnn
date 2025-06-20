// Usuário
export interface User {
  username: string;
  user_id: string;
  display_name: string;
  avatar: string;
}

// Liga
export interface LeagueSettings {
  [key: string]: any;
}
export interface League {
  total_rosters: number;
  status: "pre_draft" | "drafting" | "in_season" | "complete";
  sport: string;
  settings: LeagueSettings;
  season_type: string;
  season: string;
  scoring_settings: Record<string, any>;
  roster_positions: string[];
  previous_league_id: string;
  name: string;
  league_id: string;
  draft_id: string;
  avatar: string;
}

// Escalações (rosters) em uma liga
export interface RosterSettings {
  wins: number;
  losses: number;
  ties: number;
  waiver_budget_used: number;
  waiver_position: number;
  total_moves: number;
  fpts: number;
  fpts_decimal: number;
  fpts_against: number;
  fpts_against_decimal: number;
}
export interface Roster {
  roster_id: number;
  owner_id: string;
  league_id: string;
  starters: string[];
  players: string[];
  reserve: string[];
  settings: RosterSettings;
}

// Usuários em uma liga
export interface LeagueUser {
  user_id: string;
  username: string;
  display_name: string;
  avatar: string;
  metadata: { team_name?: string };
  is_owner: boolean;
}

// Confrontos (matchups)
export interface Matchup {
  roster_id: number;
  matchup_id: number;
  starters: string[];
  players: string[];
  points: number;
  custom_points: number | null;
}

// Chaves de playoff
export interface BracketMatchup {
  r: number;
  m: number;
  t1: number | { w: number } | { l: number };
  t2: number | { w: number } | { l: number };
  w: number | null;
  l: number | null;
  t1_from?: { w?: number; l?: number };
  t2_from?: { w?: number; l?: number };
  p?: number;
}

// Transações
export interface DraftPickTrade {
  season: string;
  round: number;
  roster_id: number;
  previous_owner_id: number;
  owner_id: number;
}
export interface Transaction {
  type: string;
  transaction_id: string;
  status: string;
  creator: string;
  created: number;
  roster_ids: number[];
  settings: any;
  drops: Record<string, number> | null;
  adds: Record<string, number> | null;
  draft_picks: DraftPickTrade[];
  consenter_ids: number[];
  waiver_budget: Array<{ sender: number; receiver: number; amount: number }>;
}

// Estado da NFL
export interface SportState {
  week: number;
  season_type: string;
  season_start_date: string;
  season: string;
  previous_season: string;
  leg: number;
  league_season: string;
  league_create_season: string;
  display_week: number;
}

// Drafts
export interface Draft {
  draft_id: string;
  type: string;
  status: string;
  sport: string;
  start_time: number;
  season_type: string;
  season: string;
  settings: Record<string, any>;
  metadata: Record<string, any>;
  league_id?: string;
  last_picked?: number;
  last_message_time?: number;
  last_message_id?: string;
  draft_order?: Record<string, number>;
  slot_to_roster_id?: Record<string, number>;
  creators?: any;
  created: number;
}

// Peças do draft
export interface DraftPick {
  player_id: string;
  picked_by: string;
  roster_id: string;
  round: number;
  draft_slot: number;
  pick_no: number;
  is_keeper: boolean | null;
  metadata: Record<string, any>;
  draft_id: string;
}

// Jogadores e trending
export type PlayerMap = Record<
  string,
  {
    player_id: string;
    first_name: string;
    last_name: string;
    team: string;
    position: string;
    age: number;
    status: string;
    [key: string]: any;
  }
>;
export interface TrendingPlayer {
  player_id: string;
  count: number;
}
