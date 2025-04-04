"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { use, useEffect, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { useProjectDetails, useUpdateProject } from "@/hooks/useProjects"
import { projectSchema } from "@/server/db/validators"
import { PROJECT_TYPES } from "@/types"

type ProjectFormData = z.infer<typeof projectSchema>

export default function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const projectId = resolvedParams.id
  const [error, setError] = useState<string | null>(null)

  const router = useRouter()
  const { data: project, isLoading: isLoadingProject } = useProjectDetails(projectId)
  const { mutate: updateProject, isPending: isUpdatingProject } = useUpdateProject()

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      title: "",
      description: "",
      type: undefined,
    },
  })

  // Atualizar o formulário quando os dados do projeto forem carregados
  useEffect(() => {
    if (project) {
      reset({
        title: project.title,
        description: project.description,
        type: project.type as "Disciplina" | "IC" | "TCC" | "Mestrado" | "Doutorado",
      })
    }
  }, [project, reset])


  if (isLoadingProject) {
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

  if (!project) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <div className="rounded-lg border p-6 text-center">
          <h1 className="text-2xl font-bold mb-2">Projeto não encontrado</h1>
          <p className="text-gray-600">Não foi possível encontrar o projeto solicitado.</p>
          <Button onClick={() => router.push("/dashboard/projects")} className="mt-4">
            Voltar aos Projetos
          </Button>
        </div>
      </div>
    )
  }

  const onSubmit = (data: ProjectFormData) => {
    setError(null)

    updateProject(
      {
        id: projectId,
        ...data,
      },
      {
        onSuccess: () => {
          router.push(`/dashboard/projects/${projectId}`)
        },
        onError: (error) => {
          setError(error.message || "Erro ao atualizar projeto")
        },
      }
    )
  }

  const isPending = isUpdatingProject

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
                    <Input id="title" placeholder="Digite o título do projeto" {...field} disabled={isPending} />
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
                      disabled={isPending}
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
                      disabled={isPending}
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
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
