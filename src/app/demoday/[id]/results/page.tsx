"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AlertCircle,
  ArrowLeft,
  Award,
  Crown,
  ListOrdered,
  Medal,
  Sparkles,
  Star,
  Trophy,
  Users as UsersIcon,
} from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"

// Define interfaces for the results data
interface ProjectResult {
  id: string
  title: string
  type: string
  authors: string | null
  status: string // finalist, winner, participant
  popularVoteCount: number
  finalWeightedScore: number // Calculated score considering weights
  categoryName?: string // Optional: if grouping by category client-side from a flat list
}

interface CategoryResult {
  id: string
  name: string
  projects: ProjectResult[]
}

interface DemodayOverallStats {
  totalSubmittedProjects: number
  totalUniqueParticipants: number
  totalPopularVotes: number
  totalFinalVotes: number
}

interface DemodayResultsData {
  demodayName: string
  categories: CategoryResult[]
  overallStats: DemodayOverallStats
}

// Hook to fetch results data
function useDemodayResults(demodayId: string) {
  const [data, setData] = useState<DemodayResultsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetchResults() {
      setIsLoading(true)
      try {
        const response = await fetch(`/api/demoday/${demodayId}/results`)
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Failed to fetch demoday results")
        }
        const resultsData = await response.json()
        setData(resultsData)
      } catch (err) {
        setError(err instanceof Error ? err : new Error("An unknown error occurred"))
      } finally {
        setIsLoading(false)
      }
    }

    if (demodayId) {
      fetchResults()
    }
  }, [demodayId])

  return { data, isLoading, error }
}

// Hook to fetch demoday details
function useDemodayDetails(demodayId: string) {
  const [data, setData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetchDemoday() {
      setIsLoading(true)
      try {
        const response = await fetch(`/api/demoday/${demodayId}`)
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Failed to fetch demoday details")
        }
        const demoDayData = await response.json()
        setData(demoDayData)
      } catch (err) {
        setError(err instanceof Error ? err : new Error("An unknown error occurred"))
      } finally {
        setIsLoading(false)
      }
    }

    if (demodayId) {
      fetchDemoday()
    }
  }, [demodayId])

  return { data, isLoading, error }
}

