"use client"

import { Button } from "@/components/ui/button"
import { DatePickerWithRange } from "@/components/ui/datepicker"
import { Input } from "@/components/ui/input"
import { Phase } from "@/hooks/useDemoday"
import { zodResolver } from "@hookform/resolvers/zod"
import { PlusCircle, X } from "lucide-react"
import moment from "moment"
import { DateRange } from "react-day-picker"
import { Controller, useForm } from "react-hook-form"
import { z } from "zod"

const phaseSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  description: z.string().min(5, "Descrição deve ter pelo menos 5 caracteres"),
  phaseNumber: z.number().int().positive(),
  startDate: z.string().min(1, "Data de início é obrigatória"),
  endDate: z.string().min(1, "Data de fim é obrigatória"),
})

const criteriaSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  description: z.string().min(5, "Descrição deve ter pelo menos 5 caracteres"),
})

const demodayFormSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  phases: z.array(phaseSchema).min(1, "Adicione pelo menos uma fase"),
  registrationCriteria: z.array(criteriaSchema).min(1, "Adicione pelo menos um critério de inscrição"),
  evaluationCriteria: z.array(criteriaSchema),
})

type DemodayFormData = z.infer<typeof demodayFormSchema>

interface DemodayFormProps {
  initialData?: {
    name: string
    phases: Phase[]
    registrationCriteria?: { name: string; description: string }[]
    evaluationCriteria?: { name: string; description: string }[]
  }
  onSubmit: (data: {
    name: string
    phases: Phase[]
    registrationCriteria: { name: string; description: string }[]
    evaluationCriteria: { name: string; description: string }[]
  }) => void
  isSubmitting: boolean
  error: string | null
  submitButtonText: string
  loadingButtonText: string
}

