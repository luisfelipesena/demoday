"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useDemodayDetails } from "@/hooks/useDemoday"
import { Award, CalendarIcon, CheckCircle2, Clock, FileText, Users } from "lucide-react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { use } from "react"

interface DemodayDetails {
  id: string
  name: string
  active: boolean
  status: "active" | "finished" | "canceled"
  createdAt: string
  updatedAt: string
  phases: Array<{
    id: string
    name: string
    description: string
    phaseNumber: number
    startDate: string
    endDate: string
  }>
  stats: {
    totalProjects: number
    submitted: number
    approved: number
    finalists: number
    winners: number
  }
  currentPhase: {
    id: string
    name: string
    phaseNumber: number
  } | null
}

interface DemodayPageProps {
  params: Promise<{ id: string }>
}

export default function DemodayDetailsPage({ params }: DemodayPageProps) {
  const resolvedParams = use(params)
  const router = useRouter()
  const { data: session, status } = useSession()
  const demodayId = resolvedParams.id
  const { data: demoday, isLoading: loading, error } = useDemodayDetails(demodayId)

  // Redirecionar para login se não estiver autenticado
  if (status === "unauthenticated") {
    router.push("/login")
    return null
  }

  // Mostrar carregamento durante verificação da sessão
  if (status === "loading" || loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-6 flex items-center justify-between">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-9 w-24" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Skeleton className="h-40 w-full rounded-lg mb-4" />
            <div className="grid grid-cols-1 gap-4">
              <Skeleton className="h-32 w-full rounded-lg" />
              <Skeleton className="h-32 w-full rounded-lg" />
            </div>
          </div>
          <div>
            <Skeleton className="h-64 w-full rounded-lg mb-4" />
            <Skeleton className="h-40 w-full rounded-lg" />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <h1 className="text-2xl font-bold text-red-700 mb-2">Erro</h1>
          <p className="text-red-600">{error.message}</p>
          <Button onClick={() => router.push("/dashboard")} className="mt-4 bg-red-600 hover:bg-red-700">
            Voltar ao Dashboard
          </Button>
        </div>
      </div>
    )
  }

  if (!demoday) {
    return (
      <div className="container mx-auto p-6">
        <div className="rounded-lg border p-6 text-center">
          <h1 className="text-2xl font-bold mb-2">Demoday não encontrado</h1>
          <p className="text-gray-600">Não foi possível encontrar o Demoday solicitado.</p>
          <Button onClick={() => router.push("/dashboard")} className="mt-4">
            Voltar ao Dashboard
          </Button>
        </div>
      </div>
    )
  }

  // Formatar datas
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date)
  }

  // Formatar data e hora
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{demoday.name}</h1>
          <p className="text-gray-500">
            {demoday.active ? "Demoday ativo" : "Demoday finalizado"} • Criado em {formatDate(demoday.createdAt)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={`${demoday.active ? "bg-green-500" : "bg-blue-500"}`}>
            {demoday.active ? "Ativo" : "Finalizado"}
          </Badge>
          <Link href={`/dashboard/admin/demoday/${demoday.id}/edit`}>
            <Button variant="outline" className="border-blue-500 text-blue-600 hover:bg-blue-50">
              Editar
            </Button>
          </Link>
          <Button variant="outline" onClick={() => router.push("/dashboard/admin/demoday")}>
            Voltar
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="phases">Fases</TabsTrigger>
          <TabsTrigger value="projects">Projetos</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Sobre este Demoday</CardTitle>
                  <CardDescription>Informações gerais sobre o evento</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium">Status</h3>
                      <p className="text-gray-600">
                        {demoday.active ? "Este Demoday está atualmente ativo" : "Este Demoday já foi finalizado"}
                      </p>
                    </div>

                    <div>
                      <h3 className="font-medium">Fase Atual</h3>
                      <p className="text-gray-600">
                        {demoday.currentPhase
                          ? `${demoday.currentPhase.name} (Fase ${demoday.currentPhase.phaseNumber})`
                          : "Nenhuma fase ativa no momento"}
                      </p>
                    </div>

                    <div>
                      <h3 className="font-medium">Datas</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-gray-600">
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="h-4 w-4" />
                          <span>Início: {formatDate(demoday.createdAt)}</span>
                        </div>
                        {!demoday.active && (
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span>Término: {formatDate(demoday.updatedAt)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Estatísticas</CardTitle>
                  <CardDescription>Números do Demoday</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                    <div className="flex flex-col items-center p-3 border rounded-lg bg-gray-50">
                      <FileText className="h-6 w-6 text-gray-600 mb-2" />
                      <span className="text-2xl font-bold">{demoday.stats?.totalProjects || 0}</span>
                      <span className="text-xs text-gray-600">Projetos</span>
                    </div>

                    <div className="flex flex-col items-center p-3 border rounded-lg bg-gray-50">
                      <Users className="h-6 w-6 text-blue-600 mb-2" />
                      <span className="text-2xl font-bold">{demoday.stats?.submitted || 0}</span>
                      <span className="text-xs text-gray-600">Submetidos</span>
                    </div>

                    <div className="flex flex-col items-center p-3 border rounded-lg bg-gray-50">
                      <CheckCircle2 className="h-6 w-6 text-green-600 mb-2" />
                      <span className="text-2xl font-bold">{demoday.stats?.approved || 0}</span>
                      <span className="text-xs text-gray-600">Aprovados</span>
                    </div>

                    <div className="flex flex-col items-center p-3 border rounded-lg bg-gray-50">
                      <Award className="h-6 w-6 text-amber-500 mb-2" />
                      <span className="text-2xl font-bold">{demoday.stats?.finalists || 0}</span>
                      <span className="text-xs text-gray-600">Finalistas</span>
                    </div>

                    <div className="flex flex-col items-center p-3 border rounded-lg bg-gray-50">
                      <Award className="h-6 w-6 text-purple-600 mb-2" />
                      <span className="text-2xl font-bold">{demoday.stats?.winners || 0}</span>
                      <span className="text-xs text-gray-600">Vencedores</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div>
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Fases do Demoday</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {demoday.phases.map((phase) => (
                      <div
                        key={phase.id}
                        className={`border-l-2 pl-4 ${
                          demoday.currentPhase?.id === phase.id ? "border-blue-500" : "border-gray-200"
                        }`}
                      >
                        <h3 className={`font-medium ${demoday.currentPhase?.id === phase.id ? "text-blue-700" : ""}`}>
                          {phase.name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {formatDate(phase.startDate)} - {formatDate(phase.endDate)}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">{phase.description}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {!demoday.active && (
                <Card>
                  <CardHeader>
                    <CardTitle>Resultados</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <Link href={`/dashboard/demoday/${demoday.id}/results`}>
                        <Button className="w-full">Ver Resultados</Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="phases">
          <Card>
            <CardHeader>
              <CardTitle>Cronograma</CardTitle>
              <CardDescription>Todas as fases do Demoday</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                {demoday.phases.map((phase, index) => (
                  <div key={phase.id} className="relative">
                    {index < demoday.phases.length - 1 && (
                      <div className="absolute left-5 top-10 h-full w-px bg-gray-200" />
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-8 gap-4">
                      <div className="md:col-span-1 flex justify-center md:justify-start">
                        <div
                          className={`h-10 w-10 rounded-full ${
                            demoday.currentPhase?.id === phase.id
                              ? "bg-blue-500 text-white"
                              : "bg-gray-100 text-gray-700"
                          } flex items-center justify-center font-bold`}
                        >
                          {phase.phaseNumber}
                        </div>
                      </div>
                      <div className="md:col-span-7">
                        <h3 className="text-lg font-medium">{phase.name}</h3>
                        <p className="text-gray-600 mt-1">{phase.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm">
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="h-4 w-4 text-gray-500" />
                            <span>{formatDateTime(phase.startDate)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4 text-gray-500" />
                            <span>{formatDateTime(phase.endDate)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projects">
          <Card>
            <CardHeader>
              <CardTitle>Projetos Participantes</CardTitle>
              <CardDescription>
                {demoday.active ? "Projetos submeter atualmente no Demoday" : "Projetos que participaram deste Demoday"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href={`/dashboard/demoday/${demoday.id}/projects`}>
                <Button className="w-full">Ver Todos os Projetos</Button>
              </Link>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
