/**
 * Tipos centralizados para o projeto Demoday
 */

/**
 * Tipo que representa um projeto acadêmico no sistema
 */
export interface Project {
  id: string
  title: string
  description: string
  userId: string
  type: string
  createdAt: string
  updatedAt: string
}

/**
 * Tipo que representa um evento Demoday
 */
export interface Demoday {
  id: string
  name: string
  phases: Phase[]
  active: boolean
  status: 'active' | 'finished' | 'canceled'
  createdAt: string
  updatedAt: string
  stats?: {
    totalProjects: number
    submitted: number
    approved: number
    finalists: number
    winners: number
  }
  currentPhase?: {
    id: string
    name: string
    phaseNumber: number
  } | null
}

/**
 * Tipo que representa uma fase do Demoday
 */
export interface Phase {
  id?: string
  demodayId?: string
  name: string
  description: string
  phaseNumber: number
  startDate: string
  endDate: string
  createdAt?: string
  updatedAt?: string
}

/**
 * Tipos de projetos disponíveis para seleção
 */
export const PROJECT_TYPES = ["Disciplina", "IC", "TCC", "Mestrado", "Doutorado"] as const
export type ProjectType = typeof PROJECT_TYPES[number] 