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
  demoday_id: string;
  name: string;
  description: string;
  type: "registration" | "evaluation";
};

type ErrorResponse = {
  error: string;
};

type CriteriaResponse = {
  registration: Criteria[];
  evaluation: Criteria[];
};

// Fetch criteria for a specific demoday
export function useCriteria(demodayId: string | null, type?: "registration" | "evaluation") {
  return useQuery({
    queryKey: ["criteria", demodayId, type],
    queryFn: async () => {
      if (!demodayId) {
        return { registration: [], evaluation: [] } as CriteriaResponse;
      }

      let url = `/api/demoday/criteria?demodayId=${demodayId}`;
      if (type) {
        url += `&type=${type}`;
      }

      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json() as ErrorResponse;
        throw new Error(errorData.error || "Erro ao buscar critérios");
      }

      if (type) {
        // If type is specified, the response will be an array of criteria
        const data = await response.json() as Criteria[];
        // Return it in a way that's compatible with our expected structure
        if (type === "registration") {
          return {
            registration: data,
            evaluation: []
          } as CriteriaResponse;
        } else {
          return {
            registration: [],
            evaluation: data
          } as CriteriaResponse;
        }
      } else {
        // If no type is specified, the response will already be in the correct format
        return response.json() as Promise<CriteriaResponse>;
      }
    },
    enabled: !!demodayId,
  });
}

// Create new criteria
export function useCreateCriteria() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (criteria: CreateCriteriaInput) => {
      const response = await fetch("/api/demoday/criteria", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(criteria),
      });

      if (!response.ok) {
        const errorData = await response.json() as ErrorResponse;
        throw new Error(errorData.error || "Erro ao criar critério");
      }

      return response.json() as Promise<Criteria>;
    },
    onSuccess: (_, variables) => {
      // Invalidate and refetch criteria after successful creation
      queryClient.invalidateQueries({
        queryKey: ["criteria", variables.demoday_id]
      });
    },
  });
}

// Delete criteria
export function useDeleteCriteria() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      type,
      demodayId
    }: {
      id: string;
      type: "registration" | "evaluation";
      demodayId: string;
    }) => {
      const response = await fetch(`/api/demoday/criteria?id=${id}&type=${type}`, {
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

// Submit criteria in batch for a specific demoday
export function useSubmitCriteriaBatch() {
  const queryClient = useQueryClient();
  const createCriteria = useCreateCriteria();

  return useMutation({
    mutationFn: async ({
      demodayId,
      registration,
      evaluation
    }: {
      demodayId: string;
      registration: { name: string; description: string }[];
      evaluation: { name: string; description: string }[];
    }) => {
      // Create promises for all registration criteria
      const registrationPromises = registration.map(({ name, description }) =>
        createCriteria.mutateAsync({
          demoday_id: demodayId,
          name,
          description,
          type: "registration"
        })
      );

      // Create promises for all evaluation criteria
      const evaluationPromises = evaluation.map(({ name, description }) =>
        createCriteria.mutateAsync({
          demoday_id: demodayId,
          name,
          description,
          type: "evaluation"
        })
      );

      // Wait for all criteria to be created
      const results = await Promise.all([
        ...registrationPromises,
        ...evaluationPromises
      ]);

      return {
        message: "Critérios criados com sucesso",
        data: results
      };
    },
    onSuccess: (_, variables) => {
      // Invalidate and refetch criteria after successful creation
      queryClient.invalidateQueries({
        queryKey: ["criteria", variables.demodayId]
      });
    },
  });
} 