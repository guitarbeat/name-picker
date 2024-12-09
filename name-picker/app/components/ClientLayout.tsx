"use client";

import React from "react";
import { Providers } from "../providers";

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <body className="min-h-screen bg-[hsl(224,71%,4%)] text-[hsl(213,31%,91%)]">
      <Providers>{children}</Providers>
    </body>
  );
} 