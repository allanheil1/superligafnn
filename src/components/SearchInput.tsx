// src/components/SearchInput.tsx
"use client";
import React, { useState } from "react";
import { Box, Button, TextField, Tooltip } from "@mui/material";

interface SearchInputProps {
  onApply: (text: string) => void;
}

const SearchInput: React.FC<SearchInputProps> = ({ onApply }) => {
  const [value, setValue] = useState("");

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") onApply(value);
  };

  return (
    <Box sx={{ display: "flex", gap: 2, my: 2, alignItems: "center" }}>
      <TextField
        fullWidth
        variant="outlined"
        label="Pesquisar na tabela..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        size="small"
        margin="dense"
        slotProps={{
          root: {
            sx: {
              height: 38,
              "& .MuiInputLabel-root": {
                fontSize: "14px",
              },
            },
          },
          input: {
            sx: {
              padding: 0,
              height: "100%",
              boxSizing: "border-box",
            },
          },
        }}
      />
      <Tooltip enterDelay={300} enterNextDelay={300} title={"Pesquisa o valor digitado em qualquer coluna da tabela"}>
        <Button color="primary" variant="contained" onClick={() => onApply(value)} sx={{ height: 38, mt: "4px" }}>
          Pesquisar
        </Button>
      </Tooltip>
    </Box>
  );
};

export default SearchInput;
