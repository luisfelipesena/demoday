import { z } from "zod"

/**
 * Schema Zod para validação de dados do projeto
 */
export const projectSchema = z.object({
  title: z.string().min(2, "Título deve ter pelo menos 2 caracteres"),
  description: z.string().min(5, "Descrição deve ter pelo menos 5 caracteres"),
  type: z.string().min(1, "Tipo de projeto é obrigatório"),
}) 