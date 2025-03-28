import { PROJECT_TYPES } from "@/types"
import { z } from "zod"

/**
 * Schema Zod para validação de dados do projeto
 */
export const projectSchema = z.object({
  title: z.string().min(2, "Título deve ter pelo menos 2 caracteres").max(100, "Título deve ter no máximo 100 caracteres"),
  description: z.string().min(5, "Descrição deve ter pelo menos 5 caracteres").max(5000, "Descrição deve ter no máximo 5000 caracteres"),
  type: z.enum(PROJECT_TYPES, {
    errorMap: () => ({ message: `Tipo de projeto deve ser um dos seguintes: ${PROJECT_TYPES.join(", ")}` })
  }),
})

/**
 * Schema para submissão de projeto em um Demoday
 */
export const projectSubmissionSchema = z.object({
  projectId: z.string().min(1, "ID do projeto é obrigatório"),
  demodayId: z.string().min(1, "ID do demoday é obrigatório"),
})

/**
 * Schema para atualização de status da submissão de projeto
 */
export const projectSubmissionStatusSchema = z.object({
  status: z.enum(['submitted', 'approved', 'rejected', 'finalist', 'winner'], {
    errorMap: () => ({ message: "Status deve ser: submitted, approved, rejected, finalist ou winner" })
  }),
})

/**
 * Schema para busca de projetos com filtros
 */
export const projectQuerySchema = z.object({
  type: z.enum(PROJECT_TYPES).optional(),
  demodayId: z.string().optional(),
  status: z.enum(['submitted', 'approved', 'rejected', 'finalist', 'winner']).optional(),
  userId: z.string().optional(),
}).optional()

// Schema para validação do status de atualização
export const updateStatusSchema = z.object({
  status: z.enum(["active", "finished", "canceled"]),
});

// Schema para validação de votos
export const voteSchema = z.object({
  projectId: z.string().min(1, "ID do projeto é obrigatório"),
  demodayId: z.string().min(1, "ID do demoday é obrigatório"),
});

// Schema for validating demoday data
export const demodaySchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
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

// Schema for validating criteria
export const criteriaSchema = z.object({
  id: z.string().optional(),
  demoday_id: z.string().optional(),
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().min(1, "Descrição é obrigatória"),
  type: z.enum(["registration", "evaluation"]).optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

// Schema for criteria in forms where demoday_id might not exist yet
export const formCriteriaSchema = z.object({
  demoday_id: z.string().optional(), // Make demoday_id optional for forms
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  description: z.string().min(5, "Descrição deve ter pelo menos 5 caracteres"),
  type: z.enum(["registration", "evaluation"]),
});

// Schema para validar envio em lote de critérios
export const batchCriteriaSchema = z.object({
  demodayId: z.string().min(1, "ID do demoday é obrigatório"),
  registration: z.array(
    z.object({
      name: z.string().min(1, "Nome é obrigatório"),
      description: z.string().min(1, "Descrição é obrigatória"),
    })
  ).optional().default([]),
  evaluation: z.array(
    z.object({
      name: z.string().min(1, "Nome é obrigatório"),
      description: z.string().min(1, "Descrição é obrigatória"),
    })
  ).optional().default([]),
});

// Schema para validação de registro de usuário
export const registerSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Senha deve ter pelo menos 8 caracteres"),
  role: z.enum(["admin", "professor", "user"]),
});

// Schema para validação de login de usuário
export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Senha deve ter pelo menos 8 caracteres"),
});


// Schema para validação de critérios de inscrição
export const registrationCriteriaSchema = z.object({
  demoday_id: z.string().min(1, "ID do demoday é obrigatório"),
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  description: z.string().min(5, "Descrição deve ter pelo menos 5 caracteres"),
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
  registrationCriteria: z.array(criteriaSchema).min(1, "Pelo menos um critério de inscrição é obrigatório"),
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