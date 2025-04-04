"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Award, BarChart, FileText, GraduationCap, Home, LogOut, PlusCircle, Settings, Users } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { signOut, useSession } from "@/lib/auth-client"
import { Skeleton } from "@/components/ui/skeleton"
import { useRouter } from "next/navigation"
export function DashboardSidebar() {
  const pathname = usePathname()
  const { data: session, isPending: loading } = useSession()
  const userRole = session?.user?.role || "user"
  const router = useRouter()
  const isActive = (path: string) => {
    return pathname === path
  }

  return (
    <Sidebar>
      <SidebarHeader className="border-b">
        <div className="flex items-center gap-2 px-4 py-2">
          <GraduationCap className="h-6 w-6" />
          <span className="text-xl font-bold">Demoday</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navegação</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/dashboard")}>
                  <Link href="/dashboard">
                    <Home className="mr-2 h-4 w-4" />
                    <span>Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/dashboard/projects")}>
                  <Link href="/dashboard/projects">
                    <FileText className="mr-2 h-4 w-4" />
                    <span>Meus Projetos</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/dashboard/projects/new")}>
                  <Link href="/dashboard/projects/new">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    <span>Novo Projeto</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        {loading && (
          <SidebarGroup>
            <SidebarGroupContent className="flex flex-col gap-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Menu específico para professores */}
        {userRole === "professor" && (
          <SidebarGroup>
            <SidebarGroupLabel>Professor</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive("/dashboard/evaluations")}>
                    <Link href="/dashboard/evaluations">
                      <Award className="mr-2 h-4 w-4" />
                      <span>Avaliações</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive("/dashboard/reports")}>
                    <Link href="/dashboard/reports">
                      <BarChart className="mr-2 h-4 w-4" />
                      <span>Relatórios</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Menu específico para administradores */}
        {userRole === "admin" && (
          <SidebarGroup>
            <SidebarGroupLabel>Administração</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive("/dashboard/users")}>
                    <Link href="/dashboard/users">
                      <Users className="mr-2 h-4 w-4" />
                      <span>Usuários</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive("/dashboard/admin/demoday")}>
                    <Link href="/dashboard/admin/demoday">
                      <GraduationCap className="mr-2 h-4 w-4" />
                      <span>Demodays</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive("/dashboard/settings")}>
                    <Link href="/dashboard/settings">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Configurações</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter className="border-t p-4">
        <Button variant="outline" className="w-full justify-start" onClick={() => signOut({
          fetchOptions: {
            onSuccess: () => {
              router.push("/"); 
            },
          },
        })}>
          <LogOut className="mr-2 h-4 w-4" />
          Sair
        </Button>
      </SidebarFooter>
    </Sidebar>
  )
}
