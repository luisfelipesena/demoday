"use client"

import { AlertCircle, CalendarCheck, Loader2, Save, X } from "lucide-react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useSession } from "@/lib/auth-client"
import { useRouter } from "next/navigation"
import { useState, useEffect, use } from "react"
import { Controller, useForm } from "react-hook-form"
import { z } from "zod"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { projectSchema } from "@/server/db/validators"
import { PROJECT_TYPES } from "@/types"

type EditProjectFormData = z.infer<typeof projectSchema>

interface EditProjectProps {
  params: Promise<{ id: string }>
}

export default function EditProjectPage({ params }: EditProjectProps) {
  const router = useRouter()
  const resolvedParams = use(params)
  const projectId = resolvedParams.id
  const { data: session, isPending } = useSession()
  const [error, setError] = useState<string | null>(null)
  const queryClient = useQueryClient()

  // Buscar dados do projeto
  const { data: project, isLoading: isLoadingProject } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${projectId}`)
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erro ao carregar projeto")
      }
      return response.json()
    },
    enabled: !!projectId,
  })

  // Mutation para atualizar projeto
  const updateProjectMutation = useMutation({
    mutationFn: async (data: EditProjectFormData) => {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erro ao atualizar projeto")
      }

      return response.json()
    },
    onSuccess: () => {
      toast.success("Projeto atualizado com sucesso!")
      queryClient.invalidateQueries({ queryKey: ["project", projectId] })
      router.push("/dashboard/projects")
    },
    onError: (error: Error) => {
      setError(error.message)
      toast.error(error.message)
    },
  })

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<EditProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      title: "",
      description: "",
      type: undefined,
      videoUrl: "",
      repositoryUrl: "",
      developmentYear: new Date().getFullYear().toString(),
      authors: "",
      contactEmail: "",
      contactPhone: "",
      advisorName: "",
    },
  })

  // Atualizar formulário quando dados do projeto chegarem
  useEffect(() => {
    if (project) {
      reset({
        title: project.title || "",
        description: project.description || "",
        type: project.type || undefined,
        videoUrl: project.videoUrl || "",
        repositoryUrl: project.repositoryUrl || "",
        developmentYear: project.developmentYear || new Date().getFullYear().toString(),
        authors: project.authors || "",
        contactEmail: project.contactEmail || "",
        contactPhone: project.contactPhone || "",
        advisorName: project.advisorName || "",
      })
    }
  }, [project, reset])

  // Verificar autenticação
  if (!isPending && !session) {
    router.push("/login")
    return null
  }

  // Mostrar loading durante verificação da sessão
  if (isPending || isLoadingProject) {
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

  // Verificar se o projeto existe
  if (!project) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-amber-600">Projeto não encontrado</CardTitle>
            <CardDescription>
              Não foi possível encontrar o projeto especificado.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center p-6">
            <AlertCircle className="h-16 w-16 text-amber-500 mb-4" />
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button onClick={() => router.push("/dashboard/projects")}>
              Voltar aos Projetos
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  const onSubmit = (data: EditProjectFormData) => {
    setError(null)
    updateProjectMutation.mutate(data)
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Editar Projeto</h1>
        <Button variant="outline" onClick={() => router.back()}>
          Voltar
        </Button>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-100 p-4 text-red-700 flex items-center gap-2">
          <X className="h-4 w-4" />
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Editar {project.title}</CardTitle>
          <CardDescription>
            Atualize as informações do seu projeto. Lembre-se de que você só pode editar projetos durante o período de submissão.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium">
                Título do Trabalho*
              </label>
              <Controller
                name="title"
                control={control}
                render={({ field, fieldState }) => (
                  <div>
                    <Input
                      id="title"
                      placeholder="Digite o título do seu trabalho"
                      {...field}
                      disabled={updateProjectMutation.isPending}
                    />
                    {fieldState.error && <p className="mt-1 text-xs text-red-500">{fieldState.error.message}</p>}
                  </div>
                )}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">
                Descrição*
              </label>
              <Controller
                name="description"
                control={control}
                render={({ field, fieldState }) => (
                  <div>
                    <textarea
                      id="description"
                      placeholder="Descreva seu trabalho, seus objetivos, metodologia e resultados"
                      {...field}
                      disabled={updateProjectMutation.isPending}
                      className="h-32 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                    {fieldState.error && <p className="mt-1 text-xs text-red-500">{fieldState.error.message}</p>}
                  </div>
                )}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="type" className="text-sm font-medium">
                Categoria do Trabalho*
              </label>
              <Controller
                name="type"
                control={control}
                render={({ field, fieldState }) => (
                  <div>
                    <select
                      id="type"
                      {...field}
                      value={field.value || ""}
                      disabled={updateProjectMutation.isPending}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="" disabled>
                        Selecione uma categoria
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

            <div className="space-y-2">
              <label htmlFor="authors" className="text-sm font-medium">
                Autores (nomes completos)*
              </label>
              <Controller
                name="authors"
                control={control}
                render={({ field, fieldState }) => (
                  <div>
                    <Input
                      id="authors"
                      placeholder="Nome completo dos autores (separados por vírgula)"
                      {...field}
                      disabled={updateProjectMutation.isPending}
                    />
                    {fieldState.error && <p className="mt-1 text-xs text-red-500">{fieldState.error.message}</p>}
                  </div>
                )}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="contactEmail" className="text-sm font-medium">
                Email do contato principal*
              </label>
              <Controller
                name="contactEmail"
                control={control}
                render={({ field, fieldState }) => (
                  <div>
                    <Input
                      id="contactEmail"
                      type="email"
                      placeholder="email@exemplo.com"
                      {...field}
                      disabled={updateProjectMutation.isPending}
                    />
                    {fieldState.error && <p className="mt-1 text-xs text-red-500">{fieldState.error.message}</p>}
                  </div>
                )}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="contactPhone" className="text-sm font-medium">
                Celular do contato principal*
              </label>
              <Controller
                name="contactPhone"
                control={control}
                render={({ field, fieldState }) => (
                  <div>
                    <Input
                      id="contactPhone"
                      type="tel"
                      placeholder="(xx) xxxxx-xxxx"
                      {...field}
                      disabled={updateProjectMutation.isPending}
                    />
                    {fieldState.error && <p className="mt-1 text-xs text-red-500">{fieldState.error.message}</p>}
                  </div>
                )}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="advisorName" className="text-sm font-medium">
                Orientador/Professor da disciplina*
              </label>
              <Controller
                name="advisorName"
                control={control}
                render={({ field, fieldState }) => (
                  <div>
                    <Input
                      id="advisorName"
                      placeholder="Nome completo do orientador/professor"
                      {...field}
                      disabled={updateProjectMutation.isPending}
                    />
                    {fieldState.error && <p className="mt-1 text-xs text-red-500">{fieldState.error.message}</p>}
                  </div>
                )}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="developmentYear" className="text-sm font-medium">
                Ano de Desenvolvimento*
              </label>
              <Controller
                name="developmentYear"
                control={control}
                render={({ field, fieldState }) => (
                  <div>
                    <Input
                      id="developmentYear"
                      placeholder="Ano (YYYY)"
                      {...field}
                      disabled={updateProjectMutation.isPending}
                    />
                    {fieldState.error && <p className="mt-1 text-xs text-red-500">{fieldState.error.message}</p>}
                  </div>
                )}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="videoUrl" className="text-sm font-medium">
                Link do Vídeo de Apresentação* (vídeo com até 3 minutos)
              </label>
              <Controller
                name="videoUrl"
                control={control}
                render={({ field, fieldState }) => (
                  <div>
                    <Input
                      id="videoUrl"
                      placeholder="URL do vídeo (YouTube, Vimeo, etc.)"
                      {...field}
                      disabled={updateProjectMutation.isPending}
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      O vídeo deve ter no máximo 3 minutos de duração
                    </p>
                    {fieldState.error && <p className="mt-1 text-xs text-red-500">{fieldState.error.message}</p>}
                  </div>
                )}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="repositoryUrl" className="text-sm font-medium">
                Link do Repositório (opcional)
              </label>
              <Controller
                name="repositoryUrl"
                control={control}
                render={({ field, fieldState }) => (
                  <div>
                    <Input
                      id="repositoryUrl"
                      placeholder="URL do repositório (GitHub, GitLab, etc.)"
                      {...field}
                      disabled={updateProjectMutation.isPending}
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Se disponível, adicione o link do repositório do seu projeto
                    </p>
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
              onClick={() => router.back()}
              disabled={updateProjectMutation.isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={updateProjectMutation.isPending}>
              {updateProjectMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Salvar Alterações
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
