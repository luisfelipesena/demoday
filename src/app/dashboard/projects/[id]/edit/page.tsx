"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { use, useEffect, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { projectSchema } from "@/server/db/validators"
import { PROJECT_TYPES } from "@/types"

type ProjectFormData = z.infer<typeof projectSchema>

export default function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  // Desembrulhar (unwrap) o objeto params usando React.use
  const resolvedParams = use(params)
  const projectId = resolvedParams.id

  const router = useRouter()
  const { data: session, status } = useSession()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      title: "",
      description: "",
      type: undefined,
    },
  })

  // Carregar dados do projeto ao iniciar
  useEffect(() => {
    const fetchProject = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/projects/${projectId}`)

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Projeto não encontrado")
          }
          throw new Error("Erro ao buscar projeto")
        }

        const project = await response.json()

        // Preencher o formulário com os dados do projeto
        reset({
          title: project.title,
          description: project.description,
          type: project.type,
        })

        setLoading(false)
      } catch (error) {
        console.error("Erro ao carregar projeto:", error)
        setError(error instanceof Error ? error.message : "Erro desconhecido")
        setLoading(false)
      }
    }

    if (session?.user?.id) {
      fetchProject()
    }
  }, [session?.user?.id, projectId, reset])

  // Verificar autenticação
  if (status === "unauthenticated") {
    router.push("/login")
    return null
  }

  // Mostrar loading durante verificação da sessão
  if (status === "loading" || loading) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <div className="mb-6 flex items-center justify-between">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-9 w-24" />
        </div>

        <div className="rounded-lg border p-6 shadow-sm">
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="h-6 w-64 mb-8" />

          <div className="space-y-6">
            <div>
              <Skeleton className="h-5 w-36 mb-2" />
              <Skeleton className="h-10 w-full" />
            </div>

            <div>
              <Skeleton className="h-5 w-24 mb-2" />
              <Skeleton className="h-32 w-full" />
            </div>

            <div>
              <Skeleton className="h-5 w-32 mb-2" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>

          <div className="flex justify-end space-x-2 mt-8">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-40" />
          </div>
        </div>
      </div>
    )
  }

  const onSubmit = async (data: ProjectFormData) => {
    setError(null)

    try {
      // Enviar dados atualizados para a API
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      const responseData = await response.json()

      if (!response.ok) {
        throw new Error(responseData.error || "Erro ao atualizar projeto")
      }

      // Redirecionar para a página de detalhes do projeto após sucesso
      router.push(`/dashboard/projects/${projectId}`)
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message)
      } else {
        setError("Ocorreu um erro ao atualizar o projeto")
      }
    }
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Editar Projeto</h1>
        <Link
          href={`/dashboard/projects/${projectId}`}
          className="rounded-md bg-gray-200 px-4 py-2 text-gray-800 hover:bg-gray-300"
        >
          Voltar
        </Link>
      </div>

      {error && <div className="mb-4 rounded-md bg-red-100 p-4 text-red-700">{error}</div>}

      <Card>
        <CardHeader>
          <CardTitle>Dados do Projeto</CardTitle>
          <CardDescription>Edite as informações do seu projeto acadêmico</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium">
                Título do Projeto
              </label>
              <Controller
                name="title"
                control={control}
                render={({ field, fieldState }) => (
                  <div>
                    <Input id="title" placeholder="Digite o título do projeto" {...field} disabled={isSubmitting} />
                    {fieldState.error && <p className="mt-1 text-xs text-red-500">{fieldState.error.message}</p>}
                  </div>
                )}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">
                Descrição
              </label>
              <Controller
                name="description"
                control={control}
                render={({ field, fieldState }) => (
                  <div>
                    <textarea
                      id="description"
                      placeholder="Descreva seu projeto"
                      {...field}
                      disabled={isSubmitting}
                      className="h-32 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                    {fieldState.error && <p className="mt-1 text-xs text-red-500">{fieldState.error.message}</p>}
                  </div>
                )}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="type" className="text-sm font-medium">
                Tipo de Projeto
              </label>
              <Controller
                name="type"
                control={control}
                render={({ field, fieldState }) => (
                  <div>
                    <select
                      id="type"
                      {...field}
                      disabled={isSubmitting}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="" disabled>
                        Selecione um tipo
                      </option>
                      {PROJECT_TYPES.map((projectType) => (
                        <option key={projectType} value={projectType}>
                          {projectType}
                        </option>
                      ))}
                    </select>
                    {fieldState.error && <p className="mt-1 text-xs text-red-500">{fieldState.error.message}</p>}
                  </div>
                )}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/dashboard/projects/${projectId}`)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
