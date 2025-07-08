"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "@/lib/auth-client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { BarChart as BarChartIcon, Download, FileText } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/use-toast"


export default function ReportsPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [loading, setLoading] = useState(true)
  const [reportData, setReportData] = useState<any>(null)

  useEffect(() => {
    if (session?.user) {
      fetchReports()
    }
  }, [session, router])

  const fetchReports = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/reports")
      
      if (!response.ok) {
        if (response.status === 403) {
          toast({
            title: "Acesso Negado",
            description: "Apenas professores e administradores podem acessar relatórios.",
            variant: "destructive",
          })
          router.push("/dashboard")
          return
        }
        
        const errorData = await response.json()
        throw new Error(errorData.error || "Erro ao carregar relatórios")
      }
      
      const data = await response.json()
      setReportData(data)
    } catch (error) {
      console.error("Failed to fetch reports:", error)
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Falha ao carregar dados do relatório.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const downloadCSV = () => {
    if (!reportData || !reportData.evaluationSummary) return
    
    // Create CSV content
    const headers = ["Título do Projeto", "Tipo", "Pontuação Média", "Total de Avaliações", ...reportData.criteria.map((c: any) => c.name)]
    const rows = reportData.evaluationSummary.map((summary: any) => {
      const criteriaScores = reportData.criteria.map((criterion: any) => {
        const criterionScore = summary.criteriaScores.find((cs: any) => cs.criteriaId === criterion.id)
        return criterionScore ? criterionScore.averageScore.toFixed(2) : "N/A"
      })
      
      return [
        summary.projectTitle,
        reportData.submissions.find((s: any) => s.id === summary.submissionId)?.project.type || "Desconhecido",
        summary.averageTotalScore.toFixed(2),
        summary.totalEvaluations,
        ...criteriaScores
      ]
    })
    
    // Convert to CSV string
    const csvContent = [
      headers.join(","),
      ...rows.map((row: any) => row.map((cell: any) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    ].join("\n")
    
    // Create and download file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `demoday-report-${new Date().toISOString().split("T")[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    toast({
      title: "Sucesso",
      description: "Relatório baixado com sucesso",
    })
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="mb-6 text-2xl font-bold">Relatórios de Avaliação</h1>
        <div className="space-y-6">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    )
  }

  if (!reportData?.demoday) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="mb-6 text-2xl font-bold">Relatórios de Avaliação</h1>
        <Card>
          <CardContent className="flex items-center justify-center p-6">
            <div className="text-center">
              <BarChartIcon className="mx-auto mb-2 h-8 w-8 text-gray-400" />
              <p className="text-lg font-medium">Nenhum dado de relatório disponível</p>
              <p className="text-sm text-gray-500 mb-4">
                {reportData?.message || "Nenhum Demoday ativo encontrado."}
              </p>
              <div className="space-y-2">
                <Button 
                  variant="default" 
                  onClick={() => router.push("/dashboard/admin/demoday")}
                >
                  <BarChartIcon className="mr-2 h-4 w-4" />
                  Gerenciar Demodays
                </Button>
                <br />
                <Button 
                  variant="outline" 
                  onClick={() => router.push("/dashboard/evaluations")}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Ir para Triagens
                </Button>
                <br />
                <Button 
                  variant="outline" 
                  onClick={() => router.push("/dashboard/admin/results")}
                >
                  <BarChartIcon className="mr-2 h-4 w-4" />
                  Ver Resultados Detalhados
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show message if there are projects but no evaluations
  if (reportData?.demoday && !reportData?.hasEvaluations) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="mb-6 text-2xl font-bold">Relatórios de Triagem</h1>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{reportData.demoday.name} - Relatórios</CardTitle>
            <CardDescription>
              {reportData.message}
            </CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-center p-6">
            <div className="text-center">
              <FileText className="mx-auto mb-2 h-8 w-8 text-yellow-400" />
              <p className="text-lg font-medium">Aguardando Triagens</p>
              <p className="text-sm text-gray-500 mb-4">
                Há {reportData.submissions?.length || 0} projetos submetidos, mas nenhuma triagem foi feita ainda.
              </p>
              <div className="space-y-2">
                                  <Button 
                    variant="default" 
                    onClick={() => router.push("/dashboard/evaluations")}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Fazer Triagens
                  </Button>
                <br />
                <Button 
                  variant="outline" 
                  onClick={() => router.push("/dashboard/admin/results")}
                >
                  <BarChartIcon className="mr-2 h-4 w-4" />
                  Ver Resultados Detalhados
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const sortedSummary = reportData.evaluationSummary
    ? [...reportData.evaluationSummary].sort((a, b) => b.averageTotalScore - a.averageTotalScore)
    : []

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Relatórios de Triagem</h1>
        <Button variant="outline" onClick={downloadCSV}>
          <Download className="mr-2 h-4 w-4" />
          Baixar CSV
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{reportData.demoday.name} - Relatórios</CardTitle>
          <CardDescription>
            {reportData.evaluationSummary.length} triagens de projetos | {reportData.criteria.length} critérios de triagem
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="summary" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="summary">Resumo</TabsTrigger>
          <TabsTrigger value="details">Detalhes dos Projetos</TabsTrigger>
        </TabsList>
        
        <TabsContent value="summary">
          <Card>
            <CardHeader>
              <CardTitle>Classificação Geral</CardTitle>
              <CardDescription>Projetos classificados por taxa média de aprovação</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Posição</TableHead>
                    <TableHead>Projeto</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Triagens</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedSummary.map((summary: any, index: number) => {
                    const project = reportData.submissions.find((s: any) => s.id === summary.submissionId)?.project
                    return (
                      <TableRow key={summary.submissionId}>
                        <TableCell className="font-medium">#{index + 1}</TableCell>
                        <TableCell>{project?.title || "Projeto Desconhecido"}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{project?.type || "Desconhecido"}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            className={(summary.averageTotalScore || 0) >= 50
                              ? "bg-green-100 text-green-800 hover:bg-green-200" 
                              : "bg-red-100 text-red-800 hover:bg-red-200"
                            }
                          >
                            {(summary.averageTotalScore || 0) >= 50 ? "Aprovado" : "Rejeitado"}
                          </Badge>
                        </TableCell>
                        <TableCell>{summary.totalEvaluations}</TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="details">
          <div className="grid gap-6">
            {sortedSummary.map((summary: any) => {
              const project = reportData.submissions.find((s: any) => s.id === summary.submissionId)?.project
              return (
                <Card key={summary.submissionId}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>{project?.title || "Projeto Desconhecido"}</CardTitle>
                      <Badge 
                        className={(summary.averageTotalScore || 0) >= 50
                          ? "bg-green-100 text-green-800 hover:bg-green-200" 
                          : "bg-red-100 text-red-800 hover:bg-red-200"
                        }
                      >
                        {(summary.averageTotalScore || 0) >= 50 ? "Aprovado" : "Rejeitado"}
                      </Badge>
                    </div>
                    <CardDescription className="flex items-center gap-4">
                      <span>{project?.type || "Tipo Desconhecido"}</span>
                      <span>•</span>
                      <span>{summary.totalEvaluations} triagens</span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <h3 className="mb-4 text-sm font-semibold">Status por Critério</h3>
                    <div className="space-y-3">
                      {summary.criteriaScores.map((criteriaScore: any) => {
                        const criterion = reportData.criteria.find((c: any) => c.id === criteriaScore.criteriaId)
                        return (
                          <div key={criteriaScore.criteriaId} className="grid grid-cols-[1fr_auto] gap-4">
                            <div>
                              <div className="text-sm font-medium">{criterion?.name || "Critério Desconhecido"}</div>
                              <div className="text-xs text-gray-500">{criterion?.description || ""}</div>
                            </div>
                            <Badge 
                              className={(criteriaScore.approvalPercentage || 0) >= 50
                                ? "bg-green-100 text-green-800 hover:bg-green-200" 
                                : "bg-red-100 text-red-800 hover:bg-red-200"
                              }
                            >
                              {(criteriaScore.approvalPercentage || 0) >= 50 ? "Aprovado" : "Rejeitado"}
                            </Badge>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
} 