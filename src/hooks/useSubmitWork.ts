import { useState } from "react";
import { useSession } from "@/lib/auth-client";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "@/components/ui/use-toast";

export type SubmitWorkInput = {
  title: string;
  description: string;
  type: string;
  videoUrl: string;
  repositoryUrl?: string;
  developmentYear: string;
  authors: string;
  contactEmail: string;
  contactPhone: string;
  advisorName: string;
  demodayId: string;
};

// Esquema para validação do formulário de submissão
export const projectSubmissionSchema = z.object({
  title: z.string().min(3, "O título deve ter pelo menos 3 caracteres"),
  description: z.string().min(10, "A descrição deve ter pelo menos 10 caracteres"),
  type: z.string().min(1, "Selecione um tipo de projeto"),
  authors: z.string().min(3, "Informe o(s) autor(es) do projeto"),
  developmentYear: z.string().min(4, "Informe o ano de desenvolvimento"),
  videoUrl: z.string().url("Forneça uma URL válida").min(1, "Link para apresentação do vídeo é obrigatório"),
  repositoryUrl: z.string().optional().refine((val) => !val || val.trim() === "" || z.string().url().safeParse(val).success, {
    message: "Forneça uma URL válida"
  }),
  contactEmail: z.string().email("Email do contato principal inválido"),
  contactPhone: z.string().min(10, "Telefone deve ter pelo menos 10 dígitos").max(20, "Telefone deve ter no máximo 20 dígitos"),
  advisorName: z.string().min(2, "Nome do orientador/professor deve ter pelo menos 2 caracteres"),
});

export type ProjectSubmissionFormData = z.infer<typeof projectSubmissionSchema>;

// Hook para submeter um trabalho para um DemoDay
export function useSubmitWork() {
  const { data: session } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitWork = async (demodayId: string, formData: ProjectSubmissionFormData) => {
    if (!session?.user) {
      throw new Error("Você precisa estar autenticado para submeter um trabalho");
    }

    setIsSubmitting(true);
    
    try {
      const response = await fetch(`/api/demoday/${demodayId}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erro ao submeter o trabalho");
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      throw new Error(error.message || "Erro ao submeter o trabalho");
    } finally {
      setIsSubmitting(false);
    }
  };

  const mutation = useMutation({
    mutationFn: ({ demodayId, formData }: { demodayId: string, formData: ProjectSubmissionFormData }) => 
      submitWork(demodayId, formData),
    onSuccess: () => {
      toast({
        title: "Trabalho submetido com sucesso!",
        description: "Seu trabalho foi enviado para o Demoday com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao submeter o trabalho",
        description: error.message || "Ocorreu um erro ao submeter o trabalho. Por favor, tente novamente.",
      });
    },
  });

  return {
    submitWork: mutation.mutate,
    isSubmitting: isSubmitting || mutation.isPending,
    error: mutation.error,
  };
}

// Hook para buscar todas as submissões de um DemoDay (para admin/professor)
export function useAllSubmissions(demodayId: string | null) {
  const { data: session } = useSession();
  
  return useQuery({
    queryKey: ["demoday-submissions", demodayId],
    queryFn: async () => {
      if (!demodayId) return [];
      
      // Verificar se o usuário tem permissão para visualizar todas as submissões
      if (!session?.user || (session.user.role !== "admin" && session.user.role !== "professor")) {
        throw new Error("Você não tem permissão para visualizar todas as submissões");
      }
      
      const response = await fetch(`/api/demoday/${demodayId}/submissions`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erro ao buscar submissões");
      }
      
      return response.json();
    },
    enabled: !!demodayId && !!session?.user && 
      (session.user.role === "admin" || session.user.role === "professor"),
  });
}

// Hook para buscar as submissões de um usuário para um DemoDay
export function useUserSubmissions(demodayId: string | null) {
  const { data: session } = useSession();
  
  return useQuery({
    queryKey: ["user-demoday-submissions", demodayId, session?.user?.email],
    queryFn: async () => {
      if (!demodayId || !session?.user) return [];
      
      const response = await fetch(`/api/demoday/${demodayId}/submissions/user`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erro ao buscar suas submissões");
      }
      
      return response.json();
    },
    enabled: !!demodayId && !!session?.user,
  });
} 