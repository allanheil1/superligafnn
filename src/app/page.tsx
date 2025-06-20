"use client";
import React, { useState } from "react";
import { Box, Button, Typography } from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { useSleeperApi } from "../hooks/useSleeperApi";
import { Ligas, LeagueInfo } from "../ligas";
import { LeagueUser, Roster } from "../api/sleeper/types";

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

    const usersByLeague = await Promise.all(userPromises);
    const rostersByLeague = await Promise.all(rosterPromises);

    // Mapa de leagueId -> LeagueUser[]
    const leagueUsersMap: Record<string, LeagueUser[]> = {};
    leagueInfos.forEach((info, idx) => {
      leagueUsersMap[info.id] = usersByLeague[idx] || [];
    });

    // Agrega todos os rosters com display_name e nome do time
    const allRows = leagueInfos.flatMap((info, idx) => {
      const rosters = rostersByLeague[idx] || [];
      const users = leagueUsersMap[info.id];
      return rosters.map((r) => {
        const user = users.find((u) => u.user_id === r.owner_id);
        return {
          id: `${info.id}-${r.roster_id}`,
          league: info.name,
          roster_id: r.roster_id,
          owner: user?.display_name || r.owner_id,
          team: user?.display_name || "",
          wins: r.settings?.wins ?? 0,
          starters: r.starters?.join(", "),
          players: r.players?.join(", "),
        };
      });
    });

    setRows(allRows);
    setLoading(false);
  };

  const columns: GridColDef[] = [
    { field: "league", headerName: "Liga", width: 200 },
    { field: "roster_id", headerName: "Roster ID", width: 150, type: "number" },
    { field: "owner", headerName: "Dono", width: 200 },
    { field: "team", headerName: "Time", width: 200 },
    { field: "wins", headerName: "Vitórias", width: 120, type: "number" },
    { field: "starters", headerName: "Starters", width: 300 },
    { field: "players", headerName: "Players", width: 300 },
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
