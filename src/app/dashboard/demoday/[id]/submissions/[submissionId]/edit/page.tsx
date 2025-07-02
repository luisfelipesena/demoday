"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useSession } from "@/lib/auth-client"
import { projectSubmissionSchema } from "@/server/db/validators"
import { PROJECT_TYPES } from "@/types"
import { zodResolver } from "@hookform/resolvers/zod"
import { AlertCircle, ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { use, useEffect, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { z } from "zod"

type SubmissionFormData = z.infer<typeof projectSubmissionSchema>

interface EditSubmissionProps {
  params: Promise<{ id: string; submissionId: string }>
}

interface SubmissionData {
  id: string
  projectId: string
  demoday_id: string
  status: string
  project: {
    id: string
    title: string
    description: string
    type: string
    contactEmail: string
    contactPhone: string
    advisor: string
    videoUrl: string
    repositoryUrl?: string
    authors: string
    workCategory?: string
    developmentYear: string
  }
  demoday: {
    id: string
    name: string
    active: boolean
    status: string
  }
}

export default function EditSubmissionPage({ params }: EditSubmissionProps) {
  const router = useRouter()
  const resolvedParams = use(params)
  const { id: demodayId, submissionId } = resolvedParams
  const { data: session, isPending } = useSession()

  const [submission, setSubmission] = useState<SubmissionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<SubmissionFormData>({
    resolver: zodResolver(projectSubmissionSchema),
  })

  // Buscar dados da submissão
  useEffect(() => {
    const fetchSubmission = async () => {
      try {
        const response = await fetch(`/api/projects/submissions/${submissionId}`)
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Erro ao carregar submissão")
        }

        const data: SubmissionData = await response.json()
        setSubmission(data)

        // Pré-popular o formulário
        setValue("title", data.project.title)
        setValue("description", data.project.description)
        setValue("type", data.project.type as any)
        setValue("contactEmail", data.project.contactEmail)
        setValue("contactPhone", data.project.contactPhone)
        setValue("advisor", data.project.advisor)
        setValue("videoUrl", data.project.videoUrl)
        setValue("repositoryUrl", data.project.repositoryUrl || "")
        setValue("authors", data.project.authors)
        setValue("workCategory", data.project.workCategory || "")
        setValue("developmentYear", data.project.developmentYear)
        setValue("demodayId", data.demoday_id)
      } catch (error: any) {
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }

    if (session && submissionId) {
      fetchSubmission()
    }
  }, [session, submissionId, setValue])

  // Verificar autenticação
  if (!isPending && !session) {
    router.push("/login")
    return null
  }

  const onSubmit = async (data: SubmissionFormData) => {
    if (!submission) return

    setError(null)
    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/projects/submissions/${submissionId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Erro ao atualizar submissão")
      }

      router.push(`/dashboard/my-submissions`)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              <div className="space-y-2">
                <div className="h-10 bg-gray-200 rounded"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error && !submission) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Erro ao carregar submissão
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600 mb-4">{error}</p>
            <div className="flex gap-4">
              <Button variant="outline" onClick={() => router.push("/dashboard/my-submissions")}>
                Voltar às Minhas Submissões
              </Button>
              <Button onClick={() => window.location.reload()}>Tentar Novamente</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!submission) {
    return null
  }

  // Verificar se pode editar
  const canEdit = submission.status === "submitted" && submission.demoday.active

  if (!canEdit) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-600">
              <AlertCircle className="h-5 w-5" />
              Edição não permitida
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {submission.status !== "submitted" && (
                <p className="text-amber-600">
                  Só é possível editar submissões com status &quot;Submetido&quot;. Status atual:{" "}
                  <strong>{submission.status}</strong>
                </p>
              )}
              {!submission.demoday.active && (
                <p className="text-amber-600">Não é possível editar submissões de demodays inativos.</p>
              )}
              <Button
                variant="outline"
                onClick={() => router.push("/dashboard/my-submissions")}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar às Minhas Submissões
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6 flex items-center gap-4">
        <Button
          variant="outline"
          onClick={() => router.push("/dashboard/my-submissions")}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Editar Submissão</h1>
          <p className="text-muted-foreground">
            {submission.demoday.name} - {submission.project.title}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Editar Projeto</CardTitle>
          <p className="text-muted-foreground">
            Atualize as informações do seu projeto. Certifique-se de salvar as alterações.
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
              <Button type="button" variant="outline" onClick={() => router.push("/dashboard/my-submissions")}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
