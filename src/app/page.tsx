// src/pages/SuperLigaPage.tsx
"use client";
import React from "react";
import { Box, Typography, Tabs, Tab } from "@mui/material";
import AbaGeral from "../components/AbaGeral";
import AbaTrades from "../components/AbaTrades";
import { useSuperLigaData } from "../hooks/useSuperLigaData";

const SuperLigaPage: React.FC = () => {
  const {
    activeTab,
    handleTabChange,
    filteredRows,
    columns,
    handleFetchData,
    setAppliedFilterText,
    isLoading,
    hasMounted,
    tradeCards,
    tradesLoaded,
  } = useSuperLigaData();

  return (
    <Box p={2}>
      <Typography variant="h4" gutterBottom>
        Super Liga 2025
      </Typography>

      <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 2 }}>
        <Tab label="Visão Geral" value="grid" />
        <Tab disabled={!tradesLoaded} label="Trades" value="trades" />
      </Tabs>

      {activeTab === "grid" ? (
        <AbaGeral
          filteredRows={filteredRows}
          columns={columns}
          handleFetchData={handleFetchData}
          setAppliedFilterText={setAppliedFilterText}
          isLoading={isLoading}
          hasMounted={hasMounted}
        />
      ) : (
        <AbaTrades tradeCards={tradeCards} />
      )}
    </Box>
  );
};

export default SuperLigaPage;
