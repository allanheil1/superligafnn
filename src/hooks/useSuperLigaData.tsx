import React, { useState, useMemo, useEffect } from "react";
import Papa from "papaparse";
import { GridColDef } from "@mui/x-data-grid";
import { useSleeperApi } from "../hooks/useSleeperApi";
import { Ligas, LeagueInfo } from "../ligas";
import { LeagueUser, Roster, Transaction, Matchup, PlayerMap, SportState } from "../api/sleeper/types";
import { useSnackbarContext } from "../context/SnackbarContext";
import { getSlpChange } from "../../public/data/SLPrules";
import { Tooltip } from "@mui/material";

export type TableSuperLigaRow = {
  id: string;
  league: string;
  initial_slp: number;
  current_slp: number;
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

  const [initialSlpMap, setInitialSlpMap] = useState<Record<string, number>>({});

  const [nflState, setNflState] = useState<SportState | null>(null);

  useEffect(() => {
    const loadState = async () => {
      openLoading();
      try {
        const state = await api.getNflState();
        setNflState(state);
      } catch (e) {
        openSnack("Erro ao buscar NFL state.", "error");
        console.error(e);
      } finally {
        closeLoading();
      }
    };
    loadState();
  }, []);

  // Carrega CSV de SLP inicial
  useEffect(() => {
    Papa.parse<Record<string, string>>("/data/SLPinicial2025.csv", {
      download: true,
      header: true,
      complete: (results) => {
        const map: Record<string, number> = {};
        results.data.forEach((rec) => {
          const userId = rec["USER ID"];
          const slpStr = rec["SLP INICIAL"];
          if (userId && slpStr) {
            map[userId] = Number(slpStr);
          }
        });
        setInitialSlpMap(map);
        console.log(map);
      },
    });
  }, []);

  // Array de LeagueInfo para cruzamento de dados
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
          const userId = user?.user_id ?? "";
          const slpInitial = initialSlpMap[userId] ?? 0;
          const txCount = transactionCounts[lid]?.[rid] ?? { trades: 0, waivers: 0 };
          const scoresForLeague: Record<string, Record<number, { points: number; result: "W" | "L" | "T" }>> = matchupScores[
            lid
          ] || {};
          const scoresForRoster = scoresForLeague[rid] || {};

          const weekly: Record<string, string> = {};
          let currentSlp = slpInitial;
          for (let wk = 1; wk <= 18; wk++) {
            const sc = scoresForRoster[wk];
            if (!sc) {
              weekly[`week_${wk}`] = "Bye";
              continue;
            }
            const pts = sc.points;
            const res = sc.result;
            const delta = getSlpChange(currentSlp, res);
            currentSlp += delta;

            const sign = delta > 0 ? `+${delta}` : `${delta}`;
            weekly[`week_${wk}`] = `${pts.toFixed(2)} (${res}) - ${currentSlp} (${sign})`;
          }

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
            initial_slp: slpInitial,
            current_slp: currentSlp,
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
    {
      field: "league",
      headerName: "Liga",
      width: 200,
      headerAlign: "left",
      align: "left",
      renderHeader: (params) => (
        <Tooltip title="Nome da liga ao qual o time pertence">
          <span>{params.colDef.headerName}</span>
        </Tooltip>
      ),
    },
    {
      field: "initial_slp",
      headerName: "SLP Inicial",
      width: 120,
      type: "number",
      headerAlign: "left",
      align: "left",
      renderHeader: (params) => (
        <Tooltip title="Super Liga Points no início da temporada de 2025">
          <span>{params.colDef.headerName}</span>
        </Tooltip>
      ),
    },
    {
      field: "current_slp",
      headerName: "SLP Atual",
      headerAlign: "left",
      align: "left",
      width: 140,
      renderCell: (params) => {
        const current = params.value as number;
        const initial = (params.row as TableSuperLigaRow).initial_slp;
        const delta = current - initial;
        const deltaText = delta >= 0 ? `+${delta}` : `${delta}`;

        let styledDelta: React.ReactNode;
        if (delta > 0) {
          styledDelta = <strong style={{ color: "green" }}>{deltaText}</strong>;
        } else if (delta < 0) {
          styledDelta = <strong style={{ color: "red" }}>{deltaText}</strong>;
        } else {
          styledDelta = <span>{deltaText}</span>;
        }

        return (
          <span>
            {current} ({styledDelta})
          </span>
        );
      },
      renderHeader: (params) => (
        <Tooltip title="Super Liga Points atual (+/- diferença em relação ao inicial)">
          <span>{params.colDef.headerName}</span>
        </Tooltip>
      ),
    },
    {
      field: "team",
      headerName: "Time",
      width: 200,
      headerAlign: "left",
      align: "left",
      renderHeader: (params) => (
        <Tooltip title="Nome do time no sleeper">
          <span>{params.colDef.headerName}</span>
        </Tooltip>
      ),
    },
    {
      field: "user_name",
      headerName: "Nome Jogador",
      width: 150,
      headerAlign: "left",
      align: "left",
      renderHeader: (params) => (
        <Tooltip title="Nome do usuário dono do time no sleeper">
          <span>{params.colDef.headerName}</span>
        </Tooltip>
      ),
    },
    {
      field: "wins",
      headerName: "Vitórias",
      width: 120,
      type: "number",
      renderCell: (params) => <strong style={{ color: "green" }}>{params.value}</strong>,
      headerAlign: "left",
      align: "left",
      renderHeader: (params) => (
        <Tooltip title="Numéro de vitórias">
          <span>{params.colDef.headerName}</span>
        </Tooltip>
      ),
    },
    {
      field: "losses",
      headerName: "Derrotas",
      width: 120,
      type: "number",
      renderCell: (params) => <strong style={{ color: "red" }}>{params.value}</strong>,
      headerAlign: "left",
      align: "left",
      renderHeader: (params) => (
        <Tooltip title="Numéro de derrotas">
          <span>{params.colDef.headerName}</span>
        </Tooltip>
      ),
    },
    {
      field: "pf",
      headerName: "PF",
      width: 120,
      type: "number",
      headerAlign: "left",
      align: "left",
      renderHeader: (params) => (
        <Tooltip title="Pontos feitos totais na temporada">
          <span>{params.colDef.headerName}</span>
        </Tooltip>
      ),
    },
    {
      field: "pt",
      headerName: "PT",
      width: 120,
      type: "number",
      headerAlign: "left",
      align: "left",
      renderHeader: (params) => (
        <Tooltip title="Pontos tomados totais na temporada">
          <span>{params.colDef.headerName}</span>
        </Tooltip>
      ),
    },
    {
      field: "waivers",
      headerName: "Waivers",
      width: 100,
      type: "number",
      headerAlign: "left",
      align: "left",
      renderHeader: (params) => (
        <Tooltip title="Quantidade de operações do tipo Waiver realizadas">
          <span>{params.colDef.headerName}</span>
        </Tooltip>
      ),
    },
    {
      field: "trades",
      headerName: "Trades",
      width: 100,
      type: "number",
      headerAlign: "left",
      align: "left",
      renderHeader: (params) => (
        <Tooltip title="Quantidade de operações do tipo Trade realizadas">
          <span>{params.colDef.headerName}</span>
        </Tooltip>
      ),
    },
  ];

  const weeklyScoreColumns: GridColDef<TableSuperLigaRow>[] = [];
  for (let week = 1; week <= 18; week++) {
    weeklyScoreColumns.push({
      field: `week_${week}`,
      headerName: `W${week}`,
      width: 160,
      sortable: true,
      sortComparator: (v1, v2) => {
        const m1 = String(v1).match(/^([\d.]+)/);
        const m2 = String(v2).match(/^([\d.]+)/);
        return parseFloat(m1?.[1] || "0") - parseFloat(m2?.[1] || "0");
      },
      renderCell: (params) => {
        const raw = String(params.value);
        const m = raw.match(/^([\d.]+)\s*\(([WLT])\)\s*[-–]\s*(\d+)\s*\(([+-]?\d+)\)$/);
        if (!m) return raw;
        const [, pts, res, curr, delta] = m;
        const colorRes = res === "W" ? "green" : res === "L" ? "red" : "gray";
        const colorDelta = delta.startsWith("+") ? "green" : "red";

        return (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              lineHeight: 1.2,
              marginTop: 10,
            }}
          >
            <span>
              {pts} (<strong style={{ color: colorRes }}>{res}</strong>)
            </span>
            <span>
              SLP: {curr} (<strong style={{ color: colorDelta }}>{delta}</strong>)
            </span>
          </div>
        );
      },
      renderHeader: (params) => (
        <Tooltip title="Pontos feitos na semana (W: Vitória / L: Derrota) /// SLP atual (+/- SLP ganhos ou perdidos na semana)">
          <span>{params.colDef.headerName}</span>
        </Tooltip>
      ),
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
    nflState,
  };
};
