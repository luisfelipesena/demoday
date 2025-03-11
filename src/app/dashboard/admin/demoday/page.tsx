"use client"

import { Button } from "@/components/ui/button"
import { useDemodays, useCreateDemoday } from "@/hooks/useDemoday"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"

export default function DemodayListPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const { data: demodays, isLoading, error } = useDemodays()
  const createDemoday = useCreateDemoday()

  // Check if user is admin
  const isAdmin = session?.user?.role === "admin"

  // Redirect to login if not authenticated
  if (status === "unauthenticated") {
    router.push("/login")
    return null
  }

  // Show loading during session check
  if (status === "loading" || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Carregando...</h1>
        </div>
      </div>
    )
  }

  // Redirect to dashboard if not admin
  if (!isAdmin) {
    router.push("/dashboard")
    return null
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date)
  }

  return (
    <div className="mx-auto max-w-7xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Gerenciar Demodays</h1>
        <Link href="/dashboard/admin/demoday/new">
          <Button className="bg-blue-600 text-white hover:bg-blue-700">Criar Novo Demoday</Button>
        </Link>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-100 p-4 text-red-700">
          {error instanceof Error ? error.message : "Erro ao carregar demodays"}
        </div>
      )}

      {demodays && demodays.length === 0 ? (
        <div className="rounded-lg border p-8 text-center">
          <p className="text-lg text-gray-600">Nenhum demoday encontrado. Crie um novo para começar.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  Nome
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  Data de Criação
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  Última Atualização
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Ações</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {demodays?.map((demoday) => (
                <tr key={demoday.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{demoday.name}</div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="text-sm text-gray-500">{formatDate(demoday.createdAt)}</div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="text-sm text-gray-500">{formatDate(demoday.updatedAt)}</div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                    <Link href={`/dashboard/admin/demoday/${demoday.id}`} className="text-blue-600 hover:text-blue-900">
                      Detalhes
                    </Link>
                    <span className="mx-2 text-gray-300">|</span>
                    <Link
                      href={`/dashboard/admin/demoday/${demoday.id}/edit`}
                      className="text-green-600 hover:text-green-900"
                    >
                      Editar
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
