import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/components/ui/use-toast";

interface SelectFinalistsResponse {
  message: string;
  results: Array<{
    categoryId: string;
    categoryName: string;
    maxFinalists: number;
    selectedFinalists: number;
    finalists: Array<{
      submissionId: string;
      projectId: string;
      projectTitle: string;
      voteCount: number;
    }>;
  }>;
}

async function selectFinalistsAPI(demodayId: string): Promise<SelectFinalistsResponse> {
  const response = await fetch(`/api/demoday/${demodayId}/finalists`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to select finalists");
  }
  return response.json();
}

export function useSelectFinalists() {
  const queryClient = useQueryClient();

  return useMutation<SelectFinalistsResponse, Error, string> ({
    mutationFn: selectFinalistsAPI, // demodayId is the string argument
    onSuccess: (data) => {
      toast({
        title: "Success!",
        description: data.message || "Finalists selected successfully.",
        variant: "success",
      });
      // Invalidate queries that show project statuses or finalist lists
      queryClient.invalidateQueries({ queryKey: ["demodayProjects"] });
      queryClient.invalidateQueries({ queryKey: ["demodayDetails"] }); // If demoday details include finalist counts
      queryClient.invalidateQueries({ queryKey: ["allSubmissions"] });
      // Potentially a specific query for finalists if one exists
      queryClient.invalidateQueries({ queryKey: ["finalistsByCategory", data.results[0]?.categoryId] }); 
    },
    onError: (error: Error) => {
      toast({
        title: "Error Selecting Finalists",
        description: error.message || "Could not select finalists automatically.",
        variant: "destructive",
      });
    },
  });
} 