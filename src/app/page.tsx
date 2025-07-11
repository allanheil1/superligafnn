"use client";
import React, { useState, useCallback, useMemo } from "react";
import { Box, Button, Typography, TextField } from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { useSleeperApi } from "../hooks/useSleeperApi";
import { Ligas, LeagueInfo } from "../ligas";
import { LeagueUser, Roster, Transaction, Matchup } from "../api/sleeper/types";
import { useSnackbarContext } from "../context/SnackbarContext";
import SearchInput from "./search"; // ajuste o caminho conforme necessário

interface TableSuperLigaRow {
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
}

const SuperLigaPage: React.FC = () => {
  const api = useSleeperApi();
  const { openSnack, openLoading, closeLoading, isLoading } = useSnackbarContext();
  const [rows, setRows] = useState<TableSuperLigaRow[]>([]);
  const [filterText, setFilterText] = useState("");
  const [appliedFilterText, setAppliedFilterText] = useState("");

  const getLeagueInfos = useCallback((): LeagueInfo[] => {
    const leagueInfos: LeagueInfo[] = [];
    for (let i = 9; i <= 88; i++) {
      try {
        leagueInfos.push(Ligas.bronze(i));
      } catch (e) {}
    }
    for (let i = 45; i <= 55; i++) {
      try {
        leagueInfos.push(Ligas.cobre(i));
      } catch (e) {}
    }
    [58, 8, 7, 6, 5, 4, 3, 2].forEach((i) => {
      try {
        leagueInfos.push(Ligas.prata(i));
      } catch (e) {}
    });
    try {
      leagueInfos.push(Ligas.ouro(1));
    } catch (e) {}
    leagueInfos.push(Ligas.creators());
    return leagueInfos;
  }, []);

  const fetchLeagueUsers = (leagueInfos: LeagueInfo[]): Promise<(LeagueUser[] | null)[]> => {
    return Promise.all(leagueInfos.map((info) => api.getLeagueUsers(info.id).catch(() => null)));
  };

  const fetchLeagueRosters = (leagueInfos: LeagueInfo[]): Promise<(Roster[] | null)[]> => {
    return Promise.all(leagueInfos.map((info) => api.getRosters(info.id).catch(() => null)));
  };

  const fetchLeagueTransactions = async (
    leagueInfos: LeagueInfo[]
  ): Promise<Record<string, Record<string, { trades: number; waivers: number }>>> => {
    const transactionCalls: { leagueId: string; fn: () => Promise<Transaction[] | null> }[] = [];

    leagueInfos.forEach((info) => {
      for (let week = 1; week <= 18; week++) {
        transactionCalls.push({ leagueId: info.id, fn: () => api.getTransactions(info.id, week) });
      }
    });

    const allTransactionsArrays = await api.runInBatches<Transaction[] | null>(
      transactionCalls.map((c) => c.fn),
      50
    );

    const flatTransactionsWithLeague: Array<{ leagueId: string; tx: Transaction }> = [];
    allTransactionsArrays.forEach((transactions, index) => {
      const leagueId = transactionCalls[index].leagueId;
      if (transactions) {
        transactions.forEach((tx) => {
          flatTransactionsWithLeague.push({ leagueId, tx });
        });
      }
    });

    const transactionCounts: Record<string, Record<string, { trades: number; waivers: number }>> = {};
    flatTransactionsWithLeague.forEach(({ leagueId, tx }) => {
      if (!transactionCounts[leagueId]) transactionCounts[leagueId] = {};
      const actorId = tx.creator;
      if (!transactionCounts[leagueId][actorId]) {
        transactionCounts[leagueId][actorId] = { trades: 0, waivers: 0 };
      }
      if (tx.type === "trade") transactionCounts[leagueId][actorId].trades += 1;
      if (tx.type === "waiver") transactionCounts[leagueId][actorId].waivers += 1;
    });

    return transactionCounts;
  };

  const fetchLeagueMatchups = async (
    leagueInfos: LeagueInfo[]
  ): Promise<Record<string, Record<string, Record<number, { points: number; result: "W" | "L" | "T" }>>>> => {
    const matchupCalls: { leagueId: string; week: number; fn: () => Promise<Matchup[] | null> }[] = [];

    leagueInfos.forEach((info) => {
      for (let week = 1; week <= 18; week++) {
        matchupCalls.push({ leagueId: info.id, week, fn: () => api.getMatchups(info.id, week) });
      }
    });

    const allMatchupsArrays = await api.runInBatches<Matchup[] | null>(
      matchupCalls.map((c) => c.fn),
      50
    );

    const matchupScores: Record<string, Record<string, Record<number, { points: number; result: "W" | "L" | "T" }>>> = {};
    const matchupsGrouped: Record<string, Record<number, Matchup[]>> = {};

    allMatchupsArrays.forEach((matchups, index) => {
      if (!matchups) return;
      const { leagueId, week } = matchupCalls[index];
      if (!matchupsGrouped[leagueId]) matchupsGrouped[leagueId] = {};
      if (!matchupsGrouped[leagueId][week]) matchupsGrouped[leagueId][week] = [];
      matchupsGrouped[leagueId][week].push(...matchups);
    });

    for (const leagueId in matchupsGrouped) {
      if (!matchupScores[leagueId]) matchupScores[leagueId] = {};

      for (const weekStr in matchupsGrouped[leagueId]) {
        const week = Number(weekStr);
        const matchups = matchupsGrouped[leagueId][week];
        const byMatchupId: Record<number, Matchup[]> = {};
        matchups.forEach((m) => {
          if (!byMatchupId[m.matchup_id]) byMatchupId[m.matchup_id] = [];
          byMatchupId[m.matchup_id].push(m);
        });

        for (const matchupId in byMatchupId) {
          const [a, b] = byMatchupId[matchupId];
          if (!a || !b) continue;

          const resultA: "W" | "L" | "T" = a.points > b.points ? "W" : a.points < b.points ? "L" : "T";
          const resultB: "W" | "L" | "T" = b.points > a.points ? "W" : b.points < a.points ? "L" : "T";

          if (!matchupScores[leagueId][a.roster_id]) matchupScores[leagueId][a.roster_id] = {};
          if (!matchupScores[leagueId][b.roster_id]) matchupScores[leagueId][b.roster_id] = {};

          matchupScores[leagueId][a.roster_id][week] = { points: a.points, result: resultA };
          matchupScores[leagueId][b.roster_id][week] = { points: b.points, result: resultB };
        }
      }
    }

    return matchupScores;
  };

  const handleFetchData = async () => {
    openLoading();
    setRows([]);

    try {
      const leagueInfos = getLeagueInfos();
      const [rostersByLeague, usersByLeagueArray, transactionCounts, matchupScores] = await Promise.all([
        fetchLeagueRosters(leagueInfos),
        fetchLeagueUsers(leagueInfos),
        fetchLeagueTransactions(leagueInfos),
        fetchLeagueMatchups(leagueInfos),
      ]);

      const usersByLeagueMap: Record<string, LeagueUser[]> = {};
      leagueInfos.forEach((info, idx) => {
        usersByLeagueMap[info.id] = usersByLeagueArray[idx] || [];
      });

      const allRows: TableSuperLigaRow[] = leagueInfos.flatMap((info, idx) => {
        const rosters = rostersByLeague[idx] || [];
        const users = usersByLeagueMap[info.id];

        return rosters.map((r) => {
          const user = users.find((u) => u.user_id === r.owner_id);
          const tx = transactionCounts[info.id]?.[user?.user_id || ""] ?? { trades: 0, waivers: 0 };

          const weeklyScores: Record<string, string> = {};
          const scoresForRoster = matchupScores[info.id]?.[r.roster_id] ?? {};

          for (let week = 1; week <= 18; week++) {
            const data = scoresForRoster[week];
            weeklyScores[`week_${week}`] = data ? `${data.points.toFixed(2)}${data.result}` : "N/A";
          }

          return {
            id: `${info.id}-${r.roster_id}`,
            league: info.name,
            team: user?.metadata?.team_name ?? user?.display_name ?? "N/A",
            user_id: user?.user_id ?? "N/A",
            user_name: user?.display_name ?? "N/A",
            wins: r.settings?.wins ?? 0,
            losses: r.settings?.losses ?? 0,
            pf: r.settings?.fpts ?? 0,
            pt: r.settings?.fpts_against ?? 0,
            trades: tx.trades,
            waivers: tx.waivers,
            ...weeklyScores,
          };
        });
      });

      setRows(allRows);
      openSnack("Dados da Super Liga carregados com sucesso!", "success");
    } catch (error) {
      openSnack("Erro ao carregar dados da Super Liga.", "error");
      console.error("Error in handleFetchData:", error);
    } finally {
      closeLoading();
    }
  };

  const filteredRows = useMemo(() => {
    const filter = appliedFilterText.toLowerCase();
    return filter ? rows.filter((row) => Object.values(row).some((v) => String(v).toLowerCase().includes(filter))) : rows;
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

  return (
    <Box p={2}>
      <Typography variant="h4" gutterBottom>
        Super Liga 2025
      </Typography>
      <Button variant="contained" onClick={handleFetchData} disabled={isLoading}>
        {isLoading ? "Buscando..." : "Buscar Dados Super Liga"}
      </Button>
      <SearchInput onApply={(text) => setAppliedFilterText(text)} />

      <Box mt={2} sx={{ height: "75vh", width: "100%" }}>
        <DataGrid rows={filteredRows} columns={columns} loading={isLoading} getRowId={(row) => row.id} />
      </Box>
    </Box>
  );
};

export default SuperLigaPage;
