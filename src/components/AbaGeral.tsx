"use client";
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
}) => {
  // Exportar CSV
  const handleExport = () => {
    if (!filteredRows.length) return;
    const headers = columns.map((col) => col.headerName);
    const rows = filteredRows.map((row) =>
      columns.map((col) => {
        const value = row[col.field as keyof TableSuperLigaRow] ?? "";
        const str = String(value).replace(/"/g, '""');
        return `"${str}"`;
      })
    );
    const csvContent = [headers, ...rows].map((r) => r.join(",")).join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.setAttribute("download", "super_liga.csv");
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <>
      <Box mb={2} sx={{ display: "flex", gap: 2 }}>
        <Button variant="contained" onClick={handleFetchData} disabled={isLoading}>
          {isLoading ? "Buscando..." : "Buscar Dados Super Liga"}
        </Button>
        <Button color="success" variant="outlined" onClick={handleExport} disabled={isLoading || !filteredRows.length}>
          Exportar para CSV
        </Button>
      </Box>

      <SearchInput onApply={(text) => setAppliedFilterText(text)} />

      <Box mt={2} sx={{ height: "75vh", width: "100%" }}>
        {hasMounted && (
          <DataGrid
            rows={filteredRows}
            columns={columns}
            loading={isLoading}
            getRowId={(row) => row.id}
            pageSizeOptions={[12, 50, 100]}
          />
        )}
      </Box>
    </>
  );
};

export default AbaGeral;
