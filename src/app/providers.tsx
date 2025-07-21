// app/Providers.tsx  (ou onde você chama createTheme)
"use client";
import type { ReactNode } from "react";
import { ThemeProvider, createTheme, CssBaseline } from "@mui/material";

const theme = createTheme({
  palette: {
    primary: { main: "#0F3063" },
    secondary: { main: "#FCC127" },
    amareloForteSL: {
      main: "#F6A415",
      dark: "#B77707",
      contrastText: "#0F3063",
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          margin: 0,
          minHeight: "100vh",
          background: "linear-gradient(180deg, #f2f5f6 0%, #e6eefc 100%)",
        },
      },
    },
  },
});

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
