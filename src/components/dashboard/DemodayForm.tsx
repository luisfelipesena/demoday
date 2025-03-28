"use client"

import { Button } from "@/components/ui/button"
import { DatePickerWithRange } from "@/components/ui/datepicker"
import { Input } from "@/components/ui/input"
import { Phase } from "@/hooks/useDemoday"
import { zodResolver } from "@hookform/resolvers/zod"
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

const demodayFormSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  phases: z.array(phaseSchema).min(1, "Adicione pelo menos uma fase"),
})

type DemodayFormData = z.infer<typeof demodayFormSchema>

interface DemodayFormProps {
  initialData?: {
    name: string
    phases: Phase[]
  }
  onSubmit: (data: { name: string; phases: Phase[] }) => void
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
    },
  })

  const phases = watch("phases")

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

  const onSubmitForm = (data: DemodayFormData) => {
    onSubmit(data)
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

      {/* Submit Button */}
      <Button type="submit" className="w-full bg-blue-600 text-white hover:bg-blue-700" disabled={isSubmitting}>
        {isSubmitting ? loadingButtonText : submitButtonText}
      </Button>
    </form>
  )
}
