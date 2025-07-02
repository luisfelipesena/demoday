"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { StarRating } from "@/components/ui/star-rating"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { useCategories } from "@/hooks/useCategories"
import { useDemodayDetails } from "@/hooks/useDemoday"
import { useDemodayProjects } from "@/hooks/useDemodayProjects"
import { useSubmitVote } from "@/hooks/useVoting"
import { useSession } from "@/lib/auth-client"
import { isDemodayFinished } from "@/utils/date-utils"
import { AlertCircle, ArrowLeft, CheckCircle, Star, ThumbsUp, Trophy } from "lucide-react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"

interface Project {
  id: string
  title: string
  description: string
  type: string
  authors: string
  advisor: string
  videoUrl: string
  repositoryUrl?: string
  workCategory?: string
  author: {
    name: string
    email: string
  }
}

interface Submission {
  id: string
  status: string
  project: Project
}

interface VotingCategory {
  id: string
  name: string
  submissions: Submission[]
}

interface VoteData {
  projectId: string
  hasVoted: boolean
  votePhase?: "popular" | "final"
  rating?: number
}

interface DemodayInfo {
  id: string
  name: string
  active: boolean
  currentPhase?: {
    name: string
    phaseNumber: number
  }
  phases: Array<{
    name: string
    phaseNumber: number
    startDate: string
    endDate: string
  }>
}

// Helper to check if voting is allowed based on Demoday phase
const isVotingPhaseActive = (demoday: any): boolean => {
  if (!demoday || !demoday.currentPhase) return false
  // Assuming phase 3 is popular voting, phase 4 is final voting
  return demoday.currentPhase.phaseNumber === 3 || demoday.currentPhase.phaseNumber === 4
}

const getVotePhaseForCurrentDemodayPhase = (demoday: any): "popular" | "final" | undefined => {
  if (!demoday || !demoday.currentPhase) return undefined
  if (demoday.currentPhase.phaseNumber === 3) return "popular"
  if (demoday.currentPhase.phaseNumber === 4) return "final"
  return undefined
}

