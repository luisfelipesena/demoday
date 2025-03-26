import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Project } from "@/types";

type ErrorResponse = {
  error: string;
};

type ProjectInput = {
  title: string;
  description: string;
  type: string;
};

type SubmitProjectInput = {
  projectId: string;
  demodayId: string;
};

// Buscar projetos do usuário
export function useProjects() {
  return useQuery<Project[], Error>({
    queryKey: ["projects"],
    queryFn: async () => {
      const response = await fetch("/api/projects");
      if (!response.ok) {
        const errorData = await response.json() as ErrorResponse;
        throw new Error(errorData.error || "Erro ao buscar projetos");
      }
      return response.json();
    },
  });
}

// Buscar detalhes de um projeto
export function useProject(projectId: string | null) {
  return useQuery<Project, Error>({
    queryKey: ["project", projectId],
    queryFn: async () => {
      if (!projectId) {
        throw new Error("ID do projeto é obrigatório");
      }

      const response = await fetch(`/api/projects/${projectId}`);
      if (!response.ok) {
        const errorData = await response.json() as ErrorResponse;
        throw new Error(errorData.error || "Erro ao buscar projeto");
      }
      return response.json();
    },
    enabled: !!projectId,
  });
}

// Criar um novo projeto
export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation<Project, Error, ProjectInput>({
    mutationFn: async (projectData: ProjectInput) => {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(projectData),
      });

      if (!response.ok) {
        const errorData = await response.json() as ErrorResponse;
        throw new Error(errorData.error || "Erro ao criar projeto");
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidar e buscar novamente projetos após criação bem-sucedida
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

// Atualizar um projeto existente
export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation<Project, Error, { id: string; data: ProjectInput }>({
    mutationFn: async ({ id, data }) => {
      const response = await fetch(`/api/projects/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json() as ErrorResponse;
        throw new Error(errorData.error || "Erro ao atualizar projeto");
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      // Invalidar consultas afetadas
      queryClient.invalidateQueries({ queryKey: ["project", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

// Excluir um projeto
export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (projectId: string) => {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json() as ErrorResponse;
        throw new Error(errorData.error || "Erro ao excluir projeto");
      }
    },
    onSuccess: () => {
      // Invalidar e buscar novamente projetos após exclusão bem-sucedida
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

// Submeter um projeto para um Demoday
export function useSubmitProject() {
  const queryClient = useQueryClient();

  return useMutation<any, Error, SubmitProjectInput>({
    mutationFn: async ({ projectId, demodayId }: SubmitProjectInput) => {
      const response = await fetch("/api/projects/submissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ projectId, demodayId }),
      });

      if (!response.ok) {
        const errorData = await response.json() as ErrorResponse;
        throw new Error(errorData.error || "Erro ao submeter projeto");
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidar consultas relacionadas
      queryClient.invalidateQueries({ queryKey: ["projectSubmissions"] });
    },
  });
} 