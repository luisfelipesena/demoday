"use client"

import { CriteriaType, DemodayFormData, DemodayFormProps } from "@/components/dashboard/types"
import { Button } from "@/components/ui/button"
import { DatePickerWithRange } from "@/components/ui/simple-datepicker"
import { Input } from "@/components/ui/input"
import { Phase } from "@/hooks/useDemoday"
import { demodayFormSchema } from "@/server/db/validators"
import { zodResolver } from "@hookform/resolvers/zod"
import { PlusCircle, X } from "lucide-react"
import { DateRange } from "react-day-picker"
import { Controller, useForm } from "react-hook-form"

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

  const createEmptyCriterion = (type: CriteriaType) => ({
    name: "",
    description: "",
    type,
    demoday_id: demodayId || "", // This is now optional in the schema
  })

  // Apply demoday_id to initialData criteria if provided
  const prepareInitialData = () => {
    if (!initialData) {
      return {
        name: "",
        phases: defaultPhases,
        registrationCriteria: [],
        evaluationCriteria: [],
      }
    }

    return {
      name: initialData.name || "",
      phases: initialData.phases || defaultPhases,
      registrationCriteria:
        initialData.registrationCriteria?.map((criteria) => ({
          ...criteria,
          type: "registration" as CriteriaType,
          demoday_id: demodayId || criteria.demoday_id || "",
        })) || [],
      evaluationCriteria:
        initialData.evaluationCriteria?.map((criteria) => ({
          ...criteria,
          type: "evaluation" as CriteriaType,
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

  const phases = watch("phases")
  const registrationCriteria = watch("registrationCriteria")
  const evaluationCriteria = watch("evaluationCriteria")

  const updatePhaseDates = (index: number, dateRange: DateRange | undefined) => {
    if (!dateRange || !dateRange.from) {
      setValue(`phases.${index}.startDate`, "")
      setValue(`phases.${index}.endDate`, "")
      return
    }

    // Formatar a data inicial para o formato ISO (YYYY-MM-DD)
    const year = dateRange.from.getFullYear();
    const month = dateRange.from.getMonth() + 1; // getMonth() retorna 0-11
    const day = dateRange.from.getDate();
    
    // Formatar com zeros à esquerda
    const monthStr = month < 10 ? `0${month}` : `${month}`;
    const dayStr = day < 10 ? `0${day}` : `${day}`;
    
    const startDateString = `${year}-${monthStr}-${dayStr}`;
    setValue(`phases.${index}.startDate`, startDateString)

    if (dateRange.to) {
      // Formatar a data final para o formato ISO (YYYY-MM-DD)
      const year = dateRange.to.getFullYear();
      const month = dateRange.to.getMonth() + 1; // getMonth() retorna 0-11
      const day = dateRange.to.getDate();
      
      // Formatar com zeros à esquerda
      const monthStr = month < 10 ? `0${month}` : `${month}`;
      const dayStr = day < 10 ? `0${day}` : `${day}`;
      
      const endDateString = `${year}-${monthStr}-${dayStr}`;
      setValue(`phases.${index}.endDate`, endDateString)
    } else {
       setValue(`phases.${index}.endDate`, "")
    }
  }

  const addRegistrationCriteria = () => {
    setValue("registrationCriteria", [...registrationCriteria, createEmptyCriterion("registration")])
  }

  const removeRegistrationCriteria = (index: number) => {
    if (registrationCriteria.length > 0) {
      setValue(
        "registrationCriteria",
        registrationCriteria.filter((_, i) => i !== index)
      )
    }
  }

  const addEvaluationCriteria = () => {
    setValue("evaluationCriteria", [...evaluationCriteria, createEmptyCriterion("evaluation")])
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
    // Verificar se todas as fases têm datas válidas
    const hasInvalidDates = data.phases.some(phase => 
      !phase.startDate || !phase.endDate || 
      phase.startDate.trim() === '' || 
      phase.endDate.trim() === ''
    );
    
    if (hasInvalidDates) {
      // Mostrar aviso mas continuar o envio (a API usará datas padrão)
      console.warn('Algumas fases estão com datas em branco. Serão usadas datas padrão.');
    }
    
    // Enviar os dados
    onSubmit({
      name: data.name,
      phases: data.phases,
      registrationCriteria: data.registrationCriteria,
      evaluationCriteria: data.evaluationCriteria,
    });
  }

  const getPhaseRangeDates = (phase: Phase): DateRange | undefined => {
    if (!phase.startDate && !phase.endDate) return undefined

    try {
      if (!phase.startDate) {
        return undefined;
      }
      
      // Extrair o ano, mês e dia diretamente da string yyyy-MM-dd para data inicial
      const fromParts = phase.startDate.split('-');
      
      if (fromParts.length !== 3) {
        console.warn("Formato de data inicial inválido:", phase.startDate);
        return undefined;
      }
      
      const fromYear = parseInt(fromParts[0]!, 10);
      const fromMonth = parseInt(fromParts[1]!, 10);
      const fromDay = parseInt(fromParts[2]!, 10);
      
      // Verificar se todos os valores são números válidos
      if (isNaN(fromYear) || isNaN(fromMonth) || isNaN(fromDay)) {
        console.warn("Componentes de data inicial não são números válidos:", phase.startDate);
        return undefined;
      }
      
      // Criar a data usando os componentes extraídos (mês - 1 porque getMonth é 0-11)
      const from = new Date(fromYear, fromMonth - 1, fromDay, 12, 0, 0, 0);
      
      // Verificar se a data criada é válida
      if (isNaN(from.getTime())) {
        console.warn("Data inicial criada é inválida:", phase.startDate);
        return undefined;
      }

      // Se não houver data final, retornar apenas a data inicial
      if (!phase.endDate) {
        return { from };
      }
      
      // Processar a data final se existir
      const toParts = phase.endDate.split('-');
      
      if (toParts.length !== 3) {
        console.warn("Formato de data final inválido:", phase.endDate);
        return { from };
      }
      
      const toYear = parseInt(toParts[0]!, 10);
      const toMonth = parseInt(toParts[1]!, 10);
      const toDay = parseInt(toParts[2]!, 10);
      
      // Verificar se todos os valores são números válidos
      if (isNaN(toYear) || isNaN(toMonth) || isNaN(toDay)) {
        console.warn("Componentes de data final não são números válidos:", phase.endDate);
        return { from };
      }
      
      // Criar a data usando os componentes extraídos
      const to = new Date(toYear, toMonth - 1, toDay, 12, 0, 0, 0);
      
      // Verificar se a data criada é válida
      if (isNaN(to.getTime())) {
        console.warn("Data final criada é inválida:", phase.endDate);
        return { from };
      }

      return { from, to };
      
    } catch (error) {
      console.error("Erro ao converter datas para DateRange:", error)
      return undefined
    }
  }

  return (
    <form 
      onSubmit={(e) => {
        // Previne a submissão automática e usa o handleSubmit para controlar quando é apropriado submeter
        e.preventDefault();
        handleSubmit(onSubmitForm)(e);
      }} 
      className="space-y-10"
    >
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
                  render={() => (
                    <div>
                      <DatePickerWithRange
                        id={`phase-dates-${index}`}
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
      <Button 
        type="submit" 
        className="w-full bg-blue-600 text-white hover:bg-blue-700" 
        disabled={isSubmitting}
      >
        {isSubmitting ? loadingButtonText : submitButtonText}
      </Button>
    </form>
  )
}
