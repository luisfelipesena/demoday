"use client";

import { useParams, useRouter } from "next/navigation";
import { use, useState, useEffect } from "react";
import { useDemodayDetails } from "@/hooks/useDemoday";
import { useCategories, Category } from "@/hooks/useCategories";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, ArrowLeft, Award, Trophy, Users as UsersIcon, ListOrdered } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

// Define interfaces for the results data
interface ProjectResult {
  id: string;
  title: string;
  type: string;
  authors: string | null;
  status: string; // finalist, winner, participant
  popularVoteCount: number;
  finalWeightedScore: number; // Calculated score considering weights
  categoryName?: string; // Optional: if grouping by category client-side from a flat list
}

interface CategoryResult {
  id: string;
  name: string;
  projects: ProjectResult[];
}

interface DemodayOverallStats {
  totalSubmittedProjects: number;
  totalUniqueParticipants: number;
  totalPopularVotes: number;
  totalFinalVotes: number;
}

interface DemodayResultsData {
  demodayName: string;
  categories: CategoryResult[];
  overallStats: DemodayOverallStats; 
}

// Hook to fetch demoday results
function useDemodayResults(demodayId: string | null) {
  return useQuery<DemodayResultsData, Error>({
    queryKey: ["demodayResults", demodayId],
    queryFn: async () => {
      if (!demodayId) {
        throw new Error("Demoday ID is required to fetch results.");
      }
      const response = await fetch(`/api/demoday/${demodayId}/results`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch demoday results");
      }
      return response.json();
    },
    enabled: !!demodayId,
  });
}


export default function DemodayResultsPage() {
  const params = useParams();
  const router = useRouter();
  const demodayId = params.id as string;

  const { data: demodayDetails, isLoading: isLoadingDemodayDetails } = useDemodayDetails(demodayId);
  const { data: resultsData, isLoading: isLoadingResults, error: resultsError } = useDemodayResults(demodayId);

  const isLoading = isLoadingDemodayDetails || isLoadingResults;

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-10 w-1/2 mb-4" />
        <Skeleton className="h-8 w-1/3 mb-6" />
        <div className="space-y-8">
          {[1, 2].map(i => (
            <Card key={i} className="mb-6">
              <CardHeader><Skeleton className="h-8 w-1/4" /></CardHeader>
              <CardContent className="space-y-4">
                {[1, 2, 3].map(j => (
                  <div key={j} className="p-4 border rounded-lg">
                    <Skeleton className="h-6 w-3/5 mb-2" />
                    <Skeleton className="h-4 w-4/5 mb-1" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (resultsError) {
    return (
      <div className="container mx-auto p-6 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-red-600">Error Loading Results</h2>
        <p className="text-muted-foreground">{resultsError.message}</p>
        <Button onClick={() => router.push(`/dashboard/demoday/${demodayId}`)} className="mt-4">Back to Demoday</Button>
      </div>
    );
  }

  if (!resultsData || !demodayDetails) {
    return (
      <div className="container mx-auto p-6 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold">Results Not Available</h2>
        <p className="text-muted-foreground">The results for this Demoday could not be found or are not yet available.</p>
        <Button onClick={() => router.push(`/dashboard/demoday/${demodayId}`)} className="mt-4">Back to Demoday</Button>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "winner": return <Badge className="bg-yellow-400 text-yellow-900">Vencedor <Trophy className="ml-1 h-3 w-3" /></Badge>;
      case "finalist": return <Badge className="bg-blue-400 text-blue-900">Finalista <Award className="ml-1 h-3 w-3" /></Badge>;
      default: return <Badge variant="outline">Participante</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <header className="mb-8 text-center">
         <Button variant="outline" onClick={() => router.back()} className="absolute left-6 top-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <h1 className="text-4xl font-bold tracking-tight">Resultados: {resultsData.demodayName}</h1>
        <p className="text-lg text-muted-foreground mt-2">
          Confira os projetos destaque e a performance geral.
        </p>
      </header>

      {resultsData.overallStats && (
        <Card className="mb-8 shadow-md">
          <CardHeader className="bg-blue-50 dark:bg-blue-900 rounded-t-lg">
            <CardTitle className="text-xl flex items-center">
              <UsersIcon className="mr-3 h-6 w-6 text-blue-700 dark:text-blue-300" />
              Estatísticas Gerais do Demoday
            </CardTitle>
            <CardDescription>Visão geral da participação e engajamento.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 border rounded-lg text-center">
              <p className="text-2xl font-bold">{resultsData.overallStats.totalSubmittedProjects}</p>
              <p className="text-sm text-muted-foreground">Projetos Submetidos</p>
            </div>
            <div className="p-3 border rounded-lg text-center">
              <p className="text-2xl font-bold">{resultsData.overallStats.totalUniqueParticipants}</p>
              <p className="text-sm text-muted-foreground">Participantes Únicos</p>
            </div>
            <div className="p-3 border rounded-lg text-center">
              <p className="text-2xl font-bold">{resultsData.overallStats.totalPopularVotes}</p>
              <p className="text-sm text-muted-foreground">Votos Populares</p>
            </div>
            <div className="p-3 border rounded-lg text-center">
              <p className="text-2xl font-bold">{resultsData.overallStats.totalFinalVotes}</p>
              <p className="text-sm text-muted-foreground">Votos Finais</p>
            </div>
          </CardContent>
        </Card>
      )}

      {resultsData.categories.map(category => (
        <Card key={category.id} className="shadow-lg">
          <CardHeader className="bg-gray-50 dark:bg-gray-800 rounded-t-lg">
            <CardTitle className="text-2xl flex items-center">
                <ListOrdered className="mr-3 h-6 w-6 text-primary" /> 
                {category.name}
            </CardTitle>
            <CardDescription>Projetos e suas classificações nesta categoria.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {category.projects.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">Nenhum projeto classificado nesta categoria.</p>
            ) : (
              <div className="space-y-4">
                {category.projects.sort((a,b) => b.finalWeightedScore - a.finalWeightedScore).map((project, index) => (
                  <div key={project.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="text-lg font-semibold text-primary">{index + 1}. {project.title}</h3>
                        {getStatusBadge(project.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">Autores: {project.authors || "N/A"}</p>
                    <p className="text-sm text-muted-foreground">Tipo: {project.type}</p>
                    <div className="mt-2 flex justify-between items-center text-xs text-gray-500">
                        <span>Votos Populares: {project.popularVoteCount}</span>
                        <span className="font-medium">Pontuação Final: {project.finalWeightedScore}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
} 