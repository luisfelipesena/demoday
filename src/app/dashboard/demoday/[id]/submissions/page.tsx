"use client"

import React, { use, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "@/lib/auth-client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePicker } from "@/components/ui/simple-datepicker"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useDemodayDetails } from "@/hooks/useDemoday"
import { useAllSubmissions, useUserSubmissions } from "@/hooks/useSubmitWork"
import { AlertCircle, ArrowLeft, ExternalLink, FileText, Edit3, Search, Filter, ArrowUpDown, ArrowUp, ArrowDown, Download } from "lucide-react"
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
  const [dateFromFilter, setDateFromFilter] = useState<Date | undefined>(undefined)
  const [dateToFilter, setDateToFilter] = useState<Date | undefined>(undefined)
  const [sortBy, setSortBy] = useState<"title" | "type" | "status" | "date">("date")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

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

    // Filtro de data
    if (dateFromFilter) {
      filtered = filtered.filter(submission => {
        const submissionDate = new Date(submission.createdAt)
        return submissionDate >= dateFromFilter
      })
    }

    if (dateToFilter) {
      filtered = filtered.filter(submission => {
        const submissionDate = new Date(submission.createdAt)
        // Adicionar 23:59:59 ao final do dia para incluir todo o dia
        const endOfDay = new Date(dateToFilter)
        endOfDay.setHours(23, 59, 59, 999)
        return submissionDate <= endOfDay
      })
    }

    // Ordenação
    filtered.sort((a, b) => {
      let aValue: string | number | Date
      let bValue: string | number | Date

      switch (sortBy) {
        case "title":
          aValue = a.project?.title?.toLowerCase() || ""
          bValue = b.project?.title?.toLowerCase() || ""
          break
        case "type":
          aValue = a.project?.type?.toLowerCase() || ""
          bValue = b.project?.type?.toLowerCase() || ""
          break
        case "status":
          aValue = a.status?.toLowerCase() || ""
          bValue = b.status?.toLowerCase() || ""
          break
        case "date":
          aValue = new Date(a.createdAt)
          bValue = new Date(b.createdAt)
          break
        default:
          aValue = new Date(a.createdAt)
          bValue = new Date(b.createdAt)
      }

      if (sortBy === "date") {
        return sortOrder === "asc" 
          ? (aValue as Date).getTime() - (bValue as Date).getTime()
          : (bValue as Date).getTime() - (aValue as Date).getTime()
      }

      if (sortOrder === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })

    return filtered
  }, [baseSubmissions, searchQuery, statusFilter, typeFilter, dateFromFilter, dateToFilter, sortBy, sortOrder])

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

  // Função para exportar dados para CSV
  const exportToCSV = () => {
    const csvHeaders = [
      "Título",
      "Categoria",
      "Status", 
      "Autores",
      "Data/Hora Submissão",
      "Descrição",
      "Ano de Desenvolvimento",
      "Email de Contato",
      "Telefone",
      "Orientador",
      "URL do Vídeo",
      "URL do Repositório"
    ]

    const csvData = filteredSubmissions.map(submission => [
      submission.project?.title || "",
      submission.project?.type || "",
      submission.status || "",
      submission.project?.authors || "",
      formatDateTime(submission.createdAt),
      submission.project?.description?.replace(/"/g, '""') || "",
      submission.project?.developmentYear || "",
      submission.project?.contactEmail || "",
      submission.project?.contactPhone || "",
      submission.project?.advisorName || "",
      submission.project?.videoUrl || "",
      submission.project?.repositoryUrl || ""
    ])

    const csvContent = [
      csvHeaders.join(","),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `submissoes_${demoday?.name || 'demoday'}_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="w-full space-y-6 p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Submissões - {demoday.name}</h1>
          <p className="text-muted-foreground">
            {isAdmin || isProfessor 
              ? "Todos os trabalhos submetidos para este DemoDay" 
              : "Seus trabalhos submetidos para este DemoDay"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {filteredSubmissions.length > 0 && (
            <Button variant="outline" onClick={exportToCSV}>
              <Download className="mr-2 h-4 w-4" />
              Exportar CSV
            </Button>
          )}
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
          {/* Primeira linha de filtros */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Campo de Pesquisa */}
            <div className="relative md:col-span-2 lg:col-span-1">
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
                <SelectValue placeholder="Filtrar por categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                {uniqueTypes.map((type: string) => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Segunda linha - Filtros de data */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Data Inicial */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Data inicial</label>
              <DatePicker
                id="dateFrom"
                value={dateFromFilter}
                onChange={setDateFromFilter}
                placeholder="Selecionar data inicial"
                className="w-full"
              />
            </div>

            {/* Data Final */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Data final</label>
              <DatePicker
                id="dateTo"
                value={dateToFilter}
                onChange={setDateToFilter}
                placeholder="Selecionar data final"
                className="w-full"
              />
            </div>

            {/* Botão Limpar Filtros */}
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery("")
                  setStatusFilter("all")
                  setTypeFilter("all")
                  setDateFromFilter(undefined)
                  setDateToFilter(undefined)
                  setSortBy("date")
                  setSortOrder("desc")
                }}
                className="w-full"
              >
                Limpar Filtros
              </Button>
            </div>
          </div>

          {/* Terceira linha - Ordenação */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Ordenar por */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Ordenar por</label>
              <Select value={sortBy} onValueChange={(value: "title" | "type" | "status" | "date") => setSortBy(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Data de submissão</SelectItem>
                  <SelectItem value="title">Título</SelectItem>
                  <SelectItem value="type">Categoria</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Direção da ordenação */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Direção</label>
              <div className="flex gap-2">
                <Button
                  variant={sortOrder === "desc" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSortOrder("desc")}
                  className="flex-1"
                >
                  <ArrowDown className="h-4 w-4 mr-2" />
                  {sortBy === "date" ? "Mais recente" : "Z → A"}
                </Button>
                <Button
                  variant={sortOrder === "asc" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSortOrder("asc")}
                  className="flex-1"
                >
                  <ArrowUp className="h-4 w-4 mr-2" />
                  {sortBy === "date" ? "Mais antigo" : "A → Z"}
                </Button>
              </div>
            </div>
          </div>

          {/* Contador de resultados e resumo dos filtros */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-2 border-t">
            <div className="text-sm text-muted-foreground">
              Mostrando {filteredSubmissions.length} de {baseSubmissions.length} submissões
            </div>
            
            {/* Resumo dos filtros ativos */}
            <div className="flex flex-wrap gap-2">
              {searchQuery && (
                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                  Busca: &quot;{searchQuery}&quot;
                </Badge>
              )}
              {statusFilter !== "all" && (
                <Badge variant="outline" className="bg-green-50 text-green-700">
                  Status: {statusFilter}
                </Badge>
              )}
              {typeFilter !== "all" && (
                <Badge variant="outline" className="bg-purple-50 text-purple-700">
                  Categoria: {typeFilter}
                </Badge>
              )}
              {dateFromFilter && (
                <Badge variant="outline" className="bg-orange-50 text-orange-700">
                  A partir de: {dateFromFilter.toLocaleDateString("pt-BR")}
                </Badge>
              )}
              {dateToFilter && (
                <Badge variant="outline" className="bg-orange-50 text-orange-700">
                  Até: {dateToFilter.toLocaleDateString("pt-BR")}
                </Badge>
              )}
              {(sortBy !== "date" || sortOrder !== "desc") && (
                <Badge variant="outline" className="bg-gray-50 text-gray-700">
                  Ordenação: {sortBy === "date" ? "Data" : sortBy === "title" ? "Título" : sortBy === "type" ? "Categoria" : "Status"} 
                  {sortOrder === "desc" ? " ↓" : " ↑"}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Submissões */}
      {filteredSubmissions.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>
              {searchQuery || statusFilter !== "all" || typeFilter !== "all" || dateFromFilter || dateToFilter
                ? "Nenhuma submissão encontrada" 
                : "Sem submissões"}
            </CardTitle>
            <CardDescription>
              {searchQuery || statusFilter !== "all" || typeFilter !== "all" || dateFromFilter || dateToFilter
                ? "Tente ajustar os filtros para encontrar submissões."
                : isAdmin || isProfessor 
                ? "Não há trabalhos submetidos para este DemoDay ainda" 
                : "Você ainda não submeteu trabalhos para este DemoDay"}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center p-6">
            <FileText className="h-16 w-16 text-muted-foreground mb-4" />
            {!searchQuery && statusFilter === "all" && typeFilter === "all" && !dateFromFilter && !dateToFilter ? (
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
            ) : (
              <>
                <p className="mb-4 text-center text-muted-foreground">
                  Nenhuma submissão corresponde aos filtros aplicados.
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchQuery("")
                    setStatusFilter("all")
                    setTypeFilter("all")
                    setDateFromFilter(undefined)
                    setDateToFilter(undefined)
                    setSortBy("date")
                    setSortOrder("desc")
                  }}
                >
                  Limpar Todos os Filtros
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table className="min-w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead className="relative">
                      Título
                      {sortBy === "title" && (
                        <span className="ml-2 inline-flex">
                          {sortOrder === "desc" ? <ArrowDown className="h-4 w-4" /> : <ArrowUp className="h-4 w-4" />}
                        </span>
                      )}
                    </TableHead>
                    <TableHead className="relative">
                      Categoria
                      {sortBy === "type" && (
                        <span className="ml-2 inline-flex">
                          {sortOrder === "desc" ? <ArrowDown className="h-4 w-4" /> : <ArrowUp className="h-4 w-4" />}
                        </span>
                      )}
                    </TableHead>
                    <TableHead className="relative">
                      Status
                      {sortBy === "status" && (
                        <span className="ml-2 inline-flex">
                          {sortOrder === "desc" ? <ArrowDown className="h-4 w-4" /> : <ArrowUp className="h-4 w-4" />}
                        </span>
                      )}
                    </TableHead>
                    <TableHead>Autores</TableHead>
                    <TableHead className="relative">
                      Data/Hora Submissão
                      {sortBy === "date" && (
                        <span className="ml-2 inline-flex">
                          {sortOrder === "desc" ? <ArrowDown className="h-4 w-4" /> : <ArrowUp className="h-4 w-4" />}
                        </span>
                      )}
                    </TableHead>
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