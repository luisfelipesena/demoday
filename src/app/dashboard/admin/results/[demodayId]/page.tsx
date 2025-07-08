"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useDemodayDetails } from "@/hooks/useDemoday";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { AlertCircle, ArrowLeft, Download, Trophy, Medal, Star, Eye, Edit, CheckCircle, XCircle, X, Calendar, User, FileText, Link as LinkIcon } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useSession } from "@/lib/auth-client";

// Interfaces
interface ProjectEvaluation {
  id: string;
  evaluatorName: string;
  evaluatorRole: string;
  approvalPercentage: number;
  scores: Array<{
    criterionId: string;
    criterionName: string;
    score: number;
    maxScore: number;
  }>;
  createdAt: string;
}

interface DetailedProjectResult {
  id: string;
  title: string;
  description: string;
  type: string;
  authors: string | null;
  status: string;
  categoryId: string;
  categoryName: string;
  submissionId: string;
  popularVoteCount: number;
  finalVoteCount: number;
  finalWeightedScore: number;
  evaluations: ProjectEvaluation[];
  averageEvaluationScore: number;
  totalEvaluations: number;
  createdAt: string;
}

interface AdminResultsData {
  demodayName: string;
  projects: DetailedProjectResult[];
  categories: Array<{
    id: string;
    name: string;
    maxFinalists: number;
  }>;
  overallStats: {
    totalProjects: number;
    totalEvaluations: number;
    totalVotes: number;
    averageScore: number;
  };
}

