import { Phase } from "@/hooks/useDemoday"
import { demodayFormSchema } from "@/server/db/validators"
import { z } from "zod"

export type DemodayFormData = z.infer<typeof demodayFormSchema>
export type CriteriaType = "registration" | "evaluation"

export interface DemodayFormProps {
  initialData?: {
    name: string
    phases: Phase[]
    registrationCriteria?: { name: string; description: string; demoday_id?: string }[]
    evaluationCriteria?: { name: string; description: string; demoday_id?: string }[]
  }
  demodayId?: string
  onSubmit: (data: DemodayFormData) => void
  isSubmitting: boolean
  error: string | null
  submitButtonText: string
  loadingButtonText: string
}
