"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useDemodays, useActiveDemodayPhase } from "@/hooks/useDemoday"
import { useUserSubmissions, useAllSubmissions } from "@/hooks/useSubmitWork"
import { isInSubmissionPhase, formatDate, isDemodayFinished } from "@/utils/date-utils"
import { CalendarIcon, ClockIcon, Loader, Vote, ExternalLink, Trophy, Crown, Sparkles, FileText } from "lucide-react"
import { useSession } from "@/lib/auth-client"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function DashboardPage() {
  const router = useRouter()
  const { data: session, isPending: sessionLoading } = useSession()
  const { data: demodays, isLoading } = useDemodays()
  const { data: phaseInfo, isLoading: phaseLoading } = useActiveDemodayPhase()
  
  const activeDemoday = demodays?.find((demoday) => demoday.active)
  const { data: userSubmissions = [], isLoading: isLoadingUserSubmissions } = useUserSubmissions(
    activeDemoday?.id || null
  )
  const { data: allSubmissions = [], isLoading: isLoadingAllSubmissions } = useAllSubmissions(
    activeDemoday?.id || null
  )
  
  useEffect(() => {
    if (!sessionLoading && !session) {
      router.push("/login")
    }
  }, [session, sessionLoading, router])

  if (sessionLoading || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader className="h-12 w-12 rounded-full animate-spin" />
        <p className="ml-4">Verificando autenticação...</p>
      </div>
    )
  }

  if (isLoading || phaseLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Skeleton className="h-16 w-16" />
        </div>
      </div>
    )
  }

  const submissionEnabled = activeDemoday && isInSubmissionPhase(activeDemoday)
  const demodayFinished = activeDemoday && isDemodayFinished(activeDemoday)
  
  // Lógica para mostrar botão de submissões
  const isAdminOrProfessor = session?.user?.role === "admin" || session?.user?.role === "professor"
  const hasUserSubmissions = !isLoadingUserSubmissions && userSubmissions.length > 0
  const hasAnySubmissions = !isLoadingAllSubmissions && allSubmissions.length > 0
  
  // Admin/Professor podem ver submissões desde a fase 1 (quando há submissões)
  // Alunos só veem suas próprias submissões quando tiverem alguma
  const shouldShowSubmissionsButton = isAdminOrProfessor 
    ? hasAnySubmissions 
    : hasUserSubmissions
  
  const getPhaseDisplayInfo = () => {
    if (!phaseInfo?.currentPhase) return null;
    
    const phaseNames = ["Submissão", "Avaliação", "Votação Popular", "Votação Final"];
    const phaseName = phaseNames[phaseInfo.currentPhase.phaseNumber - 1] || `Fase ${phaseInfo.currentPhase.phaseNumber}`;
    
    if (phaseInfo.currentPhase.phaseNumber === 3) {
      return {
        name: phaseName,
        description: "Vote nos projetos mais interessantes para escolher os finalistas!",
        color: "bg-purple-100 text-purple-800 border-purple-200",
        showVoting: true
      };
    }
    
    if (phaseInfo.currentPhase.phaseNumber === 4) {
      const isAuthorized = session?.user?.role === 'professor' || session?.user?.role === 'admin';
      return {
        name: phaseName,
        description: isAuthorized 
          ? "Votação final entre professores para escolher os vencedores!" 
          : "Professores estão escolhendo os vencedores entre os finalistas.",
        color: "bg-orange-100 text-orange-800 border-orange-200", 
        showVoting: true
      };
    }
    
    if (phaseInfo.currentPhase.phaseNumber === 2) {
      return {
        name: phaseName,
        description: "Avalie os projetos submetidos usando os critérios definidos.",
        color: "bg-blue-100 text-blue-800 border-blue-200",
        showVoting: false
      };
    }
    
    return {
      name: phaseName,
      description: phaseInfo.currentPhase.description || "Fase em andamento",
      color: "bg-gray-100 text-gray-800 border-gray-200",
      showVoting: false
    };
  };

  const phaseDisplay = getPhaseDisplayInfo();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      {/* Seção de Demoday Finalizado - Destaque especial */}
      {demodayFinished && activeDemoday && (
        <Card className="border-2 border-yellow-300 bg-gradient-to-r from-yellow-50 via-orange-50 to-red-50 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-2xl text-yellow-800">
              <Crown className="h-8 w-8 text-yellow-600" />
              🎉 {activeDemoday.name} - Finalizado!
              <Sparkles className="h-6 w-6 text-yellow-600" />
            </CardTitle>
            <CardDescription className="text-yellow-700 text-lg font-medium">
              O Demoday chegou ao fim! Confira a apresentação final e descubra os projetos vencedores.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-white/70 rounded-lg p-4 mb-4">
              <p className="text-gray-700 font-medium">
                🏆 Todas as fases foram concluídas com sucesso! Os votos foram computados e os vencedores foram determinados.
              </p>
            </div>
            <div className="flex gap-4">
              <Link href={`/demoday/${activeDemoday.id}/results`}>
                <Button className="bg-yellow-600 hover:bg-yellow-700 text-white text-lg px-6 py-3">
                  <Trophy className="mr-2 h-5 w-5" />
                  Ver apresentação final
                  <Crown className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href={`/demoday/${activeDemoday.id}`}>
                <Button variant="outline" className="border-yellow-500 text-yellow-700 hover:bg-yellow-50">
                  Ver detalhes do evento
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Seção de Votação - Destaque especial quando em fase de votação */}
      {!demodayFinished && phaseDisplay?.showVoting && activeDemoday && (
        <Card className="border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-800">
              <Vote className="h-6 w-6" />
              {phaseDisplay.name} em Andamento!
            </CardTitle>
            <CardDescription className="text-purple-700 text-base">
              {phaseDisplay.description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Link href={`/demoday/${activeDemoday.id}/voting`}>
                <Button className="bg-purple-600 hover:bg-purple-700">
                  <Vote className="mr-2 h-4 w-4" />
                  Ir para votação
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href={`/demoday/${activeDemoday.id}/results`}>
                <Button variant="outline" className="border-purple-500 text-purple-600 hover:bg-purple-50">
                  <Trophy className="mr-2 h-4 w-4" />
                  Ver resultados
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      <div>
        <h2 className="mb-4 text-2xl font-semibold">
          {demodayFinished ? "Demoday Finalizado" : "Demoday Ativo"}
        </h2>

        {activeDemoday ? (
          <Card className={`${demodayFinished 
            ? "bg-gradient-to-r from-green-50 to-blue-50 border-green-200" 
            : "bg-gradient-to-r from-blue-50 to-white border-blue-200"
          }`}>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className={`text-xl font-bold ${demodayFinished ? "text-green-800" : "text-blue-800"}`}>
                    {activeDemoday.name}
                  </CardTitle>
                  <CardDescription className={`flex items-center gap-2 mt-1 ${demodayFinished ? "text-green-600" : "text-blue-600"}`}>
                    <CalendarIcon className="h-4 w-4" />
                    <span>Iniciado em {formatDate(activeDemoday.createdAt)}</span>
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={demodayFinished ? "bg-green-500 hover:bg-green-600" : "bg-green-500 hover:bg-green-600"}>
                    {demodayFinished ? "Finalizado" : "Ativo"}
                  </Badge>
                  {phaseDisplay && !demodayFinished && (
                    <Badge className={phaseDisplay.color}>
                      {phaseDisplay.name}
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {demodayFinished ? (
                <div>
                                  <p className="text-gray-600 mb-4">
                  Este Demoday foi concluído com sucesso! Todas as fases foram finalizadas e a apresentação está disponível.
                </p>
                  <div className="rounded-md p-3 border bg-green-50 border-green-200 mb-4">
                    <p className="font-medium text-green-800">
                      🎊 Parabéns a todos os participantes! Confira a apresentação final para ver os projetos vencedores.
                    </p>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-gray-600 mb-4">
                O Demoday é um concurso onde você pode submeter seus trabalhos práticos já desenvolvidos 
                (ex: Iniciação Científica, TCC, projeto de disciplina) para avaliação.
              </p>
                  
                  {phaseDisplay && (
                    <div className={`rounded-md p-3 border ${phaseDisplay.color} mb-4`}>
                      <p className="font-medium">
                        {phaseDisplay.description}
                      </p>
                    </div>
                  )}
              
              {submissionEnabled ? (
                <div className="mt-4 rounded-md bg-green-50 p-3 border border-green-200">
                  <p className="text-green-700 font-medium">
                    Período de submissões aberto! Submeta seu trabalho para concorrer.
                  </p>
                </div>
                  ) : !phaseDisplay?.showVoting && (
                <div className="mt-4 rounded-md bg-amber-50 p-3 border border-amber-200">
                  <p className="text-amber-700 font-medium">
                    O período de submissões não está aberto no momento. Aguarde a fase de submissão.
                  </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              {demodayFinished ? (
                <>
                  {shouldShowSubmissionsButton && (
                    <Link href={`/dashboard/demoday/${activeDemoday.id}/submissions`}>
                      <Button variant="outline" className="border-blue-500 text-blue-600 hover:bg-blue-50">
                        <FileText className="mr-2 h-4 w-4" />
                        {isAdminOrProfessor ? "Ver submissões" : "Ver minhas submissões"}
                      </Button>
                    </Link>
                  )}
                <Link href={`/demoday/${activeDemoday.id}/results`}>
                  <Button className="bg-green-600 hover:bg-green-700">
                    <Trophy className="mr-2 h-4 w-4" />
                    Ver Resultados Finais
                  </Button>
                </Link>
                </>
              ) : (
                <>
              {submissionEnabled && (
                <Link href={`/dashboard/demoday/${activeDemoday.id}/submit`}>
                  <Button className="bg-blue-600 hover:bg-blue-700">Submeter trabalho</Button>
                </Link>
              )}
                  {shouldShowSubmissionsButton && (
              <Link href={`/dashboard/demoday/${activeDemoday.id}/submissions`}>
                      <Button variant="outline" className="border-blue-500 text-blue-600 hover:bg-blue-50">
                        <FileText className="mr-2 h-4 w-4" />
                        {isAdminOrProfessor ? "Ver submissões" : "Ver minhas submissões"}
                      </Button>
              </Link>
                  )}
                </>
              )}
            </CardFooter>
          </Card>
        ) : (
          <div className="rounded-lg border p-8 text-center bg-gray-50">
            <p className="text-lg text-gray-600">Nenhum Demoday ativo no momento.</p>
            {session?.user?.role === "admin" && (
              <div className="mt-4">
                <Link href="/dashboard/admin/demoday/new">
                  <Button className="bg-blue-600 hover:bg-blue-700">Criar novo Demoday</Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>


    </div>
  )
}
