"use client"

import { ProtectedClientPage } from "@/components/ProtectedClientPage"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/components/ui/use-toast"
import { useProtectedRoute } from "@/hooks/useProtectedRoute"
import { Check, ExternalLink, Eye, X } from "lucide-react"
import { useEffect, useState } from "react"

interface Project {
  id: string
  title: string
  description: string
  type: string
  authors: string
  advisor: string
  videoUrl: string
  repositoryUrl?: string
  workCategory?: string
  author: {
    name: string
    email: string
  }
}

interface Submission {
  id: string
  status: string
  createdAt: string
  project: Project
  demoday: {
    name: string
  }
}

export default function TriagemPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [selectedDemoday, setSelectedDemoday] = useState<string>("")
  const [demodays, setDemodays] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)
  const { toast } = useToast()

  const authStatus = useProtectedRoute()

  // Check if user is admin by making an API call
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)

  useEffect(() => {
    const checkAdminRole = async () => {
      try {
        const response = await fetch("/api/auth/check-admin")
        setIsAdmin(response.ok)
      } catch {
        setIsAdmin(false)
      }
    }

    if (authStatus === "authenticated") {
      checkAdminRole()
    }
  }, [authStatus])

  useEffect(() => {
    if (isAdmin) {
      fetchDemodays()
    }
  }, [isAdmin])

  useEffect(() => {
    if (selectedDemoday && isAdmin) {
      fetchSubmissions()
    }
  }, [selectedDemoday, isAdmin])

  const fetchDemodays = async () => {
    try {
      const response = await fetch("/api/demoday")
      if (response.ok) {
        const data = await response.json()
        setDemodays(data)
        const activeDemoday = data.find((d: any) => d.active)
        if (activeDemoday) {
          setSelectedDemoday(activeDemoday.id)
        }
      }
    } catch (error) {
      console.error("Error fetching demodays:", error)
    }
  }

  const fetchSubmissions = async () => {
    if (!selectedDemoday) return

    setLoading(true)
    try {
      const response = await fetch(`/api/demoday/${selectedDemoday}/submissions`)
      if (response.ok) {
        const data = await response.json()
        const pendingSubmissions = data.filter((sub: Submission) => sub.status === "submitted")
        setSubmissions(pendingSubmissions)
      }
    } catch (error) {
      console.error("Error fetching submissions:", error)
      toast({
        title: "Erro",
        description: "Falha ao carregar submissões",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const updateSubmissionStatus = async (submissionId: string, status: "approved" | "rejected") => {
    try {
      const response = await fetch(`/api/admin/project-submissions/${submissionId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      })

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: `Projeto ${status === "approved" ? "aprovado" : "rejeitado"} com sucesso`,
        })
        fetchSubmissions()
        setSelectedSubmission(null)
      } else {
        throw new Error("Failed to update status")
      }
    } catch (error) {
      console.error("Error updating submission status:", error)
      toast({
        title: "Erro",
        description: "Falha ao atualizar status do projeto",
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (status: string) => {
    const statusMap = {
      submitted: { label: "Submetido", variant: "secondary" as const },
      approved: { label: "Aprovado", variant: "default" as const },
      rejected: { label: "Rejeitado", variant: "destructive" as const },
      finalist: { label: "Finalista", variant: "default" as const },
      winner: { label: "Vencedor", variant: "default" as const },
    }

    const config = statusMap[status as keyof typeof statusMap] || { label: status, variant: "secondary" as const }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (authStatus === "loading" || isAdmin === null) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center">
        <p>Carregando...</p>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Acesso Negado</h1>
          <p>Apenas administradores podem acessar a página de triagem.</p>
        </div>
      </div>
    )
  }

  return (
    <ProtectedClientPage>
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Triagem de Projetos</h1>
          <p className="text-muted-foreground mt-2">Analise e aprove/rejeite projetos submetidos para o Demoday</p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
            <CardDescription>Selecione o Demoday para visualizar as submissões</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">Demoday</label>
                <Select value={selectedDemoday} onValueChange={setSelectedDemoday}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um Demoday" />
                  </SelectTrigger>
                  <SelectContent>
                    {demodays.map((demoday) => (
                      <SelectItem key={demoday.id} value={demoday.id}>
                        {demoday.name} {demoday.active && "(Ativo)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="text-center py-8">
            <p>Carregando submissões...</p>
          </div>
        ) : submissions.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p>Nenhuma submissão pendente encontrada para este Demoday.</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Submissões Pendentes ({submissions.length})</CardTitle>
              <CardDescription>
                Projetos aguardando triagem - verifique se são práticos, software/sistema e adequados para o Demoday
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Projeto</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Autor</TableHead>
                    <TableHead>Data Submissão</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissions.map((submission) => (
                    <TableRow key={submission.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{submission.project.title}</p>
                          <p className="text-sm text-muted-foreground line-clamp-2">{submission.project.description}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{submission.project.type}</Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{submission.project.author.name}</p>
                          <p className="text-sm text-muted-foreground">{submission.project.author.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(submission.createdAt)}</TableCell>
                      <TableCell>{getStatusBadge(submission.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => setSelectedSubmission(submission)}>
                            <Eye className="h-4 w-4 mr-1" />
                            Ver
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => updateSubmissionStatus(submission.id, "approved")}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Aprovar
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => updateSubmissionStatus(submission.id, "rejected")}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Rejeitar
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {selectedSubmission && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle>{selectedSubmission.project.title}</CardTitle>
                <CardDescription>Detalhes do projeto para triagem</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold">Tipo</h4>
                    <p>{selectedSubmission.project.type}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold">Categoria</h4>
                    <p>{selectedSubmission.project.workCategory || "Não informado"}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold">Orientador</h4>
                    <p>{selectedSubmission.project.advisor}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold">Autores</h4>
                    <p>{selectedSubmission.project.authors}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold">Descrição</h4>
                  <p className="text-sm">{selectedSubmission.project.description}</p>
                </div>

                <div className="flex gap-4">
                  {selectedSubmission.project.videoUrl && (
                    <Button variant="outline" asChild>
                      <a href={selectedSubmission.project.videoUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Ver Vídeo
                      </a>
                    </Button>
                  )}
                  {selectedSubmission.project.repositoryUrl && (
                    <Button variant="outline" asChild>
                      <a href={selectedSubmission.project.repositoryUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Ver Repositório
                      </a>
                    </Button>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button variant="outline" onClick={() => setSelectedSubmission(null)}>
                    Fechar
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => updateSubmissionStatus(selectedSubmission.id, "rejected")}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Rejeitar
                  </Button>
                  <Button variant="default" onClick={() => updateSubmissionStatus(selectedSubmission.id, "approved")}>
                    <Check className="h-4 w-4 mr-1" />
                    Aprovar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </ProtectedClientPage>
  )
}
