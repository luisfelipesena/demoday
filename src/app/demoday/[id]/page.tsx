"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  Trophy, 
  Vote, 
  Users, 
  FileText, 
  CheckCircle2, 
  Award,
  AlertCircle,
  ExternalLink,
  Target
} from "lucide-react";
import Link from "next/link";

interface DemodayPhase {
  id: string;
  name: string;
  description: string;
  phaseNumber: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

interface DemodayDetails {
  id: string;
  name: string;
  description?: string;
  active: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
  phases: DemodayPhase[];
  currentPhase?: DemodayPhase;
  stats?: {
    totalProjects: number;
    submitted: number;
    approved: number;
    finalists: number;
    winners: number;
  };
}

// Hook para buscar detalhes do demoday
function useDemodayDetails(demodayId: string) {
  return useQuery<DemodayDetails, Error>({
    queryKey: ["demodayDetails", demodayId],
    queryFn: async () => {
      const response = await fetch(`/api/demoday/${demodayId}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch demoday details");
      }
      return response.json();
    },
  });
}

export default function PublicDemodayDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const demodayId = params.id as string;

  const { data: demoday, isLoading, error } = useDemodayDetails(demodayId);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit", 
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getPhaseStatus = (phase: DemodayPhase) => {
    const now = new Date();
    const startDate = new Date(phase.startDate);
    const endDate = new Date(phase.endDate);

    if (now < startDate) {
      return { status: "upcoming", color: "bg-gray-500", text: "Aguardando" };
    } else if (now >= startDate && now <= endDate) {
      return { status: "active", color: "bg-green-500", text: "Em Andamento" };
    } else {
      return { status: "completed", color: "bg-blue-500", text: "Concluída" };
    }
  };

  const getStatusBadge = (demoday: DemodayDetails) => {
    if (demoday.active) {
      return <Badge className="bg-green-500 hover:bg-green-600">Ativo</Badge>;
    } else if (demoday.status === "finished") {
      return <Badge className="bg-blue-500 hover:bg-blue-600">Finalizado</Badge>;
    } else {
      return <Badge variant="secondary">Inativo</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-10 w-1/4" />
        <Skeleton className="h-8 w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader>
              <CardContent><Skeleton className="h-8 w-1/2" /></CardContent>
            </Card>
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-red-600">Erro ao Carregar Demoday</h2>
        <p className="text-muted-foreground">{error.message}</p>
        <Button onClick={() => router.push("/dashboard")} className="mt-4">Voltar ao Dashboard</Button>
      </div>
    );
  }

  if (!demoday) {
    return (
      <div className="container mx-auto p-6 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold">Demoday Não Encontrado</h2>
        <p className="text-muted-foreground">O Demoday solicitado não foi encontrado.</p>
        <Button onClick={() => router.push("/dashboard")} className="mt-4">Voltar ao Dashboard</Button>
      </div>
    );
  }

  const demodayFinished = demoday.status === "finished";
  const canVote = demoday.active && demoday.currentPhase?.phaseNumber === 3;
  const canSubmit = demoday.active && demoday.currentPhase?.phaseNumber === 1;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button variant="outline" onClick={() => router.back()} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <div className="flex items-center gap-4 mb-2">
            <h1 className="text-3xl font-bold">{demoday.name}</h1>
            {getStatusBadge(demoday)}
          </div>
          <p className="text-muted-foreground flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Criado em {formatDate(demoday.createdAt)}
          </p>
        </div>
        <div className="flex gap-2">
          {demodayFinished && (
            <Link href={`/demoday/${demoday.id}/results`}>
              <Button className="bg-green-600 hover:bg-green-700">
                <Trophy className="mr-2 h-4 w-4" />
                Ver Resultados
              </Button>
            </Link>
          )}
          {canVote && (
            <Link href={`/demoday/${demoday.id}/voting`}>
              <Button className="bg-purple-600 hover:bg-purple-700">
                <Vote className="mr-2 h-4 w-4" />
                Votar
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Status Banner */}
      {demodayFinished && (
        <Card className="border-2 border-green-300 bg-gradient-to-r from-green-50 to-blue-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Trophy className="h-8 w-8 text-green-600" />
              <div>
                <h3 className="text-xl font-semibold text-green-800">Demoday Finalizado!</h3>
                <p className="text-green-700">
                  Este evento foi concluído com sucesso. Confira os resultados finais!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {canVote && (
        <Card className="border-2 border-purple-300 bg-gradient-to-r from-purple-50 to-blue-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Vote className="h-8 w-8 text-purple-600" />
              <div>
                <h3 className="text-xl font-semibold text-purple-800">Votação em Andamento!</h3>
                <p className="text-purple-700">
                  A fase de votação popular está ativa. Participe escolhendo seus projetos favoritos!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {canSubmit && (
        <Card className="border-2 border-blue-300 bg-gradient-to-r from-blue-50 to-green-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-blue-600" />
              <div>
                <h3 className="text-xl font-semibold text-blue-800">Submissões Abertas!</h3>
                <p className="text-blue-700">
                  O período de submissão de projetos está ativo. Submeta seu trabalho para participar!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Estatísticas */}
      {demoday.stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total de Projetos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-gray-600" />
                <span className="text-2xl font-bold">{demoday.stats.totalProjects}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Submetidos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                <span className="text-2xl font-bold">{demoday.stats.submitted}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Aprovados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span className="text-2xl font-bold">{demoday.stats.approved}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Finalistas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-amber-500" />
                <span className="text-2xl font-bold">{demoday.stats.finalists}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Vencedores</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-600" />
                <span className="text-2xl font-bold">{demoday.stats.winners}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="phases">Cronograma</TabsTrigger>
          <TabsTrigger value="actions">Ações</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sobre o Demoday</CardTitle>
            </CardHeader>
            <CardContent>
              {demoday.description ? (
                <p className="text-muted-foreground">{demoday.description}</p>
              ) : (
                <p className="text-muted-foreground">
                  O Demoday é um evento onde estudantes podem submeter seus projetos acadêmicos 
                  (Disciplina, Iniciação Científica, TCC, Mestrado, Doutorado) para avaliação e votação popular.
                </p>
              )}
              
              {demoday.currentPhase && (
                <div className="mt-4 p-4 border rounded-lg bg-blue-50">
                  <h4 className="font-semibold text-blue-800 mb-2">Fase Atual</h4>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-blue-600">
                      Fase {demoday.currentPhase.phaseNumber}: {demoday.currentPhase.name}
                    </Badge>
                    <Badge variant="outline" className={getPhaseStatus(demoday.currentPhase).color}>
                      {getPhaseStatus(demoday.currentPhase).text}
                    </Badge>
                  </div>
                  <p className="text-blue-700 text-sm">{demoday.currentPhase.description}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-blue-600">
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      Início: {formatDate(demoday.currentPhase.startDate)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      Fim: {formatDate(demoday.currentPhase.endDate)}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="phases" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cronograma de Fases</CardTitle>
              <CardDescription>Todas as fases do Demoday e seus períodos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {demoday.phases.map((phase) => {
                  const phaseStatus = getPhaseStatus(phase);
                  return (
                    <div key={phase.id} className="flex items-center gap-4 p-4 border rounded-lg">
                      <div className="flex-shrink-0">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${phaseStatus.color}`}>
                          {phase.phaseNumber}
                        </div>
                      </div>
                      <div className="flex-grow">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{phase.name}</h4>
                          <Badge variant="outline" className={phaseStatus.color}>
                            {phaseStatus.text}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{phase.description}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDate(phase.startDate)}
                          </span>
                          <span>até</span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDate(phase.endDate)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="actions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ações Disponíveis</CardTitle>
              <CardDescription>O que você pode fazer neste Demoday</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {canSubmit && (
                <div className="p-4 border rounded-lg bg-blue-50">
                  <h4 className="font-semibold text-blue-800 mb-2">Submeter Projeto</h4>
                  <p className="text-blue-700 text-sm mb-3">
                    O período de submissões está aberto. Submeta seu trabalho para participar do Demoday.
                  </p>
                  <Link href={`/dashboard/demoday/${demoday.id}/submit`}>
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      <FileText className="mr-2 h-4 w-4" />
                      Submeter Trabalho
                    </Button>
                  </Link>
                </div>
              )}

              {canVote && (
                <div className="p-4 border rounded-lg bg-purple-50">
                  <h4 className="font-semibold text-purple-800 mb-2">Participar da Votação</h4>
                  <p className="text-purple-700 text-sm mb-3">
                    A votação popular está ativa! Vote nos projetos que mais chamaram sua atenção.
                  </p>
                  <Link href={`/demoday/${demoday.id}/voting`}>
                    <Button className="bg-purple-600 hover:bg-purple-700">
                      <Vote className="mr-2 h-4 w-4" />
                      Ir para Votação
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              )}

              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">Ver Suas Submissões</h4>
                <p className="text-muted-foreground text-sm mb-3">
                  Acompanhe o status dos projetos que você submeteu para este Demoday.
                </p>
                <Link href={`/dashboard/demoday/${demoday.id}/submissions`}>
                  <Button variant="outline">
                    <Target className="mr-2 h-4 w-4" />
                    Ver Minhas Submissões
                  </Button>
                </Link>
              </div>

              {(demodayFinished || demoday.active) && (
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Ver Resultados</h4>
                  <p className="text-muted-foreground text-sm mb-3">
                    {demodayFinished 
                      ? "Confira os resultados finais e os projetos vencedores."
                      : "Acompanhe os resultados parciais e estatísticas do evento."
                    }
                  </p>
                  <Link href={`/demoday/${demoday.id}/results`}>
                    <Button variant="outline">
                      <Trophy className="mr-2 h-4 w-4" />
                      Ver Resultados
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 