export function DemodayForm({
  initialData,
  onSubmit,
  isSubmitting,
  error,
  submitButtonText,
  loadingButtonText,
}: DemodayFormProps) {
  const defaultPhases: Phase[] = [
    {
      name: "Fase 1",
      description: "A primeira fase é de submissão de projetos.",
      phaseNumber: 1,
      startDate: "",
      endDate: "",
    },
    {
      name: "Fase 2",
      description: "Na segunda fase a comissão avalia os projetos e pode aprová-los.",
      phaseNumber: 2,
      startDate: "",
      endDate: "",
    },
    {
      name: "Fase 3",
      description: "A terceira fase é de votação do público para escolha dos finalistas.",
      phaseNumber: 3,
      startDate: "",
      endDate: "",
    },
    {
      name: "Fase 4",
      description: "Na quarta fase há a votação do público para escolha dos vencedores.",
      phaseNumber: 4,
      startDate: "",
      endDate: "",
    },
  ]

  const defaultRegistrationCriteria = [
    { name: "Originalidade", description: "O projeto apresenta uma ideia original ou inovadora" },
  ]

  const defaultEvaluationCriteria = [
    { name: "Qualidade técnica", description: "Avaliação da qualidade técnica da implementação" },
  ]

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<DemodayFormData>({
    resolver: zodResolver(demodayFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      phases: initialData?.phases || defaultPhases,
      registrationCriteria: initialData?.registrationCriteria || defaultRegistrationCriteria,
      evaluationCriteria: initialData?.evaluationCriteria || defaultEvaluationCriteria,
    },
  })

  const phases = watch("phases")
  const registrationCriteria = watch("registrationCriteria")
  const evaluationCriteria = watch("evaluationCriteria")

  const updatePhaseDates = (index: number, dateRange: DateRange | undefined) => {
    if (!dateRange) return

    const updatedPhases = [...phases]
    const phase = { ...updatedPhases[index] }

    // Update start and end dates
    if (dateRange.from) {
      phase.startDate = moment(dateRange.from).format("YYYY-MM-DD")
    }

    if (dateRange.to) {
      phase.endDate = moment(dateRange.to).format("YYYY-MM-DD")
    } else if (dateRange.from) {
      // If only start date is selected, clear end date
      phase.endDate = ""
    }

    updatedPhases[index] = phase as Phase
    setValue("phases", updatedPhases)
  }

  const addRegistrationCriteria = () => {
    setValue("registrationCriteria", [...registrationCriteria, { name: "", description: "" }])
  }

  const removeRegistrationCriteria = (index: number) => {
    if (registrationCriteria.length > 1) {
      setValue(
        "registrationCriteria",
        registrationCriteria.filter((_, i) => i !== index)
      )
    }
  }

  const addEvaluationCriteria = () => {
    setValue("evaluationCriteria", [...evaluationCriteria, { name: "", description: "" }])
  }

  const removeEvaluationCriteria = (index: number) => {
    if (evaluationCriteria.length > 0) {
      setValue(
        "evaluationCriteria",
        evaluationCriteria.filter((_, i) => i !== index)
      )
    }
  }

  const onSubmitForm = (data: DemodayFormData) => {
    onSubmit({
      name: data.name,
      phases: data.phases,
      registrationCriteria: data.registrationCriteria,
      evaluationCriteria: data.evaluationCriteria,
    })
  }

  const getPhaseRangeDates = (phase: Phase): DateRange | undefined => {
    if (!phase.startDate && !phase.endDate) return undefined

    const result: Partial<DateRange> = {}

    if (phase.startDate) {
      result.from = moment(phase.startDate).toDate()
    }

    if (phase.endDate) {
      result.to = moment(phase.endDate).toDate()
    }

    return Object.keys(result).length > 0 ? (result as DateRange) : undefined
  }

  return (
    <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-10">
      {error && <div className="mb-6 rounded-md bg-red-100 p-4 text-red-700">{error}</div>}

      {/* Nome do Demoday */}
      <div className="space-y-4 rounded-lg border p-6 shadow-sm">
        <h2 className="text-xl font-semibold">Nome do Demoday</h2>
        <Controller
          name="name"
          control={control}
          render={({ field }) => (
            <div>
              <Input type="text" placeholder="Digite o nome da edição do demoday" {...field} className="w-full" />
              {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
            </div>
          )}
        />
      </div>

      {/* Fases */}
      <div className="space-y-6 rounded-lg border p-6 shadow-sm">
        <h2 className="text-xl font-semibold">Prazos</h2>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-2">
          {phases.map((phase, index) => (
            <div key={index} className="space-y-5 rounded-lg border p-5 shadow-sm">
              <h3 className="text-lg font-medium">
                Fase {phase.phaseNumber}: {phase.name}
              </h3>
              <p className="text-sm text-gray-600">{phase.description}</p>

              <div className="w-full">
                <label className="mb-2 block text-sm font-medium">Período da fase:</label>
                <Controller
                  name={`phases.${index}.startDate`}
                  control={control}
                  render={({ field }) => (
                    <div>
                      <DatePickerWithRange
                        id={`phase-dates-${index}`}
                        value={getPhaseRangeDates(phase)}
                        onChange={(dateRange) => updatePhaseDates(index, dateRange)}
                        disabled={isSubmitting}
                        disablePastDates={true}
                        className="w-full"
                      />
                      {(errors.phases?.[index]?.startDate || errors.phases?.[index]?.endDate) && (
                        <p className="mt-1 text-xs text-red-500">
                          {errors.phases?.[index]?.startDate?.message || errors.phases?.[index]?.endDate?.message}
                        </p>
                      )}
                    </div>
                  )}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Critérios de Inscrição */}
      <div className="space-y-6 rounded-lg border p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Critérios de Inscrição</h2>
          <Button
            type="button"
            onClick={addRegistrationCriteria}
            variant="outline"
            size="sm"
            className="flex items-center gap-1"
            disabled={isSubmitting}
          >
            <PlusCircle size={16} />
            Adicionar
          </Button>
        </div>
        <p className="text-sm text-gray-600">Defina os critérios para inscrição de projetos no Demoday.</p>

        {errors.registrationCriteria && <p className="text-sm text-red-500">{errors.registrationCriteria.message}</p>}

        <div className="space-y-4">
          {registrationCriteria.map((criteria, index) => (
            <div key={index} className="rounded-lg border p-4 shadow-sm">
              <div className="flex justify-between mb-2">
                <h3 className="text-md font-medium">Critério {index + 1}</h3>
                <Button
                  type="button"
                  onClick={() => removeRegistrationCriteria(index)}
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  disabled={isSubmitting || registrationCriteria.length <= 1}
                >
                  <X size={16} />
                </Button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-sm font-medium">Nome</label>
                  <Controller
                    name={`registrationCriteria.${index}.name`}
                    control={control}
                    render={({ field }) => (
                      <div>
                        <Input
                          type="text"
                          placeholder="Ex: Originalidade"
                          {...field}
                          className="w-full"
                          disabled={isSubmitting}
                        />
                        {errors.registrationCriteria?.[index]?.name && (
                          <p className="mt-1 text-xs text-red-500">{errors.registrationCriteria[index].name.message}</p>
                        )}
                      </div>
                    )}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Descrição</label>
                  <Controller
                    name={`registrationCriteria.${index}.description`}
                    control={control}
                    render={({ field }) => (
                      <div>
                        <textarea
                          placeholder="Ex: O projeto apresenta uma ideia original ou inovadora"
                          {...field}
                          className="h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          disabled={isSubmitting}
                        />
                        {errors.registrationCriteria?.[index]?.description && (
                          <p className="mt-1 text-xs text-red-500">
                            {errors.registrationCriteria[index].description.message}
                          </p>
                        )}
                      </div>
                    )}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Critérios de Avaliação */}
      <div className="space-y-6 rounded-lg border p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Critérios de Avaliação</h2>
          <Button
            type="button"
            onClick={addEvaluationCriteria}
            variant="outline"
            size="sm"
            className="flex items-center gap-1"
            disabled={isSubmitting}
          >
            <PlusCircle size={16} />
            Adicionar
          </Button>
        </div>
        <p className="text-sm text-gray-600">Defina os critérios para avaliação dos projetos submetidos.</p>

        <div className="space-y-4">
          {evaluationCriteria.map((criteria, index) => (
            <div key={index} className="rounded-lg border p-4 shadow-sm">
              <div className="flex justify-between mb-2">
                <h3 className="text-md font-medium">Critério {index + 1}</h3>
                <Button
                  type="button"
                  onClick={() => removeEvaluationCriteria(index)}
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  disabled={isSubmitting}
                >
                  <X size={16} />
                </Button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-sm font-medium">Nome</label>
                  <Controller
                    name={`evaluationCriteria.${index}.name`}
                    control={control}
                    render={({ field }) => (
                      <div>
                        <Input
                          type="text"
                          placeholder="Ex: Qualidade técnica"
                          {...field}
                          className="w-full"
                          disabled={isSubmitting}
                        />
                        {errors.evaluationCriteria?.[index]?.name && (
                          <p className="mt-1 text-xs text-red-500">{errors.evaluationCriteria[index].name.message}</p>
                        )}
                      </div>
                    )}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Descrição</label>
                  <Controller
                    name={`evaluationCriteria.${index}.description`}
                    control={control}
                    render={({ field }) => (
                      <div>
                        <textarea
                          placeholder="Ex: Avaliação da qualidade técnica da implementação"
                          {...field}
                          className="h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          disabled={isSubmitting}
                        />
                        {errors.evaluationCriteria?.[index]?.description && (
                          <p className="mt-1 text-xs text-red-500">
                            {errors.evaluationCriteria[index].description.message}
                          </p>
                        )}
                      </div>
                    )}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Submit Button */}
      <Button type="submit" className="w-full bg-blue-600 text-white hover:bg-blue-700" disabled={isSubmitting}>
        {isSubmitting ? loadingButtonText : submitButtonText}
      </Button>
    </form>
  )
}
