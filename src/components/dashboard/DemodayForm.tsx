"use client"

import { CriteriaType, DemodayFormData, DemodayFormProps } from "@/components/dashboard/types"
import { Button } from "@/components/ui/button"
import { DatePickerWithRange } from "@/components/ui/simple-datepicker"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Phase } from "@/hooks/useDemoday"
import { demodayFormSchema } from "@/server/db/validators"
import { zodResolver } from "@hookform/resolvers/zod"
import { 
  PlusCircle, 
  X, 
  Calendar, 
  Trophy, 
  Users, 
  Sparkles,
  CheckCircle2,
  Vote,
  Presentation,
  FileText,
  Target,
  Award
} from "lucide-react"
import { DateRange } from "react-day-picker"
import { Controller, useForm } from "react-hook-form"
import { useState, useEffect, useCallback } from "react"
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
      name: "Submissão de projetos",
      description: "Período para submissão de projetos pelos estudantes.",
      phaseNumber: 1,
      startDate: "",
      endDate: "",
    },
    {
      name: "Triagem",
      description: "Avaliação e seleção dos projetos pela comissão organizadora.",
      phaseNumber: 2,
      startDate: "",
      endDate: "",
    },
    {
      name: "Votação para a final",
      description: "Votação popular dos projetos finalistas.",
      phaseNumber: 3,
      startDate: "",
      endDate: "",
    },
    {
      name: "Evento principal (final)",
      description: "Apresentação dos finalistas e premiação no evento principal.",
      phaseNumber: 4,
      startDate: "",
      endDate: "",
    },
  ]

  const phaseIcons = [FileText, CheckCircle2, Vote, Presentation]

  const createEmptyCriterion = (type: CriteriaType) => ({
    name: "",
    description: "",
    type,
    demoday_id: demodayId || "",
  })

  const prepareInitialData = () => {
    if (!initialData) {
      return {
        name: "",
        phases: defaultPhases,
        maxFinalists: 5,
        evaluationCriteria: [],
      }
    }

    return {
      name: initialData.name || "",
      phases: initialData.phases || defaultPhases,
      maxFinalists: initialData.maxFinalists || 5,
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
  const evaluationCriteria = watch("evaluationCriteria")

  // Validação em tempo real das datas das fases
  const validatePhaseDates = useCallback((phaseIndex: number): string | null => {
    const phase = phases[phaseIndex];
    if (!phase?.startDate || !phase?.endDate) return null;
    
    try {
      const startDate = new Date(phase.startDate + 'T12:00:00.000Z');
      const endDate = new Date(phase.endDate + 'T12:00:00.000Z');
      
      if (startDate > endDate) {
        return "Data de início não pode ser posterior à data de fim";
      }
    } catch (error) {
      return "Formato de data inválido";
    }
    
    return null;
  }, [phases])

  // Verificar se há erros de validação em tempo real
  const hasDateValidationErrors = useCallback(() => {
    return phases.some((_, index) => validatePhaseDates(index) !== null);
  }, [phases, validatePhaseDates])

  const updatePhaseDates = useCallback((index: number, dateRange: DateRange | undefined) => {
    if (!dateRange || !dateRange.from) {
      setValue(`phases.${index}.startDate`, "")
      setValue(`phases.${index}.endDate`, "")
      return
    }

    // Converter data para string no formato YYYY-MM-DD, garantindo timezone consistente
    const startDateString = dateRange.from.toISOString().split('T')[0]!;
    setValue(`phases.${index}.startDate`, startDateString)

    if (dateRange.to) {
      const endDateString = dateRange.to.toISOString().split('T')[0]!;
      setValue(`phases.${index}.endDate`, endDateString)
    } else {
       setValue(`phases.${index}.endDate`, "")
    }
  }, [setValue])

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
    const hasInvalidDates = data.phases.some(phase => 
      !phase.startDate || !phase.endDate || 
      phase.startDate.trim() === '' || 
      phase.endDate.trim() === ''
    );
    
    if (hasInvalidDates) {
      toast.error("Todas as fases devem ter datas de início e fim preenchidas.");
      return;
    }

    // Verificar erros de validação de datas
    if (hasDateValidationErrors()) {
      toast.error("Corrija os erros de datas antes de continuar.");
      return;
    }
    
    console.log('Dados das fases sendo enviados:', data.phases.map(p => ({
      name: p.name,
      phaseNumber: p.phaseNumber,
      startDate: p.startDate,
      endDate: p.endDate
    })));
    
    onSubmit(data);
  }

  const getPhaseRangeDates = useCallback((phase: Phase): DateRange | undefined => {
    if (!phase.startDate && !phase.endDate) return undefined

    try {
      if (!phase.startDate || phase.startDate.trim() === '') {
        return undefined;
      }
      
      // Criar data usando string ISO para garantir timezone consistente
      const from = new Date((phase.startDate as string) + 'T12:00:00.000Z');
      
      if (isNaN(from.getTime())) {
        console.warn("Data inicial criada é inválida:", phase.startDate);
        return undefined;
      }

      if (!phase.endDate || phase.endDate.trim() === '') {
        return { from };
      }
      
      const to = new Date((phase.endDate as string) + 'T12:00:00.000Z');
      
      if (isNaN(to.getTime())) {
        console.warn("Data final criada é inválida:", phase.endDate);
        return { from };
      }

      return { from, to };
      
    } catch (error) {
      console.error("Erro ao converter datas para DateRange:", error)
      return undefined
    }
  }, [])

  return (
    <div className="bg-white">
      <form 
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit(onSubmitForm)(e);
        }} 
        className="space-y-8 max-w-6xl mx-auto p-8"
      >
        {error && (
          <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4 text-red-800">
            <div className="flex items-center gap-2">
              <X className="h-4 w-4 text-red-500" />
              <span className="text-sm font-medium">{error}</span>
            </div>
          </div>
        )}



        {/* Nome do Demoday */}
        <Card className="border border-slate-200 shadow-sm">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
            <CardTitle className="flex items-center gap-2 text-slate-800">
              <Target className="h-5 w-5 text-slate-600" />
              Nome do Evento
            </CardTitle>
            <CardDescription className="text-slate-600">
              Defina um nome marcante para seu Demoday
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <div>
                  <Input 
                    type="text" 
                    placeholder="Ex: Demoday 2024 - Inovação Tecnológica" 
                    {...field} 
                    className="h-12 border-slate-300 focus:border-slate-400 focus:ring-slate-400" 
                  />
                  {errors.name && (
                    <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                      <X className="h-3 w-3" />
                      {errors.name.message}
                    </p>
                  )}
                </div>
              )}
            />
          </CardContent>
        </Card>

        {/* Quantidade de Finalistas */}
        <Card className="border border-slate-200 shadow-sm">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
            <CardTitle className="flex items-center gap-2 text-slate-800">
              <Trophy className="h-5 w-5 text-slate-600" />
              Finalistas
            </CardTitle>
            <CardDescription className="text-slate-600">
              Quantos projetos serão selecionados para a final?
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <Controller
              name="maxFinalists"
              control={control}
              render={({ field }) => (
                <div>
                  <Input 
                    type="number" 
                    placeholder="5" 
                    {...field} 
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 5)}
                    className="h-12 border-slate-300 focus:border-slate-400 focus:ring-slate-400" 
                  />
                  {errors.maxFinalists && (
                    <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                      <X className="h-3 w-3" />
                      {errors.maxFinalists.message}
                    </p>
                  )}
                </div>
              )}
            />
          </CardContent>
        </Card>

        {/* Cronograma das Fases */}
        <Card className="border border-slate-200 shadow-sm">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
            <CardTitle className="flex items-center gap-2 text-slate-800">
              <Calendar className="h-5 w-5 text-slate-600" />
              Cronograma do Evento
            </CardTitle>
            <CardDescription className="text-slate-600">
              Defina as datas para cada fase do seu Demoday
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {phases.map((phase, index) => {
                const Icon = phaseIcons[index] || FileText
                
                return (
                  <div 
                    key={`phase-${phase.phaseNumber}-${index}`} 
                    className="border border-slate-200 rounded-lg p-5 hover:border-slate-300 transition-colors"
                  >
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-slate-100 rounded-lg">
                        <Icon className="h-4 w-4 text-slate-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-slate-800">
                          Fase {phase.phaseNumber}
                        </h3>
                        <p className="text-sm text-slate-600">{phase.name}</p>
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div className="space-y-4">
                      <p className="text-sm text-slate-600 leading-relaxed">
                        {phase.description}
                      </p>

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-slate-700">
                          Período da fase:
                        </label>
                        <div>
                          <DatePickerWithRange
                            id={`phase-dates-${phase.phaseNumber}-${index}`}
                            value={getPhaseRangeDates(phase)}
                            onChange={(dateRange) => updatePhaseDates(index, dateRange)}
                            disabled={isSubmitting}
                            disablePastDates={false}
                            className={`w-full ${validatePhaseDates(index) ? 'border-red-300 focus:border-red-500' : ''}`}
                          />
                          {/* Erro de validação do formulário */}
                          {(errors.phases?.[index]?.startDate || errors.phases?.[index]?.endDate) && (
                            <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                              <X className="h-3 w-3" />
                              {errors.phases?.[index]?.startDate?.message || errors.phases?.[index]?.endDate?.message}
                            </p>
                          )}
                          {/* Erro de validação em tempo real */}
                          {validatePhaseDates(index) && (
                            <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                              <X className="h-3 w-3" />
                              {validatePhaseDates(index)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Critérios de Triagem */}
        <Card className="border border-slate-200 shadow-sm">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-slate-800">
                  <Users className="h-5 w-5 text-slate-600" />
                  Critérios de Triagem
                </CardTitle>
                <CardDescription className="text-slate-600 mt-1">
                  Configure os critérios para avaliação dos projetos (opcional)
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addEvaluationCriteria}
                disabled={isSubmitting}
                className="border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Adicionar
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {errors.evaluationCriteria && (
              <p className="mb-4 text-sm text-red-500 flex items-center gap-1">
                <X className="h-3 w-3" />
                {errors.evaluationCriteria.message}
              </p>
            )}

            {evaluationCriteria.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <Target className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">Nenhum critério configurado</p>
                <p className="text-sm mt-1">Adicione critérios para uma avaliação mais estruturada</p>
              </div>
            ) : (
              <div className="space-y-4">
                {evaluationCriteria.map((criteria, index) => (
                  <div 
                    key={index} 
                    className="border border-slate-200 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-slate-800 flex items-center gap-2">
                        <div className="w-6 h-6 bg-slate-100 text-slate-600 rounded flex items-center justify-center text-xs font-medium">
                          {index + 1}
                        </div>
                        Critério {index + 1}
                      </h4>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeEvaluationCriteria(index)}
                        disabled={isSubmitting}
                        className="text-slate-400 hover:text-red-500 hover:bg-red-50"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Controller
                        name={`evaluationCriteria.${index}.name`}
                        control={control}
                        render={({ field }) => (
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                              Nome do critério
                            </label>
                            <Input 
                              {...field} 
                              placeholder="Ex: Inovação" 
                              disabled={isSubmitting}
                              className="border-slate-300 focus:border-slate-400"
                            />
                            {errors.evaluationCriteria?.[index]?.name && (
                              <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                                <X className="h-3 w-3" />
                                {errors.evaluationCriteria[index].name.message}
                              </p>
                            )}
                          </div>
                        )}
                      />
                      
                      <Controller
                        name={`evaluationCriteria.${index}.description`}
                        control={control}
                        render={({ field }) => (
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                              Descrição
                            </label>
                            <Input 
                              {...field} 
                              placeholder="Ex: Originalidade e criatividade da solução" 
                              disabled={isSubmitting}
                              className="border-slate-300 focus:border-slate-400"
                            />
                            {errors.evaluationCriteria?.[index]?.description && (
                              <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                                <X className="h-3 w-3" />
                                {errors.evaluationCriteria[index].description.message}
                              </p>
                            )}
                          </div>
                        )}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end pt-4">
          <Button 
            type="submit" 
            disabled={isSubmitting || hasDateValidationErrors()} 
            className="px-8 py-3 bg-slate-800 hover:bg-slate-900 text-white transition-colors disabled:opacity-50"
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {loadingButtonText}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                {submitButtonText}
              </div>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
