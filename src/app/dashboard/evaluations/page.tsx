"use client"

import EvaluationForm from "@/components/dashboard/EvaluationForm"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/use-toast"
import { useSession } from "@/lib/auth-client"
import { AlertCircle, CalendarDays, Check, Clock, FileText, Info, Vote, ExternalLink } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"

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

  const getVotingPhaseInfo = () => {
    if (!evaluationsData?.currentPhase) return null
    
    if (evaluationsData.currentPhase.phaseNumber === 3) {
      return {
        title: "Votação Popular",
        description: "Vote nos projetos mais interessantes! Sua participação é fundamental para escolher os finalistas.",
        buttonText: "Votar nos Projetos",
        isActive: true
      }
    }
    
    if (evaluationsData.currentPhase.phaseNumber === 4) {
      const isAuthorized = session?.user?.role === 'professor' || session?.user?.role === 'admin'
      return {
        title: "Votação Final",
        description: isAuthorized 
          ? "Votação final para escolher os vencedores entre os finalistas." 
          : "Votação final em andamento. Apenas professores podem votar nesta fase.",
        buttonText: isAuthorized ? "Votação Final" : "Ver Finalistas",
        isActive: isAuthorized
      }
    }
    
    return null
  }

  const votingInfo = getVotingPhaseInfo()

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    )
  }

  if (!evaluationsData) {
    return (
      <div className="container mx-auto flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="h-12 w-12 text-orange-500 mb-4" />
        <h2 className="text-xl font-semibold text-gray-600 mb-2">Nenhum Demoday Ativo</h2>
        <p className="text-gray-500 mb-4">
          Não há um Demoday ativo no momento. Entre em contato com o administrador para mais informações.
        </p>
      </div>
    )
  }

  if (isEvaluating && selectedSubmission) {
    return (
      <div className="container mx-auto p-6">
              <EvaluationForm
                criteria={evaluationsData.criteria}
                onSubmit={handleSubmitEvaluation}
                onCancel={handleCancelEvaluation}
              />
      </div>
    )
  }

  const pendingSubmissions = evaluationsData.submissions.filter((s) => !s.evaluated)
  const completedSubmissions = evaluationsData.submissions.filter((s) => s.evaluated)

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Avaliação de Projetos</h1>
          <p className="text-gray-600">
            {evaluationsData.demoday.name} • {evaluationsData.submissions.length} projetos para avaliar
          </p>
        </div>
        <div className="flex items-center gap-4">
          {getPhaseStatusBadge()}
          {/* Botão "Ver Relatórios" só para professores/admin */}
          {(session?.user?.role === 'professor' || session?.user?.role === 'admin') && (
            <Link href="/dashboard/reports">
              <Button variant="outline" className="border-blue-500 text-blue-600 hover:bg-blue-50">
          <FileText className="mr-2 h-4 w-4" />
          Ver Relatórios
        </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Seção de Votação - aparece quando estamos na Fase 3 ou 4 */}
      {votingInfo && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Vote className="h-5 w-5" />
              {votingInfo.title}
            </CardTitle>
            <CardDescription className="text-blue-700">
              {votingInfo.description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Link href={`/demoday/${evaluationsData.demoday.id}/voting`}>
                <Button 
                  className={votingInfo.isActive ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-500 hover:bg-gray-600"}
                >
                  <Vote className="mr-2 h-4 w-4" />
                  {votingInfo.buttonText}
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href={`/demoday/${evaluationsData.demoday.id}/results`}>
                <Button variant="outline">
                  Ver Resultados
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Phase Info */}
      <Card>
            <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Período de Avaliação
          </CardTitle>
          <CardDescription>
            De {formatDate(evaluationsData.evaluationPhase?.startDate || "")} até{" "}
            {formatDate(evaluationsData.evaluationPhase?.endDate || "")}
          </CardDescription>
            </CardHeader>
              <CardContent>
          <div className="flex items-center gap-2">
                  {evaluationsData.isEvaluationPeriod ? (
              <>
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm text-green-600 font-medium">Ativo</span>
              </>
                  ) : (
              <>
                <Clock className="h-4 w-4 text-orange-500" />
                <span className="text-sm text-orange-600 font-medium">Inativo</span>
              </>
                  )}
                </div>
              </CardContent>
          </Card>

      {!evaluationsData.isEvaluationPeriod && evaluationsData.currentPhase?.phaseNumber !== 3 && evaluationsData.currentPhase?.phaseNumber !== 4 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <Info className="h-5 w-5" />
              Fora do período de avaliação
            </CardTitle>
            <CardDescription className="text-orange-700">
                    As avaliações só podem ser realizadas durante a fase de avaliação do Demoday.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Evaluation Tabs */}
      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList>
          <TabsTrigger value="pending">
            Avaliações Pendentes ({pendingSubmissions.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Avaliações Concluídas ({completedSubmissions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingSubmissions.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Check className="mx-auto h-12 w-12 text-green-500 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Todas as avaliações concluídas!</h3>
                  <p className="text-gray-600">
                    Você já avaliou todos os projetos disponíveis. Obrigado pela sua participação!
                  </p>
                </div>
              </CardContent>
            </Card>
              ) : (
            <div className="grid grid-cols-1 gap-4">
              {pendingSubmissions.map((submission) => (
                <Card key={submission.id} className="hover:shadow-md transition-shadow">
                        <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{submission.project.title}</CardTitle>
                        <CardDescription className="mt-1">
                          {submission.project.type}
                          {submission.project.authors && ` • ${submission.project.authors}`}
                        </CardDescription>
                      </div>
                      <Badge variant="secondary">Pendente</Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                    <p className="text-gray-600 mb-4 line-clamp-2">{submission.project.description}</p>
                          <Button
                            onClick={() => handleStartEvaluation(submission)}
                      disabled={!evaluationsData.isEvaluationPeriod}
                            className="w-full"
                          >
                      {evaluationsData.isEvaluationPeriod ? "Iniciar Avaliação" : "Fora do período"}
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              )}
            </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {completedSubmissions.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhuma avaliação concluída</h3>
                  <p className="text-gray-600">As avaliações concluídas aparecerão aqui.</p>
                </div>
              </CardContent>
            </Card>
              ) : (
            <div className="grid grid-cols-1 gap-4">
              {completedSubmissions.map((submission) => (
                <Card key={submission.id} className="border-green-200">
                        <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{submission.project.title}</CardTitle>
                        <CardDescription className="mt-1">
                          {submission.project.type}
                          {submission.project.authors && ` • ${submission.project.authors}`}
                        </CardDescription>
                      </div>
                      <Badge className="bg-green-500 hover:bg-green-600">Concluída</Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                    <p className="text-gray-600 line-clamp-2">{submission.project.description}</p>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
    </div>
  )
}
