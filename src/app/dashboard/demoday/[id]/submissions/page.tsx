"use client"

import React, { use } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "@/lib/auth-client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useDemodayDetails } from "@/hooks/useDemoday"
import { useAllSubmissions, useUserSubmissions } from "@/hooks/useSubmitWork"
import { AlertCircle, ArrowLeft, ExternalLink, FileText } from "lucide-react"
import Link from "next/link"
import { formatDate } from "@/utils/date-utils"

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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
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
          <CardFooter className="flex justify-center">
            <Button onClick={() => router.push("/dashboard")}>
              Voltar para o Dashboard
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  // Determinar quais submissões mostrar com base no papel do usuário
  const submissions = isAdmin || isProfessor ? allSubmissions : userSubmissions

  // Renderizar a badge de status
  const renderStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string, className: string }> = {
      submitted: { label: "Submetido", className: "bg-gray-500" },
      approved: { label: "Aprovado", className: "bg-green-500" },
      rejected: { label: "Rejeitado", className: "bg-red-500" },
      finalist: { label: "Finalista", className: "bg-blue-500" },
      winner: { label: "Vencedor", className: "bg-yellow-500" },
    }
    
    const statusInfo = statusMap[status] || { label: "Desconhecido", className: "bg-gray-500" }
    
    return (
      <Badge className={statusInfo.className}>
        {statusInfo.label}
      </Badge>
    )
  }

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

      {submissions.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Sem submissões</CardTitle>
            <CardDescription>
              {isAdmin || isProfessor 
                ? "Não há trabalhos submetidos para este DemoDay ainda" 
                : "Você ainda não submeteu trabalhos para este DemoDay"}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center p-6">
            <FileText className="h-16 w-16 text-muted-foreground mb-4" />
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
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {submissions.map((submission: any) => (
            <Card key={submission.id}>
              <CardHeader>
                <CardTitle>{submission.project.title}</CardTitle>
                <div className="flex gap-2 flex-wrap mt-2">
                  <Badge variant="outline">{submission.project.type}</Badge>
                  {renderStatusBadge(submission.status)}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {submission.project.description}
                </p>
                {submission.project.authors && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Autores: {submission.project.authors}
                  </p>
                )}
                {submission.project.developmentYear && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Desenvolvido em: {submission.project.developmentYear}
                  </p>
                )}
              </CardContent>
              <CardFooter className="justify-between border-t p-4">
                <div className="text-xs text-muted-foreground">
                  Submetido em: {formatDate(submission.createdAt)}
                </div>
                <div className="flex gap-2">
                  {submission.project.videoUrl && (
                    <Link href={submission.project.videoUrl} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" variant="outline">
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Vídeo
                      </Button>
                    </Link>
                  )}
                  {submission.project.repositoryUrl && (
                    <Link href={submission.project.repositoryUrl} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" variant="outline">
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Repositório
                      </Button>
                    </Link>
                  )}
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
} 