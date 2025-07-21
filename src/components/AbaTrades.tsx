"use client";
import React from "react";
import { Box } from "@mui/material";
import TradeCard from "./TradeCard";
import { TradeCardData } from "../hooks/useSuperLigaData";

interface AbaTradesProps {
  tradeCards: TradeCardData[];
}

const AbaTrades: React.FC<AbaTradesProps> = ({ tradeCards }) => {
  return (
    <Box display="flex" flexWrap="wrap" justifyContent={"center"} gap={2}>
      {tradeCards.map((card, index) => (
        <TradeCard key={index} card={card} index={index} />
      ))}
    </Box>
  );
};

export default AbaTrades;
