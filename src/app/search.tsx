import React, { useState } from "react";
import { Box, Button, TextField } from "@mui/material";

interface SearchInputProps {
  onApply: (text: string) => void;
}

const SearchInput: React.FC<SearchInputProps> = ({ onApply }) => {
  const [value, setValue] = useState("");

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      onApply(value);
    }
  };

  return (
    <Box sx={{ display: "flex", gap: 2, my: 2 }}>
      <TextField
        fullWidth
        variant="outlined"
        label="Pesquisar na tabela..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      <Button variant="outlined" onClick={() => onApply(value)}>
        Pesquisar
      </Button>
    </Box>
  );
};

export default SearchInput;