export default function PublicVotingPage() {
  const params = useParams()
  const router = useRouter()
  const demodayId = params.id as string

  const { data: session } = useSession()
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("")
  const [demoday, setDemoday] = useState<DemodayInfo | null>(null)
  const [categories, setCategories] = useState<VotingCategory[]>([])
  const [userVotes, setUserVotes] = useState<Map<string, VoteData>>(new Map())
  const [projectRatings, setProjectRatings] = useState<Map<string, number>>(new Map())
  const [loading, setLoading] = useState(true)
  const [votingPhase, setVotingPhase] = useState<"popular" | "final" | null>(null)
  const [isVotingPeriod, setIsVotingPeriod] = useState(false)
  const { toast } = useToast()

  const { data: demodayDetails, isLoading: isLoadingDemoday, error: demodayError } = useDemodayDetails(demodayId)
  const { data: categoriesData, isLoading: isLoadingCategories } = useCategories(demodayId)

  // Fetch approved or finalist projects for voting
  const {
    data: projects = [],
    isLoading: isLoadingProjects,
    error: projectsError,
  } = useDemodayProjects(demodayId, {
    status: demoday?.currentPhase?.phaseNumber === 4 ? "finalist" : "approved", // or finalist for final voting phase
    categoryId: selectedCategoryId || undefined,
  })

  const { mutate: submitVote, isPending: isSubmittingVote } = useSubmitVote()

  const isLoading = isLoadingDemoday || isLoadingCategories || isLoadingProjects
  const pageError = demodayError?.message || projectsError?.message
  const demodayFinished = demoday && isDemodayFinished(demoday)

  useEffect(() => {
    if (demodayId) {
      fetchDemodayData()
      fetchProjects()
    }
  }, [demodayId])

  const fetchDemodayData = async () => {
    try {
      const response = await fetch(`/api/demoday/${demodayId}`)
      if (response.ok) {
        const data = await response.json()
        setDemoday(data)

        // Determine current voting phase
        const now = new Date()
        let currentVotingPhase: "popular" | "final" | null = null
        let votingPeriod = false

        // Check for popular voting (phase 3)
        const popularPhase = data.phases.find((p: any) => p.phaseNumber === 3)
        if (popularPhase) {
          const start = new Date(popularPhase.startDate)
          const end = new Date(popularPhase.endDate)
          if (now >= start && now <= end) {
            currentVotingPhase = "popular"
            votingPeriod = true
          }
        }

        // Check for final voting (phase 4)
        if (!votingPeriod) {
          const finalPhase = data.phases.find((p: any) => p.phaseNumber === 4)
          if (finalPhase) {
            const start = new Date(finalPhase.startDate)
            const end = new Date(finalPhase.endDate)
            if (now >= start && now <= end) {
              currentVotingPhase = "final"
              votingPeriod = true
            }
          }
        }

        setVotingPhase(currentVotingPhase)
        setIsVotingPeriod(votingPeriod)
      }
    } catch (error) {
      console.error("Error fetching demoday data:", error)
    }
  }

  const fetchProjects = async () => {
    setLoading(true)
    try {
      // Fetch project categories
      const categoriesResponse = await fetch(`/api/categories?demodayId=${demodayId}`)
      let projectCategories = []

      if (categoriesResponse.ok) {
        projectCategories = await categoriesResponse.json()
      }

      // Fetch approved/finalist projects
      const statusFilter = votingPhase === "final" ? "finalist" : "approved"
      const projectsResponse = await fetch(
        `/api/projects/submissions/demoday?demodayId=${demodayId}&status=${statusFilter}`
      )

      if (projectsResponse.ok) {
        const projects = await projectsResponse.json()

        // Group projects by category
        const categorizedProjects: VotingCategory[] = []

        // Add projects with categories
        for (const category of projectCategories) {
          const categoryProjects = projects.filter((p: any) => p.project?.categoryId === category.id)

          if (categoryProjects.length > 0) {
            categorizedProjects.push({
              id: category.id,
              name: category.name,
              submissions: categoryProjects,
            })
          }
        }

        // Add uncategorized projects
        const uncategorizedProjects = projects.filter(
          (p: any) => !p.project?.categoryId || !projectCategories.find((c: any) => c.id === p.project.categoryId)
        )

        if (uncategorizedProjects.length > 0) {
          categorizedProjects.push({
            id: "uncategorized",
            name: "Projetos Gerais",
            submissions: uncategorizedProjects,
          })
        }

        setCategories(categorizedProjects)

        // Fetch user votes for all projects
        await fetchUserVotes(projects.map((p: any) => p.project.id))
      }
    } catch (error) {
      console.error("Error fetching projects:", error)
      toast({
        title: "Erro",
        description: "Falha ao carregar projetos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchUserVotes = async (projectIds: string[]) => {
    const voteMap = new Map<string, VoteData>()

    for (const projectId of projectIds) {
      try {
        const response = await fetch(`/api/projects/vote?projectId=${projectId}`)
        if (response.ok) {
          const data = await response.json()
          voteMap.set(projectId, {
            projectId,
            hasVoted: data.hasVoted,
            votePhase: data.vote?.votePhase,
            rating: data.vote?.rating,
          })
        }
      } catch (error) {
        console.error(`Error fetching vote for project ${projectId}:`, error)
      }
    }

    setUserVotes(voteMap)
  }

  const handleVote = async (projectId: string) => {
    if (!votingPhase) {
      toast({
        title: "Votação indisponível",
        description: "Não estamos em período de votação",
        variant: "destructive",
      })
      return
    }

    try {
      const voteData: {
        projectId: string
        demodayId: string
        votePhase: "popular" | "final"
        rating?: number
      } = {
        projectId,
        demodayId,
        votePhase: votingPhase,
      }

      // Add rating for final voting phase
      if (votingPhase === "final") {
        const rating = projectRatings.get(projectId)
        if (!rating || rating < 1 || rating > 5) {
          toast({
            title: "Avaliação necessária",
            description: "Por favor, selecione uma avaliação de 1 a 5 estrelas para este projeto",
            variant: "destructive",
          })
          return
        }

        Object.assign(voteData, { rating })
      }

      const response = await fetch("/api/projects/vote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(voteData),
      })

      if (response.ok) {
        toast({
          title: "Voto registrado",
          description: `Seu voto foi registrado com sucesso!`,
        })

        // Update local vote state
        const newVoteData = {
          projectId,
          hasVoted: true,
          votePhase: votingPhase,
          rating: voteData.rating,
        }
        setUserVotes((prev) => new Map(prev.set(projectId, newVoteData)))
      } else {
        const error = await response.json()
        toast({
          title: "Erro ao votar",
          description: error.error || "Falha ao registrar voto",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error voting:", error)
      toast({
        title: "Erro",
        description: "Falha ao registrar voto",
        variant: "destructive",
      })
    }
  }

  const handleRatingChange = (projectId: string, rating: number) => {
    setProjectRatings((prev) => new Map(prev.set(projectId, rating)))
  }

  const getPhaseDescription = () => {
    if (!votingPhase) return "Fora do período de votação"

    if (votingPhase === "popular") {
      return "Votação Popular - Vote nos projetos que devem ser finalistas"
    } else {
      return "Votação Final - Vote nos finalistas para escolher os vencedores"
    }
  }

  const getVoteButtonText = (projectId: string) => {
    const voteData = userVotes.get(projectId)
    if (voteData?.hasVoted && voteData.votePhase === votingPhase) {
      return "Já votado"
    }

    if (votingPhase === "popular") {
      return "Deve ser finalista"
    } else {
      return "Votar como vencedor"
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <p>Carregando projetos...</p>
        </div>
      </div>
    )
  }

  if (pageError) {
    return (
      <div className="container mx-auto p-6 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-red-600">Erro ao Carregar Página</h2>
        <p className="text-muted-foreground">{pageError}</p>
        <Button onClick={() => router.push("/")} className="mt-4">
          Ir para Início
        </Button>
      </div>
    )
  }

  if (!demoday) {
    return (
      <div className="container mx-auto p-6 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold">Demoday Não Encontrado</h2>
        <p className="text-muted-foreground">O Demoday solicitado não foi encontrado.</p>
        <Button onClick={() => router.push("/")} className="mt-4">
          Ir para Início
        </Button>
      </div>
    )
  }

  const votingActive = isVotingPhaseActive(demoday) && !demodayFinished
  const currentVotePhaseForDisplay = getVotePhaseForCurrentDemodayPhase(demoday)

  // Project filtering logic based on voting phase
  let displayProjects = projects
  if (demoday?.currentPhase?.phaseNumber === 3) {
    // Popular voting
    displayProjects = projects.filter((p) => p.status === "approved" || p.status === "finalist")
  } else if (demoday?.currentPhase?.phaseNumber === 4) {
    // Final voting
    displayProjects = projects.filter((p) => p.status === "finalist")
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      <header className="mb-8">
        <Button variant="outline" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <h1 className="text-4xl font-bold tracking-tight text-center">{demoday.name}</h1>
        <p className="text-lg text-muted-foreground text-center mt-2">
          {demodayFinished
            ? "🎉 Este Demoday foi finalizado! Confira os resultados finais."
            : votingActive
              ? `Fase atual: ${demoday.currentPhase?.name}. Escolha seus projetos favoritos!`
              : "O período de votação está fechado no momento."}
        </p>
      </header>

      {/* Demoday Finalizado - Destaque especial */}
      {demodayFinished && (
        <Card className="border-2 border-yellow-300 bg-gradient-to-r from-yellow-50 via-orange-50 to-red-50 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-2xl text-yellow-800 justify-center">
              <Trophy className="h-8 w-8 text-yellow-600" />
              🎊 Demoday Finalizado! 🎊
              <Trophy className="h-8 w-8 text-yellow-600" />
            </CardTitle>
            <CardDescription className="text-yellow-700 text-lg font-medium text-center">
              Todas as fases foram concluídas! Os resultados finais estão disponíveis.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="bg-white/70 rounded-lg p-4 mb-4">
              <p className="text-gray-700 font-medium">
                🏆 Obrigado a todos que participaram das votações! Confira agora quais projetos foram os grandes
                vencedores.
              </p>
            </div>
            <div className="flex justify-center gap-4">
              <Link href={`/demoday/${demodayId}/results`}>
                <Button className="bg-yellow-600 hover:bg-yellow-700 text-white text-lg px-6 py-3">
                  <Trophy className="mr-2 h-5 w-5" />
                  Ver Resultados Finais
                  <CheckCircle className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button
                variant="outline"
                onClick={() => router.push("/dashboard")}
                className="border-yellow-500 text-yellow-700 hover:bg-yellow-50"
              >
                Voltar ao Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {categories && categories.length > 0 && votingActive && !demodayFinished && (
        <div className="max-w-sm mx-auto">
          <Select
            value={selectedCategoryId || "all"}
            onValueChange={(value) => setSelectedCategoryId(value === "all" ? "" : value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Categorias</SelectItem>
              {categories.map((category: VotingCategory) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {!votingActive && !demodayFinished && (
        <Card className="text-center py-8">
          <CardHeader>
            <CardTitle>Votação Encerrada</CardTitle>
            <CardDescription>
              O período de votação para este Demoday não está ativo no momento. Volte mais tarde ou veja os resultados
              se disponíveis.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href={`/demoday/${demodayId}/results`}>
              <Button>Ver Resultados (se disponível)</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {votingActive && !demodayFinished && displayProjects.length === 0 && (
        <Card className="text-center py-8">
          <CardHeader>
            <CardTitle>Nenhum Projeto Disponível para Votação</CardTitle>
            <CardDescription>
              Atualmente não há projetos nesta categoria/status disponíveis para votação.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-sm text-muted-foreground space-y-2">
              <p>
                💡 <strong>Possíveis motivos:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 text-left max-w-md mx-auto">
                <li>Ainda não há projetos submetidos</li>
                <li>Os projetos ainda não foram aprovados pelos administradores</li>
                <li>Todos os projetos estão em outras categorias</li>
              </ul>
              <div className="pt-4">
                <Link href="/dashboard" className="inline-block">
                  <Button variant="outline">Voltar ao Dashboard</Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {votingActive && !demodayFinished && displayProjects.length > 0 && (
        <Tabs defaultValue={categories[0]?.id} className="w-full">
          <TabsList className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mb-6">
            {categories.map((category) => (
              <TabsTrigger key={category.id} value={category.id} className="text-center">
                {category.name}
                <Badge variant="secondary" className="ml-2">
                  {category.submissions.length}
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>

          {categories.map((category) => (
            <TabsContent key={category.id} value={category.id}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {category.submissions.map((submission) => {
                  const voteData = userVotes.get(submission.project.id)
                  const hasVoted = voteData?.hasVoted && voteData.votePhase === votingPhase

                  return (
                    <Card key={submission.id} className={`transition-all ${hasVoted ? "ring-2 ring-green-500" : ""}`}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <CardTitle className="text-lg">{submission.project.title}</CardTitle>
                            <CardDescription className="mt-1">Por {submission.project.author.name}</CardDescription>
                          </div>
                          <Badge variant="outline">{submission.project.type}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                          {submission.project.description}
                        </p>

                        <div className="space-y-2 mb-4">
                          <div className="text-sm">
                            <strong>Autores:</strong> {submission.project.authors}
                          </div>
                          <div className="text-sm">
                            <strong>Orientador:</strong> {submission.project.advisor}
                          </div>
                          {submission.project.workCategory && (
                            <div className="text-sm">
                              <strong>Categoria:</strong> {submission.project.workCategory}
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2 mb-4">
                          {submission.project.videoUrl && (
                            <Button variant="outline" size="sm" asChild>
                              <a href={submission.project.videoUrl} target="_blank" rel="noopener noreferrer">
                                Ver Vídeo
                              </a>
                            </Button>
                          )}
                          {submission.project.repositoryUrl && (
                            <Button variant="outline" size="sm" asChild>
                              <a href={submission.project.repositoryUrl} target="_blank" rel="noopener noreferrer">
                                Ver Código
                              </a>
                            </Button>
                          )}
                        </div>

                        {votingPhase === "final" ? (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">Sua avaliação:</span>
                              <StarRating
                                value={projectRatings.get(submission.project.id) || 0}
                                onChange={(rating) => handleRatingChange(submission.project.id, rating)}
                                readonly={voteData?.hasVoted && voteData?.votePhase === "final"}
                                size="md"
                              />
                            </div>

                            <Button
                              onClick={() => handleVote(submission.project.id)}
                              disabled={hasVoted}
                              className={`w-full ${hasVoted ? "bg-green-600 hover:bg-green-700" : ""}`}
                              variant={hasVoted ? "default" : "default"}
                            >
                              <Star className="h-4 w-4 mr-2" />
                              {getVoteButtonText(submission.project.id)}
                            </Button>
                          </div>
                        ) : (
                          <Button
                            onClick={() => handleVote(submission.project.id)}
                            disabled={hasVoted}
                            className={`w-full ${hasVoted ? "bg-green-600 hover:bg-green-700" : ""}`}
                            variant={hasVoted ? "default" : "default"}
                          >
                            <ThumbsUp className="h-4 w-4 mr-2" />
                            {getVoteButtonText(submission.project.id)}
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  )
}
