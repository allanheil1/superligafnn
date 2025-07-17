"use client";
import React, { useState, useCallback, useMemo, useEffect } from "react";
import { Box, Button, Typography, Tabs, Tab, Grid, Card, CardHeader, CardContent } from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { useSleeperApi } from "../hooks/useSleeperApi";
import { Ligas, LeagueInfo } from "../ligas";
import { LeagueUser, Roster, Transaction, Matchup, PlayerMap } from "../api/sleeper/types";
import { useSnackbarContext } from "../context/SnackbarContext";
import SearchInput from "./search";

// Data shape for grid rows
type TableSuperLigaRow = {
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

const SuperLigaPage: React.FC = () => {
  const api = useSleeperApi();
  const { openSnack, openLoading, closeLoading, isLoading } = useSnackbarContext();

  // Grid state
  const [rows, setRows] = useState<TableSuperLigaRow[]>([]);
  const [appliedFilterText, setAppliedFilterText] = useState("");

  // Persisted API data
  const [rostersByLeague, setRostersByLeague] = useState<Roster[][]>([]);
  const [usersByLeagueArray, setUsersByLeagueArray] = useState<LeagueUser[][]>([]);
  const [rawTransactions, setRawTransactions] = useState<(Transaction & { leagueId: string })[]>([]);

  // Tabs
  const [activeTab, setActiveTab] = useState<"grid" | "trades">("grid");

  // Trades tab state
  const [playersMap, setPlayersMap] = useState<PlayerMap>({});
  const [tradeCards, setTradeCards] = useState<TradeCardData[]>([]);
  const [tradesLoaded, setTradesLoaded] = useState(false);

  const getLeagueInfos = useCallback((): LeagueInfo[] => {
    const leagueInfos: LeagueInfo[] = [];
    for (let i = 9; i <= 88; i++)
      try {
        leagueInfos.push(Ligas.bronze(i));
      } catch {}
    for (let i = 45; i <= 55; i++)
      try {
        leagueInfos.push(Ligas.cobre(i));
      } catch {}
    [58, 8, 7, 6, 5, 4, 3, 2].forEach((i) => {
      try {
        leagueInfos.push(Ligas.prata(i));
      } catch {}
    });
    try {
      leagueInfos.push(Ligas.ouro(1));
    } catch {}
    leagueInfos.push(Ligas.creators());

    const unique = new Map<string, LeagueInfo>();
    leagueInfos.forEach((info) => unique.set(info.id, info));
    return Array.from(unique.values());
  }, []);

  // Helper: batch fetch league users
  const fetchLeagueUsers = (leagueInfos: LeagueInfo[]): Promise<LeagueUser[][]> =>
    Promise.all(leagueInfos.map((info) => api.getLeagueUsers(info.id).catch(() => [])));

  // Helper: batch fetch league rosters
  const fetchLeagueRosters = (leagueInfos: LeagueInfo[]): Promise<Roster[][]> =>
    Promise.all(leagueInfos.map((info) => api.getRosters(info.id).catch(() => [])));

  // Refactored helper to fetch raw transactions only once
  const fetchLeagueTransactions = async (leagueInfos: LeagueInfo[]): Promise<Record<string, Transaction[]>> => {
    const calls: { leagueId: string; fn: () => Promise<Transaction[] | null> }[] = [];
    leagueInfos.forEach((info) => {
      for (let wk = 1; wk <= 18; wk++) {
        calls.push({
          leagueId: info.id,
          fn: () => api.getTransactions(info.id, wk),
        });
      }
    });

    const results = await api.runInBatches<Transaction[] | null>(
      calls.map((c) => c.fn),
      50
    );

    const raw: Record<string, Transaction[]> = {};
    results.forEach((txs, i) => {
      const leagueId = calls[i].leagueId;
      if (!txs) return;
      if (!raw[leagueId]) raw[leagueId] = [];
      raw[leagueId].push(...txs);
    });

    return raw;
  };

  // Helper: aggregate matchups per league and roster
  const fetchLeagueMatchups = async (
    leagueInfos: LeagueInfo[]
  ): Promise<Record<string, Record<string, Record<number, { points: number; result: "W" | "L" | "T" }>>>> => {
    const calls: { leagueId: string; week: number; fn: () => Promise<Matchup[] | null> }[] = [];
    leagueInfos.forEach((info) => {
      for (let wk = 1; wk <= 18; wk++) {
        calls.push({ leagueId: info.id, week: wk, fn: () => api.getMatchups(info.id, wk) });
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
    Object.entries(grouped).forEach(([leagueId, weeks]) => {
      scores[leagueId] = {};
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
          scores[leagueId][String(a.roster_id)] = scores[leagueId][String(a.roster_id)] || {};
          scores[leagueId][String(b.roster_id)] = scores[leagueId][String(b.roster_id)] || {};
          scores[leagueId][String(a.roster_id)][wk] = { points: a.points, result: resultA };
          scores[leagueId][String(b.roster_id)][wk] = { points: b.points, result: resultB };
        });
      });
    });
    return scores;
  };

  // In handleFetchData: fetch raw tx and matchup scores in parallel, build counts from raw
  const handleFetchData = async () => {
    openLoading();
    setRows([]);
    try {
      const leagueInfos = getLeagueInfos();

      // Fetch users, rosters
      const [userArr, rosterArr] = await Promise.all([fetchLeagueUsers(leagueInfos), fetchLeagueRosters(leagueInfos)]);
      setUsersByLeagueArray(userArr);
      setRostersByLeague(rosterArr);

      // Fetch raw transactions and matchup scores concurrently
      const [rawTxByLeague, matchupScores] = await Promise.all([
        fetchLeagueTransactions(leagueInfos),
        fetchLeagueMatchups(leagueInfos),
      ]);

      // Persist raw transactions array
      const flatTxs = Object.entries(rawTxByLeague).flatMap(([leagueId, txs]) => txs.map((tx) => ({ ...tx, leagueId })));
      setRawTransactions(flatTxs);

      // Build transaction counts from raw data
      const transactionCounts: Record<string, Record<string, { trades: number; waivers: number }>> = {};
      Object.entries(rawTxByLeague).forEach(([leagueId, txs]) => {
        transactionCounts[leagueId] = {};
        txs.forEach((tx) => {
          if (tx.status !== "complete") return;
          tx.roster_ids.forEach((rId) => {
            const key = String(rId);
            if (!transactionCounts[leagueId][key]) {
              transactionCounts[leagueId][key] = { trades: 0, waivers: 0 };
            }
            if (tx.type === "trade") {
              transactionCounts[leagueId][key].trades++;
            }
            if (tx.type === "waiver") {
              transactionCounts[leagueId][key].waivers++;
            }
          });
        });
      });

      // Build grid rows using transactionCounts and matchupScores
      const allRows: TableSuperLigaRow[] = leagueInfos.flatMap((info, idx) => {
        const rosters = rosterArr[idx] || [];
        const users = userArr[idx] || [];
        return rosters.map((r) => {
          const user = users.find((u) => u.user_id === r.owner_id);
          const txCount = transactionCounts[info.id]?.[String(r.roster_id)] ?? { trades: 0, waivers: 0 };
          const scores = matchupScores[info.id]?.[String(r.roster_id)] || {};
          const weekly = Object.fromEntries(
            Array.from({ length: 18 }, (_, wk) => {
              const sc = scores[wk + 1];
              return [`week_${wk + 1}`, sc ? `${sc.points.toFixed(2)}${sc.result}` : "Bye"];
            })
          );

          return {
            id: `${info.id}-${r.roster_id}`,
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
      setRows(allRows);
      openSnack("Dados da Super Liga carregados com sucesso!", "success");
    } catch (error) {
      openSnack("Erro ao carregar dados da Super Liga.", "error");
      console.error(error);
    } finally {
      closeLoading();
    }
  };

  // Handle tab switching without refetching transactions/users/rosters
  const handleTabChange = async (_: React.SyntheticEvent, newTab: "grid" | "trades") => {
    setActiveTab(newTab);
    if (newTab === "trades" && !tradesLoaded) {
      openLoading();
      try {
        const allPlayers = await api.fetchAllPlayers();
        setPlayersMap(allPlayers);

        const tradeTxs = (rawTransactions as Array<Transaction & { leagueId: string }>).filter(
          (tx) => tx.type === "trade" && tx.status === "complete"
        );

        const leagueInfos = getLeagueInfos();
        const leagueRosterMap: Record<string, Record<string, string>> = {};
        leagueInfos.forEach((info, idx) => {
          const rosters = rostersByLeague[idx] || [];
          const users = usersByLeagueArray[idx] || [];
          const mapThis: Record<string, string> = {};
          rosters.forEach((r) => {
            const owner = users.find((u) => u.user_id === r.owner_id);
            mapThis[String(r.roster_id)] = owner?.metadata?.team_name || owner?.display_name || "N/A";
          });
          leagueRosterMap[info.id] = mapThis;
        });

        const cards: TradeCardData[] = tradeTxs.map((tx) => {
          const leagueInfo = leagueInfos.find((info) => info.id === tx.leagueId);
          const leagueName = leagueInfo?.name || "N/A";
          const rosterNameMap = leagueRosterMap[tx.leagueId] || {};

          const rosters = tx.roster_ids.map((rId) => {
            const id = String(rId);
            const name = rosterNameMap[id] || "N/A";
            // Somente os jogadores que este roster RECEBE (adds)
            const receivedIds = tx.adds
              ? Object.entries(tx.adds)
                  .filter(([, rosterAssigned]) => String(rosterAssigned) === id)
                  .map(([playerId]) => playerId)
              : [];

            const players = receivedIds.map((pid) => ({
              id: pid,
              name: allPlayers[pid]?.full_name || pid,
              position: allPlayers[pid]?.position || "?",
            }));

            return { rosterId: id, rosterName: name, players };
          });

          return { leagueName, rosters };
        });

        setTradeCards(cards);
        setTradesLoaded(true);
      } catch (e) {
        openSnack("Erro ao carregar trades.", "error");
        console.error(e);
      } finally {
        closeLoading();
      }
    }
  };

  // Filter rows
  const filteredRows = useMemo(() => {
    const filter = appliedFilterText.toLowerCase();
    return filter ? rows.filter((r) => Object.values(r).some((v) => String(v).toLowerCase().includes(filter))) : rows;
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
          const str = String(val);
          const match = str.match(/^(\d+\.\d{2})/);
          return match ? parseFloat(match[1]) : 0;
        };

        return parseScore(v1) - parseScore(v2);
      },
      renderCell: (params) => {
        const raw = String(params.value);
        const match = raw.match(/^(\d+\.\d{2})([WLT])$/);

        if (!match) return raw;

        const [_, points, result] = match;
        const color = result === "W" ? "green" : result === "L" ? "red" : "gray";
        return (
          <span>
            {points} <strong style={{ color }}>({result})</strong>
          </span>
        );
      },
    });
  }

  const columns: GridColDef<TableSuperLigaRow>[] = [...staticColumns, ...weeklyScoreColumns];

  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => setHasMounted(true), []);

  return (
    <Box p={2}>
      <Typography variant="h4" gutterBottom>
        Super Liga 2025
      </Typography>
      <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 2 }}>
        <Tab label="Visão Geral" value="grid" />
        <Tab label="Trades" value="trades" />
      </Tabs>

      {activeTab === "grid" && (
        <>
          <Button variant="contained" onClick={handleFetchData} disabled={isLoading}>
            {isLoading ? "Buscando..." : "Buscar Dados Super Liga"}
          </Button>
          <SearchInput onApply={(text) => setAppliedFilterText(text)} />
          <Box mt={2} sx={{ height: "75vh", width: "100%" }}>
            {hasMounted && <DataGrid rows={filteredRows} columns={columns} loading={isLoading} getRowId={(row) => row.id} />}
          </Box>
        </>
      )}

      {activeTab === "trades" && (
        <Box display="flex" flexWrap="wrap" gap={2} mt={2}>
          {tradeCards.map((card, idx) => (
            <Box key={idx} sx={{ width: { xs: "100%", sm: "50%", md: "33.333%" } }}>
              <Card>
                <CardHeader title={`Trade #${idx + 1}`} subheader={card.leagueName} />
                <CardContent>
                  {card.rosters.map(({ rosterId, rosterName, players }) => (
                    <Typography key={rosterId} sx={{ mb: 1 }}>
                      <strong>{rosterName} RECEBE:</strong>{" "}
                      {players.length ? players.map((p) => p.name).join(" + ") : "Nenhum jogador recebido"}
                    </Typography>
                  ))}
                </CardContent>
              </Card>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default SuperLigaPage;
