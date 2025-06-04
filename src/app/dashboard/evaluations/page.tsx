"use client"

import EvaluationForm from "@/components/dashboard/EvaluationForm"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/use-toast"
import { useSession } from "@/lib/auth-client"
import { AlertCircle, CalendarDays, Check, Clock, FileText, Info } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

// Define interfaces for the data we'll be working with
interface Project {
  id: string
  title: string
  description: string
  type: string
  authors?: string
}

interface Submission {
  id: string
  projectId: string
  project: Project
  evaluated: boolean
}

interface Criterion {
  id: string
  name: string
  description: string
}

interface DemoDayPhase {
  id: string
  name: string
  description: string
  phaseNumber: number
  startDate: string
  endDate: string
}

interface Demoday {
  id: string
  name: string
}

interface EvaluationsData {
  demoday: Demoday
  submissions: Submission[]
  criteria: Criterion[]
  currentPhase: DemoDayPhase | null
  evaluationPhase: DemoDayPhase | null
  isEvaluationPeriod: boolean
  phases: DemoDayPhase[]
}

export default function EvaluationsPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [loading, setLoading] = useState(true)
  const [evaluationsData, setEvaluationsData] = useState<EvaluationsData | null>(null)
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)
  const [isEvaluating, setIsEvaluating] = useState(false)

  useEffect(() => {
    // TODO: Check if user is professor or admin
    if (session?.user) {
      fetchEvaluations()
    } else if (session === null) {
      router.push("/login")
    }
  }, [session, router])

  const fetchEvaluations = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/evaluations")

      if (!response.ok) {
        return
      }

      const data = await response.json()
      setEvaluationsData(data)
    } catch (error) {
      console.error("Failed to fetch evaluations:", error)
      toast({
        title: "Erro",
        description: "Falha ao carregar dados de avaliação. Por favor, tente novamente mais tarde.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleStartEvaluation = (submission: Submission) => {
    if (!evaluationsData?.isEvaluationPeriod) {
      toast({
        title: "Fora do período de avaliação",
        description: "As avaliações só podem ser feitas durante a fase de avaliação.",
        variant: "destructive",
      })
      return
    }

    setSelectedSubmission(submission)
    setIsEvaluating(true)
  }

  const handleCancelEvaluation = () => {
    setSelectedSubmission(null)
    setIsEvaluating(false)
  }

  const handleSubmitEvaluation = async (evaluationData: {
    scores: Array<{ criteriaId: string; score: number; comment?: string }>
    totalScore: number
  }) => {
    try {
      if (!selectedSubmission) {
        throw new Error("Nenhuma submissão selecionada")
      }

      const response = await fetch("/api/evaluations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          submissionId: selectedSubmission.id,
          ...evaluationData,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        if (errorData.error === "Outside evaluation period") {
          toast({
            title: "Período de avaliação encerrado",
            description: "O período de avaliação já foi encerrado. Não é mais possível enviar avaliações.",
            variant: "destructive",
          })
        } else {
          throw new Error(errorData.error || "Falha ao enviar avaliação")
        }
        return
      }

      toast({
        title: "Sucesso",
        description: "Avaliação enviada com sucesso",
      })

      setIsEvaluating(false)
      setSelectedSubmission(null)
      fetchEvaluations()
    } catch (error) {
      console.error("Error submitting evaluation:", error)
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Falha ao enviar avaliação. Por favor, tente novamente.",
        variant: "destructive",
      })
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getPhaseStatusBadge = () => {
    if (!evaluationsData?.currentPhase) {
      return <Badge variant="secondary">Nenhuma fase ativa</Badge>
    }

    if (evaluationsData.currentPhase.phaseNumber === 2) {
      return <Badge className="bg-blue-100 text-blue-800">Fase de Avaliação</Badge>
    }

    const phaseNames = ["Submissão", "Avaliação", "Votação", "Resultados"]
    const phaseName =
      phaseNames[evaluationsData.currentPhase.phaseNumber - 1] || `Fase ${evaluationsData.currentPhase.phaseNumber}`

    return <Badge variant="outline">{phaseName}</Badge>
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="mb-6 text-2xl font-bold">Avaliação de Projetos</h1>
        <div className="grid gap-6">
          {Array(3)
            .fill(0)
            .map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-1/3" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
        </div>
      </div>
    )
  }

  if (isEvaluating && selectedSubmission) {
    return (
      <div className="container mx-auto p-6">
        <Button variant="outline" onClick={handleCancelEvaluation} className="mb-6">
          Voltar para submissões
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Avaliando: {selectedSubmission.project.title}</CardTitle>
            <CardDescription>
              {selectedSubmission.project.type} - {selectedSubmission.project.authors || "Nenhum autor especificado"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-6 text-sm">{selectedSubmission.project.description}</p>
            {evaluationsData && (
              <EvaluationForm
                criteria={evaluationsData.criteria}
                onSubmit={handleSubmitEvaluation}
                onCancel={handleCancelEvaluation}
              />
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Avaliação de Projetos</h1>
        <Button variant="outline" onClick={() => router.push("/dashboard/reports")}>
          <FileText className="mr-2 h-4 w-4" />
          Ver Relatórios
        </Button>
      </div>

      {!evaluationsData?.demoday && (
        <Card>
          <CardContent className="flex items-center justify-center p-6">
            <div className="text-center">
              <AlertCircle className="mx-auto mb-2 h-8 w-8 text-amber-500" />
              <p className="text-lg font-medium">Nenhum Demoday ativo encontrado</p>
              <p className="text-sm text-gray-500">
                Entre em contato com um administrador para criar um evento Demoday.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {evaluationsData?.demoday && (
        <>
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{evaluationsData.demoday.name}</CardTitle>
                  <CardDescription>{evaluationsData.submissions.length} projetos para avaliar</CardDescription>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {getPhaseStatusBadge()}
                  {evaluationsData.currentPhase && (
                    <div className="text-right text-xs text-gray-500">{evaluationsData.currentPhase.name}</div>
                  )}
                </div>
              </div>
            </CardHeader>
            {evaluationsData.evaluationPhase && (
              <CardContent>
                <div className="flex items-center gap-4 rounded-lg bg-gray-50 p-4">
                  <CalendarDays className="h-5 w-5 text-blue-600" />
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">Período de Avaliação</h4>
                    <p className="text-sm text-gray-600">
                      De {formatDate(evaluationsData.evaluationPhase.startDate)} até{" "}
                      {formatDate(evaluationsData.evaluationPhase.endDate)}
                    </p>
                  </div>
                  {evaluationsData.isEvaluationPeriod ? (
                    <Badge className="bg-green-100 text-green-800">
                      <Clock className="mr-1 h-3 w-3" />
                      Ativo
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      <Clock className="mr-1 h-3 w-3" />
                      Inativo
                    </Badge>
                  )}
                </div>
              </CardContent>
            )}
          </Card>

          {!evaluationsData.isEvaluationPeriod && (
            <Card className="mb-6 border-amber-200 bg-amber-50">
              <CardContent className="flex items-center p-4">
                <AlertCircle className="mr-3 h-5 w-5 text-amber-600" />
                <div>
                  <p className="font-medium text-amber-800">Fora do período de avaliação</p>
                  <p className="text-sm text-amber-700">
                    As avaliações só podem ser realizadas durante a fase de avaliação do Demoday.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          <Tabs defaultValue="pending" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="pending">Avaliações Pendentes</TabsTrigger>
              <TabsTrigger value="completed">Avaliações Concluídas</TabsTrigger>
            </TabsList>

            <TabsContent value="pending">
              {evaluationsData.submissions.filter((s) => !s.evaluated).length === 0 ? (
                <div className="rounded-lg border border-dashed p-8 text-center">
                  <Check className="mx-auto mb-2 h-8 w-8 text-green-500" />
                  <h3 className="text-lg font-medium">Todos os projetos avaliados!</h3>
                  <p className="text-gray-500">Você avaliou todas as submissões disponíveis.</p>
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {evaluationsData.submissions
                    .filter((submission) => !submission.evaluated)
                    .map((submission) => (
                      <Card key={submission.id} className="hover:border-primary">
                        <CardHeader>
                          <div className="flex justify-between">
                            <CardTitle className="truncate">{submission.project.title}</CardTitle>
                            <Badge>{submission.project.type}</Badge>
                          </div>
                          <CardDescription className="line-clamp-2">
                            {submission.project.authors || "Nenhum autor especificado"}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="mb-6 line-clamp-3 text-sm">{submission.project.description}</p>
                          <Button
                            onClick={() => handleStartEvaluation(submission)}
                            className="w-full"
                            disabled={!evaluationsData.isEvaluationPeriod}
                          >
                            {evaluationsData.isEvaluationPeriod ? "Avaliar" : "Fora do período"}
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="completed">
              {evaluationsData.submissions.filter((s) => s.evaluated).length === 0 ? (
                <div className="rounded-lg border border-dashed p-8 text-center">
                  <Info className="mx-auto mb-2 h-8 w-8 text-blue-500" />
                  <h3 className="text-lg font-medium">Nenhuma avaliação ainda</h3>
                  <p className="text-gray-500">Você ainda não avaliou nenhum projeto.</p>
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {evaluationsData.submissions
                    .filter((submission) => submission.evaluated)
                    .map((submission) => (
                      <Card key={submission.id}>
                        <CardHeader>
                          <div className="flex justify-between">
                            <CardTitle className="truncate">{submission.project.title}</CardTitle>
                            <Badge variant="outline" className="bg-green-50 text-green-700">
                              <Check className="mr-1 h-3 w-3" />
                              Avaliado
                            </Badge>
                          </div>
                          <CardDescription>{submission.project.type}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="line-clamp-3 text-sm">{submission.project.description}</p>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
}
