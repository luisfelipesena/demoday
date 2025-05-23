"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useDemodays } from "@/hooks/useDemoday"
import { isInSubmissionPhase, formatDate } from "@/utils/date-utils"
import { CalendarIcon, ClockIcon, Loader } from "lucide-react"
import { useSession } from "@/lib/auth-client"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function DashboardPage() {
  const router = useRouter()
  const { data: session, isPending: sessionLoading } = useSession()
  const { data: demodays, isLoading } = useDemodays()
  
  useEffect(() => {
    if (!sessionLoading && !session) {
      router.push("/login")
    }
  }, [session, sessionLoading, router])

  if (sessionLoading || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader className="h-12 w-12 rounded-full animate-spin" />
        <p className="ml-4">Verificando autenticação...</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Skeleton className="h-16 w-16" />
        </div>
      </div>
    )
  }

  const activeDemoday = demodays?.find((demoday) => demoday.active)
  const pastDemodays = demodays?.filter((demoday) => !demoday.active && demoday.status === "finished") || []

  const submissionEnabled = activeDemoday && isInSubmissionPhase(activeDemoday)

  return (
    <div className="container mx-auto p-6">
      <h1 className="mb-6 text-3xl font-bold">Dashboard</h1>

      <div className="mb-12">
        <h2 className="mb-4 text-2xl font-semibold">DemoDay Ativo</h2>

        {activeDemoday ? (
          <Card className="bg-gradient-to-r from-blue-50 to-white border-blue-200">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-xl font-bold text-blue-800">{activeDemoday.name}</CardTitle>
                  <CardDescription className="flex items-center gap-2 text-blue-600 mt-1">
                    <CalendarIcon className="h-4 w-4" />
                    <span>Iniciado em {formatDate(activeDemoday.createdAt)}</span>
                  </CardDescription>
                </div>
                <Badge className="bg-green-500 hover:bg-green-600">Ativo</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                O DemoDay é um concurso onde você pode submeter seus trabalhos práticos já desenvolvidos 
                (ex: Iniciação Científica, TCC, projeto de disciplina) para avaliação.
              </p>
              
              {submissionEnabled ? (
                <div className="mt-4 rounded-md bg-green-50 p-3 border border-green-200">
                  <p className="text-green-700 font-medium">
                    Período de submissões aberto! Submeta seu trabalho para concorrer.
                  </p>
                </div>
              ) : (
                <div className="mt-4 rounded-md bg-amber-50 p-3 border border-amber-200">
                  <p className="text-amber-700 font-medium">
                    O período de submissões não está aberto no momento. Aguarde a fase de submissão.
                  </p>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              {submissionEnabled && (
                <Link href={`/dashboard/demoday/${activeDemoday.id}/submit`}>
                  <Button className="bg-blue-600 hover:bg-blue-700">Submeter Trabalho</Button>
                </Link>
              )}
              <Link href={`/dashboard/demoday/${activeDemoday.id}/submissions`}>
                <Button variant="outline">Ver Submissões</Button>
              </Link>
            </CardFooter>
          </Card>
        ) : (
          <div className="rounded-lg border p-8 text-center bg-gray-50">
            <p className="text-lg text-gray-600">Nenhum DemoDay ativo no momento.</p>
            {session?.user?.role === "admin" && (
              <div className="mt-4">
                <Link href="/dashboard/admin/demoday/new">
                  <Button className="bg-blue-600 hover:bg-blue-700">Criar Novo DemoDay</Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-4 text-2xl font-semibold">Histórico de DemoDays</h2>

        {pastDemodays.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pastDemodays.map((demoday) => (
              <Card key={demoday.id} className="bg-white">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg font-semibold">{demoday.name}</CardTitle>
                    <Badge className="bg-blue-500 hover:bg-blue-600">Finalizado</Badge>
                  </div>
                  <CardDescription className="flex items-center gap-2 text-gray-500 mt-1">
                    <ClockIcon className="h-4 w-4" />
                    <span>Finalizado em {formatDate(demoday.updatedAt)}</span>
                  </CardDescription>
                </CardHeader>
                <CardFooter className="flex justify-end">
                  <Link href={`/dashboard/demoday/${demoday.id}`}>
                    <Button variant="outline" size="sm">
                      Ver Detalhes
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border p-8 text-center bg-gray-50">
            <p className="text-lg text-gray-600">Nenhum DemoDay concluído no histórico.</p>
          </div>
        )}
      </div>
    </div>
  )
}
