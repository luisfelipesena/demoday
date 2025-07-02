"use client"

import { DemodayFormData, DemodayFormProps } from "@/components/dashboard/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DatePickerWithRange } from "@/components/ui/simple-datepicker"
import { Textarea } from "@/components/ui/textarea"
import { Phase } from "@/hooks/useDemoday"
import { demodayFormSchema } from "@/server/db/validators"
import { zodResolver } from "@hookform/resolvers/zod"
import { Plus, X } from "lucide-react"
import { useCallback } from "react"
import { DateRange } from "react-day-picker"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"

export function DemodayForm({
  initialData,
  demodayId,
  onSubmit,
  isSubmitting,
  error,
  submitButtonText,
  loadingButtonText,
}: DemodayFormProps) {
  const defaultPhases: Phase[] = [
    {
      name: "Submissão de Projetos",
      description: "Período para submissão de projetos pelos estudantes.",
      phaseNumber: 1,
      startDate: "2024-07-14",
      endDate: "2024-09-05",
    },
    {
      name: "Avaliação",
      description: "Período de avaliação dos projetos pela comissão.",
      phaseNumber: 2,
      startDate: "2024-09-06",
      endDate: "2024-09-14",
    },
    {
      name: "Votação Final",
      description: "Votação final para seleção dos finalistas.",
      phaseNumber: 3,
      startDate: "2024-09-15",
      endDate: "2024-09-30",
    },
    {
      name: "Apresentação",
      description: "Evento final de apresentação dos projetos.",
      phaseNumber: 4,
      startDate: "2024-10-10",
      endDate: "2024-10-10",
    },
  ]

  const createEmptyCriterion = (type: "registration" | "evaluation") => ({
    name: "",
    description: "",
    type,
    demoday_id: demodayId || "",
  })

  const prepareInitialData = () => {
    if (!initialData) {
      return {
        name: "",
        maxFinalists: 10,
        phases: defaultPhases,
        registrationCriteria: [],
        evaluationCriteria: [],
      }
    }

    return {
      name: initialData.name || "",
      maxFinalists: initialData.maxFinalists || 10,
      phases: initialData.phases || defaultPhases,
      registrationCriteria:
        initialData.registrationCriteria?.map((criteria) => ({
          ...criteria,
          type: "registration" as const,
          demoday_id: demodayId || criteria.demoday_id || "",
        })) || [],
      evaluationCriteria:
        initialData.evaluationCriteria?.map((criteria) => ({
          ...criteria,
          type: "evaluation" as const,
          demoday_id: demodayId || criteria.demoday_id || "",
        })) || [],
    }
  }

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<DemodayFormData>({
    resolver: zodResolver(demodayFormSchema),
    defaultValues: prepareInitialData(),
  })

  const formPhases = watch("phases")
  const formRegistrationCriteria = watch("registrationCriteria")
  const formEvaluationCriteria = watch("evaluationCriteria")

  const updatePhaseDates = useCallback(
    (index: number, dateRange: DateRange | undefined) => {
      if (!dateRange || !dateRange.from) {
        setValue(`phases.${index}.startDate`, "")
        setValue(`phases.${index}.endDate`, "")
        return
      }

      const year = dateRange.from.getFullYear()
      const month = dateRange.from.getMonth() + 1
      const day = dateRange.from.getDate()

      const monthStr = month < 10 ? `0${month}` : `${month}`
      const dayStr = day < 10 ? `0${day}` : `${day}`

      const startDateString = `${year}-${monthStr}-${dayStr}`
      setValue(`phases.${index}.startDate`, startDateString)

      if (dateRange.to) {
        const year = dateRange.to.getFullYear()
        const month = dateRange.to.getMonth() + 1
        const day = dateRange.to.getDate()

        const monthStr = month < 10 ? `0${month}` : `${month}`
        const dayStr = day < 10 ? `0${day}` : `${day}`

        const endDateString = `${year}-${monthStr}-${dayStr}`
        setValue(`phases.${index}.endDate`, endDateString)
      } else {
        setValue(`phases.${index}.endDate`, "")
      }
    },
    [setValue]
  )

  const addRegistrationCriteria = () => {
    setValue("registrationCriteria", [...formRegistrationCriteria, createEmptyCriterion("registration")])
  }

  const removeRegistrationCriteria = (index: number) => {
    if (formRegistrationCriteria.length > 0) {
      setValue(
        "registrationCriteria",
        formRegistrationCriteria.filter((_, i) => i !== index)
      )
    }
  }

  const addEvaluationCriteria = () => {
    setValue("evaluationCriteria", [...formEvaluationCriteria, createEmptyCriterion("evaluation")])
  }

  const removeEvaluationCriteria = (index: number) => {
    if (formEvaluationCriteria.length > 0) {
      setValue(
        "evaluationCriteria",
        formEvaluationCriteria.filter((_, i) => i !== index)
      )
    }
  }

  const onSubmitForm = (data: DemodayFormData) => {
    const hasInvalidDates = data.phases.some(
      (phase) => !phase.startDate || !phase.endDate || phase.startDate.trim() === "" || phase.endDate.trim() === ""
    )

    if (hasInvalidDates) {
      toast.error("Todas as fases devem ter datas de início e fim preenchidas.")
      return
    }

    onSubmit(data)
  }

  const getPhaseRangeDates = useCallback((phase: Phase): DateRange | undefined => {
    if (!phase.startDate && !phase.endDate) return undefined

    try {
      if (!phase.startDate) {
        return undefined
      }

      const fromParts = phase.startDate.split("-")
      if (fromParts.length !== 3) {
        return undefined
      }

      const fromYear = parseInt(fromParts[0]!, 10)
      const fromMonth = parseInt(fromParts[1]!, 10)
      const fromDay = parseInt(fromParts[2]!, 10)

      if (isNaN(fromYear) || isNaN(fromMonth) || isNaN(fromDay)) {
        return undefined
      }

      const from = new Date(fromYear, fromMonth - 1, fromDay, 12, 0, 0, 0)

      if (isNaN(from.getTime())) {
        return undefined
      }

      if (!phase.endDate) {
        return { from }
      }

      const toParts = phase.endDate.split("-")
      if (toParts.length !== 3) {
        return { from }
      }

      const toYear = parseInt(toParts[0]!, 10)
      const toMonth = parseInt(toParts[1]!, 10)
      const toDay = parseInt(toParts[2]!, 10)

      if (isNaN(toYear) || isNaN(toMonth) || isNaN(toDay)) {
        return { from }
      }

      const to = new Date(toYear, toMonth - 1, toDay, 12, 0, 0, 0)

      if (isNaN(to.getTime())) {
        return { from }
      }

      return { from, to }
    } catch (error) {
      console.error("Erro ao converter datas para DateRange:", error)
      return undefined
    }
  }, [])

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        handleSubmit(onSubmitForm)(e)
      }}
      className="space-y-10"
    >
      {error && <div className="mb-6 rounded-md bg-red-100 p-4 text-red-700">{error}</div>}

      {/* Nome do Demoday e Configurações Básicas */}
      <div className="space-y-4 rounded-lg border p-6 shadow-sm">
        <h2 className="text-xl font-semibold">Informações Básicas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Nome do Demoday</label>
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
          <div>
            <label className="block text-sm font-medium mb-2">Número de Finalistas</label>
            <Controller
              name="maxFinalists"
              control={control}
              render={({ field }) => (
                <div>
                  <Input
                    type="number"
                    min="1"
                    max="50"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 10)}
                    placeholder="10"
                    className="w-full"
                  />
                  {errors.maxFinalists && <p className="mt-1 text-xs text-red-500">{errors.maxFinalists.message}</p>}
                  <p className="text-sm text-muted-foreground mt-1">
                    Total de projetos que podem ser selecionados como finalistas
                  </p>
                </div>
              )}
            />
          </div>
        </div>
      </div>

      {/* Fases */}
      <div className="space-y-6 rounded-lg border p-6 shadow-sm">
        <h2 className="text-xl font-semibold">Prazos</h2>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-2">
          {formPhases.map((phase, index) => (
            <div key={`phase-${phase.phaseNumber}-${index}`} className="space-y-5 rounded-lg border p-5 shadow-sm">
              <h3 className="text-lg font-medium">
                Fase {phase.phaseNumber}: {phase.name}
              </h3>
              <p className="text-sm text-gray-600">{phase.description}</p>
              <div className="w-full">
                <label className="mb-2 block text-sm font-medium">Período da fase:</label>
                <div>
                  <DatePickerWithRange
                    id={`phase-dates-${phase.phaseNumber}-${index}`}
                    value={getPhaseRangeDates(phase)}
                    onChange={(dateRange) => updatePhaseDates(index, dateRange)}
                    disabled={isSubmitting}
                    disablePastDates={false}
                    className="w-full"
                  />
                  {(errors.phases?.[index]?.startDate || errors.phases?.[index]?.endDate) && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.phases?.[index]?.startDate?.message || errors.phases?.[index]?.endDate?.message}
                    </p>
                  )}
                </div>
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
            <Plus className="h-4 w-4 mr-2" />
            Adicionar
          </Button>
        </div>
        <p className="text-sm text-gray-600">Defina os critérios para inscrição de projetos no Demoday.</p>

        {errors.registrationCriteria && <p className="text-sm text-red-500">{errors.registrationCriteria.message}</p>}

        <div className="space-y-4">
          {formRegistrationCriteria.map((criterion, index) => (
            <div key={index} className="rounded-lg border p-4 shadow-sm">
              <div className="flex justify-between mb-2">
                <h3 className="text-md font-medium">Critério {index + 1}</h3>
                <Button
                  type="button"
                  onClick={() => removeRegistrationCriteria(index)}
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  disabled={isSubmitting || formRegistrationCriteria.length <= 1}
                >
                  <X className="h-4 w-4" />
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
                        <Textarea
                          placeholder="Ex: O projeto apresenta uma ideia original ou inovadora"
                          {...field}
                          className="min-h-[80px]"
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
            <Plus className="h-4 w-4 mr-2" />
            Adicionar
          </Button>
        </div>
        <p className="text-sm text-gray-600">
          Defina os critérios para avaliação de projetos pelos professores e comissão.
        </p>

        <div className="space-y-4">
          {formEvaluationCriteria.map((criterion, index) => (
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
                  <X className="h-4 w-4" />
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
                          placeholder="Ex: Qualidade Técnica"
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
                        <Textarea
                          placeholder="Ex: Avaliação da qualidade técnica da implementação"
                          {...field}
                          className="min-h-[80px]"
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

      <div className="flex justify-end space-x-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? loadingButtonText || "Salvando..." : submitButtonText || "Criar Demoday"}
        </Button>
      </div>
    </form>
  )
}
