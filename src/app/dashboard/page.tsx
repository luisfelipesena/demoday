"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useDemodays, useActiveDemodayPhase } from "@/hooks/useDemoday"
import { useUserSubmissions, useAllSubmissions } from "@/hooks/useSubmitWork"
import { formatDate, isDemodayFinished } from "@/utils/date-utils"
import {
  Calendar,
  Clock,
  Loader,
  Vote,
  Trophy,
  Crown,
  FileText,
  Users,
  CheckCircle,
  Timer,
  Zap,
  Star,
  Target,
  Award,
  Sparkles
} from "lucide-react"
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
        <Loader className="h-12 w-12 rounded-full animate-spin text-blue-600" />
        <p className="ml-4 text-gray-600">Verificando autenticação...</p>
      </div>
    )
  }

  if (isLoading || phaseLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <Skeleton className="h-16 w-16 rounded-full mx-auto" />
          <Skeleton className="h-4 w-48 mx-auto" />
        </div>
      </div>
    )
  }

  const userRole = session?.user?.role || "student_ufba"
  const userName = session?.user?.name || "Usuário"
  const demodayFinished = activeDemoday && isDemodayFinished(activeDemoday)

  const hasUserSubmissions = !isLoadingUserSubmissions && userSubmissions.length > 0
  const hasAnySubmissions = !isLoadingAllSubmissions && allSubmissions.length > 0

  const getPhaseInfo = () => {
    if (!phaseInfo?.currentPhase) return null;

    const phaseNumber = phaseInfo.currentPhase.phaseNumber;
    const phaseConfigs = {
      1: {
        name: "Período de Submissão",
        description: "Submeta seus trabalhos práticos para avaliação",
        icon: FileText,
        color: "from-blue-500 to-indigo-600",
        bgColor: "bg-blue-50",
        borderColor: "border-blue-200",
        textColor: "text-blue-800"
      },
      2: {
        name: "Período de Triagem",
        description: "Projetos estão sendo avaliados pelos administradores",
        icon: CheckCircle,
        color: "from-emerald-500 to-teal-600",
        bgColor: "bg-emerald-50",
        borderColor: "border-emerald-200",
        textColor: "text-emerald-800"
      },
      3: {
        name: "Votação Popular",
        description: "Vote nos projetos mais interessantes!",
        icon: Vote,
        color: "from-purple-500 to-violet-600",
        bgColor: "bg-purple-50",
        borderColor: "border-purple-200",
        textColor: "text-purple-800"
      },
      4: {
        name: "Votação Final",
        description: "Professores escolhem os vencedores finais",
        icon: Crown,
        color: "from-amber-500 to-orange-600",
        bgColor: "bg-amber-50",
        borderColor: "border-amber-200",
        textColor: "text-amber-800"
      }
    };

    return phaseConfigs[phaseNumber as keyof typeof phaseConfigs] || {
      name: `Fase ${phaseNumber}`,
      description: phaseInfo.currentPhase.description || "Fase em andamento",
      icon: Timer,
      color: "from-gray-500 to-gray-600",
      bgColor: "bg-gray-50",
      borderColor: "border-gray-200",
      textColor: "text-gray-800"
    };
  };

  const currentPhase = getPhaseInfo();

  const getWelcomeMessage = () => {
    if (demodayFinished) {
      return {
        title: `Parabéns, ${userName}! 🎉`,
        subtitle: "O Demoday foi finalizado com sucesso!"
      };
    }

    const roleMessages = {
      admin: {
        title: `Olá, ${userName}! 👋`,
        subtitle: "Gerencie o Demoday e acompanhe o progresso"
      },
      professor: {
        title: `Bem-vindo, Prof. ${userName}! 🎓`,
        subtitle: "Acompanhe os projetos e participe das votações"
      },
      student_ufba: {
        title: `Olá, ${userName}! 🚀`,
        subtitle: "Participe do Demoday e mostre seus projetos"
      }
    };

    return roleMessages[userRole as keyof typeof roleMessages] || roleMessages.student_ufba;
  };

  const welcomeMsg = getWelcomeMessage();

  const getQuickActions = () => {
    const actions = [];

    if (demodayFinished) {
      actions.push({
        title: "Ver Resultados Finais",
        description: "Confira os projetos vencedores",
        icon: Trophy,
        href: `/demoday/${activeDemoday?.id}/results`,
        color: "from-yellow-500 to-amber-600",
        primary: true
      });
    } else if (currentPhase) {
      const phaseNumber = phaseInfo?.currentPhase?.phaseNumber;

      // Submissão
      if (phaseNumber === 1) {
        if (userRole !== "admin") {
          actions.push({
            title: "Submeter Trabalho",
            description: "Envie seu projeto para avaliação",
            icon: FileText,
            href: `/dashboard/demoday/${activeDemoday?.id}/submit`,
            color: "from-blue-500 to-indigo-600",
            primary: true
          });
        }
      }

      // Triagem (apenas admins)
      if (phaseNumber === 2 && userRole === "admin") {
        actions.push({
          title: "Avaliar Projetos",
          description: "Faça a triagem dos projetos submetidos",
          icon: CheckCircle,
          href: "/dashboard/evaluations",
          color: "from-emerald-500 to-teal-600",
          primary: true
        });
      }

      // Votação Popular (TODOS podem votar)
      if (phaseNumber === 3) {
        actions.push({
          title: "Votar nos Projetos",
          description: "Escolha seus projetos favoritos",
          icon: Vote,
          href: `/demoday/${activeDemoday?.id}/voting`,
          color: "from-purple-500 to-violet-600",
          primary: true
        });
      }

      // Votação Final (TODOS podem votar)
      if (phaseNumber === 4) {
        actions.push({
          title: "Votação Final",
          description: "Vote nos finalistas",
          icon: Crown,
          href: `/demoday/${activeDemoday?.id}/voting`,
          color: "from-amber-500 to-orange-600",
          primary: true
        });
      }
    }

    // Submissões (sempre disponível se houver)
    if ((userRole === "admin" || userRole === "professor") && hasAnySubmissions) {
      actions.push({
        title: "Ver Todas as Submissões",
        description: `${allSubmissions.length} projetos submetidos`,
        icon: Users,
        href: `/dashboard/demoday/${activeDemoday?.id}/submissions`,
        color: "from-slate-500 to-gray-600"
      });
    } else if (hasUserSubmissions) {
      actions.push({
        title: "Minhas Submissões",
        description: `${userSubmissions.length} projeto(s) enviado(s)`,
        icon: FileText,
        href: `/dashboard/demoday/${activeDemoday?.id}/submissions`,
        color: "from-slate-500 to-gray-600"
      });
    }

    return actions;
  };

  const quickActions = getQuickActions();

  if (!activeDemoday) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
          <div className="p-8 rounded-full bg-blue-50">
            <Calendar className="h-16 w-16 text-blue-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Nenhum Demoday Ativo</h1>
            <p className="text-gray-600 text-lg max-w-md">
              Não há um Demoday ativo no momento. Entre em contato com o administrador para mais informações.
            </p>
          </div>
          {userRole === "admin" && (
            <Link href="/dashboard/admin/demoday/new">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                <Star className="mr-2 h-5 w-5" />
                Criar Novo Demoday
              </Button>
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Welcome Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold text-gray-900">
          {welcomeMsg.title}
        </h1>
        <p className="text-xl text-gray-600">{welcomeMsg.subtitle}</p>
      </div>

      {/* Fase Atual do Demoday */}
      {currentPhase && !demodayFinished && (
        <Card className={`border-2 ${currentPhase.borderColor} ${currentPhase.bgColor}`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={`p-4 rounded-full bg-gradient-to-r ${currentPhase.color} text-white shadow-lg`}>
                  <currentPhase.icon className="h-8 w-8" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <CardTitle className={`text-2xl font-bold ${currentPhase.textColor}`}>
                      Fase Atual:
                    </CardTitle>
                    <Badge className={`bg-gradient-to-r ${currentPhase.color} text-white px-3 py-1`}>
                      Ativo
                    </Badge>
                  </div>
                  <CardTitle className={`text-3xl font-bold ${currentPhase.textColor} mb-2`}>
                    {currentPhase.name}
                  </CardTitle>
                  <CardDescription className={`text-lg ${currentPhase.textColor} opacity-90`}>
                    {currentPhase.description}
                  </CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>
      )}

      {/* Demoday Finalizado */}
      {demodayFinished && (
        <Card className="border-2 border-yellow-300 bg-yellow-50">
          <CardHeader className="text-center">
            <div className="flex justify-center items-center space-x-3 mb-4">
              <Crown className="h-12 w-12 text-yellow-600" />
              <Sparkles className="h-8 w-8 text-orange-500" />
            </div>
            <CardTitle className="text-3xl font-bold text-yellow-800 mb-2">
              🎉 {activeDemoday.name} - Finalizado! 🎉
            </CardTitle>
            <CardDescription className="text-xl text-yellow-700">
              Todas as fases foram concluídas com sucesso! Confira os resultados finais.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Quick Actions */}
      {quickActions.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Zap className="mr-2 h-6 w-6 text-blue-600" />
            Ações Rápidas
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {quickActions.map((action, index) => (
              <Link key={index} href={action.href}>
                <Card className={`hover:shadow-lg transition-all duration-200 cursor-pointer group ${
                  action.primary ? 'border-2 border-blue-200 hover:border-blue-300' : 'hover:shadow-md'
                }`}>
                  <CardHeader>
                    <div className="flex items-center space-x-4">
                      <div className={`p-3 rounded-full bg-gradient-to-r ${action.color} text-white group-hover:scale-110 transition-transform`}>
                        <action.icon className="h-6 w-6" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {action.title}
                        </CardTitle>
                        <CardDescription className="text-gray-600">
                          {action.description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Informações do Demoday */}
      <Card className="bg-slate-50 border-slate-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Award className="h-8 w-8 text-blue-600" />
              <div>
                <CardTitle className="text-xl font-bold text-slate-800">
                  {activeDemoday.name}
                </CardTitle>
                <CardDescription className="flex items-center text-slate-600 mt-1">
                  <Calendar className="h-4 w-4 mr-2" />
                  Iniciado em {formatDate(activeDemoday.createdAt)}
                </CardDescription>
              </div>
            </div>
            <Badge className={`${demodayFinished ? 'bg-green-500' : 'bg-blue-500'} text-white`}>
              {demodayFinished ? 'Finalizado' : 'Ativo'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-slate-700 leading-relaxed">
            O Demoday é um concurso onde você pode submeter seus trabalhos práticos já desenvolvidos
            (ex: Iniciação Científica, TCC, projeto de disciplina) para avaliação e reconhecimento.
          </p>
        </CardContent>
      </Card>

      {/* Painel Administrativo */}
      {userRole === "admin" && (
        <Card className="border-slate-200 bg-slate-50">
          <CardHeader>
            <CardTitle className="text-slate-800 flex items-center">
              <Target className="mr-2 h-5 w-5" />
              Painel Administrativo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link href="/dashboard/admin/demoday">
                <Button variant="outline" className="w-full justify-start border-slate-300 text-slate-700 hover:bg-slate-100">
                  <Calendar className="mr-2 h-4 w-4" />
                  Gerenciar Demodays
                </Button>
              </Link>
              <Link href="/dashboard/users">
                <Button variant="outline" className="w-full justify-start border-slate-300 text-slate-700 hover:bg-slate-100">
                  <Users className="mr-2 h-4 w-4" />
                  Gerenciar Usuários
                </Button>
              </Link>
              <Link href="/dashboard/admin/results">
                <Button variant="outline" className="w-full justify-start border-slate-300 text-slate-700 hover:bg-slate-100">
                  <Trophy className="mr-2 h-4 w-4" />
                  Resultados
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}