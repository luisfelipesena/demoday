"use client"

import { DemodayForm } from "@/components/dashboard/DemodayForm"
import { DemodayFormData } from "@/components/dashboard/types"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useCriteria, useUpdateCriteriaBatch } from "@/hooks/useCriteria"
import { useDemodayDetails, useUpdateDemoday } from "@/hooks/useDemoday"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { use, useState } from "react"

interface DemodayPageProps {
  params: Promise<{ id: string }>
}

// Define an error type
interface ApiError {
  message: string
}

export default function EditDemodayPage({ params }: DemodayPageProps) {
  const resolvedParams = use(params)
  const router = useRouter()
  const demodayId = resolvedParams.id
  const { data: demoday, isLoading: loadingDemoday, error: queryError } = useDemodayDetails(demodayId)
  const { data: criteriaData, isLoading: loadingCriteria } = useCriteria(demodayId)
  const [error, setError] = useState<string | null>(queryError?.message || null)
  const { mutate: updateDemoday, isPending: isUpdating } = useUpdateDemoday()
  const { mutate: updateCriteria, isPending: isUpdatingCriteria } = useUpdateCriteriaBatch()

  // Show loading during session check
  if (loadingDemoday || loadingCriteria) {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-6 flex items-center justify-between">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-9 w-24" />
        </div>
        <div className="grid grid-cols-1 gap-6">
          <Skeleton className="h-96 w-full rounded-lg" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <h1 className="text-2xl font-bold text-red-700 mb-2">Erro</h1>
          <p className="text-red-600">{error}</p>
          <Button onClick={() => router.push("/dashboard/admin/demoday")} className="mt-4 bg-red-600 hover:bg-red-700">
            Voltar ao Dashboard
          </Button>
        </div>
      </div>
    )
  }

  if (!demoday) {
    return (
      <div className="container mx-auto p-6">
        <div className="rounded-lg border p-6 text-center">
          <h1 className="text-2xl font-bold mb-2">Demoday não encontrado</h1>
          <p className="text-gray-600">Não foi possível encontrar o Demoday solicitado.</p>
          <Button onClick={() => router.push("/dashboard/admin/demoday")} className="mt-4">
            Voltar ao Dashboard
          </Button>
        </div>
      </div>
    )
  }

  const onSubmit = (data: DemodayFormData) => {
    setError(null)

    // Filter out empty criteria and select only necessary fields
    const validRegistrationCriteria = data.registrationCriteria
      .filter((c) => c.name.trim() && c.description.trim())
      .map(({ name, description }) => ({
        name,
        description,
      }))

    const validEvaluationCriteria = data.evaluationCriteria
      .filter((c) => c.name.trim() && c.description.trim())
      .map(({ name, description }) => ({
        name,
        description,
      }))

    if (validRegistrationCriteria.length === 0) {
      setError("Adicione pelo menos um critério de inscrição")
      return
    }

    // Update demoday name and phases
    updateDemoday(
      {
        id: demoday.id,
        name: data.name,
        phases: data.phases,
      },
      {
        onSuccess: () => {
          // Now update the criteria
          updateCriteria(
            {
              demodayId: demoday.id,
              registration: validRegistrationCriteria,
              evaluation: validEvaluationCriteria,
            },
            {
              onSuccess: () => {
                router.push("/dashboard/admin/demoday")
              },
              onError: (error: ApiError) => {
                setError(`Demoday atualizado, mas houve um erro ao atualizar critérios: ${error.message}`)
              },
            }
          )
        },
        onError: (error: ApiError) => {
          setError(error.message)
        },
      }
    )
  }

  // Prepare initial data for the form
  const initialData = {
    name: demoday.name,
    phases: demoday.phases.map((phase) => ({
      name: phase.name,
      description: phase.description,
      phaseNumber: phase.phaseNumber,
      startDate: phase.startDate,
      endDate: phase.endDate,
    })),
    registrationCriteria:
      criteriaData?.registration?.map((c) => ({
        name: c.name,
        description: c.description,
        demoday_id: demodayId,
      })) || [],
    evaluationCriteria:
      criteriaData?.evaluation?.map((c) => ({
        name: c.name,
        description: c.description,
        demoday_id: demodayId,
      })) || [],
  }

  // Determine if form is submitting
  const isPending = isUpdating || isUpdatingCriteria

  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Editar Demoday</h1>
        <Link
          href={`/dashboard/admin/demoday/${demoday.id}`}
          className="rounded-md bg-gray-200 px-4 py-2 text-gray-800 hover:bg-gray-300"
        >
          Voltar
        </Link>
      </div>

      <DemodayForm
        initialData={initialData}
        demodayId={demodayId}
        onSubmit={onSubmit}
        isSubmitting={isPending}
        error={error}
        submitButtonText="Salvar Alterações"
        loadingButtonText="Salvando..."
      />
    </div>
  )
}
