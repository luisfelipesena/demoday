"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import { useDemodays, useUpdateDemodayStatus } from "@/hooks/useDemoday"
import { DotsHorizontalIcon } from "@radix-ui/react-icons"
import { CalendarIcon, EyeIcon, PlusIcon, SettingsIcon } from "lucide-react"
import Link from "next/link"


export default function DemodayListPage() {
  const { data: demodays, isLoading, error } = useDemodays()
  const updateStatus = useUpdateDemodayStatus()
  const { toast } = useToast()


  // Show loading during session check
  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl p-6">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-5 w-16" />
                </div>
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
                <div className="flex items-center gap-2 mt-4">
                  <Skeleton className="h-9 w-24" />
                  <Skeleton className="h-9 w-8" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
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

  const handleStatusChange = async (id: string, newStatus: "active" | "finished" | "canceled") => {
    try {
      await updateStatus.mutateAsync({ id, status: newStatus })
      toast({
        title: "Status atualizado",
        description: `O Demoday foi ${
          newStatus === "active" ? "ativado" : newStatus === "finished" ? "finalizado" : "excluído"
        } com sucesso.`,
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
    return demodays?.find((demoday) => demoday.active)
  }

  const activeDemoday = getActiveDemoday()
  const hasActiveDemoday = !!activeDemoday

  const renderStatusBadge = (active: boolean, status: string) => {
    if (active) {
      return (
        <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-emerald-200">
          Ativo
        </Badge>
      )
    }

    if (status === "finished") {
      return (
        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200">
          Finalizado
        </Badge>
      )
    }

    return (
      <Badge className="bg-gray-100 text-gray-600 hover:bg-gray-200 border-gray-200">
        Inativo
      </Badge>
    )
  }

  return (
    <div className="mx-auto max-w-7xl p-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Gerenciar Demodays</h1>
        </div>
        <Link href="/dashboard/admin/demoday/new">
          <Button className="bg-blue-600 text-white hover:bg-blue-700 shadow-sm">
            <PlusIcon className="h-4 w-4 mr-2" />
            Criar Novo
          </Button>
        </Link>
      </div>

      {error && (
        <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4">
          <div className="text-red-800 text-sm">
            {error instanceof Error ? error.message : "Erro ao carregar demodays"}
          </div>
        </div>
      )}

      {demodays && demodays.length === 0 ? (
        <Card className="border-dashed border-2 border-gray-300">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="rounded-full bg-gray-100 p-3 mb-4">
              <CalendarIcon className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum Demoday encontrado</h3>
            <p className="text-gray-600 text-center max-w-sm mb-6">
              Crie seu primeiro Demoday para começar a organizar eventos e receber submissões.
            </p>
            <Link href="/dashboard/admin/demoday/new">
              <Button className="bg-blue-600 text-white hover:bg-blue-700">
                <PlusIcon className="h-4 w-4 mr-2" />
                Criar Primeiro Demoday
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {demodays?.map((demoday) => (
            <Card 
              key={demoday.id} 
              className={`overflow-hidden transition-all duration-200 hover:shadow-lg ${
                demoday.active 
                  ? "ring-2 ring-emerald-100 bg-emerald-50/30" 
                  : "hover:shadow-md"
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-semibold text-gray-900 truncate">
                      {demoday.name}
                    </CardTitle>
                    <CardDescription className="text-sm text-gray-600 mt-1">
                      Criado em {formatDate(demoday.createdAt)}
                    </CardDescription>
                  </div>
                  {renderStatusBadge(demoday.active, demoday.status)}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <CalendarIcon className="h-4 w-4 mr-2 text-gray-400" />
                    Atualizado em {formatDate(demoday.updatedAt)}
                  </div>
                  
                  <div className="flex items-center gap-2 pt-2">
                    <Link href={`/dashboard/admin/demoday/${demoday.id}`} className="flex-1">
                      <Button 
                        variant="outline" 
                        className="w-full border-gray-200 hover:bg-gray-50 text-gray-700"
                      >
                        <EyeIcon className="h-4 w-4 mr-2" />
                        Ver Detalhes
                      </Button>
                    </Link>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-9 w-9 p-0 border-gray-200 hover:bg-gray-50"
                        >
                          <span className="sr-only">Mais opções</span>
                          <DotsHorizontalIcon className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/admin/demoday/${demoday.id}/edit`}>
                            <SettingsIcon className="h-4 w-4 mr-2" />
                            Editar
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {!demoday.active && demoday.status !== "finished" && (
                          <DropdownMenuItem onClick={() => handleStatusChange(demoday.id, "active")}>
                            Ativar
                          </DropdownMenuItem>
                        )}
                        {demoday.active && (
                          <DropdownMenuItem onClick={() => handleStatusChange(demoday.id, "finished")}>
                            Finalizar
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => handleStatusChange(demoday.id, "canceled")}
                          className="text-red-600 focus:text-red-600"
                        >
                          Apagar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
