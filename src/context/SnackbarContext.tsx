"use client";
import React, { createContext, useState, useContext, ReactNode } from "react";
import { Snackbar, Alert, Backdrop, CircularProgress } from "@mui/material";

// Definindo o tipo do contexto
interface SnackbarContextType {
  openSnackbar: boolean;
  snackbarMessage: string;
  snackbarSeverity: "success" | "error" | "warning";
  openSnack: (message: string, severity: "success" | "error" | "warning") => void;
  closeSnack: () => void;
  isLoading: boolean;
  openLoading: () => void;
  closeLoading: () => void;
}

const SnackbarContext = createContext<SnackbarContextType | undefined>(undefined);

export const useSnackbarContext = () => {
  const context = useContext(SnackbarContext);
  if (!context) {
    throw new Error("useSnackbarContext must be used within a SnackbarProvider");
  }
  return context;
};

interface SnackbarProviderProps {
  children: ReactNode;
}

export const SnackbarProvider = ({ children }: SnackbarProviderProps) => {
  const [openSnackbar, setOpenSnackbar] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error" | "warning">("success");

  const openSnack = (message: string, severity: "success" | "error" | "warning") => {
    console.log(message);
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setOpenSnackbar(true);
  };

  const closeSnack = () => {
    setOpenSnackbar(false);
  };

  const openLoading = () => {
    setIsLoading(true);
  };

  const closeLoading = () => {
    setIsLoading(false);
  };

  return (
    <SnackbarContext.Provider
      value={{ openSnackbar, snackbarMessage, snackbarSeverity, openSnack, closeSnack, isLoading, openLoading, closeLoading }}
    >
      {children}
      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={closeSnack}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={closeSnack} severity={snackbarSeverity} sx={{ width: "100%" }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
      <Backdrop open={isLoading} sx={{ zIndex: 9999 }}>
        <CircularProgress color="primary" />
      </Backdrop>
    </SnackbarContext.Provider>
  );
};
