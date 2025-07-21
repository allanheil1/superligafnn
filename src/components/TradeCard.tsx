import React from "react";
import { Box, Card, CardHeader, CardContent, Typography } from "@mui/material";
import { TradeCardData } from "../hooks/useSuperLigaData";

interface TradeCardProps {
  card: TradeCardData;
  index: number;
}

const TradeCard: React.FC<TradeCardProps> = ({ card, index }) => (
  <Box sx={{ width: { xs: "100%", sm: "50%", md: "33.333%" } }}>
    <Card>
      <CardHeader title={`Trade #${index + 1}`} subheader={card.leagueName} />
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
);

export default TradeCard;
