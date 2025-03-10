"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useSession, signOut } from "next-auth/react"

export default function HomePage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (status !== "loading") {
      setIsLoading(false)
    }
  }, [status])

  const handleSignOut = async () => {
    await signOut({ redirect: false })
    router.push("/login")
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Carregando...</h1>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="mb-8 text-center">
        <h1 className="mb-4 text-4xl font-bold">Bem-vindo ao Demoday</h1>
        <p className="text-xl">
          Plataforma para submissão e votação de projetos acadêmicos
        </p>
      </div>

      <div className="flex flex-col gap-4 md:flex-row">
        {!session ? (
          <>
            <Link
              href="/login"
              className="rounded-md bg-blue-600 px-6 py-2 text-center text-white hover:bg-blue-700"
            >
              Entrar
            </Link>
            <Link
              href="/register"
              className="rounded-md border border-blue-600 px-6 py-2 text-center text-blue-600 hover:bg-blue-50"
            >
              Cadastrar
            </Link>
          </>
        ) : (
          <>
            <Link
              href="/dashboard"
              className="rounded-md bg-blue-600 px-6 py-2 text-center text-white hover:bg-blue-700"
            >
              Dashboard
            </Link>
            <button
              onClick={handleSignOut}
              className="rounded-md border border-red-600 px-6 py-2 text-center text-red-600 hover:bg-red-50"
            >
              Sair
            </button>
          </>
        )}
      </div>

      {session && (
        <div className="mt-4 text-center">
          <p>
            Logado como: <strong>{session.user?.name}</strong>{" "}
            {session.user?.role && `(${session.user.role})`}
          </p>
        </div>
      )}

      <div className="mt-16">
        <h2 className="mb-4 text-2xl font-bold">Sobre o Demoday</h2>
        <p className="max-w-2xl text-center">
          Demoday é um evento no qual estudantes de graduação e pós-graduação
          podem submeter os seus projetos desenvolvidos em Disciplina, Iniciação
          Científica, TCC, Mestrado ou Doutorado e participar de uma votação
          para o público escolher os mais interessantes.
        </p>
      </div>
    </div>
  )
}
