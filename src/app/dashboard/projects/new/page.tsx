"use client"

import { useSession } from "next-auth/react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { FormEvent, useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { PROJECT_TYPES } from "@/types"

export default function NewProjectPage() {
  const router = useRouter()
  const { data: session, status } = useSession()

  // Estados para o formulário
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [type, setType] = useState("Disciplina") // Valor padrão
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Verificar autenticação
  if (status === "unauthenticated") {
    router.push("/login")
    return null
  }

  // Mostrar loading durante verificação da sessão
  if (status === "loading") {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <div className="mb-6 flex items-center justify-between">
          <Skeleton className="h-10 w-56" />
          <Skeleton className="h-9 w-24" />
        </div>

        <div className="rounded-lg border p-6 shadow-sm">
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="h-6 w-64 mb-8" />

          <div className="space-y-6">
            <div>
              <Skeleton className="h-5 w-36 mb-2" />
              <Skeleton className="h-10 w-full" />
            </div>

            <div>
              <Skeleton className="h-5 w-24 mb-2" />
              <Skeleton className="h-32 w-full" />
            </div>

            <div>
              <Skeleton className="h-5 w-32 mb-2" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>

          <div className="flex justify-end space-x-2 mt-8">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-32" />
          </div>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      // Validações básicas
      if (!title.trim()) {
        throw new Error("O título do projeto é obrigatório")
      }

      if (!description.trim()) {
        throw new Error("A descrição do projeto é obrigatória")
      }

      if (!type) {
        throw new Error("O tipo do projeto é obrigatório")
      }

      // Enviar dados para a API
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          description,
          type,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erro ao criar projeto")
      }

      // Redirecionar para a página de projetos após sucesso
      router.push("/dashboard/projects")
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message)
      } else {
        setError("Ocorreu um erro ao criar o projeto")
      }
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Criar novo projeto</h1>
        <Link href="/dashboard/projects" className="rounded-md bg-gray-200 px-4 py-2 text-gray-800 hover:bg-gray-300">
          Voltar
        </Link>
      </div>

      {error && <div className="mb-4 rounded-md bg-red-100 p-4 text-red-700">{error}</div>}

      <Card>
        <CardHeader>
          <CardTitle>Dados do Projeto</CardTitle>
          <CardDescription>Preencha as informações do seu projeto acadêmico</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium">
                Título do Projeto
              </label>
              <Input
                id="title"
                placeholder="Digite o título do projeto"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">
                Descrição
              </label>
              <textarea
                id="description"
                placeholder="Descreva seu projeto"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={loading}
                className="h-32 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="type" className="text-sm font-medium">
                Tipo de Projeto
              </label>
              <select
                id="type"
                value={type}
                onChange={(e) => setType(e.target.value)}
                disabled={loading}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {PROJECT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/dashboard/projects")}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Salvar Projeto"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