// Hook para buscar dados administrativos detalhados
function useAdminResults(demodayId: string) {
  return useQuery<AdminResultsData, Error>({
    queryKey: ["adminResults", demodayId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/demoday/${demodayId}/detailed-results`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch admin results");
      }
      return response.json();
    },
  });
}

// Hook para atualizar status de projeto
function useUpdateProjectStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ submissionId, status }: { submissionId: string; status: string }) => {
      const response = await fetch(`/api/admin/project-submissions/${submissionId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update project status");
      }
      
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["adminResults"] });
      toast.success(`Status do projeto atualizado para ${variables.status}`);
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar status: ${error.message}`);
    },
  });
}

// Componente para mostrar detalhes do projeto
function ProjectDetailsModal({ project, onClose }: { 
  project: DetailedProjectResult; 
  onClose: () => void;
}) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit", 
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">{project.title}</h2>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline">{project.type}</Badge>
                <Badge className="bg-blue-100 text-blue-800">{project.categoryName}</Badge>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Informações básicas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Informações do Projeto</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{project.authors || "Não informado"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">Submetido em {formatDate(project.createdAt)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">Status: {project.status}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Estatísticas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Votos Populares:</span>
                  <span className="font-semibold text-purple-600">{project.popularVoteCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Votos Finais:</span>
                  <span className="font-semibold text-orange-600">{project.finalVoteCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Nota Média:</span>
                  <span className="font-semibold text-blue-600">{project.averageEvaluationScore.toFixed(1)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Pontuação Final:</span>
                  <span className="font-semibold text-green-600">{project.finalWeightedScore.toFixed(1)}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Descrição */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Descrição do Projeto</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {project.description || "Nenhuma descrição fornecida."}
              </p>
            </CardContent>
          </Card>

          {/* Avaliações */}
          {project.evaluations.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Avaliações ({project.evaluations.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {project.evaluations.map((evaluation) => (
                    <div key={evaluation.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-medium">{evaluation.evaluatorName}</p>
                          <p className="text-sm text-gray-500 capitalize">{evaluation.evaluatorRole}</p>
                        </div>
                        <div className="text-right">
                          <Badge 
                            className={evaluation.approvalPercentage >= 50
                              ? "bg-green-100 text-green-800 hover:bg-green-200" 
                              : "bg-red-100 text-red-800 hover:bg-red-200"
                            }
                          >
                            {evaluation.approvalPercentage >= 50 ? "Aprovado" : "Rejeitado"}
                          </Badge>
                          <p className="text-xs text-gray-500 mt-1">Status da Triagem</p>
                        </div>
                      </div>
                      
                      {evaluation.scores.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {evaluation.scores.map((score) => (
                            <div key={score.criterionId} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                              <span className="text-sm font-medium">{score.criterionName}</span>
                              <Badge 
                                className={score.score >= (score.maxScore / 2)
                                  ? "bg-green-100 text-green-800" 
                                  : "bg-red-100 text-red-800"
                                }
                              >
                                {score.score >= (score.maxScore / 2) ? "Aprovado" : "Rejeitado"}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      <p className="text-xs text-gray-500 mt-2">
                        Avaliado em {formatDate(evaluation.createdAt)}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Botões de ação */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Componente para linha da tabela de projeto
function ProjectRow({ project, onStatusChange, onViewDetails }: { 
  project: DetailedProjectResult; 
  onStatusChange: (submissionId: string, status: string) => void;
  onViewDetails: (project: DetailedProjectResult) => void;
}) {
  const getStatusBadge = (status: string) => {
    const styles = {
      submitted: "bg-yellow-100 text-yellow-800",
      approved: "bg-blue-100 text-blue-800", 
      finalist: "bg-purple-100 text-purple-800",
      winner: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
    };
    
    const labels = {
      submitted: "Submetido",
      approved: "Aprovado",
      finalist: "Finalista", 
      winner: "Vencedor",
      rejected: "Rejeitado",
    };
    
    return (
      <Badge className={styles[status as keyof typeof styles] || "bg-gray-100 text-gray-800"}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "winner": return <Trophy className="h-4 w-4 text-yellow-500" />;
      case "finalist": return <Medal className="h-4 w-4 text-purple-500" />;
      case "approved": return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case "rejected": return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Star className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-2">
          {getStatusIcon(project.status)}
          <div>
            <div className="font-medium">{project.title}</div>
            <div className="text-sm text-gray-500">{project.categoryName}</div>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="text-sm">
          <div>{project.type}</div>
          {project.authors && <div className="text-gray-500">{project.authors}</div>}
        </div>
      </TableCell>
             <TableCell>
         {getStatusBadge(project.status)}
       </TableCell>
      <TableCell className="text-center">
        <div className="font-semibold text-purple-600">{project.popularVoteCount}</div>
      </TableCell>
      <TableCell className="text-center">
        <div className="font-semibold text-orange-600">{project.finalVoteCount}</div>
      </TableCell>
      <TableCell className="text-center">
        <div className="font-semibold text-blue-600">
          {project.averageEvaluationScore.toFixed(1)}
        </div>
        <div className="text-xs text-gray-500">
          ({project.totalEvaluations} aval.)
        </div>
      </TableCell>
      <TableCell className="text-center">
        <div className="font-semibold text-green-600">
          {project.finalWeightedScore.toFixed(1)}
        </div>
      </TableCell>
             <TableCell>
         <div className="flex gap-2">
           <Button variant="outline" size="sm" onClick={() => onViewDetails(project)}>
             <Eye className="h-4 w-4 mr-1" />
             Ver
           </Button>
           {project.status !== "winner" && (
             <Button 
               variant="default" 
               size="sm"
               onClick={() => onStatusChange(project.submissionId, "winner")}
               className="bg-yellow-600 hover:bg-yellow-700"
             >
               <Trophy className="h-4 w-4 mr-1" />
               Marcar Vencedor
             </Button>
           )}
           {project.status === "winner" && (
             <Button 
               variant="outline" 
               size="sm"
               onClick={() => onStatusChange(project.submissionId, "finalist")}
             >
               Remover Vencedor
             </Button>
           )}
         </div>
       </TableCell>
    </TableRow>
  );
}

export default function AdminResultsPage() {
  const params = useParams();
  const router = useRouter();
  const demodayId = params.demodayId as string;
  const { data: session } = useSession();

  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedProject, setSelectedProject] = useState<DetailedProjectResult | null>(null);

  // Check permissions
  const userRole = session?.user?.role;
  const hasAccess = userRole === "admin";

  const { data: demoday, isLoading: isLoadingDemoday } = useDemodayDetails(demodayId);
  const { data: resultsData, isLoading: isLoadingResults, error } = useAdminResults(demodayId);
  const { mutate: updateStatus, isPending: isUpdatingStatus } = useUpdateProjectStatus();

  const isLoading = isLoadingDemoday || isLoadingResults;

  // Check access permission
  if (session && !hasAccess) {
    return (
      <div className="container mx-auto p-6 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-red-600">Acesso Negado</h2>
        <p className="text-muted-foreground">Apenas administradores podem acessar esta página.</p>
        <Button onClick={() => router.push("/dashboard")} className="mt-4">Voltar ao Dashboard</Button>
      </div>
    );
  }

  // Filtrar projetos
  const filteredProjects = resultsData?.projects.filter(project => {
    const matchesCategory = selectedCategory === "all" || project.categoryId === selectedCategory;
    const matchesStatus = selectedStatus === "all" || project.status === selectedStatus;
    const matchesSearch = searchTerm === "" || 
      project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (project.authors && project.authors.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesCategory && matchesStatus && matchesSearch;
  }) || [];

  // Função para exportar dados
  const handleExport = async () => {
    try {
      const response = await fetch(`/api/admin/demoday/${demodayId}/export`);
      if (!response.ok) throw new Error("Erro ao exportar dados");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `demoday-${demodayId}-results.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success("Dados exportados com sucesso!");
    } catch (error) {
      toast.error("Erro ao exportar dados");
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-10 w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
        <h2 className="text-xl font-semibold text-red-600">Erro ao Carregar Dados</h2>
        <p className="text-muted-foreground">{error.message}</p>
        <Button onClick={() => router.back()} className="mt-4">Voltar</Button>
      </div>
    );
  }

  if (!resultsData) {
    return (
      <div className="container mx-auto p-6 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold">Dados Não Encontrados</h2>
        <p className="text-muted-foreground">Não foi possível carregar os dados deste Demoday.</p>
        <Button onClick={() => router.back()} className="mt-4">Voltar</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button variant="outline" onClick={() => router.back()} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <h1 className="text-3xl font-bold">Gestão de Resultados</h1>
          <p className="text-muted-foreground">{resultsData.demodayName}</p>
        </div>
        <Button onClick={handleExport} className="bg-green-600 hover:bg-green-700">
          <Download className="mr-2 h-4 w-4" />
          Exportar Dados
        </Button>
      </div>

      {/* Estatísticas Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de Projetos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resultsData.overallStats.totalProjects}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de Avaliações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resultsData.overallStats.totalEvaluations}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de Votos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resultsData.overallStats.totalVotes}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Nota Média</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resultsData.overallStats.averageScore.toFixed(1)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Categoria</label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as categorias" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  {resultsData.categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="submitted">Submetido</SelectItem>
                  <SelectItem value="approved">Aprovado</SelectItem>
                  <SelectItem value="finalist">Finalista</SelectItem>
                  <SelectItem value="winner">Vencedor</SelectItem>
                  <SelectItem value="rejected">Rejeitado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium mb-2 block">Buscar</label>
              <Input
                placeholder="Buscar por título ou autor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Projetos */}
      <Card>
        <CardHeader>
          <CardTitle>Projetos ({filteredProjects.length})</CardTitle>
          <CardDescription>
            Gerencie o status dos projetos e visualize dados detalhados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Projeto</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Votos Pop.</TableHead>
                  <TableHead className="text-center">Votos Finais</TableHead>
                  <TableHead className="text-center">Nota Média</TableHead>
                  <TableHead className="text-center">Pontuação Final</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                                 {filteredProjects.map((project) => (
                   <ProjectRow
                     key={project.id}
                     project={project}
                     onStatusChange={(submissionId, status) => 
                       updateStatus({ submissionId, status })
                     }
                     onViewDetails={(project) => setSelectedProject(project)}
                   />
                 ))}
              </TableBody>
            </Table>
          </div>
          
          {filteredProjects.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum projeto encontrado com os filtros aplicados.
            </div>
          )}
                 </CardContent>
       </Card>

       {/* Modal de detalhes do projeto */}
       {selectedProject && (
         <ProjectDetailsModal
           project={selectedProject}
           onClose={() => setSelectedProject(null)}
         />
       )}
     </div>
   );
 }