// Component to render individual project result
function ProjectResultCard({ project, position }: { project: ProjectResult; position: number }) {
  const isWinner = project.status === "winner"
  const isFinalist = project.status === "finalist"

  const getPositionIcon = () => {
    if (position === 1) return <Crown className="h-6 w-6 text-yellow-500" />
    if (position === 2) return <Medal className="h-6 w-6 text-gray-400" />
    if (position === 3) return <Medal className="h-6 w-6 text-amber-600" />
    return <Star className="h-5 w-5 text-blue-500" />
  }

  const getCardStyle = () => {
    if (isWinner && position === 1) {
      return "border-2 border-yellow-400 bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 shadow-lg transform hover:scale-105 transition-all duration-300"
    }
    if (isWinner || position <= 3) {
      return "border-2 border-blue-300 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-md transform hover:scale-102 transition-all duration-300"
    }
    if (isFinalist) {
      return "border border-green-300 bg-gradient-to-br from-green-50 to-emerald-50 shadow-sm"
    }
    return "border border-gray-200 bg-white"
  }

  const getBadgeStyle = () => {
    if (isWinner && position === 1) {
      return "bg-gradient-to-r from-yellow-500 to-orange-500 text-white animate-pulse"
    }
    if (isWinner) {
      return "bg-gradient-to-r from-blue-500 to-indigo-500 text-white"
    }
    if (isFinalist) {
      return "bg-gradient-to-r from-green-500 to-emerald-500 text-white"
    }
    return "bg-gray-500 text-white"
  }

  const getStatusText = () => {
    if (isWinner && position === 1) return "🏆 CAMPEÃO"
    if (isWinner) return "🥇 VENCEDOR"
    if (isFinalist) return "🎖️ FINALISTA"
    return "Participante"
  }

  return (
    <Card className={getCardStyle()}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {getPositionIcon()}
            <div>
              <CardTitle className={`text-lg ${isWinner ? "text-yellow-800" : "text-gray-800"}`}>
                {project.title}
              </CardTitle>
              <CardDescription className="text-sm text-gray-600">
                {project.type} {project.authors && `• ${project.authors}`}
              </CardDescription>
            </div>
          </div>
          <Badge className={getBadgeStyle()}>{getStatusText()}</Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="text-center p-2 bg-white/50 rounded-lg">
            <p className="font-semibold text-purple-600">{project.popularVoteCount}</p>
            <p className="text-gray-600">Votos Populares</p>
          </div>
          <div className="text-center p-2 bg-white/50 rounded-lg">
            <p className="font-semibold text-orange-600">{project.finalWeightedScore}</p>
            <p className="text-gray-600">Pontuação Final</p>
          </div>
        </div>
        {isWinner && position === 1 && (
          <div className="mt-3 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-400 text-white rounded-full text-sm font-bold animate-bounce">
              <Sparkles className="h-4 w-4" />
              PROJETO CAMPEÃO
              <Sparkles className="h-4 w-4" />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function DemodayResultsPage() {
  const params = useParams()
  const router = useRouter()
  const demodayId = params.id as string

  const { data: demoday, isLoading: isLoadingDemoday, error: demodayError } = useDemodayDetails(demodayId)
  const { data: resultsData, isLoading: isLoadingResults, error: resultsError } = useDemodayResults(demodayId)

  const isLoading = isLoadingDemoday || isLoadingResults
  const pageError = demodayError?.message || resultsError?.message

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-8 w-1/4 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (pageError) {
    return (
      <div className="container mx-auto p-6 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-red-600">Erro ao Carregar Resultados</h2>
        <p className="text-muted-foreground">{pageError}</p>
        <Button onClick={() => router.push("/")} className="mt-4">
          Ir para Início
        </Button>
      </div>
    )
  }

  if (!resultsData) {
    return (
      <div className="container mx-auto p-6 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold">Resultados Não Encontrados</h2>
        <p className="text-muted-foreground">Os resultados para este Demoday ainda não estão disponíveis.</p>
        <Button onClick={() => router.push("/")} className="mt-4">
          Ir para Início
        </Button>
      </div>
    )
  }

  // Find the overall winner (highest scoring project across all categories)
  const allProjects = resultsData.categories.flatMap((cat: CategoryResult) => cat.projects)
  const overallWinner =
    allProjects.find((p: ProjectResult) => p.status === "winner") ||
    allProjects.sort((a: ProjectResult, b: ProjectResult) => b.finalWeightedScore - a.finalWeightedScore)[0]

  return (
    <div className="container mx-auto p-6 space-y-8">
      <header className="text-center mb-8">
        <Button variant="outline" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <h1 className="text-4xl font-bold tracking-tight mb-2">🏆 Resultados Finais</h1>
        <h2 className="text-2xl text-muted-foreground mb-4">{resultsData.demodayName}</h2>

        {/* Overall Winner Highlight */}
        {overallWinner && (
          <Card className="border-4 border-yellow-400 bg-gradient-to-r from-yellow-100 via-orange-100 to-red-100 shadow-2xl mb-8">
            <CardHeader className="text-center pb-2">
              <div className="flex justify-center items-center gap-3 mb-2">
                <Crown className="h-12 w-12 text-yellow-600 animate-bounce" />
                <div>
                  <CardTitle className="text-3xl font-bold text-yellow-800">PROJETO CAMPEÃO</CardTitle>
                  <CardDescription className="text-lg text-yellow-700 font-medium">
                    {overallWinner.title}
                  </CardDescription>
                </div>
                <Crown className="h-12 w-12 text-yellow-600 animate-bounce" />
              </div>
            </CardHeader>
            <CardContent className="text-center">
              <div className="bg-white/70 rounded-lg p-4 mb-4">
                <p className="text-gray-700 font-medium mb-2">
                  {overallWinner.type} {overallWinner.authors && `• ${overallWinner.authors}`}
                </p>
                <div className="flex justify-center gap-6 text-sm">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">{overallWinner.popularVoteCount}</p>
                    <p className="text-gray-600">Votos Populares</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-orange-600">{overallWinner.finalWeightedScore}</p>
                    <p className="text-gray-600">Pontuação Final</p>
                  </div>
                </div>
              </div>
              <div className="flex justify-center">
                <div className="inline-flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-full font-bold text-lg animate-pulse">
                  <Sparkles className="h-5 w-5" />
                  PARABÉNS! 🎉
                  <Sparkles className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </header>

      {/* Overall Statistics */}
      {resultsData.overallStats && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UsersIcon className="h-5 w-5" />
              Estatísticas Gerais do Evento
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 border rounded-lg text-center bg-blue-50">
              <p className="text-2xl font-bold text-blue-600">{resultsData.overallStats.totalSubmittedProjects}</p>
              <p className="text-sm text-muted-foreground">Projetos Submetidos</p>
            </div>
            <div className="p-3 border rounded-lg text-center bg-green-50">
              <p className="text-2xl font-bold text-green-600">{resultsData.overallStats.totalUniqueParticipants}</p>
              <p className="text-sm text-muted-foreground">Participantes Únicos</p>
            </div>
            <div className="p-3 border rounded-lg text-center bg-purple-50">
              <p className="text-2xl font-bold text-purple-600">{resultsData.overallStats.totalPopularVotes}</p>
              <p className="text-sm text-muted-foreground">Votos Populares</p>
            </div>
            <div className="p-3 border rounded-lg text-center bg-orange-50">
              <p className="text-2xl font-bold text-orange-600">{resultsData.overallStats.totalFinalVotes}</p>
              <p className="text-sm text-muted-foreground">Votos Finais</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results by Category */}
      <div className="space-y-8">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <ListOrdered className="h-6 w-6" />
          Resultados por Categoria
        </h2>

        {resultsData.categories.map((category: CategoryResult) => (
          <Card key={category.id} className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50">
              <CardTitle className="text-xl flex items-center gap-2">
                <Award className="h-5 w-5 text-blue-600" />
                {category.name}
              </CardTitle>
              <CardDescription>
                {category.projects.length} projeto{category.projects.length !== 1 ? "s" : ""} nesta categoria
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {category.projects.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Nenhum projeto nesta categoria.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {category.projects.map((project: ProjectResult, index: number) => {
                    const isWinner = project.status === "winner"
                    let rankLabel = ""
                    let rankClass = ""

                    if (index === 0) {
                      rankLabel = "🥇 1º Lugar"
                      rankClass = "bg-amber-100 border-amber-300 text-amber-800"
                    } else if (index === 1) {
                      rankLabel = "🥈 2º Lugar"
                      rankClass = "bg-slate-100 border-slate-300 text-slate-800"
                    } else if (index === 2) {
                      rankLabel = "🥉 3º Lugar"
                      rankClass = "bg-orange-100 border-orange-300 text-orange-800"
                    } else {
                      rankLabel = `${index + 1}º Lugar`
                      rankClass = "bg-gray-50 border-gray-200"
                    }

                    return (
                      <Card
                        key={project.id}
                        className={`transition-all ${isWinner ? "border-yellow-400 shadow-md" : ""} ${rankClass}`}
                      >
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="text-lg flex items-center gap-2">
                                {project.title}
                                {isWinner && <Trophy className="h-4 w-4 text-yellow-500" />}
                              </CardTitle>
                              <CardDescription className="mt-1">{rankLabel}</CardDescription>
                            </div>
                            <div>
                              <Badge className="text-xs" variant="outline">
                                {project.type}
                              </Badge>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="text-center p-2 bg-white/50 rounded-lg">
                              <p className="font-semibold text-purple-600">{project.popularVoteCount}</p>
                              <p className="text-gray-600">Votos Populares</p>
                            </div>
                            <div className="text-center p-2 bg-white/50 rounded-lg">
                              <p className="font-semibold text-orange-600">{project.finalWeightedScore}</p>
                              <p className="text-gray-600">Pontuação Final</p>
                            </div>
                          </div>
                          {isWinner && (
                            <div className="mt-3 text-center">
                              <div className="inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-400 text-white rounded-full text-sm font-bold animate-bounce">
                                <Sparkles className="h-4 w-4" />
                                PROJETO CAMPEÃO
                                <Sparkles className="h-4 w-4" />
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Footer */}
      <div className="text-center py-8">
        <p className="text-muted-foreground">
          Obrigado a todos os participantes que tornaram este Demoday um sucesso! 🎉
        </p>
      </div>
    </div>
  )
}
