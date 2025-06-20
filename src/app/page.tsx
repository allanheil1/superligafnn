"use client";
import React, { useState } from "react";
import { Box, Button, Stack, TextField, Typography } from "@mui/material";
import { useSleeperApi } from "../hooks/useSleeperApi";

const SleeperApiTesterPage: React.FC = () => {
  const api = useSleeperApi();
  const [response, setResponse] = useState<any>(null);

  const handle = async (fn: (...args: any[]) => Promise<any>, prompts: string[]) => {
    const inputs = prompts.map((p) => prompt(p));
    if (inputs.some((input) => input === null)) {
      return;
    }

    const args = inputs.map((v) => {
      const num = Number(v);
      return !isNaN(num) && v?.trim() !== "" ? num : v;
    });

    const res = await fn(...args);
    setResponse(res);
  };

  return (
    <Box p={2}>
      <Typography variant="h4" gutterBottom>
        Sleeper API Tester
      </Typography>
      <Stack spacing={2} mb={2}>
        <Button variant="contained" onClick={() => handle(api.getUser, ["User ID"])}>
          Get User
        </Button>
        <Button variant="contained" onClick={() => handle(api.getLeaguesForUser, ["User ID", "Sport", "Season"])}>
          Get Leagues For User
        </Button>
        <Button variant="contained" onClick={() => handle(api.getLeague, ["League ID"])}>
          Get League
        </Button>
        <Button variant="contained" onClick={() => handle(api.getRosters, ["League ID"])}>
          Get Rosters
        </Button>
        <Button variant="contained" onClick={() => handle(api.getLeagueUsers, ["League ID"])}>
          Get League Users
        </Button>
        <Button variant="contained" onClick={() => handle(api.getMatchups, ["League ID", "Week (number)"])}>
          Get Matchups
        </Button>
        <Button variant="contained" onClick={() => handle(api.getWinnersBracket, ["League ID"])}>
          Get Winners Bracket
        </Button>
        <Button variant="contained" onClick={() => handle(api.getLosersBracket, ["League ID"])}>
          Get Losers Bracket
        </Button>
        <Button variant="contained" onClick={() => handle(api.getTransactions, ["League ID", "Round (number)"])}>
          Get Transactions
        </Button>
        <Button variant="contained" onClick={() => handle(api.getTradedPicks, ["League ID"])}>
          Get Traded Picks
        </Button>
        <Button variant="contained" onClick={() => handle(api.getSportState, ["Sport"])}>
          Get Sport State
        </Button>
        <Button variant="contained" onClick={() => handle(api.getDraftsForUser, ["User ID", "Sport", "Season"])}>
          Get Drafts For User
        </Button>
        <Button variant="contained" onClick={() => handle(api.getDraftsForLeague, ["League ID"])}>
          Get Drafts For League
        </Button>
        <Button variant="contained" onClick={() => handle(api.getDraft, ["Draft ID"])}>
          Get Draft
        </Button>
        <Button variant="contained" onClick={() => handle(api.getDraftPicks, ["Draft ID"])}>
          Get Draft Picks
        </Button>
        <Button variant="contained" onClick={() => handle(api.getDraftTradedPicks, ["Draft ID"])}>
          Get Draft Traded Picks
        </Button>
        <Button variant="contained" onClick={() => handle(api.fetchAllPlayers, [])}>
          Fetch All Players
        </Button>
        <Button
          variant="contained"
          onClick={() => handle(api.getTrendingPlayers, ["Type (add/drop)", "Lookback Hours (optional)", "Limit (optional)"])}
        >
          Get Trending Players
        </Button>
      </Stack>

      <Typography variant="h6" gutterBottom>
        Response JSON
      </Typography>
      <TextField
        multiline
        fullWidth
        minRows={10}
        variant="outlined"
        value={response ? JSON.stringify(response, null, 2) : ""}
        InputProps={{ readOnly: true }}
      />
    </Box>
  );
};

export default SleeperApiTesterPage;
