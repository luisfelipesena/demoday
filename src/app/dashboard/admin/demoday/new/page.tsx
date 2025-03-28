"use client"

import { DemodayForm } from "@/components/dashboard/DemodayForm"
import { Skeleton } from "@/components/ui/skeleton"
import { useSubmitCriteriaBatch } from "@/hooks/useCriteria"
import { Phase, useCreateDemoday } from "@/hooks/useDemoday"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function NewDemodayPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const { mutate: createDemoday, isPending: isCreatingDemoday } = useCreateDemoday()
  const { mutate: submitCriteria, isPending: isSubmittingCriteria } = useSubmitCriteriaBatch()

  // Form validation error
  const [error, setError] = useState<string | null>(null)

  // Registration and evaluation criteria
  const [registrationCriteria, setRegistrationCriteria] = useState<{ name: string; description: string }[]>([
    { name: "", description: "" },
  ])
  const [evaluationCriteria, setEvaluationCriteria] = useState<{ name: string; description: string }[]>([
    { name: "", description: "" },
  ])

  // Check if user is admin
  const isAdmin = session?.user?.role === "admin"

  // Redirect to login if not authenticated
  if (status === "unauthenticated") {
    router.push("/login")
    return null
  }

  // Show loading during session check
  if (status === "loading") {
    return (
      <div className="mx-auto max-w-5xl p-6">
        <div className="mb-6 flex items-center justify-between">
          <Skeleton className="h-10 w-56" />
          <Skeleton className="h-9 w-24" />
        </div>

        <div className="space-y-8">
          {/* Nome do Demoday */}
          <div className="space-y-4 rounded-lg border p-6 shadow-sm">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-10 w-full" />
          </div>

          {/* Fases */}
          <div className="space-y-6 rounded-lg border p-6 shadow-sm">
            <Skeleton className="h-7 w-32" />
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-4 rounded-lg border p-4 shadow-sm">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-full" />
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Skeleton className="h-4 w-16 mb-2" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                    <div>
                      <Skeleton className="h-4 w-16 mb-2" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Critérios */}
          <div className="space-y-4 rounded-lg border p-6 shadow-sm">
            <Skeleton className="h-7 w-48" />
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="flex space-x-2">
                  <div className="flex-grow space-y-2">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                  <Skeleton className="mt-2 h-10 w-10 rounded-full" />
                </div>
              ))}
            </div>
            <Skeleton className="h-10 w-full" />
          </div>

          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    )
  }

  // Redirect to dashboard if not admin
  if (!isAdmin) {
    router.push("/dashboard")
    return null
  }

  const onSubmit = (data: { name: string; phases: Phase[] }) => {
    setError(null)

    // Filter out empty criteria
    const validRegistrationCriteria = registrationCriteria.filter((c) => c.name.trim() && c.description.trim())
    const validEvaluationCriteria = evaluationCriteria.filter((c) => c.name.trim() && c.description.trim())

    if (validRegistrationCriteria.length === 0) {
      setError("Adicione pelo menos um critério de inscrição")
      return
    }

    // Create the demoday
    createDemoday(data, {
      onSuccess: (createdDemoday) => {
        console.log("Demoday criado com sucesso:", createdDemoday)

        // Now submit the criteria
        submitCriteria(
          {
            demodayId: createdDemoday.id,
            registration: validRegistrationCriteria,
            evaluation: validEvaluationCriteria,
          },
          {
            onSuccess: () => {
              console.log("Critérios adicionados com sucesso")
              router.push("/dashboard/admin/demoday")
            },
            onError: (error) => {
              console.error("Erro ao adicionar critérios:", error)
              setError(`Demoday criado, mas houve um erro ao adicionar critérios: ${error.message}`)
            },
          }
        )
      },
      onError: (error) => {
        setError(error.message)
      },
    })
  }

  // Helper functions for criteria
  const updateRegistrationCriteria = (
    index: number,
    field: keyof { name: string; description: string },
    value: string
  ) => {
    const updated = [...registrationCriteria]
    updated[index] = {
      ...updated[index],
      [field]: value,
    } as { name: string; description: string }
    setRegistrationCriteria(updated)
  }

  const updateEvaluationCriteria = (
    index: number,
    field: keyof { name: string; description: string },
    value: string
  ) => {
    const updated = [...evaluationCriteria]
    updated[index] = {
      ...updated[index],
      [field]: value,
    } as { name: string; description: string }
    setEvaluationCriteria(updated)
  }

  const addRegistrationCriteria = () => {
    setRegistrationCriteria([...registrationCriteria, { name: "", description: "" }])
  }

  const addEvaluationCriteria = () => {
    setEvaluationCriteria([...evaluationCriteria, { name: "", description: "" }])
  }

  const removeRegistrationCriteria = (index: number) => {
    if (registrationCriteria.length > 1) {
      setRegistrationCriteria(registrationCriteria.filter((_, i) => i !== index))
    }
  }

  const removeEvaluationCriteria = (index: number) => {
    if (evaluationCriteria.length > 1) {
      setEvaluationCriteria(evaluationCriteria.filter((_, i) => i !== index))
    }
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
