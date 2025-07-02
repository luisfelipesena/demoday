"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useSession } from "@/lib/auth-client"
import { Calendar, Edit, ExternalLink, FileText } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

interface Submission {
  id: string
  projectId: string
  demoday_id: string
  status: string
  createdAt: string
  updatedAt: string
  project: {
    id: string
    title: string
    description: string
    type: string
    contactEmail: string
    contactPhone: string
    advisor: string
    videoUrl: string
    repositoryUrl?: string
    authors: string
    workCategory?: string
    developmentYear: string
  }
  demoday: {
    id: string
    name: string
    active: boolean
    status: string
  }
}

export default function MySubmissionsPage() {
  const { data: session, isPending } = useSession()
  const router = useRouter()
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchMySubmissions = async () => {
      try {
        const response = await fetch("/api/projects/submissions/my")
        if (!response.ok) {
          throw new Error("Erro ao carregar submissões")
        }
        const data = await response.json()
        setSubmissions(data)
      } catch (error: any) {
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }

    if (session) {
      fetchMySubmissions()
    }
  }, [session])

  // Verificar autenticação
  if (!isPending && !session) {
    router.push("/login")
    return null
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "submitted":
        return "bg-yellow-100 text-yellow-800"
      case "approved":
        return "bg-green-100 text-green-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      case "finalist":
        return "bg-blue-100 text-blue-800"
      case "winner":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "submitted":
        return "Submetido"
      case "approved":
        return "Aprovado"
      case "rejected":
        return "Rejeitado"
      case "finalist":
        return "Finalista"
      case "winner":
        return "Vencedor"
      default:
        return status
    }
  }

  const canEdit = (submission: Submission) => {
    // Pode editar apenas se estiver no status "submitted" e o demoday estiver ativo
    return submission.status === "submitted" && submission.demoday.active
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

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="space-y-4">
          <h1 className="text-3xl font-bold">Minhas Submissões</h1>
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardHeader>
            <CardTitle>Erro ao carregar submissões</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>Tentar novamente</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (submissions.length === 0) {
    return (
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-6">Minhas Submissões</h1>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma submissão encontrada</h3>
            <p className="text-gray-600 text-center mb-6">Você ainda não submeteu nenhum projeto para algum Demoday.</p>
            <Button onClick={() => router.push("/dashboard")}>Ir para Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Minhas Submissões</h1>
        <Button variant="outline" onClick={() => router.push("/dashboard")}>
          Voltar ao Dashboard
        </Button>
      </div>

      <div className="grid gap-6">
        {submissions.map((submission) => (
          <Card key={submission.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-xl mb-2">{submission.project.title}</CardTitle>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {submission.demoday.name}
                    </span>
                    <span>Tipo: {submission.project.type}</span>
                    {submission.project.workCategory && <span>Categoria: {submission.project.workCategory}</span>}
                  </div>
                </div>
                <Badge className={getStatusColor(submission.status)}>{getStatusText(submission.status)}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-gray-700 line-clamp-3">{submission.project.description}</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Autores:</span> {submission.project.authors}
                  </div>
                  <div>
                    <span className="font-medium">Orientador:</span> {submission.project.advisor}
                  </div>
                  <div>
                    <span className="font-medium">Contato:</span> {submission.project.contactEmail}
                  </div>
                  <div>
                    <span className="font-medium">Ano:</span> {submission.project.developmentYear}
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm">
                  <a
                    href={submission.project.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Ver Vídeo
                  </a>
                  {submission.project.repositoryUrl && (
                    <a
                      href={submission.project.repositoryUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Repositório
                    </a>
                  )}
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <span className="text-sm text-muted-foreground">
                    Submetido em: {formatDate(submission.createdAt)}
                  </span>
                  <div className="flex gap-2">
                    {canEdit(submission) && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          router.push(`/dashboard/demoday/${submission.demoday_id}/submissions/${submission.id}/edit`)
                        }
                        className="flex items-center gap-1"
                      >
                        <Edit className="h-4 w-4" />
                        Editar
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => router.push(`/dashboard/demoday/${submission.demoday_id}`)}
                    >
                      Ver Demoday
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
