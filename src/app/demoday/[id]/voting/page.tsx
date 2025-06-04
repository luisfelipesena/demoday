"use client";

import { useParams, useRouter } from "next/navigation";
import { use, useState, useEffect } from "react";
import { useDemodayDetails } from "@/hooks/useDemoday";
import { useCategories, Category } from "@/hooks/useCategories";
import { useDemodayProjects } from "@/hooks/useDemodayProjects";
import { useSubmitVote, useProjectVoteStatus } from "@/hooks/useVoting";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, ArrowLeft, ThumbsUp, CheckCircle } from "lucide-react";
import { useSession } from "@/lib/auth-client";
import Link from "next/link";

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
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");

  const { data: demoday, isLoading: isLoadingDemoday, error: demodayError } = useDemodayDetails(demodayId);
  const { data: categories, isLoading: isLoadingCategories } = useCategories(demodayId);
  
  // Fetch approved or finalist projects for voting
  const { data: projects = [], isLoading: isLoadingProjects, error: projectsError } = useDemodayProjects(demodayId, {
    status: demoday?.currentPhase?.phaseNumber === 4 ? "finalist" : "approved", // or finalist for final voting phase
    categoryId: selectedCategoryId || undefined,
  });

  const { mutate: submitVote, isPending: isSubmittingVote } = useSubmitVote();

  const isLoading = isLoadingDemoday || isLoadingCategories || isLoadingProjects;
  const pageError = demodayError?.message || projectsError?.message;

  const handleVote = (projectId: string) => {
    if (!session?.user) {
      router.push(`/login?redirect=/demoday/${demodayId}/voting`);
      return;
    }
    const currentVotePhase = getVotePhaseForCurrentDemodayPhase(demoday);
    if (!currentVotePhase) {
      // This should ideally be caught by UI disabling, but as a safeguard:
      alert("Voting is not active for the current phase.");
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
        <h2 className="text-xl font-semibold text-red-600">Error Loading Page</h2>
        <p className="text-muted-foreground">{pageError}</p>
        <Button onClick={() => router.push("/")} className="mt-4">Go Home</Button>
      </div>
    );
  }

  if (!demoday) {
    return (
      <div className="container mx-auto p-6 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold">Demoday Not Found</h2>
        <p className="text-muted-foreground">The requested Demoday could not be found.</p>
        <Button onClick={() => router.push("/")} className="mt-4">Go Home</Button>
      </div>
    );
  }

  const votingActive = isVotingPhaseActive(demoday);
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
          Back
        </Button>
        <h1 className="text-4xl font-bold tracking-tight text-center">Vote for Projects: {demoday.name}</h1>
        <p className="text-lg text-muted-foreground text-center mt-2">
          {votingActive ? `Current phase: ${demoday.currentPhase?.name}. Select your favorite projects!` : "The voting period is currently closed."}
        </p>
      </header>

      {categories && categories.length > 0 && votingActive && (
        <div className="max-w-sm mx-auto">
          <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Categories</SelectItem>
              {categories.map((category: Category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {!votingActive && (
        <Card className="text-center py-8">
          <CardHeader>
            <CardTitle>Voting Closed</CardTitle>
            <CardDescription>The voting period for this Demoday is not currently active. Please check back later or see results if available.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href={`/demoday/${demodayId}/results`}>
                <Button>View Results (if available)</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {votingActive && displayProjects.length === 0 && (
        <Card className="text-center py-8">
          <CardHeader>
            <CardTitle>No Projects Available for Voting</CardTitle>
            <CardDescription>
              There are currently no projects in this category/status available for voting.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {votingActive && displayProjects.length > 0 && (
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
  
  let voteButtonText = "Vote";
  if (isLoadingVoteStatus) voteButtonText = "Loading...";
  else if (alreadyVotedInPhase) voteButtonText = "Voted";
  else if (!session?.user) voteButtonText = "Login to Vote";
  else if (!canVoteInFinalPhase && currentVotePhaseForLogic === 'final') voteButtonText = "Professors Only";
  else if (projectSubmission.status === 'rejected') voteButtonText = "Not Votable";

  return (
    <Card className={`flex flex-col ${projectSubmission.status === 'rejected' ? 'opacity-50' : ''}`}>
      <CardHeader>
        <CardTitle className="text-xl">{project.title}</CardTitle>
        <div className="flex gap-2 flex-wrap mt-1">
          <Badge variant="secondary">{project.type}</Badge>
          {project.category && project.category.name && <Badge variant="outline">{project.category.name}</Badge>} 
        </div>
        {project.authors && <CardDescription className="text-xs mt-1">By: {project.authors}</CardDescription>}
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