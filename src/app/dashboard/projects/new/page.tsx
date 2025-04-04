"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useCreateProject } from "@/hooks/useProjects"
import { projectSchema } from "@/server/db/validators"
import { PROJECT_TYPES } from "@/types"

type ProjectFormData = z.infer<typeof projectSchema>

export default function NewProjectPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const { mutate: createProject, isPending: isCreatingProject } = useCreateProject()

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      title: "",
      description: "",
      type: undefined,
    },
  })


  const onSubmit = (data: ProjectFormData) => {
    setError(null)

    createProject(data, {
      onSuccess: () => {
        // Redirecionar para a página de projetos após sucesso
        router.push("/dashboard/projects")
      },
      onError: (error) => {
        setError(error.message || "Ocorreu um erro ao criar o projeto")
      },
    })
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Criar novo projeto</h1>
        <Link href="/dashboard/projects" className="rounded-md bg-gray-200 px-4 py-2 text-gray-800 hover:bg-gray-300">
          Voltar
        </Link>
      </div>

      {error && <div className="mb-4 rounded-md bg-red-100 p-4 text-red-700">{error}</div>}

      <Card>
        <CardHeader>
          <CardTitle>Dados do Projeto</CardTitle>
          <CardDescription>Preencha as informações do seu projeto acadêmico</CardDescription>
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
                    <Input
                      id="title"
                      placeholder="Digite o título do projeto"
                      {...field}
                      disabled={isCreatingProject}
                    />
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
                      disabled={isCreatingProject}
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
                      value={field.value || ""}
                      disabled={isCreatingProject}
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
              onClick={() => router.push("/dashboard/projects")}
              disabled={isCreatingProject}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isCreatingProject}>
              {isCreatingProject ? "Salvando..." : "Salvar Projeto"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
