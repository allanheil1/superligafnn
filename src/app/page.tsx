"use client";
import React from "react";
import { Box, Tabs, Tab, Tooltip } from "@mui/material";
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
    nflState,
  } = useSuperLigaData();

  return (
    <Box p={2}>
      <Box display="flex" justifyContent="start">
        <Tooltip title="Super Liga de Fantasy 2025">
          <img src="/images/colored-logo.png" alt="Super Liga 2025 Logo" style={{ width: 50, height: 50 }} />
        </Tooltip>

        <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 2 }}>
          <Tab label="Visão Geral" value="grid" />
          <Tab disabled={!tradesLoaded} label="Trades" value="trades" />
        </Tabs>
      </Box>

      {activeTab === "grid" ? (
        <AbaGeral
          filteredRows={filteredRows}
          columns={columns}
          handleFetchData={handleFetchData}
          setAppliedFilterText={setAppliedFilterText}
          isLoading={isLoading}
          hasMounted={hasMounted}
          nflState={nflState}
        />
      ) : (
        <AbaTrades tradeCards={tradeCards} />
      )}
    </Box>
  );
};

export default SuperLigaPage;
