import React from "react";
import { Box, Card, CardHeader, CardContent, Typography, Checkbox } from "@mui/material";
import { TradeCardData } from "../hooks/useSuperLigaData";

interface TradeCardProps {
  card: TradeCardData;
  index: number;
}

const TradeCard: React.FC<TradeCardProps> = ({ card, index }) => (
  <Box sx={{ width: { xs: "100%", sm: "45%", md: "30%" } }}>
    <Card sx={{ border: 2, borderColor: "primary.main" }}>
      <CardHeader
        sx={{ py: "0px", px: "5px", backgroundColor: "secondary.main" }}
        title={card.leagueName}
        action={<Checkbox color="primary" />}
      />
      <CardContent sx={{ p: "5px !important" }}>
        {card.rosters.map(({ rosterId, rosterName, players }) => (
          <Box sx={{ mb: 1 }} key={rosterId}>
            <Box display={"flex"}>
              <Typography fontSize={20} fontWeight={700}>
                {rosterName}
              </Typography>
              <Typography sx={{ ml: 1, alignSelf: "end" }} fontWeight={700}>
                recebe
              </Typography>
            </Box>

            <Typography>
              {players.length > 0
                ? players.map((p, idx) => (
                    <React.Fragment key={p.name}>
                      <Typography component="span">({p.position})</Typography> {p.name}
                      {idx < players.length - 1 && " + "}
                    </React.Fragment>
                  ))
                : "Nenhum jogador"}
            </Typography>
          </Box>
        ))}
      </CardContent>
    </Card>
  </Box>
);

export default TradeCard;
