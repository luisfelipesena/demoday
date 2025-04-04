"use client"

import { FileText, PlusCircle } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useProjects } from "@/hooks/useProjects"

export default function ProjectsPage() {
  const { data: projects = [], isLoading: loading } = useProjects()

  // A rota correta para criar um novo projeto
  const newProjectRoute = "/dashboard/projects/new"

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Meus Projetos</h1>
          <p className="text-muted-foreground">Gerencie seus projetos acadêmicos</p>
        </div>
        {projects.length > 0 && (
          <Button asChild>
            <Link href={newProjectRoute}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Novo Projeto
            </Link>
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12">
          <Skeleton className="h-36 w-full" />
        </div>
      ) : projects.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Sem projetos</CardTitle>
            <CardDescription>Você ainda não possui projetos cadastrados</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center p-6">
            <FileText className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="mb-4 text-center text-muted-foreground">
              Comece criando seu primeiro projeto acadêmico para submeter a um Demoday
            </p>
            <Button asChild>
              <Link href={newProjectRoute}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Criar Projeto
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Card key={project.id}>
              <CardHeader>
                <CardTitle>{project.title}</CardTitle>
                <div>
                  <Badge variant="outline">{project.type}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-3">{project.description}</p>
              </CardContent>
              <CardFooter className="justify-between border-t p-4">
                <div className="text-xs text-muted-foreground">
                  Criado em: {new Date(project.createdAt).toLocaleDateString()}
                </div>
                <Button asChild size="sm" variant="outline">
                  <Link href={`/dashboard/projects/${project.id}`}>Ver detalhes</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
