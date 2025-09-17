"use client"

import { AlertCircle, CalendarCheck } from "lucide-react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useSession } from "@/lib/auth-client"
import { useRouter } from "next/navigation"
import { useState, useEffect, use } from "react"
import { Controller, useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { useDemodayDetails } from "@/hooks/useDemoday"
import { projectSubmissionSchema } from "@/server/db/validators"
import { PROJECT_TYPES } from "@/types"
import { useSubmitWork } from "@/hooks/useSubmitWork"
import { isInSubmissionPhase, formatDate } from "@/utils/date-utils"

type SubmissionFormData = z.infer<typeof projectSubmissionSchema>

interface DemodaySubmitProps {
  params: Promise<{ id: string }>
}

export default function SubmitWorkPage({ params }: DemodaySubmitProps) {
  const router = useRouter()
  const resolvedParams = use(params)
  const demodayId = resolvedParams.id
  const { data: session, isPending } = useSession()
  const [error, setError] = useState<string | null>(null)
  const { data: demoday } = useDemodayDetails(demodayId)
  const { submitWork, isSubmitting } = useSubmitWork()

  const {
    control,
    handleSubmit,
    setValue,
  } = useForm<SubmissionFormData>({
    resolver: zodResolver(projectSubmissionSchema),
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
      demodayId: demodayId,
    },
  })

  // Definir o demodayId quando o componente montar
  useEffect(() => {
    setValue("demodayId", demodayId)
  }, [demodayId, setValue])

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

  // Verificar se o demoday existe
  if (!demoday) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-amber-600">DemoDay não encontrado</CardTitle>
            <CardDescription>
              Não foi possível encontrar o DemoDay especificado.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center p-6">
            <AlertCircle className="h-16 w-16 text-amber-500 mb-4" />
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button onClick={() => router.push("/dashboard")}>
              Voltar para o Dashboard
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  // Se não estiver no período de submissão, mostrar aviso
  if (!isInSubmissionPhase(demoday)) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Submeter Trabalho</h1>
          <Button variant="outline" onClick={() => router.back()}>
            Voltar
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-amber-600">Período de submissão fechado</CardTitle>
            <CardDescription>
              O período de submissão de trabalhos para este DemoDay não está aberto no momento.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center p-6">
            <CalendarCheck className="h-16 w-16 text-amber-500 mb-4" />
            <p className="text-center text-muted-foreground">
              Verifique as datas das fases do DemoDay e tente novamente durante o período de submissão.
            </p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button onClick={() => router.push("/dashboard")}>
              Voltar para o Dashboard
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  const onSubmit = (data: SubmissionFormData) => {
    setError(null)

    submitWork({
      demodayId: demodayId,
      formData: data
    }, {
      onSuccess: () => {
        // Redirecionar para a página de submissões após sucesso
        router.push(`/dashboard/demoday/${demodayId}/submissions`)
      },
      onError: (error: Error) => {
        setError(error.message || "Ocorreu um erro ao submeter o trabalho")
      },
    })
  }

  // Encontrar a fase de submissão
  const submissionPhase = demoday.phases?.find((phase: any) => phase.phaseNumber === 1)

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Submeter Trabalho</h1>
        <Button variant="outline" onClick={() => router.back()}>
          Voltar
        </Button>
      </div>

      {error && <div className="mb-4 rounded-md bg-red-100 p-4 text-red-700">{error}</div>}

      <Card>
        <CardHeader>
          <CardTitle>Submissão para {demoday.name}</CardTitle>
          <CardDescription>
            Preencha os dados do seu trabalho para submissão ao DemoDay
            {submissionPhase && (
              <span className="block mt-1">
                Prazo de submissão: até {formatDate(submissionPhase.endDate)}
              </span>
            )}
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
                      disabled={isSubmitting}
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
                      disabled={isSubmitting}
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
                      disabled={isSubmitting}
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
                      disabled={isSubmitting}
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
                      disabled={isSubmitting}
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
                      disabled={isSubmitting}
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
                      disabled={isSubmitting}
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
                      disabled={isSubmitting}
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
                      disabled={isSubmitting}
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Se disponível, adicione o link do repositório do seu projeto
                    </p>
                    {fieldState.error && <p className="mt-1 text-xs text-red-500">{fieldState.error.message}</p>}
                  </div>
                )}
              />
            </div>

            {/* Campo oculto para o demodayId */}
            <Controller
              name="demodayId"
              control={control}
              render={({ field }) => (
                <input type="hidden" {...field} />
              )}
            />
          </CardContent>
          <CardFooter className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Enviando..." : "Submeter Trabalho"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
} 