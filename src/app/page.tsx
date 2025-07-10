"use client";
import React, { useState } from "react";
import { Box, Button, Typography } from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { useSleeperApi } from "../hooks/useSleeperApi";
import { Ligas, LeagueInfo } from "../ligas";
import { LeagueUser, Roster, Transaction } from "../api/sleeper/types";

const SuperLigaPage: React.FC = () => {
  const api = useSleeperApi();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleFetch = async () => {
    setLoading(true);

    // Monta lista de ligas de todas as categorias
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

    // Promises de usuários e rosters por liga
    const userPromises: Promise<LeagueUser[] | null>[] = [];
    const rosterPromises: Promise<Roster[] | null>[] = [];

    leagueInfos.forEach((info) => {
      userPromises.push(api.getLeagueUsers(info.id));
      rosterPromises.push(api.getRosters(info.id));
    });

    const usersByLeague = await api.callGroup(
      leagueInfos.map((info) => () => api.getLeagueUsers(info.id)), // agora são funções simples
      "Todos os usuários buscados com sucesso",
      "Erro ao buscar usuários"
    );

    const rostersByLeague = await api.callGroup(
      leagueInfos.map((info) => () => api.getRosters(info.id)),
      "Todos os rosters buscados com sucesso",
      "Erro ao buscar rosters"
    );

    // Mapa de leagueId -> LeagueUser[]
    const leagueUsersMap: Record<string, LeagueUser[]> = {};
    leagueInfos.forEach((info, idx) => {
      leagueUsersMap[info.id] = usersByLeague[idx] || [];
    });

    // // --------- //
    const transactionCalls: { leagueId: string; fn: () => Promise<Transaction[] | null> }[] = [];

    leagueInfos.forEach((info) => {
      for (let week = 1; week <= 18; week++) {
        transactionCalls.push({
          leagueId: info.id,
          fn: () => api.getTransactions(info.id, week),
        });
      }
    });

    // Extrai só as funções para passar para runInBatches
    const transactionFns = transactionCalls.map((c) => c.fn);

    const allTransactionsArrays = await api.runInBatches<Transaction[] | null>(transactionFns, 50);

    // Agora, associar transactions ao leagueId de cada chamada (mesma ordem)
    const flatTransactionsWithLeague: Array<{ leagueId: string; tx: Transaction }> = [];

    allTransactionsArrays.forEach((transactions, index) => {
      const leagueId = transactionCalls[index].leagueId;
      if (transactions) {
        transactions.forEach((tx) => {
          flatTransactionsWithLeague.push({ leagueId, tx });
        });
      }
    });

    // Agora monta o objeto de contagem usando leagueId do lado externo
    const transactionCounts: Record<string, Record<string, { trades: number; waivers: number }>> = {};

    flatTransactionsWithLeague.forEach(({ leagueId, tx }) => {
      if (!transactionCounts[leagueId]) transactionCounts[leagueId] = {};

      const actorId = tx.creator;
      if (!transactionCounts[leagueId][actorId]) {
        transactionCounts[leagueId][actorId] = { trades: 0, waivers: 0 };
      }

      if (tx.type === "trade") {
        transactionCounts[leagueId][actorId].trades += 1;
      }

      if (tx.type === "waiver") {
        transactionCounts[leagueId][actorId].waivers += 1;
      }
    });
    // // --------- //

    const allRows = leagueInfos.flatMap((info, idx) => {
      const rosters = rostersByLeague[idx] || [];
      const users = leagueUsersMap[info.id];
      return rosters.map((r) => {
        const user = users.find((u) => u.user_id === r.owner_id);
        const transactionStats = transactionCounts[info.id]?.[user?.user_id || ""] ?? {
          trades: 0,
          waivers: 0,
        };
        return {
          id: `${info.id}-${r.roster_id}`,
          league: info.name,
          team: user?.metadata.team_name ?? user?.display_name,
          user_id: user?.user_id,
          user_name: user?.display_name,
          wins: r.settings?.wins ?? 0,
          losses: r.settings?.losses ?? 0,
          pf: r.settings.fpts,
          pt: r.settings.fpts_against,
          trades: transactionStats.trades,
          waivers: transactionStats.waivers,
        };
      });
    });

    setRows(allRows);
    setLoading(false);
  };

  const columns: GridColDef[] = [
    { field: "league", headerName: "Liga", width: 200 },
    { field: "team", headerName: "Time", width: 200 },
    { field: "user_id", headerName: "ID Jogador", width: 150 },
    { field: "user_name", headerName: "Nome Jogador", width: 150 },
    { field: "wins", headerName: "Vitórias", width: 120, type: "number" },
    { field: "losses", headerName: "Derrotas", width: 120, type: "number" },
    { field: "pf", headerName: "Pontos Feitos", width: 200, type: "number" },
    { field: "pt", headerName: "Pontos Tomados", width: 200, type: "number" },
    { field: "waivers", headerName: "Waivers", width: 200, type: "number" },
    { field: "trades", headerName: "Trades", width: 200, type: "number" },
  ];

  return (
    <Box p={2}>
      <Typography variant="h4" gutterBottom>
        Super Liga Rosters
      </Typography>
      <Button variant="contained" onClick={handleFetch} disabled={loading}>
        Buscar Dados Super Liga
      </Button>
      <Box mt={2} sx={{ height: 600, width: "100%" }}>
        <DataGrid rows={rows} columns={columns} loading={loading} />
      </Box>
    </Box>
  );
};

export default SuperLigaPage;
