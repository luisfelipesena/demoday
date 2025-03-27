"use client"

import { useDemodays } from "@/hooks/useDemoday"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CalendarIcon, ClockIcon } from "lucide-react"

export default function DashboardPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const { data: demodays, isLoading, error } = useDemodays()

  if (status === "unauthenticated") {
    router.push("/login")
    return null
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Carregando...</h1>
        </div>
      </div>
    )
  }

  const activeDemoday = demodays?.find(demoday => demoday.active)
  const pastDemodays = demodays?.filter(demoday => !demoday.active && demoday.status === 'finished') || []

  // Função para formatar a data
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date)
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="mb-6 text-3xl font-bold">Dashboard</h1>
      
      <div className="mb-12">
        <h2 className="mb-4 text-2xl font-semibold">Demoday Ativo</h2>
        
        {activeDemoday ? (
          <Card className="bg-gradient-to-r from-blue-50 to-white border-blue-200">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-xl font-bold text-blue-800">{activeDemoday.name}</CardTitle>
                  <CardDescription className="text-blue-600 mt-1">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4" /> 
                      <span>Criado em {formatDate(activeDemoday.createdAt)}</span>
                    </div>
                  </CardDescription>
                </div>
                <Badge className="bg-green-500 hover:bg-green-600">Ativo</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Participe do Demoday ativo e submeta seus projetos para avaliação.</p>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Link href={`/dashboard/projects/new`}>
                <Button className="bg-blue-600 hover:bg-blue-700">Submeter Projeto</Button>
              </Link>
              <Link href={`/dashboard/projects`}>
                <Button variant="outline">Ver Projetos</Button>
              </Link>
            </CardFooter>
          </Card>
        ) : (
          <div className="rounded-lg border p-8 text-center bg-gray-50">
            <p className="text-lg text-gray-600">Nenhum Demoday ativo no momento.</p>
            {session?.user?.role === "admin" && (
              <div className="mt-4">
                <Link href="/dashboard/admin/demoday/new">
                  <Button className="bg-blue-600 hover:bg-blue-700">Criar Novo Demoday</Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
      
      <div>
        <h2 className="mb-4 text-2xl font-semibold">Histórico de Demodays</h2>
        
        {pastDemodays.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pastDemodays.map((demoday) => (
              <Card key={demoday.id} className="bg-white">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg font-semibold">{demoday.name}</CardTitle>
                    <Badge className="bg-blue-500 hover:bg-blue-600">Finalizado</Badge>
                  </div>
                  <CardDescription className="text-gray-500 mt-1">
                    <div className="flex items-center gap-2">
                      <ClockIcon className="h-4 w-4" /> 
                      <span>Finalizado em {formatDate(demoday.updatedAt)}</span>
                    </div>
                  </CardDescription>
                </CardHeader>
                <CardFooter className="flex justify-end">
                  <Link href={`/dashboard/demoday/${demoday.id}`}>
                    <Button variant="outline" size="sm">Ver Detalhes</Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border p-8 text-center bg-gray-50">
            <p className="text-lg text-gray-600">Nenhum Demoday concluído no histórico.</p>
          </div>
        )}
      </div>
    </div>
  )
}
