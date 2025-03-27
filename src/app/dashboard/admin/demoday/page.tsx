"use client"

import { Button } from "@/components/ui/button"
import { useDemodays, useCreateDemoday, useUpdateDemodayStatus } from "@/hooks/useDemoday"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DotsHorizontalIcon } from "@radix-ui/react-icons"
import { useToast } from "@/components/ui/use-toast"

export default function DemodayListPage() {
  const router = useRouter()
  const { data: session, status: sessionStatus } = useSession()
  const { data: demodays, isLoading, error } = useDemodays()
  const updateStatus = useUpdateDemodayStatus()
  const { toast } = useToast()

  // Check if user is admin
  const isAdmin = session?.user?.role === "admin"

  // Redirect to login if not authenticated
  if (sessionStatus === "unauthenticated") {
    router.push("/login")
    return null
  }

  // Show loading during session check
  if (sessionStatus === "loading" || isLoading) {
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

  const handleStatusChange = async (id: string, newStatus: 'active' | 'finished' | 'canceled') => {
    try {
      await updateStatus.mutateAsync({ id, status: newStatus })
      toast({
        title: "Status atualizado",
        description: `O Demoday foi ${newStatus === 'active' ? 'ativado' : newStatus === 'finished' ? 'finalizado' : 'cancelado'} com sucesso.`,
        variant: "default",
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status do Demoday.",
        variant: "destructive",
      })
    }
  }

  const getActiveDemoday = () => {
    return demodays?.find(demoday => demoday.active)
  }

  const activeDemoday = getActiveDemoday()
  const hasActiveDemoday = !!activeDemoday
  
  const renderStatusBadge = (active: boolean, status: string) => {
    if (active) {
      return <Badge className="bg-green-500 hover:bg-green-600">Ativo</Badge>
    }
    
    if (status === 'finished') {
      return <Badge className="bg-blue-500 hover:bg-blue-600">Finalizado</Badge>
    }
    
    return <Badge className="bg-gray-500 hover:bg-gray-600">Inativo</Badge>
  }

  return (
    <div className="mx-auto max-w-7xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Gerenciar Demodays</h1>
        {!hasActiveDemoday && (
          <Link href="/dashboard/admin/demoday/new">
            <Button className="bg-blue-600 text-white hover:bg-blue-700">Criar Novo Demoday</Button>
          </Link>
        )}
        {hasActiveDemoday && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Existe um Demoday ativo: <strong>{activeDemoday.name}</strong></span>
            <Button 
              variant="outline"
              className="border-blue-500 text-blue-500 hover:bg-blue-50"
              onClick={() => handleStatusChange(activeDemoday.id, 'finished')}
            >
              Finalizar Ativo
            </Button>
            <Link href="/dashboard/admin/demoday/new">
              <Button variant="ghost" className="hover:bg-blue-50">
                Criar Novo
              </Button>
            </Link>
          </div>
        )}
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
                  Status
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
                <tr key={demoday.id} className={demoday.active ? "bg-blue-50 hover:bg-blue-100" : "hover:bg-gray-50"}>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{demoday.name}</div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="text-sm">
                      {renderStatusBadge(demoday.active, demoday.status)}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="text-sm text-gray-500">{formatDate(demoday.createdAt)}</div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="text-sm text-gray-500">{formatDate(demoday.updatedAt)}</div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Abrir menu</span>
                          <DotsHorizontalIcon className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/admin/demoday/${demoday.id}`}>
                            Detalhes
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/admin/demoday/${demoday.id}/edit`}>
                            Editar
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {!demoday.active && (
                          <DropdownMenuItem onClick={() => handleStatusChange(demoday.id, 'active')}>
                            Ativar
                          </DropdownMenuItem>
                        )}
                        {demoday.active && (
                          <DropdownMenuItem onClick={() => handleStatusChange(demoday.id, 'finished')}>
                            Finalizar
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem 
                          onClick={() => handleStatusChange(demoday.id, 'canceled')}
                          className="text-red-600 focus:text-red-600"
                        >
                          Cancelar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
