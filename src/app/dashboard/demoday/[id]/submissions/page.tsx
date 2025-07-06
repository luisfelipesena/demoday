"use client"

import React, { use, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "@/lib/auth-client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useDemodayDetails } from "@/hooks/useDemoday"
import { useAllSubmissions, useUserSubmissions } from "@/hooks/useSubmitWork"
import { AlertCircle, ArrowLeft, ExternalLink, FileText, Edit3, Search, Filter } from "lucide-react"
import Link from "next/link"
import { formatDate, isInSubmissionPhase } from "@/utils/date-utils"

interface DemodaySubmissionsProps {
  params: Promise<{ id: string }>
}

export default function DemodaySubmissionsPage({ params }: DemodaySubmissionsProps) {
  // Desembrulhar (unwrap) o objeto params usando React.use
  const resolvedParams = use(params)
  const demodayId = resolvedParams.id
  
  const router = useRouter()
  const { data: session, isPending } = useSession()
  const { data: demoday, isLoading: isLoadingDemoday } = useDemodayDetails(demodayId)
  const { data: userSubmissions = [], isLoading: isLoadingUserSubmissions } = useUserSubmissions(demodayId)
  const isAdmin = session?.user?.role === "admin"
  const isProfessor = session?.user?.role === "professor"
  
  // Buscar todas as submissões apenas para admin/professor
  const { data: allSubmissions = [], isLoading: isLoadingAllSubmissions } = useAllSubmissions(
    isAdmin || isProfessor ? demodayId : null
  )
  
  const isLoading = isLoadingDemoday || isLoadingUserSubmissions || (isAdmin && isLoadingAllSubmissions)

  // Estados para filtros e pesquisa
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")

  // Determinar quais submissões mostrar com base no papel do usuário
  const baseSubmissions = isAdmin || isProfessor ? allSubmissions : userSubmissions

  // Aplicar filtros e pesquisa
  const filteredSubmissions = useMemo(() => {
    let filtered = [...baseSubmissions]

    // Filtro de pesquisa
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(submission => 
        submission.project?.title?.toLowerCase().includes(query) ||
        submission.project?.description?.toLowerCase().includes(query) ||
        submission.project?.authors?.toLowerCase().includes(query)
      )
    }

    // Filtro de status
    if (statusFilter !== "all") {
      filtered = filtered.filter(submission => submission.status === statusFilter)
    }

    // Filtro de tipo
    if (typeFilter !== "all") {
      filtered = filtered.filter(submission => submission.project?.type === typeFilter)
    }

    return filtered
  }, [baseSubmissions, searchQuery, statusFilter, typeFilter])

  // Verificar autenticação
  if (!isPending && !session) {
    router.push("/login")
    return null
  }

  // Mostrar loading durante verificação da sessão
  if (isPending || isLoading) {
    return (
      <div className="w-full space-y-6 p-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-9 w-24" />
        </div>
        <Skeleton className="h-12 w-full" />
        <div className="space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    )
  }

  // Verificar se o demoday existe
  if (!demoday) {
    return (
      <div className="w-full p-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-amber-600">DemoDay não encontrado</CardTitle>
            <CardDescription>
              Não foi possível encontrar o DemoDay especificado.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center p-6">
            <AlertCircle className="h-16 w-16 text-amber-500 mb-4" />
          </CardContent>
        </Card>
      </div>
    )
  }

  // Renderizar a badge de status
  const renderStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string, className: string }> = {
      submitted: { label: "Submetido", className: "bg-gray-100 text-gray-700" },
      approved: { label: "Aprovado", className: "bg-green-100 text-green-700" },
      rejected: { label: "Rejeitado", className: "bg-red-100 text-red-700" },
      finalist: { label: "Finalista", className: "bg-blue-100 text-blue-700" },
      winner: { label: "Vencedor", className: "bg-yellow-100 text-yellow-700" },
    }
    
    const statusInfo = statusMap[status] || { label: "Desconhecido", className: "bg-gray-100 text-gray-700" }
    
    return (
      <Badge className={statusInfo.className}>
        {statusInfo.label}
      </Badge>
    )
  }

  // Formatação de data e hora mais detalhada
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit", 
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  // Obter tipos únicos para o filtro
  const uniqueTypes = [...new Set(baseSubmissions.map((s: any) => s.project?.type).filter(Boolean))] as string[]

  return (
    <div className="w-full space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Submissões - {demoday.name}</h1>
          <p className="text-muted-foreground">
            {isAdmin || isProfessor 
              ? "Todos os trabalhos submetidos para este DemoDay" 
              : "Seus trabalhos submetidos para este DemoDay"}
          </p>
        </div>
        <div className="flex gap-2">
          {demoday.active && (
            <Link href={`/dashboard/demoday/${demoday.id}/submit`}>
              <Button className="bg-blue-600 hover:bg-blue-700">Submeter Trabalho</Button>
            </Link>
          )}
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </div>
      </div>

      {/* Seção de Filtros e Pesquisa */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros e Pesquisa
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Campo de Pesquisa */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Pesquisar por título, descrição ou autores..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filtro de Status */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="submitted">Submetido</SelectItem>
                <SelectItem value="approved">Aprovado</SelectItem>
                <SelectItem value="rejected">Rejeitado</SelectItem>
                <SelectItem value="finalist">Finalista</SelectItem>
                <SelectItem value="winner">Vencedor</SelectItem>
              </SelectContent>
            </Select>

            {/* Filtro de Tipo */}
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                {uniqueTypes.map((type: string) => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Contador de resultados */}
          <div className="text-sm text-muted-foreground">
            Mostrando {filteredSubmissions.length} de {baseSubmissions.length} submissões
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Submissões */}
      {filteredSubmissions.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>
              {searchQuery || statusFilter !== "all" || typeFilter !== "all" 
                ? "Nenhuma submissão encontrada" 
                : "Sem submissões"}
            </CardTitle>
            <CardDescription>
              {searchQuery || statusFilter !== "all" || typeFilter !== "all"
                ? "Tente ajustar os filtros para encontrar submissões."
                : isAdmin || isProfessor 
                  ? "Não há trabalhos submetidos para este DemoDay ainda" 
                  : "Você ainda não submeteu trabalhos para este DemoDay"}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center p-6">
            <FileText className="h-16 w-16 text-muted-foreground mb-4" />
            {!searchQuery && statusFilter === "all" && typeFilter === "all" && (
              <>
                <p className="mb-4 text-center text-muted-foreground">
                  {demoday.active 
                    ? "Submeta seu trabalho para participar do concurso" 
                    : "Este DemoDay está encerrado e não aceita novas submissões"}
                </p>
                {demoday.active && (
                  <Link href={`/dashboard/demoday/${demoday.id}/submit`}>
                    <Button>Submeter Trabalho</Button>
                  </Link>
                )}
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Autores</TableHead>
                    <TableHead>Data/Hora Submissão</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubmissions.map((submission: any) => (
                    <TableRow key={submission.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">
                        <div className="max-w-xs">
                          <div className="font-semibold text-gray-900 truncate">
                            {submission.project.title}
                          </div>
                          <div className="text-sm text-gray-500 line-clamp-2 mt-1">
                            {submission.project.description}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{submission.project.type}</Badge>
                      </TableCell>
                      <TableCell>
                        {renderStatusBadge(submission.status)}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-600">
                          {submission.project.authors || 'Não informado'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-600">
                          {formatDateTime(submission.createdAt)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {/* Botão Editar - só aparece para o dono do projeto e durante período de submissão */}
                          {submission.project.userId === session?.user?.id && 
                           demoday.active && 
                           isInSubmissionPhase(demoday) && (
                            <Link href={`/dashboard/projects/${submission.project.id}/edit`}>
                              <Button size="sm" variant="outline" className="border-blue-500 text-blue-600 hover:bg-blue-50">
                                <Edit3 className="h-3 w-3" />
                              </Button>
                            </Link>
                          )}
                          {submission.project.videoUrl && (
                            <Link href={submission.project.videoUrl} target="_blank" rel="noopener noreferrer">
                              <Button size="sm" variant="outline" title="Ver Vídeo">
                                <ExternalLink className="h-3 w-3" />
                              </Button>
                            </Link>
                          )}
                          {submission.project.repositoryUrl && (
                            <Link href={submission.project.repositoryUrl} target="_blank" rel="noopener noreferrer">
                              <Button size="sm" variant="outline" title="Ver Repositório">
                                <FileText className="h-3 w-3" />
                              </Button>
                            </Link>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 