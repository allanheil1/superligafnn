"use client";
import React, { useState, useCallback, useMemo } from "react";
import { Box, Button, Typography, TextField } from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { useSleeperApi } from "../hooks/useSleeperApi";
import { Ligas, LeagueInfo } from "../ligas";
import { LeagueUser, Roster, Transaction } from "../api/sleeper/types";
import { useSnackbarContext } from "../context/SnackbarContext";

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
}

const SuperLigaPage: React.FC = () => {
  const api = useSleeperApi();
  const { openSnack, openLoading, closeLoading, isLoading } = useSnackbarContext();
  const [rows, setRows] = useState<TableSuperLigaRow[]>([]);
  // NOVO: Estado para armazenar o texto do filtro
  const [filterText, setFilterText] = useState("");

  // --- Função para Montar a Lista de Ligas ---
  const getLeagueInfos = useCallback((): LeagueInfo[] => {
    const leagueInfos: LeagueInfo[] = [];
    // Bronze
    for (let i = 9; i <= 88; i++) {
      try {
        leagueInfos.push(Ligas.bronze(i));
      } catch (e) {
        /* Ignorado */
      }
    }
    // Cobre
    for (let i = 45; i <= 55; i++) {
      try {
        leagueInfos.push(Ligas.cobre(i));
      } catch (e) {
        /* Ignorado */
      }
    }
    // Prata
    [58, 8, 7, 6, 5, 4, 3, 2].forEach((i) => {
      try {
        leagueInfos.push(Ligas.prata(i));
      } catch (e) {
        /* Ignorado */
      }
    });
    // Ouro
    try {
      leagueInfos.push(Ligas.ouro(1));
    } catch (e) {
      /* Ignorado */
    }
    // Creators
    leagueInfos.push(Ligas.creators());
    return leagueInfos;
  }, []);

  // --- Função para Buscar Usuários das Ligas ---
  const fetchLeagueUsers = (leagueInfos: LeagueInfo[]): Promise<(LeagueUser[] | null)[]> => {
    const userPromises = leagueInfos.map(
      (info) => api.getLeagueUsers(info.id).catch(() => null) // Adiciona um .catch para não quebrar o Promise.all
    );
    return Promise.all(userPromises);
  };

  // --- Função para Buscar Rosters das Ligas ---
  const fetchLeagueRosters = (leagueInfos: LeagueInfo[]): Promise<(Roster[] | null)[]> => {
    const rosterPromises = leagueInfos.map((info) => api.getRosters(info.id).catch(() => null));
    return Promise.all(rosterPromises);
  };

  // --- Função para Buscar Transações ---
  const fetchLeagueTransactions = async (
    leagueInfos: LeagueInfo[]
  ): Promise<Record<string, Record<string, { trades: number; waivers: number }>>> => {
    const transactionCalls: { leagueId: string; fn: () => Promise<Transaction[] | null> }[] = [];
    leagueInfos.forEach((info) => {
      for (let week = 1; week <= 18; week++) {
        transactionCalls.push({
          leagueId: info.id,
          fn: () => api.getTransactions(info.id, week),
        });
      }
    });

    // O `runInBatches` já gerencia o loading e não dispara snackbar.
    const transactionFns = transactionCalls.map((c) => c.fn);
    const allTransactionsArrays = await api.runInBatches<Transaction[] | null>(transactionFns, 50);

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
      if (tx.type === "trade") {
        transactionCounts[leagueId][actorId].trades += 1;
      }
      if (tx.type === "waiver") {
        transactionCounts[leagueId][actorId].waivers += 1;
      }
    });

    return transactionCounts;
  };

  // --- Função Principal para Gerenciar o Fetch e Montar a Tabela ---
  const handleFetchData = async () => {
    openLoading(); // Inicia o loading global
    setRows([]);

    try {
      const leagueInfos = getLeagueInfos();

      // Rodar as 3 funções em paralelo.
      const [rostersByLeague, usersByLeagueArray, transactionCounts] = await Promise.all([
        fetchLeagueRosters(leagueInfos),
        fetchLeagueUsers(leagueInfos),
        fetchLeagueTransactions(leagueInfos),
      ]);

      // Criamos um mapa de usuários para facilitar a busca (melhora a performance)
      const usersByLeagueMap: Record<string, LeagueUser[]> = {};
      leagueInfos.forEach((info, idx) => {
        usersByLeagueMap[info.id] = usersByLeagueArray[idx] || [];
      });

      const allRows: TableSuperLigaRow[] = leagueInfos.flatMap((info, idx) => {
        const rosters = rostersByLeague[idx] || [];
        const users = usersByLeagueMap[info.id];
        return rosters.map((r) => {
          const user = users?.find((u) => u.user_id === r.owner_id);
          const transactionStats = transactionCounts[info.id]?.[user?.user_id || ""] ?? { trades: 0, waivers: 0 };
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
            trades: transactionStats.trades,
            waivers: transactionStats.waivers,
          };
        });
      });
      setRows(allRows);
      // Dispara um único snackbar de sucesso ao final de tudo.
      openSnack("Dados da Super Liga carregados com sucesso!", "success");
    } catch (error) {
      // Dispara um único snackbar de erro se qualquer promessa falhar.
      openSnack("Erro ao carregar dados da Super Liga.", "error");
      console.error("Error in handleFetchData:", error);
    } finally {
      closeLoading(); // Fecha o loading global
    }
  };

  const filteredRows = useMemo(() => {
    const lowercasedFilter = filterText.toLowerCase();
    if (!lowercasedFilter) {
      return rows; // Se não houver filtro, retorna todas as linhas
    }

    return rows.filter((row) => {
      // Itera sobre todos os valores do objeto da linha
      // e verifica se algum deles inclui o texto do filtro
      return Object.values(row).some((value) => String(value).toLowerCase().includes(lowercasedFilter));
    });
  }, [rows, filterText]);

  const columns: GridColDef<TableSuperLigaRow>[] = [
    { field: "league", headerName: "Liga", width: 200 },
    { field: "team", headerName: "Time", width: 200 },
    { field: "user_name", headerName: "Nome Jogador", width: 150 },
    { field: "user_id", headerName: "ID Jogador", width: 150 },
    { field: "wins", headerName: "Vitórias", width: 100, type: "number" },
    { field: "losses", headerName: "Derrotas", width: 100, type: "number" },
    { field: "pf", headerName: "PF", width: 120, type: "number" },
    { field: "pt", headerName: "PT", width: 120, type: "number" },
    { field: "waivers", headerName: "Waivers", width: 100, type: "number" },
    { field: "trades", headerName: "Trades", width: 100, type: "number" },
  ];

  return (
    <Box p={2}>
      <Typography variant="h4" gutterBottom>
        Super Liga Rosters
      </Typography>
      <Button variant="contained" onClick={handleFetchData} disabled={isLoading}>
        {isLoading ? "Buscando..." : "Buscar Dados Super Liga"}
      </Button>

      <Box sx={{ my: 2 }}>
        <TextField
          fullWidth
          variant="outlined"
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          label="Pesquisar na tabela..."
        />
      </Box>

      <Box mt={2} sx={{ height: "75vh", width: "100%" }}>
        <DataGrid rows={filteredRows} columns={columns} loading={isLoading} getRowId={(row) => row.id} />
      </Box>
    </Box>
  );
};

export default SuperLigaPage;
