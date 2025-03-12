"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { use } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Project } from "@/types"

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  // Desembrulhar (unwrap) o objeto params usando React.use
  const resolvedParams = use(params)
  const projectId = resolvedParams.id
  
  const router = useRouter()
  const { data: session, status } = useSession()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProject = async () => {
      try {
        setLoading(true)
        // Buscar o projeto específico pelo ID
        const response = await fetch(`/api/projects/${projectId}`)
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Projeto não encontrado")
          }
          throw new Error("Erro ao buscar projeto")
        }
        
        const data = await response.json()
        setProject(data)
        setLoading(false)
      } catch (error) {
        console.error("Erro ao buscar projeto:", error)
        setError(error instanceof Error ? error.message : "Erro desconhecido")
        setLoading(false)
      }
    }

    if (session?.user?.id) {
      fetchProject()
    }
  }, [session?.user?.id, projectId])

  // Verificar autenticação
  if (status === "unauthenticated") {
    router.push("/login")
    return null
  }

  // Mostrar loading durante verificação da sessão
  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Carregando...</h1>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Detalhes do Projeto</h1>
          <Link
            href="/dashboard/projects"
            className="rounded-md bg-gray-200 px-4 py-2 text-gray-800 hover:bg-gray-300"
          >
            Voltar
          </Link>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-12">
            <p className="text-red-500 text-lg">{error}</p>
            <Button asChild className="mt-4">
              <Link href="/dashboard/projects">Voltar para Projetos</Link>
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
          <Link
            href="/dashboard/projects"
            className="rounded-md bg-gray-200 px-4 py-2 text-gray-800 hover:bg-gray-300"
          >
            Voltar
          </Link>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-12">
            <p className="text-center text-gray-500 text-lg">Projeto não encontrado</p>
            <Button asChild className="mt-4">
              <Link href="/dashboard/projects">Voltar para Projetos</Link>
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
        <Link
          href="/dashboard/projects"
          className="rounded-md bg-gray-200 px-4 py-2 text-gray-800 hover:bg-gray-300"
        >
          Voltar
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl">{project.title}</CardTitle>
              <CardDescription className="mt-2">
                <Badge variant="outline">{project.type}</Badge>
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-2">Descrição</h3>
            <p className="text-gray-700 whitespace-pre-line">{project.description}</p>
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
                <p className="font-medium">{new Date(project.createdAt).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Última Atualização</p>
                <p className="font-medium">{new Date(project.updatedAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end space-x-2 border-t">
          <Button 
            variant="outline" 
            asChild
          >
            <Link href={`/dashboard/projects/${project.id}/edit`}>
              Editar Projeto
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
} 