"use client";

import { CssBaseline } from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import { ReactNode } from "react";
import { theme } from "@/theme/theme";
import { AuthProvider } from "@/providers/AuthProvider";

interface Props {
  children: ReactNode;
}

export function AppProvider({ children }: Props) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      <AuthProvider>{children}</AuthProvider>
    </ThemeProvider>
  );
}
