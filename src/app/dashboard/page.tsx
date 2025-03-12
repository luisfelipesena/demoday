"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { Award, FileText, PlusCircle, Users } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useDemodays } from "@/hooks/useDemoday"
import { Project, Demoday } from "@/types"

export default function DashboardPage() {
  const { data: session } = useSession()
  const userRole = session?.user?.role || "user"
  const { data: demodays, isLoading, error } = useDemodays()
  const [projects, setProjects] = useState<Project[]>([])
  const [loadingProjects, setLoadingProjects] = useState(true)

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoadingProjects(true)
        // Buscar projetos do usuário
        const response = await fetch("/api/projects")
        
        if (!response.ok) {
          throw new Error("Falha ao buscar projetos")
        }
        
        const data = await response.json()
        setProjects(data)
        setLoadingProjects(false)
      } catch (error) {
        console.error("Erro ao buscar projetos:", error)
        setLoadingProjects(false)
      }
    }

    if (session?.user?.id) {
      fetchProjects()
    }
  }, [session?.user?.id])

  // Links corretos para criar projetos e visualizar projetos
  const newProjectRoute = "/dashboard/projects/new"
  const projectsRoute = "/dashboard/projects"

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Bem-vindo ao Demoday, {session?.user?.name}!</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Meus Projetos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingProjects ? (
              <div>Carregando...</div>
            ) : (
              <div className="text-2xl font-bold">{projects.length}</div>
            )}
            <p className="text-xs text-muted-foreground">Projetos cadastrados</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Demodays</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div>Carregando...</div>
            ) : error ? (
              <div>Erro ao carregar demodays</div>
            ) : (
              <div className="text-2xl font-bold">{demodays?.length || 0}</div>
            )}
            <p className="text-xs text-muted-foreground">Eventos em andamento</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Projetos Recentes</CardTitle>
            <CardDescription>Seus projetos mais recentes</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center p-6">
            {loadingProjects ? (
              <div>Carregando projetos...</div>
            ) : projects.length > 0 ? (
              <div className="w-full">
                {projects.slice(0, 3).map((project) => (
                  <div key={project.id} className="border-b pb-3 mb-3 last:border-0 last:mb-0 last:pb-0">
                    <Link href={`/dashboard/projects/${project.id}`} className="font-medium hover:underline">
                      {project.title}
                    </Link>
                    <p className="text-xs text-muted-foreground">{project.type}</p>
                  </div>
                ))}
                <Button asChild size="sm" variant="outline" className="mt-4 w-full">
                  <Link href={projectsRoute}>
                    Ver todos
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="text-center">
                <p className="mb-4 text-muted-foreground">Você ainda não tem projetos cadastrados</p>
                <Button asChild>
                  <Link href={newProjectRoute}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Criar Projeto
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Próximos Eventos</CardTitle>
            <CardDescription>Demodays em andamento ou programados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-primary/10 p-2">
                  <Award className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Demoday 2025</p>
                  <p className="text-sm text-muted-foreground">Inscrições abertas até 30/04/2025</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {userRole === "admin" && (
          <Card>
            <CardHeader>
              <CardTitle>Estatísticas</CardTitle>
              <CardDescription>Visão geral do sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Usuários</span>
                  </div>
                  <span className="font-medium">1</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Projetos</span>
                  </div>
                  <span className="font-medium">{projects.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Demodays</span>
                  </div>
                  <span className="font-medium">{demodays?.length || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
