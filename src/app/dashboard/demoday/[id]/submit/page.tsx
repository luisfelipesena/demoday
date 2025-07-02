"use client"

import { useSession } from "@/lib/auth-client"
import { zodResolver } from "@hookform/resolvers/zod"
import { AlertCircle, CalendarCheck } from "lucide-react"
import { useRouter } from "next/navigation"
import { use, useEffect, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { useDemodayDetails } from "@/hooks/useDemoday"
import { useSubmitWork } from "@/hooks/useSubmitWork"
import { projectSubmissionSchema } from "@/server/db/validators"
import { PROJECT_TYPES } from "@/types"
import { isInSubmissionPhase } from "@/utils/date-utils"

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
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<SubmissionFormData>({
    resolver: zodResolver(projectSubmissionSchema),
    defaultValues: {
      title: "",
      description: "",
      type: undefined,
      contactEmail: "",
      contactPhone: "",
      advisor: "",
      videoUrl: "",
      repositoryUrl: "",
      developmentYear: new Date().getFullYear().toString(),
      authors: "",
      workCategory: "",
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
            <CardDescription>Não foi possível encontrar o DemoDay especificado.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center p-6">
            <AlertCircle className="h-16 w-16 text-amber-500 mb-4" />
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button onClick={() => router.push("/dashboard")}>Voltar para o Dashboard</Button>
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
            <Button onClick={() => router.push("/dashboard")}>Voltar para o Dashboard</Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  const onSubmit = async (data: SubmissionFormData) => {
    setError(null)
    try {
      await submitWork({ demodayId, formData: data })
      router.push(`/dashboard/demoday/${demodayId}`)
    } catch (error: any) {
      setError(error.message)
    }
  }

  // Encontrar a fase de submissão
  // const submissionPhase = demoday.phases?.find((phase: any) => phase.phaseNumber === 1)

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>Submeter Trabalho</CardTitle>
          <p className="text-muted-foreground">
            Preencha as informações do seu projeto para submissão ao {demoday?.name}
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Título */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium mb-2">
                Título do Projeto *
              </label>
              <input
                type="text"
                id="title"
                {...register("title")}
                className={`w-full px-3 py-2 border rounded-md ${errors.title ? "border-red-500" : "border-gray-300"}`}
                placeholder="Digite o título do seu projeto"
              />
              {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>}
            </div>

            {/* Descrição */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium mb-2">
                Descrição do Projeto *
              </label>
              <Textarea
                id="description"
                {...register("description")}
                className={`min-h-[120px] ${errors.description ? "border-red-500" : ""}`}
                placeholder="Descreva seu projeto, objetivos, metodologia e resultados"
              />
              {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>}
            </div>

            {/* Tipo de Projeto */}
            <div>
              <label htmlFor="type" className="block text-sm font-medium mb-2">
                Tipo de Projeto *
              </label>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className={errors.type ? "border-red-500" : ""}>
                      <SelectValue placeholder="Selecione o tipo de projeto" />
                    </SelectTrigger>
                    <SelectContent>
                      {PROJECT_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.type && <p className="text-red-500 text-sm mt-1">{errors.type.message}</p>}
            </div>

            {/* Categoria do Trabalho */}
            <div>
              <label htmlFor="workCategory" className="block text-sm font-medium mb-2">
                Categoria/Tag do Trabalho
              </label>
              <input
                type="text"
                id="workCategory"
                {...register("workCategory")}
                className={`w-full px-3 py-2 border rounded-md ${
                  errors.workCategory ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Ex: Inteligência Artificial, Web Development, IoT, etc."
              />
              {errors.workCategory && <p className="text-red-500 text-sm mt-1">{errors.workCategory.message}</p>}
            </div>

            {/* Email de Contato */}
            <div>
              <label htmlFor="contactEmail" className="block text-sm font-medium mb-2">
                Email do Contato Principal *
              </label>
              <input
                type="email"
                id="contactEmail"
                {...register("contactEmail")}
                className={`w-full px-3 py-2 border rounded-md ${
                  errors.contactEmail ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="email@exemplo.com"
              />
              {errors.contactEmail && <p className="text-red-500 text-sm mt-1">{errors.contactEmail.message}</p>}
            </div>

            {/* Telefone de Contato */}
            <div>
              <label htmlFor="contactPhone" className="block text-sm font-medium mb-2">
                Celular do Contato Principal *
              </label>
              <input
                type="tel"
                id="contactPhone"
                {...register("contactPhone")}
                className={`w-full px-3 py-2 border rounded-md ${
                  errors.contactPhone ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="(11) 99999-9999"
              />
              {errors.contactPhone && <p className="text-red-500 text-sm mt-1">{errors.contactPhone.message}</p>}
            </div>

            {/* Orientador */}
            <div>
              <label htmlFor="advisor" className="block text-sm font-medium mb-2">
                Orientador/Professor da Disciplina *
              </label>
              <input
                type="text"
                id="advisor"
                {...register("advisor")}
                className={`w-full px-3 py-2 border rounded-md ${
                  errors.advisor ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Nome completo do orientador ou professor"
              />
              {errors.advisor && <p className="text-red-500 text-sm mt-1">{errors.advisor.message}</p>}
            </div>

            {/* Autores */}
            <div>
              <label htmlFor="authors" className="block text-sm font-medium mb-2">
                Autores (Nomes Completos) *
              </label>
              <input
                type="text"
                id="authors"
                {...register("authors")}
                className={`w-full px-3 py-2 border rounded-md ${
                  errors.authors ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Nome completo dos autores separados por vírgula"
              />
              {errors.authors && <p className="text-red-500 text-sm mt-1">{errors.authors.message}</p>}
            </div>

            {/* URL do Vídeo */}
            <div>
              <label htmlFor="videoUrl" className="block text-sm font-medium mb-2">
                Link para Apresentação do Vídeo *
                <span className="text-sm text-muted-foreground">(vídeo com até 3 minutos)</span>
              </label>
              <input
                type="url"
                id="videoUrl"
                {...register("videoUrl")}
                className={`w-full px-3 py-2 border rounded-md ${
                  errors.videoUrl ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="https://youtube.com/watch?v=..."
              />
              {errors.videoUrl && <p className="text-red-500 text-sm mt-1">{errors.videoUrl.message}</p>}
              <p className="text-sm text-muted-foreground mt-1">
                Faça upload do seu vídeo no YouTube, Vimeo ou outra plataforma e cole o link aqui.
              </p>
            </div>

            {/* URL do Repositório */}
            <div>
              <label htmlFor="repositoryUrl" className="block text-sm font-medium mb-2">
                Link para Repositório (opcional)
              </label>
              <input
                type="url"
                id="repositoryUrl"
                {...register("repositoryUrl")}
                className={`w-full px-3 py-2 border rounded-md ${
                  errors.repositoryUrl ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="https://github.com/usuario/projeto"
              />
              {errors.repositoryUrl && <p className="text-red-500 text-sm mt-1">{errors.repositoryUrl.message}</p>}
              <p className="text-sm text-muted-foreground mt-1">Artefatos físicos podem não ter repositório.</p>
            </div>

            {/* Ano de Desenvolvimento */}
            <div>
              <label htmlFor="developmentYear" className="block text-sm font-medium mb-2">
                Ano de Desenvolvimento *
              </label>
              <input
                type="text"
                id="developmentYear"
                {...register("developmentYear")}
                className={`w-full px-3 py-2 border rounded-md ${
                  errors.developmentYear ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="2024"
              />
              {errors.developmentYear && <p className="text-red-500 text-sm mt-1">{errors.developmentYear.message}</p>}
            </div>

            {error && <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">{error}</div>}

            <div className="flex gap-4">
              <Button type="button" variant="outline" onClick={() => router.push(`/dashboard/demoday/${demodayId}`)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Submetendo..." : "Submeter Trabalho"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
