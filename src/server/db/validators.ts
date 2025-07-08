import { PROJECT_TYPES } from "@/types"
import { z } from "zod"

/**
 * Schema Zod para validação de dados do trabalho
 */
export const projectSchema = z.object({
  title: z.string().min(2, "Título deve ter pelo menos 2 caracteres").max(100, "Título deve ter no máximo 100 caracteres"),
  description: z.string().min(5, "Descrição deve ter pelo menos 5 caracteres").max(5000, "Descrição deve ter no máximo 5000 caracteres"),
  type: z.enum(PROJECT_TYPES, {
    errorMap: () => ({ message: `Tipo de trabalho deve ser um dos seguintes: ${PROJECT_TYPES.join(", ")}` })
  }),
  videoUrl: z.string().url("URL de vídeo inválida").min(1, "Link para apresentação do vídeo é obrigatório"),
  repositoryUrl: z.string().optional().refine((val) => !val || val.trim() === "" || z.string().url().safeParse(val).success, {
    message: "URL do repositório inválida"
  }),
  developmentYear: z.string().regex(/^\d{4}$/, "Ano deve estar no formato YYYY"),
  authors: z.string().min(2, "Autores deve ter pelo menos 2 caracteres"),
  contactEmail: z.string().email("Email do contato principal inválido"),
  contactPhone: z.string().min(10, "Telefone deve ter pelo menos 10 dígitos").max(20, "Telefone deve ter no máximo 20 dígitos"),
  advisorName: z.string().min(2, "Nome do orientador/professor deve ter pelo menos 2 caracteres"),
})

/**
 * Schema para submissão de trabalho em um Demoday
 */
export const projectSubmissionSchema = z.object({
  title: z.string().min(2, "Título deve ter pelo menos 2 caracteres").max(100, "Título deve ter no máximo 100 caracteres"),
  description: z.string().min(5, "Descrição deve ter pelo menos 5 caracteres").max(5000, "Descrição deve ter no máximo 5000 caracteres"),
  type: z.enum(PROJECT_TYPES, {
    errorMap: () => ({ message: `Tipo de trabalho deve ser um dos seguintes: ${PROJECT_TYPES.join(", ")}` })
  }),
  videoUrl: z.string().url("URL de vídeo inválida").min(1, "Link para apresentação do vídeo é obrigatório"),
  repositoryUrl: z.string().optional().refine((val) => !val || val.trim() === "" || z.string().url().safeParse(val).success, {
    message: "URL do repositório inválida"
  }),
  developmentYear: z.string().regex(/^\d{4}$/, "Ano deve estar no formato YYYY"),
  authors: z.string().min(2, "Autores deve ter pelo menos 2 caracteres"),
  contactEmail: z.string().email("Email do contato principal inválido"),
  contactPhone: z.string().min(10, "Telefone deve ter pelo menos 10 dígitos").max(20, "Telefone deve ter no máximo 20 dígitos"),
  advisorName: z.string().min(2, "Nome do orientador/professor deve ter pelo menos 2 caracteres"),
  demodayId: z.string().min(1, "ID do demoday é obrigatório"),
})

/**
 * Schema para submissão de projeto existente para um Demoday
 */
export const projectDemoDaySubmissionSchema = z.object({
  projectId: z.string().min(1, "ID do projeto é obrigatório"),
  demodayId: z.string().min(1, "ID do demoday é obrigatório"),
})

/**
 * Schema para atualização de status da submissão de trabalho
 */
export const projectSubmissionStatusSchema = z.object({
  status: z.enum(['submitted', 'approved', 'rejected', 'finalist', 'winner'], {
    errorMap: () => ({ message: "Status deve ser: submitted, approved, rejected, finalist ou winner" })
  }),
})

/**
 * Schema para busca de trabalhos com filtros
 */
export const projectQuerySchema = z.object({
  type: z.enum(PROJECT_TYPES).optional(),
  demodayId: z.string().optional(),
  status: z.enum(['submitted', 'approved', 'rejected', 'finalist', 'winner']).optional(),
  userId: z.string().optional(),
  categoryId: z.string().optional(),
}).optional()

// Schema para validação do status de atualização
export const updateStatusSchema = z.object({
  status: z.enum(["active", "finished", "canceled"]),
});

// Schema para validação de votos
export const voteSchema = z.object({
  projectId: z.string().min(1, "ID do trabalho é obrigatório"),
  demodayId: z.string().min(1, "ID do demoday é obrigatório"),
  votePhase: z.enum(["popular", "final"]).default("popular"),
});

// Schema for validating demoday data
export const demodaySchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  maxFinalists: z.number().int().min(1, "Número de finalistas deve ser pelo menos 1").optional(),
  phases: z.array(
    z.object({
      name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
      description: z.string().min(5, "Descrição deve ter pelo menos 5 caracteres"),
      phaseNumber: z.number().int().positive(),
      startDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: "Data inválida",
      }),
      endDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: "Data inválida",
      }),
    })
  ).min(1, "Adicione pelo menos uma fase"),
});

// Schema for validating criteria - apenas para avaliação
export const criteriaSchema = z.object({
  id: z.string().optional(),
  demoday_id: z.string().optional(),
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().min(1, "Descrição é obrigatória"),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

// Schema para critérios em formulários
export const formCriteriaSchema = z.object({
  demoday_id: z.string().optional(),
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  description: z.string().min(5, "Descrição deve ter pelo menos 5 caracteres"),
});

// Schema para validar envio em lote de critérios de triagem
export const batchCriteriaSchema = z.object({
  demodayId: z.string().min(1, "ID do demoday é obrigatório"),
  criteria: z.array(
    z.object({
      name: z.string().min(1, "Nome é obrigatório"),
      description: z.string().min(1, "Descrição é obrigatória"),
    })
  ).min(1, "Pelo menos um critério é obrigatório"),
});

// Schema para validação de registro de usuário
export const registerSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Senha deve ter pelo menos 8 caracteres"),
  role: z.enum(["student_ufba", "student_external"]),
});

// Schema para validação de login de usuário
export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Senha deve ter pelo menos 8 caracteres"),
});




export const phaseSchema = z.object({
  phaseNumber: z.number(),
  name: z.string().min(1, "Nome da fase é obrigatório"),
  description: z.string().min(1, "Descrição da fase é obrigatória"),
  startDate: z.string().min(1, "Data de início é obrigatória"),
  endDate: z.string().min(1, "Data de término é obrigatória"),
})

export const demodayFormSchema = z.object({
  name: z.string().min(1, "Nome do demoday é obrigatório"),
  phases: z.array(phaseSchema).min(1, "Pelo menos uma fase é necessária"),
  maxFinalists: z.number().int().min(1, "Número de finalistas deve ser pelo menos 1").default(5),
  evaluationCriteria: z.array(criteriaSchema).default([]),
})

export const phaseFormSchema = z.object({
  name: z.string().min(1, "Nome da fase é obrigatório"),
  description: z.string().min(1, "Descrição da fase é obrigatória"),
  startDate: z.string().min(1, "Data de início é obrigatória"),
  endDate: z.string().min(1, "Data de término é obrigatória"),
})

export const criteriaFormSchema = z.object({
  name: z.string().min(1, "Nome do critério é obrigatório"),
  description: z.string().min(1, "Descrição do critério é obrigatória"),
})