import { Demoday, Phase } from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export type { Phase }; // Export the Phase type for external use

// Type for error responses
type ErrorResponse = {
  error: string;
};

export type CreateDemodayInput = {
  name: string;
  phases: Phase[];
};

export type UpdateDemodayInput = {
  id: string;
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

// Fetch demoday details
export function useDemodayDetails(demodayId: string | null) {
  return useQuery<Demoday, Error>({
    queryKey: ["demoday", demodayId],
    queryFn: async () => {
      if (!demodayId) {
        throw new Error("ID do demoday é obrigatório");
      }

      const response = await fetch(`/api/demoday/${demodayId}`);
      if (!response.ok) {
        const errorData = await response.json() as ErrorResponse;
        throw new Error(errorData.error || "Erro ao buscar detalhes do demoday");
      }
      return response.json();
    },
    enabled: !!demodayId,
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

// Update existing demoday
export function useUpdateDemoday() {
  const queryClient = useQueryClient();

  return useMutation<Demoday, Error, UpdateDemodayInput>({
    mutationFn: async ({ id, name, phases }: UpdateDemodayInput) => {
      const response = await fetch(`/api/demoday/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, phases }),
      });

      if (!response.ok) {
        const errorData = await response.json() as ErrorResponse;
        throw new Error(errorData.error || "Erro ao atualizar demoday");
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      // Invalidate and refetch the specific demoday and demodays list
      queryClient.invalidateQueries({ queryKey: ["demoday", variables.id] });
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