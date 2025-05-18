"use client"

import { useSession } from "@/lib/auth-client"
import { useRouter } from "next/navigation"
import { use, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useProjectDetails } from "@/hooks/useProjects"
import { formatDate } from "@/utils/date-utils"

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  // Desembrulhar (unwrap) o objeto params usando React.use
  const resolvedParams = use(params)
  const projectId = resolvedParams.id
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false)

  const router = useRouter()
  const { data: session, isPending } = useSession()
  const { data: project, error: queryError } = useProjectDetails(projectId)
  const error = queryError?.message || null

  // Verificar autenticação
  if (!isPending && !session) {
    router.push("/login")
    return null
  }

  // Mostrar loading durante verificação da sessão
  if (isPending) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <div className="mb-6 flex items-center justify-between">
          <Skeleton className="h-10 w-56" />
          <Skeleton className="h-9 w-24" />
        </div>

        <div className="rounded-lg border shadow-sm">
          <div className="p-6 border-b">
            <Skeleton className="h-8 w-72 mb-2" />
            <Skeleton className="h-6 w-24" />
          </div>

          <div className="p-6 space-y-6">
            <div>
              <Skeleton className="h-6 w-32 mb-2" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full mt-2" />
              <Skeleton className="h-4 w-2/3 mt-2" />
            </div>

            <div className="pt-6 border-t">
              <Skeleton className="h-6 w-48 mb-4" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Skeleton className="h-4 w-24 mb-1" />
                  <Skeleton className="h-5 w-48" />
                </div>
                <div>
                  <Skeleton className="h-4 w-24 mb-1" />
                  <Skeleton className="h-5 w-32" />
                </div>
                <div>
                  <Skeleton className="h-4 w-24 mb-1" />
                  <Skeleton className="h-5 w-36" />
                </div>
                <div>
                  <Skeleton className="h-4 w-24 mb-1" />
                  <Skeleton className="h-5 w-36" />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end p-6 border-t">
            <Skeleton className="h-9 w-32" />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Detalhes do Projeto</h1>
          <Button className="rounded-md bg-gray-200 px-4 py-2 text-gray-800 hover:bg-gray-300" onClick={() => router.back()}>
            Voltar
          </Button>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-12">
            <p className="text-red-500 text-lg">{error}</p>
            <Button className="mt-4" onClick={() => router.back()}>
              Voltar
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Detalhes do Projeto</h1>
          <Button className="rounded-md bg-gray-200 px-4 py-2 text-gray-800 hover:bg-gray-300" onClick={() => router.back()}>
            Voltar
          </Button>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-12">
            <p className="text-center text-gray-500 text-lg">Projeto não encontrado</p>
            <Button className="mt-4" onClick={() => router.back()}>
              Voltar
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Detalhes do Projeto</h1>
        <Button className="rounded-md bg-gray-200 px-4 py-2 text-gray-800 hover:bg-gray-300" onClick={() => router.back()}>
          Voltar
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl">{project.title}</CardTitle>
              <div className="mt-2">
                <Badge variant="outline">{project.type}</Badge>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-2">Descrição</h3>
            <div className="relative">
              <div className="relative">
                {!isDescriptionExpanded && project.description && project.description.length > 150 && (
                  <div className="absolute bottom-0 right-0 w-24 h-6 bg-gradient-to-l from-white to-transparent"></div>
                )}
                <p className={`text-gray-700 whitespace-pre-line ${!isDescriptionExpanded && project.description && project.description.length > 150 ? "line-clamp-3" : ""}`}>
                  {project.description}
                </p>
              </div>
              {project.description && project.description.length > 150 && (
                <Button 
                  variant="link" 
                  className="p-0 h-auto text-xs font-medium text-primary hover:no-underline mt-1"
                  onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                >
                  {isDescriptionExpanded ? "Ver menos" : "Ver mais"}
                </Button>
              )}
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="text-lg font-medium mb-2">Informações Adicionais</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">ID do Projeto</p>
                <p className="font-medium">{project.id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Tipo</p>
                <p className="font-medium">{project.type}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Data de Criação</p>
                <p className="font-medium">{formatDate(project.createdAt)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Última Atualização</p>
                <p className="font-medium">{formatDate(project.updatedAt)}</p>
              </div>
              {project.authors && (
                <div>
                  <p className="text-sm text-gray-500">Autores</p>
                  <p className="font-medium">{project.authors}</p>
                </div>
              )}
              {project.developmentYear && (
                <div>
                  <p className="text-sm text-gray-500">Ano de Desenvolvimento</p>
                  <p className="font-medium">{project.developmentYear}</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end space-x-2 border-t">
        </CardFooter>
      </Card>
    </div>
  )
}
