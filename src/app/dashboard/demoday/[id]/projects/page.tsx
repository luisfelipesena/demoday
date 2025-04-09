"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useDemodayDetails } from "@/hooks/useDemoday"
import { useDemodayProjects } from "@/hooks/useDemodayProjects"
import { FileText, ArrowLeft } from "lucide-react"
import { useSession } from "@/lib/auth-client"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { use } from "react"
import { formatDate } from "@/utils/date-utils"

interface DemodayProjectsProps {
  params: Promise<{ id: string }>
}

export default function DemodayProjectsPage({ params }: DemodayProjectsProps) {
  const resolvedParams = use(params)
  const router = useRouter()
  const { data: session, isPending } = useSession()
  const demodayId = resolvedParams.id
  
  const { data: demoday } = useDemodayDetails(demodayId)
  const { data: projects = [] } = useDemodayProjects(demodayId)
  
  // Redirecionar para login se não estiver autenticado
  if (!isPending && !session) {
    router.push("/login")
    return null
  }

  // Mostrar carregamento durante verificação da sessão
  if (isPending) {
    return (
      <div className="w-full space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-9 w-24" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-full mb-2" />
                <Skeleton className="h-4 w-16" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
              <CardFooter className="justify-between border-t p-4">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-8 w-24" />
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  // Título da página baseado no nome do demoday
  const pageTitle = demoday ? `Projetos - ${demoday.name}` : "Projetos do Demoday"

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{pageTitle}</h1>
          <p className="text-muted-foreground">
            {demoday?.active ? "Projetos participantes do Demoday atual" : "Projetos que participaram deste Demoday"}
          </p>
        </div>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
      </div>

      {projects.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Sem projetos</CardTitle>
            <CardDescription>Não há projetos participantes neste Demoday</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center p-6">
            <FileText className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="mb-4 text-center text-muted-foreground">
              Este Demoday ainda não possui projetos submetidos
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((submission: any) => (
            <Card key={submission.id}>
              <CardHeader>
                <CardTitle>{submission.project.title}</CardTitle>
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="outline">{submission.project.type}</Badge>
                  <Badge 
                    className={
                      submission.status === "approved" ? "bg-green-500" :
                      submission.status === "finalist" ? "bg-blue-500" :
                      submission.status === "winner" ? "bg-yellow-500" :
                      submission.status === "rejected" ? "bg-red-500" :
                      "bg-gray-500"
                    }
                  >
                    {submission.status === "submitted" ? "Submetido" : 
                     submission.status === "approved" ? "Aprovado" : 
                     submission.status === "finalist" ? "Finalista" : 
                     submission.status === "winner" ? "Vencedor" : 
                     submission.status === "rejected" ? "Rejeitado" : 
                     "Desconhecido"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {submission.project.description}
                </p>
                {submission.project.author && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Autor: {submission.project.author.name}
                  </p>
                )}
              </CardContent>
              <CardFooter className="justify-between border-t p-4">
                <div className="text-xs text-muted-foreground">
                  Submetido em: {formatDate(submission.createdAt)}
                </div>
                <Button asChild size="sm" variant="outline">
                  <Link href={`/dashboard/projects/${submission.projectId}`}>Ver projeto</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
} 