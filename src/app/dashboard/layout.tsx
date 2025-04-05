"use client"

import type React from "react"

import { DashboardHeader } from "@/components/dashboard/header"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Skeleton } from "@/components/ui/skeleton"
import { useProtectedRoute } from "@/hooks/useProtectedRoute"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Usar o hook useProtectedRoute para verificar a autenticação
  const authStatus = useProtectedRoute();

  // Mostrar estado de carregamento enquanto verifica a autenticação
  if (authStatus === 'loading') {
    return (
      <div className="flex min-h-screen w-full items-center justify-center">
        <Skeleton className="h-12 w-12 rounded-full" /> 
        <p className="ml-4">Verificando autenticação...</p>
      </div>
    );
  }

  // O hook já cuida do redirecionamento para /login se não estiver autenticado
  // Só renderiza o layout do dashboard se estiver autenticado
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <DashboardSidebar />
        <SidebarInset>
          <DashboardHeader />
          <main className="flex-1 p-6">{children}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
