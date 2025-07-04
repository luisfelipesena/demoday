"use client";

import { useParams, useRouter } from "next/navigation";
import { use, useState, useEffect } from "react";
import { useDemodayDetails } from "@/hooks/useDemoday";

import { useDemodayProjects } from "@/hooks/useDemodayProjects";
import { useSubmitVote, useProjectVoteStatus } from "@/hooks/useVoting";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, ArrowLeft, ThumbsUp, CheckCircle, Trophy } from "lucide-react";
import { useSession } from "@/lib/auth-client";
import Link from "next/link";
import { isDemodayFinished } from "@/utils/date-utils";

// Helper to check if voting is allowed based on Demoday phase
const isVotingPhaseActive = (demoday: any): boolean => {
  if (!demoday || !demoday.currentPhase) return false;
  // Assuming phase 3 is popular voting, phase 4 is final voting
  return demoday.currentPhase.phaseNumber === 3 || demoday.currentPhase.phaseNumber === 4;
};

const getVotePhaseForCurrentDemodayPhase = (demoday: any): "popular" | "final" | undefined => {
  if (!demoday || !demoday.currentPhase) return undefined;
  if (demoday.currentPhase.phaseNumber === 3) return "popular";
  if (demoday.currentPhase.phaseNumber === 4) return "final";
  return undefined;
};

export default function PublicVotingPage() {
  const params = useParams();
  const router = useRouter();
  const demodayId = params.id as string;

  const { data: session } = useSession();
  const { data: demoday, isLoading: isLoadingDemoday, error: demodayError } = useDemodayDetails(demodayId);
  
  // Fetch approved or finalist projects for voting
  const { data: projects = [], isLoading: isLoadingProjects, error: projectsError } = useDemodayProjects(demodayId, {
    status: demoday?.currentPhase?.phaseNumber === 4 ? "finalist" : "approved", // or finalist for final voting phase
  });

  const { mutate: submitVote, isPending: isSubmittingVote } = useSubmitVote();

  const isLoading = isLoadingDemoday || isLoadingProjects;
  const pageError = demodayError?.message || projectsError?.message;
  const demodayFinished = demoday && isDemodayFinished(demoday);

  const handleVote = (projectId: string) => {
    if (!session?.user) {
      router.push(`/login?redirect=/demoday/${demodayId}/voting`);
      return;
    }
    const currentVotePhase = getVotePhaseForCurrentDemodayPhase(demoday);
    if (!currentVotePhase) {
      // This should ideally be caught by UI disabling, but as a safeguard:
      alert("A votação não está ativa para a fase atual.");
      return;
    }
    submitVote({ projectId, demodayId, votePhase: currentVotePhase });
  };
  
  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-8 w-1/4 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader>
              <CardContent><Skeleton className="h-4 w-full mb-2" /><Skeleton className="h-4 w-2/3" /></CardContent>
              <CardFooter><Skeleton className="h-10 w-full" /></CardFooter>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (pageError) {
    return (
      <div className="container mx-auto p-6 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-red-600">Erro ao Carregar Página</h2>
        <p className="text-muted-foreground">{pageError}</p>
        <Button onClick={() => router.push("/")} className="mt-4">Ir para Início</Button>
      </div>
    );
  }

  if (!demoday) {
    return (
      <div className="container mx-auto p-6 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold">Demoday Não Encontrado</h2>
        <p className="text-muted-foreground">O Demoday solicitado não foi encontrado.</p>
        <Button onClick={() => router.push("/")} className="mt-4">Ir para Início</Button>
      </div>
    );
  }

  const votingActive = isVotingPhaseActive(demoday) && !demodayFinished;
  const currentVotePhaseForDisplay = getVotePhaseForCurrentDemodayPhase(demoday);

  // Project filtering logic based on voting phase
  let displayProjects = projects;
  if (demoday?.currentPhase?.phaseNumber === 3) { // Popular voting
    displayProjects = projects.filter(p => p.status === 'approved' || p.status === 'finalist');
  } else if (demoday?.currentPhase?.phaseNumber === 4) { // Final voting
    displayProjects = projects.filter(p => p.status === 'finalist');
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
              : "O período de votação está fechado no momento."
          }
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
                🏆 Obrigado a todos que participaram das votações! Confira agora quais projetos foram os grandes vencedores.
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
              <Button variant="outline" onClick={() => router.push("/dashboard")} className="border-yellow-500 text-yellow-700 hover:bg-yellow-50">
                Voltar ao Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      )}



      {!votingActive && !demodayFinished && (
        <Card className="text-center py-8">
          <CardHeader>
            <CardTitle>Votação Encerrada</CardTitle>
            <CardDescription>O período de votação para este Demoday não está ativo no momento. Volte mais tarde ou veja os resultados se disponíveis.</CardDescription>
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
              Atualmente não há projetos disponíveis para votação.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-sm text-muted-foreground space-y-2">
              <p>💡 <strong>Possíveis motivos:</strong></p>
              <ul className="list-disc list-inside space-y-1 text-left max-w-md mx-auto">
                <li>Ainda não há projetos submetidos</li>
                <li>Os projetos ainda não foram aprovados pelos administradores</li>
                <li>Aguardando liberação da votação</li>
              </ul>
              <div className="pt-4">
                <Link href="/dashboard" className="inline-block">
                  <Button variant="outline">
                    Voltar ao Dashboard
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {votingActive && !demodayFinished && displayProjects.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayProjects.map((p: any) => (
            <ProjectVotingCard key={p.id} projectSubmission={p} demodayId={demodayId} onVote={handleVote} currentVotePhaseForLogic={currentVotePhaseForDisplay} />
          ))}
        </div>
      )}
    </div>
  );
}

