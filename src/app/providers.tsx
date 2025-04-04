"use client";

import { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

interface ProvidersProps {
  children: ReactNode;
}

// Create a client
const queryClient = new QueryClient();

export function Providers({ children }: ProvidersProps) {
  return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
  );
}
