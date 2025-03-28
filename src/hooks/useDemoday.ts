import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Demoday, Phase } from "@/types";

export type { Phase }; // Export the Phase type for external use

// Type for error responses
type ErrorResponse = {
  error: string;
};

export type CreateDemodayInput = {
  name: string;
  phases: Phase[];
};

export type UpdateDemodayStatusInput = {
  id: string;
  status: 'active' | 'finished' | 'canceled';
};

// Fetch all demodays
export function useDemodays() {
  return useQuery<Demoday[], Error>({
    queryKey: ["demodays"],
    queryFn: async () => {
      const response = await fetch("/api/demoday");
      if (!response.ok) {
        const errorData = await response.json() as ErrorResponse;
        throw new Error(errorData.error || "Erro ao buscar demodays");
      }
      return response.json();
    },
  });
}

// Create new demoday
export function useCreateDemoday() {
  const queryClient = useQueryClient();

  return useMutation<Demoday, Error, CreateDemodayInput>({
    mutationFn: async (demoday: CreateDemodayInput) => {
      const response = await fetch("/api/demoday", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(demoday),
      });

      if (!response.ok) {
        const errorData = await response.json() as ErrorResponse;
        throw new Error(errorData.error || "Erro ao criar demoday");
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch demodays after successful creation
      queryClient.invalidateQueries({ queryKey: ["demodays"] });
    },
  });
}

// Fetch demoday phases
export function useDemodayPhases(demodayId: string | null) {
  return useQuery<Phase[], Error>({
    queryKey: ["demodayPhases", demodayId],
    queryFn: async () => {
      if (!demodayId) {
        return [];
      }

      const response = await fetch(`/api/demoday/phases?demodayId=${demodayId}`);
      if (!response.ok) {
        const errorData = await response.json() as ErrorResponse;
        throw new Error(errorData.error || "Erro ao buscar fases do demoday");
      }
      return response.json();
    },
    enabled: !!demodayId, // Only run the query if demodayId is provided
  });
}

// Update demoday status
export function useUpdateDemodayStatus() {
  const queryClient = useQueryClient();

  return useMutation<{ message: string }, Error, UpdateDemodayStatusInput>({
    mutationFn: async ({ id, status }: UpdateDemodayStatusInput) => {
      const response = await fetch(`/api/demoday/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const errorData = await response.json() as ErrorResponse;
        throw new Error(errorData.error || `Erro ao atualizar status do demoday para ${status}`);
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch demodays after successful update
      queryClient.invalidateQueries({ queryKey: ["demodays"] });
    },
  });
} 