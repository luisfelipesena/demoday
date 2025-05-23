"use client";

import { useProtectedRoute } from "@/hooks/useProtectedRoute";
import { Loader } from "lucide-react";
import { PropsWithChildren } from "react";

export function ProtectedClientPage({ children }: PropsWithChildren) {
  const authStatus = useProtectedRoute();

  if (authStatus === 'loading') {
    return (
      <div className="flex min-h-screen w-full items-center justify-center">
        <Loader className="h-12 w-12 rounded-full animate-spin" />
        <p className="ml-4">Verificando autenticação...</p>
      </div>
    );
  }

  // O hook já cuida do redirecionamento para /login
  // Só renderiza o conteúdo se estiver autenticado
  return <>{children}</>;
} 