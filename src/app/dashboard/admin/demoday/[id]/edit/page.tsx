"use client"

import { DemodayForm } from "@/components/dashboard/DemodayForm"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Phase, useDemodayDetails, useUpdateDemoday } from "@/hooks/useDemoday"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { use, useState } from "react"

interface DemodayPageProps {
  params: Promise<{ id: string }>
}

export default function EditDemodayPage({ params }: DemodayPageProps) {
  const resolvedParams = use(params)
  const router = useRouter()
  const { data: session, status } = useSession()
  const demodayId = resolvedParams.id
  const { data: demoday, isLoading: loading, error: queryError } = useDemodayDetails(demodayId)
  const [error, setError] = useState<string | null>(queryError?.message || null)
  const { mutate: updateDemoday, isPending: isUpdating } = useUpdateDemoday()

  // Check if user is admin
  const isAdmin = session?.user?.role === "admin"

  // Redirect to login if not authenticated
  if (status === "unauthenticated") {
    router.push("/login")
    return null
  }

  // Show loading during session check
  if (status === "loading" || loading) {
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

  // Redirect to dashboard if not admin
  if (!isAdmin) {
    router.push("/dashboard")
    return null
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

  const onSubmit = (data: { name: string; phases: Phase[] }) => {
    setError(null)

    updateDemoday(
      {
        id: demoday.id,
        name: data.name,
        phases: data.phases,
      },
      {
        onSuccess: () => {
          router.push("/dashboard/admin/demoday")
        },
        onError: (error) => {
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
  }

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
        onSubmit={onSubmit}
        isSubmitting={isUpdating}
        error={error}
        submitButtonText="Salvar Alterações"
        loadingButtonText="Salvando..."
      />
    </div>
  )
}
