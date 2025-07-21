// src/components/AbaGeral.tsx
import React from "react";
import { Box, Button } from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import SearchInput from "./SearchInput";
import { TableSuperLigaRow } from "../hooks/useSuperLigaData";

interface AbaGeralProps {
  filteredRows: TableSuperLigaRow[];
  columns: GridColDef<TableSuperLigaRow>[];
  handleFetchData: () => Promise<void>;
  setAppliedFilterText: (text: string) => void;
  isLoading: boolean;
  hasMounted: boolean;
}

const AbaGeral: React.FC<AbaGeralProps> = ({
  filteredRows,
  columns,
  handleFetchData,
  setAppliedFilterText,
  isLoading,
  hasMounted,
}) => (
  <>
    <Button variant="contained" onClick={handleFetchData} disabled={isLoading}>
      {isLoading ? "Buscando..." : "Buscar Dados Super Liga"}
    </Button>
    <SearchInput onApply={(text) => setAppliedFilterText(text)} />
    <Box mt={2} sx={{ height: "75vh", width: "100%" }}>
      {hasMounted && <DataGrid rows={filteredRows} columns={columns} loading={isLoading} getRowId={(row) => row.id} />}
    </Box>
  </>
);

export default AbaGeral;
