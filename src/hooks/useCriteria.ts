import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// Types
export type Criteria = {
  id: string;
  demoday_id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateCriteriaInput = {
  name: string;
  description: string;
};

export type BatchCriteriaInput = {
  demodayId: string;
  criteria: CreateCriteriaInput[];
};

type ErrorResponse = {
  error: string;
};

// Fetch evaluation criteria for a specific demoday
export function useCriteria(demodayId: string | null) {
  return useQuery({
    queryKey: ["criteria", demodayId],
    queryFn: async () => {
      if (!demodayId) {
        return [] as Criteria[];
      }

      const response = await fetch(`/api/demoday/criteria?demodayId=${demodayId}`);
      if (!response.ok) {
        const errorData = await response.json() as ErrorResponse;
        throw new Error(errorData.error || "Erro ao buscar critérios");
      }

      const result = await response.json();
      return result.data as Criteria[];
    },
    enabled: !!demodayId,
  });
}

// Create new criteria in batch
export function useCreateCriteria() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: BatchCriteriaInput) => {
      const response = await fetch("/api/demoday/criteria", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const errorData = await response.json() as ErrorResponse;
        throw new Error(errorData.error || "Erro ao criar critérios");
      }

      return response.json() as Promise<Criteria[]>;
    },
    onSuccess: (_, variables) => {
      // Invalidate and refetch criteria after successful creation
      queryClient.invalidateQueries({
        queryKey: ["criteria", variables.demodayId]
      });
    },
  });
}

// Delete specific criteria
export function useDeleteCriteria() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      demodayId
    }: {
      id: string;
      demodayId: string;
    }) => {
      const response = await fetch(`/api/demoday/criteria?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json() as ErrorResponse;
        throw new Error(errorData.error || "Erro ao remover critério");
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      // Invalidate and refetch criteria after successful deletion
      queryClient.invalidateQueries({
        queryKey: ["criteria", variables.demodayId]
      });
    },
  });
}

// Update all criteria for a specific demoday
export function useUpdateCriteriaBatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: BatchCriteriaInput) => {
      const response = await fetch("/api/demoday/criteria", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const errorData = await response.json() as ErrorResponse;
        throw new Error(errorData.error || "Erro ao atualizar critérios");
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      // Invalidate and refetch criteria after successful update
      queryClient.invalidateQueries({
        queryKey: ["criteria", variables.demodayId]
      });
    },
  });
} 