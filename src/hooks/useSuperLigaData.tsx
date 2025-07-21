// src/hooks/useSuperLigaData.ts
import React, { useState, useCallback, useMemo, useEffect } from "react";
import { GridColDef } from "@mui/x-data-grid";
import { useSleeperApi } from "../hooks/useSleeperApi";
import { Ligas, LeagueInfo } from "../ligas";
import { LeagueUser, Roster, Transaction, Matchup, PlayerMap } from "../api/sleeper/types";
import { useSnackbarContext } from "../context/SnackbarContext";

export type TableSuperLigaRow = {
  id: string;
  league: string;
  team: string;
  user_id: string;
  user_name: string;
  wins: number;
  losses: number;
  pf: number;
  pt: number;
  trades: number;
  waivers: number;
  [key: `week_${number}`]: string | number;
};

export type TradeCardData = {
  leagueName: string;
  rosters: {
    rosterId: string;
    rosterName: string;
    players: { id: string; name: string; position: string }[];
  }[];
};

export const useSuperLigaData = () => {
  const api = useSleeperApi();
  const { openSnack, openLoading, closeLoading, isLoading } = useSnackbarContext();

  const [rows, setRows] = useState<TableSuperLigaRow[]>([]);
  const [appliedFilterText, setAppliedFilterText] = useState("");

  const [rostersByLeague, setRostersByLeague] = useState<Roster[][]>([]);
  const [usersByLeagueArray, setUsersByLeagueArray] = useState<LeagueUser[][]>([]);
  const [rawTransactions, setRawTransactions] = useState<(Transaction & { leagueId: string })[]>([]);

  const [allPlayersNFL, setAllPlayersNFL] = useState<PlayerMap>();

  const [activeTab, setActiveTab] = useState<"grid" | "trades">("grid");

  const [tradeCards, setTradeCards] = useState<TradeCardData[]>([]);
  const [tradesLoaded, setTradesLoaded] = useState(false);

  // Memoização do array de ligas
  const leagueInfos = useMemo<LeagueInfo[]>(() => {
    const infos: LeagueInfo[] = [];
    for (let i = 9; i <= 88; i++) {
      try {
        infos.push(Ligas.bronze(i));
      } catch {}
    }
    for (let i = 45; i <= 55; i++) {
      try {
        infos.push(Ligas.cobre(i));
      } catch {}
    }
    [58, 8, 7, 6, 5, 4, 3, 2].forEach((i) => {
      try {
        infos.push(Ligas.prata(i));
      } catch {}
    });
    try {
      infos.push(Ligas.ouro(1));
    } catch {}
    infos.push(Ligas.creators());
    const unique = new Map<string, LeagueInfo>();
    infos.forEach((info) => unique.set(String(info.id), info));
    return Array.from(unique.values());
  }, []);

  const fetchLeagueUsers = (infos: LeagueInfo[]) =>
    Promise.all(infos.map((info) => api.getLeagueUsers(String(info.id)).catch(() => [])));

  const fetchLeagueRosters = (infos: LeagueInfo[]) =>
    Promise.all(infos.map((info) => api.getRosters(String(info.id)).catch(() => [])));

  const fetchLeagueTransactions = async (infos: LeagueInfo[]) => {
    const calls: { leagueId: string; fn: () => Promise<Transaction[] | null> }[] = [];
    infos.forEach((info) => {
      const lid = String(info.id);
      for (let wk = 1; wk <= 18; wk++) {
        calls.push({ leagueId: lid, fn: () => api.getTransactions(lid, wk) });
      }
    });
    const results = await api.runInBatches<Transaction[] | null>(
      calls.map((c) => c.fn),
      50
    );
    const raw: Record<string, Transaction[]> = {};
    results.forEach((txs, i) => {
      const lid = calls[i].leagueId;
      if (!txs) return;
      if (!raw[lid]) raw[lid] = [];
      raw[lid].push(...txs);
    });
    return raw;
  };

  const fetchLeagueMatchups = async (infos: LeagueInfo[]) => {
    const calls: { leagueId: string; week: number; fn: () => Promise<Matchup[] | null> }[] = [];
    infos.forEach((info) => {
      const lid = String(info.id);
      for (let wk = 1; wk <= 18; wk++) {
        calls.push({ leagueId: lid, week: wk, fn: () => api.getMatchups(lid, wk) });
      }
    });
    const results = await api.runInBatches<Matchup[] | null>(
      calls.map((c) => c.fn),
      50
    );
    const grouped: Record<string, Record<number, Matchup[]>> = {};
    results.forEach((arr, i) => {
      if (!arr) return;
      const { leagueId, week } = calls[i];
      grouped[leagueId] = grouped[leagueId] || {};
      grouped[leagueId][week] = grouped[leagueId][week] || [];
      grouped[leagueId][week].push(...arr);
    });
    const scores: Record<string, Record<string, Record<number, { points: number; result: "W" | "L" | "T" }>>> = {};
    Object.entries(grouped).forEach(([lid, weeks]) => {
      scores[lid] = {};
      Object.entries(weeks).forEach(([wkStr, arr]) => {
        const wk = Number(wkStr);
        const byMatch = arr.reduce((acc, m) => {
          acc[m.matchup_id] = acc[m.matchup_id] || [];
          acc[m.matchup_id].push(m);
          return acc;
        }, {} as Record<number, Matchup[]>);
        Object.values(byMatch).forEach((pair) => {
          if (pair.length < 2) return;
          const [a, b] = pair;
          const resultA = a.points > b.points ? "W" : a.points < b.points ? "L" : "T";
          const resultB = b.points > a.points ? "W" : b.points < a.points ? "L" : "T";
          const ridA = String(a.roster_id);
          const ridB = String(b.roster_id);
          scores[lid][ridA] = scores[lid][ridA] || {};
          scores[lid][ridB] = scores[lid][ridB] || {};
          scores[lid][ridA][wk] = { points: a.points, result: resultA };
          scores[lid][ridB][wk] = { points: b.points, result: resultB };
        });
      });
    });
    return scores;
  };

  const handleFetchData = async () => {
    openLoading();
    setRows([]);
    try {
      const [usersArr, rostersArr] = await Promise.all([fetchLeagueUsers(leagueInfos), fetchLeagueRosters(leagueInfos)]);
      setUsersByLeagueArray(usersArr);
      setRostersByLeague(rostersArr);

      const [rawTxByLeague, matchupScores] = await Promise.all([
        fetchLeagueTransactions(leagueInfos),
        fetchLeagueMatchups(leagueInfos),
      ]);

      const flatTxs = Object.entries(rawTxByLeague).flatMap(([lid, txs]) => txs.map((tx) => ({ ...tx, leagueId: lid })));
      setRawTransactions(flatTxs);

      const transactionCounts: Record<string, Record<string, { trades: number; waivers: number }>> = {};
      Object.entries(rawTxByLeague).forEach(([lid, txs]) => {
        transactionCounts[lid] = {};
        txs.forEach((tx) => {
          if (tx.status !== "complete") return;
          tx.roster_ids.forEach((rId) => {
            const key = String(rId);
            if (!transactionCounts[lid][key]) {
              transactionCounts[lid][key] = { trades: 0, waivers: 0 };
            }
            if (tx.type === "trade") transactionCounts[lid][key].trades++;
            if (tx.type === "waiver") transactionCounts[lid][key].waivers++;
          });
        });
      });

      const allRows: TableSuperLigaRow[] = leagueInfos.flatMap((info, idx) => {
        const lid = String(info.id);
        const rosters = rostersArr[idx] || [];
        const users = usersArr[idx] || [];
        return rosters.map((r) => {
          const rid = String(r.roster_id);
          const user = users.find((u) => u.user_id === r.owner_id);
          const txCount = transactionCounts[lid]?.[rid] ?? { trades: 0, waivers: 0 };
          const scores = matchupScores[lid]?.[rid] || {};
          const weekly = Object.fromEntries(
            Array.from({ length: 18 }, (_, i) => {
              const wk = i + 1;
              const sc = scores[wk];
              return [`week_${wk}`, sc ? `${sc.points.toFixed(2)}${sc.result}` : "Bye"];
            })
          );
          return {
            id: `${lid}-${rid}`,
            league: info.name,
            team: user?.metadata?.team_name || user?.display_name || "N/A",
            user_id: user?.user_id || "N/A",
            user_name: user?.display_name || "N/A",
            wins: r.settings?.wins || 0,
            losses: r.settings?.losses || 0,
            pf: r.settings?.fpts || 0,
            pt: r.settings?.fpts_against || 0,
            trades: txCount.trades,
            waivers: txCount.waivers,
            ...weekly,
          };
        });
      });
      setTradesLoaded(true);
      setRows(allRows);
      openSnack("Dados da Super Liga carregados com sucesso!", "success");
    } catch (error) {
      openSnack("Erro ao carregar dados da Super Liga.", "error");
      console.error(error);
    } finally {
      closeLoading();
    }
  };

  const handleTabChange = async (_: React.SyntheticEvent, newTab: "grid" | "trades") => {
    setActiveTab(newTab);

    if (newTab === "trades") {
      openLoading();
      try {
        // carrega (e guarda) os players apenas se ainda não tiver
        let playersMap = allPlayersNFL;
        if (!playersMap) {
          playersMap = await api.fetchAllPlayers();
          setAllPlayersNFL(playersMap);
        }
        const tradeTxs = rawTransactions.filter((tx) => tx.type === "trade" && tx.status === "complete");

        const leagueRosterMap: Record<string, Record<string, string>> = {};
        leagueInfos.forEach((info, idx) => {
          const lid = String(info.id);
          leagueRosterMap[lid] = {};
          (rostersByLeague[idx] || []).forEach((r) => {
            const rid = String(r.roster_id);
            const owner = (usersByLeagueArray[idx] || []).find((u) => u.user_id === r.owner_id);
            leagueRosterMap[lid][rid] = owner?.metadata?.team_name || owner?.display_name || "N/A";
          });
        });

        const cards: TradeCardData[] = tradeTxs.map((tx) => {
          const lid = String(tx.leagueId);
          const leagueInfo = leagueInfos.find((info) => String(info.id) === lid);
          const leagueName = leagueInfo?.name || "N/A";
          const rosterNameMap = leagueRosterMap[lid] || {};

          const rosters = tx.roster_ids.map((rId) => {
            const rid = String(rId);
            const rosterName = rosterNameMap[rid] || "N/A";
            const receivedIds = tx.adds
              ? Object.entries(tx.adds)
                  .filter(([, assignedLid]) => String(assignedLid) === rid)
                  .map(([playerId]) => playerId)
              : [];
            const players = receivedIds.map((pid) => {
              const player = playersMap?.[pid];
              return {
                id: pid,
                name: player?.full_name ?? pid,
                position: player?.position ?? "?",
              };
            });
            return { rosterId: rid, rosterName, players };
          });

          return { leagueName, rosters };
        });

        setTradeCards(cards);
      } catch (e) {
        openSnack("Erro ao carregar trades.", "error");
        console.error(e);
      } finally {
        closeLoading();
      }
    }
  };

  const filteredRows = useMemo(() => {
    const ft = appliedFilterText.toLowerCase();
    return ft ? rows.filter((r) => Object.values(r).some((v) => String(v).toLowerCase().includes(ft))) : rows;
  }, [rows, appliedFilterText]);

  const staticColumns: GridColDef<TableSuperLigaRow>[] = [
    { field: "league", headerName: "Liga", width: 200 },
    { field: "team", headerName: "Time", width: 200 },
    { field: "user_name", headerName: "Nome Jogador", width: 150 },
    {
      field: "wins",
      headerName: "Vitórias",
      width: 120,
      type: "number",
      renderCell: (params) => <strong style={{ color: "green" }}>{params.value}</strong>,
    },
    {
      field: "losses",
      headerName: "Derrotas",
      width: 120,
      type: "number",
      renderCell: (params) => <strong style={{ color: "red" }}>{params.value}</strong>,
    },
    { field: "pf", headerName: "PF", width: 120, type: "number" },
    { field: "pt", headerName: "PT", width: 120, type: "number" },
    { field: "waivers", headerName: "Waivers", width: 100, type: "number" },
    { field: "trades", headerName: "Trades", width: 100, type: "number" },
  ];

  const weeklyScoreColumns: GridColDef<TableSuperLigaRow>[] = [];
  for (let week = 1; week <= 18; week++) {
    weeklyScoreColumns.push({
      field: `week_${week}`,
      headerName: `W${week}`,
      width: 100,
      sortable: true,
      sortComparator: (v1, v2) => {
        const parseScore = (val: any): number => {
          const match = String(val).match(/^(\d+\.\d{2})/);
          return match ? parseFloat(match[1]) : 0;
        };
        return parseScore(v1) - parseScore(v2);
      },
      renderCell: (params) => {
        const raw = String(params.value);
        const m = raw.match(/^(\d+\.\d{2})([WLT])$/);
        if (!m) return raw;
        const [_, pts, res] = m;
        const color = res === "W" ? "green" : res === "L" ? "red" : "gray";
        return (
          <span>
            {pts} <strong style={{ color }}>({res})</strong>
          </span>
        );
      },
    });
  }

  const columns = useMemo(() => [...staticColumns, ...weeklyScoreColumns], [staticColumns, weeklyScoreColumns]);

  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => setHasMounted(true), []);

  return {
    activeTab,
    handleTabChange,
    filteredRows,
    columns,
    handleFetchData,
    appliedFilterText,
    setAppliedFilterText,
    isLoading,
    hasMounted,
    tradeCards,
    tradesLoaded,
  };
};