interface ProjectVotingCardProps {
  projectSubmission: any; // Ideally, replace any with a proper type for submitted project with project details
  demodayId: string;
  onVote: (projectId: string) => void;
  currentVotePhaseForLogic: "popular" | "final" | undefined;
}

function ProjectVotingCard({ projectSubmission, demodayId, onVote, currentVotePhaseForLogic }: ProjectVotingCardProps) {
  const { project } = projectSubmission;
  const { data: voteStatus, isLoading: isLoadingVoteStatus } = useProjectVoteStatus(project.id, demodayId);
  const { data: session } = useSession();

  const alreadyVotedInPhase = voteStatus?.vote?.votePhase === currentVotePhaseForLogic && voteStatus?.hasVoted;
  let canVoteInFinalPhase = true;
  if (currentVotePhaseForLogic === 'final') {
    canVoteInFinalPhase = session?.user?.role === 'professor' || session?.user?.role === 'admin';
  }

  const voteButtonDisabled = isLoadingVoteStatus || alreadyVotedInPhase || !session?.user || !canVoteInFinalPhase || projectSubmission.status === 'rejected';
  
  let voteButtonText = "Votar";
  if (isLoadingVoteStatus) voteButtonText = "Carregando...";
  else if (alreadyVotedInPhase) voteButtonText = "Votado";
  else if (!session?.user) voteButtonText = "Faça Login para Votar";
  else if (!canVoteInFinalPhase && currentVotePhaseForLogic === 'final') voteButtonText = "Apenas Professores";
  else if (projectSubmission.status === 'rejected') voteButtonText = "Não Votável";

  return (
    <Card className={`flex flex-col ${projectSubmission.status === 'rejected' ? 'opacity-50' : ''}`}>
      <CardHeader>
        <CardTitle className="text-xl">{project.title}</CardTitle>
        <div className="flex gap-2 flex-wrap mt-1">
          <Badge variant="secondary">{project.type}</Badge>
        </div>
        {project.authors && <CardDescription className="text-xs mt-1">Por: {project.authors}</CardDescription>}
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-sm text-muted-foreground line-clamp-4">
          {project.description}
        </p>
      </CardContent>
      <CardFooter className="border-t pt-4">
        <Button 
          onClick={() => onVote(project.id)} 
          disabled={voteButtonDisabled}
          className="w-full"
        >
          {alreadyVotedInPhase ? <CheckCircle className="mr-2 h-4 w-4" /> : <ThumbsUp className="mr-2 h-4 w-4" />}
          {voteButtonText}
        </Button>
      </CardFooter>
    </Card>
  );
} 