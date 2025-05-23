"use client"

import type React from "react"
import { useSession } from "@/lib/auth-client"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

import { DashboardHeader } from "@/components/dashboard/header"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Skeleton } from "@/components/ui/skeleton"
import { Loader } from "lucide-react"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (!isPending && !session) {
      router.replace("/login")
    }
  }, [session, isPending, router])

  // Mostrar estado de carregamento enquanto verifica a autenticação
  if (isPending) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center">
        <Loader className="h-12 w-12 rounded-full animate-spin" />
        <p className="ml-4">Verificando autenticação...</p>
      </div>
    );
  }

  // Não renderiza nada durante o redirecionamento para o login
  if (!session) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center">
        <p>Redirecionando para o login...</p>
      </div>
    );
  }

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
