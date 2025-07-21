"use client";
import React from "react";
import { Box, Button, IconButton, Tooltip, Typography } from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutline";
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
  nflState: any;
}

const AbaGeral: React.FC<AbaGeralProps> = ({
  filteredRows,
  columns,
  handleFetchData,
  setAppliedFilterText,
  isLoading,
  hasMounted,
  nflState,
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
        <Tooltip enterDelay={300} enterNextDelay={300} title={"Dispara requisições para a API do sleeper"}>
          <Button
            variant="contained"
            onClick={handleFetchData}
            disabled={isLoading}
            endIcon={!isLoading ? <img src="/images/sleeper-logo.png" alt="Logo" style={{ width: 18, height: 18 }} /> : <></>}
          >
            {isLoading ? "Buscando..." : "Buscar Dados Sleeper"}
          </Button>
        </Tooltip>
        <Tooltip enterDelay={300} enterNextDelay={300} title={"Download de arquivo .csv"}>
          <Button color="amareloForteSL" variant="contained" onClick={handleExport} disabled={isLoading || !filteredRows.length}>
            Exportar para CSV
          </Button>
        </Tooltip>
        <Tooltip
          enterDelay={300}
          placement="right"
          title={
            <Box>
              {nflState &&
                Object.entries(nflState).map(([key, val]) => (
                  <Typography key={key} component="div" sx={{ fontSize: "0.875rem" }}>
                    {key}: {val?.toString()}
                  </Typography>
                ))}
            </Box>
          }
          slotProps={{
            tooltip: {
              sx: {
                fontSize: "0.975rem",
                whiteSpace: "normal",
              },
            },
          }}
        >
          <IconButton aria-label="informação NFL State" sx={{ width: 20, height: 20, p: 0 }}>
            <InfoOutlinedIcon color="primary" sx={{ fontSize: 30, mt: 2 }} />
          </IconButton>
        </Tooltip>
      </Box>

      <SearchInput onApply={(text) => setAppliedFilterText(text)} />

      <Box
        mt={2}
        sx={{
          height: "75vh",
          width: "100%",
          "& .MuiDataGrid-root, .MuiDataGrid-cell, .MuiDataGrid-columnHeaders, .MuiDataGrid-virtualScroller, .MuiDataGrid-footerContainer":
            {
              backgroundColor: "transparent",
            },
        }}
      >
        {hasMounted && (
          <DataGrid
            rows={filteredRows}
            columns={columns}
            loading={isLoading}
            getRowId={(row) => row.id}
            pageSizeOptions={[12, 50, 100]}
            localeText={{
              noRowsLabel: "Nenhum resultado encontrado",
            }}
          />
        )}
      </Box>
    </>
  );
};

export default AbaGeral;
