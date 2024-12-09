"use client";

import React from "react";
import { ThemeProvider } from "./theme/provider";
import { Toaster } from "react-hot-toast";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      {children}
      <Toaster position="bottom-right" />
    </ThemeProvider>
  );
}
