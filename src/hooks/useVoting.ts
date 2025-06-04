import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "@/components/ui/use-toast";

interface VotePayload {
  projectId: string;
  demodayId: string;
  votePhase?: "popular" | "final";
}

interface VoteResponse {
  id: string;
  userId: string;
  projectId: string;
  voterRole: string;
  votePhase: "popular" | "final";
  weight: number;
  createdAt: string;
}

async function submitVoteAPI(payload: VotePayload): Promise<VoteResponse> {
  const response = await fetch("/api/projects/vote", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to submit vote");
  }
  return response.json();
}

export function useSubmitVote() {
  const queryClient = useQueryClient();

  return useMutation<VoteResponse, Error, VotePayload>({
    mutationFn: submitVoteAPI,
    onSuccess: (data, variables) => {
      toast({
        title: "Success!",
        description: "Your vote has been recorded.",
        variant: "success",
      });
      // Invalidate queries that might be affected by this vote
      queryClient.invalidateQueries({ queryKey: ["demodayProjects", variables.demodayId] });
      queryClient.invalidateQueries({ queryKey: ["projectVoteStatus", variables.projectId, variables.demodayId] }); // For checking if user has voted
    },
    onError: (error: Error) => {
      toast({
        title: "Voting Error",
        description: error.message || "Could not record your vote. You might have already voted or the voting period is over.",
        variant: "destructive",
      });
    },
  });
}

// Hook to check if the current user has voted for a specific project in a demoday
interface ProjectVoteStatus {
  hasVoted: boolean;
  vote?: VoteResponse;
}

export function useProjectVoteStatus(projectId: string | null, demodayId: string | null) {
  return useQuery<ProjectVoteStatus, Error>({
    queryKey: ["projectVoteStatus", projectId, demodayId],
    queryFn: async () => {
      if (!projectId || !demodayId) {
        return { hasVoted: false };
      }
      const response = await fetch(`/api/projects/vote?projectId=${projectId}&demodayId=${demodayId}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch vote status");
      }
      return response.json();
    },
    enabled: !!projectId && !!demodayId,
  });
} 