"use client";

import { useRouter } from "next/navigation";
import { useDemodays } from "@/hooks/useDemoday";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, TrendingUp, Calendar, Users, Trophy } from "lucide-react";
import { useSession } from "@/lib/auth-client";

export default function AdminResultsListPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { data: demodays, isLoading, error } = useDemodays();

  // Check permissions
  const userRole = session?.user?.role;
  const hasAccess = userRole === "admin";

  // Check access permission
  if (session && !hasAccess) {
    return (
      <div className="container mx-auto p-6 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-red-600">Acesso Negado</h2>
        <p className="text-muted-foreground">Apenas administradores podem acessar esta página.</p>
        <Button onClick={() => router.push("/dashboard")}>Voltar ao Dashboard</Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="mb-8">
          <Skeleton className="h-8 w-1/3 mb-2" />
          <Skeleton className="h-4 w-2/3" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-red-600">Erro ao Carregar Demodays</h2>
        <p className="text-muted-foreground">{error.message}</p>
      </div>
    );
  }

  if (!demodays || demodays.length === 0) {
    return (
      <div className="container mx-auto p-6 text-center">
        <TrendingUp className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold">Nenhum Demoday Encontrado</h2>
        <p className="text-muted-foreground">Não há demodays disponíveis para visualizar resultados.</p>
      </div>
    );
  }

  const getStatusBadge = (demoday: any) => {
    if (demoday.active) {
      return <Badge className="bg-green-100 text-green-800">Ativo</Badge>;
    }
    if (demoday.status === "finished") {
      return <Badge className="bg-blue-100 text-blue-800">Finalizado</Badge>;
    }
    if (demoday.status === "canceled") {
      return <Badge className="bg-red-100 text-red-800">Excluído</Badge>;
    }
    return <Badge className="bg-gray-100 text-gray-800">Inativo</Badge>;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("pt-BR");
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Gestão de Resultados</h1>
        <p className="text-muted-foreground">
          Selecione um Demoday para visualizar e gerenciar os resultados detalhados
        </p>
      </div>

      {/* Lista de Demodays */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {demodays.map((demoday) => (
          <Card key={demoday.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{demoday.name}</CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-2">
                    <Calendar className="h-4 w-4" />
                    Criado em {formatDate(demoday.createdAt)}
                  </CardDescription>
                </div>
                {getStatusBadge(demoday)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Estatísticas básicas */}
                {demoday.stats && (
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-blue-500" />
                      <span>{demoday.stats.totalProjects || 0} projetos</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-green-500" />
                      <span>{demoday.stats.winners || 0} vencedores</span>
                    </div>
                  </div>
                )}

                {/* Fase atual */}
                {demoday.currentPhase && (
                  <div className="text-sm">
                    <Badge variant="outline" className="text-xs">
                      Fase {demoday.currentPhase.phaseNumber}: {demoday.currentPhase.name}
                    </Badge>
                  </div>
                )}

                {/* Botão para ver resultados */}
                <Button 
                  onClick={() => router.push(`/dashboard/admin/results/${demoday.id}`)}
                  className="w-full mt-4"
                  variant={demoday.active ? "default" : "outline"}
                >
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Ver Resultados
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Demoday Ativo em Destaque */}
      {demodays.find(d => d.active) && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">🎯 Demoday Ativo</h2>
          <Card className="border-2 border-green-200 bg-green-50">
            <CardContent className="p-6">
              {(() => {
                const activeDemoday = demodays.find(d => d.active);
                return activeDemoday ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-green-800">
                        {activeDemoday.name}
                      </h3>
                      <p className="text-green-600">
                        Este é o Demoday atualmente ativo no sistema
                      </p>
                      {activeDemoday.currentPhase && (
                        <Badge className="mt-2 bg-green-600 text-white">
                          Fase {activeDemoday.currentPhase.phaseNumber}: {activeDemoday.currentPhase.name}
                        </Badge>
                      )}
                    </div>
                    <Button 
                      onClick={() => router.push(`/dashboard/admin/results/${activeDemoday.id}`)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <TrendingUp className="mr-2 h-4 w-4" />
                      Gerenciar Resultados
                    </Button>
                  </div>
                ) : null;
              })()}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
} 