"use client"

import { DemodayForm } from "@/components/dashboard/DemodayForm"
import { DemodayFormData } from "@/components/dashboard/types"
import { useSubmitCriteriaBatch } from "@/hooks/useCriteria"
import { useCreateDemoday } from "@/hooks/useDemoday"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function NewDemodayPage() {
  const router = useRouter()
  const { mutate: createDemoday, isPending: isCreatingDemoday } = useCreateDemoday()
  const { mutate: submitCriteria, isPending: isSubmittingCriteria } = useSubmitCriteriaBatch()

  // Form validation error
  const [error, setError] = useState<string | null>(null)



  const onSubmit = (data: DemodayFormData) => {
    setError(null)

    // Filter out empty criteria
    const validEvaluationCriteria = data.evaluationCriteria.filter((c) => c.name.trim() && c.description.trim())

    // Create the demoday with maxFinalists
    createDemoday(
      { 
        name: data.name, 
        phases: data.phases, 
        maxFinalists: data.maxFinalists 
      },
      {
        onSuccess: async (createdDemoday) => {
          try {
            // Se houver critérios de avaliação para submeter
            if (validEvaluationCriteria.length > 0) {
              const evaluationForAPI = validEvaluationCriteria.map(({ name, description }) => ({
                name,
                description,
              }))

              // Submit evaluation criteria
              submitCriteria(
                {
                  demodayId: createdDemoday.id,
                  registration: [], // Vazio agora
                  evaluation: evaluationForAPI,
                },
                {
                  onSuccess: () => {
                    console.log("Critérios de avaliação adicionados com sucesso")
                    router.push("/dashboard/admin/demoday")
                  },
                  onError: (error) => {
                    console.error("Erro ao adicionar critérios:", error)
                    setError(`Demoday criado, mas houve um erro ao adicionar critérios: ${error.message}`)
                  },
                }
              )
            } else {
              // Ir direto para a dashboard se não houver critérios
              router.push("/dashboard/admin/demoday")
            }
          } catch (error) {
            console.error("Erro no processo de criação:", error);
            setError("Erro durante a criação do demoday");
          }
        },
        onError: (error) => {
          setError(error.message)
        },
      }
    )
  }

  // Determine if form is submitting
  const isPending = isCreatingDemoday || isSubmittingCriteria

  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Criar novo demoday</h1>
        <Link
          href="/dashboard/admin/demoday"
          className="rounded-md bg-gray-200 px-4 py-2 text-gray-800 hover:bg-gray-300"
        >
          Voltar
        </Link>
      </div>

      <DemodayForm
        onSubmit={onSubmit}
        isSubmitting={isPending}
        error={error}
        submitButtonText="Criar Demoday"
        loadingButtonText="Criando..."
      />
    </div>
  )
}
