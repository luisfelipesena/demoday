import { Project } from "@/types";
import { useQuery } from "@tanstack/react-query";

type DemodayProject = {
  id: string;
  projectId: string;
  demoday_id: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  project: Project & {
    author?: {
      id: string;
      name: string;
      email: string;
      role: string;
    }
  };
};

type ErrorResponse = {
  error: string;
};

type ProjectFilters = {
  status?: "submitted" | "approved" | "rejected" | "finalist" | "winner";
  type?: string;
};

// Hook para buscar projetos de um Demoday específico com filtros
export function useDemodayProjects(demodayId: string | null, filters?: ProjectFilters) {
  return useQuery<DemodayProject[], Error>({
    queryKey: ["demodayProjects", demodayId, filters],
    queryFn: async () => {
      if (!demodayId) {
        return [];
      }

      let url = `/api/projects/submissions/demoday?demodayId=${demodayId}`;

      if (filters?.status) {
        url += `&status=${filters.status}`;
      }

      if (filters?.type) {
        url += `&type=${filters.type}`;
      }

      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json() as ErrorResponse;
        throw new Error(errorData.error || "Erro ao buscar projetos do demoday");
      }

      return response.json();
    },
    enabled: !!demodayId,
  });
} 