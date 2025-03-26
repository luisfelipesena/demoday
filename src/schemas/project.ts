import { z } from "zod"
import { PROJECT_TYPES } from "@/types"

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